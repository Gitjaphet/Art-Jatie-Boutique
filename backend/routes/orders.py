from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional
from models.models import Order
from database import get_session

router = APIRouter()

class CreateOrderRequest(BaseModel):
    client_name: str
    client_email: str
    client_whatsapp: str
    client_message: Optional[str] = None
    product_id: int
    product_name: str
    product_image: str
    product_price_ar: int
    selected_size: str
    selected_color: str

@router.get("/")
def get_orders(session: Session = Depends(get_session)):
    orders = session.exec(select(Order).order_by(Order.created_at.desc())).all()
    return orders

@router.post("/")
def create_order(body: CreateOrderRequest, session: Session = Depends(get_session)):
    order = Order(**body.model_dump())
    session.add(order)
    session.commit()
    session.refresh(order)
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