"""
ai/commande/parcours.py — commande guidée dans le chat Jatie.

Le code mène la conversation : une question par étape, des réponses rapides (boutons),
une validation par le code. Le modèle n'intervient que pour extraire un texte libre (brique 2b),
et chaque valeur extraite est revérifiée ici : elle doit figurer dans le message (anti-invention).

Deux modes :
- « stock »      : la pièce telle qu'elle est, choix du catalogue ;
- « sur_mesure » : même style, taille et couleur libres, prix de base à confirmer par l'équipe
                   (proposé pour tous les modèles ; automatique quand le stock est épuisé).

Le brouillon fait l'aller-retour avec le navigateur : tout est revalidé à la création
(services/commandes.creer_commande) — le navigateur ne décide jamais d'un prix.
"""
import re

from fastapi import HTTPException
from sqlmodel import Session

from ai.utils.texte import normaliser
from models.models import Product
from services.catalogue import TYPES_FEMININS, TYPES_SANS_TAILLE
from services.commandes import (
    DELAI_FABRICATION, DELAI_TRAITEMENT, FRAIS_LIVRAISON, LIBELLES_ZONE, TAUX_ACOMPTE_SUR_MESURE,
    Ligne, calculer, creer_commande, liste, normaliser_whatsapp,
)

ZONES_CHAT = ["nosybe_ville", "darsalam", "dzamanjar", "nosybe_autre", "tana", "hors_nosybe"]
OUI, MODIFIER, ANNULER = "Oui, je confirme", "Modifier", "Annuler"
EN_STOCK, SUR_MESURE = "La pièce en stock", "Sur mesure, même style"
MENSURATIONS = "Mes mensurations"
TAILLES_SUR_MESURE = ["XS", "S", "M", "L", "XL"]
PALETTE_SUR_MESURE = ["Beige", "Blanc", "Noir", "Rose", "Rouge", "Bleu", "Marron", "Kaki", "Multicolore"]  # filtres boutique
AVANCE = int(TAUX_ACOMPTE_SUR_MESURE * 100)

_DEBUT_OUI = {"oui", "ok", "okay", "yes", "eny", "daccord"}
_NEGATIONS = {"non", "pas", "annule", "annuler", "attends", "attendez", "no"}
_MOTS_ANNULER = {"annuler", "annule", "stop", "laisse tomber", "abandonner"}
_MOTS_ZONE_GENERIQUES = {"nosy", "zone", "devis", "frais", "sur"}

# Lieux reconnus sans modèle (texte normalisé : minuscules, sans accents) → zone de livraison.
_REGIONS = ["majunga", "mahajanga", "diego", "diego suarez", "antsiranana", "tamatave", "toamasina",
            "tulear", "toliara", "fianarantsoa", "fianar", "antsirabe", "ambanja", "ambilobe", "morondava",
            "fort dauphin", "taolagnaro", "sambava", "antalaha", "vohemar", "manakara", "mananjary",
            "maroantsetra", "ankify"]
LIEUX_ZONE = {
    "hell ville": "nosybe_ville", "hellville": "nosybe_ville", "andoany": "nosybe_ville", "jabala": "nosybe_ville",
    "darsalam": "darsalam", "dzamanjar": "dzamanjar", "dzamandzar": "dzamanjar", "djamandjary": "dzamanjar",
    "ambatoloaka": "darsalam", "madirokely": "darsalam",          # même tarif que Darsalam
    "andilana": "nosybe_autre",
    "ambondrona": "nosybe_autre", "bemoko": "nosybe_autre", "mont passot": "nosybe_autre",
    "ampasipohy": "nosybe_autre", "seganinga": "nosybe_autre", "ambonara": "nosybe_autre",
    "tana": "tana", "antananarivo": "tana",
    **{ville: "hors_nosybe" for ville in _REGIONS},
}
_CHAMPS = {"Taille": "taille", "Couleur": "couleur", "Nom": "nom", "WhatsApp": "whatsapp", "Livraison": "zone"}
_ETAPES_VALIDES = {"mode", "taille", "couleur", "nom", "whatsapp", "zone", "recap", "modifier"}
_CLE_ETAPE = {"taille": "taille", "couleur": "couleur", "nom": "client_name",
              "whatsapp": "client_whatsapp", "zone": "zone"}
