from ai.recherche.vendeuse import repondre


def _p(id, nom, type_article, prix, familles, stock=0, tailles="S,M"):
    return {"id": id, "nom": nom, "type_article": type_article, "prix_ar": prix, "familles": familles,
            "stock": stock, "sur_commande": True, "tailles": tailles}


CATALOGUE = [
    _p(17, "Robe Sirène", "Robe", 60000, ["Rose", "Orange"], stock=1),
    _p(19, "Robe Fuchsia", "Robe", 40000, ["Rose"]),
    _p(27, "Robe & Chapeau", "Robe", 25000, ["Rose"]),
    _p(16, "Sac Corail", "Sac", 30000, ["Rose", "Orange"], stock=2),
]


def test_coup_de_coeur_en_stock_derniere_piece_et_question():
    r = repondre("recherche", {"types": ["Robe"], "couleurs": ["Rose"]}, CATALOGUE)
    assert "nos robes en rose" in r.texte and "« Robe Sirène »" in r.texte and "dernière pièce" in r.texte
    assert r.question == {"type": "commander", "produit_id": 17}
    assert r.suggestions == ["Oui, je la veux", "Moins de 60 000 Ar", "Sur mesure"]
    assert [p["id"] for p in r.produits] == [17, 27, 19]


def test_masculin_et_pas_de_fausse_rarete():
    r = repondre("recherche", {"types": ["Sac"]}, CATALOGUE)
    assert "Je vous le réserve" in r.texte and "dernière pièce" not in r.texte  # stock 2


def test_total_avec_livraison_quand_la_zone_est_connue():
    r = repondre("recherche", {"types": ["Sac"], "zone": "darsalam"}, CATALOGUE)
    assert "38 000 Ar au total" in r.texte


def test_rien_dans_le_budget_propose_le_plus_accessible_et_l_acompte():
    r = repondre("recherche", {"types": ["Robe"], "budget_max": 20000}, CATALOGUE)
    assert "« Robe & Chapeau »" in r.texte and "25 000 Ar" in r.texte and "50 %" in r.texte


def test_objection_reste_dans_le_budget():
    r = repondre("objection", {"types": ["Robe"], "budget_max": 39999, "exclus": [17]}, CATALOGUE)
    assert r.texte.startswith("Je comprends tout à fait") and r.question["produit_id"] == 27


def test_livraison_tarif_reel_et_delai():
    r = repondre("livraison", {"zone": "darsalam"}, CATALOGUE)
    assert "8 000 Ar" in r.texte and "demi-journée" in r.texte


def test_livraison_sur_devis_jamais_gratuite():
    r = repondre("livraison", {"zone": "nosybe_autre"}, CATALOGUE)
    assert "sur devis" in r.texte and "offerte" not in r.texte


def test_livraison_avec_modele_cite_donne_le_total():
    r = repondre("livraison", {"zone": "darsalam"}, CATALOGUE, produit_id=27)
    assert "33 000 Ar au total" in r.texte and r.question["produit_id"] == 27


def test_remise_refusee_sans_rien_inventer():
    r = repondre("remise", {}, CATALOGUE)
    assert "ne peux pas modifier nos prix" in r.texte and "%" not in r.texte


def test_salutation_malgache_et_types_presents():
    r = repondre("salutation", {"langue": "mg"}, CATALOGUE)
    assert r.texte.startswith("Salama") and r.suggestions == ["Robes", "Sacs", "Sur mesure"]


def test_chaque_bouton_est_compris_par_le_lecteur():
    from ai.recherche.lecteur import lire
    for bouton in ["Oui, je la veux", "Oui, je le veux", "Moins de 60 000 Ar", "Sur mesure", "Voir toute la boutique",
                   "Moins cher", "Robes", "Sacs", "Hell-Ville", "Ambatoloaka", "Dzamanjar"]:
        assert lire(bouton).compris(), f"Le bouton « {bouton} » coûterait un appel au modèle"
    assert lire("Moins de 60 000 Ar").montant == 59999


def test_rien_d_exact_coup_de_coeur_proche_et_sur_mesure_dans_la_couleur():
    r = repondre("recherche", {"types": ["Robe"], "couleurs": ["Rouge"]}, CATALOGUE)
    assert r.texte.startswith("Je n'ai pas de robes en rouge pour le moment")
    assert "en faire une sur mesure en rouge" in r.texte
    assert "« Robe Sirène » (rose et orange)" in r.texte and "dernière pièce" in r.texte
    assert r.question == {"type": "commander", "produit_id": 17} and r.suggestions[0] == "Oui, je la veux"


def test_francais_sans_nos_dans_les_absences():
    r = repondre("recherche", {"types": ["Sac"], "couleurs": ["Noir"]}, CATALOGUE)
    assert "Je n'ai pas de sacs en noir" in r.texte and "en faire un sur mesure en noir" in r.texte


def test_rien_dans_le_budget_conclut_et_ouvre_toute_la_boutique():
    r = repondre("recherche", {"types": ["Robe"], "budget_max": 20000}, CATALOGUE)
    assert r.texte.endswith("On lance sa réalisation pour vous ?")  # pièce à fabriquer
    assert r.suggestions == ["Oui, je la veux", "Autres articles jusqu'à 20 000 Ar", "Sur mesure"]


def test_autres_articles_toute_la_boutique_par_prix():
    from ai.recherche.fiche import mettre_a_jour
    from ai.recherche.lecteur import lire
    fiche = {"types": ["Robe"], "couleurs": ["Rouge"], "tailles": ["M"], "budget_max": 30000, "tri": "prix_asc"}
    f, d = mettre_a_jour(fiche, lire("Autres articles jusqu'à 30 000 Ar"))
    assert d.action == "recherche" and f["types"] == [] and f["budget_max"] == 30000
    r = repondre("recherche", f, CATALOGUE)
    assert [p["id"] for p in r.produits] == [27, 16]  # par prix : 25 000 puis 30 000, le stock ne passe pas devant


def test_piece_sans_stock_dit_clairement_qu_elle_est_a_fabriquer():
    r = repondre("recherche", {"types": ["Robe"], "budget_max": 20000}, CATALOGUE)
    assert ("pas disponible en stock actuellement, mais nous pouvons la réaliser pour vous en 7 à 14 jours"
            in r.texte)


def test_piece_en_stock_se_reserve():
    r = repondre("recherche", {"types": ["Sac"]}, CATALOGUE)
    assert r.texte.endswith("Je vous le réserve ?")
