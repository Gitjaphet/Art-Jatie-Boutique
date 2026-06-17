from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from typing import List, Optional
import json
from models.models import Product, Settings, Color, ProductColorLink, Review, ReviewCreate
from database import get_session
from sqlalchemy import func
from core.auth import get_current_admin
import re
from utils.r2 import upload_image_to_r2
from ai.utils.vectorisation import vectoriser_produit

router = APIRouter()


# ─── HELPER : Génération automatique de slug ──────────────────────────────────
def generate_slug(name: str) -> str:
    slug = name.lower()
    slug = slug.replace("é","e").replace("è","e").replace("ê","e")
    slug = slug.replace("à","a").replace("â","a")
    slug = slug.replace("ù","u").replace("û","u")
    slug = slug.replace("ô","o").replace("î","i")
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug.strip())
    return slug


# ─── HELPER : Slug unique (évite les doublons) ────────────────────────────────
def get_unique_slug(name: str, session: Session, exclude_id: Optional[int] = None) -> str:
    base_slug = generate_slug(name)
    slug = base_slug
    counter = 1
    while True:
        query = select(Product).where(Product.slug == slug)
        if exclude_id:
            query = query.where(Product.id != exclude_id)
        existing = session.exec(query).first()
        if not existing:
            break
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES LECTURE
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


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES UTILITAIRES
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/generate-slugs")
def generate_all_slugs(session: Session = Depends(get_session)):
    """Génère les slugs manquants pour tous les produits existants en base."""
    products = session.exec(select(Product)).all()
    count = 0
    for p in products:
        if not p.slug:
            p.slug = get_unique_slug(p.name, session, exclude_id=p.id)
            session.add(p)
            count += 1
    session.commit()
    return {"message": f"{count} slugs générés avec succès"}


@router.post("/generate-embeddings")
def generate_all_embeddings(
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):
    """
    Vectorise TOUS les produits existants (à appeler une seule fois en migration,
    ou pour resynchroniser la table product_embedding).
    Traitement en background pour ne pas bloquer la réponse HTTP.
    """
    products = session.exec(select(Product)).all()

    def _run():
        for p in products:
            try:
                vectoriser_produit(p)
            except Exception as e:
                print(f"[generate-embeddings] Erreur produit #{p.id}: {e}")

    background_tasks.add_task(_run)
    return {"message": f"Vectorisation de {len(products)} produits lancée en arrière-plan."}


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
        p.slug = get_unique_slug(p.name, session)
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


# ─────────────────────────────────────────────────────────────────────────────
# CREATE
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/")
async def create_product(
    background_tasks: BackgroundTasks,       # ← NOUVEAU : vectorisation async
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

        slug = get_unique_slug(name, session)

        new_product = Product(
            name=name,
            slug=slug,
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

        # ── Vectorisation en arrière-plan (ne bloque pas la réponse) ──────
        # On capture les valeurs nécessaires avant la fin de la session
        product_snapshot = new_product
        background_tasks.add_task(_vectoriser_safe, product_snapshot)

        return new_product

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# UPDATE
# ─────────────────────────────────────────────────────────────────────────────

@router.put("/{product_id}")
async def update_product(
    product_id: int,
    background_tasks: BackgroundTasks,       # ← NOUVEAU
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

    # ── Re-vectorisation en arrière-plan ──────────────────────────────────
    background_tasks.add_task(_vectoriser_safe, product)

    return product


# ─────────────────────────────────────────────────────────────────────────────
# DELETE
# ─────────────────────────────────────────────────────────────────────────────

# DELETE — version finale propre
@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    session: Session = Depends(get_session)   # ← BackgroundTasks retiré
):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    session.delete(product)
    session.commit()
    return {"message": "Produit supprimé avec succès"}


# ─────────────────────────────────────────────────────────────────────────────
# HELPER INTERNE : vectorisation sécurisée (absorbe les erreurs Jina)
# ─────────────────────────────────────────────────────────────────────────────

def _vectoriser_safe(product: Product) -> None:
    """
    Wrapper autour de vectoriser_produit qui absorbe toutes les exceptions
    pour ne jamais faire planter le background task et donc ne jamais
    affecter la réponse HTTP déjà envoyée au dashboard.
    """
    try:
        vectoriser_produit(product)
    except Exception as e:
        # Log uniquement — l'erreur n'est pas remontée au client
        print(f"[vectorisation] ⚠ Échec embedding produit #{product.id} ({product.name}): {e}")

# ─────────────────────────────────────────────────────────────────────────────
# ROUTES AVIS CLIENTS (Reviews)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/{product_id}/reviews", status_code=201)
def create_review(product_id: int, payload: ReviewCreate, session: Session = Depends(get_session)):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    if not (1 <= payload.rating <= 5):
        raise HTTPException(status_code=422, detail="La note doit être comprise entre 1 et 5")

    review = Review(
        product_id=product_id,
        author_name=payload.author_name.strip()[:100],
        author_email=payload.author_email,
        rating=payload.rating,
        title=payload.title,
        comment=payload.comment.strip(),
        is_approved=False,
    )
    session.add(review)
    session.commit()
    session.refresh(review)
    return {"message": "Avis soumis, en attente de modération", "id": review.id}


@router.get("/{product_id}/reviews")
def list_reviews(product_id: int, session: Session = Depends(get_session)):
    statement = (
        select(Review)
        .where(Review.product_id == product_id, Review.is_approved == True)
        .order_by(Review.created_at.desc())
    )
    reviews = session.exec(statement).all()
    # On ne renvoie jamais author_email publiquement
    return [
        {
            "id": r.id,
            "author_name": r.author_name,
            "rating": r.rating,
            "title": r.title,
            "comment": r.comment,
            "created_at": r.created_at,
        }
        for r in reviews
    ]


@router.get("/{product_id}/reviews/aggregate")
def get_review_aggregate(product_id: int, session: Session = Depends(get_session)):
    statement = select(func.avg(Review.rating), func.count(Review.id)).where(
        Review.product_id == product_id, Review.is_approved == True
    )
    avg_rating, count = session.exec(statement).one()
    return {
        "average_rating": round(float(avg_rating), 1) if avg_rating else 0.0,
        "review_count": count or 0,
    }


# ── ADMIN — protégé par JWT (is_admin requis) ──

@router.get("/admin/reviews/pending")
def list_pending_reviews(
    session: Session = Depends(get_session),
    current_admin: dict = Depends(get_current_admin),
):
    statement = select(Review).where(Review.is_approved == False).order_by(Review.created_at.desc())
    return session.exec(statement).all()


@router.patch("/admin/reviews/{review_id}/approve")
def approve_review(
    review_id: int,
    session: Session = Depends(get_session),
    current_admin: dict = Depends(get_current_admin),
):
    review = session.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Avis introuvable")
    review.is_approved = True
    session.add(review)
    session.commit()
    return {"message": "Avis approuvé"}


@router.delete("/admin/reviews/{review_id}")
def delete_review(
    review_id: int,
    session: Session = Depends(get_session),
    current_admin: dict = Depends(get_current_admin),
):
    review = session.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Avis introuvable")
    session.delete(review)
    session.commit()
    return {"message": "Avis supprimé"}