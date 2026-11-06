# services/commandes.py
"""
Création de commande — SOURCE UNIQUE (checkout, « Commander sur mesure », et bientôt Jatie).
Le navigateur dit QUOI (produits, quantités, tailles, couleurs, zone, code promo) ;
le serveur calcule COMBIEN (prix en base, remise, livraison, total).
"""
import json
import re
from dataclasses import dataclass, field

from fastapi import HTTPException
from sqlmodel import Session

from models.models import Order, Product

# Frais de livraison par zone (Ar) — source de vérité côté serveur.
FRAIS_LIVRAISON = {
    "tana": 0,          # expédition par coopérative, frais réglés à la coopérative
    "nosybe_ville": 0,
    "darsalam": 5000,
    "dzamanjar": 7000,
    "nosybe_autre": 0,  # sur devis, confirmé par l'équipe
    "hors_nosybe": 0,   # coopérative choisie par la cliente
    "a_confirmer": 0,   # « Commander sur mesure » : livraison convenue ensuite avec l'équipe
}
# Libellés affichés (dashboard, WhatsApp, Jatie) — mêmes zones que FRAIS_LIVRAISON (vérifié par test).
LIBELLES_ZONE = {
    "tana": "Antananarivo (coopérative)",
    "nosybe_ville": "Nosy Be — En ville",
    "darsalam": "Nosy Be — Darsalam",
    "dzamanjar": "Nosy Be — Dzamanjar",
    "nosybe_autre": "Autre zone Nosy Be (sur devis)",
    "hors_nosybe": "Hors Nosy Be (coopérative)",
    "a_confirmer": "À convenir avec l'équipe",
}
# Délais en jours — DOIVENT rester égaux à DELAIS de frontend/lib/contact.ts (vérifié par test).
DELAIS = {"stock": (1, 2), "fabrication": (7, 14)}
DELAI_TRAITEMENT = f"{DELAIS['stock'][0] * 24} à {DELAIS['stock'][1] * 24} h"          # « 24 à 48 h »
DELAI_FABRICATION = f"{DELAIS['fabrication'][0]} à {DELAIS['fabrication'][1]} jours"   # « 7 à 14 jours »
TAUX_ACOMPTE_SUR_MESURE = 0.5   # avance demandée pour lancer une fabrication sur commande
CODES_PROMO = {"ARTJATIE10": 0.10}   # code -> taux de remise sur le sous-total
MOYENS_PAIEMENT = {"whatsapp", "mvola", "orange_money"}
ORIGINES = {"panier", "sur_mesure", "planning", "caisse"}   # Order.origine — source unique
QUANTITE_MAX = 10


def taux_promo(code):
    """Taux de remise d'un code promo (casse et espaces ignorés), ou None s'il n'existe pas.
    Seul endroit qui lit CODES_PROMO : le calcul de commande et la route de vérification l'utilisent."""
    return CODES_PROMO.get((code or "").strip().upper())


@dataclass
class Ligne:
    product_id: int
    quantite: int = 1
    tailles: list = field(default_factory=list)
    couleurs: list = field(default_factory=list)
    sur_mesure: bool = False   # même style, taille/couleur libres (prix du catalogue, à confirmer)


def _refus(message: str):
    raise HTTPException(status_code=422, detail=message)


def liste(valeur) -> list:
    """« S, M » -> ["S", "M"]"""
    return [v.strip() for v in str(valeur or "").split(",") if v.strip()]


def normaliser_whatsapp(numero: str) -> str:
    """Numéro malgache -> 0341234567 ; numéro étranger -> +33612345678."""
    n = re.sub(r"[\s.\-()]", "", numero or "")
    if re.fullmatch(r"(?:\+?261|0)3[2-9]\d{7}", n):
        return "0" + n[-9:]
    if re.fullmatch(r"\+\d{8,15}", n):
        return n
    _refus("Numéro WhatsApp invalide (ex. 034 12 345 67, ou +33 6 12 34 56 78 depuis l'étranger).")


def _verifier_choix(choisis: list, disponibles: set, quoi: str, produit: str):
    disponibles = {d.lower() for d in disponibles if d}
    if not disponibles:
        return  # produit sans liste définie : tout est accepté
    for c in choisis:
        if c.lower() not in disponibles:
            _refus(f"{quoi} « {c} » non proposée pour « {produit} ».")


