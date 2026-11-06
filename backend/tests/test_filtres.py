from ai.recherche.filtres import filtrer


def _p(id, type_article, prix, familles, tailles="S,M", stock=0, sur_commande=True):
    return {"id": id, "nom": f"P{id}", "type_article": type_article, "prix_ar": prix,
            "familles": familles, "tailles": tailles, "stock": stock, "sur_commande": sur_commande}


CATALOGUE = [
    _p(17, "Robe", 60000, ["Rose", "Orange", "Blanc"], stock=1),
    _p(19, "Robe", 40000, ["Rose"]),
    _p(27, "Robe", 25000, ["Rose"], tailles="1 - 3 ans"),
    _p(29, "Robe", 50000, ["Rose", "Blanc"]),
    _p(40, "Robe", 35000, ["Jaune"], tailles="Sur mesure"),
    _p(41, "Robe", 20000, ["Rouge"], stock=0, sur_commande=False),  # épuisée, non refaisable
    _p(16, "Sac", 30000, ["Rose", "Orange", "Blanc"], stock=2),
]


def ids(liste):
    return [p["id"] for p in liste]


def test_type_couleur_et_ordre_en_stock_d_abord():
    r = filtrer(CATALOGUE, {"types": ["Robe"], "couleurs": ["Rose"]})
    assert ids(r.exacts) == [17, 27, 19, 29]  # 17 en stock d'abord, puis prix croissant
    assert ids(r.proches) == [40]             # robe d'une autre couleur
    assert 41 not in ids(r.exacts + r.proches) and 16 not in ids(r.exacts + r.proches)


def test_budget_et_exclusion():
    r = filtrer(CATALOGUE, {"types": ["Robe"], "budget_max": 30000, "exclus": [27]})
    assert ids(r.exacts) == []  # 27 exclue, 41 épuisée
    r = filtrer(CATALOGUE, {"types": ["Robe"], "budget_max": 39999})
    assert ids(r.exacts) == [27, 40]


def test_taille_sur_mesure_compte_comme_disponible():
    r = filtrer(CATALOGUE, {"types": ["Robe"], "tailles": ["M"]})
    assert 40 in ids(r.exacts) and 27 in ids(r.proches)  # 27 n'existe qu'en taille enfant


def test_sans_critere_tout_le_disponible():
    r = filtrer(CATALOGUE, {})
    assert len(r.exacts) == 6 and r.proches == []
