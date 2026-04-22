"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./GaleriePage.module.css";
import { getAllProducts } from "../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterValue =
  | "all"
  | "tenues"
  | "accessoires"
  | "maillots"
  | "enfant"
  | "surcommande";

interface GalerieItem {
  id: number;
  src: string;
  alt: string;
  filterKey: FilterValue;
  title: string;
  label: string;
  badge?: string;
  is_hot?: boolean;
  on_order?: boolean;
}

// ─── NOUVEAU TYPE : Pour remplacer "any" ──────────────────────────────────────
type RawProduct = {
  id: number;
  image: string;
  name: string;
  category: string;
  genre: string;
  tag: string;
  badge: string;
  is_hot: boolean;
  on_order: boolean;
};

// ─── Mapping category DB → filtre galerie ────────────────────────────────────
function toFilterKey(
  category: string,
  genre: string,
  onOrder: boolean,
): FilterValue {
  if (onOrder) return "surcommande";
  if (genre === "Enfant") return "enfant";
  const cat = category?.toUpperCase();
  if (cat === "MAILLOTS") return "maillots";
  if (cat === "ACCESSOIRES") return "accessoires";
  return "tenues"; // TENUES par défaut
}

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "Tout voir", value: "all" },
  { label: "Tenues", value: "tenues" },
  { label: "Maillots", value: "maillots" },
  { label: "Accessoires", value: "accessoires" },
  { label: "Enfant", value: "enfant" },
  { label: "Sur Commande", value: "surcommande" },
];

const PAGE_SIZE = 15;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GaleriePage() {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [items, setItems] = useState<GalerieItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const raw = await getAllProducts();

        // ─── CORRECTION ICI : Utilisation de RawProduct au lieu de any ───
        const mapped: GalerieItem[] = raw.map((p: RawProduct) => ({
          id: p.id,
          src: p.image,
          alt: p.name,
          filterKey: toFilterKey(p.category, p.genre, p.on_order),
          title: p.name,
          label: `${p.tag} · ${p.genre}`,
          badge: p.badge,
          is_hot: p.is_hot,
          on_order: p.on_order,
        }));

        setItems(mapped);
      } catch (err) {
        console.error("Erreur chargement galerie :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filtered = useMemo(
    () =>
      activeFilter === "all"
        ? items
        : items.filter((item) => item.filterKey === activeFilter),
    [activeFilter, items],
  );

  const visible = filtered.slice(0, limit);
  const hasMore = limit < filtered.length;

  const handleFilter = (cat: FilterValue) => {
    setActiveFilter(cat);
    setLimit(PAGE_SIZE);
  };

  return (
    <div className={styles.page}>
      {/* ── HERO ── */}
      <header className={styles.hero}>
        <p className={styles.heroEyebrow}>Art Jatie · Madagascar</p>
        <h1 className={styles.heroTitle}>Galerie</h1>
        <p className={styles.heroSub}>
          Collections Artisanales &amp; Sur Mesure
        </p>

        <div className={styles.filterRow}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`${styles.filterTag} ${
                activeFilter === f.value ? styles.filterTagActive : ""
              }`}
              onClick={() => handleFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── STATS ── */}
      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statNum}>{items.length}+</span>
          <span className={styles.statLabel}>Créations</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>100%</span>
          <span className={styles.statLabel}>Fait main</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>Sur mesure</span>
          <span className={styles.statLabel}>Disponible</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>Livraison</span>
          <span className={styles.statLabel}>Internationale</span>
        </div>
      </div>

      {/* ── GALERIE ── */}
      <section className={styles.galleryWrap}>
        {loading ? (
          <div className={styles.emptyState}>Chargement des créations…</div>
        ) : visible.length === 0 ? (
          <div className={styles.emptyState}>
            Aucune création dans cette catégorie pour le moment.
          </div>
        ) : (
          <div className={styles.masonry}>
            {visible.map((item, index) => (
              <div key={item.id} className={styles.card}>
                {/* Badges */}
                {item.is_hot && (
                  <span className={styles.badgeHot}>♥ Coup de cœur</span>
                )}
                {item.on_order && (
                  <span className={styles.badgeOrder}>Sur commande</span>
                )}
                {!item.is_hot &&
                  !item.on_order &&
                  item.badge &&
                  item.badge !== "Rupture" && (
                    <span className={styles.badgeNew}>{item.badge}</span>
                  )}

                {/* Image */}
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={600}
                  height={800}
                  className={styles.cardImg}
                  priority={index < 6}
                />

                {/* Overlay */}
                <div className={styles.overlay}>
                  <span className={styles.overlayCategory}>{item.label}</span>
                  <p className={styles.overlayTitle}>{item.title}</p>
                  <Link
                    href={item.on_order ? `/commande` : `/produit/${item.id}`}
                    className={styles.overlayBtn}
                  >
                    Voir les détails →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className={styles.loadMoreWrap}>
            <button
              className={styles.loadMoreBtn}
              onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
            >
              Afficher plus de créations ({filtered.length - limit} restantes)
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
