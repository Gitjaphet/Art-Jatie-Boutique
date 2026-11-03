# tests/test_commandes.py — le serveur calcule les montants, le navigateur ne dit que « quoi »
from models.models import Product
from core.auth import get_admin_facultatif


def _produit(session):
    p = Product(name="Robe Test", slug="robe-test-cmd", tag="T", genre="Femme", category="TENUES",
                price_ar=50000, image="x", colors="Rouge,Blanc", sizes="S,M", stock_quantity=2)
    session.add(p)
    session.commit()
    session.refresh(p)
    return p


CLIENTE = {"client_name": "Voahangy", "client_email": "", "client_whatsapp": "034 12 345 67"}


def _panier(p, **extra):
    return {**CLIENTE, "cart_items": [{"id": p.id, "name": "x", "price": 1, "quantity": 2, "image": ""}],
            "delivery_zone": "darsalam", "delivery_cost": 0, "delivery_label": "Darsalam",
            "subtotal_ar": 2, "total_ar": 2, **extra}


def test_les_montants_du_navigateur_sont_ignores(client, session):
    p = _produit(session)
    r = client.post("/orders/", json=_panier(p))
    assert r.status_code == 200, r.text
    d = r.json()
    assert (d["subtotal_ar"], d["delivery_cost"], d["total_ar"]) == (100000, 5000, 105000)
    assert d["client_whatsapp"] == "0341234567"


def test_code_promo_verifie_par_le_serveur(client, session):
    p = _produit(session)
    ok = client.post("/orders/", json=_panier(p, promo_code="artjatie10", delivery_zone="nosybe_ville"))
    assert ok.status_code == 200, ok.text
    assert (ok.json()["discount_ar"], ok.json()["total_ar"]) == (10000, 90000)
    assert client.post("/orders/", json=_panier(p, promo_code="FAUX")).status_code == 422


def test_zone_inconnue_refusee(client, session):
    p = _produit(session)
    assert client.post("/orders/", json=_panier(p, delivery_zone="lune")).status_code == 422


def test_commander_sur_mesure_produit_unique(client, session):
    p = _produit(session)
    r = client.post("/orders/", json={**CLIENTE, "product_id": p.id, "product_price_ar": 1,
                                      "selected_size": "S, M", "selected_color": "Rouge"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert (d["total_ar"], d["delivery_zone"], d["selected_size"]) == (50000, "a_confirmer", "S, M")


def test_taille_non_proposee_refusee(client, session):
    p = _produit(session)
    r = client.post("/orders/", json={**CLIENTE, "product_id": p.id, "selected_size": "XXL"})
    assert r.status_code == 422


def test_commande_saisie_par_admin_garde_son_prix(client, session):
    client.app.dependency_overrides[get_admin_facultatif] = lambda: {"is_admin": True}
    try:
        r = client.post("/orders/", json={
            "client_name": "Cliente atelier", "client_email": "surplace@artjatie.mg", "client_whatsapp": "0000000000",
            "cart_items": [{"id": 0, "name": "Robe sur mesure", "price": 80000, "quantity": 1, "image": ""}],
            "delivery_zone": "Sur place", "delivery_cost": 0, "delivery_label": "Retrait sur place",
            "subtotal_ar": 80000, "total_ar": 80000})
    finally:
        client.app.dependency_overrides.pop(get_admin_facultatif, None)
    assert r.status_code == 200, r.text
    assert r.json()["total_ar"] == 80000
