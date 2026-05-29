from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
import json
from models.models import Product, Settings, Color, ProductColorLink
from database import get_session
from utils.r2 import upload_image_to_r2  # ← on importe notre fonction R2

router = APIRouter()




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
    old_price_ar: Optional[int] = Form(None),
    description: Optional[str] = Form(None),
    colors: str = Form(""),
    color_ids: Optional[str] = Form(None),
    sizes: str = Form(""),
    badge: str = Form("Nouveau"),
    is_hot: bool = Form(False),
    on_order: bool = Form(False),
    stock_quantity: int = Form(1),
    images: List[UploadFile] = File(default=[]),     # ← uniquement celui-ci, pas d'autre image
    session: Session = Depends(get_session)
):
    """Crée un nouveau produit et upload ses images sur Cloudflare R2"""
    try:
        # 1. Upload toutes les images vers R2
        image_urls = []
        for img in images:
            if img.filename:
                url = await upload_image_to_r2(img)
                image_urls.append(url)

        # 2. Première image = colonne "image" (compatibilité ancienne)
        #    Toutes les images = colonne "images" (séparées par virgule)
        first_image = image_urls[0] if image_urls else ""
        all_images  = ",".join(image_urls)           # "url1,url2,url3"

        # 3. Couleurs
        actual_colors = []
        if color_ids:
            ids = json.loads(color_ids)
            actual_colors = session.exec(select(Color).where(Color.id.in_(ids))).all()

        # 4. Créer le produit
        new_product = Product(
            name=name,
            tag=tag,
            genre=genre,
            category=category,
            price_ar=price_ar,
            old_price_ar=old_price_ar,    # ← ajouter
            description=description,
            colors=colors,
            colors_list=actual_colors,
            sizes=sizes,
            badge=badge,
            is_hot=is_hot,
            on_order=on_order,
            stock_quantity=stock_quantity,
            image=first_image,
            images=all_images,
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
    old_price_ar: Optional[int] = Form(None),
    description: Optional[str] = Form(None),
    colors: str = Form(""),
    color_ids: Optional[str] = Form(None), # Ajoute ceci
    sizes: str = Form(""),
    badge: str = Form("Nouveau"),
    is_hot: bool = Form(False),
    on_order: bool = Form(False),
    stock_quantity: int = Form(1),
    images: List[UploadFile] = File([]), # Optionnel lors d'une modification
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
    product.old_price_ar = old_price_ar
    product.description = description
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

    # 3. Si de nouvelles images sont envoyées → on les upload vers R2
    #    Sinon → on garde les images existantes
    new_image_urls = []
    for img in images:
        if img.filename:
            url = await upload_image_to_r2(img)
            new_image_urls.append(url)

    if new_image_urls:
        product.image  = new_image_urls[0]              # première image
        product.images = ",".join(new_image_urls)       # toutes les images


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