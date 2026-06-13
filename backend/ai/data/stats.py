from sqlmodel import Session, select
from database import engine
from models.models import Product, Settings

def get_exchange_rate() -> float:
    with Session(engine) as session:
        settings = session.exec(select(Settings)).first()
        return settings.exchange_rate_eur if settings else 4500.0

def get_stats(operation: str, filtre_categorie: str = "", filtre_genre: str = "") -> dict:
    exchange_rate = get_exchange_rate()
    
    with Session(engine) as session:
        query = select(Product)
        if filtre_categorie:
            query = query.where(Product.category.ilike(f"%{filtre_categorie}%"))
        if filtre_genre:
            query = query.where(Product.genre.ilike(f"%{filtre_genre}%"))
        produits = session.exec(query).all()

        if not produits:
            return {"resultat": 0, "detail": "Aucun produit trouvé"}

        # Injecter le taux dans chaque réponse prix
        def avec_euro(price_ar):
            return {"ar": price_ar, "eur": round(price_ar / exchange_rate)}

        if operation == "count":
            return {"resultat": len(produits), "label": "Nombre de produits"}
        if operation == "stock_total":
            return {"resultat": sum(p.stock_quantity for p in produits), "label": "Stock total"}
        if operation == "count_by_category":
            cats = {}
            for p in produits:
                cat = p.category or "Autre"
                if cat not in cats:
                    cats[cat] = {"count": 0, "produits": []}
                cats[cat]["count"] += 1
                cats[cat]["produits"].append(p.name)
            total = len(produits)
            return {"resultat": cats, "total": total, "label": "Variétés par catégorie", "exchange_rate": exchange_rate}
        if operation == "valeur_stock":
            val = sum(p.price_ar * p.stock_quantity for p in produits)
            return {"resultat": avec_euro(val), "label": "Valeur totale du stock"}
        if operation == "prix_moyen":
            moy = round(sum(p.price_ar for p in produits) / len(produits))
            return {"resultat": avec_euro(moy), "label": "Prix moyen"}
        if operation == "min_price":
            p_min = min(produits, key=lambda p: p.price_ar)
            return {"resultat": avec_euro(p_min.price_ar), "nom": p_min.name, "label": "Produit le moins cher", "exchange_rate": exchange_rate}
        if operation == "max_price":
            p_max = max(produits, key=lambda p: p.price_ar)
            return {"resultat": avec_euro(p_max.price_ar), "nom": p_max.name, "label": "Produit le plus cher", "exchange_rate": exchange_rate}
        if operation == "stock_faible":
            seuil = 3
            faibles = [{"nom": p.name, "stock": p.stock_quantity} for p in produits if 0 < p.stock_quantity <= seuil]
            return {"resultat": len(faibles), "produits": faibles, "label": f"Produits avec stock ≤ {seuil}"}
        if operation == "rupture":
            rupture = [{"nom": p.name} for p in produits if p.stock_quantity == 0 and not p.on_order]
            return {"resultat": len(rupture), "produits": rupture, "label": "Produits en rupture de stock"}
        if operation == "par_categorie":
            cats = {}
            for p in produits:
                cats[p.category or "Autre"] = cats.get(p.category or "Autre", 0) + 1
            return {"resultat": cats, "label": "Répartition par catégorie"}
        if operation == "par_genre":
            genres = {}
            for p in produits:
                genres[p.genre or "Non défini"] = genres.get(p.genre or "Non défini", 0) + 1
            return {"resultat": genres, "label": "Répartition par genre"}

        return {"erreur": f"Opération inconnue : {operation}"}