import type { Metadata } from "next";
import GuideDesTailles from "./GuidePage";

export const metadata: Metadata = {
  title: "Guide des Tailles | Art Jatie Boutique",
  description:
    "Trouvez votre taille idéale pour nos vêtements et maillots de bain en crochet fait main. Guide de mensurations complet pour sublimer votre silhouette.",
  openGraph: {
    title: "Guide des Tailles | Art Jatie",
    description:
      "Apprenez à prendre vos mensurations et trouvez la taille parfaite pour vos créations Art Jatie sur mesure.",
    url: "https://artjatie.com/guide-des-tailles",
    siteName: "Art Jatie Boutique",
    type: "website",
  },
};

export default function GuideRoute() {
  return <GuideDesTailles />;
}