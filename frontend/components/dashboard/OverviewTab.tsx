"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import styles from "./OverviewTab.module.css";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Product = {
  id: number;
  name: string;
  category: string;
  genre: string;
  price_ar: number;
  badge: string;
  on_order: boolean;
  stock_quantity?: number;
  image: string;
};

type Settings = {
  available_categories?: string;
  available_genres?: string;
};

type Props = {
  products: Product[];
  settings: Settings | null;
};

// ─── BADGE ────────────────────────────────────────────────────────────────────

const BADGE_MAP: Record<string, [string, string, string]> = {
  "En stock":     ["var(--green)", "rgba(5,150,105,0.1)",   "rgba(5,150,105,0.2)"],
  "Nouveau":      ["var(--blue)",  "rgba(37,99,235,0.1)",   "rgba(37,99,235,0.2)"],
  "Sur commande": ["var(--gold)",  "rgba(217,119,6,0.1)",   "rgba(217,119,6,0.2)"],
  "Derniers":     ["var(--red)",   "rgba(220,38,38,0.1)",   "rgba(220,38,38,0.2)"],
  "Rupture":      ["var(--red)",   "rgba(220,38,38,0.1)",   "rgba(220,38,38,0.2)"],
  "NOUVEAU":      ["var(--blue)",  "rgba(37,99,235,0.1)",   "rgba(37,99,235,0.2)"],
};

function Badge({ label }: { label: string }) {
  const [color, bg, border] = BADGE_MAP[label] ?? BADGE_MAP["En stock"];
  return (
    <span
      className={styles.badge}
      style={{ color, background: bg, border: `1px solid ${border}` }}
    >
      {label}
    </span>
  );
}

// ─── ANIMATED NUMBER ──────────────────────────────────────────────────────────

