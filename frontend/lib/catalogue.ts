// lib/catalogue.ts — mêmes listes que backend/services/catalogue.py (vérifié par backend/tests/test_catalogue.py).
export const FAMILLES = ["Rouge", "Rose", "Orange", "Jaune", "Or", "Vert", "Bleu", "Violet", "Marron", "Beige", "Naturel", "Blanc", "Gris", "Noir", "Multicolore"] as const;
export const TYPES_ARTICLE = ["Robe", "Maillot", "Ensemble", "Jupe", "Short", "Haut", "Sac", "Pochette", "Chapeau", "Fil", "Matériel", "Accessoire"] as const;
export const LIBELLES_TYPE: Record<string, string> = {"Robe": "Robes", "Maillot": "Maillots", "Ensemble": "Ensembles", "Jupe": "Jupes", "Short": "Shorts", "Haut": "Hauts", "Sac": "Sacs", "Pochette": "Pochettes", "Chapeau": "Chapeaux", "Fil": "Fils", "Matériel": "Matériel", "Accessoire": "Accessoires"};
