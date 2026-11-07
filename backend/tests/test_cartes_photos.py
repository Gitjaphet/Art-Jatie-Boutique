from ai.data import cartes


def test_cartes_transmettent_les_photos(monkeypatch):
    monkeypatch.setattr(cartes.stats, "get_exchange_rate", lambda: 5000)
    produit = {"id": 1, "nom": "Robe", "prix_ar": 40000, "slug": "robe", "stock": 0, "sur_commande": True,
               "image": "a.jpg", "images": [f"{i}.jpg" for i in range(12)]}
    carte = cartes.construire_cartes([produit])[0]
    assert carte["images"] == [f"{i}.jpg" for i in range(8)]  # 8 photos maximum


def test_une_seule_photo_sans_liste(monkeypatch):
    monkeypatch.setattr(cartes.stats, "get_exchange_rate", lambda: 5000)
    produit = {"id": 2, "nom": "Sac", "prix_ar": 30000, "slug": "sac", "stock": 1, "image": "s.jpg"}
    assert cartes.construire_cartes([produit])[0]["images"] == ["s.jpg"]
