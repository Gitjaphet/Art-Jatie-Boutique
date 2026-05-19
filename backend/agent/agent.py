# agent/agent.py
# Cerveau de l'agent commercial Jatie — version pro MVP

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from agent.config import BOUTIQUE_CONFIG
from agent.memory import (
    get_client_by_whatsapp,
    get_conversation,
    save_conversation,
)
from agent.vectorstore import search_products_with_metadata
import os
from dotenv import load_dotenv

load_dotenv()


def get_llm():
    """Initialise le LLM Groq — gratuit et ultra rapide."""
    return ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model_name="llama-3.3-70b-versatile",
        temperature=0.7,
        max_tokens=1024,
    )


def build_system_prompt(client_profile: dict, produits_pertinents: str) -> str:
    """
    Construit le prompt système complet :
    personnalité + contexte boutique + profil client + produits RAG.
    """
    config = BOUTIQUE_CONFIG

    prompt = f"""{config['personnalite']}

═══════════════════════════════
INFOS BOUTIQUE
═══════════════════════════════
Nom : {config['nom']}
Description : {config['description']}
Localisation : {config['localisation']}
Devise : {config['devise']}
Contact WhatsApp : {config['contact_whatsapp']}

═══════════════════════════════
RÈGLES ABSOLUES
═══════════════════════════════
- Tu réponds TOUJOURS dans la langue du client (français ou malgache)
- Tu n'inventes JAMAIS de produits, prix ou disponibilités
- Si rupture de stock → tu le dis honnêtement et proposes une alternative
- Pour commander → tu demandes nom complet + numéro WhatsApp
- Tu es chaleureuse, naturelle, jamais robotique ni trop formelle
- Emojis avec modération ✨ (max 2-3 par message)
- Prix toujours en Ariary (Ar)
- Réponses courtes et claires (max 4-5 lignes sauf si le client pose une question complexe)
- Tu ne parles JAMAIS d'autres boutiques ou concurrents

═══════════════════════════════
PRODUITS PERTINENTS (RAG)
═══════════════════════════════
{produits_pertinents}
"""

    if client_profile:
        prompt += f"""
═══════════════════════════════
CLIENT CONNU 
═══════════════════════════════
Nom : {client_profile.get('nom')}
Commandes : {client_profile.get('nb_commandes', 0)}
Total dépensé : {client_profile.get('total_depense', 0):,} Ar
Catégories favorites : {client_profile.get('categories_favorites')}
Couleurs favorites : {client_profile.get('couleurs_favorites')}
Dernières commandes : {client_profile.get('dernieres_commandes', [])}

→ Accueille-le par son prénom, montre que tu te souviens de lui,
  propose des produits selon ses goûts passés.
"""
    else:
        prompt += """
═══════════════════════════════
NOUVEAU CLIENT
═══════════════════════════════
→ Accueille chaleureusement, découvre ses goûts naturellement
  au fil de la conversation. Ne pose pas trop de questions d'un coup.
"""

    return prompt


def extract_mentioned_products(response_text: str, products: list) -> list:
    """
    Détecte quels produits sont mentionnés dans la réponse de Jatie.
    """
    mentioned = []
    response_lower = response_text.lower()
    for p in products:
        if p["name"].lower() in response_lower:
            mentioned.append({
                "id": p["id"],
                "name": p["name"],
                "price_ar": p["price_ar"],
                "image": p["image"],
                "colors": p["colors"],
                "sizes": p["sizes"],
                "stock": p["stock"],
                "category": p["category"],
            })
    return mentioned


def chat(
    message: str,
    client_whatsapp: str,
    channel: str = "web",
) -> dict:
    """
    Fonction principale de l'agent.

    message          : ce que le client écrit
    client_whatsapp  : identifiant universel du client
    channel          : "web" | "facebook" | "whatsapp"

    Retourne la réponse de Jatie.
    """

    # 1. Profil client depuis ta DB existante
    client_profile = get_client_by_whatsapp(client_whatsapp)

    # 2. Historique de conversation depuis Supabase
    messages = get_conversation(client_whatsapp, channel)

    # 3. RAG — produits pertinents pour ce message
    produits_data = search_products_with_metadata(message)
    produits_context = produits_data["context"]
    

    # 4. System prompt complet
    system_prompt = build_system_prompt(client_profile, produits_context)

    # 5. Construit les messages pour le LLM
    langchain_messages = [SystemMessage(content=system_prompt)]

    # Historique (max 10 derniers échanges = 20 messages)
    for msg in messages[-20:]:
        if msg["role"] == "user":
            langchain_messages.append(HumanMessage(content=msg["content"]))
        else:
            langchain_messages.append(AIMessage(content=msg["content"]))

    # Message actuel
    langchain_messages.append(HumanMessage(content=message))

    # 6. Appel Groq
    llm = get_llm()
    response = llm.invoke(langchain_messages)
    ai_response = response.content

    # 7. Sauvegarde conversation dans Supabase
    messages.append({"role": "user", "content": message})
    messages.append({"role": "assistant", "content": ai_response})
    save_conversation(client_whatsapp, messages, channel)

    # Détecte les produits mentionnés dans la réponse
    mentioned_products = extract_mentioned_products(ai_response, produits_data["products"])

    return {
        "response": ai_response,
        "products": mentioned_products,
    }