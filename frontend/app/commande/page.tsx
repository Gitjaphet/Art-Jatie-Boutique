import type { Metadata } from "next";
import CommandeClient from "./CommandeClient";
import { getProducts, getSettings } from "../../lib/api";
import type { Product } from "../boutique/BoutiqueClient";
import type { SizeItem } from "../../components/Boutique/SidebarFilters";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Crochet sur mesure : bikinis, sacs, tenues de plage | Art Jatie",
  description:
    "Bikinis, tenues de plage, sacs et déco au crochet, faits main à Nosy Be sur commande. Choisissez vos tailles et couleurs. Livraison internationale.",
  alternates: { canonical: "https://www.artjatie.com/commande" },
  openGraph: {
    title: "Crochet sur mesure : bikinis, sacs, tenues de plage | Art Jatie",
    description:
      "Créations au crochet faites main à Nosy Be, sur commande, selon vos tailles et couleurs.",
    url: "https://www.artjatie.com/commande",
    siteName: "Art Jatie Boutique",
    type: "website",
  },
};

function parseSizes(raw?: string): SizeItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        nom: item.nom ?? item.name ?? "",
        genres:
          Array.isArray(item.genres) && item.genres.length > 0
            ? item.genres
            : item.genre
            ? [item.genre]
            : ["Tous"],
      }));
    }
  } catch {
    return raw.split(",").map((s) => ({ nom: s.trim(), genres: ["Tous"] }));
  }
  return [];
}

function mapApiProduct(
  raw: Record<string, unknown>,
  exchangeRate = 4800,
): Product {
  const priceArDisplay = (raw.price as string) ?? "";
  const priceAr = Number(priceArDisplay.replace(/[^0-9]/g, "")) || 0;
  const priceEur = Math.round(priceAr / exchangeRate);

  const oldPriceAr = (raw.oldPrice as string) ?? undefined;
  const oldPriceEur = oldPriceAr
    ? `${Math.round(Number(oldPriceAr.replace(/[^0-9]/g, "")) / exchangeRate)} €`
    : undefined;

  const colors = Array.isArray(raw.colorsArray)
    ? (raw.colorsArray as string[])
    : [];
  const sizes = Array.isArray(raw.sizesArray)
    ? (raw.sizesArray as string[])
    : [];

  return {
    id: Number(raw.id),
    name: (raw.name as string) ?? "",
    slug: (raw.slug as string) ?? "",
    description: (raw.description as string) ?? undefined,
    tag: (raw.tag as string) ?? "",
    genre: ((raw.genre as string) ?? "Femme") as Product["genre"],
    category: ((raw.category as string) ?? "TENUES") as Product["category"],
    priceAr,
    priceArDisplay,
    priceEur,
    oldPriceAr,
    oldPriceEur,
    image: (raw.image as string) ?? "",
    colors,
    famillesCouleur: Array.isArray(raw.famillesCouleur) ? (raw.famillesCouleur as string[]) : [],
    typeArticle: (raw.typeArticle as string) || null,
    sizes,
    badge: raw.badge ? String(raw.badge) : undefined,
    is_hot: Boolean(raw.hot),
    on_order: true,
  };
}

export default async function CommandePage() {
  const [settings, onOrder] = await Promise.all([
    getSettings(),
    getProducts(true),
  ]);

  const rate = Number(settings.exchange_rate_eur) || 4800;

  const initialProducts = onOrder.map((p: Record<string, unknown>) =>
    mapApiProduct(p, rate)
  );

  const availableColors = settings.available_colors
    ? settings.available_colors
        .split(",")
        .map((c: string) => c.trim())
        .filter(Boolean)
    : [];

  const availableSizes = parseSizes(settings.available_sizes);
  const availableCategories =
    settings.available_categories ?? "TENUES, MAILLOTS, ACCESSOIRES";

  return (
    <CommandeClient
      initialProducts={initialProducts}
      availableColors={availableColors}
      availableSizes={availableSizes}
      availableCategories={availableCategories}
    />
  );
}
