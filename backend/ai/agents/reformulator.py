# ai/agents/reformulator.py
from __future__ import annotations
import os
import json
import time
import logging
import httpx
from ai.core.token_logger import log_llm_call
from ai.core.retry import llm_retry
from ai.core.types import ToolResult
from ai.core.prompts import REFORMULATOR

_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
_OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "")
_MODEL = "openai/gpt-oss-120b:free"
_FALLBACK = "J'ai trouvé des articles, mais j'ai un petit souci de connexion pour vous les présenter."


def llm3_reformulateur(token_log: list, message: str, donnees: ToolResult) -> str:
    t0 = time.time()
    prompt = REFORMULATOR.format(
        message=message,
        donnees=json.dumps(donnees, ensure_ascii=False, default=str)[:800],
    )

    @llm_retry
    def _call() -> httpx.Response:
        r = httpx.post(
            _OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {_OPENROUTER_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": os.getenv("SITE_URL", "https://artjatie.com"),
            },
            json={
                "model": _MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 256,
                "temperature": 0.3,
            },
            timeout=30,
        )
        r.raise_for_status()
        return r

    try:
        response = _call()
        data = response.json()
        latence = (time.time() - t0) * 1000
        usage = data.get("usage", {})
        tokens_in = usage.get("prompt_tokens", 0)
        tokens_out = usage.get("completion_tokens", 0)
        texte = data["choices"][0]["message"]["content"].strip()
        log_llm_call(
            token_log,
            f"openrouter/{_MODEL}",
            "reformulateur",
            tokens_in,
            tokens_out,
            latence,
            texte[:100],
        )
        return texte
    except Exception as e:
        logging.error(f"[REFORMULATEUR] Échec après retries : {e}")
        return _FALLBACK