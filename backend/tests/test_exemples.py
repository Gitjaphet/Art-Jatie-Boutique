"""Exemples de vente : chargement de l'export anonymisé et embeddings par lot (sans base ni réseau)."""
import json

from ai.exemples.importer import charger


def _fichier(tmp_path, paires):
    f = tmp_path / "paires.jsonl"
    f.write_text("\n".join(json.dumps(p, ensure_ascii=False) for p in paires), encoding="utf-8")
    return str(f)


def test_charger_garde_les_utiles_masque_et_dedoublonne(tmp_path):
    utile = {"cliente": "misy tenu de soirée ve ? appelez 034 12 345 67", "reponse": "Misy belle", "sorte": "utile"}
    chemin = _fichier(tmp_path, [
        utile, utile,                                                  # doublon
        {"cliente": "merci", "reponse": "Ya belle", "sorte": "courte"},  # trop courte pour servir d'exemple
        {"cliente": "", "reponse": "Bonjour belle", "sorte": "utile"},   # sans question
    ])
    exemples = charger(chemin)
    assert len(exemples) == 1
    assert "[NUMÉRO]" in exemples[0]["cliente"] and "034" not in exemples[0]["cliente"]


def test_embeddings_par_lot_dans_l_ordre(monkeypatch):
    from ai.utils import embedding

    class Reponse:
        def raise_for_status(self):
            pass

        def json(self):  # Jina peut répondre dans le désordre : l'index fait foi
            return {"data": [{"index": 1, "embedding": [2.0]}, {"index": 0, "embedding": [1.0]}]}

    monkeypatch.setenv("JINA_API_KEY", "test")
    monkeypatch.setattr(embedding.requests, "post", lambda *a, **k: Reponse())
    assert embedding.get_text_embeddings(["a", "b"]) == [[1.0], [2.0]]
