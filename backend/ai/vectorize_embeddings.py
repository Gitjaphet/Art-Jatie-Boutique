"""Re-vectorise tout le catalogue (texte seul). Lancement depuis /app : python -m ai.vectorize_embeddings"""
import sys
sys.path.append("/app")

import psycopg2
from dotenv import load_dotenv
from sqlmodel import Session, select

load_dotenv()

from database import engine
from models.models import Product
from ai.core.db import db_config
from ai.utils.vectorisation import vectoriser_produit


def vectoriser_tous_les_produits():
    with Session(engine) as session:
        produits = session.exec(select(Product)).all()
    print(f"→ {len(produits)} produits trouvés")

    erreurs = 0
    for p in produits:
        try:
            vectoriser_produit(p)
            print(f"  ✓ #{p.id} {p.name}")
        except Exception as e:
            erreurs += 1
            print(f"  ✗ #{p.id} {p.name} : {e}")

    with psycopg2.connect(**db_config) as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM product_embedding WHERE product_id NOT IN (SELECT id FROM product)")
            print(f"→ {cur.rowcount} vecteur(s) orphelin(s) supprimé(s)")
        conn.commit()

    print(f"✓ Terminé : {len(produits) - erreurs} vectorisé(s), {erreurs} erreur(s)")


if __name__ == "__main__":
    vectoriser_tous_les_produits()
