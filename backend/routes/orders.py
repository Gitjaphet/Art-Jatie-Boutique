"""
routes/orders.py
Gestion des commandes — supporte panier complet + MVola + Orange Money + WhatsApp
"""

import json
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional, List
from supabase import create_client

from models.models import Order, Product
from database import get_session

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")  

router = APIRouter()


# ── Schémas ────────────────────────────────────────────────────────────────

class CartItemSchema(BaseModel):
    id: int
    name: str
    price: int
    quantity: int
    image: str
    category: Optional[str] = None


class CreateOrderRequest(BaseModel):
    # Infos client
    client_name: str
    client_email: str
    client_whatsapp: str
    client_message: Optional[str] = None

    # Panier
    cart_items: List[CartItemSchema]

    # Livraison
    delivery_zone: str
    delivery_cost: int
    delivery_label: str

    # Montants
    subtotal_ar: int
    discount_ar: int = 0
    total_ar: int

    # Paiement
    payment_method: str = "whatsapp"   # "mvola" | "orange_money" | "whatsapp"

    # Infos MVola
    mvola_account_name: Optional[str] = None
    mvola_phone: Optional[str] = None

    # Infos Orange Money
    om_account_name: Optional[str] = None
    om_phone: Optional[str] = None

    # Preuve de paiement
    payment_proof_text: Optional[str] = None
    payment_proof_image: Optional[str] = None

    # Rétrocompatibilité produit unique
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    product_price_ar: Optional[int] = None
    selected_size: Optional[str] = None
    selected_color: Optional[str] = None


# ── Routes ─────────────────────────────────────────────────────────────────

@router.get("/")
def get_orders(session: Session = Depends(get_session)):
    orders = session.exec(select(Order).order_by(Order.created_at.desc())).all()
    return orders


@router.post("/")
def create_order(body: CreateOrderRequest, session: Session = Depends(get_session)):
    # Validation MVola
    if body.payment_method == "mvola":
        if not body.mvola_phone:
            raise HTTPException(status_code=422, detail="Le numéro MVola est requis.")
        if not body.mvola_account_name:
            raise HTTPException(status_code=422, detail="Le nom du compte MVola est requis.")

    # Validation Orange Money
    if body.payment_method == "orange_money":
        if not body.om_phone:
            raise HTTPException(status_code=422, detail="Le numéro Orange Money est requis.")
        if not body.om_account_name:
            raise HTTPException(status_code=422, detail="Le nom du compte Orange Money est requis.")

    order = Order(
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
        # Rétrocompatibilité
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
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable.")

    old_status = order.status
    order.status = status
    session.add(order)

    # Si on valide la commande → déduire le stock pour chaque article du panier
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
                pass  # Ne pas bloquer si le JSON est malformé

    session.commit()
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
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        ext = file.filename.split(".")[-1] if file.filename else "jpg"
        filename = f"{uuid.uuid4()}.{ext}"
        content = await file.read()
        supabase.storage.from_("payment-proofs").upload(
            filename,
            content,
            {"content-type": file.content_type or "image/jpeg"}
        )
        url = supabase.storage.from_("payment-proofs").get_public_url(filename)
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload échoué: {str(e)}")