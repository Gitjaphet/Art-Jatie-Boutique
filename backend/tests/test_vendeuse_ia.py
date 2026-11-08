"""Brique 3 de la vendeuse IA : la boucle (modèle simulé, ni réseau ni base)."""
import json

import pytest

from ai.core.llm import ModeleIndisponible
from ai.vendeuse_ia import vendeuse

_PRODUITS = [
    {"id": 1, "nom": "Robe Rouge Soleil", "type_article": "Robe", "prix_ar": 50000, "familles": ["Rouge"],
     "stock": 1, "sur_commande": True, "tailles": "S,M", "images": []},
]


@pytest.fixture(autouse=True)
def _sans_exemples(monkeypatch):
    monkeypatch.setattr(vendeuse, "trouver_exemples", lambda m: [])


def _modele(monkeypatch, reponses, vus=None):
    """Simule le modèle : rend les réponses dans l'ordre et garde les messages reçus."""
    file = list(reponses)

    def faux(role, messages, **k):
        if vus is not None:
            vus.append(messages)
        return file.pop(0)
    monkeypatch.setattr(vendeuse, "appeler_llm", faux)


def _outil(nom, args):
    return {"contenu": "", "tool_calls": [{"id": "a1", "function": {"name": nom, "arguments": json.dumps(args)}}]}


def test_consigne_remplie_sans_casser_le_json():
    texte = vendeuse.consigne("misy robe ve", {"types": ["Robe"], "montres": [1]}, _PRODUITS)
    assert "{lexique}" not in texte and "{memoire}" not in texte and "{exemples}" not in texte
    assert "zah = zaho" in texte and "Robe Rouge Soleil (id 1)" in texte
    assert '{"texte": "ta réponse"' in texte  # les accolades du format restent intactes


def test_boucle_outil_puis_reponse(monkeypatch):
    recus = []
    final = {"contenu": json.dumps({"texte": "Misy belle", "produits": [1, 99], "suggestions": ["Eny"]}), "tool_calls": None}
    _modele(monkeypatch, [_outil("chercher_produits", {"types": ["Robe"]}), final], recus)
    r = vendeuse.repondre("misy robe mena ve ?", [], None, _PRODUITS)
    assert r == {"texte": "Misy belle", "produits": [1], "suggestions": ["Eny"]}  # id 99 inventé : ignoré
    assert recus[1][-1]["role"] == "tool" and "50 000 Ar" in recus[1][-1]["content"]


def test_commande_rend_la_main_au_parcours(monkeypatch):
    _modele(monkeypatch, [_outil("demarrer_commande", {"produit_id": 1})])
    assert vendeuse.repondre("tiako io", [], None, _PRODUITS) == {"commander": 1}


def test_texte_hors_json_garde(monkeypatch):
    _modele(monkeypatch, [{"contenu": "Bonjour belle 😊", "tool_calls": None}])
    assert vendeuse.repondre("salama", [], None, _PRODUITS)["texte"] == "Bonjour belle 😊"


def test_panne_du_modele_rend_none(monkeypatch):
    def panne(*a, **k):
        raise ModeleIndisponible("test")
    monkeypatch.setattr(vendeuse, "appeler_llm", panne)
    assert vendeuse.repondre("salama", [], None, _PRODUITS) is None
