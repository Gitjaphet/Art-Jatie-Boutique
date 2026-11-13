"""
ai/vendeuse_ia/vente.py — branche la nouvelle vendeuse dans le chat, derrière l'interrupteur VENDEUSE_IA.

Pour les messages produits (intent « guide:… ») :
  vendeuse (Groq + outils) -> sens -> styliste (côtier si la cliente écrit en malgache, sous garde-fou).
Interrupteur éteint (par défaut), ou vendeuse indisponible : None, et l'ancienne Jatie répond comme avant.
"""
import logging
import os

from ai.recherche.filtres import charger_produits
from ai.vendeuse_ia.styliste import mettre_en_style
from ai.vendeuse_ia.vendeuse import repondre


def active() -> bool:
    """VENDEUSE_IA=on dans l'environnement du backend ; éteint par défaut."""
    return os.getenv("VENDEUSE_IA", "off").strip().lower() in ("on", "1", "true", "oui")


def vendre(message: str, history: list | None, fiche: dict | None, langue: str,
           token_log: list | None = None) -> dict | None:
    """{"texte", "produits" (fiches), "suggestions"} ou {"commander": id} ; None = l'ancienne Jatie répond."""
    if not active():
        return None
    catalogue = charger_produits()
    r = repondre(message, history, fiche, catalogue, token_log=token_log)
    if not r:
        return None
    if "commander" in r:
        return {"commander": r["commander"]}
    par_id = {p["id"]: p for p in catalogue}
    produits = [par_id[i] for i in r["produits"] if i in par_id]
    logging.info(f"[VENTE] nouvelle vendeuse | langue {langue} | {len(produits)} carte(s)")
    return {"texte": mettre_en_style(r["texte"], message, langue, token_log=token_log),
            "produits": produits, "suggestions": r["suggestions"]}
