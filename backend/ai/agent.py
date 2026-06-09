import sys
sys.path.append("/app")

import os
import json
import time
import logging
import requests
import psycopg2
from dotenv import load_dotenv
from sqlmodel import Session, select, or_, col
from database import engine
from models.models import Product, Order, Client

load_dotenv()


# ============================================================
#  LOGGING TOKEN COUNTER
# ============================================================

token_log = []

def log_llm_call(
    model: str,
    role: str,
    tokens_input: int,
    tokens_output: int,
    latence_ms: float,
    resultat: str,
):
    entry = {
        "model": model,
        "role": role,
        "tokens_input": tokens_input,
        "tokens_output": tokens_output,
        "tokens_total": tokens_input + tokens_output,
        "latence_ms": round(latence_ms, 2),
        "resultat": str(resultat)[:200],
    }
    token_log.append(entry)
    logging.info(f"[TOKEN] {json.dumps(entry, ensure_ascii=False)}")
    return entry

def log_summary():
    total_tokens = sum(e["tokens_total"] for e in token_log)
    total_latence = sum(e["latence_ms"] for e in token_log)
    logging.info(
        f"[SUMMARY] Total tokens: {total_tokens} | "
        f"Total latence: {total_latence:.2f}ms | Appels: {len(token_log)}"
    )
    return {
        "total_tokens": total_tokens,
        "total_latence_ms": total_latence,
        "appels": len(token_log),
        "detail": token_log,
    }


# ============================================================
#  COUCHE DONNÉES
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


