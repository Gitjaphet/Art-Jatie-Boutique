"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import styles from "./BoutiquePage.module.css";
import SidebarFilters, { SizeItem } from "../../components/Boutique/SidebarFilters";
import BoutiqueHeader from "../../components/Boutique/BoutiqueHeader";
import ProductCard from "../../components/Boutique/ProductCard";
import { getProducts, getSettings } from "../../lib/api";

export type Product = {
  id: number;
  name: string;
  tag: string;
  genre: "Femme" | "Homme" | "Enfant";
  category: "TENUES" | "MAILLOTS" | "ACCESSOIRES";
  priceAr: number;
  priceArDisplay: string;
  priceEur: number;
  oldPriceAr?: string;
  oldPriceEur?: string;
  image: string;
  colors: string[];
  sizes: string[];
  badge?: string;
  is_hot?: boolean;
  on_order?: boolean;
  stock_quantity?: number;
  description?: string;
};


function parseSizes(raw?: string): SizeItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        nom: item.nom ?? item.name ?? "",
        // ✅ Fallback sur ["Tous"] si genres est undefined/null/pas un tableau
        genres: Array.isArray(item.genres) && item.genres.length > 0
          ? item.genres
          : item.genre
          ? [item.genre]
          : ["Tous"],
      }));
    }
  } catch {
    // Ancien format CSV simple
    return raw.split(",").map(s => ({ nom: s.trim(), genres: ["Tous"] }));
  }
  return [];
}
// ─── Conversion API → Product ─────────────────────────────────────────────────
function mapApiProduct(
  raw: Record<string, unknown>,
  onOrder = false,
  exchangeRate = 4800,
): Product {
  // getProducts() retourne déjà `price` comme "89 000 Ar"
  console.log("stock_quantity reçu :", raw.stock_quantity, raw);
  const priceArDisplay = (raw.price as string) ?? "";
  const priceAr = Number(priceArDisplay.replace(/[^0-9]/g, "")) || 0;
  const priceEur = Math.round(priceAr / exchangeRate);

  const oldPriceAr = (raw.oldPrice as string) ?? undefined;
  const oldPriceEur = oldPriceAr
    ? `${Math.round(Number(oldPriceAr.replace(/[^0-9]/g, "")) / exchangeRate)} €`
    : undefined;

  // getProducts() retourne colorsArray et sizesArray déjà splittés
  const colors = Array.isArray(raw.colorsArray)
    ? (raw.colorsArray as string[])
    : [];
  const sizes = Array.isArray(raw.sizesArray)
    ? (raw.sizesArray as string[])
    : [];

  return {
    id: Number(raw.id),
    name: (raw.name as string) ?? "",
    tag: (raw.tag as string) ?? "",

    // On récupère 'genre' depuis l'objet raw renvoyé par ton backend Python
    // Si c'est vide, on met "Femme" par défaut pour respecter le type Union
    genre: ((raw.genre as string) || "Femme") as Product["genre"],

    category: ((raw.category as string) ?? "TENUES") as Product["category"],
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
    description: (raw.description as string) || (raw.desc as string) || (raw.note as string) || undefined,
  };
}

export type Filters = {
  category: string;
  genre: string;
  colors: string[];
  sizes: string[];
  priceRange: string;
  sort: string;
  view: "grid" | "list";
};

const DEFAULT_FILTERS: Filters = {
  category: "",
  genre: "",
  colors: [],
  sizes: [],
  priceRange: "",
  sort: "az",
  view: "grid",
};

