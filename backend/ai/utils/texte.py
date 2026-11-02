# ai/utils/texte.py
"""Outils texte partagés par les recherches hybrides (produits et pages du site)."""
import re
import unicodedata

BONUS_MOT_NOM = 0.3     # mot de la requête présent dans le nom / titre
BONUS_MOT_AUTRE = 0.1   # présent dans le reste du texte

_MOTS_VIDES = {
    "les", "des", "une", "pour", "avec", "vous", "avez", "est", "que", "qui", "dans", "sur",
    "pas", "plus", "aux", "mon", "mes", "votre", "vos", "cherche", "voudrais", "veux",
    "quelque", "chose", "auriez", "avoir", "montrer", "montrez", "bonjour", "merci",
}


def normaliser(texte: str) -> str:
    t = unicodedata.normalize("NFD", (texte or "").lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")  # retire les accents
    return re.sub(r"[^a-z0-9]+", " ", t)


def mots(texte: str) -> set[str]:
    resultat = set()
    for m in normaliser(texte).split():
        if len(m) < 3 or m in _MOTS_VIDES:
            continue
        if len(m) > 3 and m.endswith("s"):
            m = m[:-1]  # pluriel simple : sacs -> sac, robes -> robe
        resultat.add(m)
    return resultat


def score_lexical(mots_requete: set[str], nom: str, autres: str) -> float:
    mots_nom, mots_autres = mots(nom), mots(autres)
    score = 0.0
    for m in mots_requete:
        if m in mots_nom:
            score += BONUS_MOT_NOM
        elif m in mots_autres:
            score += BONUS_MOT_AUTRE
    return score
