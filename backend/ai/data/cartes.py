# ai/data/cartes.py
"""Cartes produit pour le widget, construites par le code : aucune invention possible, zéro token."""
from ai.data import stats

MAX_CARTES = 5


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
            dispo = "Sur commande · 7 jours"
        else:
            dispo = "Épuisé"
        cartes.append({
            "id": p["id"],
            "nom": p["nom"],
            "prix_ar": p["prix_ar"],
            "prix_eur": round(p["prix_ar"] / taux) if taux else None,
            "ancien_prix_ar": p.get("ancien_prix_ar"),
            "image": p.get("image") or "",
            "url": f"/produit/{p['slug']}" if p.get("slug") else "",
            "disponibilite": dispo,
        })
    return cartes


def texte_cartes(cartes: list[dict], alternatives: bool = False) -> str:
    n = len(cartes)
    if n == 0:
        return ("Nous n'avons pas ce modèle pour le moment, mais nous pouvons le créer sur mesure rien que pour vous ! "
                "Dites-moi la taille et la couleur souhaitées, ou envoyez-moi une photo du modèle 💕")
    if alternatives:
        return "Ce modèle n'est plus disponible 😔 Voici des pièces proches qui pourraient vous plaire :"
    return "Voici le modèle qui pourrait vous plaire 😊" if n == 1 else f"Voici {n} modèles qui pourraient vous plaire 😊"
