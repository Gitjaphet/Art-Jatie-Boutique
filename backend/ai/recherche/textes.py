"""Phrases de Jatie : une seule source, par langue. Chaque phrase malgache est validée par Art Jatie.

Une phrase sans version malgache reste en français (repli) : on traduit lot par lot sans rien casser.
"""
import re

TEXTES = {
    "accueil": {
        "fr": "Je suis Jatie, la conseillère d'Art Jatie. Que cherchez-vous aujourd'hui ?",
        "mg": "Izaho no Jatie, mpanolotsaina ato amin'ny Art Jatie. Inona no tadiavinao androany ?",
    },
    "selection": {"fr": "J'ai sélectionné pour vous {d} ✨", "mg": "Ireto ny {d} nofidiako ho anao ✨"},
    "coup_de_coeur": {
        "fr": "Mon coup de cœur : « {nom} »{nuance} à {prix}, {dispo}.",
        "mg": "Ilay tena tiako : « {nom} »{nuance}, {prix}, {dispo}.",
    },
    "autre_coup_de_coeur": {
        "fr": "Autre coup de cœur : « {nom} »{nuance} à {prix}, {dispo}.",
        "mg": "Iray hafa tiako koa : « {nom} »{nuance}, {prix}, {dispo}.",
    },
    "derniere_piece": {"fr": "en stock — c'est la dernière pièce", "mg": "iray sisa no misy"},
    "total": {"fr": " Livraison comprise : {total} au total.", "mg": " Miaraka amin'ny livraison : {total} daholo."},
    "rien_d_exact": {
        "fr": "Je n'ai pas de {d} pour le moment. Je peux vous en faire {un} sur mesure{couleur} (en {delai}), "
              "ou voici les modèles les plus proches 👇",
        "mg": "Tsy misy {d} aloha izao. Afaka amboarinay ho anao sur mesure{couleur} ianao (ao anatin'ny {delai}), "
              "na ireto ny modèle akaiky indrindra 👇",
    },
    "plus_accessible": {
        "fr": "Je n'ai pas de {d} en ce moment. Le modèle le plus accessible est « {nom} » à {prix}, {dispo}. "
              "Et tous nos modèles peuvent être faits sur mesure, avec un acompte de {taux} % à la commande. {conclusion}",
        "mg": "Tsy misy {d} aloha izao. Ny modèle mora indrindra dia « {nom} », {prix}, {dispo}. "
              "Ary azo amboarina sur mesure avokoa ny modèle-nay rehetra, miaraka amin'ny acompte {taux} % "
              "rehefa manao commande. {conclusion}",
    },
    "rien_du_tout": {
        "fr": "Je n'ai pas de {d} en ce moment 😔 Bonne nouvelle : nous pouvons vous en créer {un} sur mesure{couleur}, "
              "en {delai}. Je vous montre nos modèles pour vous inspirer ?",
        "mg": "Tsy misy {d} aloha izao 😔 Vaovao tsara : afaka amboarinay ho anao sur mesure izany, ao anatin'ny {delai}. "
              "Asehoko anao ve ny modèle-nay mba hahazoanao hevitra ?",
    },
    "tout_de_suite": {
        "fr": " Pour l'avoir tout de suite : « {nom} » à {prix} est {dispo}.",
        "mg": " Raha tianao avy hatrany : « {nom} », {prix}, {dispo}.",
    },
    "zones": {
        "fr": "Nous livrons partout ! Hell-Ville : offerte · Darsalam, Ambatoloaka, Madirokely : {darsalam} · "
              "Dzamanjar : {dzamanjar} · ailleurs : sur devis. Où souhaitez-vous être livrée ?",
        "mg": "Manatitra na aiza na aiza izahay ! Hell-Ville : maimaim-poana · Darsalam, Ambatoloaka, Madirokely : "
              "{darsalam} · Dzamanjar : {dzamanjar} · any an-kafa : resahina ny vidiny. Aiza no tianao hanaterana azy ?",
    },
    "tarif_offert": {"fr": "offerte", "mg": "maimaim-poana"},
    "tarif_devis": {"fr": "sur devis (l'équipe vous confirme le tarif)", "mg": "resahina ny vidiny"},
    "arrivee_nosy_be": {"fr": "puis livré{e} {delai}", "mg": "dia aterina ao anatin'ny antsasak'andro"},
    "arrivee_ailleurs": {"fr": "puis acheminé{e} (délai confirmé par l'équipe)",
                         "mg": "dia alefa (ny ekipa no milaza delais)"},
    "livraison_stock": {"fr": "Une pièce en stock est préparée sous {delai}, {arrivee}",
                        "mg": "Omanina ao anatin'ny {delai} ny pièce misy en stock, {arrivee}"},
    "livraison_fabrication": {"fr": "« {nom} » est réalisé{e} pour vous en {delai}, {arrivee}",
                              "mg": "Amboarina ho anao ao anatin'ny {delai} « {nom} », {arrivee}"},
    "montrer_quoi": {"fr": " Que puis-je vous montrer ?", "mg": " Inona no tianao hasehoko anao ?"},
    "incompris": {
        "fr": "Je n'ai pas bien compris 😊 Je peux vous montrer nos créations au crochet, ou vous en faire une "
              "sur mesure. Que cherchez-vous ?",
        "mg": "Miala tsiny, tsy azoko tsara 😊 Afaka asehoko anao ny créations crochet-nay, na amboarinay ho "
              "anao sur mesure. Inona no tadiavinao ?",
    },
    "comprends": {"fr": "Je comprends tout à fait 😊", "mg": "Azoko tsara 😊"},
    "pas_de_souci": {
        "fr": "Pas de souci 😊 Je peux vous montrer d'autres modèles, ou vous en créer un sur mesure.",
        "mg": "Tsy maninona 😊 Afaka asehoko anao ny modèle hafa, na amboarinay ho anao sur mesure.",
    },
    "remise": {
        "fr": "Je ne peux pas modifier nos prix 😊 Chaque pièce est crochetée à la main et son prix est fixé par "
              "l'atelier. Dites-moi votre budget, et je vous trouve la plus belle pièce qui y rentre !",
        "mg": "Tsy afaka ovaiko ny vidiny 😊 Atao amin'ny tanana avokoa ny pièce tsirairay ary ny atelier no "
              "mametraka ny vidiny. Lazao ahy ny budget-nao dia hitadiavako ny pièce tsara indrindra mifanaraka "
              "amin'izany !",
    },
    "en_stock": {"fr": "en stock", "mg": "misy en stock"},
    "a_fabriquer": {
        "fr": "pas disponible en stock actuellement, mais nous pouvons {pr} réaliser pour vous en {delai}",
        "mg": "tsy misy en stock aloha izao, fa afaka amboarinay ho anao ao anatin'ny {delai}",
    },
    "reserver": {"fr": "Je vous {pr} réserve ?", "mg": "Reservenay ho anao ve ?"},
    "realiser": {"fr": "On lance sa réalisation pour vous ?", "mg": "Amboarinay ho anao ve ?"},
    "zone_ou_reserver": {
        "fr": "Dites-moi où vous livrer pour connaître le prix livré, ou je vous {pr} réserve ?",
        "mg": "Lazao ahy hoe aiza no hanaterana azy dia omeko ny vidiny miaraka amin'ny livraison, "
              "sa reservenay ho anao avy hatrany ?",
    },
    "zone_ou_realiser": {
        "fr": "Dites-moi où vous livrer pour connaître le prix livré, ou on lance sa réalisation pour vous ?",
        "mg": "Lazao ahy hoe aiza no hanaterana azy dia omeko ny vidiny miaraka amin'ny livraison, "
              "sa ve hoe direct amboarinay ho anao lay izy ?",
    },
    "bouton_oui": {"fr": "Oui, je {pr} veux", "mg": "Eny, tiako"},
    "bouton_tout_voir": {"fr": "Voir toute la boutique", "mg": "Hijery ny boutique rehetra"},
}


def dire(cle: str, langue: str = "fr", **valeurs) -> str:
    """La phrase dans la langue de la cliente, sinon en français."""
    variantes = TEXTES[cle]
    return variantes.get(langue, variantes["fr"]).format(**valeurs)


def en_malgache(duree: str) -> str:
    """« 7 à 14 jours » -> « 7 ka hatramin'ny 14 andro », « 24 à 48 h » -> « 24 ka hatramin'ny 48 ora »."""
    return re.sub(r"\bh\b", "ora", duree.replace(" à ", " ka hatramin'ny ").replace("jours", "andro"))


# Familles de couleur -> malgache (mots validés du lexique) ; sans nom validé, le français reste
COULEURS_MG = {"Rouge": "mena", "Blanc": "fotsy", "Noir": "mainty", "Jaune": "mavo", "Vert": "maitso",
               "Bleu": "manga", "Rose": "mavokely", "Marron": "volontany", "Orange": "volomboasary",
               "Violet": "volomparasy"}


def couleurs_mg(familles: list[str]) -> list[str]:
    return [COULEURS_MG.get(f, f.lower()) for f in familles]
