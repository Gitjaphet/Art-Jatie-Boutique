# ai/agents/faq.py
"""FAQ en RAG : la réponse est construite uniquement à partir des passages du site trouvés par chercher_passages()."""
from services.contact import WHATSAPP
from ai.core.llm import appeler_llm, ModeleIndisponible
from ai.core.prompts import FAQ

FALLBACK_SANS_INFO = ("Je n'ai pas cette information pour le moment 😊 Écrivez-nous sur WhatsApp "
                      f"au {WHATSAPP}, nous vous répondrons avec plaisir 💕")
_FALLBACK_PANNE = f"Pour toute question, n'hésitez pas à nous contacter directement sur WhatsApp au {WHATSAPP} ! 💕"


def llm5_faq(token_log: list, message: str, passages: list[dict], history: list = None) -> str:
    if not passages:
        return FALLBACK_SANS_INFO  # rien de pertinent sur le site : aucun appel IA, 0 token

    extraits = "\n\n---\n\n".join(p["contenu"] for p in passages)
    messages = [{"role": "system", "content": FAQ.format(extraits=extraits)}]
    for m in (history or [])[-4:]:
        role = m.get("role", "")
        contenu = (m.get("content") or "").strip()
        if role in ("user", "assistant") and contenu:
            messages.append({"role": role, "content": contenu[:400]})
    messages.append({"role": "user", "content": message})

    try:
        res = appeler_llm("faq", messages, max_tokens=500, token_log=token_log, temperature=0.2)
        return res["contenu"]
    except ModeleIndisponible:
        return _FALLBACK_PANNE
