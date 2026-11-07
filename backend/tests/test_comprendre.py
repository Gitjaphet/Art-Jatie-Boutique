import json

from ai.agents import comprendre as module
from ai.agents.comprendre import comprendre, nettoyer


def _repond(args):
    return lambda *a, **k: {"tool_calls": [{"function": {"name": "comprendre", "arguments": json.dumps(args)}}]}


def test_valeurs_hors_catalogue_retirees():
    r = nettoyer({"intention": "recherche", "types": ["Maillot", "Pantalon"], "couleurs": ["Rose", "Fluo"],
                  "tailles": ["M", "42"]}, "un truc pour la plage")
    assert r["types"] == ["Maillot"] and r["couleurs"] == ["Rose"] and r["tailles"] == ["M"]


def test_budget_invente_refuse():
    assert nettoyer({"intention": "recherche", "budget_max": 30000}, "un joli maillot")["budget_max"] is None


def test_budget_ecrit_garde():
    assert nettoyer({"intention": "recherche", "budget_max": 30000}, "max 30k")["budget_max"] == 30000
    assert nettoyer({"intention": "recherche", "budget_max": 30000}, "pas plus de 30 000 ar")["budget_max"] == 30000


def test_intention_inconnue_devient_autre():
    assert nettoyer({"intention": "commander"}, "x")["intention"] == "autre"


def test_appel_complet(monkeypatch):
    monkeypatch.setattr(module, "appeler_llm", _repond({"intention": "recherche", "types": ["Maillot", "Ensemble"]}))
    r = comprendre([], "je cherche un truc sympa pour aller à la plage")
    assert r["intention"] == "recherche" and r["types"] == ["Maillot", "Ensemble"]


def test_panne_rend_none(monkeypatch):
    def panne(*a, **k):
        raise module.ModeleIndisponible("aucun modèle")
    monkeypatch.setattr(module, "appeler_llm", panne)
    assert comprendre([], "bla") is None
