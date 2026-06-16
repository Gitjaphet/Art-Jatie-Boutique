from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime

# --- CONFIGURATION (Taux de changes) ---
class Settings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    exchange_rate_eur: float = Field(default=4500.0)
    available_colors: str = Field(default="Beige,Blanc,Noir,Rose,Rouge,Bleu,Marron,Kaki,Multicolore")
    available_sizes: str = Field(default="XS,S,M,L,XL,Sur mesure,Unique")
    available_categories: str = Field(default="TENUES,ACCESSOIRES,MAISON")
    available_genres: str = Field(default="Femme,Homme,Enfant,Unisexe")
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# --- TABLE DE LIAISON ---
class ProductColorLink(SQLModel, table=True):
    product_id: Optional[int] = Field(default=None, foreign_key="product.id", primary_key=True)
    color_id: Optional[int] = Field(default=None, foreign_key="color.id", primary_key=True)

# --- TABLE COULEUR ---
class Color(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True) 
    hex_code: str = Field(default="#CCCCCC") # Ce code sera rempli automatiquement par le front
    
    products: List["Product"] = Relationship(back_populates="colors_list", link_model=ProductColorLink)


# --- PRODUITS ---
class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    tag: str
    slug: Optional[str] = Field(default=None, unique=True, index=True)
    genre: str
    category: str
    price_ar: int
    old_price_ar: Optional[int] = None
    image: str
    images: str = Field(default="")  
    description: Optional[str] = Field(default=None)  # ← NOUVEAU
    colors: str
    #  (on l'appelle colors_list pour ne pas avoir de conflit de nom)
    colors_list: List[Color] = Relationship(back_populates="products", link_model=ProductColorLink)
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


# --- CLIENTS (CRM) ---
class Client(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: Optional[str] = None
    whatsapp: str = Field(unique=True, index=True) # WhatsApp sera l'identifiant unique !
    total_spent: int = Field(default=0) # Pour savoir combien il a dépensé au total
    total_orders: int = Field(default=0) # Combien de commandes il a fait
    favorite_categories: Optional[str] = Field(default="")
    favorite_colors: Optional[str] = Field(default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relation avec les commandes
    orders: List["Order"] = Relationship(back_populates="client")


# --- COMMANDES PANIER (depuis le checkout) ---
class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # Infos client
    client_name: str
    client_email: str
    client_whatsapp: str
    client_message: Optional[str] = None

    # Panier complet (JSON sérialisé)
    cart_items_json: Optional[str] = Field(default=None)

    # Infos livraison
    delivery_zone: Optional[str] = Field(default=None)
    delivery_cost: Optional[int] = Field(default=0)
    delivery_label: Optional[str] = Field(default=None)

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

    # ── PAIEMENT ───────────────────────────────────────────────────────────
    payment_method: str = Field(default="whatsapp")

    mvola_account_name: Optional[str] = Field(default=None)
    mvola_phone: Optional[str] = Field(default=None)

    om_account_name: Optional[str] = Field(default=None)
    om_phone: Optional[str] = Field(default=None)

    payment_proof_text: Optional[str] = Field(default=None)
    payment_proof_image: Optional[str] = Field(default=None)

    mvola_correlation_id: Optional[str] = Field(default=None)
    mvola_transaction_ref: Optional[str] = Field(default=None)
    mvola_status: Optional[str] = Field(default=None)

    # ── STATUT GÉNÉRAL ─────────────────────────────────────────────────────
    status: str = Field(default="En attente")

    # ── PLANNING (NOUVEAU) ─────────────────────────────────────────────────
    # Valeurs possibles : null | "a_fabriquer" | "en_cours" | "pret_a_livrer" | "livree"
    planning_status: Optional[str] = Field(default=None)
    # Note interne de production
    planning_note: Optional[str] = Field(default=None)

    acompte: Optional[int] = Field(default=0)    # ← NOUVEAU
    progress: Optional[int] = Field(default=0)   # ← NOUVEAU

    created_at: datetime = Field(default_factory=datetime.utcnow)


    is_pos: bool = Field(default=False) # True = Vente en boutique, False = Web
    amount_tendered: int = Field(default=0) # Montant donné par le client
    change_ar: int = Field(default=0) # Monnaie rendue


    # ── RELATION CRM ───────────────────────────────────────────────────────
    client_id: Optional[int] = Field(default=None, foreign_key="client.id")
    client: Optional[Client] = Relationship(back_populates="orders")


    # --- AGENT IA — Sessions de conversation ---
class AgentSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Lien avec le client (whatsapp = identifiant universel)
    client_whatsapp: str = Field(index=True)
    
    # Historique complet de la conversation (JSON)
    messages_json: str = Field(default="[]")
    
    # Métadonnées utiles
    channel: str = Field(default="web")  # "web" | "facebook" | "whatsapp"
    total_messages: int = Field(default=0)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)