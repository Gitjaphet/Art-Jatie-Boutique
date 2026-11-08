"""Brique 1 de la vendeuse IA : les outils (faits réels, jamais d'erreur levée)."""
from ai.vendeuse_ia.outils import OUTILS, executer

_PRODUITS = [
    {"id": 1, "nom": "Robe Rouge Soleil", "type_article": "Robe", "prix_ar": 50000, "familles": ["Rouge"],
     "stock": 1, "sur_commande": True, "tailles": "S,M", "images": []},
    {"id": 2, "nom": "Robe Bleue Plage", "type_article": "Robe", "prix_ar": 30000, "familles": ["Bleu"],
     "stock": 0, "sur_commande": True, "tailles": "M", "images": []},
    {"id": 3, "nom": "Fil à coton 200 g", "type_article": "Fil", "prix_ar": 10000, "familles": [],
     "stock": 2, "sur_commande": False, "tailles": "", "images": []},
]


def test_chercher_produits_vrais_prix_et_disponibilite():
    r = executer("chercher_produits", '{"types": ["Robe"], "moins_cher": true}', _PRODUITS)
    assert [p["id"] for p in r["exacts"]] == [2, 1]  # le moins cher d'abord
    assert r["exacts"][0]["prix"] == "30 000 Ar" and r["exacts"][0]["disponibilite"].startswith("à fabriquer")
    assert r["exacts"][1]["disponibilite"] == "en stock (1)"


def test_valeurs_hors_catalogue_ignorees():
    r = executer("chercher_produits", {"types": ["Pantalon"], "couleurs": ["Fuchsia"]}, _PRODUITS)
    assert r["nombre_exacts"] == 3  # ni type ni couleur inventés : toute la boutique disponible


def test_fil_cherche_comme_un_produit():
    r = executer("chercher_produits", {"types": ["Fil"]}, _PRODUITS)
    assert [p["nom"] for p in r["exacts"]] == ["Fil à coton 200 g"]


def test_livraison_lieu_connu_et_inconnu():
    r = executer("livraison", {"lieu": "Ambatoloaka"}, _PRODUITS)
    assert r["tarif"].endswith("Ar") and "delai" in r
    assert "erreur" in executer("livraison", {"lieu": "Lune"}, _PRODUITS)


def test_commande_et_detail():
    assert executer("demarrer_commande", {"produit_id": 1}, _PRODUITS) == {"action": "commander", "produit_id": 1}
    assert "erreur" in executer("detail_produit", {"produit_id": 99}, _PRODUITS)


def test_jamais_d_erreur_levee():
    assert "erreur" in executer("outil_imaginaire", {}, _PRODUITS)
    assert "erreur" in executer("detail_produit", "pas du json", _PRODUITS)


def test_infos_boutique(monkeypatch):
    from ai.vendeuse_ia import outils
    monkeypatch.setattr(outils, "chercher_passages", lambda q, top_k: [{"titre": "Formation", "contenu": "8 000 Ar le module"}])
    assert outils.executer("infos_boutique", {"question": "prix formation"}, [])["extraits"][0]["page"] == "Formation"


def test_chaque_outil_est_decrit():
    assert {o["function"]["name"] for o in OUTILS} == {
        "chercher_produits", "detail_produit", "livraison", "infos_boutique", "demarrer_commande"}
