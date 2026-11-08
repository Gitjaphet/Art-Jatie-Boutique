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
from ai.recherche.textes import couleurs_mg, dire, en_malgache

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


def _disponibilite(p: dict, langue: str = "fr") -> str:
    stock = p.get("stock") or 0
    if stock == 1:
        return dire("derniere_piece", langue)
    if stock > 0:
        return dire("en_stock", langue)
    delai = en_malgache(DELAI_FABRICATION) if langue == "mg" else DELAI_FABRICATION
    return dire("a_fabriquer", langue, pr=_pronom(p), delai=delai)


def _conclure(p: dict, langue: str = "fr") -> str:
    """On réserve une pièce en stock ; on lance la réalisation d'une pièce à fabriquer."""
    return dire("reserver", langue, pr=_pronom(p)) if (p.get("stock") or 0) > 0 else dire("realiser", langue)


def _frais(zone: str) -> int | None:
    """Frais réels de la zone ; None quand le tarif est à convenir (jamais « gratuit » par erreur)."""
    frais = FRAIS_LIVRAISON.get(zone)
    if frais:
        return frais
    return 0 if zone == ZONE_OFFERTE else None


def _phrase_livraison(zone: str, p: dict | None = None, langue: str = "fr") -> str:
    """Tarif réel de la zone + délai : celui d'une pièce en stock, ou celui du modèle cité s'il est à fabriquer."""
    frais = _frais(zone)
    tarif = dire("tarif_offert", langue) if frais == 0 else ar(frais) if frais else dire("tarif_devis", langue)
    a_fabriquer = bool(p) and not (p.get("stock") or 0)
    e = "" if a_fabriquer and p.get("type_article") not in FEMININS else "e"  # « la robe … livrée », « le sac … livré »
    mg = langue == "mg"
    arrivee = dire("arrivee_nosy_be" if zone in ZONES_NOSY_BE else "arrivee_ailleurs", langue,
                   e=e, delai=DELAI_LIVRAISON_NOSY_BE)
    if a_fabriquer:
        quand = dire("livraison_fabrication", langue, nom=p["nom"], e=e, arrivee=arrivee,
                     delai=en_malgache(DELAI_FABRICATION) if mg else DELAI_FABRICATION)
    else:
        quand = dire("livraison_stock", langue, arrivee=arrivee,
                     delai=en_malgache(DELAI_TRAITEMENT) if mg else DELAI_TRAITEMENT)
    return f"Livraison {LIBELLES_ZONE.get(zone, zone)} : {tarif}. {quand}."


def _total(p: dict, zone: str | None, langue: str = "fr") -> str:
    if not zone or (frais := _frais(zone)) is None:
        return ""
    return dire("total", langue, total=ar(p["prix_ar"] + frais))


def _tout_de_suite(p: dict, autres: list[dict], langue: str = "fr") -> str:
    """Coup de cœur à fabriquer : on signale une autre pièce montrée, disponible tout de suite."""
    if (p.get("stock") or 0) > 0:
        return ""
    a = next((x for x in autres if x["id"] != p["id"] and (x.get("stock") or 0) > 0), None)
    if not a:
        return ""
    return dire("tout_de_suite", langue, nom=a["nom"], prix=ar(a["prix_ar"]), dispo=_disponibilite(a, langue))


def _choisir(candidats: list[dict], fiche: dict) -> tuple[dict, bool]:
    """Le coup de cœur du tour : le premier modèle pas encore mis en avant (une vendeuse ne répète pas la même pièce).

    Rend (modèle, relance) ; relance = un autre modèle de cette sélection a déjà été proposé.
    Tous déjà vus : on repart du premier."""
    deja = fiche.get("coups_de_coeur") or []
    neufs = [c for c in candidats if c["id"] not in deja]
    if not neufs:
        return candidats[0], False
    return neufs[0], any(c["id"] in deja for c in candidats)


def _cartes(p: dict, liste: list[dict]) -> list[dict]:
    """Le coup de cœur toujours en première carte, puis les autres dans l'ordre."""
    return [p] + [x for x in liste if x["id"] != p["id"]][:MAX_CARTES - 1]


