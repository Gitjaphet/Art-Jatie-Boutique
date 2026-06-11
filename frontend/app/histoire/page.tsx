import type { Metadata } from "next";
import HistoirePage from "./HistoirePage";

// Définition des métadonnées pour un SEO optimal
export const metadata: Metadata = {
  title: "Notre Histoire & Savoir-Faire | Art Jatie",
  description:
    "Découvrez l'histoire d'Art Jatie, une marque née d'une passion pour le crochet et l'artisanat malgache. Des créations faites main, authentiques et durables.",
  openGraph: {
    title: "L'Histoire d'Art Jatie | Artisanat Malgache",
    description:
      "Chaque maille raconte une histoire. Plongez dans les valeurs, le processus de création et l'univers de notre fondatrice BEVAO Noeline Jennita.",
    url: "https://artjatie.com/histoire",
    siteName: "Art Jatie Boutique",
    images: [
      {
        url: "/images/hero/art-jatie-plage.png", // Image mise en avant lors du partage sur les réseaux
        width: 1200,
        height: 630,
        alt: "Collection Art Jatie",
      },
    ],
    type: "website",
  },
};

export default function HistoireRoute() {
  // On appelle le composant client qui contient les animations
  return <HistoirePage />;
}