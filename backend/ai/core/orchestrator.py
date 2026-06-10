# ai/core/orchestrator.py
import json
import logging
import time

from ai.core.token_logger import log_summary
from ai.agents.classifier import llm1_classifier
from ai.agents.router import llm2_router
from ai.agents.reformulator import llm3_reformulateur
from ai.agents.order_agent import llm4_commande
from ai.agents.faq import llm5_faq
from ai.data.products import get_products, recherche_semantique
from ai.data.stats import get_stats
from ai.data.orders import passer_commande


def execute_tool(tool_name: str, tool_args: dict) -> list | dict:
    t0 = time.time()

    if tool_name == "rechercher_produit":
        requete_libre = tool_args.get("requete_libre", "")

        if requete_libre:
            result = recherche_semantique(requete_libre)
        else:
            result = get_products(
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
                result = recherche_semantique(tool_args["produit"])

        # Logique alternative si tout est en rupture
        if isinstance(result, list) and len(result) > 0:
            tout_en_rupture = all(p.get("stock", 0) == 0 for p in result)
            if tout_en_rupture:
                terme = requete_libre or tool_args.get("produit") or tool_args.get("categorie") or "chic"
                alternatives = recherche_semantique(f"Alternative similaire à {terme}", top_k=3)
                alts_en_stock = [
                    p for p in alternatives
                    if p.get("stock", 0) > 0 and p["id"] not in [r["id"] for r in result]
                ]
                if alts_en_stock:
                    result = {
                        "demande_initiale": result,
                        "alternatives_en_stock": alts_en_stock,
                    }

    elif tool_name == "statistiques":
        result = get_stats(
            operation=tool_args.get("operation", "count"),
            filtre_categorie=tool_args.get("filtre_categorie", ""),
            filtre_genre=tool_args.get("filtre_genre", ""),
        )
    else:
        result = {"erreur": f"Tool inconnu : {tool_name}"}

    logging.info(f"[TOOL] {tool_name} exécuté en {time.time() - t0:.2f}s")
    return result


def run_multi_agent(
    message: str,
    history: list = None,
    historique_commande: dict = None,
) -> dict:
    token_log = []
    t_total = time.time()

    logging.info(f"[ORCHESTRATOR] ── Début : '{message}'")

    # LLM 1 — Classifier
    classifier_result = llm1_classifier(token_log, message, history=history)
    intent = classifier_result.get("intent", "salutation")
    logging.info(f"[ORCHESTRATOR] Intent : {intent}")

    reponse = ""

    # ── Salutation ────────────────────────────────────────────────────
    if intent == "salutation":
        reponse = "Bonjour ! 💕 Je suis Jatie, votre assistante Art-Jatie ✨ Comment puis-je vous aider aujourd'hui ?"

    # ── Recherche / Stats ─────────────────────────────────────────────
    elif intent in ["recherche", "stats"]:
        router_result = llm2_router(token_log, message, history=history)

        if router_result:
            tool_name = router_result["tool_name"]
            tool_args = router_result["tool_args"]
            logging.info(f"[ORCHESTRATOR] Tool : {tool_name} | Args : {tool_args}")

            donnees = execute_tool(tool_name, tool_args)
            logging.info(f"[ORCHESTRATOR] Données : {str(donnees)[:200]}")

            reponse = llm3_reformulateur(token_log, message, donnees)
        else:
            reponse = "Je suis désolée, je rencontre un petit problème pour effectuer cette recherche. Réessayez dans un instant 💕"

    # ── Commande ──────────────────────────────────────────────────────
    elif intent == "commande":
        if historique_commande is None:
            historique_commande = {
                "product_id":      None,
                "product_name":    None,
                "taille":          None,
                "couleur":         None,
                "client_name":     None,
                "client_whatsapp": None,
                "client_email":    None,
            }

        champs_manquants = [k for k, v in historique_commande.items() if not v]

        if not champs_manquants:
            logging.info("[ORCHESTRATOR] Tous les champs collectés → passer_commande()")
            commande_result = passer_commande(
                product_id=historique_commande["product_id"],
                client_name=historique_commande["client_name"],
                client_whatsapp=historique_commande["client_whatsapp"],
                client_email=historique_commande.get("client_email") or "",
                taille=historique_commande["taille"],
                couleur=historique_commande["couleur"],
            )
            reponse = llm4_commande(token_log, message, historique_commande, commande_result=commande_result)
            if commande_result.get("succes"):
                historique_commande = None
        else:
            reponse = llm4_commande(token_log, message, historique_commande)

    # ── FAQ ───────────────────────────────────────────────────────────
    elif intent == "faq":
        reponse = llm5_faq(token_log, message)

    # ── Fallback ──────────────────────────────────────────────────────
    else:
        reponse = "Je suis Jatie, votre assistante Art-Jatie 💕 Comment puis-je vous aider ?"

    summary = log_summary(token_log)
    logging.info(f"[ORCHESTRATOR] ── Total : {time.time() - t_total:.2f}s | Tokens : {summary['total_tokens']}")

    return {
        "response": reponse,
        "intent": intent,
        "token_summary": summary,
        "historique_commande": historique_commande,
    }