# ai/data/orders.py
import json
from sqlmodel import Session, select
from database import engine
from models.models import Product, Order, Client


def passer_commande(
    product_id: int,
    client_name: str,
    client_whatsapp: str,
    client_email: str,
    taille: str,
    couleur: str,
    quantite: int = 1,
    message: str = "",
) -> dict:
    with Session(engine) as session:
        product = session.get(Product, product_id)
        if not product:
            return {"succes": False, "erreur": f"Produit ID {product_id} introuvable."}

        tailles_dispo = [t.strip() for t in product.sizes.split(",") if t.strip()]
        if taille and taille not in tailles_dispo:
            return {"succes": False, "erreur": f"Taille '{taille}' non dispo. (Dispo: {', '.join(tailles_dispo)})"}

        couleurs_dispo = [c.strip() for c in product.colors.split(",") if c.strip()]
        if couleur and couleur not in couleurs_dispo:
            return {"succes": False, "erreur": f"Couleur '{couleur}' non dispo. (Dispo: {', '.join(couleurs_dispo)})"}

        en_stock = product.stock_quantity >= quantite
        type_commande = "stock" if en_stock else "sur_mesure"

        client = session.exec(select(Client).where(Client.whatsapp == client_whatsapp)).first()
        if not client:
            client = Client(
                name=client_name,
                email=client_email,
                whatsapp=client_whatsapp,
                total_spent=0,
                total_orders=0,
            )
            session.add(client)
            session.flush()

        cart_item = {
            "id": product.id,
            "name": product.name,
            "price": product.price_ar,
            "quantity": quantite,
            "image": product.image,
            "category": product.category,
            "discount": 0,
        }
        total_ar = product.price_ar * quantite

        order = Order(
            client_id=client.id,
            client_name=client_name,
            client_email=client_email,
            client_whatsapp=client_whatsapp,
            client_message=message or None,
            cart_items_json=json.dumps([cart_item]),
            subtotal_ar=total_ar,
            discount_ar=0,
            total_ar=total_ar,
            delivery_zone="À confirmer",
            delivery_cost=0,
            delivery_label="À confirmer avec l'équipe",
            product_id=product.id,
            product_name=product.name,
            product_image=product.image,
            product_price_ar=product.price_ar,
            selected_size=taille,
            selected_color=couleur,
            payment_method="whatsapp",
            status="En attente",
        )

        if type_commande == "sur_mesure":
            note = "[COMMANDE SUR MESURE — produit non disponible en stock]"
            order.client_message = f"{note}\n{message}" if message else note

        session.add(order)

        if type_commande == "stock":
            product.stock_quantity = max(0, product.stock_quantity - quantite)
            session.add(product)

        session.commit()
        session.refresh(order)

        return {
            "succes": True,
            "commande_id": order.id,
            "type": type_commande,
            "produit": product.name,
            "taille": taille,
            "couleur": couleur,
            "quantite": quantite,
            "total_ar": total_ar,
            "stock_restant": product.stock_quantity if type_commande == "stock" else "N/A",
            "message": f"Commande #{order.id} créée avec succès. L'équipe vous contactera sur WhatsApp.",
        }