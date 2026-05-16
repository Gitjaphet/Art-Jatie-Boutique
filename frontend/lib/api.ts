// frontend/lib/api.ts

// Utilisation de la variable d'environnement Vercel (avec localhost en secours)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// 1. Définition de l'interface brute venant de la base de données (Backend)
interface ApiProduct {
  id: number;
  name: string;
  category: string;
  genre: string;
  price_ar: number;
  old_price_ar?: number;
  badge: string;
  tag: string;
  image: string;
  is_hot: boolean;
  on_order: boolean;
  colors?: string; // stocké sous forme "Rouge,Bleu"
  sizes?: string; // stocké sous forme "S,M,L"
  description?: string; // au cas où tu as une description
  stock_quantity?: number;
}

export async function getProducts(onOrder?: boolean) {
  const url =
    onOrder !== undefined
      ? `${API_URL}/products/?on_order=${onOrder}`
      : `${API_URL}/products/`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur de réseau");
  const data: ApiProduct[] = await res.json();

  return data.map((p: ApiProduct) => ({
    id: p.id,
    name: p.name,
    subtitle: `${p.category} · ${p.genre}`,

    // --- Valeurs mathématiques ---
    rawPrice: p.price_ar,
    rawOldPrice: p.old_price_ar,

    // Affichage texte Ariary
    price: `${p.price_ar.toLocaleString("fr-FR")} Ar`,
    oldPrice: p.old_price_ar
      ? `${p.old_price_ar.toLocaleString("fr-FR")} Ar`
      : undefined,

    badge: p.badge,
    tag: p.tag,
    color: "#f5ead9",
    image: p.image,
    hot: p.is_hot,
    // Transformation des chaînes CSV en tableaux
    colorsArray: p.colors ? p.colors.split(",").map((c) => c.trim()) : [],
    sizesArray: p.sizes ? p.sizes.split(",").map((s) => s.trim()) : [],
    stock_quantity: p.stock_quantity ?? 0,
  }));
}

export async function getSettings() {
  const res = await fetch(`${API_URL}/settings/`);
  if (!res.ok) throw new Error("Erreur chargement settings");
  return res.json();
}

export async function getAllProducts() {
  const res = await fetch(`${API_URL}/products/`);
  if (!res.ok) throw new Error("Erreur de réseau");
  const data: ApiProduct[] = await res.json();

  return data.map((p: ApiProduct) => ({
    id: p.id,
    name: p.name,
    image: p.image,
    category: p.category,
    genre: p.genre,
    tag: p.tag,
    badge: p.badge,
    is_hot: p.is_hot,
    on_order: p.on_order,
  }));
}

// --- LA NOUVELLE FONCTION MANQUANTE ---
export async function getProductBySlug(slug: string) {
  const res = await fetch(`${API_URL}/products/${slug}`);
  if (!res.ok) throw new Error("Produit introuvable");
  const p: ApiProduct = await res.json();

  return {
    id: p.id,
    name: p.name,
    subtitle: `${p.category} · ${p.genre}`,
    rawPrice: p.price_ar,
    rawOldPrice: p.old_price_ar,
    price: `${p.price_ar.toLocaleString("fr-FR")} Ar`,
    oldPrice: p.old_price_ar
      ? `${p.old_price_ar.toLocaleString("fr-FR")} Ar`
      : undefined,
    badge: p.badge,
    tag: p.tag,
    color: "#f5ead9",
    image: p.image,
    hot: p.is_hot,
    colorsArray: p.colors ? p.colors.split(",").map((c) => c.trim()) : [],
    sizesArray: p.sizes ? p.sizes.split(",").map((s) => s.trim()) : [],
    description: p.description || "Un magnifique article Art Jatie.",
  };
}