def _recherche_semantique(texte: str, top_k: int = 5) -> list[dict]:
    t0 = time.time()
    try:
        response = requests.post(
            "https://api.jina.ai/v1/embeddings",
            headers={
                "Authorization": f"Bearer {os.getenv('JINA_API_KEY')}",
                "Content-Type": "application/json",
            },
            json={
                "model": "jina-embeddings-v3",
                "input": [texte],
                "task": "retrieval.query",
                "dimensions": 1024,
            },
            timeout=15
        )
        if response.status_code != 200:
            logging.error(f"[JINA] Erreur API {response.status_code}")
            return []
            
        vecteur = response.json()["data"][0]["embedding"]
        vecteur_str = "[" + ",".join(map(str, vecteur)) + "]"
    except Exception as e:
        logging.error(f"[JINA] Exception: {str(e)}")
        return []

    logging.info(f"[JINA] Embedding en {time.time() - t0:.2f}s")

    t1 = time.time()
    try:
        conn = psycopg2.connect(
            host="aws-0-eu-west-1.pooler.supabase.com",
            port=6543,
            dbname="postgres",
            user="postgres.gmoezlcqbrfcutyxpxjw",
            password=os.getenv("DB_PASSWORD"),
            sslmode="require",
        )
        cur = conn.cursor()
        cur.execute(
            """
            SELECT pe.product_id, pe.contenu,
                   1 - (pe.embedding <=> %s::vector) AS score
            FROM product_embedding pe
            ORDER BY pe.embedding <=> %s::vector
            LIMIT %s
            """,
            (vecteur_str, vecteur_str, top_k),
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
    except Exception as e:
        logging.error(f"[PGVECTOR] Exception: {str(e)}")
        return []
        
    logging.info(f"[PGVECTOR] Recherche en {time.time() - t1:.2f}s")

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


def _stats(
    operation: str,
    filtre_categorie: str = "",
    filtre_genre: str = "",
) -> dict:
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
            client = Client(name=client_name, email=client_email, whatsapp=client_whatsapp, total_spent=0, total_orders=0)
            session.add(client)
            session.flush()

        cart_item = {
            "id": product.id, "name": product.name, "price": product.price_ar,
            "quantity": quantite, "image": product.image, "category": product.category, "discount": 0,
        }
        total_ar = product.price_ar * quantite

        order = Order(
            client_id=client.id, client_name=client_name, client_email=client_email, client_whatsapp=client_whatsapp,
            client_message=message or None, cart_items_json=json.dumps([cart_item]), subtotal_ar=total_ar,
            discount_ar=0, total_ar=total_ar, delivery_zone="À confirmer", delivery_cost=0,
            delivery_label="À confirmer avec l'équipe", product_id=product.id, product_name=product.name,
            product_image=product.image, product_price_ar=product.price_ar, selected_size=taille,
            selected_color=couleur, payment_method="whatsapp", status="En attente",
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
            "succes": True, "commande_id": order.id, "type": type_commande, "produit": product.name,
            "taille": taille, "couleur": couleur, "quantite": quantite, "total_ar": total_ar,
            "stock_restant": product.stock_quantity if type_commande == "stock" else "N/A",
            "message": f"Commande #{order.id} créée avec succès. L'équipe vous contactera sur WhatsApp.",
        }


# ============================================================
#  LLM 1 — GROQ — CLASSIFIER (Remplacement de Cerebras)
# ============================================================

def llm1_classifier(message: str, history: list = None) -> dict:
    t0 = time.time()
    import httpx

    headers = {
        "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}", # ✅ Utilisation de Groq
        "Content-Type": "application/json",
    }
    
    # Construction des messages avec historique
    messages_payload = [
        {
            "role": "system",
            "content": (
                "Classify the user message into exactly ONE word:\n"
                '- "recherche" : looking for a product\n'
                '- "commande"  : wants to order\n'
                '- "stats"     : asking about stock/count/price stats\n'
                '- "faq"       : asking about delivery/returns/payment\n'
                '- "salutation": greeting or small talk\n'
                "Reply with ONLY the single word, nothing else."
            ),
        }
    ]
    
    if history:
        for msg in history[-4:]: # Prend les 4 derniers messages pour le contexte
            messages_payload.append({"role": msg["role"], "content": msg["content"]})
            
    messages_payload.append({"role": "user", "content": message})

    body = {
        "model": "llama-3.1-8b-instant", # ✅ Modèle Groq ultra-rapide pour la classification
        "messages": messages_payload,
        "max_tokens": 10,
        "temperature": 0,
    }
    
    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions", # ✅ URL Groq
            headers=headers,
            json=body,
            timeout=30,
        )
        
        if response.status_code != 200:
            logging.error(f"[GROQ CLASSIFIER] Erreur API {response.status_code}: {response.text}")
            return {"intent": "salutation", "tokens_in": 0, "tokens_out": 0}

        data = response.json()
        latence = (time.time() - t0) * 1000
        
        # ✅ Extraction sécurisée pour éviter l'Exception 'content'
        message_obj = data.get("choices", [{}])[0].get("message", {})
        intent = message_obj.get("content", "salutation").strip().lower()
        
        tokens_in = data.get("usage", {}).get("prompt_tokens", 0)
        tokens_out = data.get("usage", {}).get("completion_tokens", 0)
        
        log_llm_call("groq/llama-3.1-8b-instant", "classifier", tokens_in, tokens_out, latence, intent)
        return {"intent": intent, "tokens_in": tokens_in, "tokens_out": tokens_out}
        
    except Exception as e:
        logging.error(f"[GROQ CLASSIFIER] Exception : {str(e)}")
        return {"intent": "salutation", "tokens_in": 0, "tokens_out": 0}

# ============================================================
#  LLM 2 — GROQ — ROUTER (tool calling)
# ============================================================

