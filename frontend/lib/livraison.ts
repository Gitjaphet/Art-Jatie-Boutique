// lib/livraison.ts — SOURCE UNIQUE côté site des tarifs de livraison (panier + page Livraison).
// Les montants DOIVENT rester égaux à FRAIS_LIVRAISON de backend/services/commandes.py (vérifié par test) :
// le serveur recalcule toujours le vrai montant, ce fichier sert à l'affichage.
export const FRAIS_LIVRAISON = {
  tana: 0,
  nosybe_ville: 0,
  darsalam: 8000,
  dzamanjar: 10000,
  nosybe_autre: 0,
  hors_nosybe: 0,
} as const;

export const ZONES_LIBELLES = {
  darsalam: "Nosy Be — Darsalam, Ambatoloaka, Madirokely",
  dzamanjar: "Nosy Be — Dzamanjar",
} as const;

export const formatPrixAr = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n)} Ar`;