def _proposer(p: dict, fiche: dict, intro: str, autres: list[dict], nuance: str = "",
              relance: bool = False) -> Reponse:
    pr, langue = _pronom(p), fiche.get("langue") or "fr"
    cle = "autre_coup_de_coeur" if relance else "coup_de_coeur"
    deja = fiche.get("coups_de_coeur") or []
    vus = {"coups_de_coeur": deja + [p["id"]] if p["id"] not in deja else [p["id"]]}  # tous vus : on recommence
    ligne = dire(cle, langue, nom=p["nom"], nuance=nuance, prix=ar(p["prix_ar"]), dispo=_disponibilite(p, langue))
    texte = (f"{intro}\n\n{ligne}"
             f"{_total(p, fiche.get('zone'), langue)}{_tout_de_suite(p, autres, langue)} {_conclure(p, langue)}")
    suggestions = [dire("bouton_oui", langue, pr=pr)]
    if any((a.get("prix_ar") or 0) < p["prix_ar"] for a in autres):
        suggestions.append(f"Moins de {ar(p['prix_ar'])}")
    if not fiche.get("zone") and not fiche.get("zone_demandee"):
        # Une seule fois par conversation : le prix livré lève une hésitation fréquente avant l'achat
        # Une seule question, avec un choix : la zone (prix livré) ou la réservation directe
        conclusion = _conclure(p, langue)
        cle = "zone_ou_reserver" if (p.get("stock") or 0) > 0 else "zone_ou_realiser"
        texte = texte.removesuffix(f" {conclusion}") + " " + dire(cle, langue, pr=pr)
        return Reponse(texte, [], suggestions + BOUTONS_ZONES, {"type": "commander", "produit_id": p["id"]},
                       fiche_maj={"zone_demandee": True, **vus})
    suggestions.append("Sur mesure")
    return Reponse(texte, [], suggestions, {"type": "commander", "produit_id": p["id"]}, fiche_maj=vus)


def _demande_mg(fiche: dict) -> str:
    """La demande en malgache : « sac mena latsaky ny 20 000 Ar »."""
    texte = " sy ".join(t.lower() for t in fiche.get("types") or []) or "modèle"
    if fiche.get("couleurs"):
        texte += " " + " na ".join(couleurs_mg(fiche["couleurs"]))
    if fiche.get("tailles"):
        texte += " taille " + " na ".join(fiche["tailles"])
    if (b := fiche.get("budget_max")):
        texte += f" latsaky ny {ar(b + 1)}" if b % 1000 == 999 else f" hatramin'ny {ar(b)}"
    return texte


def _intro(fiche: dict, d: str, tour: int) -> str:
    """Phrase d'ouverture d'une sélection ; en malgache, le type seul (couleurs et tailles : lot suivant)."""
    if (fiche.get("langue") or "fr") == "mg":
        return dire("selection", "mg", d=" sy ".join(t.lower() for t in fiche.get("types") or []) or "modèle")
    return _INTROS[tour % len(_INTROS)].format(d=d)


def _recherche(fiche: dict, produits: list[dict], intro: str | None = None) -> Reponse:
    r = filtrer(produits, fiche)
    d = _demande(fiche)
    tour = fiche.get("tour") or 0
    if r.exacts:
        p, relance = _choisir(r.exacts, fiche)
        rep = _proposer(p, fiche, intro or _intro(fiche, d, tour), r.exacts + r.proches,
                        relance=relance)
        rep.produits = _cartes(p, r.exacts)
        return rep
    if r.proches:
        # Rien d'exact : on le dit, on propose le sur mesure dans la couleur voulue ET un coup de cœur parmi les plus proches
        p, relance = _choisir(r.proches, fiche)
        familles_p = (p.get("familles") or [])[:2]
        if fiche.get("langue") == "mg":
            couleurs_p = " sy ".join(couleurs_mg(familles_p))
            couleur = " " + " na ".join(couleurs_mg(fiche["couleurs"])) if fiche.get("couleurs") else ""
            d_mg = " sy ".join(t.lower() for t in fiche.get("types") or []) or "modèle"
            intro = dire("rien_d_exact", "mg", d=d_mg + couleur, couleur=couleur, delai=en_malgache(DELAI_FABRICATION))
        else:
            couleurs_p = " et ".join(c.lower() for c in familles_p)
            intro = dire("rien_d_exact", "fr", d=_demande(fiche, nos=False), un=_un(fiche, p),
                         couleur=_en_couleur(fiche), delai=DELAI_FABRICATION)
        rep = _proposer(p, fiche, intro, r.proches, nuance=f" ({couleurs_p})" if couleurs_p else "",
                        relance=relance)
        rep.produits = _cartes(p, r.proches)
        return rep
    # Rien dans les critères : le plus accessible du même type, budget ignoré, avec son vrai prix
    sans_budget = filtrer(produits, {**fiche, "budget_max": None, "exclus": []})
    accessibles = sorted(sans_budget.exacts + sans_budget.proches, key=lambda x: x.get("prix_ar") or 0)
    if fiche.get("budget_max") and accessibles:
        p = accessibles[0]
        langue = fiche.get("langue") or "fr"
        d = _demande_mg(fiche) if langue == "mg" else _demande(fiche, nos=False)
        texte = dire("plus_accessible", langue, d=d, nom=p["nom"], prix=ar(p["prix_ar"]),
                     dispo=_disponibilite(p, langue), taux=int(TAUX_ACOMPTE_SUR_MESURE * 100),
                     conclusion=_conclure(p, langue))
        suggestions = [dire("bouton_oui", langue, pr=_pronom(p))]
        if fiche.get("types") or fiche.get("couleurs") or fiche.get("tailles"):  # toute la boutique, même budget
            suggestions.append(_bouton_autres(fiche["budget_max"]))
        return Reponse(texte, [p], suggestions + ["Sur mesure"],
                       {"type": "commander", "produit_id": p["id"]})
    langue = fiche.get("langue") or "fr"
    if langue == "mg":
        texte = dire("rien_du_tout", "mg", d=_demande_mg(fiche), delai=en_malgache(DELAI_FABRICATION))
    else:
        texte = dire("rien_du_tout", "fr", d=_demande(fiche, nos=False), un=_un(fiche), couleur=_en_couleur(fiche),
                     delai=DELAI_FABRICATION)
    return Reponse(texte, [], [dire("bouton_tout_voir", langue), "Sur mesure"], {"type": "montrer", "produit_id": None})


