"""
routes/orders.py
Gestion des commandes — supporte panier complet + paiement MVola
"""

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional, List

from models.models import Order
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
    payment_method: str = "whatsapp"   # "mvola" | "whatsapp"
    mvola_phone: Optional[str] = None  # Requis si payment_method == "mvola"

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
    if body.payment_method == "mvola" and not body.mvola_phone:
        raise HTTPException(status_code=422, detail="Le numéro MVola est requis pour ce mode de paiement.")

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
        mvola_phone=body.mvola_phone,
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
    order.status = status
    session.add(order)
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