"""
routes/mvola.py
Intégration MVola Merchant Payment API (Sandbox)
"""

import os
import uuid
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from models.models import Order
from database import get_session

router = APIRouter()

# ── Configuration (variables d'environnement) ──────────────────────────────
MVOLA_CONSUMER_KEY    = os.getenv("MVOLA_CONSUMER_KEY", "")
MVOLA_CONSUMER_SECRET = os.getenv("MVOLA_CONSUMER_SECRET", "")
MVOLA_BASE_URL        = os.getenv("MVOLA_BASE_URL", "https://devapi.mvola.mg")
MVOLA_MERCHANT_NUMBER = os.getenv("MVOLA_MERCHANT_NUMBER", "0343500003")  # Numéro sandbox MVola
MVOLA_CALLBACK_URL    = os.getenv("MVOLA_CALLBACK_URL", "https://art-jatie-boutique.vercel.app/api/mvola/callback")


# ── Schémas ────────────────────────────────────────────────────────────────
class InitiatePaymentRequest(BaseModel):
    order_id: int
    customer_msisdn: str   # Numéro MVola du client (ex: "0343500004")
    amount: int            # Montant en Ariary
    description: str       # Ex: "Commande Art Jatie #42"


class MvolaCallbackPayload(BaseModel):
    """Payload reçu par MVola lors de la confirmation du paiement"""
    status: Optional[str] = None
    transactionReference: Optional[str] = None
    serverCorrelationId: Optional[str] = None
    objectReference: Optional[str] = None


# ── Helper : obtenir un access token OAuth2 ────────────────────────────────
async def get_mvola_token() -> str:
    """
    Génère un access token via Client Credentials OAuth2.
    Le token expire après 3600 secondes → en prod, on le cache en Redis.
    """
    url = f"{MVOLA_BASE_URL}/token"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    data = {
        "grant_type": "client_credentials",
        "scope": "EXT_INT_MVOLA_SCOPE",
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            headers=headers,
            data=data,
            auth=(MVOLA_CONSUMER_KEY, MVOLA_CONSUMER_SECRET),
            timeout=15.0,
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"MVola token error: {response.text}"
        )

    return response.json().get("access_token", "")


# ── POST /mvola/initiate ───────────────────────────────────────────────────
@router.post("/initiate")
async def initiate_payment(
    body: InitiatePaymentRequest,
    session: Session = Depends(get_session),
):
    """
    Initie une demande de paiement MVola.
    Le client reçoit une notification push sur son téléphone.
    """
    # 1. Vérifier que la commande existe
    order = session.get(Order, body.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable.")

    # 2. Obtenir le token OAuth2
    token = await get_mvola_token()

    # 3. Construire la requête MVola Merchant Pay
    correlation_id = str(uuid.uuid4())
    request_date   = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z")

    payload = {
        "amount":              str(body.amount),
        "currency":            "Ar",
        "descriptionText":     body.description[:50],   # Max 50 chars
        "requestingOrganisationTransactionReference": f"ArtJatie-{body.order_id}-{correlation_id[:8]}",
        "requestDate":         request_date,
        "debitParty":  [{"key": "msisdn", "value": body.customer_msisdn}],
        "creditParty": [{"key": "msisdn", "value": MVOLA_MERCHANT_NUMBER}],
        "metadata": [
            {"key": "partnerName",    "value": "Art Jatie Boutique"},
            {"key": "fc",             "value": "USD"},
            {"key": "amountFc",       "value": "1"},
        ],
        "originalTransactionReference": correlation_id,
    }

    headers = {
        "Authorization":  f"Bearer {token}",
        "Version":        "1.0",
        "X-CorrelationID": correlation_id,
        "UserLanguage":   "FR",
        "UserAccountIdentifier": f"msisdn;{MVOLA_MERCHANT_NUMBER}",
        "partnerName":    "Art Jatie Boutique",
        "Content-Type":   "application/json",
        "Cache-Control":  "no-cache",
        "callbackUrl":    MVOLA_CALLBACK_URL,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{MVOLA_BASE_URL}/mvola/mm/transactions/type/merchantpay",
            json=payload,
            headers=headers,
            timeout=30.0,
        )

    if response.status_code not in (200, 202):
        raise HTTPException(
            status_code=502,
            detail=f"MVola payment error: {response.text}"
        )

    result = response.json()
    server_correlation_id = result.get("serverCorrelationId", correlation_id)

    # 4. Mettre à jour la commande avec le correlation ID pour suivi
    order.mvola_correlation_id = server_correlation_id
    order.mvola_status = "PENDING"
    session.add(order)
    session.commit()

    return {
        "success": True,
        "serverCorrelationId": server_correlation_id,
        "status": result.get("status", "pending"),
        "message": "Demande de paiement envoyée. Le client doit confirmer sur son téléphone.",
    }


# ── POST /mvola/callback ───────────────────────────────────────────────────
@router.post("/callback")
async def mvola_callback(
    payload: MvolaCallbackPayload,
    session: Session = Depends(get_session),
):
    """
    Webhook appelé par MVola après confirmation du client.
    MVola envoie le résultat ici automatiquement.
    """
    if not payload.serverCorrelationId:
        return {"received": True}

    # Trouver la commande par correlation ID
    from sqlmodel import select
    orders = session.exec(
        select(Order).where(Order.mvola_correlation_id == payload.serverCorrelationId)
    ).all()

    for order in orders:
        if payload.status == "completed":
            order.status = "Payée"
            order.mvola_status = "COMPLETED"
            order.mvola_transaction_ref = payload.transactionReference
        elif payload.status == "failed":
            order.status = "Paiement échoué"
            order.mvola_status = "FAILED"
        session.add(order)

    session.commit()
    return {"received": True}


# ── GET /mvola/status/{correlation_id} ────────────────────────────────────
@router.get("/status/{correlation_id}")
async def get_payment_status(correlation_id: str):
    """
    Vérifie le statut d'une transaction MVola en cours.
    Utilisé par le frontend pour le polling.
    """
    token = await get_mvola_token()

    headers = {
        "Authorization":  f"Bearer {token}",
        "Version":        "1.0",
        "X-CorrelationID": str(uuid.uuid4()),
        "UserLanguage":   "FR",
        "UserAccountIdentifier": f"msisdn;{MVOLA_MERCHANT_NUMBER}",
        "partnerName":    "Art Jatie Boutique",
        "Cache-Control":  "no-cache",
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{MVOLA_BASE_URL}/mvola/mm/transactions/type/merchantpay/state/{correlation_id}",
            headers=headers,
            timeout=15.0,
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"MVola status error: {response.text}")

    return response.json()