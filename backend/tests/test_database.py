"""La synchronisation des colonnes doit fonctionner sur la table « order » (mot réservé SQL)."""
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.pool import StaticPool

import models.models  # noqa: F401 — enregistre les tables dans SQLModel.metadata
from database import sync_table_columns


def test_sync_ajoute_les_colonnes_a_la_table_order():
    moteur = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
    with moteur.begin() as c:
        c.execute(text('CREATE TABLE "order" (id INTEGER PRIMARY KEY)'))   # la panne du 5 nov. reproduite

    ajoutees = sync_table_columns(moteur)

    colonnes = {col["name"] for col in inspect(moteur).get_columns("order")}
    assert "origine" in colonnes and "client_name" in colonnes
    assert "order.origine" in ajoutees
    assert sync_table_columns(moteur) == []   # deuxième passage : rien à ajouter
