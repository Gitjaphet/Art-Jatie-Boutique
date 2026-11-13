# ai/core/llm.py
"""Appel d'un modèle LLM (format chat/completions) avec détection des échecs."""
import os
import time
import logging
import re
import httpx

from ai.core.llm_config import PROVIDERS, CHAINES
from ai.core.token_logger import log_llm_call


class ModeleIndisponible(Exception):
    """Ce modèle n'a pas pu répondre : l'appelant doit passer au suivant."""


def appeler_modele(
    provider: str,
    model: str,
    extra: dict,
    messages: list,
    max_tokens: int,
    temperature: float = 0.0,
    tools: list | None = None,
    tool_choice: str | None = None,
) -> dict:
    p = PROVIDERS[provider]
    headers = {"Content-Type": "application/json", **p.get("headers", {})}
    if p.get("key_env"):  # Ollama, sur notre VPS, n'a pas de clé
        cle = os.getenv(p["key_env"])
        if not cle:
            raise ModeleIndisponible(f"{provider}: clé {p['key_env']} absente")
        headers["Authorization"] = f"Bearer {cle}"
    body = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        **extra,
    }
    if tools:
        body["tools"] = tools
        body["tool_choice"] = tool_choice or "auto"

    # Un appel d'outil mal formé (outil inventé, JSON cassé) est souvent ponctuel : on réessaie une fois.
    for essai in range(2):
        try:
            r = httpx.post(p["url"], headers=headers, json=body, timeout=p.get("timeout", 30))
        except httpx.HTTPError as e:
            raise ModeleIndisponible(f"{provider}/{model}: réseau ou délai dépassé ({e})")
        if essai == 0 and r.status_code == 400 and "tool_use_failed" in r.text:
            logging.warning(f"[LLM] {provider}/{model}: appel d'outil mal formé → nouvelle tentative")
            continue
        break

    if r.status_code != 200:
        raise ModeleIndisponible(f"{provider}/{model}: HTTP {r.status_code} {r.text[:200]}")

    try:
        data = r.json()
        message = data["choices"][0]["message"]
    except (ValueError, KeyError, IndexError, TypeError):
        raise ModeleIndisponible(f"{provider}/{model}: réponse illisible {r.text[:200]}")

    contenu = (message.get("content") or "").strip()
    appels_outils = message.get("tool_calls")
    if not contenu and not appels_outils:
        raise ModeleIndisponible(f"{provider}/{model}: réponse vide")

    if tool_choice == "required" and not appels_outils:
        raise ModeleIndisponible(f"{provider}/{model}: appel d outil exige mais absent")

    usage = data.get("usage") or {}
    return {
        "contenu": contenu,
        "tool_calls": appels_outils,
        "tokens_in": usage.get("prompt_tokens", 0),
        "tokens_out": usage.get("completion_tokens", 0),
        "modele": f"{provider}/{model}",
    }


# ── Bascule automatique le long d'une chaîne ──────────────────────────────
DUREE_ECART_S = 300  # un modèle en panne est évité pendant 5 minutes
_ecartes: dict = {}  # (fournisseur, modèle) -> instant jusqu'auquel on l'évite


def appeler_llm(
    role: str,
    messages: list,
    max_tokens: int,
    token_log: list | None = None,
    temperature: float = 0.0,
    tools: list | None = None,
    tool_choice: str | None = None,
) -> dict:
    chaine = CHAINES[role]
    erreurs = []

    for i, (provider, model, extra) in enumerate(chaine):
        dernier = i == len(chaine) - 1
        cle = (provider, model)

        if not dernier and _ecartes.get(cle, 0) > time.time():
            continue  # modèle récemment en panne : on ne le réessaie pas tout de suite

        t0 = time.time()
        try:
            res = appeler_modele(provider, model, extra, messages, max_tokens, temperature, tools, tool_choice)
        except ModeleIndisponible as e:
            _ecartes[cle] = time.time() + DUREE_ECART_S
            erreurs.append(str(e))
            logging.warning(f"[LLM] {role} : {e} → modèle suivant")
            continue

        _ecartes.pop(cle, None)
        if token_log is not None:
            log_llm_call(
                token_log, res["modele"], role,
                res["tokens_in"], res["tokens_out"],
                (time.time() - t0) * 1000,
                res["contenu"] or "tool_call",
            )
        return res

    logging.error(f"[LLM] {role} : toute la chaîne a échoué : {erreurs}")
    raise ModeleIndisponible(f"{role} : toute la chaîne a échoué")


# ── Protection des données personnelles ───────────────────────────────────
_RE_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
_RE_TEL = re.compile(r"(?<!\w)\+?\d[\d .\-]{6,}\d")


def masquer_donnees_perso(texte: str) -> str:
    """Remplace emails et numéros de téléphone par des marqueurs neutres."""
    texte = _RE_EMAIL.sub("[email]", texte or "")
    return _RE_TEL.sub("[numéro]", texte)
