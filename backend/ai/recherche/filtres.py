"""Filtres : la fiche -> les modèles à montrer, sans appel au modèle.

Le catalogue est petit : on filtre en Python des dictionnaires produits (ai/data/products._produit_dict),
ce qui rend la logique testable sans base de données.
"""
from dataclasses import dataclass, field

from sqlmodel import Session, select

from ai.data.products import _produit_dict
from database import engine
from models.models import Product

SUR_MESURE = "SUR MESURE"
TAILLES_ADULTES = {"XS", "S", "M", "L", "XL", "XXL"}


@dataclass
class Resultat:
    exacts: list[dict] = field(default_factory=list)   # type, budget, couleur ET taille
    proches: list[dict] = field(default_factory=list)  # même type et budget ; dans sa taille d'abord


def charger_produits() -> list[dict]:
    with Session(engine) as session:
        return [_produit_dict(p) for p in session.exec(select(Product)).all()]


def _disponible(p: dict) -> bool:
    return (p.get("stock") or 0) > 0 or bool(p.get("sur_commande"))


def _tailles(p: dict) -> set[str]:
    return {t.strip().upper() for t in (p.get("tailles") or "").split(",") if t.strip()}


def _ordre(p: dict) -> tuple:
    # En stock d'abord (livrable sous 24 à 48 h), puis du moins cher au plus cher
    return (0 if (p.get("stock") or 0) > 0 else 1, p.get("prix_ar") or 0, p.get("id") or 0)


def _ordre_prix(p: dict) -> tuple:
    return (p.get("prix_ar") or 0, p.get("id") or 0)


def filtrer(produits: list[dict], fiche: dict) -> Resultat:
    types, couleurs, tailles = fiche.get("types") or [], fiche.get("couleurs") or [], fiche.get("tailles") or []
    budget, exclus = fiche.get("budget_max"), set(fiche.get("exclus") or [])
    # Une taille adulte demandée : les articles enfant sont hors sujet
    sans_enfant = bool(set(tailles) & TAILLES_ADULTES)
    ordre = _ordre_prix if fiche.get("tri") == "prix_asc" else _ordre  # « le moins cher » : le prix d'abord

    base = [
        p for p in produits
        if _disponible(p)
        and p["id"] not in exclus
        and (not types or p.get("type_article") in types)
        and (not budget or (p.get("prix_ar") or 0) <= budget)
        and not (sans_enfant and p.get("genre") == "Enfant")
    ]

    def bonne_taille(p: dict) -> bool:
        t = _tailles(p)
        return not tailles or bool(t & set(tailles)) or SUR_MESURE in t

    def bonne_couleur(p: dict) -> bool:
        return not couleurs or any(f in (p.get("familles") or []) for f in couleurs)

    exacts = sorted((p for p in base if bonne_couleur(p) and bonne_taille(p)), key=ordre)
    # Proches : une autre couleur se rattrape (sur mesure), une autre taille moins -> sa taille d'abord
    proches = sorted((p for p in base if not (bonne_couleur(p) and bonne_taille(p))),
                     key=lambda p: (0 if bonne_taille(p) else 1, *ordre(p)))
    return Resultat(exacts, proches)
