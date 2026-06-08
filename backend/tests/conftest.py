import pytest
import os
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JINA_API_KEY"] = "test"
os.environ["GOOGLE_API_KEY"] = "test"
os.environ["GROQ_API_KEY"] = "test"
os.environ["CLOUDFLARE_R2_BUCKET"] = "test"
os.environ["CLOUDFLARE_R2_ENDPOINT"] = "https://test.r2.cloudflarestorage.com"
os.environ["CLOUDFLARE_R2_ACCESS_KEY"] = "test"
os.environ["CLOUDFLARE_R2_SECRET_KEY"] = "test"

from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session
from sqlmodel.pool import StaticPool
from database import get_session
from main import app
from models.models import Product, Settings

@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        yield session
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

@pytest.fixture(name="product")
def product_fixture(session: Session):
    p = Product(
        name="Robe Test", slug="robe-test", tag="Raphia",
        genre="Femme", category="TENUES", price_ar=120000,
        image="https://test.com/robe.jpg", colors="Rouge",
        sizes="S,M", badge="Nouveau", is_hot=True,
        on_order=False, stock_quantity=5,
    )
    session.add(p)
    session.commit()
    session.refresh(p)
    return p

@pytest.fixture(name="settings")
def settings_fixture(session: Session):
    s = Settings(
        exchange_rate_eur=4500.0,
        available_colors="Rouge,Blanc,Noir",
        available_sizes="S,M,L,XL",
        available_categories="TENUES,ACCESSOIRES",
        available_genres="Femme,Homme",
    )
    session.add(s)
    session.commit()
    session.refresh(s)
    return s
