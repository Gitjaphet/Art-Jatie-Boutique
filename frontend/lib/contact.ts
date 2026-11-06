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
  adresse: "Seganinga, Nosy Be, Madagascar",
  site: "artjatie.com",
} as const;

// Délais en jours — SOURCE UNIQUE : textes du site ET données Google (fiche produit) en sont déduits.
export const DELAIS = {
  stock: { min: 1, max: 2 },        // préparation d'un article en stock
  fabrication: { min: 7, max: 14 }, // fabrication d'une pièce sur commande, après l'avance
} as const;
export const DELAI_TRAITEMENT = `${DELAIS.stock.min * 24} à ${DELAIS.stock.max * 24} h`;   // « 24 à 48 h »
export const DELAI_FABRICATION = `${DELAIS.fabrication.min} à ${DELAIS.fabrication.max} jours`;

// Lien WhatsApp AVEC message prérempli (texte normal, encodé ici — jamais à la main).
// Adresse FINALE de WhatsApp (/send/ + type + app_absent) : aucune redirection, donc aucun emoji cassé (�).
// wa.me et /send (sans « / ») redirigent, et la redirection abîme les emojis sur ordinateur.
export const lienWhatsApp = (message: string) =>
  `https://api.whatsapp.com/send/?phone=${international(WHATSAPP)}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
