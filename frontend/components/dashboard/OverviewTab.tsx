"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import styles from "../../app/admin/dashboard/AdminDashboard.module.css";
import Image from "next/image";

// --- Types ---
type Product = {
  id: number;
  name: string;
  category: string;
  price_ar: number;
  badge: string;
  on_order: boolean;
  image: string;
};

type StatProps = {
  label: string;
  value: number;
  unit?: string;
  accent: string;
  delay?: number;
  icon: React.ReactNode;
};

// --- ICONS ---
const I = {
  Bag: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Star: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Coin: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Clock: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

// Animation de nombre (Typé)
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

// Composant Stat (Typé)
function Stat({ label, value, unit, accent, delay = 0, icon }: StatProps) {
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
        transform: vis ? "translateY(0)" : "translateY(18px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-16px",
          right: "-16px",
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: `${accent}18`,
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            background: `${accent}18`,
            borderRadius: "8px",
            padding: "8px",
            color: accent,
          }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "2.5rem",
          fontWeight: "600",
          color: "var(--text-primary)",
          lineHeight: 1,
        }}
      >
        {vis ? <ANum value={value} /> : "0"}
        {unit && (
          <span
            style={{
              fontSize: "0.95rem",
              color: "var(--text-secondary)",
              marginLeft: "4px",
              fontWeight: "500",
            }}
          >
            {unit}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          marginTop: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: "600",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// Composant Badge (Typé)
function Badge({ b }: { b: string }) {
  const map: Record<string, string[]> = {
    "En stock": ["var(--green)", "var(--green-dim)", "rgba(5,150,105,0.2)"],
    Nouveau: ["var(--blue)", "var(--blue-dim)", "rgba(37,99,235,0.2)"],
    "Sur commande": ["var(--gold)", "var(--gold-dim)", "rgba(217,119,6,0.2)"],
    Derniers: ["var(--red)", "var(--red-dim)", "rgba(220,38,38,0.2)"],
  };
  const [color, bg, border] = map[b] || map["En stock"];
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: "600",
        padding: "3px 10px",
        borderRadius: "20px",
        background: bg,
        color,
        border: `1px solid ${border}`,
        whiteSpace: "nowrap",
      }}
    >
      {b}
    </span>
  );
}

export default function OverviewTab({ products }: { products: Product[] }) {
  // Mémos pour la performance
  const stats = useMemo(
    () => ({
      inS: products.filter((p) => !p.on_order).length,
      onO: products.filter((p) => p.on_order).length,
      newI: products.filter((p) => p.badge === "Nouveau").length,
      val: products.reduce((s, p) => s + p.price_ar, 0),
      cats: [...Array.from(new Set(products.map((p) => p.category)))],
    }),
    [products],
  );

  const catColors = [
    "var(--rose)",
    "var(--gold)",
    "var(--blue)",
    "var(--green)",
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "14px",
          flexWrap: "wrap",
          marginBottom: "22px",
        }}
      >
        <Stat
          label="En Boutique"
          value={stats.inS}
          accent="var(--rose)"
          delay={0}
          icon={<I.Bag />}
        />
        <Stat
          label="Sur Commande"
          value={stats.onO}
          accent="var(--gold)"
          delay={80}
          icon={<I.Clock />}
        />
        <Stat
          label="Nouveautés"
          value={stats.newI}
          accent="var(--blue)"
          delay={160}
          icon={<I.Star />}
        />
        <Stat
          label="Valeur totale"
          value={Math.round(stats.val / 1000)}
          unit="K Ar"
          accent="var(--green)"
          delay={240}
          icon={<I.Coin />}
        />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        {/* Catégories */}
        <div
          className={styles.card}
          style={{ animation: "fadeUp .5s var(--ease) .32s both" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "20px",
            }}
          >
            <h3 className={styles.cardTitle}>Par Catégorie</h3>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                fontWeight: "600",
              }}
            >
              {products.length} articles
            </span>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {stats.cats.map((cat, i) => {
              const n = products.filter((p) => p.category === cat).length;
              const pct = products.length
                ? Math.round((n / products.length) * 100)
                : 0;
              return (
                <div
                  key={cat}
                  style={{
                    animation: `fadeUp .4s var(--ease) ${0.4 + i * 0.07}s both`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        fontWeight: "600",
                      }}
                    >
                      {cat}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-primary)",
                        fontWeight: "600",
                      }}
                    >
                      {n}
                    </span>
                  </div>
                  <div
                    style={{
                      height: "4px",
                      background: "var(--surface3)",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: catColors[i % catColors.length],
                        borderRadius: "2px",
                        animation: "fadeIn .9s var(--ease) both",
                        animationDelay: `${0.5 + i * 0.1}s`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Récents */}
        <div
          className={styles.card}
          style={{ animation: "fadeUp .5s var(--ease) .4s both" }}
        >
          <h3
            className={styles.cardTitle}
            style={{
              marginBottom: "18px",
              borderBottom: "none",
              paddingBottom: 0,
            }}
          >
            Créations Récentes
          </h3>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {products.slice(0, 4).map((p, i) => (
              <div
                key={p.id}
                className={styles.recentItem}
                style={{
                  borderBottom: i < 3 ? "1px solid var(--border)" : "none",
                  animation: `fadeUp .35s var(--ease) ${0.45 + i * 0.07}s both`,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 0",
                }}
              >
                <Image
                  src={p.image}
                  alt={p.name}
                  width={38}
                  height={38}
                  style={{
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      fontWeight: "500",
                    }}
                  >
                    {p.category}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.1rem",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  {(p.price_ar / 1000).toFixed(0)}k
                </div>
                <Badge b={p.badge} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
