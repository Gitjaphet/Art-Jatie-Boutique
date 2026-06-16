from fastapi import APIRouter, Depends, HTTPException, Form, Request
from sqlmodel import Session, select
import httpx
import os

from models.models import User
from database import get_session
from core.auth import verify_password, create_access_token
from core.limiter import limiter

router = APIRouter()

async def verify_recaptcha(token: str) -> bool:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={"secret": os.getenv("RECAPTCHA_SECRET_KEY"), "response": token},
        )
        result = res.json()
        return result.get("success") and result.get("score", 0) >= 0.5

@router.post("/login")
@limiter.limit("5/minute")
async def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    recaptcha_token: str = Form(...),
    session: Session = Depends(get_session)
):
    if not await verify_recaptcha(recaptcha_token):
        raise HTTPException(status_code=403, detail="Vérification de sécurité échouée.")
    
    user = session.exec(select(User).where(User.email == username)).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants incorrects.")
    
    token = create_access_token({"sub": user.email, "is_admin": user.is_admin})
    return {"access_token": token, "token_type": "bearer"}