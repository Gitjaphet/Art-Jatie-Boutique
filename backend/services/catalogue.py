"""Catalogue — source unique des familles de couleur et des types d'article.

Utilisé par l'API (filtres de la boutique) et par Jatie (recherche).
Les familles sont calculées depuis le nom de la couleur par mots racines :
une nouvelle couleur (« Rose bonbon ») est rangée sans modifier le code.
"""
import re
import unicodedata

# Ordre d'affichage ; une couleur peut appartenir à plusieurs familles (Corail : Rose et Orange).
RACINES_FAMILLE: dict[str, tuple[str, ...]] = {
    "Rouge":   ("rouge",),
    "Rose":    ("rose", "fuchsia", "framboise", "magenta", "corail", "saumon"),
    "Orange":  ("orange", "corail", "saumon"),
    "Jaune":   ("jaune", "moutarde"),
    "Or":      ("dore",),
    "Vert":    ("vert", "kaki", "olive", "emeraude"),
    "Bleu":    ("bleu",),
    "Violet":  ("violet",),
    "Marron":  ("marron", "chocolat", "caramel"),
    "Beige":   ("beige", "nude", "caramel"),
    "Naturel": ("naturel", "ecru"),
    "Blanc":   ("blanc", "ecru"),
    "Gris":    ("gris",),
    "Noir":    ("noir",),
}
MULTICOLORE = "Multicolore"
SEUIL_MULTICOLORE = 3  # familles distinctes
FAMILLES = (*RACINES_FAMILLE, MULTICOLORE)

# Types d'article (liste fermée, choisie dans le dashboard). Ordre = priorité de devinette :
# la pièce principale passe avant « Ensemble » (« Ensemble Robe & Chapeau » -> Robe,
# « Ensemble Bikini » -> Maillot) ; « Robe Rayée & Sac Assorti » -> Robe.
RACINES_TYPE: dict[str, tuple[str, ...]] = {
    "Robe":     ("robe",),
    "Maillot":  ("maillot", "bikini", "string"),
    "Ensemble": ("ensemble",),
    "Jupe":     ("jupe",),
    "Short":    ("short",),
    "Haut":     ("brassiere", "haut", "top", "crop"),
    "Sac":      ("sac",),
    "Pochette": ("pochette",),
    "Chapeau":  ("chapeau", "bob", "bonnet"),
}
ACCESSOIRE = "Accessoire"
TYPES_ARTICLE = (*RACINES_TYPE, ACCESSOIRE)


def mots(texte: str) -> list[str]:
    """« Rose-Fuchsia, Écru » -> ['rose', 'fuchsia', 'ecru'] (minuscules, sans accents)."""
    sans_accents = unicodedata.normalize("NFKD", texte or "").encode("ascii", "ignore").decode()
    return re.findall(r"[a-z]+", sans_accents.lower())


def _correspond(liste_mots: list[str], racines: tuple[str, ...]) -> bool:
    # startswith : accepte les pluriels (« roses », « robes »)
    return any(m.startswith(r) for m in liste_mots for r in racines)


def familles_de(couleur: str) -> list[str]:
    """Familles d'UNE couleur : « rouge orangé » -> ['Rouge', 'Orange']."""
    liste = mots(couleur)
    return [f for f, racines in RACINES_FAMILLE.items() if _correspond(liste, racines)]


def familles(couleurs: str) -> list[str]:
    """Familles d'un produit depuis son champ colors (« Rose,Blanc Rayé »), dans l'ordre de FAMILLES."""
    trouvees = {f for c in (couleurs or "").split(",") for f in familles_de(c)}
    if len(trouvees) >= SEUIL_MULTICOLORE:
        trouvees.add(MULTICOLORE)
    return [f for f in FAMILLES if f in trouvees]


def deviner_type(nom: str, categorie: str = "") -> str | None:
    """Type proposé d'après le nom (validé ensuite à la main). None si rien ne permet de deviner."""
    liste = mots(nom)
    for type_article, racines in RACINES_TYPE.items():
        if _correspond(liste, racines):
            return type_article
    return ACCESSOIRE if (categorie or "").upper() == "ACCESSOIRES" else None


def valider_type(valeur: str | None) -> str | None:
    """« Robe » -> « Robe » ; vide -> None ; hors liste -> ValueError (l'API répond 422)."""
    if valeur is None or not valeur.strip():
        return None
    valeur = valeur.strip()
    if valeur not in TYPES_ARTICLE:
        raise ValueError(f"Type d'article inconnu : « {valeur} ». Choix possibles : {', '.join(TYPES_ARTICLE)}.")
    return valeur
