import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

config = {
    "host":     os.getenv("DB_HOST"),
    "port":     int(os.getenv("DB_PORT", 5432)),
    "dbname":   os.getenv("DB_NAME"),
    "user":     os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
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