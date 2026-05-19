# agent/memory.py
# Mémoire adaptée à la vraie structure Art Jatie

from sqlmodel import Session, select
from database import engine
from models.models import Client, Order, Product, AgentSession
import json
from datetime import datetime


def get_client_by_whatsapp(whatsapp: str) -> dict:
    """
    Récupère le profil complet d'un client connu.
    Retourne ses goûts, historique d'achats, total dépensé.
    """
    with Session(engine) as session:
        client = session.exec(
            select(Client).where(Client.whatsapp == whatsapp)
        ).first()

        if not client:
            return {}

        # Récupère ses 5 dernières commandes
        orders = session.exec(
            select(Order)
            .where(Order.client_whatsapp == whatsapp)
            .order_by(Order.created_at.desc())
            .limit(5)
        ).all()

        last_orders = []
        for o in orders:
            # Essaie de lire le panier JSON (nouvelles commandes)
            produits = "Commande"
            if o.cart_items_json:
                try:
                    items = json.loads(o.cart_items_json)
                    produits = ", ".join(
                        [i.get("name", "Produit") for i in items[:3]]
                    )
                except Exception:
                    pass
            elif o.product_name:
                produits = o.product_name

            last_orders.append({
                "produits": produits,
                "montant": o.total_ar,
                "statut": o.status,
                "date": o.created_at.strftime("%d/%m/%Y"),
            })

        return {
            "nom": client.name,
            "whatsapp": client.whatsapp,
            "total_depense": client.total_spent,
            "nb_commandes": client.total_orders,
            "categories_favorites": client.favorite_categories or "Non défini",
            "couleurs_favorites": client.favorite_colors or "Non défini",
            "dernieres_commandes": last_orders,
        }


def get_products_context() -> str:
    """
    Récupère tous les produits disponibles en texte structuré.
    Utilisé comme fallback si ChromaDB n'est pas encore prêt.
    """
    with Session(engine) as session:
        products = session.exec(select(Product)).all()

        if not products:
            return "Aucun produit disponible actuellement."

        lines = []
        for p in products:
            stock = "Disponible" if p.stock_quantity > 0 else "Rupture de stock"
            lines.append(
                f"- {p.name} | {p.category} | {p.genre} | "
                f"{p.price_ar:,} Ar | Couleurs: {p.colors} | "
                f"Tailles: {p.sizes} | {stock}"
            )

        return "\n".join(lines)


def get_conversation(client_whatsapp: str, channel: str = "web") -> list:
    """
    Récupère l'historique de conversation depuis Supabase.
    Retourne une liste de messages ou [] si nouveau client.
    """
    with Session(engine) as session:
        session_db = session.exec(
            select(AgentSession)
            .where(AgentSession.client_whatsapp == client_whatsapp)
            .where(AgentSession.channel == channel)
            .order_by(AgentSession.updated_at.desc())
        ).first()

        if not session_db:
            return []

        try:
            return json.loads(session_db.messages_json)
        except Exception:
            return []


def save_conversation(
    client_whatsapp: str,
    messages: list,
    channel: str = "web"
):
    """
    Sauvegarde l'historique de conversation dans Supabase.
    Crée la session si elle n'existe pas, la met à jour sinon.
    """
    with Session(engine) as session:
        session_db = session.exec(
            select(AgentSession)
            .where(AgentSession.client_whatsapp == client_whatsapp)
            .where(AgentSession.channel == channel)
        ).first()

        messages_json = json.dumps(messages, ensure_ascii=False)
        now = datetime.utcnow()

        if session_db:
            session_db.messages_json = messages_json
            session_db.total_messages = len(messages)
            session_db.updated_at = now
            session.add(session_db)
        else:
            new_session = AgentSession(
                client_whatsapp=client_whatsapp,
                messages_json=messages_json,
                channel=channel,
                total_messages=len(messages),
                created_at=now,
                updated_at=now,
            )
            session.add(new_session)

        session.commit()