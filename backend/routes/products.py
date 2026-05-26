from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
import os
import uuid
from supabase import create_client, Client
import json
from models.models import Product, Settings, Color, ProductColorLink
from database import get_session

router = APIRouter()

# --- Configuration Supabase Storage ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# On initialise le client Supabase uniquement si les clés sont présentes
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


@router.get("/")
def get_products(
    on_order: Optional[bool] = None,
    genre: Optional[str] = None,
    category: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """Récupère les produits avec des filtres optionnels et calcule le prix en Euro dynamique"""
    
    # 1. On récupère le taux de change actuel (ou 4500 par défaut)
    settings = session.exec(select(Settings)).first()
    rate = settings.exchange_rate_eur if settings else 4500.0

    # 2. Construction de la requête avec "selectinload" pour charger les couleurs
    # On utilise selectinload pour éviter le problème du "N+1 queries" (plus performant)
    from sqlalchemy.orm import selectinload

    # 2. On récupère les produits
    statement = select(Product).options(selectinload(Product.colors_list))
    
    if on_order is not None:
        statement = statement.where(Product.on_order == on_order)
    if genre:
        statement = statement.where(Product.genre == genre)
    if category:
        statement = statement.where(Product.category == category)
        
    products = session.exec(statement).all()
    
    # 3. On formate la réponse pour injecter le prix en Euro calculé
    result = []
    for p in products:
        p_dict = p.model_dump() # Convertit l'objet SQL en dictionnaire classique
        p_dict["price_eur"] = round(p.price_ar / rate, 2)


        # Injection des détails des couleurs au lieu de juste le texte
        # Cela transformera colors_list en une liste d'objets JSON exploitables
        p_dict["full_colors"] = [
            {"id": c.id, "name": c.name, "hex_code": c.hex_code} 
            for c in p.colors_list
        ]


        result.append(p_dict)
        
    return result


@router.post("/")
async def create_product(
    name: str = Form(...),
    tag: str = Form(...),
    genre: str = Form(...),
    category: str = Form(...),
    price_ar: int = Form(...),
    colors: str = Form(""),
    color_ids: Optional[str] = Form(None), # Nouveau : "[1, 4, 12]"
    sizes: str = Form(""),
    badge: str = Form("Nouveau"),
    is_hot: bool = Form(False),
    on_order: bool = Form(False),
    stock_quantity: int = Form(1),
    image: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    """Crée un nouveau produit et upload son image sur Supabase Storage"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase Storage n'est pas configuré.")

    try:
        # 1. Préparer l'image avec un nom optimisé SEO
        # On extrait le nom et l'extension proprement
        base_name = os.path.splitext(image.filename)[0]
        extension = os.path.splitext(image.filename)[1]
        
        # On nettoie le nom (espaces -> tirets) et on ajoute un suffixe court pour l'unicité
        clean_base_name = base_name.replace(" ", "-")
        short_uuid = uuid.uuid4().hex[:8]
        unique_filename = f"{clean_base_name}-{short_uuid}{extension}"
        
        file_bytes = await image.read()
        
        # 2. Upload sur Supabase avec le nom optimisé
        res = supabase.storage.from_("products").upload(
            path=unique_filename,
            file=file_bytes,
            file_options={"content-type": image.content_type}
        )
        
        public_url = supabase.storage.from_("products").get_public_url(unique_filename)

        # 3. La suite de ton code reste inchangée...
        actual_colors = []
        if color_ids:
            ids = json.loads(color_ids)
            actual_colors = session.exec(select(Color).where(Color.id.in_(ids))).all()
        
        new_product = Product(
            name=name,
            tag=tag,
            genre=genre,
            category=category,
            price_ar=price_ar,
            colors=colors, # Vérifie si c'est bien la liste des couleurs ou juste la chaîne
            colors_list=actual_colors,
            sizes=sizes,
            badge=badge,
            is_hot=is_hot,
            on_order=on_order,
            stock_quantity=stock_quantity,
            image=public_url
        )
        
        if new_product.stock_quantity == 0:
            new_product.badge = "Sur commande"
            new_product.on_order = True
            
        session.add(new_product)
        session.commit()
        session.refresh(new_product)
        
        return new_product
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/seed")
def seed_initial_data(session: Session = Depends(get_session)):
    """Route temporaire pour injecter quelques produits de test dans Supabase"""
    existing = session.exec(select(Product)).first()
    if existing:
        return {"message": "Les données existent déjà !"}

    test_products = [
        Product(
            name="Set Brassière & Jupe", tag="Ensemble", genre="Femme", category="TENUES",
            price_ar=89000, image="/images/hero/crochet-tenue-plage.jpeg",
            colors="Rose,Blanc", sizes="S,M", badge="En stock", is_hot=True, on_order=False, stock_quantity=5
        ),
        Product(
            name="Robe Longue Sur Mesure", tag="Robe", genre="Femme", category="TENUES",
            price_ar=150000, image="/images/hero/crochet-vetement-efant.jpeg",
            colors="Beige,Blanc,Rose", sizes="S,M,L,XL", badge="Nouveau", is_hot=False, on_order=True, stock_quantity=0
        ),
        Product(
            name="Sac Cabas Tressé", tag="Accessoire", genre="Femme", category="ACCESSOIRES",
            price_ar=58000, image="/images/hero/crochet-sac-madame.jpeg",
            colors="Beige,Marron", sizes="Unique", badge="En stock", is_hot=False, on_order=False, stock_quantity=3
        )
    ]
    
    for p in test_products:
        session.add(p)
    session.commit()
    
    return {"message": f"{len(test_products)} produits ajoutés avec succès !"}


# ---------------------------------------------------------
# NOUVELLES ROUTES : MODIFICATION (PUT) ET SUPPRESSION (DELETE)
# ---------------------------------------------------------

@router.put("/{product_id}")
async def update_product(
    product_id: int,
    name: str = Form(...),
    tag: Optional[str] = Form(None),
    genre: str = Form(...),
    category: str = Form(...),
    price_ar: int = Form(...),
    colors: str = Form(""),
    color_ids: Optional[str] = Form(None), # Ajoute ceci
    sizes: str = Form(""),
    badge: str = Form("Nouveau"),
    is_hot: bool = Form(False),
    on_order: bool = Form(False),
    stock_quantity: int = Form(1),
    image: Optional[UploadFile] = File(None), # Optionnel lors d'une modification
    session: Session = Depends(get_session)
):
    """Modifie un produit existant (et son image si une nouvelle est fournie)"""
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    # 1. Mise à jour des textes
    product.name = name
    product.tag = tag if tag is not None else ""
    product.genre = genre
    product.category = category
    product.price_ar = price_ar
    product.colors = colors
    product.sizes = sizes
    product.badge = badge
    product.is_hot = is_hot
    product.on_order = on_order
    product.stock_quantity = stock_quantity


    # Mise à jour de la relation Many-to-Many
    if color_ids is not None:
        ids = json.loads(color_ids)
        actual_colors = session.exec(select(Color).where(Color.id.in_(ids))).all()
        product.colors_list = actual_colors # Magie de l'ORM : il gère la table de liaison seul

    # 2. Si l'utilisateur a envoyé une nouvelle image, on l'upload sur Supabase
    if image and image.filename:
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase Storage n'est pas configuré.")
        try:
            # 1. On récupère le nom sans l'extension
            base_name = os.path.splitext(image.filename)[0]
            # 2. On récupère l'extension (avec le point)
            extension = os.path.splitext(image.filename)[1]
            # 3. On génère un identifiant court (8 caractères suffisent pour l'unicité)
            short_uuid = uuid.uuid4().hex[:8]
            
            # 4. On reconstruit le nom : "nom-original-a1b2c3d4.jpg"
            # On remplace aussi les espaces par des tirets pour le SEO
            clean_base_name = base_name.replace(" ", "-")
            unique_filename = f"{clean_base_name}-{short_uuid}{extension}"
            
            file_bytes = await image.read()
            
            supabase.storage.from_("products").upload(
                path=unique_filename,
                file=file_bytes,
                file_options={"content-type": image.content_type}
            )
            
            public_url = supabase.storage.from_("products").get_public_url(unique_filename)
            product.image = public_url
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erreur d'upload : {str(e)}")


    if product.stock_quantity == 0:
        product.badge = "Sur commande"
        product.on_order = True

    # 3. Sauvegarde en DB
    session.add(product)
    session.commit()
    session.refresh(product)
    
    return product


@router.delete("/{product_id}")
def delete_product(product_id: int, session: Session = Depends(get_session)):
    """Supprime un produit de la base de données"""
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    
    session.delete(product)
    session.commit()
    return {"message": "Produit supprimé avec succès"}

@router.post("/fix-zero-stock")
def fix_zero_stock(session: Session = Depends(get_session)):
    products = session.exec(select(Product)).all()
    count = 0
    for p in products:
        if p.stock_quantity == 0:
            p.badge = "Sur commande"
            p.on_order = True
            session.add(p)
            count += 1
    session.commit()
    return {"message": f"{count} produits mis à jour"}