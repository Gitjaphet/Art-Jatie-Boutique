"""
ai/utils/vectorisation.py
Vectorisation d'un produit (texte seul) dans product_embedding.
Appelé après chaque création / modification de produit, et par vectorize_embeddings.py pour tout le catalogue.
"""
import logging
import psycopg2

from models.models import Product
from ai.core.db import db_config
from ai.utils.embedding import get_text_embedding


def construire_texte_produit(p: Product) -> str:
    parties = [
        f"Nom : {p.name}",
        f"Catégorie : {p.category}",
        f"Genre : {p.genre}",
        f"Couleurs : {p.colors}",
        f"Tailles : {p.sizes}",
    ]
    if p.description:
        parties.append(f"Description : {p.description}")
    if p.badge:
        parties.append(f"Badge : {p.badge}")
    return " | ".join(parties)


def vectoriser_produit(product: Product) -> None:
    texte = construire_texte_produit(product)
    vecteur = get_text_embedding(texte)
    with psycopg2.connect(**db_config) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO product_embedding (product_id, contenu, embedding)
                VALUES (%s, %s, %s::vector)
                ON CONFLICT (product_id)
                DO UPDATE SET contenu = EXCLUDED.contenu, embedding = EXCLUDED.embedding
                """,
                (product.id, texte, str(vecteur)),
            )
        conn.commit()
    logging.info(f"[VECTORISATION] Produit #{product.id} ({product.name}) vectorisé")
