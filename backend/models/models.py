from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

# --- CONFIGURATION (Taux de change) ---
class Settings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    exchange_rate_eur: float = Field(default=4500.0) # Ex: 1 € = 4500 Ar
    # NOUVEAU : On stocke les listes de choix par défaut
    available_colors: str = Field(default="Beige,Blanc,Noir,Rose,Rouge,Bleu,Marron,Kaki,Multicolore")
    available_sizes: str = Field(default="XS,S,M,L,XL,Sur mesure,Unique")
    available_categories: str = Field(default="TENUES,ACCESSOIRES,MAISON")
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# --- PRODUITS ---
class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    tag: str
    genre: str
    category: str
    
    price_ar: int 
    old_price_ar: Optional[int] = None
    # Plus de price_eur ici ! Il sera calculé grâce à la table Settings
    
    image: str
    colors: str
    sizes: str
    
    badge: str = Field(default="Nouveau")
    is_hot: bool = Field(default=False)
    on_order: bool = Field(default=False)
    
    # NOUVEAU : La quantité en stock pour la gestion dynamique
    stock_quantity: int = Field(default=1) 
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- UTILISATEURS (Admin) ---
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    is_admin: bool = Field(default=True)