_ETAPE_CHAMP = {v: k for k, v in _CLE_ETAPE.items()}


# ── Petits utilitaires ───────────────────────────────────────────────────
def _fmt(n: int) -> str:
    return f"{n:,}".replace(",", " ") + " Ar"


def _cle(texte: str) -> str:
    return normaliser(texte or "").strip()


def _mots(texte: str) -> list:
    return re.findall(r"[a-z0-9]+", _cle(texte))


def _choisir(message: str, options: list):
    """Bouton cliqué ou texte équivalent (casse, accents, espaces ignorés) → option exacte."""
    cle = _cle(message)
    return next((o for o in options if _cle(o) == cle), None)


def _est_oui(message: str) -> bool:
    """« oui », « oui je valide », « ok je confirme »… ; une négation l'emporte toujours."""
    mots = _mots(message)
    if not mots or any(m in _NEGATIONS for m in mots):
        return False
    return mots[0] in _DEBUT_OUI or "accord" in mots or any(m.startswith(("confirm", "valid")) for m in mots)


def _present(champ: str, valeur: str, message: str) -> bool:
    """Garde-fou anti-invention : une valeur extraite par le modèle doit se retrouver dans le message."""
    if champ == "client_whatsapp":
        chiffres = re.sub(r"\D", "", valeur)
        return len(chiffres) >= 8 and chiffres[-8:] in re.sub(r"\D", "", message)
    if champ == "zone":
        if _lieu(message) == valeur:
            return True
        mots_zone = {z for z in _mots(LIBELLES_ZONE.get(valeur, "")) if len(z) >= 4} - _MOTS_ZONE_GENERIQUES
        return any(m in z or z in m for m in _mots(message) if len(m) >= 4 for z in mots_zone)
    cible = " ".join(_mots(valeur))
    return bool(cible) and re.search(r"(?<![a-z0-9])" + re.escape(cible) + r"(?![a-z0-9])",
                                     " ".join(_mots(message))) is not None


def _lieu(message: str):
    """Zone d'un lieu connu cité dans le message (« je suis à Majunga » → hors_nosybe), sinon None."""
    texte = f" {' '.join(_mots(message))} "
    return next((zone for lieu, zone in LIEUX_ZONE.items() if f" {lieu} " in texte), None)


def _detail(exc: HTTPException) -> str:
    return exc.detail if isinstance(exc.detail, str) else "Valeur non valide."


def _reponse(texte: str, suggestions=None, brouillon=None, commande=None) -> dict:
    return {"texte": texte, "suggestions": suggestions or [], "brouillon": brouillon, "commande": commande}


def _libelle_zone(zone: str) -> str:
    frais = FRAIS_LIVRAISON[zone]
    suffixe = _fmt(frais) if frais else ("gratuit" if zone == "nosybe_ville" else "frais à confirmer")
    return f"{LIBELLES_ZONE[zone]} ({suffixe})"


def _en_stock(p: Product) -> bool:
    return (p.stock_quantity or 0) > 0


def _sans_taille(p: Product) -> bool:
    return p.type_article in TYPES_SANS_TAILLE  # sac, pochette… : pas de question de taille


def _e(p: Product) -> str:
    return "e" if p.type_article in TYPES_FEMININS else ""  # « réalisée » (robe) / « réalisé » (sac)


def _sur_mesure(b: dict) -> bool:
    return b.get("mode") == "sur_mesure"


def _options(p: Product, b: dict, quoi: str) -> list:
    """Choix proposés : ceux du catalogue (stock) ou ceux de l'atelier (sur mesure)."""
    if _sur_mesure(b):
        return TAILLES_SUR_MESURE if quoi == "taille" else PALETTE_SUR_MESURE
    return liste(p.sizes if quoi == "taille" else p.colors)