def politesse(fiche: dict) -> str:
    """La formule d'accueil, une seule source : la langue de la cliente, et « Bonsoir » si elle l'a dit."""
    if fiche.get("langue") == "mg":
        return "Salama ! 😊"
    return "Bonsoir ! 😊" if fiche.get("salut") == "bonsoir" else "Bonjour ! 😊"


def repondre(action: str, fiche: dict, produits: list[dict], produit_id: int | None = None) -> Reponse:
    """Réponse pour une action décidée par la fiche (sauf « oui » à une commande : le parcours de commande s'en charge)."""
    par_id = {p["id"]: p for p in produits}
    cite = par_id.get(produit_id)

    if action in ("recherche", "oui"):
        return _recherche(fiche, produits)

    if action == "objection":
        langue = fiche.get("langue") or "fr"
        ecoute = dire("comprends", langue)
        suite = _intro(fiche, _demande(fiche), fiche.get("tour") or 0) if langue == "mg" else f"Voici {_demande(fiche)} :"
        rep = _recherche(fiche, produits, intro=f"{ecoute} {suite}")
        if not rep.texte.startswith(ecoute):  # une objection commence toujours par de l'écoute
            rep.texte = f"{ecoute} {rep.texte}"
        return rep

    if action == "remise":
        langue = fiche.get("langue") or "fr"
        return Reponse(dire("remise", langue), [], ["Moins cher", dire("bouton_tout_voir", langue)])

    if action == "livraison":
        langue = fiche.get("langue") or "fr"
        zone = fiche.get("zone")
        if not zone:
            texte = dire("zones", langue, darsalam=ar(FRAIS_LIVRAISON["darsalam"]),
                         dzamanjar=ar(FRAIS_LIVRAISON["dzamanjar"]))
            return Reponse(texte, [], ["Hell-Ville", "Ambatoloaka", "Dzamanjar"])
        texte = _phrase_livraison(zone, cite, langue)
        if cite:
            texte += f"{_total(cite, zone, langue)} {_conclure(cite, langue)}"
            return Reponse(texte, [cite], [dire("bouton_oui", langue, pr=_pronom(cite)), dire("bouton_tout_voir", langue)],
                           {"type": "commander", "produit_id": cite["id"]})
        return Reponse(texte + dire("montrer_quoi", langue), [], ["Robes", "Maillots", "Sacs"])

    if action == "non":
        langue = fiche.get("langue") or "fr"
        return Reponse(dire("pas_de_souci", langue), [], [dire("bouton_tout_voir", langue), "Sur mesure"])

    if action == "salutation":
        bonjour = politesse(fiche)
        types = [t for t in ("Robe", "Maillot", "Ensemble", "Sac") if any(p.get("type_article") == t for p in produits)]
        return Reponse(f"{bonjour} {dire('accueil', fiche.get('langue') or 'fr')}",
                       [], [_pluriel(t).capitalize() for t in types] + ["Sur mesure"])

    return _recherche(fiche, produits)
