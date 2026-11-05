import logging
import os

from dotenv import load_dotenv
from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./artjatie.db")
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args, pool_pre_ping=True)


def sync_table_columns(moteur=engine) -> list:
    """Ajoute en base les colonnes déclarées dans models.py mais absentes de la base.

    - Noms entre guillemets selon le dialecte : « order » est un mot réservé en PostgreSQL.
    - Une transaction par colonne : un échec n'empêche pas les autres ajouts.
    - IF NOT EXISTS (PostgreSQL) : les 2 workers uvicorn démarrent en même temps.
    - Jamais d'échec silencieux : chaque échec est journalisé en erreur, puis RuntimeError.
    Renvoie la liste des colonnes ajoutées (« table.colonne »).
    """
    inspector = inspect(moteur)
    quote = moteur.dialect.identifier_preparer.quote
    si_absente = " IF NOT EXISTS" if moteur.dialect.name == "postgresql" else ""
    ajoutees, echecs = [], []

    for table_name, table in SQLModel.metadata.tables.items():
        if not inspector.has_table(table_name):
            continue  # create_all s'en occupe
        existantes = {col["name"] for col in inspector.get_columns(table_name)}

        for column in table.columns:
            if column.name in existantes:
                continue
            col_type = column.type.compile(moteur.dialect)
            default = ""
            if column.default is not None and column.default.is_scalar:
                val = column.default.arg
                default = f" DEFAULT '{val}'" if isinstance(val, str) else f" DEFAULT {val}"
            sql = (f"ALTER TABLE {quote(table_name)} ADD COLUMN{si_absente} "
                   f"{quote(column.name)} {col_type}{default}")
            try:
                with moteur.begin() as conn:
                    conn.execute(text(sql))
                ajoutees.append(f"{table_name}.{column.name}")
                logger.warning("Colonne ajoutée en base : %s.%s", table_name, column.name)
            except Exception:
                logger.exception("ÉCHEC ajout colonne %s.%s — SQL : %s", table_name, column.name, sql)
                echecs.append(f"{table_name}.{column.name}")

    if echecs:
        raise RuntimeError(f"Colonnes absentes de la base malgré la synchronisation : {', '.join(echecs)}")
    return ajoutees


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)  # crée les tables manquantes
    sync_table_columns()                   # ajoute les colonnes manquantes
    logger.info("Base de données synchronisée avec succès.")


def get_session():
    with Session(engine) as session:
        yield session
