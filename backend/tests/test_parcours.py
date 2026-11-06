"""Brique 2a : commande guidée dans le chat Jatie (sans modèle)."""
from sqlmodel import select

from ai.commande.parcours import (
    ANNULER, EN_STOCK, MENSURATIONS, MODIFIER, OUI, SUR_MESURE, demarrer, repondre,
)
from models.models import Order


def _produit(session, product, stock=2, sur_commande=False):
    product.sizes, product.colors = "S, M", "Rose, Blanc"
    product.stock_quantity, product.on_order = stock, sur_commande
    session.add(product); session.commit(); session.refresh(product)
    return product


def _ouvrir(session, product_id):
    """Bouton « Commander » ; pour une pièce en stock, choisit « Celle-ci, en stock »."""
    r = demarrer(session, product_id)
    if r["brouillon"] and r["brouillon"]["etape"] == "mode":
        r = repondre(session, r["brouillon"], EN_STOCK)
    return r


def _suivre(session, r, *messages):
    for m in messages:
        r = repondre(session, r["brouillon"], m)
    return r


def test_premiere_question_propose_les_tailles(session, product):
    r = _ouvrir(session, _produit(session, product).id)
    assert r["brouillon"]["etape"] == "taille" and r["suggestions"] == ["S", "M"]


def test_parcours_complet_cree_la_commande(session, product):
    p = _produit(session, product)
    r = _suivre(session, _ouvrir(session, p.id), "s", "rose", "Lalao Rabe", "034 12 345 67")
    assert r["brouillon"]["etape"] == "zone"
    r = _suivre(session, r, next(s for s in r["suggestions"] if "Darsalam" in s))
    assert r["brouillon"]["etape"] == "recap" and r["suggestions"] == [OUI, MODIFIER, ANNULER]
    r = _suivre(session, r, OUI)
    o = session.get(Order, r["commande"]["id"])
    assert (o.origine, o.delivery_cost, o.total_ar) == ("panier", 5000, p.price_ar + 5000)
    assert (o.selected_size, o.selected_color, o.client_whatsapp) == ("S", "Rose", "0341234567")
    assert r["brouillon"] is None


def test_reponse_invalide_repose_la_question(session, product):
    r = _suivre(session, _ouvrir(session, _produit(session, product).id), "XXL")
    assert r["brouillon"]["etape"] == "taille" and r["suggestions"] == ["S", "M"]


def test_numero_invalide_refuse(session, product):
    r = _suivre(session, _ouvrir(session, _produit(session, product).id), "M", "Blanc", "Lalao", "123")
    assert r["brouillon"]["etape"] == "whatsapp"


def test_annuler_a_tout_moment(session, product):
    r = _suivre(session, _ouvrir(session, _produit(session, product).id), "M", ANNULER)
    assert r["brouillon"] is None and session.exec(select(Order)).all() == []


def test_modifier_revient_au_recapitulatif(session, product):
    r = _suivre(session, _ouvrir(session, _produit(session, product).id), "S", "Rose", "Lalao", "0341234567")
    r = _suivre(session, r, r["suggestions"][0], MODIFIER, "Taille", "M")
    assert r["brouillon"]["etape"] == "recap" and r["brouillon"]["taille"] == "M"


def test_sur_mesure_annonce_l_avance_et_se_classe_sur_mesure(session, product):
    p = _produit(session, product, stock=0, sur_commande=True)
    r = _suivre(session, _ouvrir(session, p.id), "S", "Rose", "Lalao", "0341234567")
    r = _suivre(session, r, r["suggestions"][0])
    assert "avance de 50 %" in r["texte"]
    r = _suivre(session, r, OUI)
    assert session.get(Order, r["commande"]["id"]).origine == "sur_mesure"


def test_modele_epuise_propose_le_sur_mesure(session, product):
    r = demarrer(session, _produit(session, product, stock=0).id)
    assert r["brouillon"]["mode"] == "sur_mesure" and r["brouillon"]["etape"] == "taille"
    assert MENSURATIONS in r["suggestions"]


# ── Brique 2b : texte libre (faux extracteur, aucun appel réel au modèle) ──
def _faux(champs, appels=None):
    def extraire(message, tailles, couleurs, zones):
        if appels is not None:
            appels.append(message)
        return champs
    return extraire


