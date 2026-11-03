# tests/test_ai.py
import pytest
from unittest.mock import patch, MagicMock
from sqlmodel import SQLModel, create_engine, Session
from sqlmodel.pool import StaticPool
from models.models import Product, Client, Order


@pytest.fixture(autouse=True)
def mock_exchange_rate():
    with patch("ai.data.stats.get_exchange_rate", return_value=4500.0):
        yield

# ── Fixture base de données IA k─────────────────────────────────────────────

@pytest.fixture(name="ai_session")
def ai_session_fixture(ai_engine):
    with Session(ai_engine) as session:
        yield session


@pytest.fixture(name="ai_engine")
def ai_engine_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture(name="produit_test")
def produit_test_fixture(ai_session: Session):
    p = Product(
        name="Sac Raphia", slug="sac-raphia", tag="Raphia",
        genre="Femme", category="ACCESSOIRES", price_ar=45000,
        image="https://test.com/sac.jpg", colors="Naturel,Noir",
        sizes="Unique", stock_quantity=3, on_order=False,
    )
    ai_session.add(p)
    ai_session.commit()
    ai_session.refresh(p)
    return p


@pytest.fixture(name="produit_rupture")
def produit_rupture_fixture(ai_session: Session):
    p = Product(
        name="Robe Épuisée", slug="robe-epuisee", tag="Raphia",
        genre="Femme", category="TENUES", price_ar=120000,
        image="https://test.com/robe.jpg", colors="Rouge",
        sizes="S,M", stock_quantity=0, on_order=False,
    )
    ai_session.add(p)
    ai_session.commit()
    ai_session.refresh(p)
    return p


# ── Tests get_products ─────────────────────────────────────────────────────

def test_get_products_retourne_tous(ai_engine, produit_test):
    with patch("ai.data.products.engine", ai_engine):
        from ai.data.products import get_products
        result = get_products()
    assert len(result) >= 1
    assert any(p["nom"] == "Sac Raphia" for p in result)


def test_get_products_filtre_categorie(ai_engine, produit_test):
    with patch("ai.data.products.engine", ai_engine):
        from ai.data.products import get_products
        result = get_products(categorie="ACCESSOIRES")
    assert all(p["categorie"] == "ACCESSOIRES" for p in result)


def test_get_products_filtre_prix(ai_engine, produit_test):
    with patch("ai.data.products.engine", ai_engine):
        from ai.data.products import get_products
        result = get_products(prix_min=10000, prix_max=50000)
    assert all(10000 <= p["prix_ar"] <= 50000 for p in result)


def test_get_products_sort_price_asc(ai_engine, ai_session):
    p1 = Product(name="Chapeau", slug="chapeau", tag="T", genre="Femme",
                 category="ACCESSOIRES", price_ar=20000, image="x",
                 colors="", sizes="Unique", stock_quantity=1)
    p2 = Product(name="Robe", slug="robe", tag="T", genre="Femme",
                 category="TENUES", price_ar=80000, image="x",
                 colors="", sizes="M", stock_quantity=2)
    ai_session.add(p1)
    ai_session.add(p2)
    ai_session.commit()
    with patch("ai.data.products.engine", ai_engine):
        from ai.data.products import get_products
        result = get_products(sort="price_asc")
    prices = [p["prix_ar"] for p in result]
    assert prices == sorted(prices)


# ── Tests get_stats ────────────────────────────────────────────────────────

def test_stats_count(ai_engine, produit_test):
    with patch("ai.data.stats.engine", ai_engine):
        from ai.data.stats import get_stats
        result = get_stats("count")
    assert result["resultat"] >= 1


def test_stats_stock_total(ai_engine, produit_test):
    with patch("ai.data.stats.engine", ai_engine):
        from ai.data.stats import get_stats
        result = get_stats("stock_total")
    assert result["resultat"] >= 3


def test_stats_prix_moyen(ai_engine, produit_test):
    with patch("ai.data.stats.engine", ai_engine), \
         patch("ai.data.stats.get_exchange_rate", return_value=4500.0):
        from ai.data.stats import get_stats
        result = get_stats("prix_moyen")
    assert isinstance(result["resultat"], dict)
    assert "ar" in result["resultat"]
    assert "eur" in result["resultat"]
    assert result["resultat"]["ar"] == 45000
    assert result["resultat"]["eur"] == 10  # 45000 / 4500 = 10


