// lib/contact.ts — SOURCE UNIQUE des coordonnées d'Art Jatie.
// Modifier ici met à jour tout le site (et le chatbot à la prochaine indexation).
const WHATSAPP = "034 30 513 60";
const TELEPHONE = "032 02 251 70";

// "034 30 513 60" -> "261343051360" (format international sans le 0)
const international = (numero: string) => "261" + numero.replace(/\s/g, "").replace(/^0/, "");

export const CONTACT = {
  whatsapp: WHATSAPP,
  whatsappLien: `https://wa.me/${international(WHATSAPP)}`,
  telephone: TELEPHONE,
  telephoneLien: `tel:+${international(TELEPHONE)}`,
  email: "jatieart@gmail.com",
  mvola: WHATSAPP,
  orangeMoney: TELEPHONE,
  site: "artjatie.com",
} as const;

export const DELAI_FABRICATION = "7 à 14 jours";
