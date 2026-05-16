from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import Optional
from datetime import datetime

from models.models import Settings
from database import get_session

router = APIRouter()

@router.get("/")
def get_settings(session: Session = Depends(get_session)):
    settings = session.exec(select(Settings)).first()
    if not settings:
        settings = Settings()
        session.add(settings)
        session.commit()
        session.refresh(settings)
    return settings

@router.patch("/")
def update_settings(
    new_rate: Optional[float] = None,
    new_colors: Optional[str] = None,
    new_sizes: Optional[str] = None,
    new_categories: Optional[str] = None, # <-- NOUVEAU
    new_genres: Optional[str] = None,
    session: Session = Depends(get_session)
):
    settings = session.exec(select(Settings)).first()
    if not settings:
        settings = Settings()
        session.add(settings)
        
    if new_rate is not None:
        settings.exchange_rate_eur = new_rate
    if new_colors is not None:
        settings.available_colors = new_colors
    if new_sizes is not None:
        settings.available_sizes = new_sizes
    if new_categories is not None:
        settings.available_categories = new_categories # <-- NOUVEAU

    if new_genres is not None:
        settings.available_genres = new_genres
        
    settings.updated_at = datetime.utcnow()
    session.add(settings)
    session.commit()
    session.refresh(settings)
    
    return settings