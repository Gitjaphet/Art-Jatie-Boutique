# ai/agents/router.py
import os
import time
import json
import logging
import httpx
from ai.core.token_logger import log_llm_call
from ai.core.retry import llm_retry
from ai.core.prompts import ROUTER

_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

def llm2_router(token_log: list, message: str, history: list = None) -> dict | None:
    t0 = time.time()
    headers = {
        "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
        "Content-Type": "application/json",
    }
    tools = [
        {
            "type": "function",
            "function": {
                "name": "rechercher_produit",
                "description": "Recherche produits par filtres ou requête sémantique",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "requete_libre": {"type": "string", "description": "Phrase naturelle pour recherche sémantique"},
                        "produit":       {"type": "string"},
                        "couleur":       {"type": "string"},
                        "categorie":     {"type": "string"},
                        "genre":         {"type": "string"},
                        "prix_min":      {"type": "integer"},
                        "prix_max":      {"type": "integer"},
                        "sort":          {"type": "string", "enum": ["price_asc", "price_desc", "name_asc", ""]},
                        "limit":         {"type": "integer"},
                    },
                    "required": [],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "statistiques",
                "description": "Statistiques sur le catalogue",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "operation": {
                            "type": "string",
                            "enum": ["count", "stock_total", "valeur_stock", "prix_moyen", "min_price", "max_price", "stock_faible", "rupture", "par_categorie", "par_genre"],
                        },
                        "filtre_categorie": {"type": "string"},
                        "filtre_genre":     {"type": "string"},
                    },
                    "required": ["operation"],
                },
            },
        },
    ]
    messages_payload = [
         {"role": "system", "content": ROUTER}
    ]
    if history:
        for msg in history[-4:]:
            messages_payload.append({"role": msg["role"], "content": msg["content"]})
    messages_payload.append({"role": "user", "content": message})
    body = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages_payload,
        "tools": tools,
        "tool_choice": "required",
        "max_tokens": 200,
        "temperature": 0,
    }

    @llm_retry
    def _call() -> httpx.Response:
        r = httpx.post(_GROQ_URL, headers=headers, json=body, timeout=30)
        r.raise_for_status()
        return r

    try:
        response = _call()
        data = response.json()
        latence = (time.time() - t0) * 1000
        tokens_in = data["usage"]["prompt_tokens"]
        tokens_out = data["usage"]["completion_tokens"]
        tool_call = data["choices"][0]["message"]["tool_calls"][0]
        tool_name = tool_call["function"]["name"]
        tool_args = json.loads(tool_call["function"]["arguments"])
        log_llm_call(token_log, "groq/llama-3.3-70b", "router", tokens_in, tokens_out, latence, f"{tool_name}({tool_args})")
        return {"tool_name": tool_name, "tool_args": tool_args}
    except Exception as e:
        logging.error(f"[ROUTER] Échec après retries : {e}")
        return None
