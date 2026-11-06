from pathlib import Path

from services.contact import TELEPHONE, WHATSAPP

RACINE = Path(__file__).resolve().parents[2]


def test_coordonnees_identiques_au_frontend():
    front = (RACINE / "frontend" / "lib" / "contact.ts").read_text(encoding="utf-8")
    assert f'const WHATSAPP = "{WHATSAPP}";' in front
    assert f'const TELEPHONE = "{TELEPHONE}";' in front


def test_aucun_numero_ecrit_en_dur_dans_l_ia():
    fautifs = [str(p) for p in (RACINE / "backend" / "ai").rglob("*.py")
               if WHATSAPP in p.read_text(encoding="utf-8") or TELEPHONE in p.read_text(encoding="utf-8")]
    assert not fautifs, f"Numéro écrit en dur (utiliser services.contact) : {fautifs}"
