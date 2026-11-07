"""Lexique de Jatie : français, langage SMS et malgache -> valeurs du catalogue.

Les mots des clientes sont comparés au mot EXACT (ou à son pluriel), jamais par début de mot :
« mavokely » (rose) ne doit pas être lu « mavo » (jaune), ni « taille haute » comme un « haut ».
"""
from services.catalogue import TYPES_ARTICLE, familles_de, mots

# Langage SMS -> mot complet (un mot peut devenir plusieurs : « jai » -> « j ai »)
SMS = {
    "bjr": "bonjour", "bjour": "bonjour", "bsr": "bonsoir", "slt": "salut", "cc": "coucou",
    "vs": "vous", "jai": "j ai", "ya": "il y a", "pr": "pour", "pk": "pourquoi", "qd": "quand",
    "cb": "combien", "cmb": "combien", "dispo": "disponible", "stp": "s il te plait",
    "svp": "s il vous plait", "tjr": "toujours", "bcp": "beaucoup", "mrc": "merci", "mci": "merci",
}

# Malgache du Nord (Nosy Be) écrit en abrégé -> malgache standard. Uniquement des mots validés par Art Jatie.
DIALECTE = {
    "zah": "zaho", "za": "zaho", "anw": "anao", "iz": "izy", "izi": "izy",
    "ts": "tsy", "tss": "tsisy", "mbol": "mbola", "tsar": "tsara", "afak": "afaka", "sar": "sary",
    "zegny": "izany", "zengy": "izany", "zeu": "izany", "bk": "baka", "ingi": "iny",
    "rah": "zavatra", "driaby": "jiaby", "amaizanw": "omeo", "afa": "hafa", "volagna": "teneno",
    "angano": "hanao", "mangefa": "mandoa", "ambila": "avelao", "ro": "ireo",
    "ndrk": "ndreky", "krh": "karaha",
}

# Types d'article dans la bouche des clientes (mot exact ou pluriel)
EXPRESSIONS_TYPE = {"akanjo milomano": "Maillot", "maillot de bain": "Maillot"}
MOTS_TYPE = {
    "robe": "Robe", "akanjo": "Robe",
    "maillot": "Maillot", "bikini": "Maillot", "string": "Maillot",
    "ensemble": "Ensemble",
    "jupe": "Jupe",
    "short": "Short",
    "top": "Haut", "crop": "Haut", "brassiere": "Haut",
    "sac": "Sac", "kitapo": "Sac",
    "pochette": "Pochette",
    "chapeau": "Chapeau", "bob": "Chapeau", "satroka": "Chapeau",
}

# Couleurs en malgache (mot exact) ; le français passe par services.catalogue.familles_de
COULEURS_MALGACHE = {
    "mena": "Rouge", "fotsy": "Blanc", "mainty": "Noir", "mavo": "Jaune", "maitso": "Vert",
    "manga": "Bleu", "mavokely": "Rose", "volontany": "Marron", "volomboasary": "Orange",
    "volomparasy": "Violet",
}

# Mots-clés utilisés par le lecteur (brique 2b)
OUI = {"oui", "ouais", "ok", "okay", "daccord", "yes", "eny", "ie", "volontiers", "parfait"}
NON = {"non", "tsia", "aoka", "nan", "no"}
SALUTATIONS = {"bonjour", "bonsoir", "salut", "coucou", "hello", "salama", "manao", "akory"}
QUESTION_PRIX = {"combien", "prix", "tarif", "ohatrinona", "firy", "vidiny", "sarany"}
EXPRESSIONS_TROP_CHER = ("trop cher", "lafo loatra", "un peu cher", "c est cher", "cest cher")

# Mots qui signalent une cliente qui écrit en malgache
MARQUEURS_MALGACHE = {
    "salama", "misy", "ve", "ianareo", "ohatrinona", "firy", "manao", "ahoana", "akory",
    "eny", "tsia", "aoka", "lafo", "loatra", "azafady", "misaotra", "mba", "ho",
    *COULEURS_MALGACHE, "akanjo", "kitapo", "satroka", "milomano",
    *DIALECTE, *DIALECTE.values(), "aleko", "vidiny", "sarany",
}


def mots_message(texte: str) -> list[str]:
    """Minuscules, sans accents, SMS déplié : « Bjr, vs avez des robe rouge ? » -> [bonjour, vous, avez, ...]."""
    resultat = []
    for m in mots(texte):
        resultat.extend((SMS.get(m) or DIALECTE.get(m, m)).split())
    return resultat


def _singulier(mot: str) -> str:
    return mot[:-1] if len(mot) > 3 and mot[-1] in "sx" else mot


def types_cites(liste_mots: list[str]) -> list[str]:
    """Types demandés, dans l'ordre du catalogue : « akanjo milomano » -> [Maillot]."""
    texte = f" {' '.join(liste_mots)} "
    trouves = set()
    for expression, type_article in EXPRESSIONS_TYPE.items():
        if f" {expression} " in texte:
            trouves.add(type_article)
            texte = texte.replace(f" {expression} ", " ")
    for m in texte.split():
        type_article = MOTS_TYPE.get(m) or MOTS_TYPE.get(_singulier(m))
        if type_article:
            trouves.add(type_article)
    return [t for t in TYPES_ARTICLE if t in trouves]


def couleurs_citees(liste_mots: list[str]) -> list[str]:
    """Familles de couleur demandées : « mena » -> [Rouge] ; « fuchsia » -> [Rose]."""
    trouvees = []
    for m in liste_mots:
        familles = [COULEURS_MALGACHE[m]] if m in COULEURS_MALGACHE else familles_de(m)
        trouvees += [f for f in familles if f not in trouvees]
    return trouvees


def langue(liste_mots: list[str]) -> str:
    """« mg » dès qu'un mot malgache apparaît, sinon « fr »."""
    return "mg" if any(m in MARQUEURS_MALGACHE for m in liste_mots) else "fr"
