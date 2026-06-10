# ai/core/db.py
import os
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

_url = urlparse(os.getenv("DATABASE_URL"))

db_config = {
    "host":     _url.hostname,
    "port":     _url.port or 5432,
    "dbname":   _url.path.lstrip("/"),
    "user":     _url.username,
    "password": _url.password,
    "sslmode":  os.getenv("DB_SSLMODE", "disable"),
}