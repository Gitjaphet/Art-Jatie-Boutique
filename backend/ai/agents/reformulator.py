# ai/agents/reformulator.py
from __future__ import annotations
import json

from ai.core.llm import appeler_llm, ModeleIndisponible
from ai.core.types import ToolResult
from ai.core.prompts import REFORMULATOR, REFORMULATOR_STATS

_FALLBACK = "J'ai trouvé des informations, mais j'ai un petit souci de connexion pour vous les présenter."


def llm3_reformulateur(token_log: list, message: str, donnees: ToolResult, mode: str = "produits") -> str:
    modele_prompt = REFORMULATOR_STATS if mode == "stats" else REFORMULATOR
    prompt = modele_prompt.format(
        message=message,
        donnees=json.dumps(donnees, ensure_ascii=False, default=str)[:800],
    )
    try:
        res = appeler_llm(
            "reformulateur",
            [{"role": "user", "content": prompt}],
            max_tokens=800, token_log=token_log, temperature=0.3,
        )
        return res["contenu"]
    except ModeleIndisponible:
        return _FALLBACK
