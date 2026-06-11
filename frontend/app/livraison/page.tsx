import type { Metadata } from "next";
import PageLivraison from "./PageLivraison";

// Pas de revalidate = SSG pur
export const metadata: Metadata = {
  title: "Livraison & Retours | Art Jatie Boutique",
  description:
    "Livraison depuis Nosy Be vers toute Madagascar et l'international. Politique de retours sous 2 jours. Paiement sécurisé MVola & Orange Money.",
  openGraph: {
    title: "Livraison & Retours | Art Jatie Boutique",
    description:
      "Zones de livraison, tarifs et politique de retours d'Art Jatie Boutique.",
    url: "https://artjatie.com/livraison",
    siteName: "Art Jatie Boutique",
    type: "website",
  },
};

export default function Page() {
  return <PageLivraison />;
}