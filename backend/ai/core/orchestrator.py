# ai/core/orchestrator.py
import json
import logging
import time

from ai.core.token_logger import log_summary
from ai.core.llm import masquer_donnees_perso
from ai.agents.classifier import llm1_classifier
from ai.agents.router import llm2_router
from ai.data.cartes import construire_cartes, texte_cartes
from ai.agents.extracteur_commande import extraire_champs
from ai.commande.parcours import demarrer, repondre
from ai.agents.faq import llm5_faq
from ai.knowledge.recherche import chercher_passages
from ai.data.products import get_products, recherche_semantique
from ai.data.stats import get_stats
from ai.data.stats_texte import formater_stats
from sqlmodel import Session
from database import engine


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
            tout_en_rupture = all(p.get("stock", 0) == 0 and not p.get("sur_commande") for p in result)
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
    commander: int = None,
) -> dict:
    token_log = []
    t_total = time.time()

    # Données personnelles masquées avant tout envoi aux modèles gratuits, à Jina et aux logs
    message_masque = masquer_donnees_perso(message)
    history_masque = [
        {**m, "content": masquer_donnees_perso(m.get("content") or "")}
        for m in (history or [])
    ]

    logging.info(f"[ORCHESTRATOR] ── Début : '{message_masque}'")

    # Commande en cours (brouillon du parcours guidé) ou bouton « Commander » : pas de classification,
    # Jatie ne change pas de sujet tant que la commande n'est pas confirmée ou annulée.
    commande_en_cours = bool(commander) or bool((historique_commande or {}).get("etape"))
    if commande_en_cours:
        intent = "commande"
    else:
        # LLM 1 — Classifier
        classifier_result = llm1_classifier(token_log, message_masque, history=history_masque)
        intent = classifier_result.get("intent", "indisponible")
        historique_commande = None  # ancien format de brouillon (sans étape) : ignoré
    logging.info(f"[ORCHESTRATOR] Intent : {intent}")

    reponse = ""
    produits = []
    liens = []
    suggestions = []

    # ── Salutation ────────────────────────────────────────────────────
    if intent == "salutation":
        reponse = "Bonjour ! 💕 Je suis Jatie, votre assistante Art-Jatie ✨ Comment puis-je vous aider aujourd'hui ?"

    # ── Recherche / Stats ─────────────────────────────────────────────
    elif intent in ["recherche", "stats"]:
        router_result = llm2_router(token_log, message_masque, history=history_masque)

        if router_result:
            tool_name = router_result["tool_name"]
            tool_args = router_result["tool_args"]
            logging.info(f"[ORCHESTRATOR] Tool : {tool_name} | Args : {tool_args}")

            donnees = execute_tool(tool_name, tool_args)
            logging.info(f"[ORCHESTRATOR] Données : {str(donnees)[:200]}")

            if tool_name == "statistiques":
                reponse = formater_stats(tool_args, donnees)
            else:
                alternatives = isinstance(donnees, dict) and "alternatives_en_stock" in donnees
                liste = donnees["alternatives_en_stock"] if alternatives else (donnees if isinstance(donnees, list) else [])
                produits = construire_cartes(liste)
                reponse = texte_cartes(produits, alternatives)
        else:
            reponse = "Je suis désolée, je rencontre un petit problème pour effectuer cette recherche. Réessayez dans un instant 💕"

    # ── Commande : parcours guidé par le code (ai/commande/parcours.py) ───
    elif intent == "commande":
        if commande_en_cours:
            # Message NON masqué : nom et numéro sont justement ce qu'on collecte
            # (chaîne « commande » : Groq puis OpenRouter, sans entraînement sur les données).
            with Session(engine) as session:
                if commander:
                    r = demarrer(session, int(commander))
                else:
                    r = repondre(session, historique_commande, message,
                                 extraire=lambda m, ta, co, zo: extraire_champs(m, ta, co, zo, token_log=token_log))
            reponse, suggestions, historique_commande = r["texte"], r["suggestions"], r["brouillon"]
        else:
            # « Je veux commander… » sans le bouton : on montre les modèles, la commande part du bouton.
            candidats = recherche_semantique(message_masque, top_k=3)
            produits = construire_cartes(candidats) if candidats else []
            reponse = ("Pour commander, cliquez sur « Commander » sous le modèle de votre choix 👇" if produits
                       else "Dites-moi quel modèle vous intéresse, je vous le montre ✨")

    # ── FAQ ───────────────────────────────────────────────────────────
    elif intent == "faq":
        # Question courte ("et le prix ?") : on y joint la question précédente pour trouver les bons passages
        precedent = next((m["content"] for m in reversed(history_masque) if m.get("role") == "user"), "")
        requete = f"{precedent} {message_masque}" if len(message_masque.split()) < 4 else message_masque
        passages = chercher_passages(requete)
        reponse = llm5_faq(token_log, message_masque, passages, history_masque)
        for p in passages:
            lien = {"titre": p["titre"], "url": p["url"]}
            if lien not in liens and len(liens) < 2:  # 2 pages maximum, les plus pertinentes
                liens.append(lien)

    # ── Fallback ──────────────────────────────────────────────────────
    else:
        reponse = "Je rencontre un petit souci technique 😔 Réessayez dans un instant, ou écrivez-nous sur WhatsApp : 034 30 513 60 💕"

    summary = log_summary(token_log)
    logging.info(f"[ORCHESTRATOR] ── Total : {time.time() - t_total:.2f}s | Tokens : {summary['total_tokens']}")

    return {
        "response": reponse,
        "intent": intent,
        "token_summary": summary,
        "historique_commande": historique_commande,
        "produits": produits,
        "liens": liens,
        "suggestions": suggestions,
    }