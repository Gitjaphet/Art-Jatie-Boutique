import type { Metadata } from "next";
import PageMentionsLegales from "./PageMentionsLegales";

// Définition des métadonnées pour le SEO
export const metadata: Metadata = {
  title: "Mentions Légales | Art Jatie Boutique",
  description:
    "Informations légales, éditeur, hébergement et politique de propriété intellectuelle du site Art Jatie. Conformité avec le droit malgache.",
  openGraph: {
    title: "Mentions Légales | Art Jatie",
    description:
      "Consultez les mentions légales et les conditions d'utilisation du site Art Jatie Boutique.",
    url: "https://artjatie.com/mentions-legales",
    siteName: "Art Jatie Boutique",
    type: "website",
  },
  // Tu peux aussi ajouter des balises spécifiques pour les robots si besoin
  robots: {
    index: true,
    follow: true,
  },
};

export default function MentionsLegalesRoute() {
  // Rendu de ton composant purement statique
  return <PageMentionsLegales />;
}