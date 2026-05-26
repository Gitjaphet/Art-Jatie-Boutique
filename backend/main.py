# main.py
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import create_db_and_tables
from routes import products, settings, auth, users, orders, mvola, colors, clients



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialisation sécurisée
    try:
        print("Tentative de création des tables...")
        create_db_and_tables()
        print("Tables vérifiées avec succès.")
    except Exception as e:
        print(f"Attention : Erreur lors de la création des tables : {e}")
        # On ne bloque pas le démarrage ici pour permettre au serveur de monter
        # et de voir les logs d'erreur précis
    
    yield


app = FastAPI(
    title="Art Jatie API",
    description="Backend boutique crochet artisanal + Agent IA Jatie",
    version="2.0.0",
    lifespan=lifespan,
)

Instrumentator().instrument(app).expose(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://art-jatie-boutique.vercel.app",
        "https://art-jatie-boutique.vercel.app/",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "L'API Art Jatie est en ligne ! 🇲🇬"}


@app.get("/health")
def health():
    return {"status": "ok"}


# ── Routes existantes ───────────────────────────────────────────────────────
app.include_router(products.router, prefix="/products",  tags=["Produits"])
app.include_router(settings.router, prefix="/settings",  tags=["Réglages"])
app.include_router(auth.router,     prefix="/auth",      tags=["Authentification"])
app.include_router(users.router,    prefix="/users",     tags=["Utilisateurs"])
app.include_router(orders.router,   prefix="/orders",    tags=["Commandes"])
app.include_router(clients.router,  prefix="/clients",   tags=["Clients CRM"])
app.include_router(mvola.router,    prefix="/mvola",     tags=["MVola"])
app.include_router(colors.router,   prefix="/colors",    tags=["Couleurs"])

