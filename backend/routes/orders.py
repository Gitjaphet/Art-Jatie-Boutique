"""
routes/orders.py
Gestion des commandes — supporte panier complet + MVola + Orange Money + WhatsApp
+ synchronisation Planning (planning_status)
"""

import json
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional, List
import boto3
from botocore.config import Config

from models.models import Order, Product, Client
from database import get_session



router = APIRouter()


# ── Schémas ────────────────────────────────────────────────────────────────

class CartItemSchema(BaseModel):
    id: int
    name: str
    price: int
    quantity: int
    image: str
    category: Optional[str] = None
    discount: Optional[int] = 0


class CreateOrderRequest(BaseModel):
    client_name: str
    client_email: str
    client_whatsapp: str
    client_message: Optional[str] = None

    cart_items: List[CartItemSchema]

    delivery_zone: str
    delivery_cost: int
    delivery_label: str

    subtotal_ar: int
    discount_ar: int = 0
    total_ar: int

    payment_method: str = "whatsapp"

    mvola_account_name: Optional[str] = None
    mvola_phone: Optional[str] = None

    om_account_name: Optional[str] = None
    om_phone: Optional[str] = None

    payment_proof_text: Optional[str] = None
    payment_proof_image: Optional[str] = None

    product_id: Optional[int] = None
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    product_price_ar: Optional[int] = None
    selected_size: Optional[str] = None
    selected_color: Optional[str] = None


class PosOrderRequest(BaseModel):
    client_name: str
    client_whatsapp: str
    note: Optional[str] = None
    cart_items: List[CartItemSchema]
    total_ar: int
    payment_method: str
    amount_tendered: int
    change: int


class PlanningStatusUpdate(BaseModel):
    planning_status: Optional[str] = None
    planning_note: Optional[str] = None
    acompte: Optional[int] = None      
    progress: Optional[int] = None     


# ── Mapping synchronisation ────────────────────────────────────────────────
# Quand le planning_status change, le status général de la commande suit
PLANNING_TO_STATUS: dict[str, str] = {
    "a_fabriquer": "Confirmée",
    "en_cours": "En cours",
    "pret_a_livrer": "En cours",
    "livree": "Livrée",
}

# Quand le status général change, le planning_status suit
STATUS_TO_PLANNING: dict[str, Optional[str]] = {
    "En attente": None,
    "Confirmée": "a_fabriquer",
    "En cours": "en_cours",
    "Livrée": "livree",
    "Annulée": None,
}


# ── Routes ─────────────────────────────────────────────────────────────────

@router.get("/")
def get_orders(session: Session = Depends(get_session)):
    orders = session.exec(select(Order).order_by(Order.created_at.desc())).all()
    return orders


@router.get("/planning")
def get_planning_orders(session: Session = Depends(get_session)):
    """
    Retourne toutes les commandes qui sont dans le planning
    (planning_status non null — c'est-à-dire confirmées ou plus).
    """
    orders = session.exec(
        select(Order)
        .where(Order.planning_status != None)  # noqa: E711
        .order_by(Order.created_at.desc())
    ).all()
    return orders


@router.post("/")
def create_order(body: CreateOrderRequest, session: Session = Depends(get_session)):
    if body.payment_method == "mvola":
        if not body.mvola_phone:
            raise HTTPException(status_code=422, detail="Le numéro MVola est requis.")
        if not body.mvola_account_name:
            raise HTTPException(status_code=422, detail="Le nom du compte MVola est requis.")

    if body.payment_method == "orange_money":
        if not body.om_phone:
            raise HTTPException(status_code=422, detail="Le numéro Orange Money est requis.")
        if not body.om_account_name:
            raise HTTPException(status_code=422, detail="Le nom du compte Orange Money est requis.")


    

    order = Order(
        client_id=None,
        client_name=body.client_name,
        client_email=body.client_email,
        client_whatsapp=body.client_whatsapp,
        client_message=body.client_message,
        cart_items_json=json.dumps([item.model_dump() for item in body.cart_items]),
        delivery_zone=body.delivery_zone,
        delivery_cost=body.delivery_cost,
        delivery_label=body.delivery_label,
        subtotal_ar=body.subtotal_ar,
        discount_ar=body.discount_ar,
        total_ar=body.total_ar,
        payment_method=body.payment_method,
        mvola_account_name=body.mvola_account_name,
        mvola_phone=body.mvola_phone,
        om_account_name=body.om_account_name,
        om_phone=body.om_phone,
        payment_proof_text=body.payment_proof_text,
        payment_proof_image=body.payment_proof_image,
        product_id=body.product_id,
        product_name=body.product_name,
        product_image=body.product_image,
        product_price_ar=body.product_price_ar,
        selected_size=body.selected_size,
        selected_color=body.selected_color,
    )

    session.add(order)
    session.commit()
    session.refresh(order)
    return order


