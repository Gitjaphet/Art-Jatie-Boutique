import asyncio
import time
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from ai.agent import run_multi_agent

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    historique_commande: Optional[Dict[str, Any]] = None
    history: Optional[list] = None


@router.post("/chat")
async def chat(body: ChatRequest):
    t0 = time.time()
    logging.info(f"[ROUTER] Début requête : '{body.message}'")
    try:
        # run_multi_agent est synchrone (httpx bloquant, psycopg2 bloquant)
        # asyncio.to_thread() l'exécute dans un thread pool sans bloquer l'event loop
        resultat = await asyncio.to_thread(
            run_multi_agent,
            message=body.message,
            historique_commande=body.historique_commande,
            history=body.history or [],
        )
        logging.info(f"[ROUTER] Total : {time.time() - t0:.2f}s")
        return {
            "response":             resultat.get("response", "Erreur de génération."),
            "intent":               resultat.get("intent"),
            "historique_commande":  resultat.get("historique_commande"),
            "token_summary":        resultat.get("token_summary"),
        }
    except Exception as e:
        logging.error(f"[ROUTER] Erreur critique : {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erreur interne de l'agent")
