"use client";

import styles from "./SidebarFilters.module.css";

// ─── TYPE ─────────────────────────────────────────────────────────────────────

/**
 * Même type que dans SettingsTab — une taille peut couvrir plusieurs genres.
 * Reçu via l'API comme : available_sizes = JSON.stringify(SizeItem[])
 */
export type SizeItem = {
  nom: string;
  genres: string[]; // ["Tous"] = universel, ou ["Femme", "Homme"], etc.
};

// ─── PROPS ────────────────────────────────────────────────────────────────────

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
  /**
   * Passe maintenant SizeItem[] au lieu de string[].
   * Si tu reçois encore du JSON stringifié depuis ton API :
   *   const sizes: SizeItem[] = JSON.parse(settings.available_sizes ?? "[]")
   */
  availableSizes?: SizeItem[];
  availableGenres?: string[];
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  Beige: "#D4B896", Blanc: "#F5F5F5", Bleu: "#4A90D9",
  Marron: "#795548", Noir: "#1a1a1a", Or: "#C9A84C",
  Rose: "#E86B8C", Rouge: "#E53935", Vert: "#4CAF50",
  Gris: "#9E9E9E", Naturel: "#C8B89A", Orange: "#F97316",
  Multicolore: "linear-gradient(135deg, #f43f5e, #3b82f6, #22c55e)",
};

const DEFAULT_COLORS = Object.entries(COLOR_MAP).map(([name, hex]) => ({ name, hex }));

/**
 * Tailles fallback au format SizeItem[] pour cohérence.
 * Utilisées seulement si aucune taille n'est configurée en BDD.
 */
const DEFAULT_SIZES: SizeItem[] = [
  { nom: "XS", genres: ["Tous"] },
  { nom: "S",  genres: ["Tous"] },
  { nom: "M",  genres: ["Tous"] },
  { nom: "L",  genres: ["Tous"] },
  { nom: "XL", genres: ["Tous"] },
  { nom: "XXL",genres: ["Tous"] },
];

const PRICE_RANGES = [
  { label: "Moins de 100 000 Ar (~20 €)", value: "0-100000" },
  { label: "100 000 – 200 000 Ar (~40 €)", value: "100000-200000" },
  { label: "Plus de 200 000 Ar (~40 €+)",  value: "200000+" },
];

const DEFAULT_GENRES = ["Femme", "Homme", "Enfant"];

// ─── HELPER ───────────────────────────────────────────────────────────────────

/**
 * Filtre les tailles selon le genre actif.
 * - Si aucun genre sélectionné → toutes les tailles.
 * - Si genre sélectionné → tailles dont genres inclut "Tous" OU le genre exact.
 */
function filterSizesByGenre(sizes: SizeItem[], genre: string): SizeItem[] {
  if (!genre) return sizes;
  return sizes.filter(
    sz => sz.genres.includes("Tous") || sz.genres.includes(genre)
  );
}

// ─── COMPOSANT ────────────────────────────────────────────────────────────────

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
  availableGenres,
}: Props) {

  // Couleurs
  const colorsToShow =
    availableColors && availableColors.length > 0
      ? availableColors.map(name => ({ name, hex: COLOR_MAP[name] ?? "#ccc" }))
      : DEFAULT_COLORS;

  // Genres
  const genresToShow =
    availableGenres && availableGenres.length > 0
      ? availableGenres
      : DEFAULT_GENRES;

  // Tailles : pool complet puis filtré selon le genre actif
  const allSizes = availableSizes && availableSizes.length > 0
    ? availableSizes
    : DEFAULT_SIZES;

  const sizesToShow = filterSizesByGenre(allSizes, selectedGenre);

  // Quand le genre change, si une taille sélectionnée n'est plus visible on
  // pourrait la désélectionner — mais c'est géré côté parent avec onGenreChange.

  return (
    <aside className={styles.sidebar}>

      {/* ── CATÉGORIES ── */}
      <div className={styles.block}>
        <h4 className={styles.blockTitle}>CATÉGORIES</h4>
        <ul className={styles.categoryList}>
          <li><a href="#">Tous les produits</a></li>
          <li><a href="#">Nouveautés</a></li>
          <li><a href="#">Meilleures ventes</a></li>
        </ul>
      </div>

      <div className={styles.divider} />

      {/* ── POUR QUI ── */}
      <div className={styles.block}>
        <h4 className={styles.blockTitle}>POUR QUI ?</h4>
        <div className={styles.genreGrid}>
          {genresToShow.map(g => {
            const active = selectedGenre === g;
            return (
              <button
                key={g}
                className={`${styles.genreBtn} ${active ? styles.genreBtnActive : ""}`}
                onClick={() => onGenreChange(active ? "" : g)}
              >
                {g === "Femme" ? " " : g === "Homme" ? " " : g === "Enfant" ? " " : " "}
                {g}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.divider} />

      {/* ── TAILLES ── filtrées selon le genre actif ── */}
      <div className={styles.block}>
        <h4 className={styles.blockTitle}>
          FILTRE PAR TAILLE
          {selectedGenre && (
            <span className={styles.blockTitleSub}>
              {/* Indication visuelle du contexte de filtrage */}
              · {selectedGenre}
            </span>
          )}
        </h4>

        {sizesToShow.length === 0 ? (
          <p className={styles.emptyHint}>
            Aucune taille disponible pour « {selectedGenre} ».
          </p>
        ) : (
          <div className={styles.sizeGrid}>
            {sizesToShow.map(sz => {
              const active = selectedSizes.includes(sz.nom);
              return (
                <button
                  key={sz.nom}
                  className={`${styles.sizeBtn} ${active ? styles.sizeBtnActive : ""}`}
                  onClick={() => onSizeToggle(sz.nom)}
                  title={
                    sz.genres.includes("Tous")
                      ? "Taille universelle"
                      : `Pour : ${sz.genres.join(", ")}`
                  }
                >
                  {sz.nom}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.divider} />

      {/* ── COULEURS ── */}
      <div className={styles.block}>
        <h4 className={styles.blockTitle}>FILTRE PAR COULEUR</h4>
        <div className={styles.colorGrid}>
          {colorsToShow.map(color => {
            const active = selectedColors.includes(color.name);
            return (
              <button
                key={color.name}
                className={`${styles.colorItem} ${active ? styles.colorActive : ""}`}
                onClick={() => onColorToggle(color.name)}
              >
                <span
                  className={styles.dot}
                  style={
                    color.hex.startsWith("linear")
                      ? { background: color.hex }
                      : { backgroundColor: color.hex }
                  }
                />
                <span className={styles.colorLabel}>{color.name}</span>
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
          {PRICE_RANGES.map(range => (
            <label key={range.value} className={styles.priceLabel}>
              <input
                type="radio"
                name="price"
                className={styles.radio}
                checked={selectedPrice === range.value}
                onChange={() => onPriceChange(selectedPrice === range.value ? "" : range.value)}
              />
              <span>{range.label}</span>
            </label>
          ))}
          {selectedPrice && (
            <button className={styles.clearPrice} onClick={() => onPriceChange("")}>
              Effacer le filtre prix
            </button>
          )}
        </div>
      </div>

    </aside>
  );
}