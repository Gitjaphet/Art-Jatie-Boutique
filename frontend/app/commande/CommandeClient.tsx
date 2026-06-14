"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import styles from "./CommandePage.module.css";

import BoutiqueHeader from "../../components/Boutique/BoutiqueHeader";
import SidebarFilters, { SizeItem } from "../../components/Boutique/SidebarFilters";
import ProductCard from "../../components/Boutique/ProductCard";
import type { Product } from "../boutique/BoutiqueClient";

// ─── Types filtres ────────────────────────────────────────────────────────────
type Filters = {
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

// ─── Props ────────────────────────────────────────────────────────────────────
type Props = {
  initialProducts: Product[];
  availableColors: string[];
  availableSizes: SizeItem[];
  availableCategories: string;
};

// ─── Composant ────────────────────────────────────────────────────────────────
export default function CommandeClient({
  initialProducts,
  availableColors,
  availableSizes,
  availableCategories,
}: Props) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [visibleCount, setVisibleCount] = useState(6);

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
    let result = [...initialProducts];

    if (filters.category)
      result = result.filter((p) => p.category === filters.category);
    if (filters.genre)
      result = result.filter((p) => p.genre === filters.genre);
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
  }, [filters, initialProducts]);



  return (
    <main className={styles.pageMain}>
      <div className={styles.pageContainer}>
        <BoutiqueHeader
          titre="SUR COMMANDE"
          activeCategory={filters.category}
          onCategoryChange={(cat) => updateFilter("category", cat)}
          settingsCategories={availableCategories}
        />

        <nav className={styles.breadcrumbs}>
          <Link href="/">Accueil</Link>
          <span> / </span>
          <span className={styles.current}>Sur Commande</span>
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
              availableColors={availableColors}
              availableSizes={availableSizes}
            />
          </aside>

          <section className={styles.content}>
            <div className={styles.topToolbar}>
              <span className={styles.resultsCount}>
                {`Affichage de 1–${Math.min(visibleCount, products.length)} sur ${products.length} résultats`}
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
              // On rend TOUS les produits filtrés dans le DOM (SEO),
              // et on masque visuellement ceux au-delà de visibleCount via CSS
              {products.length === 0 ? (
                <p className={styles.noResults}>
                  Aucun produit ne correspond à vos filtres.
                </p>
              ) : (
                products.map((product, index) => (
                  <div
                    key={product.id}
                    className={index >= visibleCount ? styles.hiddenProduct : undefined}
                  >
                    <ProductCard
                      product={product}
                      listView={filters.view === "list"}
                      commandeMode={true}
                    />
                  </div>
                ))
              )}
            </div>

            {visibleCount < products.length && (
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