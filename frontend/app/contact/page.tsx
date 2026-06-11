import type { Metadata } from "next";
import ContactPage from "./ContactPage";

// Pas de revalidate = SSG pur, généré une fois au build
export const metadata: Metadata = {
  title: "Contactez-nous | Art Jatie Boutique",
  description:
    "Contactez l'atelier Art Jatie à Nosy Be, Madagascar. Commandes sur mesure, questions sur nos collections crochet artisanales, livraison et partenariats.",
  openGraph: {
    title: "Contactez-nous | Art Jatie Boutique",
    description:
      "Atelier crochet artisanal à Nosy Be, Madagascar. Réponse sous 24h.",
    url: "https://artjatie.com/contact",
    siteName: "Art Jatie Boutique",
    type: "website",
  },
};

export default function Page() {
  return <ContactPage />;
}