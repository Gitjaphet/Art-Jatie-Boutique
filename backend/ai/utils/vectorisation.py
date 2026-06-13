"""
ai/utils/vectorisation.py
──────────────────────────
Vectorisation automatique d'un produit :
  - product_embedding       → vecteur combiné texte+image (recherche textuelle)
  - product_image_embedding → vecteur image seule (recherche par image)

Appelé automatiquement après chaque create / update produit dans le router.
"""

import psycopg2
from typing import Optional
from models.models import Product
from ai.utils.embedding import get_combined_embedding, get_text_embedding, get_image_embedding

from ai.core.db import db_config


def construire_texte_produit(p: Product) -> str:
    """
    Construit le texte représentatif du produit pour l'embedding.
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
    Génère et sauvegarde deux embeddings pour un produit :

    1. product_embedding       → texte + image combinés (pour recherche par mots)
    2. product_image_embedding → image seule (pour recherche par photo)

    Si pas d'image → uniquement product_embedding (texte seul).
    """
    texte = construire_texte_produit(product)
    image_url: Optional[str] = product.image if product.image else None

    print(f"[vectorisation] Produit #{product.id} — {product.name}")
    print(f"  → Texte : {texte[:80]}...")
    print(f"  → Image : {image_url or 'aucune'}")

    # ── 1. Embedding combiné texte+image ──────────────────────────────────
    vecteur_combine = get_combined_embedding(texte, image_url)

    # ── 2. Embedding image seule (seulement si image disponible) ──────────
    vecteur_image = None
    if image_url:
        try:
            vecteur_image = get_image_embedding(image_url)
            print(f"  → Image embedding : OK ({len(vecteur_image)}d)")
        except Exception as e:
            print(f"  ⚠ Image embedding échoué : {e}")

    with psycopg2.connect(**db_config) as conn:
        with conn.cursor() as cur:

            # ── Upsert product_embedding (texte+image combiné) ────────────
            cur.execute(
                """
                INSERT INTO product_embedding (product_id, contenu, embedding)
                VALUES (%s, %s, %s::vector)
                ON CONFLICT (product_id)
                DO UPDATE SET
                    contenu   = EXCLUDED.contenu,
                    embedding = EXCLUDED.embedding
                """,
                (product.id, texte, str(vecteur_combine)),
            )

            # ── Upsert product_image_embedding (image seule) ──────────────
            if vecteur_image:
                cur.execute(
                    """
                    INSERT INTO product_image_embedding (product_id, image_url, embedding)
                    VALUES (%s, %s, %s::vector)
                    ON CONFLICT (product_id)
                    DO UPDATE SET
                        image_url = EXCLUDED.image_url,
                        embedding = EXCLUDED.embedding
                    """,
                    (product.id, image_url, str(vecteur_image)),
                )

        conn.commit()

    print(f"  ✓ product_embedding mis à jour")
    if vecteur_image:
        print(f"  ✓ product_image_embedding mis à jour")
    else:
        print(f"  ℹ product_image_embedding ignoré (pas d'image valide)")