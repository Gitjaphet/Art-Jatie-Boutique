# ============================================================
# Ajoute ces deux routes à la fin de routes/products.py
# ============================================================

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlmodel import Session, select
from typing import Optional
import os
import uuid
import boto3
from botocore.config import Config

# ─── DELETE /products/{id} ───────────────────────────────────
@router.delete("/{product_id}")
def delete_product(product_id: int, session: Session = Depends(get_session)):
    """Supprime un produit par son ID"""
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable.")

    try:
        s3 = boto3.client(
            "s3",
            endpoint_url=f"https://{os.getenv('CLOUDFLARE_R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
            aws_access_key_id=os.getenv("CLOUDFLARE_R2_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
            config=Config(signature_version="s3v4"),
        )
        if product.image:
            filename = product.image.split("/")[-1]
            s3.delete_object(Bucket=os.getenv("CLOUDFLARE_R2_BUCKET_NAME"), Key=filename)
    except Exception:
        pass

    session.delete(product)
    session.commit()
    return {"message": "Produit supprimé avec succès."}


# ─── PUT /products/{id} ──────────────────────────────────────
@router.put("/{product_id}")
async def update_product(
    product_id: int,
    name: str = Form(...),
    tag: str = Form(...),
    genre: str = Form(...),
    category: str = Form(...),
    price_ar: int = Form(...),
    colors: str = Form(""),
    sizes: str = Form(""),
    badge: str = Form("En stock"),
    is_hot: bool = Form(False),
    on_order: bool = Form(False),
    stock_quantity: int = Form(1),
    image: Optional[UploadFile] = File(None),  # image optionnelle à l'édition
    session: Session = Depends(get_session),
):
    """Met à jour un produit existant. L'image est optionnelle."""
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable.")

    # Mise à jour des champs texte
    product.name = name
    product.tag = tag
    product.genre = genre
    product.category = category
    product.price_ar = price_ar
    product.colors = colors
    product.sizes = sizes
    product.badge = badge
    product.is_hot = is_hot
    product.on_order = on_order
    product.stock_quantity = stock_quantity

    # Si une nouvelle image est fournie → on l'upload et on remplace
    if image and image.filename:
        try:
            s3 = boto3.client(
                "s3",
                endpoint_url=f"https://{os.getenv('CLOUDFLARE_R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
                aws_access_key_id=os.getenv("CLOUDFLARE_R2_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
                config=Config(signature_version="s3v4"),
            )
            bucket = os.getenv("CLOUDFLARE_R2_BUCKET_NAME")
            if product.image:
                old_filename = product.image.split("/")[-1]
                s3.delete_object(Bucket=bucket, Key=old_filename)
            file_extension = image.filename.split(".")[-1]
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            file_bytes = await image.read()
            s3.put_object(
                Bucket=bucket,
                Key=unique_filename,
                Body=file_bytes,
                ContentType=image.content_type or "image/jpeg",
            )
            product.image = f"{os.getenv('CLOUDFLARE_R2_PUBLIC_URL')}/{unique_filename}"
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    session.add(product)
    session.commit()
    session.refresh(product)
    return product