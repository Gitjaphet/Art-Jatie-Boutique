# routes/agent.py
# Route FastAPI pour l'agent commercial Jatie

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from agent.agent import chat
from agent.memory import get_conversation, get_client_by_whatsapp

router = APIRouter(prefix="/api/agent", tags=["Agent IA"])


# ── Schémas ────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    client_whatsapp: str        # Identifiant universel
    channel: str = "web"        # "web" | "facebook" | "whatsapp"


class ProductCard(BaseModel):
    id: int
    name: str
    price_ar: int
    image: str
    colors: str
    sizes: str
    stock: str
    category: str

class ChatResponse(BaseModel):
    response: str
    client_whatsapp: str
    is_known_client: bool
    products: list[ProductCard] = []


# ── Routes ─────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def agent_chat(request: ChatRequest):
    """
    Endpoint principal — reçoit un message et retourne la réponse de Jatie.
    Utilisé par le widget web ET le webhook Facebook.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message vide")

    try:
        result = chat(
            message=request.message,
            client_whatsapp=request.client_whatsapp,
            channel=request.channel,
        )

        profile = get_client_by_whatsapp(request.client_whatsapp)
        is_known = bool(profile)

        return ChatResponse(
            response=result["response"],
            client_whatsapp=request.client_whatsapp,
            is_known_client=is_known,
            products=result["products"],
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{client_whatsapp}")
async def get_history(client_whatsapp: str, channel: str = "web"):
    """
    Récupère l'historique de conversation d'un client.
    Utile pour le dashboard admin.
    """
    messages = get_conversation(client_whatsapp, channel)
    return {
        "client_whatsapp": client_whatsapp,
        "channel": channel,
        "total_messages": len(messages),
        "messages": messages,
    }


@router.get("/client/{client_whatsapp}")
async def get_client_profile(client_whatsapp: str):
    """
    Récupère le profil CRM d'un client.
    """
    profile = get_client_by_whatsapp(client_whatsapp)
    if not profile:
        return {"known": False}
    return {"known": True, "profile": profile}


@router.get("/health")
async def agent_health():
    """Vérifie que l'agent est opérationnel."""
    return {
        "status": "ok",
        "agent": "Jatie",
        "model": "llama-3.3-70b-versatile",
        "provider": "Groq (gratuit)",
    }