function ANum({ value, duration = 900 }: { value: number; duration?: number }) {
  const [v, setV] = useState(0);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    ref.current = null;
    const target = value || 0;
    const step = (ts: number) => {
      if (!ref.current) ref.current = ts;
      const p = Math.min((ts - ref.current) / duration, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);
  return <span>{v.toLocaleString("fr-FR")}</span>;
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

type StatCardProps = {
  label: string;
  value: number;
  unit?: string;
  accent: string;
  delay?: number;
  icon: React.ReactNode;
  trend?: { label: string; dir: "up" | "down" | "neutral" };
};

function StatCard({ label, value, unit, accent, delay = 0, icon, trend }: StatCardProps) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={styles.statCard}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms, border-color 0.2s, box-shadow 0.2s`,
      }}
    >
      <div className={styles.statGlow} style={{ background: accent }} />
      <div className={styles.statIconWrap} style={{ background: `${accent}20`, color: accent }}>
        {icon}
      </div>
      <div className={styles.statValue}>
        {vis ? <ANum value={value} /> : "0"}
        {unit && <span className={styles.statUnit}>{unit}</span>}
      </div>
      <div className={styles.statLabel}>{label}</div>
      {trend && (
        <div className={`${styles.statTrend} ${
          trend.dir === "up" ? styles.trendUp :
          trend.dir === "down" ? styles.trendDown :
          styles.trendNeutral
        }`}>
          {trend.dir === "up" ? "▲" : trend.dir === "down" ? "▼" : "—"} {trend.label}
        </div>
      )}
    </div>
  );
}

// ─── ICONS ────────────────────────────────────────────────────────────────────

const Icons = {
  Bag:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Clock:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Star:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Coin:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Alert:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Hot:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 2c0 6-6 8-6 13a6 6 0 0 0 12 0c0-5-6-7-6-13z"/></svg>,
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

const CAT_COLORS = [
  "var(--rose)", "var(--gold)", "var(--blue)", "var(--green)",
  "#8b5cf6", "#14b8a6", "#f97316", "#ec4899",
];

const GENRE_ICONS: Record<string, string> = {
  Femme: "♀", Homme: "♂", Enfant: "🧒", Unisexe: "✦",
  default: "✨",
};

export default function OverviewTab({ products, settings }: Props) {

  // ── Catégories depuis settings (priorité) ou depuis les produits
  const categories = useMemo(() => {
    if (settings?.available_categories) {
      return settings.available_categories
        .split(",").map(c => c.trim()).filter(Boolean);
    }
    return [...new Set(products.map(p => p.category))];
  }, [settings, products]);

  // ── Genres depuis settings
  const genres = useMemo(() => {
    if (settings?.available_genres) {
      return settings.available_genres
        .split(",").map(g => g.trim()).filter(Boolean);
    }
    return [...new Set(products.map(p => p.genre))];
  }, [settings, products]);

  // ── Stats calculées
  const stats = useMemo(() => {
    const inStock   = products.filter(p => !p.on_order);
    const onOrder   = products.filter(p => p.on_order);
    const isNew     = products.filter(p => p.badge === "Nouveau" || p.badge === "NOUVEAU");
    const isHot     = products.filter(p => p.badge === "Coup de cœur");
    const totalVal  = products.reduce((s, p) => s + p.price_ar, 0);
    const lowStock  = products.filter(p =>
      !p.on_order &&
      p.stock_quantity !== undefined &&
      p.stock_quantity > 0 &&
      p.stock_quantity <= 2
      
    );
    const zeroStock = products.filter(p =>
      !p.on_order &&
      p.stock_quantity === 0
    );

    return { inStock, onOrder, isNew, isHot, totalVal, lowStock, zeroStock };
  }, [products]);

  // ── Produits récents (4 derniers par id desc)
  const recents = useMemo(() =>
    [...products].sort((a, b) => b.id - a.id).slice(0, 5),
    [products]
  );

  // ── Valeur par catégorie
  const catValues = useMemo(() =>
    categories.map(cat => ({
      cat,
      count: products.filter(p =>
        p.category.toLowerCase() === cat.toLowerCase()
      ).length,
      value: products
        .filter(p => p.category.toLowerCase() === cat.toLowerCase())
        .reduce((s, p) => s + p.price_ar, 0),
    })),
    [categories, products]
  );

  const maxCount = Math.max(...catValues.map(c => c.count), 1);

  return (
    <div>

      {/* ── STATS CARDS ── */}
      <div className={styles.statsGrid}>
        <StatCard
          label="En boutique"
          value={stats.inStock.length}
          accent="var(--rose)"
          delay={0}
          icon={<Icons.Bag />}
          trend={{ label: "en stock", dir: "neutral" }}
        />
        <StatCard
          label="Sur commande"
          value={stats.onOrder.length}
          accent="var(--gold)"
          delay={60}
          icon={<Icons.Clock />}
        />
        <StatCard
          label="Nouveautés"
          value={stats.isNew.length}
          accent="var(--blue)"
          delay={120}
          icon={<Icons.Star />}
        />
        <StatCard
          label="Valeur totale"
          value={Math.round(stats.totalVal / 1000)}
          unit="K Ar"
          accent="var(--green)"
          delay={180}
          icon={<Icons.Coin />}
        />
      </div>

      {/* ── ALERTE STOCK ── */}
      {(stats.lowStock.length > 0 || stats.zeroStock.length > 0) && (
        <div className={styles.stockAlertCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <Icons.Alert /> Alertes stock
            </h3>
            <span className={styles.cardMeta}>
              {stats.lowStock.length + stats.zeroStock.length} produit(s)
            </span>
          </div>
          <div className={styles.stockAlertList}>
            {[...stats.zeroStock, ...stats.lowStock].slice(0, 6).map(p => (
              <div key={p.id} className={styles.stockAlertItem}>
                <span className={styles.stockAlertName}>{p.name}</span>
                <span className={styles.cardMeta} style={{ flexShrink: 0 }}>{p.category}</span>
                <span className={`${styles.stockAlertQty} ${
                  p.stock_quantity === 0 ? styles.stockCritical : styles.stockLow
                }`}>
                  {p.stock_quantity === 0 ? "Épuisé" : `${p.stock_quantity} restant${p.stock_quantity ?? 0 > 1 ? "s" : ""}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BOTTOM GRID ── */}
      <div className={styles.bottomGrid} style={{ marginTop: 16 }}>

        {/* ── CATÉGORIES ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Par catégorie</h3>
            <span className={styles.cardMeta}>{products.length} articles</span>
          </div>
          <div className={styles.catRow}>
            {catValues.length === 0 ? (
              <p className={styles.emptyHint}>Aucune catégorie configurée</p>
            ) : catValues.map((c, i) => (
              <div key={c.cat} className={styles.catItem}
                style={{ animation: `fadeUp 0.4s ease ${0.1 + i * 0.07}s both` }}>
                <div className={styles.catItemHeader}>
                  <span className={styles.catName}>{c.cat}</span>
                  <span className={styles.catCount}>{c.count}</span>
                </div>
                <div className={styles.catBar}>
                  <div
                    className={styles.catBarFill}
                    style={{
                      width: `${Math.round((c.count / maxCount) * 100)}%`,
                      background: CAT_COLORS[i % CAT_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RÉCENTS ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Créations récentes</h3>
            <span className={styles.cardMeta}>5 derniers</span>
          </div>
          <div className={styles.recentList}>
            {recents.map((p, i) => (
              <div
                key={p.id}
                className={styles.recentItem}
                style={{ animationDelay: `${0.1 + i * 0.07}s` }}
              >
                <Image
                  src={p.image}
                  alt={p.name}
                  width={40}
                  height={40}
                  className={styles.recentImg}
                />
                <div className={styles.recentInfo}>
                  <div className={styles.recentName}>{p.name}</div>
                  <div className={styles.recentCat}>{p.category}</div>
                </div>
                <div className={styles.recentPrice}>
                  {(p.price_ar / 1000).toFixed(0)}k
                </div>
                <Badge label={p.badge} />
              </div>
            ))}
          </div>
        </div>

        {/* ── RÉPARTITION GENRE ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Par genre</h3>
            <span className={styles.cardMeta}>{genres.length} cibles</span>
          </div>
          <div className={styles.genreGrid}>
            {genres.map(g => {
              const count = products.filter(p =>
                p.genre?.toLowerCase() === g.toLowerCase()
              ).length;
              return (
                <div key={g} className={styles.genrePill}>
                  <span className={styles.genrePillIcon}>
                    {GENRE_ICONS[g] ?? GENRE_ICONS.default}
                  </span>
                  <span className={styles.genrePillCount}>{count}</span>
                  <span className={styles.genrePillLabel}>{g}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── VALEUR PAR CATÉGORIE ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Valeur par catégorie</h3>
            <span className={styles.cardMeta}>Ar</span>
          </div>
          <div>
            {catValues.filter(c => c.value > 0).map(c => (
              <div key={c.cat} className={styles.valueRow}>
                <span className={styles.valueRowName}>{c.cat}</span>
                <span className={styles.valueRowAmt}>
                  {(c.value / 1000).toFixed(0)}k Ar
                </span>
              </div>
            ))}
            {catValues.every(c => c.value === 0) && (
              <p className={styles.emptyHint}>Aucune donnée</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}