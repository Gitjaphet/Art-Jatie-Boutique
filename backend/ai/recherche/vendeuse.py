"""Vendeuse : action + fiche + vrais produits -> réponse de commerciale, sans appel au modèle.

Règle d'or : vendre sans mentir. Chaque phrase repose sur une donnée réelle (stock, prix, délai, tarif) :
la rareté n'est annoncée que si le stock vaut 1, aucune remise n'est inventée, et une livraison
« sur devis » n'est jamais présentée comme gratuite.
"""
from dataclasses import dataclass, field

from ai.recherche.filtres import filtrer
from services.catalogue import TYPES_FEMININS
from services.commandes import (
    DELAI_FABRICATION, DELAI_TRAITEMENT, FRAIS_LIVRAISON, LIBELLES_ZONE, TAUX_ACOMPTE_SUR_MESURE,
)

MAX_CARTES = 5
DELAI_LIVRAISON_NOSY_BE = "dans la demi-journée"
ZONES_NOSY_BE = {"nosybe_ville", "darsalam", "dzamanjar", "nosybe_autre"}
ZONE_OFFERTE = "nosybe_ville"
BOUTONS_ZONES = ["Hell-Ville", "Ambatoloaka", "Dzamanjar"]  # compris par le lecteur
FEMININS = TYPES_FEMININS

_INTROS = ("Voici {d} 😊", "J'ai sélectionné pour vous {d} ✨", "Regardez {d} 👇")


@dataclass
class Reponse:
    texte: str
    produits: list[dict] = field(default_factory=list)   # cartes à afficher (dans l'ordre)
    suggestions: list[str] = field(default_factory=list)  # boutons, tous compris par le lecteur
    question: dict | None = None                          # dernière question posée (enregistrée dans la fiche)
    fiche_maj: dict = field(default_factory=dict)         # notes à garder dans la fiche (ex. zone demandée)


def ar(montant: int) -> str:
    return f"{montant:,}".replace(",", " ") + " Ar"


def _plafond(budget: int) -> str:
    """59 999 (sous un prix refusé) -> « à moins de 60 000 Ar » ; 30 000 -> « à 30 000 Ar maximum »."""
    return f"à moins de {ar(budget + 1)}" if budget % 1000 == 999 else f"à {ar(budget)} maximum"


def _bouton_autres(budget: int) -> str:
    return f"Autres articles à moins de {ar(budget + 1)}" if budget % 1000 == 999 else f"Autres articles jusqu'à {ar(budget)}"


def _pronom(p: dict) -> str:
    return "la" if p.get("type_article") in FEMININS else "le"


def _pluriel(type_article: str) -> str:
    return "chapeaux" if type_article == "Chapeau" else type_article.lower() + "s"


def _demande(fiche: dict, nos: bool = True) -> str:
    types = " ou ".join(_pluriel(t) for t in fiche.get("types") or []) or "modèles"
    texte = f"nos {types}" if nos else types
    if fiche.get("couleurs"):
        texte += " en " + " ou ".join(c.lower() for c in fiche["couleurs"])
    if fiche.get("tailles"):
        texte += " en taille " + " ou ".join(fiche["tailles"])
    if fiche.get("budget_max"):
        texte += f" {_plafond(fiche['budget_max'])}"
    return texte


def _un(fiche: dict, p: dict | None = None) -> str:
    """« une » pour une robe, « un » pour un sac : d'après le modèle, sinon le type demandé."""
    type_article = (p or {}).get("type_article") or next(iter(fiche.get("types") or []), "")
    return "une" if type_article in FEMININS else "un"


def _en_couleur(fiche: dict) -> str:
    return " en " + " ou ".join(c.lower() for c in fiche["couleurs"]) if fiche.get("couleurs") else ""


def _disponibilite(p: dict) -> str:
    stock = p.get("stock") or 0
    if stock == 1:
        return "en stock — c'est la dernière pièce"
    if stock > 1:
        return "en stock"
    return (f"pas disponible en stock actuellement, mais nous pouvons {_pronom(p)} réaliser "
            f"pour vous en {DELAI_FABRICATION}")


def _conclure(p: dict) -> str:
    """On réserve une pièce en stock ; on lance la réalisation d'une pièce à fabriquer."""
    return f"Je vous {_pronom(p)} réserve ?" if (p.get("stock") or 0) > 0 else "On lance sa réalisation pour vous ?"


def _frais(zone: str) -> int | None:
    """Frais réels de la zone ; None quand le tarif est à convenir (jamais « gratuit » par erreur)."""
    frais = FRAIS_LIVRAISON.get(zone)
    if frais:
        return frais
    return 0 if zone == ZONE_OFFERTE else None