def test_stats_rupture(ai_engine, produit_rupture):
    with patch("ai.data.stats.engine", ai_engine):
        from ai.data.stats import get_stats
        result = get_stats("rupture")
    assert result["resultat"] >= 1
    noms = [p["nom"] for p in result["produits"]]
    assert "Robe Épuisée" in noms


def test_stats_operation_inconnue(ai_engine, produit_test):
    with patch("ai.data.stats.engine", ai_engine):
        from ai.data.stats import get_stats
        result = get_stats("operation_inexistante")
    assert "erreur" in result


def test_stats_aucun_produit(ai_engine):
    with patch("ai.data.stats.engine", ai_engine):
        from ai.data.stats import get_stats
        result = get_stats("count")
    assert result["resultat"] == 0


# ── Tests passer_commande ──────────────────────────────────────────────────

def test_passer_commande_succes(ai_engine, produit_test):
    with patch("ai.data.orders.engine", ai_engine):
        from ai.data.orders import passer_commande
        result = passer_commande(
            product_id=produit_test.id,
            client_name="Voahangy",
            client_whatsapp="0341234567",
            client_email="voahangy@test.mg",
            taille="Unique",
            couleur="Naturel",
            quantite=1,
        )
    assert result["succes"] is True
    assert result["type"] == "stock"
    assert result["total_ar"] == 45000


def test_passer_commande_taille_invalide(ai_engine, produit_test):
    with patch("ai.data.orders.engine", ai_engine):
        from ai.data.orders import passer_commande
        result = passer_commande(
            product_id=produit_test.id,
            client_name="Voahangy",
            client_whatsapp="0341234567",
            client_email="",
            taille="XXL",
            couleur="Naturel",
        )
    assert result["succes"] is False
    assert "Taille" in result["erreur"]


def test_passer_commande_couleur_invalide(ai_engine, produit_test):
    with patch("ai.data.orders.engine", ai_engine):
        from ai.data.orders import passer_commande
        result = passer_commande(
            product_id=produit_test.id,
            client_name="Voahangy",
            client_whatsapp="0341234567",
            client_email="",
            taille="Unique",
            couleur="Rose",
        )
    assert result["succes"] is False
    assert "Couleur" in result["erreur"]


def test_passer_commande_produit_inexistant(ai_engine):
    with patch("ai.data.orders.engine", ai_engine):
        from ai.data.orders import passer_commande
        result = passer_commande(
            product_id=9999,
            client_name="Test",
            client_whatsapp="000",
            client_email="",
            taille="M",
            couleur="Rouge",
        )
    assert result["succes"] is False


def test_passer_commande_sur_mesure(ai_engine, produit_rupture):
    with patch("ai.data.orders.engine", ai_engine):
        from ai.data.orders import passer_commande
        result = passer_commande(
            product_id=produit_rupture.id,
            client_name="Nirina",
            client_whatsapp="0349876543",
            client_email="",
            taille="S",
            couleur="Rouge",
            quantite=1,
        )
    assert result["succes"] is True
    assert result["type"] == "sur_mesure"


# ── Tests orchestrateur avec mocks LLM ────────────────────────────────────

def test_orchestrateur_salutation():
    with patch("ai.agents.classifier.llm1_classifier", return_value={"intent": "salutation"}):
        with patch("ai.core.orchestrator.llm1_classifier", return_value={"intent": "salutation"}):
            from ai.core.orchestrator import run_multi_agent
            result = run_multi_agent("Bonjour !")
    assert result["intent"] == "salutation"
    assert "Jatie" in result["response"]


def test_orchestrateur_faq():
    passages = [{"url": "/livraison", "titre": "Livraison & Retours", "contenu": "Jabala : gratuite", "score": 0.8}]
    with patch("ai.core.orchestrator.llm1_classifier", return_value={"intent": "faq"}):
        with patch("ai.core.orchestrator.chercher_passages", return_value=passages):
            with patch("ai.core.orchestrator.llm5_faq", return_value="Livraison gratuite à Jabala."):
                from ai.core.orchestrator import run_multi_agent
                result = run_multi_agent("Quels sont vos délais de livraison ?")
    assert result["intent"] == "faq"
    assert result["response"] == "Livraison gratuite à Jabala."
    assert result["liens"] == [{"titre": "Livraison & Retours", "url": "/livraison"}]


