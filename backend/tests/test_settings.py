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
