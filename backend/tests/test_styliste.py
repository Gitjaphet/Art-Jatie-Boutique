"""Le styliste : version côtière seulement si la cliente écrit en malgache ET si les faits survivent."""
import pytest

from ai.core.llm import ModeleIndisponible
from ai.vendeuse_ia import styliste

SENS = "Oui, il en reste un à 45 000 Ar, livraison jeudi."
FIDELE = "Ya belle mbol misy araik 45 000 Ar, livraison alakamisy"
SANS_PRIX = "Ya belle mbol misy araik, livraison alakamisy"


def _simuler(monkeypatch, reponses: list) -> list:
    """Le modèle renvoie ces réponses dans l'ordre (une exception est levée) ; on garde les messages reçus."""
    appels = []

    def faux_llm(role, messages, **kwargs):
        appels.append({"role": role, "messages": messages})
        r = reponses[len(appels) - 1]
        if isinstance(r, Exception):
            raise r
        return {"contenu": r}

    monkeypatch.setattr(styliste, "appeler_llm", faux_llm)
    return appels


def test_francais_inchange_sans_appel(monkeypatch):
    appels = _simuler(monkeypatch, [])
    assert styliste.mettre_en_style(SENS, "Bonjour, il reste le sac ?", "fr") == SENS
    assert appels == []


def test_malgache_fidele_devient_cotier(monkeypatch):
    appels = _simuler(monkeypatch, [FIDELE])
    assert styliste.mettre_en_style(SENS, "Mbola misy ve ?", "mg") == FIDELE
    assert appels[0]["role"] == "styliste"


def test_format_identique_a_l_entrainement(monkeypatch):
    appels = _simuler(monkeypatch, [FIDELE])
    styliste.mettre_en_style(SENS, "Mbola misy ve ?", "mg")
    assert appels[0]["messages"] == [
        {"role": "user", "content": f"Cliente : Mbola misy ve ?\nSens à exprimer : {SENS}"}]


def test_bloc_think_retire(monkeypatch):
    _simuler(monkeypatch, [f"<think>\n\n</think>\n\n{FIDELE}"])
    assert styliste.mettre_en_style(SENS, "Mbola misy ve ?", "mg") == FIDELE


def test_fait_perdu_puis_nouvel_essai_fidele(monkeypatch):
    appels = _simuler(monkeypatch, [SANS_PRIX, FIDELE])
    assert styliste.mettre_en_style(SENS, "Mbola misy ve ?", "mg") == FIDELE
    assert len(appels) == 2


def test_deux_essais_refuses_gardent_l_original(monkeypatch):
    appels = _simuler(monkeypatch, [SANS_PRIX, SANS_PRIX])
    assert styliste.mettre_en_style(SENS, "Mbola misy ve ?", "mg") == SENS
    assert len(appels) == 2


def test_reponse_vide_refusee(monkeypatch):
    _simuler(monkeypatch, ["<think></think>", "   "])
    assert styliste.mettre_en_style(SENS, "Mbola misy ve ?", "mg") == SENS


def test_ollama_indisponible_garde_l_original(monkeypatch):
    _simuler(monkeypatch, [ModeleIndisponible("ollama éteint")])
    assert styliste.mettre_en_style(SENS, "Mbola misy ve ?", "mg") == SENS


@pytest.mark.parametrize("texte", ["", "   ", " ".join(["mot"] * 61)])
def test_vide_ou_trop_long_inchange_sans_appel(monkeypatch, texte):
    appels = _simuler(monkeypatch, [])
    assert styliste.mettre_en_style(texte, "Mbola misy ve ?", "mg") == texte
    assert appels == []


# ── « Ar » remis derrière les prix (corrections de Japhet du 13/11/2026) ────────
@pytest.mark.parametrize("sens, reponse, attendu", [
    ("Le sac rouge coûte 45 000 Ar.", "Sac rouge nazy io 45 000 araik belle", "Sac rouge nazy io 45 000Ar araik belle"),
    ("La pelote 50 g est à 7 000 Ar.", "Ya belle pelote 50g 7000 araik", "Ya belle pelote 50g 7000Ar araik"),
    ("La formation en ligne coûte 100 000 Ar.", "Formation en ligne 100 000", "Formation en ligne 100 000Ar"),
    ("À partir de 40 000 Ar.", "a partir nazy 40 000Ar belle", "a partir nazy 40 000Ar belle"),   # déjà marqué
    ("La robe coûte 65 000 Ar.", "Ya dispo 65k aro", "Ya dispo 65k aro"),                           # « k » = unité
    ("La pelote est à 7 000 Ar.", "Pelote 7000ara izio", "Pelote 7000ara izio"),                    # collé : intact
    ("Livraison 10 000 Ar, sous 2 jours.", "Livraison 10 000 belle 2 jours", "Livraison 10 000Ar belle 2 jours"),
])
def test_ariary_remis_derriere_les_prix(sens, reponse, attendu):
    assert styliste._ajouter_ariary(sens, reponse) == attendu


def test_mettre_en_style_remet_ariary(monkeypatch):
    _simuler(monkeypatch, ["Sac rouge nazy io 45 000 araik belle"])
    sortie = styliste.mettre_en_style("Le sac rouge coûte 45 000 Ar.", "Ohatrinona ?", "mg")
    assert sortie == "Sac rouge nazy io 45 000Ar araik belle"
