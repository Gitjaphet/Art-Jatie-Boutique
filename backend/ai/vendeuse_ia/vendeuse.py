"""
ai/vendeuse_ia/vendeuse.py — la vendeuse IA (brique 3) : comprend, appelle ses outils, répond.

Consigne : ai/prompts/vendeuse.txt (parties {…} remplacées par leur nom, les accolades JSON restent intactes).
Faits : uniquement les outils (ai/vendeuse_ia/outils.py). Ton : les exemples réels d'Art Jatie.
Panne du modèle -> None : l'ancienne Jatie répond, la conversation ne casse jamais.
"""
import json
import logging
import re
from pathlib import Path

from ai.core.llm import ModeleIndisponible, appeler_llm
from ai.exemples.recherche import trouver_exemples
from ai.recherche.lexique import DIALECTE
from ai.vendeuse_ia.outils import OUTILS, executer
from services.commandes import LIBELLES_ZONE
from services.contact import WHATSAPP

CONSIGNE = (Path(__file__).resolve().parents[1] / "prompts" / "vendeuse.txt").read_text(encoding="utf-8")
SEUIL_EXEMPLE = 0.65   # calibré le 08/11/2026 : même sujet >= 0.65, hors sujet <= 0.57
MAX_TOURS = 3          # appels d'outils avant la réponse finale
HISTORIQUE = 4         # derniers messages transmis
MAX_PRODUITS, MAX_SUGGESTIONS = 3, 3

# Ton d'Art Jatie, tiré des vraies conversations (sans prix ni stock) : toujours présent
EXEMPLES_TON = [
    ("Bonjour, mbola mandray mpianatra ve ?", "Bonjour oui mbol mandray mpianatra zahay belle"),
    ("Tsy mifidy andro fa misy fampianarana isanandro ?", "Anw no mifidy Andro ianaranw belle"),
    ("Misy question tiako atao directe", "Ya alifaso question anw belle"),
]


def _lexique() -> str:
    return ", ".join(f"{abrege} = {mot}" for abrege, mot in sorted(DIALECTE.items()))


def _memoire(fiche: dict | None, produits: list[dict]) -> str:
    f, noms = fiche or {}, {p["id"]: p["nom"] for p in produits}
    lignes = []
    if f.get("types"):
        lignes.append("Elle cherche : " + ", ".join(f["types"]))
    if f.get("couleurs"):
        lignes.append("Couleurs voulues : " + ", ".join(f["couleurs"]))
    if f.get("tailles"):
        lignes.append("Tailles : " + ", ".join(f["tailles"]))
    if f.get("budget_max"):
        lignes.append(f"Budget maximum : {f['budget_max']} Ar")
    if f.get("zone"):
        lignes.append("Livraison : " + LIBELLES_ZONE.get(f["zone"], f["zone"]))
    montres = [f"{noms[i]} (id {i})" for i in f.get("montres") or [] if i in noms]
    if montres:
        lignes.append("Modèles déjà montrés : " + " ; ".join(montres))
    return "\n".join(lignes) or "Rien pour l'instant."


def _exemples(message: str) -> str:
    proches = [(e["cliente"], e["reponse"]) for e in trouver_exemples(message) if e["score"] >= SEUIL_EXEMPLE]
    return "\n\n".join(f"Cliente : {c}\nArt Jatie : {r}" for c, r in proches + EXEMPLES_TON)


def consigne(message: str, fiche: dict | None, produits: list[dict]) -> str:
    remplacements = {"{lexique}": _lexique(), "{memoire}": _memoire(fiche, produits),
                     "{exemples}": _exemples(message), "{whatsapp}": WHATSAPP}
    texte = CONSIGNE
    for cle, valeur in remplacements.items():
        texte = texte.replace(cle, valeur)
    return texte


def _ids_vus(resultat: dict) -> set[int]:
    """Les modèles renvoyés par un outil : les seuls que la vendeuse peut montrer."""
    fiches = resultat.get("exacts", []) + resultat.get("proches", []) + ([resultat] if "id" in resultat else [])
    return {f["id"] for f in fiches}


def _lire(contenu: str, vus: set[int]) -> dict:
    """Réponse finale : le JSON demandé ; à défaut, le texte seul. Jamais d'id inventé."""
    m = re.search(r"\{.*\}", contenu or "", re.S)
    try:
        r = json.loads(m.group(0)) if m else {}
    except ValueError:
        r = {}
    texte = str(r.get("texte") or "").strip() if isinstance(r, dict) and r else (contenu or "").strip()
    produits = [i for i in (r.get("produits") or []) if isinstance(i, int) and i in vus][:MAX_PRODUITS] if r else []
    suggestions = [str(s)[:40] for s in (r.get("suggestions") or []) if str(s).strip()][:MAX_SUGGESTIONS] if r else []
    return {"texte": texte, "produits": produits, "suggestions": suggestions}


def repondre(message: str, history: list | None, fiche: dict | None, produits: list[dict],
             token_log: list | None = None) -> dict | None:
    """{"texte", "produits", "suggestions"} ou {"commander": id} ; None si le modèle est indisponible."""
    echanges = [{"role": m["role"], "content": m.get("content") or ""}
                for m in (history or [])[-HISTORIQUE:] if m.get("role") in ("user", "assistant")]
    messages = [{"role": "system", "content": consigne(message, fiche, produits)}, *echanges,
                {"role": "user", "content": message}]
    vus: set[int] = set()
    try:
        for tour in range(MAX_TOURS + 1):
            dernier = tour == MAX_TOURS  # dernier tour : réponse obligatoire, sans outil
            res = appeler_llm("vendeuse", messages, max_tokens=700, token_log=token_log, temperature=0.3,
                              tools=None if dernier else OUTILS, tool_choice=None if dernier else "auto")
            if dernier or not res.get("tool_calls"):
                reponse = _lire(res["contenu"], vus)
                return reponse if reponse["texte"] else None
            messages.append({"role": "assistant", "content": res["contenu"] or "", "tool_calls": res["tool_calls"]})
            for appel in res["tool_calls"]:
                resultat = executer(appel["function"]["name"], appel["function"].get("arguments"), produits)
                logging.info(f"[VENDEUSE-IA] outil {appel['function']['name']} -> {str(resultat)[:120]}")
                if resultat.get("action") == "commander":
                    return {"commander": resultat["produit_id"]}
                vus |= _ids_vus(resultat)
                messages.append({"role": "tool", "tool_call_id": appel["id"],
                                 "content": json.dumps(resultat, ensure_ascii=False)})
    except ModeleIndisponible:
        logging.error("[VENDEUSE-IA] modèle indisponible : l'ancienne Jatie répond")
    return None
