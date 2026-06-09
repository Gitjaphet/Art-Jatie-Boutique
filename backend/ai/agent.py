import sys
sys.path.append("/app")

import os
import json
from dotenv import load_dotenv
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
import requests
import psycopg2
from sqlmodel import Session, select, or_, col
from database import engine
from models.models import Product, Order, Client

load_dotenv()


# ============================================================
#  COUCHE DONNÉES — toutes les requêtes SQL ici
# ============================================================

def _get_products(
    produit: str = "",
    couleur: str = "",
    categorie: str = "",
    genre: str = "",
    prix_min: int = 0,
    prix_max: int = 0,
    sort: str = "",
    limit: int = 0,
) -> list[dict]:
    with Session(engine) as session:
        query = select(Product)

        if produit:
            query = query.where(
                or_(
                    Product.name.ilike(f"%{produit}%"),
                    Product.description.ilike(f"%{produit}%"),
                )
            )
        if couleur:
            query = query.where(Product.colors.ilike(f"%{couleur}%"))
        if categorie:
            query = query.where(Product.category.ilike(f"%{categorie}%"))
        if genre:
            query = query.where(Product.genre.ilike(f"%{genre}%"))
        if prix_min > 0:
            query = query.where(Product.price_ar >= prix_min)
        if prix_max > 0:
            query = query.where(Product.price_ar <= prix_max)

        if sort == "price_asc":
            query = query.order_by(Product.price_ar.asc())
        elif sort == "price_desc":
            query = query.order_by(Product.price_ar.desc())
        elif sort == "name_asc":
            query = query.order_by(Product.name.asc())

        if limit > 0:
            query = query.limit(limit)

        produits = session.exec(query).all()

        return [
            {
                "id": p.id,
                "nom": p.name,
                "categorie": p.category,
                "genre": p.genre,
                "prix_ar": p.price_ar,
                "ancien_prix_ar": p.old_price_ar,
                "couleurs": p.colors,
                "tailles": p.sizes,
                "stock": p.stock_quantity,
                "badge": p.badge,
                "sur_commande": p.on_order,
                "description": p.description or "",
            }
            for p in produits
        ]


def _stats(operation: str, filtre_categorie: str = "", filtre_genre: str = "") -> dict:
    with Session(engine) as session:
        query = select(Product)

        if filtre_categorie:
            query = query.where(Product.category.ilike(f"%{filtre_categorie}%"))
        if filtre_genre:
            query = query.where(Product.genre.ilike(f"%{filtre_genre}%"))

        produits = session.exec(query).all()

        if not produits:
            return {"resultat": 0, "detail": "Aucun produit trouvé"}

        if operation == "count":
            return {"resultat": len(produits), "label": "Nombre de produits"}

        if operation == "stock_total":
            return {"resultat": sum(p.stock_quantity for p in produits), "label": "Stock total"}

        if operation == "valeur_stock":
            return {"resultat": sum(p.price_ar * p.stock_quantity for p in produits), "label": "Valeur totale du stock en Ar"}

        if operation == "prix_moyen":
            return {"resultat": round(sum(p.price_ar for p in produits) / len(produits)), "label": "Prix moyen en Ar"}

        if operation == "min_price":
            p_min = min(produits, key=lambda p: p.price_ar)
            return {"resultat": p_min.price_ar, "nom": p_min.name, "label": "Produit le moins cher"}

        if operation == "max_price":
            p_max = max(produits, key=lambda p: p.price_ar)
            return {"resultat": p_max.price_ar, "nom": p_max.name, "label": "Produit le plus cher"}

        if operation == "stock_faible":
            seuil = 3
            faibles = [{"nom": p.name, "stock": p.stock_quantity} for p in produits if 0 < p.stock_quantity <= seuil]
            return {"resultat": len(faibles), "produits": faibles, "label": f"Produits avec stock ≤ {seuil}"}

        if operation == "rupture":
            rupture = [{"nom": p.name} for p in produits if p.stock_quantity == 0 and not p.on_order]
            return {"resultat": len(rupture), "produits": rupture, "label": "Produits en rupture de stock"}

        if operation == "par_categorie":
            cats: dict[str, int] = {}
            for p in produits:
                cats[p.category or "Autre"] = cats.get(p.category or "Autre", 0) + 1
            return {"resultat": cats, "label": "Répartition par catégorie"}

        if operation == "par_genre":
            genres: dict[str, int] = {}
            for p in produits:
                genres[p.genre or "Non défini"] = genres.get(p.genre or "Non défini", 0) + 1
            return {"resultat": genres, "label": "Répartition par genre"}

        return {"erreur": f"Opération inconnue : {operation}"}


