import { getProducts, getSettings } from "../../lib/api";
import BoutiqueClient from "./BoutiqueClient";
import { Product } from "./BoutiqueClient";
import { SizeItem } from "../../components/Boutique/SidebarFilters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boutique — Crochet Artisanal Fait Main | Art Jatie Madagascar",
  description:
    "Découvrez nos sacs, robes, tenues de plage et maillots en crochet fait main par nos artisanes malgaches. Commandes sur mesure disponibles.",
};

// SSR avec cache 5 minutes côté Next.js
// Google voit tous les produits dans le HTML, mis à jour toutes les 5 min
export const revalidate = 300;

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
  onOrder = false,
  exchangeRate = 4800,
): Product {
  const priceArDisplay = (raw.price as string) ?? "";
  const priceAr = Number(priceArDisplay.replace(/[^0-9]/g, "")) || 0;
  const priceEur = Math.round(priceAr / exchangeRate);

  const oldPriceAr = (raw.oldPrice as string) ?? undefined;
  const oldPriceEur = oldPriceAr
    ? `${Math.round(Number(oldPriceAr.replace(/[^0-9]/g, "")) / exchangeRate)} €`
    : undefined;

  const colors = Array.isArray(raw.colorsArray) ? (raw.colorsArray as string[]) : [];
  const sizes = Array.isArray(raw.sizesArray) ? (raw.sizesArray as string[]) : [];

  return {
    id: Number(raw.id),
    slug: (raw.slug as string) ?? "",
    name: (raw.name as string) ?? "",
    tag: (raw.tag as string) ?? "",
    genre: (raw.genre as string) || "Femme",
category: (raw.category as string) || "TENUES",
    priceAr,
    priceArDisplay,
    priceEur,
    oldPriceAr,
    oldPriceEur,
    image: (raw.image as string) ?? "",
    colors,
    sizes,
    badge: raw.badge ? String(raw.badge) : undefined,
    is_hot: Boolean(raw.hot),
    on_order: onOrder,
    stock_quantity: Number(raw.stock_quantity) || 0,
    description:
      (raw.description as string) ||
      (raw.desc as string) ||
      (raw.note as string) ||
      undefined,
  };
}

export default async function BoutiquePage() {
  console.log("API_URL used:", process.env.API_URL || process.env.NEXT_PUBLIC_API_URL);

  let settings: Record<string, string> = {};
  let inStock: Record<string, unknown>[] = [];

  try {
    [settings, inStock] = await Promise.all([
      getSettings(),
      getProducts(false),
    ]);
    console.log("Products count:", inStock.length);
  } catch (err) {
    console.error("BoutiquePage fetch error:", err);
    // Continue avec données vides plutôt que crasher
  }

  const rate = Number(settings.exchange_rate_eur) || 4800;

  const availableColors = settings.available_colors
    ? settings.available_colors.split(",").map((c: string) => c.trim()).filter(Boolean)
    : [];

  const availableSizes = parseSizes(settings.available_sizes);

  const availableGenres = settings.available_genres
    ? settings.available_genres.split(",").map((g: string) => g.trim()).filter(Boolean)
    : [];

  const availableCategories = settings.available_categories ?? "TENUES, MAILLOTS, ACCESSOIRES";

  const mapped = inStock.map((p: Record<string, unknown>) =>
    mapApiProduct(p, false, rate),
  );

  const seen = new Set<number>();
  const initialProducts = mapped.filter((p: Product) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  return (
    <BoutiqueClient
      initialProducts={initialProducts}
      availableColors={availableColors}
      availableSizes={availableSizes}
      availableCategories={availableCategories}
      availableGenres={availableGenres}
    />
  );
}