# ai/agents/order_agent.py
import json

from ai.core.llm import appeler_llm, ModeleIndisponible
from ai.core.prompts import ORDER_CONFIRM, ORDER_COLLECT

_FALLBACK = "Désolé, notre système de commande rencontre une petite perturbation technique."


def llm4_commande(token_log: list, message: str, historique_commande: dict, commande_result: dict = None, history: list = None) -> str:
    if commande_result:
        prompt = ORDER_CONFIRM.format(
            commande_result=json.dumps(commande_result, ensure_ascii=False),
        )
    else:
        champs_manquants = [k for k, v in historique_commande.items() if not v]
        historique_conversation = ""
        if history:
            historique_conversation = "\n".join(
                f"{(m.get('role') or '').upper()}: {m.get('content')}"
                for m in history[-6:]
                if (m.get("content") or "").strip()
            )
        prompt = ORDER_COLLECT.format(
            historique=json.dumps(historique_commande, ensure_ascii=False),
            champs_manquants=champs_manquants,
            historique_conversation=historique_conversation,
        )

    try:
        res = appeler_llm(
            "commande",
            [{"role": "user", "content": prompt}],
            max_tokens=300, token_log=token_log, temperature=0.3,
        )
        return res["contenu"]
    except ModeleIndisponible:
        return _FALLBACK
