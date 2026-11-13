# ai/core/orchestrator.py
from services.contact import WHATSAPP
import json
import logging
import time

from ai.core.token_logger import log_summary
from ai.core.llm import masquer_donnees_perso
from ai.agents.comprendre import comprendre
from ai.data.cartes import construire_cartes
from ai.recherche.conversation import lecture_comprise, tour_guide
from ai.recherche.lexique import langue, mots_message
from ai.recherche.textes import dire
from ai.vendeuse_ia.vente import vendre
from ai.agents.extracteur_commande import extraire_champs
from ai.commande.parcours import demarrer, repondre
from ai.agents.faq import llm5_faq
from ai.knowledge.recherche import chercher_passages
from ai.data.products import recherche_semantique
from ai.data.stats import get_stats
from ai.data.stats_texte import formater_stats
from sqlmodel import Session
from database import engine


def _langue_cliente(message: str, fiche: dict | None) -> str:
    """Malgache si la conversation l'est déjà, ou si ce message contient un mot malgache."""
    if (fiche or {}).get("langue") == "mg":
        return "mg"
    return langue(mots_message(message))


def run_multi_agent(
    message: str,
    history: list = None,
    historique_commande: dict = None,
    commander: int = None,
    fiche: dict = None,
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
    guide = None
    if not commande_en_cours:
        # Lecteur + fiche + vendeuse : la plupart des messages sont traités ici, sans appel au modèle
        guide = tour_guide(message, fiche)
        if guide:
            fiche = guide["fiche"]
            if guide.get("commander"):  # « oui » à « Je vous la réserve ? » : la commande démarre
                commander, commande_en_cours = guide["commander"], True
    if commande_en_cours:
        intent = "commande"
    elif guide and guide.get("action"):
        intent = f"guide:{guide['action']}"
    else:
        # Message incompris par le code : UN appel à réponses fermées (remplace classifieur + routeur)
        compris = comprendre(token_log, message_masque, history=history_masque)
        intent = compris["intention"] if compris else "indisponible"
        historique_commande = None  # ancien format de brouillon (sans étape) : ignoré
        if intent in ("recherche", "salutation"):  # critères du modèle -> fiche -> vendeuse
            guide = tour_guide(message, fiche, lecture=lecture_comprise(compris, message), forcer=intent)
            if guide:
                fiche = guide["fiche"]
                intent = f"guide:{guide['action']}"
            else:
                intent = "indisponible"
    logging.info(f"[ORCHESTRATOR] Intent : {intent}")

    # Nouvelle vendeuse (interrupteur VENDEUSE_IA) pour les messages produits ; None = l'ancienne Jatie répond.
    vente = (vendre(message_masque, history_masque, fiche, _langue_cliente(message, fiche), token_log)
             if intent.startswith("guide:") else None)
    if vente and vente.get("commander"):  # la cliente veut commander : le parcours guidé démarre
        commander, commande_en_cours, intent = vente["commander"], True, "commande"
    elif vente and vente["produits"]:  # « la rouge », « celle-là » resteront compris au message suivant
        fiche["montres"] = [p["id"] for p in vente["produits"]]

    reponse = ""
    produits = []
    liens = []
    suggestions = []
    commande_resume = None

    # ── Salutation ────────────────────────────────────────────────────
    if intent.startswith("guide:"):
        source = vente or guide  # la nouvelle vendeuse si elle a répondu, sinon l'ancienne Jatie
        reponse, suggestions = source["texte"], source["suggestions"]
        produits = construire_cartes(source["produits"])

    elif intent == "salutation":
        reponse = "Bonjour ! 💕 Je suis Jatie, votre assistante Art-Jatie ✨ Comment puis-je vous aider aujourd'hui ?"

    # ── Statistiques : opération choisie par « comprendre », phrase écrite par le code ──
    elif intent == "stats":
        args = {"operation": compris.get("operation") or "count", "filtre_categorie": compris.get("categorie") or ""}
        reponse = formater_stats(args, get_stats(operation=args["operation"], filtre_categorie=args["filtre_categorie"]))

    # ── Hors sujet : on le dit gentiment et on relance (pas de « souci technique ») ──
    elif intent == "autre":
        reponse = dire("incompris", _langue_cliente(message, fiche))
        suggestions = ["Robes", "Maillots", "Sacs", "Sur mesure"]

    # ── Commande : parcours guidé par le code (ai/commande/parcours.py) ───
    elif intent == "commande":
        if commande_en_cours:
            # Message NON masqué : nom et numéro sont justement ce qu'on collecte
            # (chaîne « commande » : Groq puis OpenRouter, sans entraînement sur les données).
            with Session(engine) as session:
                if commander:
                    r = demarrer(session, int(commander), langue=_langue_cliente(message, fiche))
                else:
                    r = repondre(session, historique_commande, message,
                                 extraire=lambda m, ta, co, zo: extraire_champs(m, ta, co, zo, token_log=token_log))
            reponse, suggestions, historique_commande = r["texte"], r["suggestions"], r["brouillon"]
            commande_resume = r.get("resume")
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
        reponse = f"Je rencontre un petit souci technique 😔 Réessayez dans un instant, ou écrivez-nous sur WhatsApp : {WHATSAPP} 💕"

    summary = log_summary(token_log)
    logging.info(f"[ORCHESTRATOR] ── Total : {time.time() - t_total:.2f}s | Tokens : {summary['total_tokens']}")

    return {
        "response": reponse,
        "intent": intent,
        "token_summary": summary,
        "historique_commande": historique_commande,
        "fiche": fiche,
        "produits": produits,
        "liens": liens,
        "suggestions": suggestions,
        "commande_resume": commande_resume,
    }