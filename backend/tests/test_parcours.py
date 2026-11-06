"""Brique 2a : commande guidée dans le chat Jatie (sans modèle)."""
from sqlmodel import select

from ai.commande.parcours import ANNULER, MODIFIER, OUI, demarrer, repondre
from models.models import Order


def _produit(session, product, stock=2, sur_commande=False):
    product.sizes, product.colors = "S, M", "Rose, Blanc"
    product.stock_quantity, product.on_order = stock, sur_commande
    session.add(product); session.commit(); session.refresh(product)
    return product


def _suivre(session, r, *messages):
    for m in messages:
        r = repondre(session, r["brouillon"], m)
    return r


def test_premiere_question_propose_les_tailles(session, product):
    r = demarrer(session, _produit(session, product).id)
    assert r["brouillon"]["etape"] == "taille" and r["suggestions"] == ["S", "M"]


def test_parcours_complet_cree_la_commande(session, product):
    p = _produit(session, product)
    r = _suivre(session, demarrer(session, p.id), "s", "rose", "Lalao Rabe", "034 12 345 67")
    assert r["brouillon"]["etape"] == "zone"
    r = _suivre(session, r, next(s for s in r["suggestions"] if "Darsalam" in s))
    assert r["brouillon"]["etape"] == "recap" and r["suggestions"] == [OUI, MODIFIER, ANNULER]
    r = _suivre(session, r, OUI)
    o = session.get(Order, r["commande"]["id"])
    assert (o.origine, o.delivery_cost, o.total_ar) == ("panier", 5000, p.price_ar + 5000)
    assert (o.selected_size, o.selected_color, o.client_whatsapp) == ("S", "Rose", "0341234567")
    assert r["brouillon"] is None


def test_reponse_invalide_repose_la_question(session, product):
    r = _suivre(session, demarrer(session, _produit(session, product).id), "XXL")
    assert r["brouillon"]["etape"] == "taille" and r["suggestions"] == ["S", "M"]


def test_numero_invalide_refuse(session, product):
    r = _suivre(session, demarrer(session, _produit(session, product).id), "M", "Blanc", "Lalao", "123")
    assert r["brouillon"]["etape"] == "whatsapp"


def test_annuler_a_tout_moment(session, product):
    r = _suivre(session, demarrer(session, _produit(session, product).id), "M", ANNULER)
    assert r["brouillon"] is None and session.exec(select(Order)).all() == []


def test_modifier_revient_au_recapitulatif(session, product):
    r = _suivre(session, demarrer(session, _produit(session, product).id), "S", "Rose", "Lalao", "0341234567")
    r = _suivre(session, r, r["suggestions"][0], MODIFIER, "Taille", "M")
    assert r["brouillon"]["etape"] == "recap" and r["brouillon"]["taille"] == "M"


def test_sur_mesure_annonce_l_avance_et_se_classe_sur_mesure(session, product):
    p = _produit(session, product, stock=0, sur_commande=True)
    r = _suivre(session, demarrer(session, p.id), "S", "Rose", "Lalao", "0341234567")
    r = _suivre(session, r, r["suggestions"][0])
    assert "avance de 50 %" in r["texte"]
    r = _suivre(session, r, OUI)
    assert session.get(Order, r["commande"]["id"]).origine == "sur_mesure"


def test_produit_epuise_refuse(session, product):
    r = demarrer(session, _produit(session, product, stock=0).id)
    assert r["brouillon"] is None
