// frontend/lib/api.ts

// Utilisation de la variable d'environnement Vercel (avec localhost en secours)
// api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.artjatie.com";// ← navigateur

// 1. Définition de l'interface brute venant de la base de données (Backend)
interface ApiProduct {
  id: number;
  name: string;
  slug: string;
  category: string;
  genre: string;
  price_ar: number;
  old_price_ar?: number;
  badge: string;
  tag: string;
  image: string;
  images?: string;
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

  const res = await fetch(url, { next: { revalidate: 300 } }); // ← AJOUTER
  if (!res.ok) throw new Error("Erreur de réseau");
  const data: ApiProduct[] = await res.json();

  return data.map((p: ApiProduct) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    subtitle: `${p.category} · ${p.genre}`,
    genre: p.genre,        // ← AJOUTER
    category: p.category,  // ← AJOUTER
    on_order: p.on_order,  // ← AJOUTER
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
    imagesString: p.images || "",
    hot: p.is_hot,
    colorsArray: p.colors ? p.colors.split(",").map((c) => c.trim()) : [],
    sizesArray: p.sizes ? p.sizes.split(",").map((s) => s.trim()) : [],
    stock_quantity: p.stock_quantity ?? 0,
    description: p.description,
  }));
}

export async function getSettings() {
  const res = await fetch(`${API_URL}/settings/`, { next: { revalidate: 300 } }); // ← AJOUTER
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
    slug: p.slug,
    imagesString: p.images,
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
    slug: p.slug,
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
    imagesString: p.images || "",   // ← AJOUTER CETTE LIGNE
    hot: p.is_hot,
    on_order: p.on_order,           // ← aussi absent, à ajouter
    stock_quantity: p.stock_quantity ?? 0,  // ← aussi absent
    colorsArray: p.colors ? p.colors.split(",").map((c) => c.trim()) : [],
    sizesArray: p.sizes ? p.sizes.split(",").map((s) => s.trim()) : [],
    description: p.description || "Un magnifique article Art Jatie.",
  };
}



// --- AGENT IA JATIE ---
export async function chatWithJatie(
  message: string,
  clientWhatsapp: string,
  channel: string = "web"
) {
  const res = await fetch(`${API_URL}/agent/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: [],
    }),
  });
  if (!res.ok) throw new Error("Erreur agent IA");
  return res.json();
}
