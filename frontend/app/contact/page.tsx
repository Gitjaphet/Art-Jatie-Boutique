import type { Metadata } from "next";
import ContactPage from "./ContactPage";

// Pas de revalidate = SSG pur, généré une fois au build
export const metadata: Metadata = {
  title: "Contactez-nous | Art Jatie Boutique",
  description:
    "Contactez l'atelier Art Jatie à Nosy Be, Madagascar. Commandes sur mesure, questions sur nos collections crochet artisanales, livraison et partenariats.",
  alternates: {
    canonical: "https://artjatie.com/contact",
  },
  openGraph: {
    title: "Contactez-nous | Art Jatie Boutique",
    description:
      "Atelier crochet artisanal à Nosy Be, Madagascar. Réponse sous 24h.",
    url: "https://artjatie.com/contact",
    siteName: "Art Jatie Boutique",
    type: "website",
    images: [
      {
        url: "https://artjatie.com/og-contact.jpg",
        width: 1200,
        height: 630,
        alt: "Art Jatie - Atelier crochet artisanal Nosy Be",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contactez-nous | Art Jatie Boutique",
    description: "Atelier crochet artisanal à Nosy Be, Madagascar.",
    images: ["https://artjatie.com/art-jatie-plage.jpeg"],
  },
};

export default function Page() {
  return <ContactPage />;
}