@router.get("/{order_id}")
def get_order(order_id: int, session: Session = Depends(get_session)):
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable.")
    return order


@router.patch("/{order_id}/status")
def update_status(order_id: int, status: str, session: Session = Depends(get_session)):
    """
    Met à jour le status général de la commande.
    Si le nouveau status a un équivalent planning, planning_status est aussi mis à jour.
    """
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable.")

    old_status = order.status
    order.status = status

    # Synchronisation Planning ← Orders
    if status in STATUS_TO_PLANNING:
        order.planning_status = STATUS_TO_PLANNING[status]

    session.add(order)

    # Si on valide la commande → déduire le stock
    if status == "Confirmée" and old_status != "Confirmée":
        if order.cart_items_json:
            try:
                items = json.loads(order.cart_items_json)
                for item in items:
                    product = session.get(Product, item.get("id"))
                    if product and product.stock_quantity > 0:
                        product.stock_quantity = max(0, product.stock_quantity - item.get("quantity", 1))
                        session.add(product)
            except Exception:
                pass

        # 2. 👥 LOGIQUE CRM (Création ou mise à jour du client)
        client = session.exec(select(Client).where(Client.whatsapp == order.client_whatsapp)).first()
        
        if not client:
            # Création du client s'il n'existe pas encore
            client = Client(
                name=order.client_name,
                email=order.client_email,
                whatsapp=order.client_whatsapp,
                total_spent=order.total_ar or 0,
                total_orders=1
            )
            session.add(client)
            session.flush() # Pour générer l'ID du client immédiatement
        else:
            # Si le client existe déjà, on ajoute cette nouvelle commande à ses stats
            client.total_spent += (order.total_ar or 0)
            client.total_orders += 1
            if order.client_name:
                client.name = order.client_name
            if order.client_email:
                client.email = order.client_email
            session.add(client)

        # On lie enfin la commande validée à la fiche du client !
        order.client_id = client.id

    session.commit()
    session.refresh(order)
    return order


@router.patch("/{order_id}/planning-status")
def update_planning_status(
    order_id: int,
    body: PlanningStatusUpdate,
    session: Session = Depends(get_session),
):
    """
    Met à jour le planning_status depuis le Planning.
    Synchronise aussi le status général de la commande.
    """
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable.")

    order.planning_status = body.planning_status

    if body.planning_note is not None:
        order.planning_note = body.planning_note

    if body.acompte is not None:          # ← NOUVEAU
        order.acompte = body.acompte

    if body.progress is not None:         # ← NOUVEAU
        order.progress = body.progress

    # Synchronisation Orders ← Planning
    if body.planning_status in PLANNING_TO_STATUS:
        order.status = PLANNING_TO_STATUS[body.planning_status]
    elif body.planning_status is None:
        # Retrait du planning → repasse en attente
        order.status = "En attente"

    session.add(order)
    session.commit()
    session.refresh(order)
    return order


@router.delete("/{order_id}")
def delete_order(order_id: int, session: Session = Depends(get_session)):
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable.")
    session.delete(order)
    session.commit()
    return {"message": "Commande supprimée."}