def test_texte_libre_remplit_plusieurs_etapes(session, product):
    r = _ouvrir(session, _produit(session, product).id)
    champs = {"taille": "M", "couleur": "Rose", "client_name": "Lalao",
              "client_whatsapp": "034 12 345 67", "zone": "darsalam"}
    r = repondre(session, r["brouillon"], "en M rose pour Lalao, 034 12 345 67, à Darsalam", extraire=_faux(champs))
    b = r["brouillon"]
    assert b["etape"] == "recap"
    assert (b["taille"], b["couleur"], b["client_whatsapp"], b["zone"]) == ("M", "Rose", "0341234567", "darsalam")


def test_valeur_extraite_invalide_ignoree(session, product):
    r = _ouvrir(session, _produit(session, product).id)
    r = repondre(session, r["brouillon"], "du XL en rose", extraire=_faux({"taille": "XL", "couleur": "Rose"}))
    b = r["brouillon"]
    assert b["etape"] == "taille" and b["taille"] is None and b["couleur"] == "Rose"


def test_extraction_n_ecrase_pas_une_reponse_deja_donnee(session, product):
    r = _suivre(session, _ouvrir(session, _produit(session, product).id), "S", "Rose", "Lalao")
    r = repondre(session, r["brouillon"], "mon numéro c'est le 034 12 345 67, et en blanc",
                 extraire=_faux({"client_whatsapp": "034 12 345 67", "couleur": "Blanc"}))
    b = r["brouillon"]
    assert b["client_whatsapp"] == "0341234567" and b["couleur"] == "Rose" and b["etape"] == "zone"


def test_un_bouton_n_appelle_pas_le_modele(session, product):
    appels = []
    r = _ouvrir(session, _produit(session, product).id)
    repondre(session, r["brouillon"], "M", extraire=_faux({}, appels))
    assert appels == []


def test_extracteur_filtre_et_tolere_une_panne(monkeypatch):
    import ai.agents.extracteur_commande as ex
    monkeypatch.setattr(ex, "appeler_llm", lambda *a, **k: {"tool_calls": [{"function": {
        "arguments": '{"taille": "M", "inconnu": "x", "couleur": ""}'}}]})
    assert ex.extraire_champs("du M", ["S", "M"], [], {"darsalam": "Nosy Be — Darsalam"}) == {"taille": "M"}

    def panne(*a, **k):
        raise ex.ModeleIndisponible("aucun modèle disponible")
    monkeypatch.setattr(ex, "appeler_llm", panne)
    assert ex.extraire_champs("du M", ["S", "M"], [], {}) == {}


# ── Brique 2c : branchement dans l'orchestrateur ──
def test_orchestrateur_bouton_commander_sans_classification(session, product, monkeypatch):
    import ai.core.orchestrator as orch

    def classifieur_interdit(*a, **k):
        raise AssertionError("le classifieur ne doit pas être appelé pendant une commande")
    monkeypatch.setattr(orch, "engine", session.get_bind())
    monkeypatch.setattr(orch, "llm1_classifier", classifieur_interdit)
    _produit(session, product)

    r = orch.run_multi_agent("", commander=product.id)
    assert r["intent"] == "commande" and r["suggestions"] == [EN_STOCK, SUR_MESURE]
    r = orch.run_multi_agent(EN_STOCK, historique_commande=r["historique_commande"])
    assert r["suggestions"] == ["S", "M"]
    r = orch.run_multi_agent("M", historique_commande=r["historique_commande"])
    assert r["historique_commande"]["etape"] == "couleur" and r["suggestions"] == ["Rose", "Blanc"]


# ── Stock ou sur commande : annoncé dès le premier message ──
def test_annonce_piece_en_stock(session, product):
    r = demarrer(session, _produit(session, product).id)
    assert "en stock" in r["texte"] and "24 à 48 h" in r["texte"]


def test_annonce_piece_sur_commande(session, product):
    r = _ouvrir(session, _produit(session, product, stock=0, sur_commande=True).id)
    assert "sur commande" in r["texte"] and "7 à 14 jours" in r["texte"]


