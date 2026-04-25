from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

# --- CONFIGURATION (Taux de change) ---
class Settings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    exchange_rate_eur: float = Field(default=4500.0)
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
    image: str
    colors: str
    sizes: str
    badge: str = Field(default="Nouveau")
    is_hot: bool = Field(default=False)
    on_order: bool = Field(default=False)
    stock_quantity: int = Field(default=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- UTILISATEURS (Admin) ---
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    is_admin: bool = Field(default=True)


# --- COMMANDES ---
class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # Infos client
    client_name: str
    client_email: str
    client_whatsapp: str
    client_message: Optional[str] = None

    # ── NOUVEAU : panier complet (JSON sérialisé) ──────────────────────────
    # Format : '[{"id":1,"name":"Jupe Plage","price":25000,"quantity":1,"image":"...","category":"TENUES"}]'
    cart_items_json: Optional[str] = Field(default=None)

    # Infos livraison
    delivery_zone: Optional[str] = Field(default=None)   # ex: "nosybe_ville", "darsalam"
    delivery_cost: Optional[int] = Field(default=0)       # en Ariary
    delivery_label: Optional[str] = Field(default=None)   # ex: "Nosy Be — En ville"

    # Montants
    subtotal_ar: Optional[int] = Field(default=None)
    discount_ar: Optional[int] = Field(default=0)
    total_ar: Optional[int] = Field(default=None)

    # Rétrocompatibilité : commande sur un seul produit (ancienne version)
    product_id: Optional[int] = Field(default=None)
    product_name: Optional[str] = Field(default=None)
    product_image: Optional[str] = Field(default=None)
    product_price_ar: Optional[int] = Field(default=None)
    selected_size: Optional[str] = Field(default=None)
    selected_color: Optional[str] = Field(default=None)

    # ── NOUVEAU : champs MVola ─────────────────────────────────────────────
    payment_method: str = Field(default="whatsapp")        # "mvola" | "whatsapp"
    mvola_phone: Optional[str] = Field(default=None)        # Numéro MVola du client
    mvola_correlation_id: Optional[str] = Field(default=None)   # serverCorrelationId
    mvola_transaction_ref: Optional[str] = Field(default=None)  # Réf. finale MVola
    mvola_status: Optional[str] = Field(default=None)       # PENDING | COMPLETED | FAILED

    # Statut général
    status: str = Field(default="En attente")
    created_at: datetime = Field(default_factory=datetime.utcnow)