# ai/agents/router.py
import json
import logging

from ai.core.llm import appeler_llm, ModeleIndisponible
from ai.core.prompts import ROUTER

_TOOLS = [
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
                        "enum": ["count", "count_by_category", "stock_total", "prix_moyen", "min_price", "max_price", "par_categorie", "par_genre"],
                    },
                    "filtre_categorie": {"type": "string"},
                    "filtre_genre":     {"type": "string"},
                },
                "required": ["operation"],
            },
        },
    },
]


def llm2_router(token_log: list, message: str, history: list = None) -> dict | None:
    messages = [{"role": "system", "content": ROUTER}]
    for msg in (history or [])[-4:]:
        role = msg.get("role", "")
        contenu = (msg.get("content") or "").strip()
        if role in ("user", "assistant") and contenu:
            messages.append({"role": role, "content": contenu[:500]})
    messages.append({"role": "user", "content": message})

    try:
        res = appeler_llm(
            "router", messages, max_tokens=300, token_log=token_log,
            tools=_TOOLS, tool_choice="required",
        )
        appel = res["tool_calls"][0]["function"]
        return {"tool_name": appel["name"], "tool_args": json.loads(appel["arguments"])}
    except (ModeleIndisponible, KeyError, IndexError, TypeError, ValueError) as e:
        logging.error(f"[ROUTER] Échec : {e}")
        return None
