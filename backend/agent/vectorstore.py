# agent/vectorstore.py
# RAG — Indexation des produits dans ChromaDB pour recherche sémantique

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_core.documents import Document
from sqlmodel import Session, select
from database import engine
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.models import Product

# Dossier où ChromaDB stocke les vecteurs
CHROMA_PATH = "./agent/chroma_db"

# Modèle d'embeddings gratuit et local
EMBEDDING_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"


def get_embeddings():
    """Retourne le modèle d'embeddings multilingue (français + malgache)."""
    return SentenceTransformerEmbeddings(model_name=EMBEDDING_MODEL)


def build_vectorstore() -> Chroma:
    """
    Indexe tous les produits de la base de données dans ChromaDB.
    À appeler au démarrage de l'application.
    """
    with Session(engine) as session:
        products = session.exec(select(Product)).all()

    documents = []
    for p in products:
        stock = "disponible" if p.stock_quantity > 0 else "rupture de stock"
        
        # Texte riche pour la recherche sémantique
        content = f"""
Produit: {p.name}
Catégorie: {p.category}
Genre: {p.genre}
Prix: {p.price_ar:,} Ar
Couleurs disponibles: {p.colors}
Tailles disponibles: {p.sizes}
Stock: {stock} ({p.stock_quantity} unités)
Badge: {p.badge}
Sur commande: {"Oui" if p.on_order else "Non"}
        """.strip()

        documents.append(Document(
            page_content=content,
            metadata={
                "id": p.id,
                "name": p.name,
                "price_ar": p.price_ar,
                "category": p.category,
                "stock": p.stock_quantity,
            }
        ))

    embeddings = get_embeddings()
    
    vectorstore = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory=CHROMA_PATH,
    )
    
    print(f"✅ ChromaDB indexé avec {len(documents)} produits")
    return vectorstore


def load_vectorstore() -> Chroma:
    """Charge le vectorstore existant."""
    embeddings = get_embeddings()
    return Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=embeddings,
    )


def search_products(query: str, k: int = 3) -> str:
    """
    Recherche les produits les plus pertinents pour une requête client.
    Ex: "je veux quelque chose pour la plage" → trouve les tenues de plage
    """
    try:
        vectorstore = load_vectorstore()
        results = vectorstore.similarity_search(query, k=k)
        
        if not results:
            return "Aucun produit trouvé pour cette recherche."
        
        context = "Produits correspondants :\n"
        for doc in results:
            context += f"\n{doc.page_content}\n---"
        
        return context
    except Exception:
        # Si le vectorstore n'est pas encore créé, on charge depuis la DB
        from agent.memory import get_products_context
        return get_products_context()


def search_products_with_metadata(query: str, k: int = 3) -> dict:
    """
    Comme search_products() mais retourne aussi les données complètes
    des produits pour afficher les images dans le frontend.
    
    Retourne :
    {
        "context": texte pour le prompt,
        "products": [{"id", "name", "price_ar", "image", ...}, ...]
    }
    """
    try:
        # 1. Cherche dans ChromaDB les produits pertinents
        vectorstore = load_vectorstore()
        results = vectorstore.similarity_search(query, k=k)

        if not results:
            # Fallback — charge tous les produits depuis la DB
            return _fallback_products()

        # 2. Récupère les IDs trouvés par ChromaDB
        product_ids = [doc.metadata["id"] for doc in results]

        # 3. Charge les données complètes depuis la DB (avec image)
        with Session(engine) as session:
            products_db = session.exec(
                select(Product).where(Product.id.in_(product_ids))
            ).all()

        # 4. Construit le contexte texte pour le prompt
        context = "Produits correspondants :\n"
        for doc in results:
            context += f"\n{doc.page_content}\n---"

        # 5. Construit la liste structurée avec images
        products_list = []
        for p in products_db:
            stock = "Disponible" if p.stock_quantity > 0 else "Rupture de stock"
            products_list.append({
                "id": p.id,
                "name": p.name,
                "price_ar": p.price_ar,
                "image": p.image,
                "colors": p.colors,
                "sizes": p.sizes,
                "stock": stock,
                "category": p.category,
                "on_order": p.on_order,
            })

        return {
            "context": context,
            "products": products_list,
        }

    except Exception:
        return _fallback_products()


def _fallback_products() -> dict:
    """
    Fallback si ChromaDB n'est pas prêt —
    charge tous les produits directement depuis la DB.
    """
    with Session(engine) as session:
        products = session.exec(select(Product)).all()

    context_lines = []
    products_list = []

    for p in products:
        stock = "Disponible" if p.stock_quantity > 0 else "Rupture de stock"
        context_lines.append(
            f"- {p.name} | {p.category} | {p.price_ar:,} Ar | {stock}"
        )
        products_list.append({
            "id": p.id,
            "name": p.name,
            "price_ar": p.price_ar,
            "image": p.image,
            "colors": p.colors,
            "sizes": p.sizes,
            "stock": stock,
            "category": p.category,
            "on_order": p.on_order,
        })

    return {
        "context": "\n".join(context_lines),
        "products": products_list,
    }