"""
ai/exemples/recherche.py
Les exemples de vente les plus proches d'un message de cliente (ton côtier d'Art Jatie).
Ne casse jamais la conversation : sans Jina ou sans base, la vendeuse continue sans exemple.
Essai depuis /app : python -m ai.exemples.recherche "misy tenu de soirée ve ?"
"""
import logging
import sys

import psycopg2

from ai.core.db import db_config
from ai.exemples.importer import TACHE
from ai.utils.embedding import get_text_embedding


def trouver_exemples(message: str, k: int = 4) -> list[dict]:
    try:
        vecteur = str(get_text_embedding(message, task=TACHE))
    except Exception as e:
        logging.error(f"[EXEMPLES] Embedding indisponible : {e}")
        return []
    try:
        conn = psycopg2.connect(**db_config)
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT cliente, reponse_precedente, reponse, 1 - (embedding <=> %s::vector) AS score
                    FROM exemple_vente ORDER BY embedding <=> %s::vector LIMIT %s
                    """,
                    (vecteur, vecteur, k),
                )
                colonnes = ("cliente", "reponse_precedente", "reponse", "score")
                return [dict(zip(colonnes, r)) for r in cur.fetchall()]
        finally:
            conn.close()
    except Exception as e:
        logging.error(f"[EXEMPLES] Recherche impossible : {e}")
        return []


if __name__ == "__main__":
    for ex in trouver_exemples(" ".join(sys.argv[1:])):
        print(f"\n[{ex['score']:.2f}] CLIENTE : {ex['cliente'][:150]}\n       ART JATIE : {ex['reponse'][:150]}")
