"""
ai/utils/embedding.py
Embeddings texte Jina v3 (1024 dimensions) pour l'indexation des produits.
jina-embeddings-v3 est un modèle TEXTE : la recherche par image utilisera un modèle multimodal dédié.
"""
import os
import requests

JINA_URL = "https://api.jina.ai/v1/embeddings"
JINA_MODEL = "jina-embeddings-v3"
JINA_DIMENSIONS = 1024


def get_text_embedding(texte: str, task: str = "retrieval.passage") -> list[float]:
    cle = os.getenv("JINA_API_KEY")
    if not cle:
        raise RuntimeError("JINA_API_KEY manquant dans les variables d'environnement")
    response = requests.post(
        JINA_URL,
        headers={"Authorization": f"Bearer {cle}", "Content-Type": "application/json"},
        json={"model": JINA_MODEL, "input": [texte], "task": task, "dimensions": JINA_DIMENSIONS},
        timeout=30,
    )
    response.raise_for_status()
    return response.json()["data"][0]["embedding"]
