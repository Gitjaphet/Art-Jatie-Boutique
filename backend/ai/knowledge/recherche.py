# ai/knowledge/recherche.py
"""Recherche hybride (sens + mots) des passages du site les plus utiles pour répondre à une question."""
import logging

import psycopg2

from ai.core.db import db_config
from ai.utils.embedding import get_text_embedding
from ai.utils.texte import mots, score_lexical

SEUIL_PASSAGE = 0.40  # calibré le 02/11/2026 : pertinents >= 0.41, hors sujet 0.34-0.38
NB_PASSAGES = 6


def chercher_passages(question: str, top_k: int = NB_PASSAGES) -> list[dict]:
    try:
        vecteur = str(get_text_embedding(question, task="retrieval.query"))
    except Exception as e:
        logging.error(f"[FAQ-RAG] Embedding indisponible, recherche par mots seule : {e}")
        vecteur = None

    try:
        with psycopg2.connect(**db_config) as conn, conn.cursor() as cur:
            if vecteur:
                cur.execute("SELECT url, titre, contenu, 1 - (embedding <=> %s::vector) FROM site_knowledge", (vecteur,))
            else:
                cur.execute("SELECT url, titre, contenu, 0.0 FROM site_knowledge")
            lignes = cur.fetchall()
    except Exception as e:
        logging.error(f"[FAQ-RAG] Base indisponible : {e}")
        return []

    mots_question = mots(question)
    candidats = []
    for url, titre, contenu, similarite in lignes:
        total = float(similarite) + score_lexical(mots_question, titre, contenu)
        if total >= SEUIL_PASSAGE:
            candidats.append((total, {"url": url, "titre": titre, "contenu": contenu, "score": round(total, 3)}))

    candidats.sort(key=lambda c: c[0], reverse=True)
    retenus = [p for _, p in candidats[:top_k]]
    logging.info(f"[FAQ-RAG] {question!r} -> " + (", ".join(f"{p['url']}:{p['score']}" for p in retenus) or "aucun passage"))
    return retenus
