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

# ── Fixture base de données IA ─────────────────────────────────────────────

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
    with patch("ai.core.orchestrator.llm1_classifier", return_value={"intent": "faq"}):
        with patch("ai.core.orchestrator.llm5_faq", return_value="Livraison gratuite à Jabala."):
            from ai.core.orchestrator import run_multi_agent
            result = run_multi_agent("Quels sont vos délais de livraison ?")
    assert result["intent"] == "faq"
    assert result["response"] == "Livraison gratuite à Jabala."


def test_orchestrateur_recherche(ai_engine):
    produits_mock = [{"id": 1, "nom": "Sac Raphia", "prix_ar": 45000, "stock": 3}]
    with patch("ai.core.orchestrator.llm1_classifier", return_value={"intent": "recherche"}):
        with patch("ai.core.orchestrator.llm2_router", return_value={"tool_name": "rechercher_produit", "tool_args": {"requete_libre": "sac"}}):
            with patch("ai.core.orchestrator.recherche_semantique", return_value=produits_mock):
                with patch("ai.core.orchestrator.llm3_reformulateur", return_value="Voici un beau sac raphia à 45 000 Ar."):
                    from ai.core.orchestrator import run_multi_agent
                    result = run_multi_agent("je cherche un sac")
    assert result["intent"] == "recherche"
    assert "sac" in result["response"].lower()