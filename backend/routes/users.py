from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr
from models.models import User
from database import get_session
from core.auth import get_password_hash


router = APIRouter()

class CreateUserRequest(BaseModel):
    email: str
    password: str
    is_admin: bool = True

@router.get("/")
def get_users(session: Session = Depends(get_session)):
    users = session.exec(select(User)).all()
    return [{"id": u.id, "email": u.email, "is_admin": u.is_admin} for u in users]

@router.post("/")
def create_user(body: CreateUserRequest, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == body.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")
    
    new_user = User(
        email=body.email,
        hashed_password=get_password_hash(body.password),
        is_admin=body.is_admin,
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return {"id": new_user.id, "email": new_user.email, "is_admin": new_user.is_admin}

@router.delete("/{user_id}")
def delete_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    session.delete(user)
    session.commit()
    return {"message": "Utilisateur supprimé."}