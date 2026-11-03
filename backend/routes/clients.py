from fastapi import APIRouter, Depends, HTTPException
from core.auth import get_current_admin
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional
from models.models import Client
from database import get_session

router = APIRouter()

# Routes réservées au tableau de bord (jeton admin obligatoire)
ADMIN = [Depends(get_current_admin)]

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    whatsapp: Optional[str] = None
    favorite_categories: Optional[str] = None
    favorite_colors: Optional[str] = None

@router.get("/", dependencies=ADMIN)
def get_clients(session: Session = Depends(get_session)):
    clients = session.exec(select(Client).order_by(Client.total_spent.desc())).all()
    return clients

@router.patch("/{client_id}", dependencies=ADMIN)
def update_client(client_id: int, body: ClientUpdate, session: Session = Depends(get_session)):
    client = session.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")
        
    if body.name is not None: client.name = body.name
    if body.email is not None: client.email = body.email
    if body.whatsapp is not None: client.whatsapp = body.whatsapp
    if body.favorite_categories is not None: client.favorite_categories = body.favorite_categories
    if body.favorite_colors is not None: client.favorite_colors = body.favorite_colors
        
    session.add(client)
    session.commit()
    session.refresh(client)
    return client

@router.delete("/{client_id}", dependencies=ADMIN)
def delete_client(client_id: int, session: Session = Depends(get_session)):
    client = session.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")
    session.delete(client)
    session.commit()
    return {"message": "Client supprimé avec succès"}