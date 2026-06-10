# ai/agents/faq.py
import os
import time
import logging
import httpx
from ai.core.token_logger import log_llm_call
from ai.core.retry import llm_retry

_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
_FALLBACK = "Pour toute question, n'hésitez pas à nous contacter directement sur WhatsApp au 034 30 513 60 ! 💕"

FAQ_CONTEXT = """
Art-Jatie Boutique — Crochet artisanal malgache — Atelier : Seganinga, Nosy Be
LIVRAISON :
- Jabala : Gratuite — demi-journée
- Darsalam : 5 000 Ar — demi-journée
- Dzamanjar : 7 000 Ar — demi-journée
- Autres zones / international : Sur devis → WhatsApp 034 30 513 60
RETOURS : sous 2 jours, article non porté → WhatsApp 034 30 513 60
PAIEMENT : MVola, Orange Money, WhatsApp. Sur mesure: acompte 50%.
"""


def llm5_faq(token_log: list, message: str) -> str:
    t0 = time.time()
    headers = {
        "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://artjatie.com",
    }
    body = {
        "model": "deepseek/deepseek-r1:free",
        "messages": [
            {
                "role": "system",
                "content": f"Tu es Jatie, assistante Art-Jatie. Réponds uniquement avec les infos ci-dessous. Ton chaleureux, français, 2-3 phrases max.\n\n{FAQ_CONTEXT}",
            },
            {"role": "user", "content": message},
        ],
        "max_tokens": 200,
        "temperature": 0.2,
    }

    @llm_retry
    def _call() -> httpx.Response:
        r = httpx.post(_OPENROUTER_URL, headers=headers, json=body, timeout=30)
        r.raise_for_status()
        return r

    try:
        response = _call()
        data = response.json()
        latence = (time.time() - t0) * 1000
        texte = data["choices"][0]["message"]["content"].strip()
        tokens_in = data.get("usage", {}).get("prompt_tokens", 0)
        tokens_out = data.get("usage", {}).get("completion_tokens", 0)
        log_llm_call(token_log, "openrouter/deepseek-r1", "faq", tokens_in, tokens_out, latence, texte[:100])
        return texte
    except Exception as e:
        logging.error(f"[FAQ] Échec après retries : {e}")
        return _FALLBACK
