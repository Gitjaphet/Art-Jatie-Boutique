# ai/agents/faq.py
from ai.core.llm import appeler_llm, ModeleIndisponible
from ai.core.prompts import FAQ

_FALLBACK = "Pour toute question, n'hésitez pas à nous contacter directement sur WhatsApp au 034 30 513 60 ! 💕"


def llm5_faq(token_log: list, message: str) -> str:
    try:
        res = appeler_llm(
            "faq",
            [{"role": "user", "content": FAQ.format(message=message)}],
            max_tokens=300, token_log=token_log, temperature=0.2,
        )
        return res["contenu"]
    except ModeleIndisponible:
        return _FALLBACK
