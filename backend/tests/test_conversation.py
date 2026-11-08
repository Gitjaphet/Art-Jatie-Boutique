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


# --- Le coup de cœur varie quand la cliente redemande (F8) ---
_DEUX_SACS = [
    {"id": 10, "nom": "Sac Corail", "type_article": "Sac", "prix_ar": 20000, "familles": ["Rose"],
     "stock": 1, "sur_commande": True, "tailles": "", "images": []},
    {"id": 11, "nom": "Sac Vert", "type_article": "Sac", "prix_ar": 20000, "familles": ["Vert"],
     "stock": 1, "sur_commande": True, "tailles": "", "images": []},
]


def test_coup_de_coeur_varie_puis_revient_au_premier():
    from ai.recherche.conversation import tour_guide
    r1 = tour_guide("vous avez des sacs ?", None, produits=_DEUX_SACS)
    premier = r1["fiche"]["coups_de_coeur"][0]
    assert "Mon coup de cœur" in r1["texte"] and r1["produits"][0]["id"] == premier

    r2 = tour_guide("vous avez des sacs ?", r1["fiche"], produits=_DEUX_SACS)
    second = r2["produits"][0]["id"]
    assert second != premier and "Autre coup de cœur" in r2["texte"]
    assert r2["fiche"]["coups_de_coeur"] == [premier, second]

    r3 = tour_guide("vous avez des sacs ?", r2["fiche"], produits=_DEUX_SACS)  # tous vus : on recommence
    assert r3["produits"][0]["id"] == premier and "Mon coup de cœur" in r3["texte"]


# --- Réponses en malgache, lot 1 (phrases validées par Art Jatie) ---
_SAC_A_FAIRE = [{"id": 20, "nom": "Sac Bleu", "type_article": "Sac", "prix_ar": 20000, "familles": ["Bleu"],
                 "stock": 0, "sur_commande": True, "tailles": "", "images": []}]


def test_malgache_accueil_et_piece_en_stock():
    from ai.recherche.conversation import tour_guide
    r = tour_guide("salama", None, produits=_DEUX_SACS)
    assert r["texte"] == ("Salama ! 😊 Izaho no Jatie, mpanolotsaina ato amin'ny Art Jatie. "
                          "Inona no tadiavinao androany ?")
    r = tour_guide("misy kitapo ve ?", r["fiche"], produits=_DEUX_SACS)
    assert r["texte"].startswith("Ireto ny sac nofidiako ho anao ✨\n\nIlay tena tiako : « Sac ")
    assert ", 20 000 Ar, iray sisa no misy." in r["texte"] and " à 20 000" not in r["texte"]
    assert r["texte"].endswith("sa reservenay ho anao avy hatrany ?")
    assert r["suggestions"][0] == "Eny, tiako"


def test_malgache_piece_a_fabriquer():
    from ai.recherche.conversation import tour_guide
    r = tour_guide("misy kitapo ve ?", None, produits=_SAC_A_FAIRE)
    assert ("tsy misy en stock aloha izao, fa afaka amboarinay ho anao ao anatin'ny 7 ka hatramin'ny 14 andro."
            in r["texte"])
    assert r["texte"].endswith("sa ve hoe direct amboarinay ho anao lay izy ?")


def test_boutons_malgaches_compris_par_le_lecteur():
    from ai.recherche.lecteur import lire
    assert lire("Hijery ny boutique rehetra").tout_voir
    assert lire("Eny, tiako").reponse


def test_salutations_du_nord_en_malgache_sans_modele():
    from ai.recherche.conversation import tour_guide
    for message in ("mbalatsar", "mbalatsara", "karakory", "krkr", "manahoana"):
        r = tour_guide(message, None, produits=_DEUX_SACS)
        assert r["action"] == "salutation", message
        assert r["texte"].startswith("Salama ! 😊 Izaho no Jatie"), message


