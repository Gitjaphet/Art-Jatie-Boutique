// lib/catalogue.ts — mêmes listes que backend/services/catalogue.py (vérifié par backend/tests/test_catalogue.py).
export const FAMILLES = ["Rouge", "Rose", "Orange", "Jaune", "Or", "Vert", "Bleu", "Violet", "Marron", "Beige", "Naturel", "Blanc", "Gris", "Noir", "Multicolore"] as const;
export const TYPES_ARTICLE = ["Ensemble", "Robe", "Jupe", "Short", "Haut", "Maillot", "Sac", "Pochette", "Chapeau", "Accessoire"] as const;
export const LIBELLES_TYPE: Record<string, string> = {"Ensemble": "Ensembles", "Robe": "Robes", "Jupe": "Jupes", "Short": "Shorts", "Haut": "Hauts", "Maillot": "Maillots", "Sac": "Sacs", "Pochette": "Pochettes", "Chapeau": "Chapeaux", "Accessoire": "Accessoires"};