def _passer_commande(
    product_id: int,
    client_name: str,
    client_whatsapp: str,
    client_email: str,
    taille: str,
    couleur: str,
    quantite: int = 1,
    message: str = "",
) -> dict:
    """
    Logique métier de la commande :
    - Si stock suffisant  → commande normale, payment_method="whatsapp"
    - Si stock insuffisant → commande sur mesure, on_order=True
    Dans les deux cas : on crée/met à jour le Client CRM, puis on insère l'Order.
    """
    with Session(engine) as session:

        # ── 1. Vérifier que le produit existe ────────────────────────────────
        product = session.get(Product, product_id)
        if not product:
            return {
                "succes": False,
                "erreur": f"Produit ID {product_id} introuvable.",
            }

        # ── 2. Vérifier la taille ────────────────────────────────────────────
        tailles_dispo = [t.strip() for t in product.sizes.split(",") if t.strip()]
        if taille and taille not in tailles_dispo:
            return {
                "succes": False,
                "erreur": f"Taille '{taille}' non disponible. Tailles disponibles : {', '.join(tailles_dispo)}",
            }

        # ── 3. Vérifier la couleur ───────────────────────────────────────────
        couleurs_dispo = [c.strip() for c in product.colors.split(",") if c.strip()]
        if couleur and couleur not in couleurs_dispo:
            return {
                "succes": False,
                "erreur": f"Couleur '{couleur}' non disponible. Couleurs disponibles : {', '.join(couleurs_dispo)}",
            }

        # ── 4. Décider du type de commande ───────────────────────────────────
        en_stock = product.stock_quantity >= quantite
        type_commande = "stock" if en_stock else "sur_mesure"

        # ── 5. CRM — créer ou mettre à jour le client ────────────────────────
        client = session.exec(
            select(Client).where(Client.whatsapp == client_whatsapp)
        ).first()

        if not client:
            client = Client(
                name=client_name,
                email=client_email,
                whatsapp=client_whatsapp,
                total_spent=0,
                total_orders=0,
            )
            session.add(client)
            session.flush()  # génère l'ID immédiatement

        # ── 6. Construire le panier (format cart_items_json) ─────────────────
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

        # ── 7. Créer la commande ──────────────────────────────────────────────
        order = Order(
            client_id=client.id,
            client_name=client_name,
            client_email=client_email,
            client_whatsapp=client_whatsapp,
            client_message=message or None,

            # Panier
            cart_items_json=json.dumps([cart_item]),
            subtotal_ar=total_ar,
            discount_ar=0,
            total_ar=total_ar,

            # Livraison — le client confirmera par WhatsApp
            delivery_zone="À confirmer",
            delivery_cost=0,
            delivery_label="À confirmer avec l'équipe",

            # Produit (rétrocompatibilité)
            product_id=product.id,
            product_name=product.name,
            product_image=product.image,
            product_price_ar=product.price_ar,
            selected_size=taille,
            selected_color=couleur,

            # Paiement → toujours WhatsApp pour l'agent IA
            payment_method="whatsapp",

            # Statut selon disponibilité
            status="En attente",

            # Sur mesure si pas en stock
            # (on utilise le champ on_order du produit comme référence,
            #  mais on trace le type dans client_message)
        )

        # Si sur mesure → on le note dans le message interne
        if type_commande == "sur_mesure":
            note_sur_mesure = "[COMMANDE SUR MESURE — produit non disponible en stock]"
            order.client_message = f"{note_sur_mesure}\n{message}" if message else note_sur_mesure

        session.add(order)

        # ── 8. Déduire le stock si commande normale ───────────────────────────
        if type_commande == "stock":
            product.stock_quantity = max(0, product.stock_quantity - quantite)
            session.add(product)

        session.commit()
        session.refresh(order)

        # ── 9. Réponse claire pour le LLM ────────────────────────────────────
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
            "message": (
                f"Commande #{order.id} créée avec succès. "
                f"{'Article prélevé du stock.' if type_commande == 'stock' else 'Article sur mesure — délai de fabrication à confirmer.'} "
                f"Notre équipe vous contactera sur WhatsApp ({client_whatsapp}) pour confirmer la livraison et le paiement."
            ),
        }