def llm2_router(message: str, intent: str, history: list = None) -> dict:
    t0 = time.time()
    import httpx

    headers = {
        "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
        "Content-Type": "application/json",
    }

    tools = [
        {
            "type": "function",
            "function": {
                "name": "rechercher_produit",
                "description": "Recherche produits par filtres ou requête sémantique",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "requete_libre": {"type": "string", "description": "Phrase naturelle pour recherche sémantique"},
                        "produit":   {"type": "string"},
                        "couleur":   {"type": "string"},
                        "categorie": {"type": "string"},
                        "genre":     {"type": "string"},
                        "prix_min":  {"type": "integer"},
                        "prix_max":  {"type": "integer"},
                        "sort": {"type": "string", "enum": ["price_asc", "price_desc", "name_asc", ""]},
                        "limit": {"type": "integer"},
                    },
                    "required": [],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "statistiques",
                "description": "Statistiques sur le catalogue",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "operation": {
                            "type": "string",
                            "enum": ["count", "stock_total", "valeur_stock", "prix_moyen", "min_price", "max_price", "stock_faible", "rupture", "par_categorie", "par_genre"],
                        },
                        "filtre_categorie": {"type": "string"},
                        "filtre_genre":     {"type": "string"},
                    },
                    "required": ["operation"],
                },
            },
        },
    ]

    messages_payload = [
        {
            "role": "system",
            "content": "Tu es un routeur. Choisis le bon tool et les bons paramètres selon le message. Toujours utiliser requete_libre pour les descriptions vagues."
        }
    ]
    
    if history:
        for msg in history[-4:]:
            messages_payload.append({"role": msg["role"], "content": msg["content"]})
            
    messages_payload.append({"role": "user", "content": message})

    body = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages_payload,
        "tools": tools,
        "tool_choice": "required",
        "max_tokens": 200,
        "temperature": 0,
    }
    
    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=body,
            timeout=30,
        )
        
        # ✅ Sécurité anti-crash
        if response.status_code != 200:
            logging.error(f"[GROQ] Erreur API {response.status_code}: {response.text}")
            return None

        data = response.json()
        latence = (time.time() - t0) * 1000
        tokens_in = data["usage"]["prompt_tokens"]
        tokens_out = data["usage"]["completion_tokens"]

        tool_call = data["choices"][0]["message"]["tool_calls"][0]
        tool_name = tool_call["function"]["name"]
        tool_args = json.loads(tool_call["function"]["arguments"])

        log_llm_call(
            "groq/llama-3.3-70b", "router", tokens_in, tokens_out, latence,
            f"{tool_name}({tool_args})",
        )
        return {"tool_name": tool_name, "tool_args": tool_args}
        
    except Exception as e:
        logging.error(f"[GROQ] Exception : {str(e)}")
        return None


# ============================================================
#  EXÉCUTION TOOL (recherche + stats)
# ============================================================

def execute_tool(tool_name: str, tool_args: dict) -> list | dict:
    t0 = time.time()

    if tool_name == "rechercher_produit":
        requete_libre = tool_args.get("requete_libre", "")
        if requete_libre:
            result = _recherche_semantique(requete_libre)
        else:
            result = _get_products(
                produit=tool_args.get("produit", ""),
                couleur=tool_args.get("couleur", ""),
                categorie=tool_args.get("categorie", ""),
                genre=tool_args.get("genre", ""),
                prix_min=tool_args.get("prix_min", 0),
                prix_max=tool_args.get("prix_max", 0),
                sort=tool_args.get("sort", ""),
                limit=tool_args.get("limit", 0),
            )
            if not result and tool_args.get("produit"):
                result = _recherche_semantique(tool_args["produit"])

    elif tool_name == "statistiques":
        result = _stats(
            operation=tool_args.get("operation", "count"),
            filtre_categorie=tool_args.get("filtre_categorie", ""),
            filtre_genre=tool_args.get("filtre_genre", ""),
        )
    else:
        result = {"erreur": f"Tool inconnu : {tool_name}"}

    logging.info(f"[TOOL] {tool_name} exécuté en {time.time() - t0:.2f}s")
    return result


# ============================================================
#  LLM 3 — QWEN LOCAL (Ollama) — REFORMULATEUR
# ============================================================

def llm3_reformulateur(message: str, donnees: any) -> str:
    t0 = time.time()
    import httpx

    prompt = (
        f"Tu es Jatie, assistante commerciale Art-Jatie (crochet malgache).\n"
        f"Reformule ces données en français naturel et chaleureux en 3 phrases max.\n"
        f"Ne mens jamais sur les prix ou stocks.\n"
        f"Si stock=0 → propose commande sur mesure.\n\n"
        f"Question client : {message}\n"
        f"Données : {json.dumps(donnees, ensure_ascii=False, default=str)[:800]}\n\n"
        f"Réponse Jatie :"
    )

    try:
        response = httpx.post(
            f"{os.getenv('OLLAMA_BASE_URL', 'http://ollama:11434')}/api/generate",
            json={
                "model": "qwen2.5:3b",
                "prompt": prompt,
                "stream": False,
                "options": {"num_ctx": 512, "temperature": 0.3},
            },
            timeout=120,
        )
        
        if response.status_code != 200:
            logging.error(f"[OLLAMA] Erreur API {response.status_code}")
            return "Voici les résultats trouvés, mais je n'arrive pas à bien les lire pour le moment."

        data = response.json()
        latence = (time.time() - t0) * 1000
        tokens_in = data.get("prompt_eval_count", 0)
        tokens_out = data.get("eval_count", 0)
        texte = data.get("response", "").strip()
        
        log_llm_call("ollama/qwen2.5:3b", "reformulateur", tokens_in, tokens_out, latence, texte[:100])
        return texte
        
    except Exception as e:
        logging.error(f"[OLLAMA] Exception : {str(e)}")
        return "J'ai trouvé des articles, mais j'ai un petit souci de connexion pour vous les présenter."


