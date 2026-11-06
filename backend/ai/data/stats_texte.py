# ai/data/stats_texte.py
"""Transforme le résultat de get_stats() en phrase pour la cliente, sans LLM : zéro invention, zéro token."""

_INVITATION = "Souhaitez-vous que je vous montre quelques modèles ? 😊"
from services.contact import WHATSAPP

_SECOURS = f"Je n'arrive pas à obtenir cette information pour le moment 😔 Écrivez-nous sur WhatsApp : {WHATSAPP} 💕"


def _nombre(n) -> str:
    return f"{int(n):,}".replace(",", " ")


def _pluriel(n, mot: str) -> str:
    return f"{_nombre(n)} {mot}{'s' if n > 1 else ''}"


def _prix(montant: dict) -> str:
    return f"{_nombre(montant['ar'])} Ar (soit ~{montant['eur']} €)"


def formater_stats(args: dict, donnees: dict) -> str:
    if not isinstance(donnees, dict) or "erreur" in donnees:
        return _SECOURS

    operation = args.get("operation", "count")
    r = donnees.get("resultat")
    categorie = (args.get("filtre_categorie") or "").strip().lower()
    genre = (args.get("filtre_genre") or "").strip().lower()
    portee = (f" dans la catégorie {categorie}" if categorie else "") + (f" pour {genre}" if genre else "")

    if not r:
        return f"Nous n'avons pas d'article{portee} pour le moment, mais nous pouvons vous en créer un sur mesure ! 💕"

    if operation == "count":
        return f"Nous avons {_pluriel(r, 'article')}{portee}. {_INVITATION}"
    if operation == "stock_total":
        return f"Nous avons {_pluriel(r, 'pièce')} en stock{portee}. {_INVITATION}"
    if operation == "prix_moyen":
        return f"Le prix moyen de nos articles{portee} est de {_prix(r)}. {_INVITATION}"
    if operation in ("min_price", "max_price"):
        quel = "le moins cher" if operation == "min_price" else "le plus cher"
        return f"Notre article {quel}{portee} est « {donnees.get('nom', '')} » à {_prix(r)}. {_INVITATION}"
    if operation == "count_by_category":
        lignes = [
            f"• {cat.capitalize()} : {v['en_stock']} en stock, {v['sur_commande']} sur commande"
            for cat, v in r.items()
        ]
        return "Voici notre catalogue :\n" + "\n".join(lignes) + f"\n{_INVITATION}"
    if operation in ("par_categorie", "par_genre"):
        lignes = [f"• {cle.capitalize()} : {_pluriel(n, 'article')}" for cle, n in r.items()]
        return "Voici la répartition de nos articles :\n" + "\n".join(lignes) + f"\n{_INVITATION}"

    return _SECOURS
