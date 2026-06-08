from models.models import Product

def test_get_products_vide(client):
    response = client.get("/products/")
    assert response.status_code == 200
    assert response.json() == []

def test_get_products(client, product, settings):
    response = client.get("/products/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Robe Test"
    assert data[0]["slug"] == "robe-test"
    assert "price_eur" in data[0]

def test_get_products_filtre_genre(client, product, settings):
    response = client.get("/products/?genre=Femme")
    assert response.status_code == 200
    assert len(response.json()) == 1

    response = client.get("/products/?genre=Homme")
    assert response.status_code == 200
    assert len(response.json()) == 0

def test_get_products_filtre_category(client, product, settings):
    response = client.get("/products/?category=TENUES")
    assert response.status_code == 200
    assert len(response.json()) == 1

    response = client.get("/products/?category=ACCESSOIRES")
    assert response.status_code == 200
    assert len(response.json()) == 0

def test_get_product_by_slug(client, product, settings):
    response = client.get("/products/robe-test")
    assert response.status_code == 200
    assert response.json()["slug"] == "robe-test"

def test_get_product_slug_inexistant(client):
    response = client.get("/products/slug-inexistant")
    assert response.status_code == 404

def test_generate_slugs(client, session):
    p = Product(
        name="Sac Raphia", slug=None, tag="T", genre="Femme",
        category="ACCESSOIRES", price_ar=45000, image="x",
        colors="", sizes="Unique", stock_quantity=2,
    )
    session.add(p)
    session.commit()
    response = client.post("/products/generate-slugs")
    assert response.status_code == 200
    assert "slugs générés" in response.json()["message"]
    session.refresh(p)
    assert p.slug == "sac-raphia"

def test_slug_accent(client, session):
    p = Product(
        name="Robe Élégante", slug=None, tag="T", genre="Femme",
        category="TENUES", price_ar=200000, image="x",
        colors="", sizes="M", stock_quantity=1,
    )
    session.add(p)
    session.commit()
    client.post("/products/generate-slugs")
    session.refresh(p)
    assert p.slug is not None
    assert "é" not in p.slug

def test_slug_unique(client, session):
    p1 = Product(
        name="Robe Rose", slug="robe-rose", tag="T", genre="Femme",
        category="TENUES", price_ar=100000, image="x",
        colors="", sizes="S", stock_quantity=1,
    )
    p2 = Product(
        name="Robe Rose", slug=None, tag="T", genre="Femme",
        category="TENUES", price_ar=110000, image="x",
        colors="", sizes="M", stock_quantity=2,
    )
    session.add(p1)
    session.add(p2)
    session.commit()
    client.post("/products/generate-slugs")
    session.refresh(p2)
    assert p2.slug == "robe-rose-1"
