"""Garde-fou de la vendeuse IA.

Brique 1 : extraire les « faits » d'un texte, c'est-à-dire ce qu'on n'a pas le droit
de changer en reformulant : prix, grammes, tailles, jours, heures, nombres.
Le sens (Groq, en français) et la réponse (v3, en côtier) doivent contenir
les mêmes faits ; la brique 2 comparera les deux.
"""
import re
import unicodedata

# Jours : forme française de référence -> variantes françaises, malgaches et côtières
JOURS = {
    "lundi": ("lundi", "alatsinainy", "latsinainy"),
    "mardi": ("mardi", "talata"),
    "mercredi": ("mercredi", "alarobia", "larobia"),
    "jeudi": ("jeudi", "alakamisy", "kamisy"),
    "vendredi": ("vendredi", "zoma", "joma"),
    "samedi": ("samedi", "sabotsy", "asabotsy"),
    "dimanche": ("dimanche", "alahady", "lahady"),
}
_JOUR = {v: jour for jour, variantes in JOURS.items() for v in variantes}

# « mosquée du vendredi » (mousqué joma) est un lieu, pas un jour
RE_LIEU_JOMA = re.compile(r"\b(mosqu\w*|mousqu\w*)\s+(?:du\s+)?(joma|zoma|vendredi)\b", re.I)

RE_PRIX = re.compile(
    r"(?<![\w\[])(\d+(?:[\s.,]\d{3})*|\d+)\s*(k|mille|mil)?\s*(ariary|ar|fmg)?(?![a-zà-ÿ])", re.I)
RE_GRAMMES = re.compile(r"(?<![\w])(\d+(?:[.,]\d+)?)\s*(kg|g|gr|grammes?)(?![a-zà-ÿ])", re.I)
RE_HEURE = re.compile(r"(?<![\w])([01]?\d|2[0-3])\s*h\s*([0-5]\d)?(?![a-zà-ÿ])", re.I)
RE_NOMBRE = re.compile(r"(?<![\w])(\d+)(?![\w])")  # « 2,3,4 » = liste ; « mora2 » ignoré  # « mora2 », « lava2 » ne comptent pas

_T = r"(?:xxl|xl|xs|s|m|l)"
RE_TAILLE_MAJ = re.compile(r"(?<![\w'’])(XXL|XL|XS|S|M|L)(?![\w'’])")
RE_TAILLE_APRES = re.compile(rf"taille\s+({_T}(?:\s*(?:et|ou|n|sa|,|/|-)\s*{_T})*)\b", re.I)


def _sans_accents(t: str) -> str:
    return unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()


def _effacer(texte: str, m: re.Match) -> str:
    """Remplace la partie trouvée par des espaces, pour ne pas la compter deux fois."""
    return texte[: m.start()] + " " * (m.end() - m.start()) + texte[m.end():]


# Normalisation : « x3 » -> « × 3 » ; « 50 ou 100 g » -> « 50 g ou 100 g » (l'unité vaut pour les deux)
_UNITES = r"kg|g|gr|grammes?|k|mille|mil|ariary|ar|fmg"
_LIEN = r"\s*(?:ou|et|n|ndrk|sa|/|-|à|a)\s*"
RE_ENUM = re.compile(
    rf"(?<![\w])(\d+)(?={_LIEN}\d+(?:[\s.,]\d{{3}})*\s*({_UNITES})(?![a-zà-ÿ]))", re.I)


def _normaliser(texte: str) -> str:
    texte = re.sub(r"(?<![\w])[x×]\s*(\d+)", r"× \1", texte)
    while True:
        nouveau = RE_ENUM.sub(lambda m: f"{m.group(1)} {m.group(2)}", texte)
        if nouveau == texte:
            return texte
        texte = nouveau


