from sqlmodel import create_engine, SQLModel, Session
import os
from dotenv import load_dotenv

load_dotenv()

# Par défaut, SQLite crée un fichier "artjatie.db" dans ton dossier backend
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./artjatie.db")

# Configuration spécifique nécessaire pour SQLite
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, echo=True, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session