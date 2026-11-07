// Tarifs formation crochet — source unique pour la page et le SEO.
export const PRIX_FORMATION_COMPLETE = 80000;
export const PRIX_MODULE = 8000;
export const PRIX_MODULE_PROMO = 5000;
export const PRIX_SEANCE = 3000;

// Promo module valable pour toute inscription jusqu'au 06/11/2026 inclus (heure de Madagascar)
export const FIN_PROMO_MODULE = new Date("2026-11-07T00:00:00+03:00");
export const PRIX_EN_LIGNE = 100000;

// Libellés partagés par la page, le SEO et Jatie (qui lit la page)
export const FIN_PROMO_TEXTE = "6 novembre 2026";
export const HORAIRE_EN_LIGNE = "12 h – 13 h 30";
export const HORAIRES_SUR_PLACE =
  "lundi, vendredi et samedi de 8 h 30 à 10 h 30 et de 14 h 30 à 17 h, le dimanche de 14 h 30 à 17 h";
export const JOURNEE_CONTINUE = "8 h – 10 h 30, puis 13 h – 16 h";

export function promoModuleActive(now: Date = new Date()): boolean {
  return now < FIN_PROMO_MODULE;
}

export function prixModule(now: Date = new Date()): number {
  return promoModuleActive(now) ? PRIX_MODULE_PROMO : PRIX_MODULE;
}

export function formatAr(n: number): string {
  return `${n.toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ")} Ar`;
}
