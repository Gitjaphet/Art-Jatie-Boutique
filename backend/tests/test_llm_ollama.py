"""Ollama (modèle v3 sur le VPS) comme fournisseur d'appeler_modele : sans clé, avec son propre délai."""
import httpx
import pytest

from ai.core import llm
from ai.core.llm_config import CHAINES

MESSAGES = [{"role": "user", "content": "Cliente : ok\nSens à exprimer : Merci."}]


class _Reponse:
    def __init__(self, status_code=200, data=None):
        self.status_code = status_code
        self._data = data or {"choices": [{"message": {"content": "Misaotra belle"}}]}
        self.text = str(self._data)

    def json(self):
        return self._data


def _capturer(monkeypatch) -> dict:
    """Remplace httpx.post et garde ce qui lui a été envoyé."""
    vu = {}

    def faux_post(url, headers=None, json=None, timeout=None):
        vu.update(url=url, headers=headers, json=json, timeout=timeout)
        return _Reponse()

    monkeypatch.setattr(llm.httpx, "post", faux_post)
    return vu


def test_ollama_sans_cle_ni_authorization(monkeypatch):
    vu = _capturer(monkeypatch)
    res = llm.appeler_modele("ollama", "artjatie-vendeuse", {}, MESSAGES, max_tokens=120)
    assert res["contenu"] == "Misaotra belle"
    assert "Authorization" not in vu["headers"]
    assert vu["url"].endswith("/v1/chat/completions")
    assert vu["timeout"] == 60


def test_groq_garde_sa_cle_et_son_delai(monkeypatch):
    vu = _capturer(monkeypatch)
    monkeypatch.setenv("GROQ_API_KEY", "test")
    llm.appeler_modele("groq", "openai/gpt-oss-20b", {}, MESSAGES, max_tokens=50)
    assert vu["headers"]["Authorization"] == "Bearer test"
    assert vu["timeout"] == 30


def test_ollama_eteint_devient_indisponible(monkeypatch):
    def refuse(*args, **kwargs):
        raise httpx.ConnectError("connexion refusée")

    monkeypatch.setattr(llm.httpx, "post", refuse)
    with pytest.raises(llm.ModeleIndisponible):
        llm.appeler_modele("ollama", "artjatie-vendeuse", {}, MESSAGES, max_tokens=120)


def test_styliste_ne_quitte_jamais_le_vps():
    """Messages de clientes : la chaîne du styliste n'utilise que notre Ollama, aucun service externe."""
    assert CHAINES["styliste"]
    assert all(fournisseur == "ollama" for fournisseur, _, _ in CHAINES["styliste"])
