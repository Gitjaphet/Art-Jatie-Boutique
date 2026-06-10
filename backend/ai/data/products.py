# ai/data/products.py
import os
import time
import logging
import requests
import psycopg2
from sqlmodel import Session, select, or_, col
from database import engine
from models.models import Product
from ai.core.db import db_config


def get_products(
    produit: str = "",
    couleur: str = "",
    categorie: str = "",
    genre: str = "",
    prix_min: int = 0,
    prix_max: int = 0,
    sort: str = "",
    limit: int = 0,
) -> list[dict]:
    with Session(engine) as session:
        query = select(Product)

        if produit:
            query = query.where(
                or_(
                    Product.name.ilike(f"%{produit}%"),
                    Product.description.ilike(f"%{produit}%"),
                )
            )
        if couleur:
            query = query.where(Product.colors.ilike(f"%{couleur}%"))
        if categorie:
            query = query.where(Product.category.ilike(f"%{categorie}%"))
        if genre:
            query = query.where(Product.genre.ilike(f"%{genre}%"))
        if prix_min > 0:
            query = query.where(Product.price_ar >= prix_min)
        if prix_max > 0:
            query = query.where(Product.price_ar <= prix_max)

        if sort == "price_asc":
            query = query.order_by(Product.price_ar.asc())
        elif sort == "price_desc":
            query = query.order_by(Product.price_ar.desc())
        elif sort == "name_asc":
            query = query.order_by(Product.name.asc())

        if limit > 0:
            query = query.limit(limit)

        produits = session.exec(query).all()

        return [
            {
                "id": p.id,
                "nom": p.name,
                "categorie": p.category,
                "genre": p.genre,
                "prix_ar": p.price_ar,
                "ancien_prix_ar": p.old_price_ar,
                "couleurs": p.colors,
                "tailles": p.sizes,
                "stock": p.stock_quantity,
                "badge": p.badge,
                "sur_commande": p.on_order,
                "description": p.description or "",
            }
            for p in produits
        ]


def recherche_semantique(texte: str, top_k: int = 5) -> list[dict]:
    t0 = time.time()
    try:
        response = requests.post(
            "https://api.jina.ai/v1/embeddings",
            headers={
                "Authorization": f"Bearer {os.getenv('JINA_API_KEY')}",
                "Content-Type": "application/json",
            },
            json={
                "model": "jina-embeddings-v3",
                "input": [texte],
                "task": "retrieval.query",
                "dimensions": 1024,
            },
            timeout=15,
        )
        if response.status_code != 200:
            logging.error(f"[JINA] Erreur API {response.status_code}")
            return []

        vecteur = response.json()["data"][0]["embedding"]
        vecteur_str = "[" + ",".join(map(str, vecteur)) + "]"
    except Exception as e:
        logging.error(f"[JINA] Exception: {str(e)}")
        return []

    logging.info(f"[JINA] Embedding en {time.time() - t0:.2f}s")

    t1 = time.time()
    try:
        with psycopg2.connect(**db_config) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT pe.product_id, pe.contenu,
                           1 - (pe.embedding <=> %s::vector) AS score
                    FROM product_embedding pe
                    ORDER BY pe.embedding <=> %s::vector
                    LIMIT %s
                    """,
                    (vecteur_str, vecteur_str, top_k),
                )
                rows = cur.fetchall()
    except Exception as e:
        logging.error(f"[PGVECTOR] Exception: {str(e)}")
        return []

    logging.info(f"[PGVECTOR] Recherche en {time.time() - t1:.2f}s")

    if not rows:
        return []

    product_ids = [r[0] for r in rows]
    scores = {r[0]: round(r[2], 3) for r in rows}

    with Session(engine) as session:
        produits = session.exec(
            select(Product).where(col(Product.id).in_(product_ids))
        ).all()

    return [
        {
            "id": p.id,
            "nom": p.name,
            "categorie": p.category,
            "genre": p.genre,
            "prix_ar": p.price_ar,
            "ancien_prix_ar": p.old_price_ar,
            "couleurs": p.colors,
            "tailles": p.sizes,
            "stock": p.stock_quantity,
            "badge": p.badge,
            "sur_commande": p.on_order,
            "description": p.description or "",
            "score_semantique": scores.get(p.id, 0),
        }
        for p in produits
    ]