"""Retry helpers pour les appels LLM externes (Groq, Cerebras, Gemini, OpenRouter)."""
import logging
from tenacity import (
    retry,
    wait_exponential,
    stop_after_attempt,
    retry_if_exception,
    before_sleep_log,
)

logger = logging.getLogger(__name__)


def _is_retryable(exc: BaseException) -> bool:
    """Retente sur 429 (rate limit) et 5xx (erreur serveur), pas sur 4xx client."""
    import httpx
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code == 429 or exc.response.status_code >= 500
    if isinstance(exc, (httpx.TimeoutException, httpx.ConnectError)):
        return True
    return False


llm_retry = retry(
    retry=retry_if_exception(_is_retryable),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    stop=stop_after_attempt(3),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