def test_piece_sur_commande_encore_en_stock_se_vend_en_stock(session, product):
    p = _produit(session, product, stock=1, sur_commande=True)
    r = _suivre(session, _ouvrir(session, p.id), "S", "Rose", "Lalao", "0341234567")
    r = _suivre(session, r, r["suggestions"][0])
    assert "avance" not in r["texte"]
    r = _suivre(session, r, OUI)
    assert session.get(Order, r["commande"]["id"]).origine == "panier"


def test_delais_identiques_serveur_et_site():
    import re
    from pathlib import Path
    import pytest
    from services.commandes import DELAIS
    contact = Path(__file__).resolve().parents[2] / "frontend" / "lib" / "contact.ts"
    if not contact.exists():
        pytest.skip("frontend absent de ce checkout")
    texte = contact.read_text(encoding="utf-8")
    for cle in ("stock", "fabrication"):
        m = re.search(cle + r":\s*\{\s*min:\s*(\d+),\s*max:\s*(\d+)", texte)
        assert m and (int(m.group(1)), int(m.group(2))) == DELAIS[cle], f"délai « {cle} » différent du site"


# ── Corrections après le test réel du 6 nov. (commande #42) ──
def test_valeur_inventee_par_le_modele_refusee(session, product):
    r = _suivre(session, _ouvrir(session, _produit(session, product).id), "S")
    r = repondre(session, r["brouillon"], "Jaune", extraire=_faux({"couleur": "Blanc", "zone": "nosybe_ville"}))
    b = r["brouillon"]
    assert b["etape"] == "couleur" and b["couleur"] is None and b["zone"] is None


def test_choix_unique_selectionne_automatiquement(session, product):
    p = _produit(session, product)
    p.sizes = "Sur mesure"
    session.add(p); session.commit()
    r = _ouvrir(session, p.id)
    assert r["brouillon"]["etape"] == "couleur" and r["brouillon"]["taille"] == "Sur mesure"


def test_oui_en_phrase_confirme(session, product):
    r = _suivre(session, _ouvrir(session, _produit(session, product).id), "S", "Rose", "Lalao", "0341234567")
    r = _suivre(session, r, r["suggestions"][0], "oui je valide")
    assert r["commande"] is not None


def test_non_ne_confirme_pas(session, product):
    r = _suivre(session, _ouvrir(session, _produit(session, product).id), "S", "Rose", "Lalao", "0341234567")
    r = _suivre(session, r, r["suggestions"][0], "non pas encore")
    assert r["commande"] is None and r["brouillon"]["etape"] == "recap"


# ── Sur mesure, même style (tous les modèles) ──
def test_piece_en_stock_propose_stock_ou_sur_mesure(session, product):
    r = demarrer(session, _produit(session, product).id)
    assert r["brouillon"]["etape"] == "mode" and r["suggestions"] == [EN_STOCK, SUR_MESURE]


def test_sur_mesure_meme_style_taille_et_couleur_libres(session, product):
    p = _produit(session, product)
    r = _suivre(session, demarrer(session, p.id), SUR_MESURE, "XL", "jaune et blanc", "Lalao", "0341234567")
    r = _suivre(session, r, r["suggestions"][0])
    assert "peut varier" in r["texte"] and "Sur mesure inspiré" in r["texte"]
    r = _suivre(session, r, OUI)
    o = session.get(Order, r["commande"]["id"])
    assert (o.origine, o.selected_size, o.selected_color) == ("sur_mesure", "XL", "Jaune et blanc")
    assert "Sur mesure inspiré" in o.client_message


def test_mensurations(session, product):
    r = _suivre(session, demarrer(session, _produit(session, product).id), SUR_MESURE, MENSURATIONS,
                "poitrine 90, taille 70, hanches 95")
    b = r["brouillon"]
    assert b["etape"] == "couleur" and b["taille"] == "Mensurations : poitrine 90, taille 70, hanches 95"


def test_serveur_choix_libres_seulement_en_sur_mesure(session, product):
    import pytest
    from fastapi import HTTPException
    from services.commandes import Ligne, calculer
    p = _produit(session, product)
    calculer(session, [Ligne(product_id=p.id, tailles=["XL"], couleurs=["Jaune"], sur_mesure=True)], "tana")
    with pytest.raises(HTTPException):
        calculer(session, [Ligne(product_id=p.id, tailles=["XL"])], "tana")