def _etapes(p: Product, b: dict) -> list:
    taille = [] if _sans_taille(p) else ["taille"]
    if _sur_mesure(b):
        return taille + ["couleur", "nom", "whatsapp", "zone", "recap"]
    etapes = taille if len(liste(p.sizes)) > 1 else []      # un seul choix : sélectionné d'office
    etapes += ["couleur"] if len(liste(p.colors)) > 1 else []
    return etapes + ["nom", "whatsapp", "zone", "recap"]


def _prochaine(b: dict, etapes: list) -> str:
    return next((e for e in etapes if e != "recap" and not b.get(_CLE_ETAPE[e])), "recap")


def _lignes(b: dict) -> list:
    return [Ligne(product_id=b["product_id"], quantite=1,
                  tailles=[b["taille"]] if b.get("taille") else [],
                  couleurs=[b["couleur"]] if b.get("couleur") else [],
                  sur_mesure=_sur_mesure(b))]


# ── Questions (écrites par le code) ──────────────────────────────────────
def _recap(session: Session, p: Product, b: dict) -> dict:
    try:
        calc = calculer(session, _lignes(b), b["zone"])
    except HTTPException as exc:
        return _reponse(f"Je ne peux pas finaliser cette commande : {_detail(exc)}", [MODIFIER, ANNULER], b)
    options = " · ".join(x for x in (b.get("taille"), b.get("couleur")) if x)
    qui = f"- Au nom de {b['client_name']}, WhatsApp {b['client_whatsapp']}"
    if _sur_mesure(b):
        lignes = [
            f"**Sur mesure inspiré de « {p.name} »**" + (f" — {options}" if options else ""),
            f"- Prix de base : {_fmt(calc['sous_total'])} (il peut varier selon la taille et les couleurs ; "
            "notre équipe vous le confirme)",
            f"- Livraison : {_libelle_zone(b['zone'])}",
            f"- **Total estimé : {_fmt(calc['total'])}**",
            f"- Fabrication : {DELAI_FABRICATION} après l'avance de {AVANCE} % du prix confirmé",
            qui,
        ]
    else:
        lignes = [
            f"**{p.name}**" + (f" — {options}" if options else ""),
            f"- Article : {_fmt(calc['sous_total'])}",
            f"- Livraison : {_libelle_zone(b['zone'])}",
            f"- **Total : {_fmt(calc['total'])}**",
            qui,
        ]
    texte = "Voici le récapitulatif de votre commande :\n" + "\n".join(lignes) + "\n\nJe confirme ?"
    return _reponse(texte, [OUI, MODIFIER, ANNULER], b)


def _question(session: Session, p: Product, b: dict) -> dict:
    if b.get("etape") == "taille" and _sans_taille(p):  # garde-fou unique : jamais de taille pour un sac
        b["etape"] = _prochaine(b, _etapes(p, b))
    e = b["etape"]
    if e == "mode":
        variantes = "autre couleur" if _sans_taille(p) else "autre taille, autre couleur"
        return _reponse(f"Préférez-vous la pièce en stock, ou une version sur mesure dans le même style "
                        f"({variantes}) ?", [EN_STOCK, SUR_MESURE], b)
    if e == "taille":
        if _sur_mesure(b):
            if b.get("attente_mensurations"):
                return _reponse("Indiquez vos mensurations (tour de poitrine, de taille, de hanches…) :", [], b)
            return _reponse("Quelle taille souhaitez-vous ? Vous pouvez aussi me donner vos mensurations.",
                            TAILLES_SUR_MESURE + [MENSURATIONS], b)
        return _reponse(f"Quelle taille souhaitez-vous pour « {p.name} » ?", liste(p.sizes), b)
    if e == "couleur":
        if _sur_mesure(b):
            return _reponse("Quelle(s) couleur(s) souhaitez-vous ? Choisissez dans notre palette "
                            "ou écrivez votre envie (ex. rose et blanc).", PALETTE_SUR_MESURE, b)
        return _reponse("Quelle couleur préférez-vous ?", liste(p.colors), b)
    if e == "nom":
        return _reponse("À quel nom dois-je enregistrer la commande ?", [], b)
    if e == "whatsapp":
        return _reponse("Quel est votre numéro WhatsApp ? Notre équipe vous y contactera "
                        "pour le paiement et la livraison.", [], b)
    if e == "zone":
        return _reponse("Où souhaitez-vous être livré(e) ?", [_libelle_zone(z) for z in ZONES_CHAT], b)
    return _recap(session, p, b)


