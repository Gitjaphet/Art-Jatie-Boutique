import pytest

from services.catalogue import FAMILLES, TYPES_ARTICLE, deviner_type, familles, familles_de

# Les 37 couleurs réelles de la table Color (relevées en production le 06/11/2026)
COULEURS_BASE = [
    "Rouge", "Marron", "Jaune", "Orange", "Rose", "Blanc", "Corail", "Saumon", "Kaki", "Olive",
    "Vert Olive", "Moutarde", "Jaune doré", "Noir", "Vert", "Vert vif", "Vert émeraude", "Beige",
    "Naturel", "Écru", "Rose poudre", "Saumon clair", "Caramel", "Marron doré", "Violet",
    "Corail / rose saumon", "blanc-gris", "Rose Magenta", "rouge orangé", "Marron chocolat",
    "rose vif", "Rose corail", "Rose fuchsia", "Rose framboise", "Beige nude", "Blanc Rayé", "Bleu",
]


@pytest.mark.parametrize("couleur", COULEURS_BASE)
def test_chaque_couleur_reelle_a_une_famille(couleur):
    assert familles_de(couleur), f"« {couleur} » n'appartient à aucune famille"


@pytest.mark.parametrize("couleur, attendues", [
    ("Rose fuchsia", ["Rose"]),
    ("rouge orangé", ["Rouge", "Orange"]),
    ("Corail", ["Rose", "Orange"]),
    ("Jaune doré", ["Jaune", "Or"]),
    ("Caramel", ["Marron", "Beige"]),
    ("blanc-gris", ["Blanc", "Gris"]),
    ("Écru", ["Naturel", "Blanc"]),
    ("Rose bonbon", ["Rose"]),  # couleur future, rangée sans toucher au code
])
def test_familles_d_une_couleur(couleur, attendues):
    assert familles_de(couleur) == attendues


def test_familles_produit_ordre_et_sans_doublon():
    assert familles("Rose,Blanc Rayé") == ["Rose", "Blanc"]
    assert familles("Rose framboise,rose vif") == ["Rose"]


def test_multicolore_a_partir_de_trois_familles():
    assert "Multicolore" in familles("Jaune,Noir,Vert,Rouge")
    assert "Multicolore" not in familles("Vert,Blanc")


def test_familles_vides():
    assert familles("") == [] and familles(None) == []


@pytest.mark.parametrize("nom, categorie, attendu", [
    ("Robe Crochet Sirène Rayée Corail & Blanc", "TENUES", "Robe"),
    ("Robe Rayée & Sac Assorti", "TENUES", "Robe"),
    ("Ensemble Robe & Chapeau Rose", "TENUES", "Ensemble"),
    ("Ensemble Brassière Jupe Crochet", "TENUES", "Ensemble"),
    ("Short Crochet Rayé Rose & Blanc", "TENUES", "Short"),
    ("Bas String Ficelle Nude", "TENUES", "Maillot"),
    ("Pochette Soleil", "ACCESSOIRES", "Pochette"),
    ("Création Soleil", "ACCESSOIRES", "Accessoire"),
    ("Création Soleil", "TENUES", None),
])
def test_deviner_type(nom, categorie, attendu):
    assert deviner_type(nom, categorie) == attendu


def test_listes_fermees():
    assert "Multicolore" in FAMILLES and "Accessoire" in TYPES_ARTICLE
    assert len(set(FAMILLES)) == len(FAMILLES) and len(set(TYPES_ARTICLE)) == len(TYPES_ARTICLE)


def test_valider_type():
    from services.catalogue import valider_type
    assert valider_type("Robe") == "Robe"
    assert valider_type(" Sac ") == "Sac"
    assert valider_type("") is None and valider_type(None) is None
    with pytest.raises(ValueError):
        valider_type("Pantalon")


def test_frontend_aligne_sur_le_catalogue():
    import json
    import re
    from pathlib import Path
    racine = Path(__file__).resolve().parents[2] / "frontend"
    lib = (racine / "lib" / "catalogue.ts").read_text(encoding="utf-8")
    assert f"export const FAMILLES = {json.dumps(list(FAMILLES), ensure_ascii=False)} as const;" in lib
    assert f"export const TYPES_ARTICLE = {json.dumps(list(TYPES_ARTICLE), ensure_ascii=False)} as const;" in lib
    pastilles = (racine / "components" / "Boutique" / "SidebarFilters.tsx").read_text(encoding="utf-8")
    sans_pastille = [f for f in FAMILLES if not re.search(rf"\b{f}\s*:", pastilles)]
    assert not sans_pastille, f"Famille sans pastille dans COLOR_MAP : {sans_pastille}"
