"""
ai/exemples/importer.py
Importe les paires « message de cliente -> réponse humaine d'Art Jatie » (export Messenger ANONYMISÉ)
dans exemple_vente : la vendeuse y cherche des exemples ressemblants pour parler comme Art Jatie.
Les exemples donnent le TON, jamais les faits (prix, stock : toujours les outils du code).

Le fichier reste HORS du dépôt. Il fait foi : un exemple retiré du fichier est retiré de la base.
Incrémental : seuls les nouveaux exemples sont vectorisés (par lots).
Lancement depuis /app : python -m ai.exemples.importer /chemin/paires.jsonl
"""
import hashlib
import json
import logging
import re
import sys

import psycopg2

from ai.core.db import db_config
from ai.utils.embedding import get_text_embeddings

TACHE = "text-matching"  # message de cliente comparé à des messages de clientes
LOT = 64
MINIMUM = 50  # en dessous, le fichier est sans doute incomplet : on ne touche à rien
NUMERO = re.compile(r"\+?\d[\d .\-]{6,}\d")
EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")

_SCHEMA = """
CREATE TABLE IF NOT EXISTS exemple_vente (
    id                  SERIAL PRIMARY KEY,
    cliente             TEXT NOT NULL,
    reponse_precedente  TEXT NOT NULL DEFAULT '',
    reponse             TEXT NOT NULL,
    empreinte           TEXT NOT NULL UNIQUE,
    embedding           vector(1024) NOT NULL,
    ajoute              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS exemple_vente_embedding_idx
    ON exemple_vente USING hnsw (embedding vector_cosine_ops);
"""


def masquer(texte: str) -> str:
    """Deuxième sécurité : aucun numéro ni e-mail n'entre en base, même si l'export en avait laissé."""
    return EMAIL.sub("[EMAIL]", NUMERO.sub("[NUMÉRO]", texte or "")).strip()


def charger(chemin: str) -> list[dict]:
    """Paires utiles, masquées, sans doublon."""
    exemples, vues = [], set()
    with open(chemin, encoding="utf-8") as f:
        for ligne in f:
            if not ligne.strip():
                continue
            p = json.loads(ligne)
            if p.get("sorte") != "utile":
                continue
            e = {"cliente": masquer(p.get("cliente"))[:1000],
                 "reponse_precedente": masquer(p.get("reponse_precedente"))[:300],
                 "reponse": masquer(p.get("reponse"))[:1000]}
            if not e["cliente"] or not e["reponse"]:
                continue
            e["empreinte"] = hashlib.sha256(f"{e['cliente']}\n->\n{e['reponse']}".encode("utf-8")).hexdigest()
            if e["empreinte"] not in vues:
                vues.add(e["empreinte"])
                exemples.append(e)
    return exemples


def importer(chemin: str) -> dict:
    exemples = charger(chemin)
    if len(exemples) < MINIMUM:
        raise SystemExit(f"Seulement {len(exemples)} exemples dans {chemin} : import annulé, base inchangée")
    stats = {"fichier": len(exemples), "nouveaux": 0, "inchanges": 0, "supprimes": 0}

    with psycopg2.connect(**db_config) as conn:
        with conn.cursor() as cur:
            cur.execute(_SCHEMA)
            cur.execute("SELECT empreinte FROM exemple_vente")
            existants = {r[0] for r in cur.fetchall()}
        conn.commit()

        nouveaux = [e for e in exemples if e["empreinte"] not in existants]
        stats["inchanges"] = len(exemples) - len(nouveaux)
        for debut in range(0, len(nouveaux), LOT):
            lot = nouveaux[debut:debut + LOT]
            vecteurs = get_text_embeddings([e["cliente"] for e in lot], task=TACHE)
            with conn.cursor() as cur:
                for e, v in zip(lot, vecteurs):
                    cur.execute(
                        """
                        INSERT INTO exemple_vente (cliente, reponse_precedente, reponse, empreinte, embedding)
                        VALUES (%s, %s, %s, %s, %s::vector) ON CONFLICT (empreinte) DO NOTHING
                        """,
                        (e["cliente"], e["reponse_precedente"], e["reponse"], e["empreinte"], str(v)),
                    )
            conn.commit()
            stats["nouveaux"] += len(lot)
            logging.info(f"[EXEMPLES] {stats['nouveaux']}/{len(nouveaux)} vectorisés")

        with conn.cursor() as cur:
            cur.execute("DELETE FROM exemple_vente WHERE NOT (empreinte = ANY(%s))",
                        ([e["empreinte"] for e in exemples],))
            stats["supprimes"] = cur.rowcount
        conn.commit()

    logging.info(f"[EXEMPLES] Terminé : {stats}")
    return stats


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    if len(sys.argv) != 2:
        raise SystemExit("Usage : python -m ai.exemples.importer /chemin/paires.jsonl")
    print(importer(sys.argv[1]))
