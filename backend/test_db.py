import os
from dotenv import load_dotenv
import psycopg2
from urllib.parse import urlparse

load_dotenv()

_url = urlparse(os.getenv("DATABASE_URL"))
config = {
    "host":     _url.hostname,
    "port":     _url.port or 5432,
    "dbname":   _url.path.lstrip("/"),
    "user":     _url.username,
    "password": _url.password,
    "sslmode":  os.getenv("DB_SSLMODE", "disable"),
}

print("Config chargée :", {**config, "password": "***"})

try:
    conn = psycopg2.connect(**config)
    cur = conn.cursor()
    cur.execute("SELECT version();")
    print("✅ Connexion OK :", cur.fetchone()[0])
    cur.close()
    conn.close()
except Exception as e:
    print("❌ Erreur :", e)