# ai/knowledge/indexeur.py
"""
Indexe le contenu public du site (pages d'information) dans site_knowledge, pour le RAG de la FAQ.
On lit le site PUBLIÉ : tout changement visible (fr.json, composant, page) est pris en compte.
Incrémental : seuls les passages dont le texte a changé sont re-vectorisés.
Lancement depuis /app : python -m ai.knowledge.indexeur
"""
import hashlib
import html as html_lib
import logging
import os
import re

import httpx
import psycopg2

from ai.core.db import db_config
from ai.utils.embedding import get_text_embedding

SITE_URL = os.getenv("SITE_URL", "https://artjatie.com")
PAGES = ["/formation", "/livraison", "/guide", "/histoire", "/contact"]
TAILLE_PASSAGE = 600
TEXTE_MINIMUM = 200  # en dessous, la page est sans doute cassée : on garde l'ancienne version

_SCHEMA = """
CREATE TABLE IF NOT EXISTS site_knowledge (
    id          SERIAL PRIMARY KEY,
    url         TEXT NOT NULL,
    titre       TEXT NOT NULL DEFAULT '',
    position    INTEGER NOT NULL,
    contenu     TEXT NOT NULL,
    empreinte   TEXT NOT NULL,
    embedding   vector(1024) NOT NULL,
    mis_a_jour  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (url, position)
);
CREATE INDEX IF NOT EXISTS site_knowledge_embedding_idx
    ON site_knowledge USING hnsw (embedding vector_cosine_ops);
"""

_BALISES_BLOC = r"</?(p|div|section|article|li|ul|ol|h[1-6]|br|tr|table|blockquote)\b[^>]*>"
_BALISES_IGNOREES = r"(?is)<(script|style|noscript|svg|header|nav|footer)\b[^>]*>.*?</\1>"


def extraire_texte(page_html: str) -> tuple[str, str]:
    """Retourne (titre, texte) : contenu principal de la page, une idée par ligne."""
    m = re.search(r"(?is)<title[^>]*>(.*?)</title>", page_html)
    titre = html_lib.unescape(m.group(1)).split("|")[0].strip() if m else ""

    m = re.search(r"(?is)<main\b[^>]*>(.*)</main>", page_html)
    corps = m.group(1) if m else page_html
    corps = re.sub(_BALISES_IGNOREES, " ", corps)
    corps = re.sub(r"(?i)" + _BALISES_BLOC, "\n", corps)
    corps = re.sub(r"(?s)<[^>]+>", " ", corps)
    corps = html_lib.unescape(corps)

    lignes = (re.sub(r"\s+", " ", ligne).strip() for ligne in corps.split("\n"))
    return titre, "\n".join(ligne for ligne in lignes if ligne)


def decouper(titre: str, texte: str, taille: int = TAILLE_PASSAGE) -> list[str]:
    """Regroupe les lignes en passages d'environ `taille` caractères, sans couper une ligne."""
    passages, courant = [], ""
    for ligne in texte.split("\n"):
        if courant and len(courant) + len(ligne) + 1 > taille:
            passages.append(courant)
            courant = ""
        courant = f"{courant}\n{ligne}" if courant else ligne
    if courant:
        passages.append(courant)
    return [f"{titre}\n{p}" if titre else p for p in passages]


def _empreinte(contenu: str) -> str:
    return hashlib.sha256(contenu.encode("utf-8")).hexdigest()


def indexer_site() -> dict:
    stats = {"pages": 0, "nouveaux": 0, "inchanges": 0, "supprimes": 0, "erreurs": 0}

    with psycopg2.connect(**db_config) as conn:
        with conn.cursor() as cur:
            cur.execute(_SCHEMA)
            cur.execute("DELETE FROM site_knowledge WHERE NOT (url = ANY(%s))", (PAGES,))
            stats["supprimes"] += cur.rowcount
        conn.commit()

        for url in PAGES:
            try:
                r = httpx.get(SITE_URL + url, timeout=30, follow_redirects=True)
                r.raise_for_status()
                titre, texte = extraire_texte(r.text)
                if len(texte) < TEXTE_MINIMUM:
                    raise ValueError(f"texte trop court ({len(texte)} caractères)")
                passages = decouper(titre, texte)

                with conn.cursor() as cur:
                    cur.execute("SELECT position, empreinte FROM site_knowledge WHERE url = %s", (url,))
                    existants = dict(cur.fetchall())

                    for position, contenu in enumerate(passages):
                        empreinte = _empreinte(contenu)
                        if existants.get(position) == empreinte:
                            stats["inchanges"] += 1
                            continue
                        vecteur = get_text_embedding(contenu)
                        cur.execute(
                            """
                            INSERT INTO site_knowledge (url, titre, position, contenu, empreinte, embedding)
                            VALUES (%s, %s, %s, %s, %s, %s::vector)
                            ON CONFLICT (url, position) DO UPDATE SET
                                titre = EXCLUDED.titre, contenu = EXCLUDED.contenu,
                                empreinte = EXCLUDED.empreinte, embedding = EXCLUDED.embedding,
                                mis_a_jour = now()
                            """,
                            (url, titre, position, contenu, empreinte, str(vecteur)),
                        )
                        stats["nouveaux"] += 1

                    cur.execute("DELETE FROM site_knowledge WHERE url = %s AND position >= %s", (url, len(passages)))
                    stats["supprimes"] += cur.rowcount
                conn.commit()
                stats["pages"] += 1
                logging.info(f"[INDEXEUR] {url} : {len(passages)} passage(s)")
            except Exception as e:
                conn.rollback()
                stats["erreurs"] += 1
                logging.error(f"[INDEXEUR] {url} ignorée, ancienne version conservée : {e}")

    logging.info(f"[INDEXEUR] Terminé : {stats}")
    return stats


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)
    print(indexer_site())
