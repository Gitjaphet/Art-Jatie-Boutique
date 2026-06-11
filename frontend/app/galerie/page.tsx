import { getAllProducts } from "../../lib/api";
import GalerieClient from "./GalerieClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galerie — Créations Crochet Artisanal | Art Jatie Madagascar",
  description:
    "Explorez toutes nos créations en crochet fait main : tenues, maillots, accessoires et collections enfant. Inspirations et téléchargements disponibles.",
};

export const revalidate = 300;

export default async function GaleriePage() {
  const products = await getAllProducts();
  return <GalerieClient products={products} />;
}