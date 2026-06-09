from fastapi import FastAPI, Query
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from contextlib import asynccontextmanager
import os
import httpx

from database import create_db_and_tables
from routes import products, settings, auth, users, orders, mvola, colors, clients, agent


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        print("Tentative de création des tables...")
        create_db_and_tables()
        print("Tables vérifiées avec succès.")
    except Exception as e:
        print(f"Attention : Erreur : {e}")
    yield


# 1. On déclare d'abord l'application FastAPI !
app = FastAPI(
    root_path="/api",
    title="Art Jatie API",
    description="Backend boutique crochet artisanal + Agent IA Jatie",
    version="2.0.0",
    lifespan=lifespan,
)

Instrumentator().instrument(app).expose(app)

# 2. On configure les Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://art-jatie-boutique.vercel.app",
        "https://art-jatie-boutique.vercel.app/",
        "https://artjatie.com",
        "https://www.artjatie.com",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


# 3. Les routes globales
@app.get("/")
def home():
    return {"message": "L'API Art Jatie est en ligne ! 🇲🇬"}


@app.get("/health")
def health():
    return {"status": "ok"}


# 📥 Nouvelle route de téléchargement forcé via Flux de données (Streaming)
@app.get("/download-image")
async def download_image_endpoint(url: str = Query(..., description="URL complète de l'image")):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, follow_redirects=True)
            
        if response.status_code != 200:
            return JSONResponse(status_code=400, content={"message": "Impossible de récupérer l'image d'origine"})
        
        # Extraction d'un nom de fichier propre
        filename = url.split("/")[-1].split("?")[0]
        if not filename.endswith((".jpg", ".jpeg", ".png", ".webp")):
            filename = "art-jatie-creation.jpg"

        headers = {
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
        
        return StreamingResponse(
            content=iter([response.content]), 
            media_type=response.headers.get("content-type", "image/jpeg"),
            headers=headers
        )
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Erreur lors du téléchargement : {str(e)}"})


# 4. Inclusions des routeurs enfants
app.include_router(products.router, prefix="/products",  tags=["Produits"])
app.include_router(settings.router, prefix="/settings",  tags=["Réglages"])
app.include_router(auth.router,     prefix="/auth",      tags=["Authentification"])
app.include_router(users.router,    prefix="/users",     tags=["Utilisateurs"])
app.include_router(orders.router,   prefix="/orders",    tags=["Commandes"])
app.include_router(clients.router,  prefix="/clients",   tags=["Clients CRM"])
app.include_router(mvola.router,    prefix="/mvola",     tags=["MVola"])
app.include_router(colors.router,   prefix="/colors",    tags=["Couleurs"])
app.include_router(agent.router,    prefix="/agent",     tags=["Agent IA"])