export default function BoutiquePage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [visibleCount, setVisibleCount] = useState(6);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Settings dynamiques ──
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<SizeItem[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string>("TENUES, MAILLOTS, ACCESSOIRES");
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        // Charger settings + produits en parallèle
        const [settings, inStock] = await Promise.all([
          getSettings(),
          getProducts(false), // uniquement en stock
        ]);

        // Appliquer le taux de change depuis la DB
        const rate = Number(settings.exchange_rate_eur) || 4800;

        // Couleurs et tailles dynamiques pour la sidebar
        if (settings.available_colors) {
          setAvailableColors(
            settings.available_colors
              .split(",")
              .map((c: string) => c.trim())
              .filter(Boolean),
          );
        }
        if (settings.available_sizes) {
          setAvailableSizes(parseSizes(settings.available_sizes));
        }

        if (settings.available_genres) {
          setAvailableGenres(
            settings.available_genres.split(",").map((g: string) => g.trim()).filter(Boolean)
          );
        }

        if (settings.available_categories) {
          setAvailableCategories(settings.available_categories);
        }

        const mapped = [
          ...inStock.map((p: Record<string, unknown>) =>
            mapApiProduct(p, false, rate),
          ),
        ];

        const seen = new Set<number>();
        const deduped = mapped.filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });

        setAllProducts(deduped);
      } catch (err) {
        console.error("Erreur chargement boutique :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setVisibleCount(6);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleColor = (color: string) =>
    updateFilter(
      "colors",
      filters.colors.includes(color)
        ? filters.colors.filter((c) => c !== color)
        : [...filters.colors, color],
    );

  const toggleSize = (size: string) =>
    updateFilter(
      "sizes",
      filters.sizes.includes(size)
        ? filters.sizes.filter((s) => s !== size)
        : [...filters.sizes, size],
    );

  const products = useMemo(() => {
    let result = [...allProducts];

    if (filters.category)
      result = result.filter((p) => p.category === filters.category);
    if (filters.genre) result = result.filter((p) => p.genre === filters.genre);
    if (filters.colors.length > 0)
      result = result.filter((p) =>
        filters.colors.some((c) => p.colors.includes(c)),
      );
    if (filters.sizes.length > 0)
      result = result.filter((p) =>
        filters.sizes.some((s) => p.sizes.includes(s)),
      );
    if (filters.priceRange === "0-100000")
      result = result.filter((p) => p.priceAr <= 100000);
    else if (filters.priceRange === "100000-200000")
      result = result.filter((p) => p.priceAr > 100000 && p.priceAr <= 200000);
    else if (filters.priceRange === "200000+")
      result = result.filter((p) => p.priceAr > 200000);

    if (filters.sort === "az")
      result.sort((a, b) => a.name.localeCompare(b.name));
    else if (filters.sort === "za")
      result.sort((a, b) => b.name.localeCompare(a.name));
    else if (filters.sort === "price_asc")
      result.sort((a, b) => a.priceAr - b.priceAr);
    else if (filters.sort === "price_desc")
      result.sort((a, b) => b.priceAr - a.priceAr);

    return result;
  }, [filters, allProducts]);

  const visibleProducts = products.slice(0, visibleCount);

  return (
    <main className={styles.pageMain}>
      <div className={styles.pageContainer}>
        <BoutiqueHeader
          activeCategory={filters.category}
          onCategoryChange={(cat) => updateFilter("category", cat)}
          settingsCategories={availableCategories}
        />

        <nav className={styles.breadcrumbs}>
          <Link href="/">Accueil</Link>
          <span> / </span>
          <span className={styles.current}>Produits</span>
        </nav>

        <div className={styles.mainLayout}>
          <aside className={styles.sidebar}>
            <SidebarFilters
              selectedGenre={filters.genre}
              selectedColors={filters.colors}
              selectedSizes={filters.sizes}
              selectedPrice={filters.priceRange}
              onGenreChange={(g) => updateFilter("genre", g)}
              onColorToggle={toggleColor}
              onSizeToggle={toggleSize}
              onPriceChange={(v) => updateFilter("priceRange", v)}
              // ↓ Nouvelles props dynamiques
              availableColors={availableColors}
              availableSizes={availableSizes}
              availableGenres={availableGenres}
            />
          </aside>

          <section className={styles.content}>
            <div className={styles.topToolbar}>
              <span className={styles.resultsCount}>
                {loading
                  ? "Chargement…"
                  : `Affichage de 1–${visibleProducts.length} sur ${products.length} résultats`}
              </span>
              <div className={styles.toolbarRight}>
                <select
                  className={styles.sortSelect}
                  value={filters.sort}
                  onChange={(e) => updateFilter("sort", e.target.value)}
                >
                  <option value="az">ALPHABÉTIQUE, A-Z</option>
                  <option value="za">ALPHABÉTIQUE, Z-A</option>
                  <option value="price_asc">PRIX CROISSANT</option>
                  <option value="price_desc">PRIX DÉCROISSANT</option>
                </select>
                <div className={styles.viewOptions}>
                  <span>VUE :</span>
                  <button
                    className={
                      filters.view === "grid"
                        ? styles.viewBtnActive
                        : styles.viewBtn
                    }
                    onClick={() => updateFilter("view", "grid")}
                  >
                    ⊞
                  </button>
                  <button
                    className={
                      filters.view === "list"
                        ? styles.viewBtnActive
                        : styles.viewBtn
                    }
                    onClick={() => updateFilter("view", "list")}
                  >
                    ☰
                  </button>
                </div>
              </div>
            </div>

            <div
              className={
                filters.view === "list" ? styles.listView : styles.grid
              }
            >
              {loading ? (
                <p className={styles.noResults}>Chargement des créations…</p>
              ) : visibleProducts.length === 0 ? (
                <p className={styles.noResults}>
                  Aucun produit ne correspond à vos filtres.
                </p>
              ) : (
                visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    listView={filters.view === "list"}
                    commandeMode={product.on_order}
                  />
                ))
              )}
            </div>

            {!loading && visibleCount < products.length && (
              <div className={styles.voirPlusWrapper}>
                <button
                  className={styles.btnVoirPlus}
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                >
                  Voir plus ({products.length - visibleCount} restants)
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