# ── Validation d'une réponse (par le code, avec les règles du site) ──────
def _valider(p: Product, b: dict, message: str):
    """None si la réponse est acceptée (brouillon mis à jour), sinon le message d'erreur."""
    e = b["etape"]
    texte = " ".join((message or "").split())
    if e in ("taille", "couleur") and _sur_mesure(b):
        if e == "taille" and b.get("attente_mensurations"):
            if not 3 <= len(texte) <= 200:
                return "Pouvez-vous préciser vos mensurations ?"
            b["taille"] = f"Mensurations : {texte}"
            b.pop("attente_mensurations", None)
            return None
        choix = _choisir(texte, _options(p, b, e))
        if not choix and e == "taille" and 1 <= len(texte) <= 40 and len(texte.split()) <= 5:
            choix = texte                                   # taille libre (« 42 », « 4-6 ans »…)
        if (not choix and e == "couleur" and 2 <= len(texte) <= 60 and len(texte.split()) <= 4
                and not any(c.isdigit() for c in texte)):
            choix = texte[0].upper() + texte[1:]            # envie libre (« jaune et blanc »)
        if not choix:
            return f"Pouvez-vous préciser la {e} souhaitée ?"
        b[e] = choix
    elif e in ("taille", "couleur"):
        options = _options(p, b, e)
        choix = _choisir(texte, options)
        if not choix:
            return (f"Cette pièce en stock existe en : {', '.join(options)}. "
                    "Je peux aussi la faire fabriquer sur mesure, dans le même style.")
        b[e] = choix
    elif e == "nom":
        nom = texte[:120]
        if len(nom) < 2 or len(nom.split()) > 4 or any(c.isdigit() for c in nom):
            return "Pouvez-vous m'indiquer votre nom (sans chiffres) ?"
        b["client_name"] = nom
    elif e == "whatsapp":
        try:
            b["client_whatsapp"] = normaliser_whatsapp(message)
        except HTTPException as exc:
            return _detail(exc)
    elif e == "zone":
        par_libelle = {_libelle_zone(z): z for z in ZONES_CHAT}
        zone = par_libelle.get(_choisir(texte, list(par_libelle)))
        zone = zone or _lieu(texte)  # lieu connu : « je suis à Majunga », « Ambatoloaka »…
        if not zone:  # texte libre : accepté s'il désigne une seule zone
            cle = _cle(texte)
            candidats = [z for z in ZONES_CHAT if cle and cle in _cle(LIBELLES_ZONE[z])]
            zone = candidats[0] if len(candidats) == 1 else None
        if not zone:
            return "Choisissez une zone de livraison dans la liste."
        b["zone"] = zone
    return None


# ── Texte libre (brique 2b) : valeurs extraites, vérifiées comme une réponse tapée ──
def _completer(p: Product, b: dict, etapes: list, champs: dict, message: str) -> bool:
    """Applique les valeurs extraites par le modèle ; chacune doit figurer dans le message et passer _valider.
    Ne remplace jamais une réponse déjà donnée, sauf celle de l'étape en cours."""
    acceptes = 0
    for champ, valeur in (champs or {}).items():
        etape = _ETAPE_CHAMP.get(champ)
        if etape not in etapes or (b.get(champ) and etape != b["etape"]):
            continue
        if not _present(champ, str(valeur), message):
            continue  # valeur absente du message : inventée par le modèle, refusée
        if etape == "zone" and valeur in ZONES_CHAT:
            b["zone"] = valeur
            acceptes += 1
            continue
        essai = {**b, "etape": etape}
        if _valider(p, essai, str(valeur)) is None:
            b[champ] = essai[champ]
            acceptes += 1
    return acceptes > 0