def _phrase_livraison(zone: str, p: dict | None = None) -> str:
    """Tarif réel de la zone + délai : celui d'une pièce en stock, ou celui du modèle cité s'il est à fabriquer."""
    frais = _frais(zone)
    tarif = "offerte" if frais == 0 else ar(frais) if frais else "sur devis (l'équipe vous confirme le tarif)"
    a_fabriquer = bool(p) and not (p.get("stock") or 0)
    e = "" if a_fabriquer and p.get("type_article") not in FEMININS else "e"  # « la robe … livrée », « le sac … livré »
    arrivee = (f"puis livré{e} {DELAI_LIVRAISON_NOSY_BE}" if zone in ZONES_NOSY_BE
               else f"puis acheminé{e} (délai confirmé par l'équipe)")
    if a_fabriquer:
        quand = f"« {p['nom']} » est réalisé{e} pour vous en {DELAI_FABRICATION}, {arrivee}"
    else:
        quand = f"Une pièce en stock est préparée sous {DELAI_TRAITEMENT}, {arrivee}"
    return f"Livraison {LIBELLES_ZONE.get(zone, zone)} : {tarif}. {quand}."


def _total(p: dict, zone: str | None) -> str:
    if not zone or (frais := _frais(zone)) is None:
        return ""
    return f" Livraison comprise : {ar(p['prix_ar'] + frais)} au total."


def _tout_de_suite(p: dict, autres: list[dict]) -> str:
    """Coup de cœur à fabriquer : on signale une autre pièce montrée, disponible tout de suite."""
    if (p.get("stock") or 0) > 0:
        return ""
    a = next((x for x in autres if x["id"] != p["id"] and (x.get("stock") or 0) > 0), None)
    if not a:
        return ""
    return f" Pour l'avoir tout de suite : « {a['nom']} » à {ar(a['prix_ar'])} est {_disponibilite(a)}."


def _proposer(p: dict, fiche: dict, intro: str, autres: list[dict], nuance: str = "") -> Reponse:
    pr = _pronom(p)
    texte = (f"{intro}\n\nMon coup de cœur : « {p['nom']} »{nuance} à {ar(p['prix_ar'])}, {_disponibilite(p)}."
             f"{_total(p, fiche.get('zone'))}{_tout_de_suite(p, autres)} {_conclure(p)}")
    suggestions = [f"Oui, je {pr} veux"]
    if any((a.get("prix_ar") or 0) < p["prix_ar"] for a in autres):
        suggestions.append(f"Moins de {ar(p['prix_ar'])}")
    if not fiche.get("zone") and not fiche.get("zone_demandee"):
        # Une seule fois par conversation : le prix livré lève une hésitation fréquente avant l'achat
        # Une seule question, avec un choix : la zone (prix livré) ou la réservation directe
        conclusion = _conclure(p)
        texte = (texte.removesuffix(f" {conclusion}")
                 + f" Dites-moi où vous livrer pour connaître le prix livré, ou {conclusion[0].lower()}{conclusion[1:]}")
        return Reponse(texte, [], suggestions + BOUTONS_ZONES, {"type": "commander", "produit_id": p["id"]},
                       fiche_maj={"zone_demandee": True})
    suggestions.append("Sur mesure")
    return Reponse(texte, [], suggestions, {"type": "commander", "produit_id": p["id"]})


