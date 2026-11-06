"""
ai/commande/parcours.py — commande guidée dans le chat Jatie (brique 2a).

Le code mène la conversation : une question par étape, des réponses rapides (boutons),
une validation par le code. Aucun appel au modèle ici (l'extraction du texte libre = brique 2b).
Le brouillon fait l'aller-retour avec le navigateur : tout est revalidé à la création
(services/commandes.creer_commande) — le navigateur ne décide jamais d'un prix.
"""
import re

from fastapi import HTTPException
from sqlmodel import Session

from ai.utils.texte import normaliser
from models.models import Product
from services.commandes import (
    DELAI_FABRICATION, DELAI_TRAITEMENT, FRAIS_LIVRAISON, LIBELLES_ZONE, TAUX_ACOMPTE_SUR_MESURE,
    Ligne, calculer, creer_commande, liste, normaliser_whatsapp,
)

ZONES_CHAT = ["nosybe_ville", "darsalam", "dzamanjar", "nosybe_autre", "tana", "hors_nosybe"]
OUI, MODIFIER, ANNULER = "Oui, je confirme", "Modifier", "Annuler"
_DEBUT_OUI = {"oui", "ok", "okay", "yes", "eny", "daccord"}
_NEGATIONS = {"non", "pas", "annule", "annuler", "attends", "attendez", "no"}
_MOTS_ZONE_GENERIQUES = {"nosy", "zone", "devis", "frais", "sur"}
_MOTS_ANNULER = {"annuler", "annule", "stop", "laisse tomber", "abandonner"}
_CHAMPS = {"Taille": "taille", "Couleur": "couleur", "Nom": "nom", "WhatsApp": "whatsapp", "Livraison": "zone"}
_ETAPES_VALIDES = {"taille", "couleur", "nom", "whatsapp", "zone", "recap", "modifier"}
_CLE_ETAPE = {"taille": "taille", "couleur": "couleur", "nom": "client_name",
              "whatsapp": "client_whatsapp", "zone": "zone"}
_ETAPE_CHAMP = {v: k for k, v in _CLE_ETAPE.items()}


# ── Petits utilitaires ───────────────────────────────────────────────────
def _fmt(n: int) -> str:
    return f"{n:,}".replace(",", " ") + " Ar"


def _cle(texte: str) -> str:
    return normaliser(texte or "").strip()


def _choisir(message: str, options: list):
    """Bouton cliqué ou texte équivalent (casse, accents, espaces ignorés) → option exacte."""
    cle = _cle(message)
    return next((o for o in options if _cle(o) == cle), None)


def _mots(texte: str) -> list:
    return re.findall(r"[a-z0-9]+", _cle(texte))


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
        mots_zone = {z for z in _mots(LIBELLES_ZONE.get(valeur, "")) if len(z) >= 4} - _MOTS_ZONE_GENERIQUES
        return any(m in z or z in m for m in _mots(message) if len(m) >= 4 for z in mots_zone)
    cible = " ".join(_mots(valeur))
    return bool(cible) and re.search(r"(?<![a-z0-9])" + re.escape(cible) + r"(?![a-z0-9])",
                                     " ".join(_mots(message))) is not None


def _detail(exc: HTTPException) -> str:
    return exc.detail if isinstance(exc.detail, str) else "Valeur non valide."


def _reponse(texte: str, suggestions=None, brouillon=None, commande=None) -> dict:
    return {"texte": texte, "suggestions": suggestions or [], "brouillon": brouillon, "commande": commande}


def _libelle_zone(zone: str) -> str:
    frais = FRAIS_LIVRAISON[zone]
    suffixe = _fmt(frais) if frais else ("gratuit" if zone == "nosybe_ville" else "frais à confirmer")
    return f"{LIBELLES_ZONE[zone]} ({suffixe})"


def _sur_mesure(p: Product) -> bool:
    """Fabrication sur commande seulement quand le stock est épuisé : une pièce prête se vend en stock."""
    return bool(getattr(p, "on_order", False)) and (p.stock_quantity or 0) <= 0


def _disponible(p: Product) -> bool:
    return _sur_mesure(p) or (p.stock_quantity or 0) > 0


def _etapes(p: Product) -> list:
    etapes = ["taille"] if len(liste(p.sizes)) > 1 else []      # un seul choix : sélectionné d'office
    etapes += ["couleur"] if len(liste(p.colors)) > 1 else []
    return etapes + ["nom", "whatsapp", "zone", "recap"]


def _lignes(b: dict) -> list:
    return [Ligne(product_id=b["product_id"], quantite=1,
                  tailles=[b["taille"]] if b.get("taille") else [],
                  couleurs=[b["couleur"]] if b.get("couleur") else [])]


# ── Questions (écrites par le code) ──────────────────────────────────────
def _recap(session: Session, p: Product, b: dict) -> dict:
    try:
        calc = calculer(session, _lignes(b), b["zone"])
    except HTTPException as exc:
        return _reponse(f"Je ne peux pas finaliser cette commande : {_detail(exc)}", [MODIFIER, ANNULER], b)
    options = " · ".join(x for x in (b.get("taille"), b.get("couleur")) if x)
    lignes = [
        f"**{p.name}**" + (f" — {options}" if options else ""),
        f"- Article : {_fmt(calc['sous_total'])}",
        f"- Livraison : {_libelle_zone(b['zone'])}",
        f"- **Total : {_fmt(calc['total'])}**",
        f"- Au nom de {b['client_name']}, WhatsApp {b['client_whatsapp']}",
    ]
    if _sur_mesure(p):
        avance = round(calc["sous_total"] * TAUX_ACOMPTE_SUR_MESURE)
        lignes.append(f"- Pièce fabriquée sur commande : avance de {int(TAUX_ACOMPTE_SUR_MESURE * 100)} % "
                      f"({_fmt(avance)}) pour lancer la fabrication")
    texte = "Voici le récapitulatif de votre commande :\n" + "\n".join(lignes) + "\n\nJe confirme ?"
    return _reponse(texte, [OUI, MODIFIER, ANNULER], b)


