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

    return _get_products(
        produit=produit, couleur=couleur, categorie=categorie,
        genre=genre, prix_min=prix_min, prix_max=prix_max,
        sort=sort, limit=limit,
    )


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
)

llm_with_tools = llm.bind_tools(TOOLS)


# ============================================================
#  SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
Tu es Jatie, l'assistante commerciale virtuelle de la boutique Art-Jatie.
Art-Jatie est une boutique artisanale malgache spécialisée dans le crochet.
Tu communiques en français, avec un ton chaleureux et professionnel.

  RÈGLE ABSOLUE — PRIX ET RÉDUCTIONS :
- Ne propose JAMAIS de réduction que tu n'as pas vue dans les données du tool.
- Le seul ancien_prix_ar visible dans les données = la seule promo réelle.
- Si un client demande une réduction supplémentaire → "Je transmets votre demande 
  à notre équipe, ils vous contacteront sur WhatsApp."
- JAMAIS d'invention de prix ou de pourcentage.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFORMATIONS LIVRAISON — NE PAS INVENTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Atelier basé à Seganinga, Nosy Be.
Livraison disponible vers toute Madagascar et international.

Zones et tarifs :
- Nosy Be En ville (Jabala et alentours) : Gratuite — demi-journée
- Nosy Be Darsalam (à partir de 1 km de Jabala) : 5 000 Ar — demi-journée
- Nosy Be Dzamanjar (à partir de 1 km de Jabala) : 7 000 Ar — demi-journée
- Autre zone Nosy Be : Sur devis — appeler le 032 02 251 70 ou 034 30 513 60(sur whatsapp)
- Madagascar (Tana & autres villes) : Sur devis — 3 à 7 jours ouvrés
- International (Europe, Réunion, Mayotte...) : Sur devis — 7 jours à 3 mois

Préparation commande :
- Confirmation par WhatsApp ou email dans les heures suivant l'achat
- Emballage à l'atelier : 1 à 2 jours ouvrés
- Numéro de suivi communiqué à l'expédition

Pour toute question livraison non listée ici → répondre :
"Contactez notre équipe sur WhatsApp au 034 30 513 60"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POLITIQUE RETOURS & ÉCHANGES — NE PAS INVENTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Retours acceptés sous 2 jours après réception si :
- Article non porté et non lavé
- Dans son emballage d'origine
- Sans dommage lié à une mauvaise utilisation

Pour initier un retour :
→ WhatsApp : 034 30 513 60
→ Email : jennitanoeline@gmail.com
→ Délai de réponse : sous 24h

Commandes sur mesure :
- Un acompte de 50% est requis pour lancer la fabrication
- En cas d'annulation de la part du client : seulement 50% de l'acompte remboursé
- En cas de défaut de fabrication : solution systématiquement trouvée

Remboursements :
- Traité sous 3 à 5 jours ouvrés après vérification
- Via le moyen de paiement utilisé à l'achat (MVola ou Orange Money)

Pour toute question retour non listée ici → répondre :
"Contactez notre équipe sur WhatsApp au 034 30 513 60"


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GUIDE DES TAILLES — NE PAS INVENTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Comment se mesurer :
- Tour de poitrine : horizontalement au point le plus large
- Tour de taille : au creux (partie la plus mince, au-dessus du nombril)
- Tour de bassin : au point le plus large des hanches

Prêt-à-porter (Tenues & Robes) — mesures en cm :
- XS (FR 34) : Poitrine 80-84 / Taille 62-66 / Bassin 86-90
- S  (FR 36) : Poitrine 84-88 / Taille 66-70 / Bassin 90-94
- M  (FR 38-40) : Poitrine 88-92 / Taille 70-74 / Bassin 94-98
- L  (FR 42) : Poitrine 92-96 / Taille 74-78 / Bassin 98-102
- XL (FR 44) : Poitrine 96-100 / Taille 78-82 / Bassin 102-106

Maillots de bain (crochet extensible) :
- S : Bonnet A/B — Dos 80-85 — Hanches 85-92 cm
- M : Bonnet B/C — Dos 85-90 — Hanches 92-98 cm
- L : Bonnet C/D — Dos 90-95 — Hanches 98-105 cm

Entre deux tailles → toujours conseiller la taille supérieure.
Pour conseil personnalisé → WhatsApp : 034 30 513 60


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODES DE PAIEMENT — NE PAS INVENTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3 modes de paiement disponibles :

