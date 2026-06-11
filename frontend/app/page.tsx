import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import StatsBar from "@/components/home/StatsBar";
import BubbleGrid from "@/components/home/BubbleGrid";
import VideoSection from "@/components/home/VideoSection";
import Testimonials from "@/components/home/Testimonials";
import BoutiqueSection from "@/components/home/BoutiqueSection";
import WhyUsSection from "@/components/home/WhyUsSection";
import { getProducts } from "@/lib/api";

export const metadata: Metadata = {
  title: "Art Jatie — Crochet Artisanal Fait Main à Madagascar",
  description:
    "Sacs, robes, tenues de plage et maillots en crochet fait main par nos artisanes malgaches. Commandes sur mesure. Livraison dans toute Madagascar.",
};

export const revalidate = 1800; // ISR — revalide toutes les 30 minutes

export default async function HomePage() {
  // Fetch côté serveur — Google voit tout le contenu dans le HTML
  let bubbleProducts: any[] = [];
  let boutiqueProducts: any[] = [];

  try {
    const [inStock, onOrder] = await Promise.all([
      getProducts(false),
      getProducts(true),
    ]);

    // Produits pour BubbleGrid — les 3 "coup de coeur" les plus récents
    const hotProducts = inStock
      .filter((p: any) => p.hot)
      .sort((a: any, b: any) => b.id - a.id)
      .slice(0, 3);

    bubbleProducts = hotProducts.map((p: any, i: number) => {
      const words = p.name.trim().split(" ");
      let baseName = p.name;
      let accentName = "";
      if (words.length > 1) {
        const last = words.pop() || "";
        accentName = last.replace(/\.$/, "") + ".";
        baseName = words.join(" ");
      } else {
        baseName = "";
        accentName = p.name.replace(/\.$/, "") + ".";
      }
      return {
        id: p.id.toString(),
        name: baseName,
        nameAccent: accentName,
        category: p.category || "Sélection",
        desc: p.description || "Une création unique Art Jatie, tissée à la main.",
        price: p.price,
        slug: p.slug,
        image: p.image,
        index: String(i + 1).padStart(3, "0"),
      };
    });

    // Produits pour BoutiqueSection — les coup de coeur en stock + sur commande
    const inStockHot = inStock.filter((p: any) => p.hot || p.is_hot).slice(0, 3);
    const onOrderHot = onOrder.filter((p: any) => p.hot || p.is_hot).slice(0, 3);
    boutiqueProducts = [...inStockHot, ...onOrderHot];

  } catch (error) {
    console.error("Erreur chargement page accueil :", error);
    // En cas d'erreur, les composants afficheront leurs fallbacks
  }

  return (
    <>
      <Header />
      <main>
        <Hero />
        <StatsBar />
        <BubbleGrid products={bubbleProducts} />
        <WhyUsSection />
        <VideoSection />
        <BoutiqueSection products={boutiqueProducts} />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}