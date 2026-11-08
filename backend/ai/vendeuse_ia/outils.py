"""
ai/vendeuse_ia/outils.py — les outils de la vendeuse IA : les SEULS faits qu'elle a le droit de dire.

Le modèle choisit l'outil et ses paramètres ; le code répond avec les vraies données (catalogue,
tarifs de livraison, pages du site). Aucun outil ne lève d'erreur : en cas de problème, il rend
{"erreur": ...} et le modèle se corrige. Tout est réutilisé : filtres, tarifs, FAQ, parcours.
"""
import json
import logging

from ai.commande.parcours import _lieu
from ai.knowledge.recherche import chercher_passages
from ai.recherche import vendeuse as V
from ai.recherche.filtres import filtrer
from services.catalogue import FAMILLES, TYPES_ARTICLE
from services.commandes import DELAI_FABRICATION, LIBELLES_ZONE

MAX_EXACTS, MAX_PROCHES = 5, 3


def _fiche_produit(p: dict) -> dict:
    """Ce que la vendeuse voit d'un modèle : de quoi le présenter, rien d'inventable."""
    stock = p.get("stock") or 0
    return {
        "id": p["id"], "nom": p["nom"], "type": p.get("type_article"),
        "prix": V.ar(p["prix_ar"]), "couleurs": p.get("familles") or [],
        "tailles": p.get("tailles") or "",
        "disponibilite": f"en stock ({stock})" if stock > 0 else f"à fabriquer sur commande en {DELAI_FABRICATION}",
    }


def chercher_produits(produits: list[dict], types=None, couleurs=None, tailles=None,
                      budget_max=None, moins_cher=False) -> dict:
    fiche = {"types": [t for t in types or [] if t in TYPES_ARTICLE],
             "couleurs": [c for c in couleurs or [] if c in FAMILLES],
             "tailles": [str(t).upper() for t in tailles or []],
             "budget_max": int(budget_max) if budget_max else None,
             "tri": "prix_asc" if moins_cher else None, "exclus": [], "genre": None}
    r = filtrer(produits, fiche)
    return {"exacts": [_fiche_produit(p) for p in r.exacts[:MAX_EXACTS]],
            "nombre_exacts": len(r.exacts),
            "proches": [_fiche_produit(p) for p in r.proches[:MAX_PROCHES]]}


def detail_produit(produits: list[dict], produit_id) -> dict:
    p = next((x for x in produits if x["id"] == int(produit_id)), None)
    return _fiche_produit(p) if p else {"erreur": f"aucun modèle n° {produit_id}"}


def livraison(lieu: str) -> dict:
    zone = _lieu(lieu or "")
    if not zone:
        return {"erreur": "lieu inconnu", "zones": {LIBELLES_ZONE[z]: _tarif(z) for z in LIBELLES_ZONE}}
    return {"zone": LIBELLES_ZONE.get(zone, zone), "tarif": _tarif(zone),
            "delai": V.DELAI_LIVRAISON_NOSY_BE if zone in V.ZONES_NOSY_BE else "confirmé par l'équipe"}


def _tarif(zone: str) -> str:
    frais = V._frais(zone)
    return "offerte" if frais == 0 else V.ar(frais) if frais else "sur devis"


def infos_boutique(question: str) -> dict:
    passages = chercher_passages(question or "", top_k=3)
    if not passages:
        return {"erreur": "aucune information sur le site pour cette question"}
    return {"extraits": [{"page": p.get("titre") or p.get("url"), "texte": (p.get("contenu") or "")[:700]}
                         for p in passages]}


def demarrer_commande(produits: list[dict], produit_id) -> dict:
    if not any(x["id"] == int(produit_id) for x in produits):
        return {"erreur": f"aucun modèle n° {produit_id}"}
    return {"action": "commander", "produit_id": int(produit_id)}


# Description des outils pour le modèle (listes fermées issues du catalogue)
OUTILS = [
    {"type": "function", "function": {
        "name": "chercher_produits",
        "description": "Cherche les modèles de la boutique. Appelle-le avant de parler d'un modèle, d'un prix ou d'un stock.",
        "parameters": {"type": "object", "properties": {
            "types": {"type": "array", "items": {"type": "string", "enum": list(TYPES_ARTICLE)}},
            "couleurs": {"type": "array", "items": {"type": "string", "enum": list(FAMILLES)}},
            "tailles": {"type": "array", "items": {"type": "string"}},
            "budget_max": {"type": "integer", "description": "Budget maximum en Ariary, seulement s'il est écrit"},
            "moins_cher": {"type": "boolean", "description": "La cliente veut le moins cher"},
        }}}},
    {"type": "function", "function": {
        "name": "detail_produit", "description": "Détail d'un modèle déjà montré (par son id).",
        "parameters": {"type": "object", "properties": {"produit_id": {"type": "integer"}}, "required": ["produit_id"]}}},
    {"type": "function", "function": {
        "name": "livraison", "description": "Tarif et délai de livraison pour un lieu (ville, quartier).",
        "parameters": {"type": "object", "properties": {"lieu": {"type": "string"}}, "required": ["lieu"]}}},
    {"type": "function", "function": {
        "name": "infos_boutique",
        "description": "Informations du site : formation crochet (prix, horaires, en ligne), adresse, contact, guide des tailles, sur mesure.",
        "parameters": {"type": "object", "properties": {"question": {"type": "string"}}, "required": ["question"]}}},
    {"type": "function", "function": {
        "name": "demarrer_commande", "description": "La cliente veut commander ou réserver un modèle précis.",
        "parameters": {"type": "object", "properties": {"produit_id": {"type": "integer"}}, "required": ["produit_id"]}}},
]


def executer(nom: str, arguments, produits: list[dict]) -> dict:
    """Exécute un outil demandé par le modèle ; ne lève jamais d'erreur."""
    try:
        args = json.loads(arguments or "{}") if isinstance(arguments, str) else dict(arguments or {})
        if nom == "chercher_produits":
            return chercher_produits(produits, **{k: args.get(k) for k in
                                                  ("types", "couleurs", "tailles", "budget_max", "moins_cher")})
        if nom == "detail_produit":
            return detail_produit(produits, args["produit_id"])
        if nom == "livraison":
            return livraison(args.get("lieu", ""))
        if nom == "infos_boutique":
            return infos_boutique(args.get("question", ""))
        if nom == "demarrer_commande":
            return demarrer_commande(produits, args["produit_id"])
        return {"erreur": f"outil inconnu : {nom}"}
    except Exception as e:
        logging.warning(f"[VENDEUSE-IA] outil {nom} : {e}")
        return {"erreur": f"paramètres invalides pour {nom}"}
