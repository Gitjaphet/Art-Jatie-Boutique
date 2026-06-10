# ai/core/token_logger.py
import json
import logging

def log_llm_call(
    token_log: list,
    model: str,
    role: str,
    tokens_input: int,
    tokens_output: int,
    latence_ms: float,
    resultat: str,
) -> dict:
    entry = {
        "model": model,
        "role": role,
        "tokens_input": tokens_input,
        "tokens_output": tokens_output,
        "tokens_total": tokens_input + tokens_output,
        "latence_ms": round(latence_ms, 2),
        "resultat": str(resultat)[:200],
    }
    token_log.append(entry)
    logging.info(f"[TOKEN] {json.dumps(entry, ensure_ascii=False)}")
    return entry

def log_summary(token_log: list) -> dict:
    total_tokens = sum(e["tokens_total"] for e in token_log)
    total_latence = sum(e["latence_ms"] for e in token_log)
    logging.info(
        f"[SUMMARY] Total tokens: {total_tokens} | "
        f"Total latence: {total_latence:.2f}ms | Appels: {len(token_log)}"
    )
    return {
        "total_tokens": total_tokens,
        "total_latence_ms": total_latence,
        "appels": len(token_log),
        "detail": token_log,
    }