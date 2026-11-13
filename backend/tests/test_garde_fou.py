"""Garde-fou de la vendeuse IA : les faits (prix, grammes, tailles, jours, heures)
du sens doivent se retrouver à l'identique dans la réponse en côtier.
Les cas viennent des vrais tests du modèle v3."""
import pytest
from ai.vendeuse_ia.garde_fou import extraire_faits, verifier


@pytest.mark.parametrize("texte, categorie, attendu", [
    ("Le short est à 40mille ar", "prix", {40000}),
    ("40 000ar belle", "prix", {40000}),
    ("Total 66 500 Ar.", "prix", {66500}),
    ("very vola 850mille fmg", "prix", {170000}),          # 5 FMG = 1 Ar
    ("30 ou 35 mille ar", "prix", {30000, 35000}),         # l'unité vaut pour les deux
    ("[prix] belle", "prix", set()),                        # prix masqué : ignoré
    ("Traphilo 300g", "grammes", {300}),
    ("1kg fil à cotton", "grammes", {1000}),
    ("50 n 100g", "grammes", {50, 100}),
    ("Dimanche 14 h 30 – 17h30", "heures", {"14:30", "17:30"}),
    ("Demain 8h belle", "heures", {"08:00"}),
    ("taille xs et s belle", "tailles", {"XS", "S"}),
    ("tailles XS et S", "tailles", {"XS", "S"}),
    ("S'il te plaît", "tailles", set()),                   # « S' » n'est pas une taille
    ("mercredi n io joma", "jours", {"mercredi", "vendredi"}),
    ("Mariny mousqué joma aty", "jours", set()),           # lieu, pas un jour
    ("Traphilo 300g x3", "nombres", {3}),
    ("mora2 lava2 tsikelikely", "nombres", set()),         # « 2 » de répétition côtière
])
def test_extraire_faits(texte, categorie, attendu):
    assert extraire_faits(texte)[categorie] == attendu


@pytest.mark.parametrize("sens, reponse", [
    ("À Senganinga, Hell-Ville, Nosy Be.", "Nosy bé HELL VILLE senganinga belle"),
    ("Le short est à 40mille ar, tailles XS et S.", "40 000ar belle short taille xs et s"),
    ("Je peux t'en préparer 50 ou 100 g.", "Afak agnamboarako 50 n 100g zegn ndrk anw"),
    ("Récapitulatif : Traphilo 300 g × 3 ; total 66 500 Ar.", "Traphilo 300g x3 Total 66500ar belle"),
    ("Je suis près de la mosquée du vendredi.", "Mariny mousqué joma aty belle"),
])
def test_reponse_fidele_passe(sens, reponse):
    assert verifier(sens, reponse) == []


@pytest.mark.parametrize("sens, reponse, probleme", [
    ("Peut-être mercredi ou jeudi.", "Mety mercredi n io joma belle", "jour manquant : jeudi"),
    ("Traphilo 300 g × 3", "Traphilo 200g x3", "grammage inventé : 200"),
    ("Dimanche de 14 h 30 à 17 h 30.", "Dimanche 15h30 jusqu'à 17h30", "heure manquant : 14:30"),
    ("Je peux t'en préparer 50 ou 100 g.", "Afak amboarign 50g ndrk 10o g belle", "grammage manquant : 100"),
    ("Le short est à 40mille ar.", "45mille ar fo belle", "prix inventé : 45000"),
    ("Disponible en taille S.", "Misy taille M belle", "taille manquant : S"),
])
def test_erreur_de_fait_detectee(sens, reponse, probleme):
    assert probleme in verifier(sens, reponse)
