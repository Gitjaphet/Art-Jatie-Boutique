"""Branchement de la nouvelle vendeuse : interrupteur, secours vers l'ancienne Jatie, cartes, commande."""
import pytest

from ai.vendeuse_ia import vente

CATALOGUE = [{"id": 1, "nom": "Sac rouge"}, {"id": 2, "nom": "Robe noire"}]


@pytest.fixture
def simuler(monkeypatch):
    """Catalogue fixe, vendeuse et styliste simulés ; renvoie la liste des appels reçus."""
    appels = {"vendeuse": [], "styliste": []}

    def installer(reponse_vendeuse):
        monkeypatch.setattr(vente, "charger_produits", lambda: CATALOGUE)

        def fausse_vendeuse(message, history, fiche, produits, token_log=None):
            appels["vendeuse"].append(message)
            return reponse_vendeuse

        def faux_styliste(texte, message_cliente, langue, token_log=None):
            appels["styliste"].append((texte, langue))
            return f"[{langue}] {texte}"

        monkeypatch.setattr(vente, "repondre", fausse_vendeuse)
        monkeypatch.setattr(vente, "mettre_en_style", faux_styliste)
        return appels
    return installer


def test_eteint_par_defaut_aucun_appel(monkeypatch, simuler):
    monkeypatch.delenv("VENDEUSE_IA", raising=False)
    appels = simuler({"texte": "x", "produits": [], "suggestions": []})
    assert vente.vendre("Misy sac ?", [], {}, "mg") is None
    assert appels["vendeuse"] == []


@pytest.mark.parametrize("valeur", ["on", "ON", "1", "true", "oui"])
def test_allume(monkeypatch, valeur):
    monkeypatch.setenv("VENDEUSE_IA", valeur)
    assert vente.active()


def test_vendeuse_indisponible_rend_la_main(monkeypatch, simuler):
    monkeypatch.setenv("VENDEUSE_IA", "on")
    simuler(None)
    assert vente.vendre("Misy sac ?", [], {}, "mg") is None


def test_commander_passe_tel_quel(monkeypatch, simuler):
    monkeypatch.setenv("VENDEUSE_IA", "on")
    appels = simuler({"commander": 2})
    assert vente.vendre("Ataoko io", [], {}, "mg") == {"commander": 2}
    assert appels["styliste"] == []


def test_reponse_mise_en_style_avec_fiches(monkeypatch, simuler):
    monkeypatch.setenv("VENDEUSE_IA", "on")
    appels = simuler({"texte": "Le sac rouge coûte 45 000 Ar.", "produits": [1, 99], "suggestions": ["Robes"]})
    r = vente.vendre("Ohatrinona ?", [], {}, "mg")
    assert r["texte"] == "[mg] Le sac rouge coûte 45 000 Ar."
    assert r["produits"] == [CATALOGUE[0]]          # id inconnu (99) écarté
    assert r["suggestions"] == ["Robes"]
    assert appels["styliste"] == [("Le sac rouge coûte 45 000 Ar.", "mg")]