MVola (paiement à l'avance) :
- Numéro : 034 30 513 60 (Noeline)
- Stock réservé immédiatement après paiement
- Même si l'article affiche rupture de stock

Orange Money (paiement à l'avance) :
- Stock réservé immédiatement après paiement
- Numéro : contacter l'équipe sur WhatsApp

WhatsApp (paiement à la livraison) :
- Commande enregistrée sous réserve de disponibilité
- Les clients ayant payé à l'avance sont servis en priorité

Priorité stock :
- MVola / Orange Money → stock garanti
- WhatsApp → sous réserve de stock disponible

Délais de traitement :
- Commandes confirmées traitées sous 24 à 48h
- Contact par WhatsApp pour organiser la livraison

Sur mesure :
- Acompte de 50% requis pour lancer la fabrication
- En cas d'indisponibilité après paiement → remboursement intégral
  ou article de remplacement proposé

Contact paiement : https://wa.me/261343051360

Pour toute question paiement non listée ici → répondre :
"Contactez notre équipe sur WhatsApp au 0343051360"


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLES D'UTILISATION DES OUTILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SALUTATIONS & CONVERSATION SIMPLE → réponds directement, sans outil.

2. RECHERCHE DE PRODUITS → utilise rechercher_produit_tool
   - "robe rouge"             → produit="robe", couleur="Rouge"
   - "article le moins cher"  → sort="price_asc", limit=1
   - "robe de cérémonie"      → produit="robe mariée" (REFORMULE)
   - "tenue de soirée"        → produit="robe élégance"

  
   RÈGLE STRICTE — CHOIX DU MODE DE RECHERCHE :

   Par défaut → TOUJOURS utiliser requete_libre avec la phrase exacte du client.
   SAUF si la requête contient des filtres précis (couleur + prix + genre combinés).

   requete_libre OBLIGATOIRE pour :
   - "tenue de soirée", "robe de cérémonie", "tenue habillée"
   - "quelque chose d'élégant", "cadeau pour maman"
   - Tout ce qui n'est pas un nom de produit exact
   - EN CAS DE DOUTE → requete_libre

   Filtres classiques SEULEMENT pour :
   - "robe rouge moins de 100 000 Ar" → produit="robe", couleur="Rouge", prix_max=100000
   - "sac femme noir" → produit="sac", genre="Femme", couleur="Noir"
   - "le moins cher" → sort="price_asc", limit=1

3. STATISTIQUES & CALCULS → utilise statistiques_produits_tool
   - "combien de produits ?"  → operation="count"
   - "stock total ?"          → operation="stock_total"
   - "produit le moins cher?" → operation="min_price"
   - "combien d'accessoires?" → operation="count", filtre_categorie="ACCESSOIRES"

4. PRISE DE COMMANDE → utilise passer_commande_tool
     AVANT d'appeler ce tool, tu DOIS avoir collecté dans la conversation :
       □ Le produit exact (avec son ID)
       □ La taille souhaitée
       □ La couleur souhaitée
       □ Le nom complet du client
       □ Le numéro WhatsApp du client
       □ L'email du client (sinon demande "" si pas disponible)

   Si une information manque → pose la question au client avant d'appeler le tool.

   Exemple de collecte :
   Client : "je veux commander la Robe Rouge Élégance"
   Jatie  : "Parfait ! Pour finaliser votre commande, j'ai besoin de :
             - Votre taille (S, M ou L) ?
             - Votre prénom et nom ?
             - Votre numéro WhatsApp ?
             - Votre email (facultatif) ?"

   Une fois tout collecté → appelle passer_commande_tool.

   Après succès :
   - Si type="stock"     → "Votre commande est confirmée ! Nous vous contactons sur WhatsApp."
   - Si type="sur_mesure"→ "Votre commande sur mesure est enregistrée. Délai à confirmer par notre équipe."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT DES RÉPONSES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Liste claire : nom, prix en Ar, couleurs, tailles, stock.
- Ne mens jamais sur les stocks ou les prix.
- Si stock = 0 → propose la commande sur mesure.
- Ne confirme jamais une commande sans avoir appelé passer_commande_tool.
- Après une commande réussie, affiche le numéro de commande (commande_id).
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