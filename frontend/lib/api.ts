// frontend/lib/api.ts

const API_URL = "http://localhost:8000";

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
}

export async function getProducts(onOrder?: boolean) {
  const url =
    onOrder !== undefined
      ? `${API_URL}/products/?on_order=${onOrder}`
      : `${API_URL}/products/`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur de réseau");
  const data: ApiProduct[] = await res.json();

  // REMPLACEMENT de (p: any) par (p: ApiProduct)
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
