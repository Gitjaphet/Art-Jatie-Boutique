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


# ── Vérification publique du code promo (GET /orders/promo/{code}) ──
from core.limiter import limiter
from services.commandes import taux_promo


def test_taux_promo_source_unique():
    assert taux_promo(" artjatie10 ") == 0.10      # casse et espaces ignorés
    assert taux_promo("FAUX") is None
    assert taux_promo("") is None and taux_promo(None) is None


def test_route_promo_valide(client):
    limiter.reset()
    r = client.get("/orders/promo/artjatie10")
    assert r.status_code == 200
    assert r.json() == {"valide": True, "code": "ARTJATIE10", "taux": 0.10}


def test_route_promo_invalide(client):
    limiter.reset()
    r = client.get("/orders/promo/FAUX")
    assert r.status_code == 200
    assert r.json() == {"valide": False, "code": "FAUX", "taux": 0}


def test_route_promo_limitee(client):
    limiter.reset()
    codes = [client.get(f"/orders/promo/ESSAI{i}").status_code for i in range(11)]
    limiter.reset()
    assert codes[:10] == [200] * 10 and codes[10] == 429


# ── Origine de la commande (onglet du dashboard) ──
import pytest
from services.commandes import creer_commande as _creer, Ligne as _Ligne

_CLIENT = {"name": "Test Origine", "whatsapp": "0340000000"}


def test_origine_enregistree(session, product):
    o = _creer(session, origine="sur_mesure", client=_CLIENT,
               lignes=[_Ligne(product_id=product.id, quantite=1)], zone="a_confirmer")
    assert o.origine == "sur_mesure"


def test_origine_inconnue_refusee(session, product):
    with pytest.raises(ValueError):
        _creer(session, origine="inconnue", client=_CLIENT,
               lignes=[_Ligne(product_id=product.id, quantite=1)], zone="tana")


# ── Libellés de livraison ──
from services.commandes import FRAIS_LIVRAISON, LIBELLES_ZONE


def test_chaque_zone_a_son_libelle():
    assert set(LIBELLES_ZONE) == set(FRAIS_LIVRAISON)


def test_libelle_lisible_par_defaut(session, product):
    o = _creer(session, origine="sur_mesure", client=_CLIENT,
               lignes=[_Ligne(product_id=product.id, quantite=1)], zone="a_confirmer")
    assert o.delivery_label == "À convenir avec l'équipe"


# ── Planning (saisie de l'équipe) ──
def test_planning_refuse_un_prix_nul(client):
    from main import app
    from core.auth import get_admin_facultatif
    app.dependency_overrides[get_admin_facultatif] = lambda: {"sub": "admin", "is_admin": True}
    try:
        r = client.post("/orders/", json={"client_name": "Atelier", "client_email": "a@artjatie.mg",
                                          "client_whatsapp": "0340000000", "total_ar": 0})
    finally:
        app.dependency_overrides.pop(get_admin_facultatif, None)
    assert r.status_code == 422


def test_planning_masque_les_commandes_annulees(client, session, admin):
    from models.models import Order
    for nom, statut in (("Garde", "Confirmée"), ("Masque", "Annulée")):
        session.add(Order(client_name=nom, client_email="x@artjatie.mg", client_whatsapp="0340000000",
                          status=statut, planning_status="a_fabriquer", origine="planning"))
    session.commit()
    noms = [o["client_name"] for o in client.get("/orders/planning").json()]
    assert "Garde" in noms and "Masque" not in noms


def _post_admin(client, **corps):
    from main import app
    from core.auth import get_admin_facultatif
    app.dependency_overrides[get_admin_facultatif] = lambda: {"sub": "admin", "is_admin": True}
    try:
        return client.post("/orders/", json={"client_name": "Atelier", "client_email": "a@artjatie.mg",
                                             "client_whatsapp": "0340000000", **corps})
    finally:
        app.dependency_overrides.pop(get_admin_facultatif, None)


def test_planning_enregistre_l_acompte(client):
    r = _post_admin(client, total_ar=40000, acompte=20000)
    assert r.status_code == 200 and r.json()["acompte"] == 20000


def test_planning_refuse_un_acompte_superieur_au_prix(client):
    assert _post_admin(client, total_ar=40000, acompte=50000).status_code == 422
