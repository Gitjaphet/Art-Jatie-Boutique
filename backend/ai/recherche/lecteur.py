"""Lecteur : un message de cliente -> ce que le code en comprend, sans appel au modèle.

Il ne décide rien : la fiche (ai/recherche/fiche.py) croise la lecture avec la conversation.
"""
import re
from dataclasses import dataclass, field

from ai.commande.parcours import _lieu
from ai.recherche.lexique import (
    EXPRESSIONS_TROP_CHER, NON, OUI, QUESTION_PRIX, SALUTATIONS,
    couleurs_citees, langue, mots_message, types_cites,
)

TAILLES = ("XS", "S", "M", "L", "XL", "XXL")
_AVANT_TAILLE = {"taille", "en", "size", "t"}
_MOTS_LIVRAISON = {"livrer", "livrez", "livraison", "livre", "livrent", "frais", "expedition", "envoyer"}
_MOTS_REMISE = {"remise", "reduction", "promo", "rabais", "solde", "gerant", "instructions"}
_MOTS_MOINS_CHER = ("moins cher", "pas cher", "moins chere", "le moins", "petit prix", "pas trop cher")
_TOUT_VOIR = ("toute la boutique", "tout voir", "tous les modeles", "tous vos modeles", "tout le catalogue")
_AUTRES_ARTICLES = ("autres articles", "autre chose", "autres modeles", "autre article", "autres choses")
_REPONSE_COURTE = 5  # mots maximum pour lire un oui/non comme une réponse

# 30000 | 30 000 | 30.000 | 30k ; ignore « 50 % », « 2 ans », « 6 mois »
_MONTANT = re.compile(r"(\d{1,3}(?:[ .\u202f]\d{3})+|\d+)\s*(k|mille)?(?!\s*(?:%|ans?\b|mois\b))", re.I)


@dataclass
class Lecture:
    mots: list[str] = field(default_factory=list)
    langue: str = "fr"
    types: list[str] = field(default_factory=list)
    couleurs: list[str] = field(default_factory=list)
    tailles: list[str] = field(default_factory=list)
    montant: int | None = None
    tri: str | None = None            # « prix_asc »
    trop_cher: bool = False
    reponse: str | None = None        # « oui » / « non » (message court seulement)
    zone: str | None = None
    livraison: bool = False
    question_prix: bool = False
    demande_remise: bool = False
    salutation: bool = False
    sur_mesure: bool = False
    tout_voir: bool = False
    autres_articles: bool = False

    def compris(self) -> bool:
        """Vrai si le code a reconnu au moins une intention ou un critère."""
        return any([self.types, self.couleurs, self.tailles, self.montant, self.tri, self.trop_cher,
                    self.reponse, self.zone, self.livraison, self.question_prix, self.demande_remise,
                    self.salutation, self.sur_mesure, self.tout_voir, self.autres_articles])


def _montant(texte: str) -> int | None:
    for chiffres, multiplicateur in _MONTANT.findall(texte or ""):
        valeur = int(re.sub(r"\D", "", chiffres))
        if multiplicateur:
            valeur *= 1000
        if valeur >= 1000:  # en dessous : quantité, taille ou âge, pas un prix en ariary
            return valeur
    return None


def _montant_dans(message: str, texte: str) -> int | None:
    """« moins de 40 000 » : strictement moins cher (39 999) ; « 30000 » seul : budget maximum."""
    valeur = _montant(message)
    return valeur - 1 if valeur and " moins de " in texte else valeur


def _tailles(liste_mots: list[str]) -> list[str]:
    trouvees = []
    for avant, mot in zip([""] + liste_mots, liste_mots):
        taille = mot.upper()
        if taille in TAILLES and (avant in _AVANT_TAILLE or len(taille) > 1) and taille not in trouvees:
            trouvees.append(taille)
    return trouvees


def lire(message: str) -> Lecture:
    m = mots_message(message)
    texte = f" {' '.join(m)} "
    oui, non = any(x in OUI for x in m), any(x in NON for x in m)
    reponse = None
    if len(m) <= _REPONSE_COURTE and (oui or non):
        reponse = "non" if non else "oui"  # la négation l'emporte (« non merci, ok »)
    return Lecture(
        mots=m,
        langue=langue(m),
        types=types_cites(m),
        couleurs=couleurs_citees(m),
        tailles=_tailles(m),
        montant=_montant_dans(message, texte),
        tri="prix_asc" if any(f" {e} " in texte for e in _MOTS_MOINS_CHER) else None,
        trop_cher=any(f" {e} " in texte for e in EXPRESSIONS_TROP_CHER),
        reponse=reponse,
        zone=_lieu(message),
        livraison=any(x in _MOTS_LIVRAISON for x in m),
        question_prix=any(x in QUESTION_PRIX for x in m),
        demande_remise=any(x in _MOTS_REMISE for x in m),
        salutation=bool(m) and m[0] in SALUTATIONS,
        sur_mesure=" sur mesure " in texte,
        tout_voir=any(f" {e} " in texte for e in _TOUT_VOIR),
        autres_articles=any(f" {e} " in texte for e in _AUTRES_ARTICLES),
    )
