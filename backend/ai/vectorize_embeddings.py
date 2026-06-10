import sys
sys.path.append("/app")

import os
import requests
from dotenv import load_dotenv
from sqlmodel import Session, select
from database import engine
from models.models import Product
import psycopg2
from ai.core.db import db_config

load_dotenv()

# ── Jina Embedding v3 ──────────────────────────────────────────────────────
JINA_API_KEY = os.getenv("JINA_API_KEY")
JINA_URL     = "https://api.jina.ai/v1/embeddings"

def get_embedding(texte: str) -> list[float]:
    """Transforme un texte en vecteur 1024d via Jina Embedding v3."""
    response = requests.post(
        JINA_URL,
        headers={
            "Authorization": f"Bearer {JINA_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": "jina-embeddings-v3",
            "input": [texte],
            "task": "retrieval.passage",  # pour l'indexation des produits
            "dimensions": 1024,
        }
    )
    response.raise_for_status()
    return response.json()["data"][0]["embedding"]

# ── Construction du texte produit ──────────────────────────────────────────
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

# ── Vectorisation de tous les produits ────────────────────────────────────
def vectoriser_tous_les_produits():
    with Session(engine) as session:
        produits = session.exec(select(Product)).all()
        print(f"→ {len(produits)} produits trouvés\n")

    with psycopg2.connect(**db_config) as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM product_embedding;")
            for produit in produits:
                texte = construire_texte_produit(produit)
                print(f"Vectorisation : {produit.name}...")
                vecteur = get_embedding(texte)
                cur.execute(
                    """
                    INSERT INTO product_embedding (product_id, contenu, embedding)
                    VALUES (%s, %s, %s::vector)
                    """,
                    (produit.id, texte, str(vecteur))
                )
        conn.commit()

    print(f"\n✓ {len(produits)} produits vectorisés avec succès !")

if __name__ == "__main__":
    vectoriser_tous_les_produits()