from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import create_db_and_tables
from routes import products, settings, auth, users  # ✅ users ajouté ici
from routes import orders


app.include_router(orders.router, prefix="/orders", tags=["Commandes"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

# ✅ app est créé ICI d'abord
app = FastAPI(title="Art Jatie API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://art-jatie-boutique.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "L'API Art Jatie est en ligne ! 🇲🇬"}

# ✅ include_router APRÈS la création de app
app.include_router(products.router, prefix="/products", tags=["Produits"])
app.include_router(settings.router, prefix="/settings", tags=["Réglages"])
app.include_router(auth.router, prefix="/auth", tags=["Authentification"])
app.include_router(users.router, prefix="/users", tags=["Utilisateurs"])