def calculer(session: Session, lignes: list, zone: str, code_promo: str = None) -> dict:
    if not lignes:
        _refus("La commande ne contient aucun article.")
    if zone not in FRAIS_LIVRAISON:
        _refus(f"Zone de livraison inconnue : {zone}.")

    articles, sous_total = [], 0
    for ligne in lignes:
        if not 1 <= ligne.quantite <= QUANTITE_MAX:
            _refus(f"Quantité invalide (entre 1 et {QUANTITE_MAX}).")
        p = session.get(Product, ligne.product_id)
        if not p:
            _refus(f"Produit introuvable (n°{ligne.product_id}).")
        if ligne.sur_mesure:   # même style sur mesure : choix libres, seule leur longueur est contrôlée
            choix = ligne.tailles + ligne.couleurs
            if len(choix) > 6 or any(len(c) > 200 for c in choix):
                _refus("Précisions sur mesure trop longues.")
        else:
            _verifier_choix(ligne.tailles, set(liste(p.sizes)), "Taille", p.name)
            couleurs = set(liste(p.colors)) | {c.name for c in (p.colors_list or [])}
            _verifier_choix(ligne.couleurs, couleurs, "Couleur", p.name)
        sous_total += p.price_ar * ligne.quantite
        articles.append({
            "id": p.id, "name": p.name, "price": p.price_ar, "quantity": ligne.quantite,
            "image": p.image or "", "category": p.category, "discount": 0,
            "sizes": ligne.tailles, "colors": ligne.couleurs, "sur_mesure": ligne.sur_mesure,
        })

    taux = taux_promo(code_promo)
    if (code_promo or "").strip() and taux is None:
        _refus("Code promo invalide.")
    remise = round(sous_total * taux) if taux else 0
    livraison = FRAIS_LIVRAISON[zone]
    return {"articles": articles, "sous_total": sous_total, "remise": remise,
            "livraison": livraison, "total": sous_total - remise + livraison}


def _paiement(champs: dict) -> dict:
    methode = champs.get("payment_method") or "whatsapp"
    if methode not in MOYENS_PAIEMENT:
        _refus("Moyen de paiement inconnu.")
    if methode == "mvola" and not (champs.get("mvola_phone") and champs.get("mvola_account_name")):
        _refus("Le numéro et le nom du compte MVola sont requis.")
    if methode == "orange_money" and not (champs.get("om_phone") and champs.get("om_account_name")):
        _refus("Le numéro et le nom du compte Orange Money sont requis.")
    cles = ("mvola_account_name", "mvola_phone", "om_account_name", "om_phone",
            "payment_proof_text", "payment_proof_image")
    return {"payment_method": methode, **{k: champs.get(k) for k in cles}}


def creer_commande(session: Session, *, origine: str, client: dict, lignes: list, zone: str,
                   delivery_label: str = None, code_promo: str = None, paiement: dict = None) -> Order:
    if origine not in ORIGINES:
        raise ValueError(f"Origine de commande inconnue : {origine!r}")   # erreur de code, pas du client
    nom = (client.get("name") or "").strip()[:120]
    if not nom:
        _refus("Le nom est requis.")
    calc = calculer(session, lignes, zone, code_promo)
    unique = calc["articles"][0] if len(calc["articles"]) == 1 else None

    order = Order(
        client_id=None,
        origine=origine,
        client_name=nom,
        client_email=((client.get("email") or "").strip() or "non renseigné")[:120],
        client_whatsapp=normaliser_whatsapp(client.get("whatsapp")),
        client_message=(client.get("message") or "").strip()[:2000] or None,
        cart_items_json=json.dumps(calc["articles"], ensure_ascii=False),
        delivery_zone=zone,
        delivery_cost=calc["livraison"],
        delivery_label=((delivery_label or "").strip() or LIBELLES_ZONE[zone])[:150],
        subtotal_ar=calc["sous_total"],
        discount_ar=calc["remise"],
        total_ar=calc["total"],
        product_id=unique["id"] if unique else None,
        product_name=unique["name"] if unique else None,
        product_image=unique["image"] if unique else None,
        product_price_ar=unique["price"] if unique else None,
        selected_size=(", ".join(unique["sizes"]) or None) if unique else None,
        selected_color=(", ".join(unique["colors"]) or None) if unique else None,
        **_paiement(paiement or {}),
    )
    session.add(order)
    session.commit()
    session.refresh(order)
    return order