# ============================================================
#  LLM 4 — GROQ — COLLECTEUR + CONFIRMATEUR COMMANDE
# ============================================================

def llm4_commande(message: str, historique_commande: dict, commande_result: dict = None) -> str:
    t0 = time.time()
    import httpx

    if commande_result:
        prompt = (
            f"Tu es Jatie, assistante Art-Jatie.\n"
            f"La commande a été enregistrée avec succès.\n"
            f"Résultat : {json.dumps(commande_result, ensure_ascii=False)}\n"
            f"Annonce la confirmation au client en français, ton chaleureux, 2-3 phrases. "
            f"Mentionne le numéro de commande et que l'équipe le contactera sur WhatsApp."
        )
    else:
        champs_manquants = [k for k, v in historique_commande.items() if not v]
        prompt = (
            f"Tu es Jatie, assistante Art-Jatie.\n"
            f"Le client veut commander. Infos collectées : "
            f"{json.dumps(historique_commande, ensure_ascii=False)}\n"
            f"Champs manquants : {champs_manquants}\n"
            f"Pose UNE SEULE question pour collecter le prochain champ manquant.\n"
            f"Réponds en français, ton chaleureux."
        )

    headers = {
        "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
        "Content-Type": "application/json",
    }
    
    body = {
        "model": "llama-3.3-70b-versatile", # Modèle Groq puissant
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 150,
        "temperature": 0.3,
    }
    
    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=body,
            timeout=30
        )
        
        if response.status_code != 200:
            logging.error(f"[GROQ COMMANDE] Erreur API {response.status_code}")
            return "Une erreur technique empêche la commandes pour l'instant, veuillez nous contacter directement sur WhatsApp !"

        data = response.json()
        latence = (time.time() - t0) * 1000
        texte = data["choices"][0]["message"]["content"].strip()
        tokens_in = data.get("usage", {}).get("prompt_tokens", 0)
        tokens_out = data.get("usage", {}).get("completion_tokens", 0)
        
        log_llm_call("groq/llama-3.3-70b", "collecteur_commande", tokens_in, tokens_out, latence, texte[:100])
        return texte
        
    except Exception as e:
        logging.error(f"[GROQ COMMANDE] Exception : {str(e)}")
        return "Désolé, notre système de commande rencontre une petite perturbation technique."


# ============================================================
#  LLM 5 — OPENROUTER (DeepSeek) — FAQ
# ============================================================

FAQ_CONTEXT = """
Art-Jatie Boutique — Crochet artisanal malgache — Atelier : Seganinga, Nosy Be
LIVRAISON :
- Jabala : Gratuite — demi-journée
- Darsalam : 5 000 Ar — demi-journée
- Dzamanjar : 7 000 Ar — demi-journée
- Autres zones / international : Sur devis → WhatsApp 034 30 513 60
RETOURS : sous 2 jours, article non porté → WhatsApp 034 30 513 60
PAIEMENT : MVola, Orange Money, WhatsApp. Sur mesure: acompte 50%.
"""

