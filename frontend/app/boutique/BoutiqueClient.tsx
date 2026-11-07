"use client";

import { FAMILLES, TYPES_ARTICLE } from "@/lib/catalogue";
import { useState, useMemo } from "react";
import Link from "next/link";
import styles from "./BoutiquePage.module.css";
import SidebarFilters, { SizeItem } from "../../components/Boutique/SidebarFilters";
import BoutiqueHeader from "../../components/Boutique/BoutiqueHeader";
import ProductCard from "../../components/Boutique/ProductCard";

export type Product = {
  id: number;
  slug: string;
  name: string;
  tag: string;
  genre: string;
  category: string;
  priceAr: number;
  priceArDisplay: string;
  priceEur: number;
  oldPriceAr?: string;
  oldPriceEur?: string;
  image: string;
  colors: string[];
  famillesCouleur: string[];
  typeArticle?: string | null;
  sizes: string[];
  badge?: string;
  is_hot?: boolean;
  on_order?: boolean;
  stock_quantity?: number;
  description?: string;
};

export type Filters = {
  category: string;
  typeArticle: string;
  genre: string;
  colors: string[];
  sizes: string[];
  priceRange: string;
  sort: string;
  view: "grid" | "list";
};

const DEFAULT_FILTERS: Filters = {
  category: "",
  typeArticle: "",
  genre: "",
  colors: [],
  sizes: [],
  priceRange: "",
  sort: "az",
  view: "grid",
};

type BoutiqueClientProps = {
  initialProducts: Product[];
  availableSizes: SizeItem[];
  availableCategories: string;
  availableGenres: string[];
};

export default function BoutiqueClient({
  initialProducts,
  availableSizes,
  availableCategories,
  availableGenres,
}: BoutiqueClientProps) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [visibleCount, setVisibleCount] = useState(6);
  const [allProducts] = useState<Product[]>(initialProducts);

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

  // Palette et types calculés depuis les produits présents : aucun filtre vide, rien à régler à la main
  const famillesPresentes = useMemo(
    () => FAMILLES.filter((f) => allProducts.some((p) => p.famillesCouleur.includes(f))),
    [allProducts],
  );
  const typesPresents = useMemo(
    () => TYPES_ARTICLE.filter((t) => allProducts.some((p) => p.typeArticle === t)),
    [allProducts],
  );

  const products = useMemo(() => {
    let result = [...allProducts];

    if (filters.category)
      result = result.filter((p) => p.category === filters.category);
    if (filters.genre)
      result = result.filter((p) => p.genre === filters.genre);
    if (filters.typeArticle)
      result = result.filter((p) => p.typeArticle === filters.typeArticle);
    if (filters.colors.length > 0)
      result = result.filter((p) =>
        filters.colors.some((c) => p.famillesCouleur.includes(c)),
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
              selectedType={filters.typeArticle}
              onTypeChange={(t) => updateFilter("typeArticle", t)}
              availableTypes={typesPresents}
              selectedSizes={filters.sizes}
              selectedPrice={filters.priceRange}
              onGenreChange={(g) => updateFilter("genre", g)}
              onColorToggle={toggleColor}
              onSizeToggle={toggleSize}
              onPriceChange={(v) => updateFilter("priceRange", v)}
              availableColors={famillesPresentes}
              availableSizes={availableSizes}
              availableGenres={availableGenres}
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
                    className={filters.view === "grid" ? styles.viewBtnActive : styles.viewBtn}
                    onClick={() => updateFilter("view", "grid")}
                  >
                    ⊞
                  </button>
                  <button
                    className={filters.view === "list" ? styles.viewBtnActive : styles.viewBtn}
                    onClick={() => updateFilter("view", "list")}
                  >
                    ☰
                  </button>
                </div>
              </div>
            </div>

            <div className={filters.view === "list" ? styles.listView : styles.grid}>
              
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

            <div className={styles.seoText}>
              <h2>Pièces au crochet en stock, prêtes à expédier</h2>
              <p>
                Les créations affichées ici sont disponibles immédiatement, en
                quantité limitée : robes de plage, ensembles et pochettes au
                crochet, tous faits main dans notre atelier de Senganinga, à
                Nosy Be. Vous ne trouvez pas votre modèle, votre taille ou votre
                couleur ? Découvrez nos créations{" "}
                <Link href="/commande">sur commande</Link>.
              </p>
              <h3>Livraison et retours</h3>
              <p>
                Les pièces en stock sont préparées en 1 à 2 jours ouvrés. La
                livraison est gratuite à Nosy Be en ville ; pour le reste de
                Madagascar et l&rsquo;international, le tarif est sur devis.
                Retour possible sous 2 jours en cas de défaut d&rsquo;origine.
                Tous les détails sont sur la page{" "}
                <Link href="/livraison">Livraison et retours</Link>.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}