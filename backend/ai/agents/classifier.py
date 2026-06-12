# ai/agents/classifier.py
import os
import time
import logging
import httpx
from ai.core.token_logger import log_llm_call
from ai.core.retry import llm_retry
from ai.core.prompts import CLASSIFIER

_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
_VALID_INTENTS = ["recherche", "commande", "stats", "faq", "salutation"]
_FALLBACK = {"intent": "salutation", "tokens_in": 0, "tokens_out": 0}


def llm1_classifier(token_log: list, message: str, history: list = None) -> dict:
    t0 = time.time()
    headers = {
        "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
        "Content-Type": "application/json",
    }
    prompt_system = CLASSIFIER
    messages_payload = [{"role": "system", "content": prompt_system}]
    if history:
        for msg in history[-4:]:
            messages_payload.append({"role": msg["role"], "content": msg["content"]})
    messages_payload.append({"role": "user", "content": message})
    body = {
        "model": "llama-3.1-8b-instant",
        "messages": messages_payload,
        "max_tokens": 10,
        "temperature": 0,
    }

    @llm_retry
    def _call() -> httpx.Response:
        r = httpx.post(_GROQ_URL, headers=headers, json=body, timeout=30)
        r.raise_for_status()  # lève HTTPStatusError sur 4xx/5xx → retryable si 429/5xx
        return r

    try:
        response = _call()
        data = response.json()
        latence = (time.time() - t0) * 1000
        intent = data["choices"][0]["message"]["content"].strip().lower()
        for valid in _VALID_INTENTS:
            if valid in intent:
                intent = valid
                break
        else:
            intent = "salutation"
        tokens_in = data.get("usage", {}).get("prompt_tokens", 0)
        tokens_out = data.get("usage", {}).get("completion_tokens", 0)
        log_llm_call(token_log, "groq/llama-3.1-8b-instant", "classifier", tokens_in, tokens_out, latence, intent)
        return {"intent": intent, "tokens_in": tokens_in, "tokens_out": tokens_out}
    except Exception as e:
        logging.error(f"[CLASSIFIER] Échec après retries : {e}")
        return _FALLBACK
