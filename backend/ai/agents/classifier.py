# ai/agents/classifier.py
import logging

from ai.core.llm import appeler_llm, ModeleIndisponible
from ai.core.prompts import CLASSIFIER

_VALID_INTENTS = ["recherche", "commande", "stats", "faq", "salutation"]


def llm1_classifier(token_log: list, message: str, history: list = None) -> dict:
    messages = [{"role": "system", "content": CLASSIFIER}]
    for msg in (history or [])[-4:]:
        role = msg.get("role", "")
        contenu = (msg.get("content") or "").strip()
        if role in ("user", "assistant") and contenu:
            messages.append({"role": role, "content": contenu[:300]})
    messages.append({"role": "user", "content": message})

    try:
        res = appeler_llm("classifier", messages, max_tokens=200, token_log=token_log)
    except ModeleIndisponible:
        return {"intent": "indisponible"}

    brut = res["contenu"].lower()
    for intent in _VALID_INTENTS:
        if intent in brut:
            return {"intent": intent}

    logging.warning(f"[CLASSIFIER] Réponse non reconnue : {brut[:80]!r} → recherche par défaut")
    return {"intent": "recherche"}
