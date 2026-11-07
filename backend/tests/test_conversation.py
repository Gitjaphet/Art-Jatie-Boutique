from ai.recherche.conversation import tour_guide


def _p(id, nom, type_article, prix, familles, stock=0):
    return {"id": id, "nom": nom, "type_article": type_article, "prix_ar": prix, "familles": familles,
            "stock": stock, "sur_commande": True, "tailles": "S,M"}


CATALOGUE = [
    _p(17, "Robe Crochet Sirène Rayée Corail", "Robe", 60000, ["Rose", "Orange", "Rouge"], stock=1),
    _p(19, "Robe Crochet Fuchsia Décolleté", "Robe", 40000, ["Rose", "Rouge"]),
    _p(27, "Ensemble Robe & Chapeau Rose", "Robe", 25000, ["Rose", "Rouge"]),
    _p(16, "Sac Crochet Corail", "Sac", 30000, ["Rose", "Orange", "Rouge"], stock=2),
]


def test_conversation_de_vente_complete():
    r = tour_guide("bjr vs avez des robe rouge ?", None, CATALOGUE)
    assert r["action"] == "recherche" and r["produits"][0]["id"] == 17
    assert r["fiche"]["question"] == {"type": "commander", "produit_id": 17} and r["fiche"]["tour"] == 1

    r = tour_guide("la sirene c trop cher pour moi", r["fiche"], CATALOGUE)
    assert r["action"] == "objection" and 17 not in [p["id"] for p in r["produits"]]
    assert r["fiche"]["question"]["produit_id"] == 27  # la moins chère, en premier

    r = tour_guide("vs livrez a ambatoloaka ?", r["fiche"], CATALOGUE)
    assert r["action"] == "livraison" and "8 000 Ar" in r["texte"]
    assert r["fiche"]["montres"]  # gardés : aucune carte affichée à ce tour

    r = tour_guide("Oui, je la veux", {**r["fiche"], "question": {"type": "commander", "produit_id": 27}}, CATALOGUE)
    assert r["commander"] == 27  # le parcours de commande prend le relais


def test_incompris_rend_la_main_au_modele():
    r = tour_guide("hmm je sais pas trop", None, CATALOGUE)
    assert r["action"] is None and "commander" not in r


def test_erreur_rend_none():
    assert tour_guide("bonjour", None, [{"pas_d_id": True}]) is None


def test_lecture_comprise_et_recherche_forcee():
    from ai.recherche.conversation import lecture_comprise
    r = tour_guide("un truc pour la plage", None, CATALOGUE,
                   lecture=lecture_comprise({"types": ["Sac"]}, "un truc pour la plage"), forcer="recherche")
    assert r["action"] == "recherche" and r["produits"][0]["id"] == 16
    r = tour_guide("un truc joli", None, CATALOGUE, lecture=lecture_comprise({}, "un truc joli"), forcer="recherche")
    assert r["action"] == "recherche" and r["produits"]  # même vague : une vraie proposition


def test_couleurs_deduites_par_le_modele_ignorees():
    from ai.recherche.conversation import lecture_comprise
    l = lecture_comprise({"types": ["Robe"], "couleurs": ["Bleu", "Blanc"]}, "un truc sympa pour la plage")
    assert l.types == ["Robe"] and l.couleurs == []
    l = lecture_comprise({"types": ["Robe"], "couleurs": ["Bleu"]}, "un truc rose pour la plage")
    assert l.couleurs == ["Rose"]  # la couleur écrite, lue par le lecteur


def test_clic_sur_une_zone_donne_le_total_du_coup_de_coeur():
    r = tour_guide("bjr vs avez des robe rouge ?", None, CATALOGUE)
    assert "Ambatoloaka" in r["suggestions"] and r["fiche"]["zone_demandee"]
    r = tour_guide("Ambatoloaka", r["fiche"], CATALOGUE)
    assert r["action"] == "livraison" and "68 000 Ar au total" in r["texte"]  # Sirène 60 000 + 8 000
    r = tour_guide("et des sacs ?", r["fiche"], CATALOGUE)
    assert "Dites-moi où" not in r["texte"] and "38 000 Ar au total" in r["texte"]  # zone connue


# --- Salutation dans le même message qu'une demande (F5) ---
_ACCUEIL = [
    {"id": 1, "nom": "Robe Rouge Soleil", "type_article": "Robe", "prix_ar": 50000, "familles": ["Rouge"],
     "stock": 1, "sur_commande": True, "tailles": "S,M", "images": []},
    {"id": 2, "nom": "Sac Rouge Plage", "type_article": "Sac", "prix_ar": 30000, "familles": ["Rouge"],
     "stock": 2, "sur_commande": True, "tailles": "", "images": []},
]


def test_bonjour_et_recherche_dans_le_meme_message():
    from ai.recherche.conversation import tour_guide
    r = tour_guide("bonjour, vous avez des robes rouges ?", None, produits=_ACCUEIL)
    assert r["action"] == "recherche" and r["texte"].startswith("Bonjour ! 😊 ")
    assert r["texte"].count("Bonjour") == 1 and r["produits"]


def test_bonsoir_seul_repond_bonsoir():
    from ai.recherche.conversation import tour_guide
    r = tour_guide("bonsoir", None, produits=_ACCUEIL)
    assert r["action"] == "salutation" and r["texte"].startswith("Bonsoir ! 😊 Je suis Jatie")


def test_salama_et_recherche_en_malgache():
    from ai.recherche.conversation import tour_guide
    r = tour_guide("salama, misy kitapo mena ve ?", None, produits=_ACCUEIL)
    assert r["texte"].startswith("Salama ! 😊 ")


def test_pas_de_bonjour_si_la_cliente_ne_salue_pas():
    from ai.recherche.conversation import tour_guide
    r = tour_guide("vous avez des robes rouges ?", None, produits=_ACCUEIL)
    assert not r["texte"].startswith(("Bonjour", "Bonsoir", "Salama"))
