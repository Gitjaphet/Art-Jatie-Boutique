"""Un tour de conversation guidé par le code : lecteur -> fiche -> vendeuse (zéro token).

tour_guide(message, fiche) -> dict, ou None en cas d'erreur (l'orchestrateur reprend alors l'ancien chemin).
  action None   : message incompris, le modèle prend le relais
  commander     : « oui » / « sur mesure » sur un modèle -> le parcours de commande démarre
  sinon         : texte, produits (cartes), suggestions (boutons) de la vendeuse
"""
import logging

from ai.recherche.fiche import mettre_a_jour
from ai.recherche.filtres import charger_produits
from ai.recherche.lecteur import Lecture, lire
from ai.recherche.vendeuse import repondre


def lecture_comprise(compris: dict, message: str) -> Lecture:
    """Critères trouvés par le modèle, mis dans une lecture : la fiche et la vendeuse les traitent comme les autres."""
    lecture = lire(message)
    lecture.types = compris.get("types") or lecture.types
    # Couleurs et tailles : celles lues dans le message par le lecteur, jamais déduites par le modèle
    lecture.montant = compris.get("budget_max") or lecture.montant
    if compris.get("moins_cher"):
        lecture.tri = "prix_asc"
    return lecture


def tour_guide(message: str, fiche: dict | None, produits: list[dict] | None = None,
               lecture: Lecture | None = None, forcer: str | None = None) -> dict | None:
    try:
        produits = charger_produits() if produits is None else produits
        par_id = {p["id"]: p for p in produits}
        montres = {i: par_id[i] for i in (fiche or {}).get("montres") or [] if i in par_id}

        f, decision = mettre_a_jour(fiche, lecture or lire(message), montres)
        if decision.action is None and forcer:  # intention donnée par le modèle (« un truc joli » -> recherche)
            decision.action = forcer
        f["tour"] = (f.get("tour") or 0) + 1

        if decision.action is None:
            return {"fiche": f, "action": None}
        if decision.action in ("oui", "sur_mesure") and decision.produit_id in par_id:
            return {"fiche": f, "action": decision.action, "commander": decision.produit_id}

        rep = repondre(decision.action, f, produits, decision.produit_id)
        f["question"] = rep.question
        if rep.produits:  # sinon on garde les modèles déjà montrés (« la sirène » reste reconnue)
            f["montres"] = [p["id"] for p in rep.produits]
        logging.info(f"[GUIDE] {decision.action} | {len(rep.produits)} carte(s) | 0 token")
        return {"fiche": f, "action": decision.action, "texte": rep.texte,
                "produits": rep.produits, "suggestions": rep.suggestions}
    except Exception:
        logging.exception("[GUIDE] Échec : retour au chemin classique")
        return None
