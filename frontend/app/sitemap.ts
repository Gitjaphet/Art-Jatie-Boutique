import type { MetadataRoute } from "next";
import { getProducts } from "../lib/api";

const BASE_URL = "https://www.artjatie.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, priority: 1.0, changeFrequency: "weekly" },
    { url: `${BASE_URL}/boutique`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE_URL}/commande`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE_URL}/histoire`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${BASE_URL}/galerie`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${BASE_URL}/contact`, priority: 0.4, changeFrequency: "yearly" },
    { url: `${BASE_URL}/livraison`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${BASE_URL}/guide`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${BASE_URL}/mentions`, priority: 0.1, changeFrequency: "yearly" },
    { url: `${BASE_URL}/confidentialite`, priority: 0.1, changeFrequency: "yearly" },
  ];

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const [inStock, onOrder] = await Promise.all([
      getProducts(false),
      getProducts(true),
    ]);
    const all = [...inStock, ...onOrder];
    const seen = new Set<string>();

    productPages = all
      .filter((p: any) => p.slug && !seen.has(p.slug) && seen.add(p.slug))
      .map((p: any) => ({
        url: `${BASE_URL}/produit/${p.slug}`,
        priority: 0.8,
        changeFrequency: "weekly" as const,
      }));
  } catch (err) {
    console.error("Sitemap product fetch error:", err);
  }

  return [...staticPages, ...productPages];
}