def extraire_faits(texte: str) -> dict:
    """Renvoie les faits d'un texte, sous une forme comparable entre français et côtier.

    Exemple : « Le short est à 25 000 Ar, taille S, vendredi à 14h30 »
    -> {"prix": {25000}, "tailles": {"S"}, "jours": {"vendredi"}, "heures": {"14:30"}, ...}
    """
    faits = {"prix": set(), "grammes": set(), "tailles": set(),
             "jours": set(), "heures": set(), "nombres": set()}
    reste = _normaliser(texte.replace("[prix]", " "))

    # 1) Grammes et kilos (avant les prix, pour que « 300g » ne devienne pas un prix)
    for m in list(RE_GRAMMES.finditer(reste)):
        valeur = float(m.group(1).replace(",", "."))
        faits["grammes"].add(int(valeur * 1000) if m.group(2).lower() == "kg" else int(valeur))
        reste = _effacer(reste, m)

    # 2) Heures : 8h30, 14 h 30, 14h -> "08:30", "14:30", "14:00"
    for m in list(RE_HEURE.finditer(reste)):
        faits["heures"].add(f"{int(m.group(1)):02d}:{int(m.group(2) or 0):02d}")
        reste = _effacer(reste, m)

    # 3) Prix : il faut un multiplicateur (mille, k) ou une monnaie (Ar, FMG)
    for m in list(RE_PRIX.finditer(reste)):
        nombre, mult, monnaie = m.group(1), m.group(2), m.group(3)
        if not mult and not monnaie:
            continue
        valeur = int(re.sub(r"[\s.,]", "", nombre))
        if mult:
            valeur *= 1000
        if monnaie and monnaie.lower() == "fmg":
            valeur //= 5                       # 5 FMG = 1 Ariary
        faits["prix"].add(valeur)
        reste = _effacer(reste, m)

    # 4) Tailles : en majuscules (XS, S, M…) ou en minuscules après « taille »
    faits["tailles"] |= set(RE_TAILLE_MAJ.findall(reste))
    for m in RE_TAILLE_APRES.finditer(reste):
        faits["tailles"] |= {t.upper() for t in re.findall(_T, m.group(1), re.I)}

    # 5) Jours (on retire d'abord « mosquée joma », qui est un lieu)
    for mot in re.findall(r"[a-z]+", _sans_accents(RE_LIEU_JOMA.sub(" ", reste))):
        if mot in _JOUR:
            faits["jours"].add(_JOUR[mot])

    # 6) Les nombres qui restent : quantités, jours de délai, dates…
    faits["nombres"] = {int(n) for n in RE_NOMBRE.findall(reste)}
    return faits


# ── Brique 2 : comparer les faits du sens et de la réponse ──────────────────
STRICTS = ("prix", "grammes", "tailles", "jours", "heures")

# En SMS, l'unité est souvent omise ou collée : « 45000 araik », « 7000ara », « 3j ».
# Ces montants écrits servent seulement à TOLÉRER un prix ou un nombre du sens écrit sans unité ;
# un prix marqué (Ar, k, mille) absent du sens reste « inventé ». « mora2 » ne compte toujours pas.
RE_MONTANT = re.compile(r"(?<![\w])(\d{1,3}(?:[\s.,]\d{3})+|\d+)")


def _montants(texte: str) -> set[int]:
    """Tous les montants écrits dans le texte, avec ou sans unité, même collés à un mot."""
    return {int(re.sub(r"[\s.,]", "", m)) for m in RE_MONTANT.findall(_normaliser(texte.replace("[prix]", " ")))}
_NOM = {"prix": "prix", "grammes": "grammage", "tailles": "taille",
        "jours": "jour", "heures": "heure", "nombres": "nombre"}


def verifier(sens: str, reponse: str) -> list[str]:
    """Liste des problèmes entre le sens et la réponse (liste vide = tout est bon).

    - Prix, grammes, tailles, jours, heures : mêmes faits exactement
      (rien de manquant, rien d'inventé).
    - Un prix du sens peut être écrit sans unité dans la réponse (« 45000 araik ») : même montant = présent.
    - Nombres simples : la réponse ne doit pas en perdre (elle peut en ajouter ; « 3j » vaut 3).
    """
    a, b = extraire_faits(sens), extraire_faits(reponse)
    ecrits = _montants(reponse)
    problemes = []
    for cat in STRICTS:
        manquants = a[cat] - b[cat] - (ecrits if cat == "prix" else set())
        problemes += [f"{_NOM[cat]} manquant : {x}" for x in sorted(manquants, key=str)]
        problemes += [f"{_NOM[cat]} inventé : {x}" for x in sorted(b[cat] - a[cat], key=str)]
    problemes += [f"nombre manquant : {x}" for x in sorted(a["nombres"] - b["nombres"] - ecrits)]
    return problemes
