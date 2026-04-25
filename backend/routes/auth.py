from fastapi import APIRouter, Depends, HTTPException, Form
from sqlmodel import Session, select

from models.models import User
from database import get_session
from core.auth import verify_password, create_access_token

router = APIRouter()

@router.post("/login")
def login(
    username: str = Form(...),  # ✅ Form car le frontend envoie URLSearchParams
    password: str = Form(...),
    session: Session = Depends(get_session)
):
    user = session.exec(select(User).where(User.email == username)).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants incorrects.")
    
    token = create_access_token({"sub": user.email, "is_admin": user.is_admin})
    return {"access_token": token, "token_type": "bearer"}