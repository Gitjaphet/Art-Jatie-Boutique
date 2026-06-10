# ai/agents/order_agent.py
import os
import json
import time
import logging
import httpx
from ai.core.token_logger import log_llm_call
from ai.core.retry import llm_retry

_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
_FALLBACK = "Désolé, notre système de commande rencontre une petite perturbation technique."


def llm4_commande(token_log: list, message: str, historique_commande: dict, commande_result: dict = None) -> str:
    t0 = time.time()
    if commande_result:
        prompt = (
            f"Tu es Jatie, assistante Art-Jatie.\n"
            f"La commande a été enregistrée avec succès.\n"
            f"Résultat : {json.dumps(commande_result, ensure_ascii=False)}\n"
            f"Annonce la confirmation au client en français, ton chaleureux, 2-3 phrases. "
            f"Mentionne le numéro de commande et que l'équipe le contactera sur WhatsApp."
        )
    else:
        champs_manquants = [k for k, v in historique_commande.items() if not v]
        prompt = (
            f"Tu es Jatie, assistante Art-Jatie.\n"
            f"Le client veut commander. Infos collectées : "
            f"{json.dumps(historique_commande, ensure_ascii=False)}\n"
            f"Champs manquants : {champs_manquants}\n"
            f"Pose UNE SEULE question pour collecter le prochain champ manquant.\n"
            f"Réponds en français, ton chaleureux."
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
