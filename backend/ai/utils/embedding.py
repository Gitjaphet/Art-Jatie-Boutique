"""
ai/utils/embedding.py
Embeddings texte Jina v3 (1024 dimensions) : produits, pages du site (FAQ), exemples de vente.
jina-embeddings-v3 est un modèle TEXTE : la recherche par image utilisera un modèle multimodal dédié.
"""
import os
import requests

JINA_URL = "https://api.jina.ai/v1/embeddings"
JINA_MODEL = "jina-embeddings-v3"
JINA_DIMENSIONS = 1024


def get_text_embeddings(textes: list[str], task: str = "retrieval.passage") -> list[list[float]]:
    """Plusieurs textes en un seul appel, dans l'ordre des textes donnés."""
    cle = os.getenv("JINA_API_KEY")
    if not cle:
        raise RuntimeError("JINA_API_KEY manquant dans les variables d'environnement")
    response = requests.post(
        JINA_URL,
        headers={"Authorization": f"Bearer {cle}", "Content-Type": "application/json"},
        json={"model": JINA_MODEL, "input": textes, "task": task, "dimensions": JINA_DIMENSIONS},
        timeout=60,
    )
    response.raise_for_status()
    donnees = sorted(response.json()["data"], key=lambda d: d["index"])
    return [d["embedding"] for d in donnees]


def get_text_embedding(texte: str, task: str = "retrieval.passage") -> list[float]:
    return get_text_embeddings([texte], task)[0]
