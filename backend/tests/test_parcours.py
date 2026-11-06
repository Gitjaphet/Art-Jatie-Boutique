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


# ── Brique 2b : texte libre (faux extracteur, aucun appel réel au modèle) ──
def _faux(champs, appels=None):
    def extraire(message, tailles, couleurs, zones):
        if appels is not None:
            appels.append(message)
        return champs
    return extraire


def test_texte_libre_remplit_plusieurs_etapes(session, product):
    r = demarrer(session, _produit(session, product).id)
    champs = {"taille": "M", "couleur": "Rose", "client_name": "Lalao",
              "client_whatsapp": "034 12 345 67", "zone": "darsalam"}
    r = repondre(session, r["brouillon"], "en M rose pour Lalao, 034 12 345 67, à Darsalam", extraire=_faux(champs))
    b = r["brouillon"]
    assert b["etape"] == "recap"
    assert (b["taille"], b["couleur"], b["client_whatsapp"], b["zone"]) == ("M", "Rose", "0341234567", "darsalam")


def test_valeur_extraite_invalide_ignoree(session, product):
    r = demarrer(session, _produit(session, product).id)
    r = repondre(session, r["brouillon"], "du XL en rose", extraire=_faux({"taille": "XL", "couleur": "Rose"}))
    b = r["brouillon"]
    assert b["etape"] == "taille" and b["taille"] is None and b["couleur"] == "Rose"


def test_extraction_n_ecrase_pas_une_reponse_deja_donnee(session, product):
    r = _suivre(session, demarrer(session, _produit(session, product).id), "S", "Rose", "Lalao")
    r = repondre(session, r["brouillon"], "mon numéro c'est le 034 12 345 67, et en blanc",
                 extraire=_faux({"client_whatsapp": "034 12 345 67", "couleur": "Blanc"}))
    b = r["brouillon"]
    assert b["client_whatsapp"] == "0341234567" and b["couleur"] == "Rose" and b["etape"] == "zone"


def test_un_bouton_n_appelle_pas_le_modele(session, product):
    appels = []
    r = demarrer(session, _produit(session, product).id)
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
    assert r["intent"] == "commande" and r["suggestions"] == ["S", "M"]
    r = orch.run_multi_agent("M", historique_commande=r["historique_commande"])
    assert r["historique_commande"]["etape"] == "couleur" and r["suggestions"] == ["Rose", "Blanc"]
