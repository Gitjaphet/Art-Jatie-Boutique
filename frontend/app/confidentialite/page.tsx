// app/confidentialite/page.tsx
import type { Metadata } from "next";
import PageConfidentialite from "./PageConfidentialite";

export const metadata: Metadata = {
  title: "Politique de Confidentialité | Art Jatie Boutique",
  description:
    "Découvrez comment Art Jatie collecte, utilise et protège vos données personnelles : commandes, livraison, paiement, cookies et vos droits RGPD.",
  alternates: {
    canonical: "https://artjatie.com/confidentialite",
  },
  openGraph: {
    title: "Politique de Confidentialité | Art Jatie Boutique",
    description:
      "Comment Art Jatie protège vos données personnelles lors de vos achats en ligne.",
    url: "https://artjatie.com/confidentialite",
    siteName: "Art Jatie Boutique",
    type: "website",
    images: [
      {
        url: "https://artjatie.com/images/hero/art-jatie-plage.jpeg",
        width: 1200,
        height: 630,
        alt: "Art Jatie Boutique",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Politique de Confidentialité | Art Jatie Boutique",
    description: "Comment Art Jatie protège vos données personnelles.",
    images: ["https://artjatie.com/images/hero/art-jatie-plage.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <PageConfidentialite />;
}