def _recherche_semantique(texte: str, top_k: int = 5) -> list[dict]:
    """Recherche sémantique via Jina + pgvector."""
    response = requests.post(
        "https://api.jina.ai/v1/embeddings",
        headers={"Authorization": f"Bearer {os.getenv('JINA_API_KEY')}",
                 "Content-Type": "application/json"},
        json={"model": "jina-embeddings-v3", "input": [texte],
              "task": "retrieval.query", "dimensions": 1024}
    )
    vecteur = response.json()["data"][0]["embedding"]
    vecteur_str = "[" + ",".join(map(str, vecteur)) + "]"  # ← ici, AVANT cur.execute

    

    conn = psycopg2.connect(
        host="aws-0-eu-west-1.pooler.supabase.com", port=6543,
        dbname="postgres", user="postgres.gmoezlcqbrfcutyxpxjw",
        password=os.getenv("DB_PASSWORD"), sslmode="require"
    )
    cur = conn.cursor()
    cur.execute("""
        SELECT pe.product_id, pe.contenu,
               1 - (pe.embedding <=> %s::vector) AS score
        FROM product_embedding pe
        ORDER BY pe.embedding <=> %s::vector LIMIT %s
    """, (vecteur_str, vecteur_str, top_k))  # ← tuple normal ici
    rows = cur.fetchall()
    
    cur.close(); conn.close()

    if not rows:
        return []

    product_ids = [r[0] for r in rows]
    scores = {r[0]: round(r[2], 3) for r in rows}

    with Session(engine) as session:
        produits = session.exec(
            select(Product).where(col(Product.id).in_(product_ids))
        ).all()

    return [
        {
            "id": p.id,
            "nom": p.name,
            "categorie": p.category,
            "genre": p.genre,
            "prix_ar": p.price_ar,
            "ancien_prix_ar": p.old_price_ar,
            "couleurs": p.colors,
            "tailles": p.sizes,
            "stock": p.stock_quantity,
            "badge": p.badge,
            "sur_commande": p.on_order,
            "description": p.description or "",
            "score_semantique": scores.get(p.id, 0),
        }
        for p in produits
    ]


# ============================================================
#  TOOLS LANGCHAIN
# ============================================================

@tool
def rechercher_produit_tool(
    requete_libre: str = "",
    produit: str = "",
    couleur: str = "",
    categorie: str = "",
    genre: str = "",
    prix_min: int = 0,
    prix_max: int = 0,
    sort: str = "",
    limit: int = 0,
) -> list:
    """
    Recherche et filtre les produits de la boutique Art-Jatie.

    Paramètres :
    - produit    : mot-clé sur le nom ou la description (ex: "robe", "sac", "mariage", "ceremonie")
    - couleur    : couleur souhaitée (ex: "Rouge", "Noir", "Beige")
    - categorie  : catégorie (ex: "TENUES", "ACCESSOIRES", "MAISON")
    - genre      : genre cible (ex: "Femme", "Homme", "Enfant", "Unisexe")
    - prix_min   : prix minimum en Ariary (0 = pas de limite)
    - prix_max   : prix maximum en Ariary (0 = pas de limite)
    - sort       : tri → "price_asc" (moins cher), "price_desc" (plus cher), "name_asc"
    - limit      : nombre max de résultats (0 = tous)
    - requete_libre : phrase naturelle pour recherche sémantique (ex: "tenue élégante pour mariage")

    Exemples :
    - "robe rouge"            → produit="robe", couleur="Rouge"
    - "article le moins cher" → sort="price_asc", limit=1
    - "moins de 100000 Ar"    → prix_max=100000
    - "robe de cérémonie"     → produit="robe mariée"
    - "sacs femme"            → produit="sac", genre="Femme"
    """
    if requete_libre:
        return _recherche_semantique(requete_libre)

    resultats = _get_products(
        produit=produit, couleur=couleur, categorie=categorie,
        genre=genre, prix_min=prix_min, prix_max=prix_max,
        sort=sort, limit=limit,
    )

    if not resultats and produit:
        return _recherche_semantique(produit)

    return resultats