@router.post("/upload-proof")
async def upload_proof(file: UploadFile = File(...)):
    try:
        s3 = boto3.client(
            "s3",
            endpoint_url=os.getenv("CLOUDFLARE_R2_ENDPOINT"),
            aws_access_key_id=os.getenv("CLOUDFLARE_R2_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("CLOUDFLARE_R2_SECRET_KEY"),
            config=Config(signature_version="s3v4"),
        )
        ext = file.filename.split(".")[-1] if file.filename else "jpg"
        filename = f"payment-proofs/{uuid.uuid4()}.{ext}"
        content = await file.read()
        bucket = os.getenv("CLOUDFLARE_R2_BUCKET")
        s3.put_object(
            Bucket=bucket,
            Key=filename,
            Body=content,
            ContentType=file.content_type or "image/jpeg",
        )
        url = f"{os.getenv('CLOUDFLARE_R2_PUBLIC_URL')}/{filename}"
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload échoué: {str(e)}")


@router.post("/migrate-clients")
def migrate_existing_clients(session: Session = Depends(get_session)):
    """
    Route temporaire pour transformer les anciennes commandes en fiches Clients CRM.
    """
    # 1. On récupère toutes les commandes qui ne sont pas encore liées à un client
    # (Si vous venez de créer la colonne, elles ont toutes client_id = None)
    orders = session.exec(select(Order).where(Order.client_id == None)).all()
    
    clients_crees = 0
    commandes_mises_a_jour = 0
    
    for order in orders:
        if not order.client_whatsapp:
            continue  # On ignore les commandes sans numéro (s'il y en a)
            
        # 2. Chercher si on a déjà créé ce client pendant la boucle
        client = session.exec(select(Client).where(Client.whatsapp == order.client_whatsapp)).first()
        
        if not client:
            # 3. Création du nouveau client
            client = Client(
                name=order.client_name,
                email=order.client_email,
                whatsapp=order.client_whatsapp,
                total_spent=0,
                total_orders=0
            )
            session.add(client)
            session.commit()
            session.refresh(client)
            clients_crees += 1
            
        # 4. Mise à jour des statistiques du client
        client.total_spent += (order.total_ar or 0)
        client.total_orders += 1
        session.add(client)
        
        # 5. On lie l'ancienne commande au client
        order.client_id = client.id
        session.add(order)
        commandes_mises_a_jour += 1
        
        session.commit() # On sauvegarde les modifications
        
    return {
        "message": "Migration CRM terminée avec succès !",
        "clients_crees": clients_crees,
        "commandes_mises_a_jour": commandes_mises_a_jour
    }



@router.post("/pos")
def create_pos_order(body: PosOrderRequest, session: Session = Depends(get_session)):
    """
    Route dédiée au Point de Vente (POS).
    Valide la commande, déduit le stock, gère la monnaie et met à jour le CRM.
    """
    # 1. 👥 GESTION DU CRM (Client)
    client = session.exec(select(Client).where(Client.whatsapp == body.client_whatsapp)).first()
    
    if not client:
        # Création du nouveau client
        client = Client(
            name=body.client_name,
            whatsapp=body.client_whatsapp,
            total_spent=0,
            total_orders=0
        )
        session.add(client)
        session.flush() # Pour générer l'ID du client immédiatement
        
    # Mise à jour des stats du client
    client.total_spent += body.total_ar
    client.total_orders += 1
    # On met à jour le nom si on a plus d'infos qu'avant
    if body.client_name and client.name == "Client de passage":
        client.name = body.client_name
        
    session.add(client)

    # 2. 📦 DÉDUCTION DU STOCK
    items = [item.model_dump() for item in body.cart_items]
    for item in items:
        product = session.get(Product, item.get("id"))
        if product and product.stock_quantity is not None:
            # On déduit la quantité achetée
            product.stock_quantity = max(0, product.stock_quantity - item.get("quantity", 1))
            session.add(product)

    # 3. 🧾 CRÉATION DE LA COMMANDE POS
    order = Order(
        client_id=client.id,
        client_name=body.client_name,
        client_whatsapp=body.client_whatsapp,
        client_message=body.note,
        client_email="",
        cart_items_json=json.dumps(items),
        delivery_zone="Boutique (POS)",
        delivery_cost=0,
        delivery_label="Sur place",
        subtotal_ar=body.total_ar,
        total_ar=body.total_ar,
        payment_method=body.payment_method,
        status="Livrée", # Une vente en caisse est terminée immédiatement
        
        # Les nouveaux champs financiers !
        is_pos=True,
        amount_tendered=body.amount_tendered,
        change_ar=body.change
    )
    
    session.add(order)
    session.commit()
    session.refresh(order)
    
    return order