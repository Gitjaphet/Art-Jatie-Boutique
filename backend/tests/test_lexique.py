import pytest

from ai.recherche.lexique import couleurs_citees, langue, mots_message, types_cites


def test_sms_deplie_et_sans_accents():
    assert mots_message("Bjr, vs avez des robe rouge ?") == ["bonjour", "vous", "avez", "des", "robe", "rouge"]
    assert mots_message("jai que 30000 ar")[:3] == ["j", "ai", "que"]


@pytest.mark.parametrize("message, types", [
    ("bjr vs avez des robe rouge ?", ["Robe"]),
    ("salama, misy kitapo mena ve ianareo ?", ["Sac"]),
    ("misy akanjo milomano ve ?", ["Maillot"]),        # expression avant le mot seul
    ("un maillot de bain noir", ["Maillot"]),
    ("des sacs et des chapeaux", ["Sac", "Chapeau"]),  # pluriels
    ("un short taille haute", ["Short"]),               # « haute » n'est pas un « haut »
    ("vous livrez a ambatoloaka ?", []),
])
def test_types_cites(message, types):
    assert types_cites(mots_message(message)) == types


@pytest.mark.parametrize("message, couleurs", [
    ("bjr vs avez des robe rouge ?", ["Rouge"]),
    ("salama, misy kitapo mena ve ianareo ?", ["Rouge"]),
    ("akanjo mavokely", ["Rose"]),                      # pas « mavo » (jaune)
    ("akanjo mavo", ["Jaune"]),
    ("une robe fuchsia ou blanche", ["Rose", "Blanc"]),
    ("en taille M", []),
])
def test_couleurs_citees(message, couleurs):
    assert couleurs_citees(mots_message(message)) == couleurs


@pytest.mark.parametrize("message, attendue", [
    ("salama, misy kitapo mena ve ianareo ?", "mg"),
    ("ohatrinona ity ?", "mg"),
    ("bjr vs avez des robe rouge ?", "fr"),
])
def test_langue(message, attendue):
    assert langue(mots_message(message)) == attendue


# --- Malgache du Nord écrit en abrégé (validé par Art Jatie) ---
def test_dialecte_deplie_en_malgache_standard():
    from ai.recherche.lexique import mots_message
    assert mots_message("zah te angano formation") == ["zaho", "te", "hanao", "formation"]
    assert mots_message("tss rah ay") == ["tsisy", "zavatra", "ay"]
    assert mots_message("ambila fa zah mangefa") == ["avelao", "fa", "zaho", "mandoa"]


def test_dialecte_reconnu_comme_malgache():
    from ai.recherche.lexique import langue, mots_message
    for message in ("zah te angano formation", "afak amaizanw sar zah azafady belle",
                    "zegny ma zeu", "aleko driaby belle", "firy ny sarany ?"):
        assert langue(mots_message(message)) == "mg", message


@pytest.mark.parametrize("message, types", [
    ("misy traphilo bleu ciel ve ?", ["Fil"]),
    ("firy ny milk cotton 200g", ["Fil"]),
    ("otrino vy crochet araiky ?", ["Matériel"]),
    ("Robe Crochet rouge", ["Robe"]),
])
def test_fil_et_materiel_compris(message, types):
    from ai.recherche.lexique import mots_message, types_cites
    assert types_cites(mots_message(message)) == types
