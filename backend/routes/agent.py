import asyncio
import hmac
import os
import time
import logging
from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
from ai.agent import run_multi_agent
from ai.knowledge.indexeur import indexer_site
from core.limiter import limiter

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
            "produits":             resultat.get("produits", []),
            "liens":                resultat.get("liens", []),
        }
    except Exception as e:
        logging.error(f"[ROUTER] Erreur critique : {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erreur interne de l'agent")


@router.post("/reindex")
@limiter.limit("5/minute")
async def reindex(request: Request, x_reindex_token: str = Header(default="")):
    """Réindexe le contenu du site pour la FAQ. Appelé par GitHub Actions après chaque déploiement Vercel et chaque nuit."""
    attendu = os.getenv("REINDEX_TOKEN", "")
    if not attendu or not hmac.compare_digest(x_reindex_token, attendu):
        raise HTTPException(status_code=401, detail="Non autorisé")
    stats = await asyncio.to_thread(indexer_site)
    logging.info(f"[REINDEX] {stats}")
    return stats
