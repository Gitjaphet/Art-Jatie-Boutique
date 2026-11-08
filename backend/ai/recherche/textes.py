"""Phrases de Jatie : une seule source, par langue. Chaque phrase malgache est validée par Art Jatie.

Une phrase sans version malgache reste en français (repli) : on traduit lot par lot sans rien casser.
"""
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
    "autre_coup_de_coeur": {"fr": "Autre coup de cœur : « {nom} »{nuance} à {prix}, {dispo}."},
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
              "sa amboarinay ho anao avy hatrany ?",
    },
    "bouton_oui": {"fr": "Oui, je {pr} veux", "mg": "Eny, tiako"},
    "bouton_tout_voir": {"fr": "Voir toute la boutique", "mg": "Hijery ny boutique rehetra"},
}


def dire(cle: str, langue: str = "fr", **valeurs) -> str:
    """La phrase dans la langue de la cliente, sinon en français."""
    variantes = TEXTES[cle]
    return variantes.get(langue, variantes["fr"]).format(**valeurs)


def en_malgache(duree: str) -> str:
    """« 7 à 14 jours » -> « 7 ka hatramin'ny 14 andro » : le délai reste dans sa source unique."""
    return duree.replace(" à ", " ka hatramin'ny ").replace("jours", "andro")
