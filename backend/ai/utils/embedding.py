"""
utils/embedding.py
──────────────────
Helper Jina Embeddings v3 — texte et image (via URL publique).
Modèle : jina-embeddings-v3 (1024 dimensions)
"""

import os
import requests
from typing import Optional

JINA_API_KEY = os.getenv("JINA_API_KEY")
JINA_URL = "https://api.jina.ai/v1/embeddings"
JINA_DIMENSIONS = 1024


def _jina_headers() -> dict:
    if not JINA_API_KEY:
        raise RuntimeError("JINA_API_KEY manquant dans les variables d'environnement")
    return {
        "Authorization": f"Bearer {JINA_API_KEY}",
        "Content-Type": "application/json",
    }


def get_text_embedding(texte: str) -> list[float]:
    """
    Transforme un texte en vecteur 1024d via Jina Embedding v3.
    task='retrieval.passage' → optimisé pour l'indexation de documents.
    """
    response = requests.post(
        JINA_URL,
        headers=_jina_headers(),
        json={
            "model": "jina-embeddings-v3",
            "input": [texte],
            "task": "retrieval.passage",
            "dimensions": JINA_DIMENSIONS,
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()["data"][0]["embedding"]


def get_image_embedding(image_url: str) -> list[float]:
    response = requests.post(
        JINA_URL,
        headers=_jina_headers(),
        json={
            "model": "jina-embeddings-v3",
            "input": [image_url],   # ← URL directement en string, pas {"image": url}
            "task": "retrieval.passage",
            "dimensions": JINA_DIMENSIONS,
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()["data"][0]["embedding"]


def get_combined_embedding(texte: str, image_url: Optional[str] = None) -> list[float]:
    """
    Retourne un vecteur combiné texte+image (moyenne des deux),
    ou uniquement texte si pas d'image disponible.
    """
    text_vec = get_text_embedding(texte)

    if not image_url:
        return text_vec

    try:
        image_vec = get_image_embedding(image_url)
        # Moyenne des deux vecteurs (fusion multimodale simple)
        combined = [
            (t + i) / 2.0
            for t, i in zip(text_vec, image_vec)
        ]
        return combined
    except Exception as e:
        # Si l'image est inaccessible (URL privée, timeout...), on garde juste le texte
        print(f"[embedding] Image embedding échoué ({e}), fallback texte seul.")
        return text_vec