def test_orchestrateur_recherche(ai_engine):
    produits_mock = [{"id": 1, "nom": "Sac Raphia", "slug": "sac-raphia", "prix_ar": 45000,
                      "stock": 3, "sur_commande": False, "image": "https://test.com/sac.jpg"}]
    with patch("ai.core.orchestrator.llm1_classifier", return_value={"intent": "recherche"}):
        with patch("ai.core.orchestrator.llm2_router", return_value={"tool_name": "rechercher_produit", "tool_args": {"requete_libre": "sac"}}):
            with patch("ai.core.orchestrator.recherche_semantique", return_value=produits_mock):
                from ai.core.orchestrator import run_multi_agent
                result = run_multi_agent("je cherche un sac")
    assert result["intent"] == "recherche"
    carte = result["produits"][0]
    assert carte["url"] == "/produit/sac-raphia"
    assert carte["prix_eur"] == 10  # 45000 / 4500
    assert carte["disponibilite"] == "En stock (3 pièces)"

# ── Tests formater_stats (réponses chiffrées écrites par le code) ──────────

def test_formater_stats_count_categorie():
    from ai.data.stats_texte import formater_stats
    t = formater_stats({"operation": "count", "filtre_categorie": "ACCESSOIRES"}, {"resultat": 3})
    assert "3 articles" in t and "accessoires" in t


def test_formater_stats_zero_propose_sur_mesure():
    from ai.data.stats_texte import formater_stats
    t = formater_stats({"operation": "count"}, {"resultat": 0, "detail": "Aucun produit trouvé"})
    assert "sur mesure" in t


def test_formater_stats_moins_cher():
    from ai.data.stats_texte import formater_stats
    t = formater_stats({"operation": "min_price"}, {"resultat": {"ar": 15000, "eur": 3}, "nom": "Bas String"})
    assert "15 000 Ar (soit ~3 €)" in t and "Bas String" in t


def test_formater_stats_erreur_renvoie_whatsapp():
    from ai.data.stats_texte import formater_stats
    assert "WhatsApp" in formater_stats({"operation": "x"}, {"erreur": "Opération inconnue"})


# ── Tests recherche hybride (partie mots) ──────────────────────────────────

def test_mots_sans_accents_ni_pluriel():
    from ai.data.products import _mots
    assert _mots("Vous avez des SACS ? Et une pièce élégante") == {"sac", "piece", "elegante"}


def test_score_lexical_nom_vaut_plus_que_description():
    from ai.data.products import score_lexical, BONUS_MOT_NOM, BONUS_MOT_AUTRE
    assert score_lexical({"short"}, "Short Crochet Rayé", "TENUES") == BONUS_MOT_NOM
    assert score_lexical({"short"}, "Ensemble Corail", "TENUES short assorti") == BONUS_MOT_AUTRE


def test_score_lexical_aucun_mot_commun():
    from ai.data.products import score_lexical
    assert score_lexical({"voiture"}, "Robe Crochet Fuchsia", "TENUES robe plage") == 0.0


# ── Tests cartes produit ───────────────────────────────────────────────────

def test_cartes_sur_commande_et_limite():
    from ai.data.cartes import construire_cartes, MAX_CARTES
    produits = [{"id": i, "nom": f"P{i}", "slug": f"p{i}", "prix_ar": 9000, "stock": 0, "sur_commande": True}
                for i in range(8)]
    cartes = construire_cartes(produits)
    assert len(cartes) == MAX_CARTES
    assert cartes[0]["disponibilite"] == "Sur commande"


def test_texte_cartes_aucun_resultat_propose_sur_mesure():
    from ai.data.cartes import texte_cartes
    assert "sur mesure" in texte_cartes([])


# ── Tests indexeur du site (RAG FAQ) ───────────────────────────────────────