# ── Création (même service que le site) ──────────────────────────────────
def _creer(session: Session, p: Product, b: dict) -> dict:
    sur_mesure = _sur_mesure(b)
    if not sur_mesure and not _en_stock(p):
        return _reponse("Cette pièce vient d'être vendue 😔 Je peux la faire fabriquer pour vous sur mesure, "
                        "dans le même style.", [SUR_MESURE, ANNULER], {**b, "etape": "mode"})
    note = (f"Sur mesure inspiré du modèle « {p.name} » — prix à confirmer avec la cliente. "
            "Commande passée via le chat Jatie." if sur_mesure else "Commande passée via le chat Jatie")
    try:
        order = creer_commande(
            session,
            origine="sur_mesure" if sur_mesure else "panier",
            client={"name": b["client_name"], "whatsapp": b["client_whatsapp"], "message": note},
            lignes=_lignes(b),
            zone=b["zone"],
            paiement={"payment_method": "whatsapp"},
        )
    except HTTPException as exc:
        return _reponse(f"Je n'ai pas pu enregistrer la commande : {_detail(exc)}", [MODIFIER, ANNULER],
                        {**b, "etape": "recap"})
    if sur_mesure:
        texte = (f"Merci {order.client_name} ! Votre demande sur mesure n° {order.id} est enregistrée ✨\n"
                 f"Notre équipe vous appelle au {order.client_whatsapp} pour confirmer le prix, "
                 "les détails et l'avance.")
    else:
        texte = (f"Merci {order.client_name} ! Votre commande n° {order.id} est enregistrée ✨\n"
                 f"Total : **{_fmt(order.total_ar)}**. Notre équipe vous contacte sur WhatsApp "
                 f"au {order.client_whatsapp} pour le paiement et la livraison.")
    return _reponse(texte, commande={"id": order.id, "total_ar": order.total_ar})


# ── Points d'entrée ──────────────────────────────────────────────────────
def _demarrer(session: Session, product_id: int) -> dict:
    """Bouton « Commander » d'une carte produit."""
    p = session.get(Product, product_id)
    if not p:
        return _reponse("Je ne retrouve pas ce modèle. Choisissez-le à nouveau dans la boutique ?")
    b = {"product_id": p.id, "mode": None, "taille": None, "couleur": None,
         "client_name": None, "client_whatsapp": None, "zone": None}
    entete = f"Avec plaisir ! « {p.name} » ({_fmt(p.price_ar)})"
    if _en_stock(p):
        b["etape"] = "mode"
        q = _question(session, p, b)
        q["texte"] = f"{entete} : pièce en stock, préparée sous {DELAI_TRAITEMENT}.\n" + q["texte"]
        return q
    b["mode"], b["etape"] = "sur_mesure", "taille"
    q = _question(session, p, b)
    selon = "les couleurs" if _sans_taille(p) else "la taille et les couleurs"
    q["texte"] = (f"{entete} est réalisé{_e(p)} sur commande, dans le même style : {DELAI_FABRICATION} "
                  f"après l'avance de {AVANCE} %. Le prix peut varier selon {selon}.\n" + q["texte"])
    return q


