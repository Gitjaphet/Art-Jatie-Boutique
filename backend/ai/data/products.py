# ai/data/products.py
import logging

import psycopg2
from sqlmodel import Session, select, or_
from database import engine
from models.models import Product
from services.catalogue import familles
from ai.core.db import db_config
from ai.utils.embedding import get_text_embedding
from ai.utils.texte import BONUS_MOT_NOM, BONUS_MOT_AUTRE, mots as _mots, score_lexical  # noqa: F401

# Score final minimum (vecteur + mots) pour qu'un produit soit proposé.
# Calibré le 02/11/2026 sur 8 requêtes test ; à ajuster avec les logs [RECHERCHE].
SEUIL_PERTINENCE = 0.35


def _produit_dict(p: Product) -> dict:
    return {
        "id": p.id,
        "nom": p.name,
        "slug": p.slug,
        "categorie": p.category,
        "genre": p.genre,
        "prix_ar": p.price_ar,
        "ancien_prix_ar": p.old_price_ar,
        "couleurs": p.colors,
        "familles": familles(p.colors),
        "type_article": p.type_article,
        "tailles": p.sizes,
        "stock": p.stock_quantity,
        "badge": p.badge,
        "sur_commande": p.on_order,
        "description": p.description or "",
        "image": p.image or "",
    }


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
            query = query.where(or_(Product.name.ilike(f"%{produit}%"), Product.description.ilike(f"%{produit}%")))
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

        return [_produit_dict(p) for p in session.exec(query).all()]


# ── Recherche hybride : sens (vecteurs Jina) + mots exacts ────────────────

def _scores_vectoriels(texte: str) -> dict[int, float]:
    """Similarité de la requête avec chaque produit. Vide si Jina ou la base échouent (la recherche par mots continue)."""
    try:
        vecteur = get_text_embedding(texte, task="retrieval.query")
        with psycopg2.connect(**db_config) as conn, conn.cursor() as cur:
            cur.execute(
                "SELECT product_id, 1 - (embedding <=> %s::vector) FROM product_embedding",
                (str(vecteur),),
            )
            return {pid: float(score) for pid, score in cur.fetchall()}
    except Exception as e:
        logging.error(f"[RECHERCHE] Scores vectoriels indisponibles : {e}")
        return {}


def recherche_semantique(texte: str, top_k: int = 5) -> list[dict]:
    scores_vec = _scores_vectoriels(texte)
    mots_requete = _mots(texte)

    # Catalogue petit : on évalue tous les produits. Au-delà de ~1000 produits, présélectionner en SQL.
    with Session(engine) as session:
        produits = session.exec(select(Product)).all()

    resultats = []
    for p in produits:
        lex = score_lexical(mots_requete, p.name, f"{p.category} {p.description or ''} {p.colors}")
        total = scores_vec.get(p.id, 0.0) + lex
        if total >= SEUIL_PERTINENCE:
            resultats.append((total, p))

    resultats.sort(key=lambda r: r[0], reverse=True)
    resultats = resultats[:top_k]
    logging.info(f"[RECHERCHE] {texte!r} -> " + (", ".join(f"#{p.id}:{s:.2f}" for s, p in resultats) or "aucun résultat"))

    return [{**_produit_dict(p), "score_semantique": round(s, 3)} for s, p in resultats]