def _question(session: Session, p: Product, b: dict) -> dict:
    e = b["etape"]
    if e == "taille":
        return _reponse(f"Quelle taille souhaitez-vous pour « {p.name} » ?", liste(p.sizes), b)
    if e == "couleur":
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
    if e in ("taille", "couleur"):
        options = liste(p.sizes if e == "taille" else p.colors)
        choix = _choisir(message, options)
        if not choix:
            return f"Je ne trouve pas cette {e} pour ce modèle. Choisissez parmi : {', '.join(options)}."
        b[e] = choix
    elif e == "nom":
        nom = " ".join((message or "").split())[:120]
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
        zone = par_libelle.get(_choisir(message, list(par_libelle)))
        if not zone:  # texte libre : « darsalam », « tana »… accepté s'il désigne une seule zone
            cle = _cle(message)
            candidats = [z for z in ZONES_CHAT if cle and cle in _cle(LIBELLES_ZONE[z])]
            zone = candidats[0] if len(candidats) == 1 else None
        if not zone:
            return "Choisissez une zone de livraison dans la liste."
        b["zone"] = zone
    return None


# ── Texte libre (brique 2b) : valeurs extraites, vérifiées comme une réponse tapée ──
def _prochaine(b: dict, etapes: list) -> str:
    return next((e for e in etapes if e != "recap" and not b.get(_CLE_ETAPE[e])), "recap")


def _completer(p: Product, b: dict, etapes: list, champs: dict, message: str) -> bool:
    """Applique les valeurs extraites par le modèle ; chacune passe par _valider.
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
    try:
        order = creer_commande(
            session,
            origine="sur_mesure" if _sur_mesure(p) else "panier",
            client={"name": b["client_name"], "whatsapp": b["client_whatsapp"],
                    "message": "Commande passée via le chat Jatie"},
            lignes=_lignes(b),
            zone=b["zone"],
            paiement={"payment_method": "whatsapp"},
        )
    except HTTPException as exc:
        return _reponse(f"Je n'ai pas pu enregistrer la commande : {_detail(exc)}", [MODIFIER, ANNULER],
                        {**b, "etape": "recap"})
    suite = "l'avance et la livraison" if _sur_mesure(p) else "le paiement et la livraison"
    texte = (f"Merci {order.client_name} ! Votre commande n° {order.id} est enregistrée ✨\n"
             f"Total : **{_fmt(order.total_ar)}**. Notre équipe vous contacte sur WhatsApp "
             f"au {order.client_whatsapp} pour {suite}.")
    return _reponse(texte, commande={"id": order.id, "total_ar": order.total_ar})


# ── Points d'entrée ──────────────────────────────────────────────────────
def demarrer(session: Session, product_id: int) -> dict:
    """Bouton « Commander » d'une carte produit : première question."""
    p = session.get(Product, product_id)
    if not p:
        return _reponse("Je ne retrouve pas ce modèle. Choisissez-le à nouveau dans la boutique ?")
    if not _disponible(p):
        return _reponse(f"« {p.name} » est épuisé pour le moment. Je peux vous proposer d'autres modèles ✨")
    tailles, couleurs = liste(p.sizes), liste(p.colors)
    b = {"product_id": p.id,
         "taille": tailles[0] if len(tailles) == 1 else None,
         "couleur": couleurs[0] if len(couleurs) == 1 else None,
         "client_name": None, "client_whatsapp": None, "zone": None}
    b["etape"] = _etapes(p)[0]
    q = _question(session, p, b)
    delai = (f"Pièce fabriquée sur commande : {DELAI_FABRICATION} après l'avance de "
             f"{int(TAUX_ACOMPTE_SUR_MESURE * 100)} %." if _sur_mesure(p)
             else f"Pièce en stock, préparée sous {DELAI_TRAITEMENT}.")
    q["texte"] = f"Avec plaisir ! Commandons « {p.name} » ({_fmt(p.price_ar)}).\n{delai}\n" + q["texte"]
    return q


def repondre(session: Session, brouillon: dict, message: str, extraire=None) -> dict:
    """Une réponse du client à l'étape en cours.
    extraire(message, tailles, couleurs, zones) -> dict : appelé seulement si la réponse
    n'est pas comprise directement (un bouton cliqué ne coûte aucun token)."""
    b = dict(brouillon or {})
    p = session.get(Product, b.get("product_id") or 0)
    if not p or b.get("etape") not in _ETAPES_VALIDES:
        return _reponse("Reprenons depuis la boutique : cliquez sur « Commander » sous le modèle qui vous plaît.")
    if _choisir(message, [ANNULER]) or _cle(message) in _MOTS_ANNULER:
        return _reponse("Commande annulée. Je reste à votre disposition si vous avez une question ✨")

    etapes = _etapes(p)
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

    erreur = _valider(p, b, message)
    if erreur and extraire:
        champs = extraire(message, liste(p.sizes), liste(p.colors), {z: LIBELLES_ZONE[z] for z in ZONES_CHAT})
        if _completer(p, b, etapes, champs, message):
            b.pop("retour_recap", None)
            b["etape"] = _prochaine(b, etapes)
            return _question(session, p, b)
    if erreur:
        return _reponse(erreur, _question(session, p, b)["suggestions"], b)
    b["etape"] = "recap" if b.pop("retour_recap", False) else _prochaine(b, etapes)
    return _question(session, p, b)
