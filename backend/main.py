from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import create_db_and_tables

# Importation des routeurs
from routes import products, settings, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(title="Art Jatie API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # On accepte tout pour le moment
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "L'API Art Jatie est en ligne ! 🇲🇬"}

# On connecte les routes ici
app.include_router(products.router, prefix="/products", tags=["Produits"])
app.include_router(settings.router, prefix="/settings", tags=["Réglages"])
app.include_router(auth.router, prefix="/auth", tags=["Authentification"])