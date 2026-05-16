from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel  # <-- NOUVEAU: Import de BaseModel
from database import get_session
from models.models import Color
from sqlalchemy.exc import IntegrityError
import logging

# Configuration des logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

COLOR_DEFAULTS = {
    "rouge": "#E53935",
    "bleu": "#4A90D9",
    "vert": "#4CAF50",
    "noir": "#1a1a1a",
    "blanc": "#F5F5F5",
    "rose": "#E86B8C",
    "beige": "#D4B896",
    "marron": "#795548",
    "jaune": "#FACC15",
    "orange": "#F97316",
    "gris": "#9E9E9E",
    "kaki": "#4B5320",
    "multicolore": "linear-gradient(135deg, #f43f5e, #3b82f6, #22c55e)"
}

# <-- NOUVEAU: On crée un schéma pour lire le JSON envoyé par React
class ColorCreate(BaseModel):
    name: str
    hex_code: Optional[str] = None


@router.get("/", response_model=List[Color])
def get_all_colors(session: Session = Depends(get_session)):
    """Récupère toutes les couleurs de la base (pour le menu déroulant)"""
    return session.exec(select(Color)).all()


@router.post("/", response_model=Color)
def create_or_get_color(color_data: ColorCreate, session: Session = Depends(get_session)):
    # <-- MODIFIÉ: On utilise color_data.name au lieu de name tout court
    name_clean = color_data.name.strip()
    
    try:
        # 1. On cherche d'abord
        existing_color = session.exec(select(Color).where(Color.name == name_clean)).first()
        if existing_color:
            return existing_color

        # 2. Si on crée, on sécurise
        final_hex = color_data.hex_code if color_data.hex_code else COLOR_DEFAULTS.get(name_clean.lower(), "#CCCCCC")
        new_color = Color(name=name_clean, hex_code=final_hex)
        
        session.add(new_color)
        session.commit()
        session.refresh(new_color)
        return new_color

    except IntegrityError as e:
        # Erreur si la couleur a été créée par quelqu'un d'autre au même millième de seconde
        session.rollback()
        logger.warning(f"Conflit d'unicité pour {name_clean}: {e}")
        # On tente de la récupérer une dernière fois au cas où
        return session.exec(select(Color).where(Color.name == name_clean)).first()
        
    except Exception as e:
        # Erreur inconnue
        session.rollback()
        logger.error(f"Erreur critique lors de la création de couleur: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la création de la couleur")


@router.delete("/{color_id}")
def delete_color(color_id: int, session: Session = Depends(get_session)):
    """Supprime une couleur de la base (Recherche avancée / Nettoyage)"""
    color = session.get(Color, color_id)
    if not color:
        raise HTTPException(status_code=404, detail="Couleur introuvable")
    
    session.delete(color)
    session.commit()
    return {"message": f"Couleur {color.name} supprimée"}