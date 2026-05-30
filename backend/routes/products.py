from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
import json
from models.models import Product, Settings, Color, ProductColorLink
from database import get_session
import re
from utils.r2 import upload_image_to_r2

router = APIRouter()


# ─── HELPER : Génération automatique de slug ──────────────────────────────────
def generate_slug(name: str) -> str:  # ← NOUVEAU : fonction de génération de slug
    slug = name.lower()
    slug = slug.replace("é","e").replace("è","e").replace("ê","e")
    slug = slug.replace("à","a").replace("â","a")
    slug = slug.replace("ù","u").replace("û","u")
    slug = slug.replace("ô","o").replace("î","i")
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug.strip())
    return slug


# ─── HELPER : Slug unique (évite les doublons) ────────────────────────────────
def get_unique_slug(name: str, session: Session, exclude_id: Optional[int] = None) -> str:  # ← NOUVEAU
    base_slug = generate_slug(name)
    slug = base_slug
    counter = 1
    while True:
        query = select(Product).where(Product.slug == slug)
        if exclude_id:
            query = query.where(Product.id != exclude_id)  # ← NOUVEAU : ignore le produit en cours lors d'un update
        existing = session.exec(query).first()
        if not existing:
            break
        slug = f"{base_slug}-{counter}"  # ← NOUVEAU : robe-rouge-2, robe-rouge-3...
        counter += 1
    return slug


# ─────────────────────────────────────────────────────────────────────────────
# IMPORTANT : /by-slug et /generate-slugs DOIVENT être AVANT /{product_id}
# sinon FastAPI essaie de convertir "by-slug" en int → erreur 422
# ─────────────────────────────────────────────────────────────────────────────






# ─────────────────────────────────────────────────────────────────────────────
# ROUTES EXISTANTES (inchangées sauf ajout du slug)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/")
def get_products(
    on_order: Optional[bool] = None,
    genre: Optional[str] = None,
    category: Optional[str] = None,
    session: Session = Depends(get_session)
):
    settings = session.exec(select(Settings)).first()
    rate = settings.exchange_rate_eur if settings else 4500.0

    from sqlalchemy.orm import selectinload
    statement = select(Product).options(selectinload(Product.colors_list))

    if on_order is not None:
        statement = statement.where(Product.on_order == on_order)
    if genre:
        statement = statement.where(Product.genre == genre)
    if category:
        statement = statement.where(Product.category == category)

    products = session.exec(statement).all()

    result = []
    for p in products:
        p_dict = p.model_dump()
        p_dict["price_eur"] = round(p.price_ar / rate, 2)
        p_dict["full_colors"] = [
            {"id": c.id, "name": c.name, "hex_code": c.hex_code}
            for c in p.colors_list
        ]
        result.append(p_dict)

    return result


# ← NOUVEAU : route pour générer les slugs des produits existants (à appeler une seule fois)
@router.post("/generate-slugs")
def generate_all_slugs(session: Session = Depends(get_session)):
    """Génère les slugs manquants pour tous les produits existants en base"""
    products = session.exec(select(Product)).all()
    count = 0
    for p in products:
        if not p.slug:  # ← NOUVEAU : ne touche pas les slugs déjà existants
            p.slug = get_unique_slug(p.name, session, exclude_id=p.id)
            session.add(p)
            count += 1
    session.commit()
    return {"message": f"{count} slugs générés avec succès"}


@router.post("/seed")
def seed_initial_data(session: Session = Depends(get_session)):
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
        p.slug = get_unique_slug(p.name, session)  # ← NOUVEAU : slug généré aussi pour le seed
        session.add(p)
    session.commit()

    return {"message": f"{len(test_products)} produits ajoutés avec succès !"}


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


# ← NOUVEAU : route par slug pour la page détail produit
@router.get("/{slug}")
def get_product_by_slug(slug: str, session: Session = Depends(get_session)):
    from sqlalchemy.orm import selectinload
    product = session.exec(
        select(Product)
        .options(selectinload(Product.colors_list))
        .where(Product.slug == slug)
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    return product

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
    images: List[UploadFile] = File(default=[]),
    session: Session = Depends(get_session)
):
    try:
        image_urls = []
        for img in images:
            if img.filename:
                url = await upload_image_to_r2(img)
                image_urls.append(url)

        first_image = image_urls[0] if image_urls else ""
        all_images = ",".join(image_urls)

        actual_colors = []
        if color_ids:
            ids = json.loads(color_ids)
            actual_colors = session.exec(select(Color).where(Color.id.in_(ids))).all()

        slug = get_unique_slug(name, session)  # ← NOUVEAU : génère le slug automatiquement

        new_product = Product(
            name=name,
            slug=slug,          # ← NOUVEAU : slug ajouté à la création
            tag=tag,
            genre=genre,
            category=category,
            price_ar=price_ar,
            old_price_ar=old_price_ar,
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
    color_ids: Optional[str] = Form(None),
    sizes: str = Form(""),
    badge: str = Form("Nouveau"),
    is_hot: bool = Form(False),
    on_order: bool = Form(False),
    stock_quantity: int = Form(1),
    images: List[UploadFile] = File([]),
    session: Session = Depends(get_session)
):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")

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

    # ← NOUVEAU : régénère le slug si le nom du produit a changé
    if not product.slug or product.name != name:
        product.slug = get_unique_slug(name, session, exclude_id=product_id)

    if color_ids is not None:
        ids = json.loads(color_ids)
        actual_colors = session.exec(select(Color).where(Color.id.in_(ids))).all()
        product.colors_list = actual_colors

    new_image_urls = []
    for img in images:
        if img.filename:
            url = await upload_image_to_r2(img)
            new_image_urls.append(url)

    if new_image_urls:
        product.image = new_image_urls[0]
        product.images = ",".join(new_image_urls)

    if product.stock_quantity == 0:
        product.badge = "Sur commande"
        product.on_order = True

    session.add(product)
    session.commit()
    session.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(product_id: int, session: Session = Depends(get_session)):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    session.delete(product)
    session.commit()
    return {"message": "Produit supprimé avec succès"}