def _repondre(session: Session, brouillon: dict, message: str, extraire=None) -> dict:
    """Une réponse du client à l'étape en cours.
    extraire(message, tailles, couleurs, zones) -> dict : appelé seulement si la réponse
    n'est pas comprise directement (un bouton cliqué ne coûte aucun token)."""
    b = dict(brouillon or {})
    p = session.get(Product, b.get("product_id") or 0)
    if not p or b.get("etape") not in _ETAPES_VALIDES:
        return _reponse("Reprenons depuis la boutique : cliquez sur « Commander » sous le modèle qui vous plaît.")
    if _choisir(message, [ANNULER]) or _cle(message) in _MOTS_ANNULER:
        return _reponse("Commande annulée. Je reste à votre disposition si vous avez une question ✨")

    passer_sur_mesure = _choisir(message, [SUR_MESURE]) and not _sur_mesure(b) and b["etape"] in ("mode", "taille", "couleur")
    if passer_sur_mesure or (b["etape"] == "mode" and "mesure" in _cle(message)):
        b.update(mode="sur_mesure", taille=None, couleur=None, etape="taille")
        b.pop("retour_recap", None)
        q = _question(session, p, b)
        q["texte"] = ("Parfait, faisons-la sur mesure ! Le prix peut varier selon la taille et les couleurs ; "
                      "notre équipe vous le confirmera.\n" + q["texte"])
        return q

    if b["etape"] == "mode":
        cle = _cle(message)
        if _choisir(message, [EN_STOCK]) or "stock" in cle or "telle" in cle:
            tailles, couleurs = liste(p.sizes), liste(p.colors)
            b.update(mode="stock",
                     taille=tailles[0] if len(tailles) == 1 else None,
                     couleur=couleurs[0] if len(couleurs) == 1 else None)
            b["etape"] = _prochaine(b, _etapes(p, b))
            return _question(session, p, b)
        return _reponse("La pièce en stock, ou sur mesure dans le même style ?", [EN_STOCK, SUR_MESURE], b)

    etapes = _etapes(p, b)
    champs = {k: v for k, v in _CHAMPS.items() if v in etapes}

    if b["etape"] == "recap":
        if _choisir(message, [OUI]) or _est_oui(message):
            return _creer(session, p, b)
        if _choisir(message, [MODIFIER]):
            b["etape"] = "modifier"
            return _reponse("Que souhaitez-vous modifier ?", list(champs), b)
        return _reponse("Je confirme la commande ?", [OUI, MODIFIER, ANNULER], b)

    if b["etape"] == "modifier":
        choix = _choisir(message, list(champs))
        if not choix:
            return _reponse("Que souhaitez-vous modifier ?", list(champs), b)
        b["etape"], b["retour_recap"] = champs[choix], True
        return _question(session, p, b)

    if b["etape"] == "taille" and _sur_mesure(b) and _choisir(message, [MENSURATIONS]):
        b["attente_mensurations"] = True
        return _question(session, p, b)

    erreur = _valider(p, b, message)
    if erreur and extraire:
        zones = {z: LIBELLES_ZONE[z] for z in ZONES_CHAT}
        trouves = extraire(message, _options(p, b, "taille"), _options(p, b, "couleur"), zones)
        if _completer(p, b, etapes, trouves, message):
            b.pop("retour_recap", None)
            b["etape"] = _prochaine(b, etapes)
            return _question(session, p, b)
    if erreur:
        suggestions = _question(session, p, b)["suggestions"]
        if not _sur_mesure(b) and b["etape"] in ("taille", "couleur"):
            suggestions = suggestions + [SUR_MESURE]
        return _reponse(erreur, suggestions, b)
    b["etape"] = "recap" if b.pop("retour_recap", False) else _prochaine(b, etapes)
    return _question(session, p, b)


# ── Résumé pour le panneau « Votre commande » (chiffres du serveur, jamais du navigateur) ──
def _resume(session: Session, b: dict):
    if not b:
        return None
    p = session.get(Product, b.get("product_id") or 0)
    if not p:
        return None
    total = None
    if b.get("zone"):
        try:
            total = calculer(session, _lignes(b), b["zone"])["total"]
        except HTTPException:
            total = None
    return {
        "produit": p.name, "image": p.image or "", "prix_ar": p.price_ar, "sur_mesure": _sur_mesure(b),
        "taille": b.get("taille"), "couleur": b.get("couleur"), "client_name": b.get("client_name"),
        "zone": _libelle_zone(b["zone"]) if b.get("zone") else None,
        "total_ar": total, "etape": b.get("etape"),
    }


def demarrer(session: Session, product_id: int) -> dict:
    """Point d'entrée : bouton « Commander » (+ résumé de la commande en cours)."""
    r = _demarrer(session, product_id)
    r["resume"] = _resume(session, r["brouillon"])
    return r


def repondre(session: Session, brouillon: dict, message: str, extraire=None) -> dict:
    """Point d'entrée : une réponse de la cliente (+ résumé de la commande en cours)."""
    r = _repondre(session, brouillon, message, extraire=extraire)
    r["resume"] = _resume(session, r["brouillon"])
    return r
