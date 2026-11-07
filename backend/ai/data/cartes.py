# ai/data/cartes.py
"""Cartes produit pour le widget, construites par le code : aucune invention possible, zéro token."""
from ai.data import stats

MAX_CARTES = 5
MAX_PHOTOS = 8  # galerie de la carte dans le chat


def construire_cartes(produits: list[dict]) -> list[dict]:
    if not produits:
        return []
    taux = stats.get_exchange_rate()
    cartes = []
    for p in produits[:MAX_CARTES]:
        stock = p.get("stock") or 0
        if stock > 0:
            dispo = f"En stock ({stock} pièce{'s' if stock > 1 else ''})"
        elif p.get("sur_commande"):
            dispo = "Sur commande"  # délai exact sur la fiche produit
        else:
            dispo = "Épuisé"
        cartes.append({
            "id": p["id"],
            "nom": p["nom"],
            "prix_ar": p["prix_ar"],
            "prix_eur": round(p["prix_ar"] / taux) if taux else None,
            "ancien_prix_ar": p.get("ancien_prix_ar"),
            "image": p.get("image") or "",
            "images": (p.get("images") or ([p["image"]] if p.get("image") else []))[:MAX_PHOTOS],
            "url": f"/produit/{p['slug']}" if p.get("slug") else "",
            "disponibilite": dispo,
        })
    return cartes


def texte_cartes(cartes: list[dict], alternatives: bool = False) -> str:
    n = len(cartes)
    if n == 0:
        return ("Je n'ai pas trouvé de modèle correspondant dans notre boutique pour le moment. "
                "Nos créations au crochet (tenues, maillots, sacs, accessoires) peuvent aussi être réalisées sur mesure : "
                "dites-moi ce qui vous ferait plaisir, ou envoyez-moi une photo 💕")
    if alternatives:
        return "Ce modèle n'est plus disponible 😔 Voici des pièces proches qui pourraient vous plaire :"
    return "Voici le modèle qui pourrait vous plaire 😊" if n == 1 else f"Voici {n} modèles qui pourraient vous plaire 😊"
