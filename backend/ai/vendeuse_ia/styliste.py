"""
ai/vendeuse_ia/styliste.py — met la réponse de la vendeuse dans le style côtier de Japhet (modèle v3 sur Ollama).

Le texte reçu est le « sens » : déjà juste (faits venus des outils). La v3 le réécrit comme Japhet l'écrirait,
puis le garde-fou vérifie que prix, grammes, tailles, jours, heures et nombres sont intacts.
Un essai refusé est refait une fois ; ensuite, ou si Ollama est indisponible, le texte d'origine part tel quel.
La cliente reçoit donc toujours une réponse juste.
"""
import logging
import re

from ai.core.llm import ModeleIndisponible, appeler_llm
from ai.vendeuse_ia.garde_fou import verifier

ESSAIS = 2         # un essai, plus un nouvel essai si le garde-fou refuse
MAX_MOTS = 60      # la v3 a appris sur des réponses de 60 mots au plus : au-delà, elle couperait la fin
RE_THINK = re.compile(r"<think>.*?</think>\s*", re.S)


def mettre_en_style(texte: str, message_cliente: str, langue: str, token_log: list | None = None) -> str:
    """Le texte en style côtier si la cliente écrit en malgache et que les faits survivent ; sinon le texte tel quel."""
    if langue != "mg" or not texte.strip() or len(texte.split()) > MAX_MOTS:
        return texte
    # Même format qu'à l'entraînement ; la consigne système est gravée dans le Modelfile.
    messages = [{"role": "user", "content": f"Cliente : {message_cliente}\nSens à exprimer : {texte}"}]
    for essai in range(1, ESSAIS + 1):
        try:
            res = appeler_llm("styliste", messages, max_tokens=120, token_log=token_log, temperature=0.3)
        except ModeleIndisponible:
            logging.warning("[STYLISTE] modèle indisponible : réponse d'origine gardée")
            return texte
        propose = RE_THINK.sub("", res["contenu"]).strip()
        erreurs = verifier(texte, propose) if propose else ["réponse vide"]
        if not erreurs:
            return propose
        logging.info(f"[STYLISTE] essai {essai}/{ESSAIS} refusé : {' ; '.join(erreurs)}")
    return texte
