// Tarifs formation crochet — source unique pour la page et le SEO.
export const PRIX_FORMATION_COMPLETE = 80000;
export const PRIX_MODULE = 8000;
export const PRIX_MODULE_PROMO = 5000;
export const PRIX_SEANCE = 3000;

// Promo module valable pour toute inscription jusqu'au 06/11/2026 inclus (heure de Madagascar)
export const FIN_PROMO_MODULE = new Date("2026-11-07T00:00:00+03:00");
export const DEBUT_SESSION = "7 novembre 2026";

export function promoModuleActive(now: Date = new Date()): boolean {
  return now < FIN_PROMO_MODULE;
}

export function prixModule(now: Date = new Date()): number {
  return promoModuleActive(now) ? PRIX_MODULE_PROMO : PRIX_MODULE;
}

export function formatAr(n: number): string {
  return `${n.toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ")} Ar`;
}
