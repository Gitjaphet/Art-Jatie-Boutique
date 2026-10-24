from core.auth import get_current_admin


def test_get_settings(client, settings):
    response = client.get("/settings/")
    assert response.status_code == 200
    data = response.json()
    assert data["exchange_rate_eur"] == 4500.0
    assert "available_colors" in data
    assert "available_categories" in data


def test_settings_categories(client, settings):
    response = client.get("/settings/")
    categories = response.json()["available_categories"].split(",")
    assert "TENUES" in categories
    assert "ACCESSOIRES" in categories


def test_patch_settings_sans_jeton_refuse(client, settings):
    response = client.patch("/settings/?new_rate=1")
    assert response.status_code in (401, 403)
    # Le refus ne doit rien avoir modifié en base
    assert client.get("/settings/").json()["exchange_rate_eur"] == 4500.0


def test_patch_settings_admin(client, settings):
    # Simule un admin connecté sans fabriquer de vrai JWT
    client.app.dependency_overrides[get_current_admin] = lambda: {"is_admin": True}
    try:
        response = client.patch("/settings/?new_rate=5000")
    finally:
        client.app.dependency_overrides.pop(get_current_admin, None)
    assert response.status_code == 200
    assert response.json()["exchange_rate_eur"] == 5000.0


def test_patch_settings_taux_invalide(client, settings):
    client.app.dependency_overrides[get_current_admin] = lambda: {"is_admin": True}
    try:
        response = client.patch("/settings/?new_rate=0")
    finally:
        client.app.dependency_overrides.pop(get_current_admin, None)
    assert response.status_code == 400
