"use client";

import styles from "./SidebarFilters.module.css";

type Props = {
  selectedGenre: string;
  selectedColors: string[];
  selectedSizes: string[];
  selectedPrice: string;
  onGenreChange: (genre: string) => void;
  onColorToggle: (color: string) => void;
  onSizeToggle: (size: string) => void;
  onPriceChange: (range: string) => void;
  availableColors?: string[];
  availableSizes?: string[];
};

// ─── Mapping couleur → hex ────────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  Beige: "#D4B896",
  Blanc: "#F5F5F5",
  Bleu: "#4A90D9",
  Marron: "#795548",
  Noir: "#1a1a1a",
  Or: "#C9A84C",
  Rose: "#E86B8C",
  Rouge: "#E53935",
  Vert: "#4CAF50",
  Gris: "#9E9E9E",
  Naturel: "#C8B89A",
  Orange: "#F97316",
  Multicolore: "linear-gradient(135deg, #f43f5e, #3b82f6, #22c55e)",
};

const DEFAULT_COLORS = Object.entries(COLOR_MAP).map(([name, hex]) => ({
  name,
  hex,
}));

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const PRICE_RANGES = [
  { label: "Moins de 100 000 Ar (~20 €)", value: "0-100000" },
  { label: "100 000 – 200 000 Ar (~40 €)", value: "100000-200000" },
  { label: "Plus de 200 000 Ar (~40 €+)", value: "200000+" },
];

const GENRES = ["Femme", "Homme", "Enfant"];

export default function SidebarFilters({
  selectedGenre,
  selectedColors,
  selectedSizes,
  selectedPrice,
  onGenreChange,
  onColorToggle,
  onSizeToggle,
  onPriceChange,
  availableColors,
  availableSizes,
}: Props) {
  // Couleurs : depuis l'API si dispo, sinon fallback sur DEFAULT_COLORS
  const colorsToShow =
    availableColors && availableColors.length > 0
      ? availableColors.map((name) => ({
          name,
          hex: COLOR_MAP[name] ?? "#ccc",
        }))
      : DEFAULT_COLORS;

  // Tailles : depuis l'API si dispo, sinon fallback sur DEFAULT_SIZES
  const sizesToShow =
    availableSizes && availableSizes.length > 0
      ? availableSizes
      : DEFAULT_SIZES;

  return (
    <aside className={styles.sidebar}>
      {/* ── CATÉGORIES ── */}
      <div className={styles.block}>
        <h4 className={styles.blockTitle}>CATÉGORIES</h4>
        <ul className={styles.categoryList}>
          <li>
            <a href="#">Tous les produits</a>
          </li>
          <li>
            <a href="#">Nouveautés</a>
          </li>
          <li>
            <a href="#">Meilleures ventes</a>
          </li>
        </ul>
      </div>

      <div className={styles.divider} />

      {/* ── POUR QUI ── */}
      <div className={styles.block}>
        <h4 className={styles.blockTitle}>POUR QUI ?</h4>
        <div className={styles.genreGrid}>
          {GENRES.map((g) => {
            const active = selectedGenre === g;
            return (
              <button
                key={g}
                className={`${styles.genreBtn} ${active ? styles.genreBtnActive : ""}`}
                onClick={() => onGenreChange(active ? "" : g)}
              >
                {g === "Femme" ? " " : g === "Homme" ? " " : " "}
                {g}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.divider} />

      {/* ── COULEURS ── */}
      <div className={styles.block}>
        <h4 className={styles.blockTitle}>FILTRE PAR COULEUR</h4>
        <div className={styles.colorGrid}>
          {colorsToShow.map((color) => {
            const active = selectedColors.includes(color.name);
            return (
              <button
                key={color.name}
                className={`${styles.colorItem} ${active ? styles.colorActive : ""}`}
                onClick={() => onColorToggle(color.name)}
              >
                <span
                  className={styles.dot}
                  style={{ backgroundColor: color.hex }}
                />
                <span className={styles.colorLabel}>{color.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.divider} />

      {/* ── TAILLES ── */}
      <div className={styles.block}>
        <h4 className={styles.blockTitle}>FILTRE PAR TAILLE</h4>
        <div className={styles.sizeGrid}>
          {sizesToShow.map((size) => {
            const active = selectedSizes.includes(size);
            return (
              <button
                key={size}
                className={`${styles.sizeBtn} ${active ? styles.sizeBtnActive : ""}`}
                onClick={() => onSizeToggle(size)}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.divider} />

      {/* ── PRIX ── */}
      <div className={styles.block}>
        <h4 className={styles.blockTitle}>FILTRE PAR PRIX</h4>
        <div className={styles.priceList}>
          {PRICE_RANGES.map((range) => (
            <label key={range.value} className={styles.priceLabel}>
              <input
                type="radio"
                name="price"
                className={styles.radio}
                checked={selectedPrice === range.value}
                onChange={() =>
                  onPriceChange(
                    selectedPrice === range.value ? "" : range.value,
                  )
                }
              />
              <span>{range.label}</span>
            </label>
          ))}
          {selectedPrice && (
            <button
              className={styles.clearPrice}
              onClick={() => onPriceChange("")}
            >
              Effacer le filtre prix
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