def test_extraire_texte_garde_le_contenu_principal():
    from ai.knowledge.indexeur import extraire_texte
    page = (
        "<html><head><title>Formation | Art Jatie</title></head><body>"
        "<nav>Boutique Galerie</nav>"
        "<main><h1>Formation crochet</h1><p>Prix&nbsp;: 50 000 Ar, c&#x27;est l&#x27;offre</p>"
        "<script>var x = 1;</script></main>"
        "<footer>Mentions</footer></body></html>"
    )
    titre, texte = extraire_texte(page)
    assert titre == "Formation"
    assert texte == "Formation crochet\nPrix : 50 000 Ar, c'est l'offre"


def test_decouper_ne_coupe_pas_les_lignes():
    from ai.knowledge.indexeur import decouper
    texte = "\n".join(f"ligne numéro {i} " + "x" * 40 for i in range(30))
    passages = decouper("Titre", texte, taille=200)
    assert len(passages) > 1
    assert all(p.startswith("Titre\n") for p in passages)
    assert all(len(p) <= 200 + len("Titre\n") + 60 for p in passages)


def test_faq_sans_passage_repond_sans_appel_ia():
    from ai.agents.faq import llm5_faq, FALLBACK_SANS_INFO
    log = []
    assert llm5_faq(log, "prix d'un iphone ?", passages=[]) == FALLBACK_SANS_INFO
    assert log == []  # aucun appel au modèle


def test_tableau_converti_en_phrases():
    from ai.knowledge.indexeur import extraire_texte
    page = ("<title>Guide | Art Jatie</title><main><table>"
            "<thead><tr><th>Taille</th><th>Standard (FR)</th><th>Poitrine (cm)</th></tr></thead>"
            "<tbody><tr><td>M</td><td>38-40</td><td>88-92</td></tr></tbody></table></main>")
    _, texte = extraire_texte(page)
    assert texte == "Taille M : Standard (FR) 38-40 · Poitrine (cm) 88-92"


def test_familles_de_mots():
    from ai.utils.texte import mots
    assert "paiement" in mots("Comment je peux payer ?")
    assert "email" in mots("c'est quoi votre e-mail")
    assert "livraison" in mots("vous livrez à Mahajanga ?")


def test_decouper_ouvre_un_passage_par_question():
    from ai.knowledge.indexeur import decouper
    texte = "Quel est le délai de remboursement ?\nSous 3 à 5 jours.\nQuels moyens de paiement acceptez-vous ?\nMVola et Orange Money."
    passages = decouper("Livraison", texte, taille=600)
    assert len(passages) == 2
    assert passages[1].startswith("Livraison\nQuels moyens de paiement")


def test_theme_contact():
    from ai.utils.texte import mots, score_lexical
    question = mots("c'est quoi votre email ?")
    assert {"email", "contact"} <= question
    assert score_lexical(question, "Contactez-nous", "Email jatieart@gmail.com") >= 0.3


def test_mots_localisation():
    from ai.utils.texte import mots
    assert {"adresse", "contact"} <= mots("où êtes-vous situés ?")


def test_reindex_refuse_un_mauvais_jeton(monkeypatch):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from routes.agent import router
    from core.limiter import limiter
    app = FastAPI()
    app.state.limiter = limiter
    app.include_router(router, prefix="/agent")
    monkeypatch.setenv("REINDEX_TOKEN", "le-bon-jeton")
    client = TestClient(app)
    assert client.post("/agent/reindex", headers={"X-Reindex-Token": "mauvais"}).status_code == 401
    assert client.post("/agent/reindex").status_code == 401


def test_mots_coordonnees():
    from ai.utils.texte import mots
    assert "contact" in mots("Pouvez-vous me donner vos coordonnées ?")


def test_commandes_illisibles_sans_jeton_admin():
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from routes.orders import router
    app = FastAPI()
    app.include_router(router, prefix="/orders")
    client = TestClient(app)
    assert client.get("/orders/").status_code in (401, 403)
    assert client.delete("/orders/1").status_code in (401, 403)


def test_produits_et_clients_proteges_sans_jeton():
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from routes import products, clients, colors
    app = FastAPI()
    app.include_router(products.router, prefix="/products")
    app.include_router(clients.router, prefix="/clients")
    app.include_router(colors.router, prefix="/colors")
    c = TestClient(app)
    assert c.delete("/products/1").status_code in (401, 403)
    assert c.post("/products/seed").status_code in (401, 403)
    assert c.get("/clients/").status_code in (401, 403)
    assert c.delete("/colors/1").status_code in (401, 403)
