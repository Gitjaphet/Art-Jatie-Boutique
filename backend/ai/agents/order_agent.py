# ai/agents/order_agent.py
import os
import json
import time
import logging
import httpx
from ai.core.token_logger import log_llm_call
from ai.core.retry import llm_retry
from ai.core.prompts import ORDER_CONFIRM, ORDER_COLLECT

_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
_FALLBACK = "Désolé, notre système de commande rencontre une petite perturbation technique."


def llm4_commande(token_log: list, message: str, historique_commande: dict, commande_result: dict = None) -> str:
    t0 = time.time()
    if commande_result:
        prompt = ORDER_CONFIRM.format(
            commande_result=json.dumps(commande_result, ensure_ascii=False),
        )
    else:
        champs_manquants = [k for k, v in historique_commande.items() if not v]
        prompt = ORDER_COLLECT.format(
            historique=json.dumps(historique_commande, ensure_ascii=False),
            champs_manquants=champs_manquants,
        )
    headers = {
        "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
        "Content-Type": "application/json",
    }
    body = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 150,
        "temperature": 0.3,
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
        texte = data["choices"][0]["message"]["content"].strip()
        tokens_in = data.get("usage", {}).get("prompt_tokens", 0)
        tokens_out = data.get("usage", {}).get("completion_tokens", 0)
        log_llm_call(token_log, "groq/llama-3.3-70b", "collecteur_commande", tokens_in, tokens_out, latence, texte[:100])
        return texte
    except Exception as e:
        logging.error(f"[ORDER_AGENT] Échec après retries : {e}")
        return _FALLBACK
