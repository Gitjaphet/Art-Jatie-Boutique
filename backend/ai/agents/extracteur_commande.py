# ai/agents/extracteur_commande.py
"""
Brique 2b — le modèle (rôle « commande ») EXTRAIT les informations d'une phrase libre.
Il ne décide de rien : le parcours (ai/commande/parcours.py) vérifie chaque valeur
avec les règles du site. Les choix possibles sont donnés en listes fermées (enum).
"""
import json
import logging

from ai.core.llm import ModeleIndisponible, appeler_llm

_CONSIGNE = ("Tu extrais des informations de commande d'un message de cliente. "
             "Recopie uniquement ce qui est écrit dans le message ; n'invente jamais une valeur absente.")


def extraire_champs(message: str, tailles: list, couleurs: list, zones: dict, token_log: list = None) -> dict:
    """{champ: valeur} pour les informations trouvées, {} si rien ou en cas de panne."""
    proprietes = {
        "client_name": {"type": "string", "description": "Nom ou prénom de la personne qui commande ; "
                        "si elle se corrige (« pas X mais Y », « tsy X fa Y »), le NOUVEAU nom (Y)"},
        "client_whatsapp": {"type": "string", "description": "Numéro de téléphone WhatsApp, tel qu'écrit"},
        "zone": {"type": "string", "enum": list(zones),
                 "description": "Zone de livraison : " + " ; ".join(f"{k} = {v}" for k, v in zones.items())},
    }
    if tailles:
        proprietes["taille"] = {"type": "string", "enum": list(tailles)}
    if couleurs:
        proprietes["couleur"] = {"type": "string", "enum": list(couleurs)}
    outil = [{"type": "function", "function": {
        "name": "remplir_commande",
        "description": "Remplit les informations présentes dans le message. Omets tout champ absent.",
        "parameters": {"type": "object", "properties": proprietes},
    }}]
    try:
        res = appeler_llm(
            "commande",
            [{"role": "system", "content": _CONSIGNE}, {"role": "user", "content": message}],
            max_tokens=200, token_log=token_log if token_log is not None else [], temperature=0,
            tools=outil, tool_choice="required",
        )
        args = json.loads(res["tool_calls"][0]["function"]["arguments"] or "{}")
    except (ModeleIndisponible, KeyError, IndexError, TypeError, ValueError):
        logging.warning("[COMMANDE] extraction impossible", exc_info=True)
        return {}
    if not isinstance(args, dict):
        return {}
    return {k: v.strip() for k, v in args.items() if k in proprietes and isinstance(v, str) and v.strip()}
