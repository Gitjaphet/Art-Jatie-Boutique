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
from ai.vendeuse_ia.garde_fou import RE_MONTANT, extraire_faits, verifier

ESSAIS = 2         # un essai, plus un nouvel essai si le garde-fou refuse
MAX_MOTS = 60      # la v3 a appris sur des réponses de 60 mots au plus : au-delà, elle couperait la fin
RE_THINK = re.compile(r"<think>.*?</think>\s*", re.S)
RE_UNITE_APRES = re.compile(r"\s*(?:ariary|ar|fmg|k|mille)(?![a-zà-ÿ])", re.I)
RE_LETTRE = re.compile(r"[^\W\d_]")


def _ajouter_ariary(sens: str, reponse: str) -> str:
    """Remet « Ar » collé derrière chaque prix du sens écrit sans unité (« 45 000 araik » -> « 45 000Ar araik »).

    La v3 n'a vu que des [prix] masqués à l'entraînement : elle n'écrit jamais l'unité, alors que Japhet l'écrit.
    Un montant déjà suivi d'une unité, ou collé à un mot (« 7000ara »), n'est pas touché.
    """
    prix = extraire_faits(sens)["prix"]
    morceaux, debut = [], 0
    for m in RE_MONTANT.finditer(reponse):
        apres = reponse[m.end():]
        valeur = int(re.sub(r"[\s.,]", "", m.group(1)))
        if valeur in prix and not RE_UNITE_APRES.match(apres) and not RE_LETTRE.match(apres):
            morceaux += [reponse[debut:m.end()], "Ar"]
            debut = m.end()
    return "".join(morceaux) + reponse[debut:]


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
            return _ajouter_ariary(texte, propose)
        logging.info(f"[STYLISTE] essai {essai}/{ESSAIS} refusé : {' ; '.join(erreurs)}")
    return texte
