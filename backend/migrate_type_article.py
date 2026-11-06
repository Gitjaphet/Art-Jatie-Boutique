"""
migrate_type_article.py — reprise UNIQUE des produits existants (colonne Product.type_article).

La colonne est créée automatiquement au démarrage (database.sync_table_columns).
Ce script PROPOSE un type d'après le nom (services.catalogue.deviner_type).

    python migrate_type_article.py              # simulation : affiche les propositions, n'écrit rien
    python migrate_type_article.py --appliquer  # écrit les propositions en base

Rejouable sans risque : il ne touche que les produits sans type.
Les produits « À CHOISIR » (aucun indice dans le nom) restent vides : type à choisir dans le dashboard.
"""
import sys

from sqlmodel import Session, select

from database import engine
from models.models import Product
from services.catalogue import deviner_type


def main(appliquer: bool) -> None:
    with Session(engine) as s:
        a_traiter = s.exec(select(Product).where(Product.type_article.is_(None)).order_by(Product.id)).all()
        if not a_traiter:
            print("Rien à faire : tous les produits ont un type.")
            return
        ecrits = 0
        for p in a_traiter:
            propose = deviner_type(p.name, p.category)
            print(f"#{p.id:<4} → {propose or 'À CHOISIR':<11} {p.name}  [{p.category}]")
            if appliquer and propose:
                p.type_article = propose
                s.add(p)
                ecrits += 1
        if appliquer:
            s.commit()
            print(f"{ecrits} produit(s) mis à jour ; {len(a_traiter) - ecrits} à choisir dans le dashboard.")
        else:
            print("Simulation : rien n'est écrit. Relancer avec --appliquer pour enregistrer.")


if __name__ == "__main__":
    main("--appliquer" in sys.argv)