def llm5_faq(message: str) -> str:
    t0 = time.time()
    import httpx

    headers = {
        "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://artjatie.com",
    }
    body = {
        "model": "deepseek/deepseek-r1:free",
        "messages": [
            {
                "role": "system",
                "content": f"Tu es Jatie, assistante Art-Jatie. Réponds uniquement avec les infos ci-dessous. Ton chaleureux, français, 2-3 phrases max.\n\n{FAQ_CONTEXT}",
            },
            {"role": "user", "content": message},
        ],
        "max_tokens": 200,
        "temperature": 0.2,
    }
    
    try:
        response = httpx.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=body,
            timeout=30,
        )
        
        if response.status_code != 200:
            logging.error(f"[DEEPSEEK] Erreur API {response.status_code}")
            return "Pour toute question, n'hésitez pas à nous contacter directement sur WhatsApp au 034 30 513 60 ! 💕"

        data = response.json()
        latence = (time.time() - t0) * 1000
        texte = data["choices"][0]["message"]["content"].strip()
        tokens_in = data.get("usage", {}).get("prompt_tokens", 0)
        tokens_out = data.get("usage", {}).get("completion_tokens", 0)
        
        log_llm_call("openrouter/deepseek-r1", "faq", tokens_in, tokens_out, latence, texte[:100])
        return texte
        
    except Exception as e:
        logging.error(f"[DEEPSEEK] Exception : {str(e)}")
        return "Pour toute question, n'hésitez pas à nous contacter directement sur WhatsApp au 034 30 513 60 ! 💕"


# ============================================================
#  ORCHESTRATEUR PRINCIPAL
# ============================================================

def run_multi_agent(
    message: str,
    history: list = None,          # ← Ajout du paramètre d'historique
    historique_commande: dict = None,
) -> dict:
    global token_log
    token_log = []  
    t_total = time.time()

    logging.info(f"[MULTI-AGENT] ── Début : '{message}'")

    # LLM 1 — Classifier
    classifier_result = llm1_classifier(message, history=history)
    intent = classifier_result.get("intent", "salutation")
    logging.info(f"[MULTI-AGENT] Intent détecté : {intent}")

    reponse = ""

    # ── Salutation ────────────────────────────────────────────────────────────
    if intent == "salutation":
        reponse = "Bonjour ! 💕 Je suis Jatie, votre assistante Art-Jatie ✨ Comment puis-je vous aider aujourd'hui ?"

    # ── Recherche produit / Statistiques ─────────────────────────────────────
    elif intent in ["recherche", "stats"]:
        # LLM 2 — Router
        router_result = llm2_router(message, intent, history=history)
        
        if router_result:
            tool_name = router_result["tool_name"]
            tool_args = router_result["tool_args"]
            logging.info(f"[MULTI-AGENT] Tool : {tool_name} | Args : {tool_args}")

            # Exécution
            donnees = execute_tool(tool_name, tool_args)
            logging.info(f"[MULTI-AGENT] Données : {str(donnees)[:200]}")

            # LLM 3 — Reformulateur
            reponse = llm3_reformulateur(message, donnees)
        else:
            reponse = "Je suis désolée, je rencontre un petit problème pour effectuer cette recherche. Réessayez dans un instant 💕"

    # ── Commande ──────────────────────────────────────────────────────────────
    elif intent == "commande":
        if historique_commande is None:
            historique_commande = {
                "product_id":       None,
                "product_name":     None,
                "taille":           None,
                "couleur":          None,
                "client_name":      None,
                "client_whatsapp":  None,
                "client_email":     None,
            }

        champs_manquants = [k for k, v in historique_commande.items() if not v]

        if not champs_manquants:
            logging.info("[MULTI-AGENT] Tous les champs collectés → _passer_commande()")
            commande_result = _passer_commande(
                product_id=historique_commande["product_id"],
                client_name=historique_commande["client_name"],
                client_whatsapp=historique_commande["client_whatsapp"],
                client_email=historique_commande.get("client_email") or "",
                taille=historique_commande["taille"],
                couleur=historique_commande["couleur"],
            )
            reponse = llm4_commande(message, historique_commande, commande_result=commande_result)
            if commande_result.get("succes"):
                historique_commande = None
        else:
            reponse = llm4_commande(message, historique_commande)

    # ── FAQ ───────────────────────────────────────────────────────────────────
    elif intent == "faq":
        reponse = llm5_faq(message)

    # ── Fallback ──────────────────────────────────────────────────────────────
    else:
        reponse = "Je suis Jatie, votre assistante Art-Jatie 💕 Comment puis-je vous aider ?"

    summary = log_summary()
    logging.info(f"[MULTI-AGENT] ── Total : {time.time() - t_total:.2f}s | Tokens: {summary['total_tokens']}")

    return {
        "response": reponse,
        "intent": intent,
        "token_summary": summary,
        "historique_commande": historique_commande,
    }