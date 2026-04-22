from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import timedelta

from database import get_session
from models.models import User
from core.auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    # On cherche l'utilisateur par son email (form_data.username correspond à l'email ici)
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/setup-admin")
def setup_first_admin(session: Session = Depends(get_session)):
    """Route temporaire pour créer ton compte admin"""
    admin_exists = session.exec(select(User)).first()
    if admin_exists:
        return {"message": "Un administrateur existe déjà !"}
        
    # CRÉE TON COMPTE ICI (Change l'email et le mot de passe après)
    new_admin = User(
        email="contact@artjatie.mg",
        hashed_password=get_password_hash("AdminArtJatie2026!"),
        is_admin=True
    )
    session.add(new_admin)
    session.commit()
    
    return {"message": "Compte administrateur créé avec succès !"}