@tool
def statistiques_produits_tool(
    operation: str,
    filtre_categorie: str = "",
    filtre_genre: str = "",
) -> dict:
    """

    OBLIGATOIRE : tu dois toujours fournir le paramètre 'operation'.
    Exemple : operation="count"
    
    Calcule des statistiques sur le catalogue.
   

    Opérations :
    - "count"         → nombre total de produits
    - "stock_total"   → nombre total d'articles en stock
    - "valeur_stock"  → valeur totale du stock (prix × quantité)
    - "prix_moyen"    → prix moyen des produits
    - "min_price"     → produit le moins cher
    - "max_price"     → produit le plus cher
    - "stock_faible"  → produits presque en rupture (stock ≤ 3)
    - "rupture"       → produits totalement en rupture de stock
    - "par_categorie" → répartition du catalogue par catégorie
    - "par_genre"     → répartition du catalogue par genre

    Filtres optionnels :
    - filtre_categorie : restreindre à une catégorie (ex: "ACCESSOIRES")
    - filtre_genre     : restreindre à un genre (ex: "Femme")
    """
    return _stats(operation=operation, filtre_categorie=filtre_categorie, filtre_genre=filtre_genre)


@tool
def passer_commande_tool(
    product_id: int,
    client_name: str,
    client_whatsapp: str,
    client_email: str,
    taille: str,
    couleur: str,
    quantite: int = 1,
    message: str = "",
) -> dict:
    """
    Passe une commande réelle dans la base de données.

    IMPORTANT — appelle ce tool SEULEMENT quand tu as collecté TOUS ces éléments :
    - product_id     : l'ID du produit (obtenu via rechercher_produit_tool)
    - client_name    : prénom et nom du client
    - client_whatsapp: numéro WhatsApp du client (format: 034XXXXXXX ou +261XXXXXXXXX)
    - client_email   : email du client (peut être vide "")
    - taille         : taille choisie (doit correspondre aux tailles disponibles du produit)
    - couleur        : couleur choisie (doit correspondre aux couleurs disponibles du produit)
    - quantite       : nombre d'articles (défaut = 1)
    - message        : message ou note spéciale du client (optionnel)

    Comportement automatique :
    - Si stock suffisant  → commande normale (article prélevé du stock immédiatement)
    - Si stock insuffisant → commande sur mesure (délai de fabrication à confirmer)

    Dans les deux cas : commande enregistrée en DB, client créé/mis à jour en CRM.
    Le paiement et la livraison sont confirmés par l'équipe via WhatsApp.

    Exemples de déclenchement :
    - "je veux commander cette robe"
    - "passez la commande"
    - "je prends l'article"
    - "je confirme ma commande"
    """
    return _passer_commande(
        product_id=product_id,
        client_name=client_name,
        client_whatsapp=client_whatsapp,
        client_email=client_email,
        taille=taille,
        couleur=couleur,
        quantite=quantite,
        message=message,
    )


# ============================================================
#  REGISTRE DES TOOLS
# ============================================================

TOOLS = [
    rechercher_produit_tool,
    statistiques_produits_tool,
    passer_commande_tool,
]

