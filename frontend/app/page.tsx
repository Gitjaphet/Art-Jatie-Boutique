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

export const revalidate = 1800;

// JSON-LD au niveau module — en dehors de tout
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: "Art Jatie Boutique",
  description:
    "Boutique artisanale de crochet fait main à Nosy Be, Madagascar. Tenues, maillots, accessoires et créations sur mesure.",
  url: "https://www.artjatie.com",
  image: "https://www.artjatie.com/images/logo/art_jatie.png",
  telephone: "+261320225170",
  email: "contact@artjatie.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Seganinga",
    addressLocality: "Nosy Be",
    addressCountry: "MG",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday"],
      opens: "09:00",
      closes: "15:00",
    },
  ],
  sameAs: [
    "https://www.instagram.com/art.jatie",
    "https://www.facebook.com/profile.php?id=61588409926655",
    "https://www.tiktok.com/@jatieart",
    "https://www.youtube.com/@jatiejennestaj.j.e4917",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+261343051360",
    contactType: "customer service",
    contactOption: "WhatsApp",
    availableLanguage: ["fr", "mg"],
  },
};

export default async function HomePage() {
  let bubbleProducts: any[] = [];
  let boutiqueProducts: any[] = [];

  try {
    const [inStock, onOrder] = await Promise.all([
      getProducts(false),
      getProducts(true),
    ]);

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

    boutiqueProducts = [...inStock, ...onOrder]
      .filter((p: any) => p.hot || p.is_hot)
      .sort((a: any, b: any) => b.id - a.id)
      .slice(0, 6);

  } catch (error) {
    console.error("Erreur chargement page accueil :", error);
  }

  // return au niveau HomePage — avec le script JSON-LD
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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