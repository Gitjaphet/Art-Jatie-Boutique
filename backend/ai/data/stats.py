# ai/data/stats.py
from sqlmodel import Session, select
from database import engine
from models.models import Product


def get_stats(
    operation: str,
    filtre_categorie: str = "",
    filtre_genre: str = "",
) -> dict:
    with Session(engine) as session:
        query = select(Product)

        if filtre_categorie:
            query = query.where(Product.category.ilike(f"%{filtre_categorie}%"))
        if filtre_genre:
            query = query.where(Product.genre.ilike(f"%{filtre_genre}%"))

        produits = session.exec(query).all()

        if not produits:
            return {"resultat": 0, "detail": "Aucun produit trouvé"}

        if operation == "count":
            return {"resultat": len(produits), "label": "Nombre de produits"}
        if operation == "stock_total":
            return {"resultat": sum(p.stock_quantity for p in produits), "label": "Stock total"}
        if operation == "valeur_stock":
            return {"resultat": sum(p.price_ar * p.stock_quantity for p in produits), "label": "Valeur totale du stock en Ar"}
        if operation == "prix_moyen":
            return {"resultat": round(sum(p.price_ar for p in produits) / len(produits)), "label": "Prix moyen en Ar"}
        if operation == "min_price":
            p_min = min(produits, key=lambda p: p.price_ar)
            return {"resultat": p_min.price_ar, "nom": p_min.name, "label": "Produit le moins cher"}
        if operation == "max_price":
            p_max = max(produits, key=lambda p: p.price_ar)
            return {"resultat": p_max.price_ar, "nom": p_max.name, "label": "Produit le plus cher"}
        if operation == "stock_faible":
            seuil = 3
            faibles = [{"nom": p.name, "stock": p.stock_quantity} for p in produits if 0 < p.stock_quantity <= seuil]
            return {"resultat": len(faibles), "produits": faibles, "label": f"Produits avec stock ≤ {seuil}"}
        if operation == "rupture":
            rupture = [{"nom": p.name} for p in produits if p.stock_quantity == 0 and not p.on_order]
            return {"resultat": len(rupture), "produits": rupture, "label": "Produits en rupture de stock"}
        if operation == "par_categorie":
            cats: dict[str, int] = {}
            for p in produits:
                cats[p.category or "Autre"] = cats.get(p.category or "Autre", 0) + 1
            return {"resultat": cats, "label": "Répartition par catégorie"}
        if operation == "par_genre":
            genres: dict[str, int] = {}
            for p in produits:
                genres[p.genre or "Non défini"] = genres.get(p.genre or "Non défini", 0) + 1
            return {"resultat": genres, "label": "Répartition par genre"}

        return {"erreur": f"Opération inconnue : {operation}"}