TOOLS_MAP = {t.name: t for t in TOOLS}


# ============================================================
#  LLM
# ============================================================

llm = ChatOllama(
    model="qwen2.5:3b",
    base_url=os.getenv("OLLAMA_BASE_URL", "http://ollama:11434"),
    temperature=0.1,
    num_ctx=512,
)

llm_with_tools = llm.bind_tools(TOOLS)


# ============================================================
#  SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
Tu es Jatie, assistante commerciale de la boutique Art-Jatie (crochet artisanal malgache).
Réponds en français, ton chaleureux et professionnel.

RÈGLES ABSOLUES :
- Ne propose JAMAIS de réduction non visible dans les données
- Ne mens jamais sur les stocks ou les prix
- Ne confirme jamais une commande sans avoir appelé passer_commande_tool

LIVRAISON (Atelier : Seganinga, Nosy Be) :
- Jabala : Gratuite — demi-journée
- Darsalam : 5 000 Ar — demi-journée  
- Dzamanjar : 7 000 Ar — demi-journée
- Autres zones / international : Sur devis → WhatsApp 034 30 513 60

RETOURS : sous 2 jours, article non porté → WhatsApp 034 30 513 60

PAIEMENT : MVola 034 30 513 60 | Orange Money | WhatsApp (livraison)
Sur mesure : acompte 50% requis

TAILLES (cm) :
XS: P80-84/T62-66 | S: P84-88/T66-70 | M: P88-92/T70-74 | L: P92-96/T74-78 | XL: P96-100/T78-82

OUTILS — RÈGLES STRICTES :
1. Salutation simple → réponds SANS outil
2. Recherche produit → rechercher_produit_tool EN UN SEUL APPEL
   - Toujours utiliser requete_libre= pour les descriptions vagues
   - Filtres classiques seulement si couleur+prix+genre précis
3. Statistiques → statistiques_produits_tool (OBLIGATOIRE: fournir operation=)
4. Commande → collecter: product_id, taille, couleur, nom, whatsapp, email → passer_commande_tool

IMPORTANT : Fais UN SEUL appel tool par réponse. Ne chaîne pas plusieurs tools inutilement.
"""


# ============================================================
#  BOUCLE AGENT
# ============================================================

def run_agent():
    historique = [SystemMessage(content=SYSTEM_PROMPT)]

    print("━" * 55)
    print("  Agent Art-Jatie — Assistante Jatie")
    print("  Tapez 'stop' pour quitter")
    print("━" * 55)
    print()

    while True:
        message_client = input("Client : ").strip()

        if not message_client:
            continue

        if message_client.lower() == "stop":
            print("Au revoir !")
            break

        historique.append(HumanMessage(content=message_client))

        # Boucle agentic — peut enchaîner plusieurs tools
        while True:
            response = llm_with_tools.invoke(historique)
            historique.append(response)

            if not response.tool_calls:
                break

            for tool_call in response.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                tool_id   = tool_call["id"]

                print(f"\n   Tool : {tool_name}")
                print(f"   Args : {json.dumps(tool_args, ensure_ascii=False)}")

                tool_fn = TOOLS_MAP.get(tool_name)
                if tool_fn is None:
                    resultat = {"erreur": f"Tool inconnu : {tool_name}"}
                else:
                    try:
                        resultat = tool_fn.invoke(tool_call["args"])
                    except Exception as e:
                        resultat = {"erreur": str(e)}

                print(f"  Résultat : {json.dumps(resultat, ensure_ascii=False, default=str)[:400]}…")

                historique.append(
                    ToolMessage(
                        content=json.dumps(resultat, ensure_ascii=False, default=str),
                        tool_call_id=tool_id,
                    )
                )

        if isinstance(response.content, list):
            texte = " ".join([b["text"] for b in response.content if isinstance(b, dict) and "text" in b])
        else:
            texte = response.content
        print(f"\nJatie : {texte}\n")
        print("─" * 55)


# ============================================================
#  POINT D'ENTRÉE
# ============================================================

if __name__ == "__main__":
    run_agent()