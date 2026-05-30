"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import styles from "./GaleriePage.module.css";
import { getAllProducts } from "../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterValue =
  | "all"
  | "tenues"
  | "accessoires"
  | "maillots"
  | "enfant";

interface GalerieItem {
  id: string; 
  src: string;
  filterKey: FilterValue;
}

type ProductWithMultipleImages = {
  id: number;
  name: string;
  image: string;
  imagesString?: string;
  category?: string;
  genre?: string;
};

// ─── Mapping category DB → filtre galerie ────────────────────────────────────
function toFilterKey(category: string | undefined, genre: string | undefined): FilterValue {
  if (genre === "Enfant") return "enfant";
  const cat = category?.toUpperCase();
  if (cat === "MAILLOTS") return "maillots";
  if (cat === "ACCESSOIRES") return "accessoires";
  return "tenues";
}

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "Tout voir", value: "all" },
  { label: "Tenues", value: "tenues" },
  { label: "Maillots", value: "maillots" },
  { label: "Accessoires", value: "accessoires" },
  { label: "Enfant", value: "enfant" },
];

const PAGE_SIZE = 20;

export default function GaleriePage() {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [items, setItems] = useState<GalerieItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllImages = async () => {
      try {
        setLoading(true);
        const products = await getAllProducts();

        const allExtractedImages: GalerieItem[] = [];

        products.forEach((p: ProductWithMultipleImages) => {
        const filterKey = toFilterKey(p.category, p.genre);

        // Seulement le champ `images` (avec s)
        if (p.imagesString && typeof p.imagesString === "string" && p.imagesString.trim() !== "") {
          const secondaryImages = p.imagesString
            .split(",")
            .map((url) => url.trim())
            .filter(Boolean);

          secondaryImages.forEach((imgUrl, index) => {
            allExtractedImages.push({
              id: `${p.id}-img-${index}`,
              src: imgUrl,
              filterKey: filterKey,
            });
          });
        }
      });

        setItems(allExtractedImages);
      } catch (err) {
        console.error("Erreur chargement images galerie :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllImages();
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

  // 📥 Fonction de téléchargement forcé via la route dédiée du Backend
  const downloadImage = (imageUrl: string, uniqueId: string) => {
    try {
      // On cible l'API de téléchargement de ton backend (localhost:8000 en dev)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // On construit l'URL de redirection vers notre endpoint de téléchargement forcé
      const downloadUrl = `${backendUrl}/download-image?url=${encodeURIComponent(imageUrl)}`;
      
      // On utilise une méthode native ultra-rapide qui lance le flux de téléchargement directement
      window.location.href = downloadUrl;
    } catch (error) {
      console.error("Échec du téléchargement via le backend :", error);
      // Repli au cas où : ouverture brute dans le navigateur
      window.open(imageUrl, "_blank");
    }
  };
  return (
    <div className={styles.page}>
      {/* ── HERO ── */}
      <header className={styles.hero}>
        <p className={styles.heroEyebrow}>Art Jatie · Madagascar</p>
        <h1 className={styles.heroTitle}>Galerie d'Inspirations</h1>
        <p className={styles.heroSub}>Explorez et téléchargez toutes nos créations en un clic</p>

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

      {/* ── GRID SANS TEXTE NI BOUTONS DE COMPOSANT ── */}
      <section className={styles.galleryWrap}>
        {loading ? (
          <div className={styles.emptyState}>Chargement de la galerie...</div>
        ) : visible.length === 0 ? (
          <div className={styles.emptyState}>Aucune photo disponible pour le moment.</div>
        ) : (
          <div className={styles.masonry}>
            {visible.map((item, index) => (
              <div key={item.id} className={styles.card}>
                
                <Image
                  src={item.src}
                  alt="Création Art Jatie"
                  width={500}
                  height={700}
                  className={styles.cardImg}
                  priority={index < 8}
                />

                <div className={styles.overlayPure}>
                  <button 
                    onClick={() => downloadImage(item.src, item.id)}
                    className={styles.downloadIconBtn}
                    title="Télécharger cette image"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className={styles.dlSvg}
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
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
              Plus de photos ({filtered.length - limit} restantes)
            </button>
          </div>
        )}
      </section>
    </div>
  );
}