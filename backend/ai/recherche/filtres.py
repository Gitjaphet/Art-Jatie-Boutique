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


@dataclass
class Resultat:
    exacts: list[dict] = field(default_factory=list)   # type, budget, couleur ET taille
    proches: list[dict] = field(default_factory=list)  # même type et budget, autre couleur ou taille


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


def filtrer(produits: list[dict], fiche: dict) -> Resultat:
    types, couleurs, tailles = fiche.get("types") or [], fiche.get("couleurs") or [], fiche.get("tailles") or []
    budget, exclus = fiche.get("budget_max"), set(fiche.get("exclus") or [])

    base = [
        p for p in produits
        if _disponible(p)
        and p["id"] not in exclus
        and (not types or p.get("type_article") in types)
        and (not budget or (p.get("prix_ar") or 0) <= budget)
    ]

    def exact(p: dict) -> bool:
        bonne_couleur = not couleurs or any(f in (p.get("familles") or []) for f in couleurs)
        t = _tailles(p)
        bonne_taille = not tailles or bool(t & set(tailles)) or SUR_MESURE in t
        return bonne_couleur and bonne_taille

    exacts = sorted((p for p in base if exact(p)), key=_ordre)
    proches = sorted((p for p in base if not exact(p)), key=_ordre)
    return Resultat(exacts, proches)