# --- Réponses en malgache, lot 2 ---
def test_malgache_total_livre():
    from ai.recherche.conversation import tour_guide
    r = tour_guide("misy kitapo any ambatoloaka ve ?", None, produits=_DEUX_SACS)
    assert " Miaraka amin'ny livraison : 28 000 Ar daholo." in r["texte"], r["texte"]


def test_malgache_rien_d_exact():
    from ai.recherche.conversation import tour_guide
    r = tour_guide("misy kitapo mena ve ?", None, produits=_DEUX_SACS)
    assert r["texte"].startswith("Tsy misy sac mena aloha izao. Afaka amboarinay ho anao sur mesure mena ianao "
                                 "(ao anatin'ny 7 ka hatramin'ny 14 andro), na ireto ny modèle akaiky indrindra 👇"), r["texte"]


def test_malgache_remise_et_refus():
    from ai.recherche.vendeuse import repondre
    r = repondre("remise", {"langue": "mg"}, _DEUX_SACS)
    assert r.texte.startswith("Tsy afaka ovaiko ny vidiny 😊") and "Hijery ny boutique rehetra" in r.suggestions
    r = repondre("non", {"langue": "mg"}, _DEUX_SACS)
    assert r.texte.startswith("Tsy maninona 😊") and r.suggestions[0] == "Hijery ny boutique rehetra"


def test_langue_du_message_incompris():
    from ai.core.orchestrator import _langue_cliente
    from ai.recherche.textes import dire
    assert _langue_cliente("zah tsy mahay", None) == "mg"
    assert _langue_cliente("blabla", {"langue": "mg"}) == "mg"
    assert _langue_cliente("je veux un truc", None) == "fr"
    assert dire("incompris", "mg").startswith("Miala tsiny, tsy azoko tsara 😊")


def test_trop_cher_sans_nommer_vise_la_piece_proposee():
    from ai.recherche.conversation import tour_guide
    r1 = tour_guide("vous avez des sacs ?", None, produits=_DEUX_SACS)
    refuse = r1["fiche"]["question"]["produit_id"]
    r2 = tour_guide("c'est trop cher", r1["fiche"], produits=_DEUX_SACS)
    assert r2["fiche"]["exclus"] == [refuse] and r2["fiche"]["budget_max"] == 19999
    assert "à moins de 20 000 Ar" in r2["texte"], r2["texte"]  # jamais un autre sac au même prix


# --- Réponses en malgache, lot 3 ---
def test_malgache_rien_dans_le_budget():
    from ai.recherche.conversation import tour_guide
    r1 = tour_guide("misy kitapo ve ?", None, produits=_DEUX_SACS)
    r2 = tour_guide("lafo loatra", r1["fiche"], produits=_DEUX_SACS)
    assert r2["texte"].startswith("Azoko tsara 😊 Tsy misy sac latsaky ny 20 000 Ar aloha izao. "
                                  "Ny modèle mora indrindra dia « "), r2["texte"]
    assert "Ary azo amboarina sur mesure avokoa ny modèle-nay rehetra" in r2["texte"]


def test_malgache_livraison_avec_et_sans_zone():
    from ai.recherche.vendeuse import repondre
    r = repondre("livraison", {"langue": "mg"}, _DEUX_SACS)
    assert r.texte.startswith("Manatitra na aiza na aiza izahay !") and r.texte.endswith("Aiza no tianao hanaterana azy ?")
    from ai.recherche.lecteur import lire
    zone = lire("ambatoloaka").zone  # la clé interne, telle que le lecteur la produit
    r = repondre("livraison", {"langue": "mg", "zone": zone}, _DEUX_SACS, 10)
    assert "Omanina ao anatin'ny 24 ka hatramin'ny 48 ora ny pièce misy en stock" in r.texte, r.texte
    assert "dia aterina ao anatin'ny antsasak'andro" in r.texte and r.texte.endswith("Reservenay ho anao ve ?")


def test_delais_convertis_en_malgache():
    from ai.recherche.textes import en_malgache
    assert en_malgache("7 à 14 jours") == "7 ka hatramin'ny 14 andro"
    assert en_malgache("24 à 48 h") == "24 ka hatramin'ny 48 ora"
