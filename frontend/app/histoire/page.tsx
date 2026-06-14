import type { Metadata } from "next";
import HistoirePage from "./HistoirePage";

// Définition des métadonnées pour un SEO optimal
export const metadata: Metadata = {
  title: "Notre Histoire | Art Jatie — Crochet Artisanal Nosy Be, Madagascar",
  description:
    "Découvrez l'histoire d'Art Jatie, née à Nosy Be, Madagascar. Créations crochet faites main par nos artisanes malgaches. Tenues, sacs et maillots uniques depuis 2023.",
  openGraph: {
    title: "L'Histoire d'Art Jatie | Crochet Artisanal Nosy Be",
    description:
      "Chaque maille raconte une histoire. L'univers d'Art Jatie, atelier de crochet à Seganinga, Nosy Be — fondé par BEVAO Noeline Jennita.",
    url: "https://www.artjatie.com/histoire",
    siteName: "Art Jatie Boutique",
    images: [
      {
        url: "/images/hero/art-jatie-plage.png",
        width: 1200,
        height: 630,
        alt: "Art Jatie — Atelier de crochet artisanal à Nosy Be, Madagascar",
      },
    ],
    type: "website",
  },
};

export default function HistoireRoute() {
  // On appelle le composant client qui contient les animations
  return <HistoirePage />;
}