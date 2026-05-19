# main.py
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import create_db_and_tables
from routes import products, settings, auth, users, orders, mvola, colors, clients
from routes import agent


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Crée toutes les tables (dont AgentSession)
    create_db_and_tables()

    # 2. Initialise le vectorstore RAG au démarrage
    try:
        from agent.vectorstore import build_vectorstore
        build_vectorstore()
        print("Agent Jatie — vectorstore RAG initialisé")
    except Exception as e:
        print(f"Agent Jatie — vectorstore non initialisé : {e}")
        print("   L'agent fonctionnera en mode fallback (DB directe)")

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

# ── Agent IA ────────────────────────────────────────────────────────────────
app.include_router(agent.router)