from sqlmodel import create_engine, SQLModel, Session
from sqlalchemy import text, inspect
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./artjatie.db")
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

def sync_table_columns():
    """Compare models.py avec la DB et ajoute les colonnes manquantes automatiquement"""
    inspector = inspect(engine)
    
    with engine.connect() as conn:
        for table_name, table in SQLModel.metadata.tables.items():
            # Vérifie si la table existe
            if not inspector.has_table(table_name):
                continue  # create_all s'en occupe
            
            # Colonnes existantes dans la DB
            existing_columns = {col["name"] for col in inspector.get_columns(table_name)}
            
            # Colonnes définies dans models.py
            for column in table.columns:
                if column.name not in existing_columns:
                    # Colonne manquante → on l'ajoute
                    col_type = column.type.compile(engine.dialect)
                    nullable = "NULL" if column.nullable else "NOT NULL"
                    default = ""
                    if column.default is not None and column.default.is_scalar:
                        val = column.default.arg
                        if isinstance(val, str):
                            default = f"DEFAULT '{val}'"
                        else:
                            default = f"DEFAULT {val}"
                    
                    sql = f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {column.name} {col_type} {default}"
                    print(f"→ Ajout colonne manquante : {table_name}.{column.name}")
                    conn.execute(text(sql))
        
        conn.commit()

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)  # Crée les tables manquantes
    sync_table_columns()                   # Ajoute les colonnes manquantes
    print("Base de données synchronisée avec succès.")

def get_session():
    with Session(engine) as session:
        yield session