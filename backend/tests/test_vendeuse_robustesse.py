"""Robustesse de la vendeuse IA face aux appels d'outils mal formés."""
import json

import pytest

from ai.core import llm
from ai.core.llm import ModeleIndisponible, appeler_modele
from ai.vendeuse_ia.outils import OUTILS, executer

MESSAGES = [{"role": "user", "content": "aia m misy anaro"}]


def test_champs_facultatifs_acceptent_null():
    schema = next(o for o in OUTILS if o["function"]["name"] == "chercher_produits")["function"]["parameters"]
    for nom, champ in schema["properties"].items():
        assert "null" in champ["type"], nom
    nuls = {nom: None for nom in schema["properties"]}
    assert "erreur" not in executer("chercher_produits", json.dumps(nuls), [])


class _Reponse:
    def __init__(self, statut: int, corps: dict):
        self.status_code, self._corps, self.text = statut, corps, json.dumps(corps)

    def json(self) -> dict:
        return self._corps


_OUTIL_CASSE = _Reponse(400, {"error": {"code": "tool_use_failed", "message": "attempted to call tool 'json'"}})
_OK = _Reponse(200, {"choices": [{"message": {"content": "Senganinga belle"}}], "usage": {}})


def _simuler(monkeypatch, reponses: list) -> list:
    appels: list = []

    def faux_post(*args, **kwargs):
        appels.append(1)
        return reponses[len(appels) - 1]

    monkeypatch.setenv("GROQ_API_KEY", "test")
    monkeypatch.setattr(llm.httpx, "post", faux_post)
    return appels


def test_outil_mal_forme_reessaye_une_fois(monkeypatch):
    appels = _simuler(monkeypatch, [_OUTIL_CASSE, _OK])
    res = appeler_modele("groq", "m", {}, MESSAGES, 50)
    assert res["contenu"] == "Senganinga belle"
    assert len(appels) == 2


def test_deux_echecs_passent_au_modele_suivant(monkeypatch):
    appels = _simuler(monkeypatch, [_OUTIL_CASSE, _OUTIL_CASSE])
    with pytest.raises(ModeleIndisponible):
        appeler_modele("groq", "m", {}, MESSAGES, 50)
    assert len(appels) == 2


def test_autre_erreur_400_sans_nouvelle_tentative(monkeypatch):
    appels = _simuler(monkeypatch, [_Reponse(400, {"error": {"message": "bad request"}})])
    with pytest.raises(ModeleIndisponible):
        appeler_modele("groq", "m", {}, MESSAGES, 50)
    assert len(appels) == 1
