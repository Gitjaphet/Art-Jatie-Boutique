"""Comprendre un message que le lecteur n'a pas compris : UN appel, réponses fermées tirées du catalogue.

Remplace le classifieur ET le routeur (deux appels) pour les messages incompris.
Protections : valeurs hors catalogue retirées ; budget gardé seulement s'il est écrit dans le message.
"""
import json
import logging
import re

from ai.core.llm import ModeleIndisponible, appeler_llm
from ai.core.prompts import COMPRENDRE
from ai.recherche.lecteur import TAILLES
from services.catalogue import FAMILLES, TYPES_ARTICLE

INTENTIONS = ["recherche", "stats", "faq", "salutation", "autre"]
OPERATIONS = ["count", "count_by_category", "stock_total", "prix_moyen", "min_price", "max_price",
              "par_categorie", "par_genre"]
CATEGORIES = ["TENUES", "ACCESSOIRES"]
HISTORIQUE = 2          # derniers messages envoyés (la fiche porte déjà le contexte)
COUPE_HISTORIQUE = 200  # caractères par message

_OUTIL = {
    "type": "function",
    "function": {
        "name": "comprendre",
        "description": "Intention de la cliente et critères de recherche, choisis dans les listes du catalogue",
        "parameters": {
            "type": "object",
            "properties": {
                "intention": {"type": "string", "enum": INTENTIONS},
                "types": {"type": "array", "items": {"type": "string", "enum": list(TYPES_ARTICLE)}},
                "couleurs": {"type": "array", "items": {"type": "string", "enum": list(FAMILLES)}},
                "tailles": {"type": "array", "items": {"type": "string", "enum": list(TAILLES)}},
                "budget_max": {"type": "integer", "description": "Seulement un montant écrit dans le message"},
                "moins_cher": {"type": "boolean"},
                "operation": {"type": "string", "enum": OPERATIONS},
                "categorie": {"type": "string", "enum": CATEGORIES},
            },
            "required": ["intention"],
        },
    },
}


def _dans(valeurs, permises) -> list:
    return [v for v in (valeurs or []) if v in permises]


def _budget_ecrit(budget, message: str) -> int | None:
    """Gardé seulement s'il figure dans le message : « 30000 », « 30 000 » ou « 30k »."""
    if not isinstance(budget, int) or budget < 1000:
        return None
    nombres = re.findall(r"\d+", message or "")
    tout_attache = re.sub(r"[\s.\u202f]", "", message or "")
    if str(budget) in tout_attache or (budget % 1000 == 0 and str(budget // 1000) in nombres):
        return budget
    return None


def nettoyer(brut: dict, message: str) -> dict:
    return {
        "intention": brut.get("intention") if brut.get("intention") in INTENTIONS else "autre",
        "types": _dans(brut.get("types"), TYPES_ARTICLE),
        "couleurs": _dans(brut.get("couleurs"), FAMILLES),
        "tailles": _dans(brut.get("tailles"), TAILLES),
        "budget_max": _budget_ecrit(brut.get("budget_max"), message),
        "moins_cher": bool(brut.get("moins_cher")),
        "operation": brut.get("operation") if brut.get("operation") in OPERATIONS else None,
        "categorie": brut.get("categorie") if brut.get("categorie") in CATEGORIES else None,
    }


def comprendre(token_log: list, message: str, history: list | None = None) -> dict | None:
    messages = [{"role": "system", "content": COMPRENDRE}]
    for m in (history or [])[-HISTORIQUE:]:
        contenu = (m.get("content") or "").strip()
        if m.get("role") in ("user", "assistant") and contenu:
            messages.append({"role": m["role"], "content": contenu[:COUPE_HISTORIQUE]})
    messages.append({"role": "user", "content": message})
    try:
        res = appeler_llm("comprendre", messages, max_tokens=300, token_log=token_log,
                          tools=[_OUTIL], tool_choice="required")
        brut = json.loads(res["tool_calls"][0]["function"]["arguments"])
    except (ModeleIndisponible, KeyError, IndexError, TypeError, ValueError) as e:
        logging.error(f"[COMPRENDRE] Échec : {e}")
        return None
    return nettoyer(brut, message)