def _recherche(fiche: dict, produits: list[dict], intro: str | None = None) -> Reponse:
    r = filtrer(produits, fiche)
    d = _demande(fiche)
    tour = fiche.get("tour") or 0
    if r.exacts:
        rep = _proposer(r.exacts[0], fiche, intro or _INTROS[tour % len(_INTROS)].format(d=d), r.exacts + r.proches)
        rep.produits = r.exacts[:MAX_CARTES]
        return rep
    if r.proches:
        # Rien d'exact : on le dit, on propose le sur mesure dans la couleur voulue ET un coup de cœur parmi les plus proches
        p = r.proches[0]
        couleurs_p = " et ".join(c.lower() for c in (p.get("familles") or [])[:2])
        intro = (f"Je n'ai pas de {_demande(fiche, nos=False)} pour le moment. Je peux vous en faire {_un(fiche, p)} "
                 f"sur mesure{_en_couleur(fiche)} (en {DELAI_FABRICATION}), ou voici les modèles les plus proches 👇")
        rep = _proposer(p, fiche, intro, r.proches, nuance=f" ({couleurs_p})" if couleurs_p else "")
        rep.produits = r.proches[:MAX_CARTES]
        return rep
    # Rien dans les critères : le plus accessible du même type, budget ignoré, avec son vrai prix
    sans_budget = filtrer(produits, {**fiche, "budget_max": None, "exclus": []})
    accessibles = sorted(sans_budget.exacts + sans_budget.proches, key=lambda x: x.get("prix_ar") or 0)
    if fiche.get("budget_max") and accessibles:
        p = accessibles[0]
        texte = (f"Je n'ai pas de {_demande(fiche, nos=False)} en ce moment. Le modèle le plus accessible est « {p['nom']} » "
                 f"à {ar(p['prix_ar'])}, {_disponibilite(p)}. Et tous nos modèles peuvent être faits sur mesure, "
                 f"avec un acompte de {int(TAUX_ACOMPTE_SUR_MESURE * 100)} % à la commande. "
                 f"{_conclure(p)}")
        suggestions = [f"Oui, je {_pronom(p)} veux"]
        if fiche.get("types") or fiche.get("couleurs") or fiche.get("tailles"):  # toute la boutique, même budget
            suggestions.append(_bouton_autres(fiche["budget_max"]))
        return Reponse(texte, [p], suggestions + ["Sur mesure"],
                       {"type": "commander", "produit_id": p["id"]})
    texte = (f"Je n'ai pas de {_demande(fiche, nos=False)} en ce moment 😔 Bonne nouvelle : "
             f"nous pouvons vous en créer {_un(fiche)} sur mesure{_en_couleur(fiche)}, "
             f"en {DELAI_FABRICATION}. Je vous montre nos modèles pour vous inspirer ?")
    return Reponse(texte, [], ["Voir toute la boutique", "Sur mesure"], {"type": "montrer", "produit_id": None})


def repondre(action: str, fiche: dict, produits: list[dict], produit_id: int | None = None) -> Reponse:
    """Réponse pour une action décidée par la fiche (sauf « oui » à une commande : le parcours de commande s'en charge)."""
    par_id = {p["id"]: p for p in produits}
    cite = par_id.get(produit_id)

    if action in ("recherche", "oui"):
        return _recherche(fiche, produits)

    if action == "objection":
        rep = _recherche(fiche, produits, intro=f"Je comprends tout à fait 😊 Voici {_demande(fiche)} :")
        if not rep.texte.startswith("Je comprends"):  # une objection commence toujours par de l'écoute
            rep.texte = "Je comprends tout à fait 😊 " + rep.texte
        return rep

    if action == "remise":
        texte = ("Je ne peux pas modifier nos prix 😊 Chaque pièce est crochetée à la main et son prix est fixé par l'atelier. "
                 "Dites-moi votre budget, et je vous trouve la plus belle pièce qui y rentre !")
        return Reponse(texte, [], ["Moins cher", "Voir toute la boutique"])

    if action == "livraison":
        zone = fiche.get("zone")
        if not zone:
            texte = (f"Nous livrons partout ! Hell-Ville : offerte · Darsalam, Ambatoloaka, Madirokely : "
                     f"{ar(FRAIS_LIVRAISON['darsalam'])} · Dzamanjar : {ar(FRAIS_LIVRAISON['dzamanjar'])} · "
                     f"ailleurs : sur devis. Où souhaitez-vous être livrée ?")
            return Reponse(texte, [], ["Hell-Ville", "Ambatoloaka", "Dzamanjar"])
        texte = _phrase_livraison(zone, cite)
        if cite:
            texte += f"{_total(cite, zone)} {_conclure(cite)}"
            return Reponse(texte, [cite], [f"Oui, je {_pronom(cite)} veux", "Voir toute la boutique"],
                           {"type": "commander", "produit_id": cite["id"]})
        return Reponse(texte + " Que puis-je vous montrer ?", [], ["Robes", "Maillots", "Sacs"])

    if action == "non":
        return Reponse("Pas de souci 😊 Je peux vous montrer d'autres modèles, ou vous en créer un sur mesure.",
                       [], ["Voir toute la boutique", "Sur mesure"])

    if action == "salutation":
        bonjour = "Salama ! 😊" if fiche.get("langue") == "mg" else "Bonjour ! 😊"
        types = [t for t in ("Robe", "Maillot", "Ensemble", "Sac") if any(p.get("type_article") == t for p in produits)]
        return Reponse(f"{bonjour} Je suis Jatie, la conseillère d'Art Jatie. Que cherchez-vous aujourd'hui ?",
                       [], [_pluriel(t).capitalize() for t in types] + ["Sur mesure"])

    return _recherche(fiche, produits)
