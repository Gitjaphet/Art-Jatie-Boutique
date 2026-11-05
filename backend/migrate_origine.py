"""
migrate_origine.py — reprise UNIQUE des commandes existantes (colonne Order.origine).

La colonne est créée automatiquement au démarrage (database.sync_table_columns).
Ce script remplit `origine` pour les commandes antérieures, qui l'ont vide.

    python migrate_origine.py              # simulation : affiche les décisions, n'écrit rien
    python migrate_origine.py --appliquer  # écrit en base

Rejouable sans risque : il ne touche que les commandes dont l'origine est vide.
"""
import sys

from sqlmodel import Session, select

from database import engine
from models.models import Order
from services.commandes import FRAIS_LIVRAISON


def deduire(o: Order) -> str:
    if o.is_pos:
        return "caisse"
    if o.product_id is not None or o.delivery_zone == "a_confirmer":
        return "sur_mesure"
    if o.delivery_zone in FRAIS_LIVRAISON:
        return "panier"
    return "planning"  # zone libre saisie par l'équipe (« Sur place »…)


def main(appliquer: bool) -> None:
    with Session(engine) as s:
        a_traiter = s.exec(select(Order).where(Order.origine.is_(None)).order_by(Order.id)).all()
        if not a_traiter:
            print("Rien à faire : toutes les commandes ont une origine.")
            return
        for o in a_traiter:
            origine = deduire(o)
            print(f"#{o.id:<4} → {origine:<10} (zone={o.delivery_zone}, caisse={o.is_pos}, produit={o.product_id}) {o.client_name}")
            if appliquer:
                o.origine = origine
                s.add(o)
        if appliquer:
            s.commit()
            print(f"{len(a_traiter)} commande(s) mise(s) à jour.")
        else:
            print("Simulation : rien n'est écrit. Relancer avec --appliquer pour enregistrer.")


if __name__ == "__main__":
    main("--appliquer" in sys.argv)
