"""
migrate_planning.py
-------------------
Script de migration pour ajouter les colonnes planning_status et planning_note
à la table order existante (SQLite).

Usage :
    python migrate_planning.py

À exécuter UNE SEULE FOIS depuis le dossier backend/.
"""

import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv("DATABASE_URL", "sqlite:///./artjatie.db").replace("sqlite:///", "")

def run():
    print(f"[Migration] Connexion à : {DB_PATH}")
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    # Vérifier les colonnes existantes
    cur.execute("PRAGMA table_info('order')")
    existing = {row[1] for row in cur.fetchall()}
    print(f"[Migration] Colonnes existantes : {existing}")

    added = []

    if "planning_status" not in existing:
        cur.execute("ALTER TABLE 'order' ADD COLUMN planning_status TEXT DEFAULT NULL")
        added.append("planning_status")
        print("[Migration] Colonne planning_status ajoutée")
    else:
        print("[Migration] planning_status existe déjà — ignoré")

    if "planning_note" not in existing:
        cur.execute("ALTER TABLE 'order' ADD COLUMN planning_note TEXT DEFAULT NULL")
        added.append("planning_note")
        print("[Migration] Colonne planning_note ajoutée")
    else:
        print("[Migration] planning_note existe déjà — ignoré")

    con.commit()
    con.close()

    if added:
        print(f"\n[Migration] Migration terminée — colonnes ajoutées : {', '.join(added)}")
    else:
        print("\n[Migration] Base de données déjà à jour — rien à faire")

if __name__ == "__main__":
    run()