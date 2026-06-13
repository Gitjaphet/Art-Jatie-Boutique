"""
utils/vectorisation.py
───────────────────────
Vectorisation automatique d'un produit (texte + image) via Jina Embeddings v3.
Sauvegarde dans la table product_embedding (pgvector).

Appelé automatiquement après chaque create / update produit dans le router.
"""

import psycopg2
from typing import Optional
from models.models import Product
from utils.embedding import get_combined_embedding

# ── Import de la config DB psycopg2 (même que dans ton script manuel) ──────
from ai.core.db import db_config


def construire_texte_produit(p: Product) -> str:
    """
    Construit le texte représentatif du produit pour l'embedding.
    Inclut toutes les métadonnées utiles à la recherche sémantique.
    """
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
    """
    Génère l'embedding combiné (texte + image) pour un produit
    et l'upserte dans la table product_embedding.

    Stratégie d'upsert :
      - Si une ligne existe déjà pour ce product_id → on la met à jour
      - Sinon → on l'insère

    Args:
        product: instance Product SQLModel (après commit, donc id disponible)
    """
    texte = construire_texte_produit(product)

    # L'image principale (URL publique R2)
    image_url: Optional[str] = product.image if product.image else None

    print(f"[vectorisation] Produit #{product.id} — {product.name}")
    print(f"  → Texte : {texte[:80]}...")
    print(f"  → Image : {image_url or 'aucune'}")

    vecteur = get_combined_embedding(texte, image_url)

    with psycopg2.connect(**db_config) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO product_embedding (product_id, contenu, embedding)
                VALUES (%s, %s, %s::vector)
                ON CONFLICT (product_id)
                DO UPDATE SET
                    contenu   = EXCLUDED.contenu,
                    embedding = EXCLUDED.embedding
                """,
                (product.id, texte, str(vecteur)),
            )
        conn.commit()

    print(f"  ✓ Embedding sauvegardé ({len(vecteur)}d)")


def supprimer_embedding_produit(product_id: int) -> None:
    """
    Supprime l'embedding d'un produit lors de sa suppression.
    Évite les orphelins dans product_embedding.
    """
    with psycopg2.connect(**db_config) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM product_embedding WHERE product_id = %s",
                (product_id,),
            )
        conn.commit()
    print(f"[vectorisation] Embedding produit #{product_id} supprimé.")