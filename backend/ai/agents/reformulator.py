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

_OLLAMA_URL = f"{os.getenv('OLLAMA_BASE_URL', 'http://ollama:11434')}/api/generate"
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
            _OLLAMA_URL,
            json={
                "model": "qwen2.5:3b",
                "prompt": prompt,
                "stream": False,
                "options": {"num_ctx": 512, "temperature": 0.3},
            },
            timeout=120,
        )
        r.raise_for_status()
        return r

    try:
        response = _call()
        data = response.json()
        latence = (time.time() - t0) * 1000
        tokens_in = data.get("prompt_eval_count", 0)
        tokens_out = data.get("eval_count", 0)
        texte = data.get("response", "").strip()
        log_llm_call(token_log, "ollama/qwen2.5:3b", "reformulateur", tokens_in, tokens_out, latence, texte[:100])
        return texte
    except Exception as e:
        logging.error(f"[REFORMULATEUR] Échec après retries : {e}")
        return _FALLBACK
