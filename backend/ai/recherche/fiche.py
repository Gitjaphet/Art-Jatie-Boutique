"""Fiche de recherche : la mémoire de la conversation, transportée par le site (le serveur ne stocke rien).

mettre_a_jour(fiche, lecture, montres) -> (fiche, Decision)
`montres` : {id: {"nom": ..., "prix_ar": ...}} des modèles affichés au tour précédent.
"""
from dataclasses import dataclass

from ai.recherche.lecteur import Lecture
from services.catalogue import mots as mots_nom

MAX_MONTRES = 5
# Mots qui ne désignent jamais UN modèle (la matière de presque toutes les pièces, les mots de liaison)
_MOTS_VIDES = {"crochet", "celle", "celui", "celles", "ceux", "avec", "pour", "modele", "piece", "pieces"}


@dataclass
class Decision:
    action: str | None          # remise | oui | non | objection | recherche | livraison | salutation | None
    produit_id: int | None = None


def nouvelle_fiche() -> dict:
    return {"types": [], "couleurs": [], "tailles": [], "budget_max": None, "tri": None,
            "exclus": [], "montres": [], "question": None, "zone": None, "langue": "fr"}


def produit_cite(mots: list[str], montres: dict) -> int | None:
    """Le modèle désigné par un mot distinctif (« la sirène », « celle avec le chapeau »).

    Distinctif = absent du nom d'au moins un autre modèle montré : « robe » ne désigne rien
    parmi trois robes, « chapeau » si. None si aucun mot ne désigne un seul modèle.
    """
    noms = {int(pid): {m for m in mots_nom(i.get("nom", "")) if len(m) >= 4} for pid, i in (montres or {}).items()}
    if not noms:
        return None
    du_message = {m for m in mots if len(m) >= 4 and m not in _MOTS_VIDES}
    total = len(noms)
    scores = {}
    for pid, mots_du_nom in noms.items():
        distinctifs = {m for m in mots_du_nom
                       if total == 1 or sum(m in autres for autres in noms.values()) < total}
        if score := len(du_message & distinctifs):
            scores[pid] = score
    if not scores:
        return None
    meilleur = max(scores.values())
    gagnants = [pid for pid, s in scores.items() if s == meilleur]
    return gagnants[0] if len(gagnants) == 1 else None


def _abaisser_budget(fiche: dict, plafond: int) -> None:
    actuel = fiche.get("budget_max")
    fiche["budget_max"] = plafond if actuel is None else min(actuel, plafond)


def mettre_a_jour(fiche: dict | None, lecture: Lecture, montres: dict | None = None) -> tuple[dict, Decision]:
    f = {**nouvelle_fiche(), **(fiche or {})}
    f["langue"] = lecture.langue if lecture.langue == "mg" else f["langue"]
    if lecture.zone:
        f["zone"] = lecture.zone
    cite = produit_cite(lecture.mots, montres or {})

    # 1. Demande de remise ou tentative de manipulation : aucun critère ne change
    if lecture.demande_remise:
        return f, Decision("remise", cite)

    # 2. Réponse courte à la dernière question de Jatie
    if lecture.reponse and f.get("question"):
        question, f["question"] = f["question"], None
        return f, Decision(lecture.reponse, question.get("produit_id"))

    # 3. Objection de prix : le modèle cité sort des résultats, le budget passe sous son prix
    if lecture.trop_cher:
        prix_cite = (montres or {}).get(cite, {}).get("prix_ar") if cite else None
        reference = lecture.montant or prix_cite
        if cite and cite not in f["exclus"]:
            f["exclus"].append(cite)
        if reference:
            _abaisser_budget(f, reference - 1)
        f["tri"] = "prix_asc"
        return f, Decision("objection", cite)

    # 4. Critères de recherche
    change = False
    if lecture.types and lecture.types != f["types"]:
        f.update(types=lecture.types, couleurs=[], tailles=[], exclus=[])  # nouvelle recherche
        change = True
    if lecture.couleurs:
        f["couleurs"], change = lecture.couleurs, True
    if lecture.tailles:
        f["tailles"], change = lecture.tailles, True
    if lecture.montant:
        _abaisser_budget(f, lecture.montant)
        change = True
    if lecture.tri:
        f["tri"], change = lecture.tri, True
    if change:
        return f, Decision("recherche")

    # 5. Livraison (zone citée ou question sur la livraison)
    if lecture.livraison or lecture.zone:
        return f, Decision("livraison", cite)

    # 6. Simple bonjour
    if lecture.salutation:
        return f, Decision("salutation")

    return f, Decision(None, cite)  # incompris : seul cas où le modèle est appelé
