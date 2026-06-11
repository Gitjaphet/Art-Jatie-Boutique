"use client";

import styles from "./BoutiqueSection.module.css";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../lib/googleAuth";
import { useCartStore } from "../../lib/cart";

/* ── Types ── */
interface Product {
  id: number;
  name: string;
  subtitle: string;
  price: string;
  rawPrice?: number;
  oldPrice?: string;
  badge: "En stock" | "Derniers" | "Rupture" | "Nouveau" | string;
  tag: string;
  color: string;
  image: string;
  hot?: boolean;
  is_hot?: boolean;
  on_order?: boolean;
  slug?: string;
  category?: string;
}

/* Badge color mapping */
const BADGE_COLORS: Record<string, string> = {
  "En stock": "#2d9b6f",
  Derniers: "#d97706",
  Rupture: "#b91c1c",
  Nouveau: "#7c3aed",
};

/* ── Composant carte ── */
function ProductCard({ product, index }: { product: Product; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [added, setAdded] = useState(false);

  const { user, setShowLoginModal, setOnLoginSuccess } = useAuth();
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const badgeColor = BADGE_COLORS[product.badge] || "#000000";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const doAdd = () => {
      const priceVal =
        product.rawPrice ||
        parseInt(product.price.replace(/\D/g, ""), 10) ||
        0;

      addItem({
        id: product.id,
        name: product.name,
        price: priceVal,
        quantity: 1,
        image: product.image,
        category: product.category || "",
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    };

    if (!user) {
      setOnLoginSuccess(() => doAdd);
      setShowLoginModal(true);
    } else {
      doAdd();
    }
  };

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${visible ? styles.cardVisible : ""}`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <div className={styles.cardImage} style={{ background: product.color }}>
        <div className={styles.cardPattern} aria-hidden="true" />

        <div className={styles.productImageWrapper}>
          <Image
            src={product.image}
            alt={product.name}
            className={styles.mainProductImg}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
          />
        </div>

        {product.badge && (
          <span
            className={styles.stockBadge}
            style={{ background: badgeColor }}
          >
            <span className={styles.stockDot} />
            {product.badge}
          </span>
        )}

        {(product.hot || product.is_hot) && (
          <span className={styles.hotBadge}>♥ Coup de cœur</span>
        )}

        <div className={styles.cardOverlay}>
          <Link
            href={
              product.slug
                ? `/produit/${product.slug}${product.on_order ? "?mode=sur-mesure" : ""}`
                : "#"
            }
            className={styles.quickBtn}
            aria-label={`Voir le produit ${product.name}`}
          >
            Voir le produit
            <span className={styles.quickArrow}>→</span>
          </Link>
        </div>
      </div>

      <div className={styles.cardBody}>
        <span className={styles.cardTag}>{product.tag}</span>
        <h3 className={styles.cardName}>{product.name}</h3>
        <p className={styles.cardSub}>{product.subtitle}</p>

        <div className={styles.cardFooter}>
          <div className={styles.cardPrices}>
            <span className={styles.cardPrice}>{product.price}</span>
            {product.oldPrice && (
              <span className={styles.cardOldPrice}>{product.oldPrice}</span>
            )}
          </div>

          <button
            className={`${styles.addBtn} ${added ? styles.addedAnim : ""}`}
            aria-label={`Commander ${product.name}`}
            onClick={handleAddToCart}
            disabled={added}
          >
            {added ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Types props ── */
type BoutiqueSectionProps = {
  products: Product[];
};

/* ── Section principale ── */
export default function BoutiqueSection({ products }: BoutiqueSectionProps) {
  const titleRef = useRef<HTMLDivElement>(null);
  const [titleVisible, setTitleVisible] = useState(false);

  // ✅ Animation du titre restaurée
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTitleVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    if (titleRef.current) observer.observe(titleRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.root}>
      <div className={styles.bgBlob1} aria-hidden="true" />
      <div className={styles.bgBlob2} aria-hidden="true" />
      <span className={styles.watermark} aria-hidden="true">B</span>

      <div className={styles.container}>
        <div
          className={`${styles.header} ${titleVisible ? styles.headerVisible : ""}`}
          ref={titleRef}
        >
          <div className={styles.eyebrowRow}>
            <span className={styles.eyebrowLine} />
            <p className={styles.eyebrow}>Notre Boutique</p>
            <span className={styles.eyebrowLine} />
          </div>

          <h2 className={styles.title}>
            Nos créations
            <span className={styles.titleItalic}> phares</span>
          </h2>

          <p className={styles.subtitle}>
            Chaque pièce est tissée à la main par nos artisanes malgaches —
            unique, éthique et livrée chez vous.
          </p>
        </div>

        <div className={styles.grid}>
          {products.length > 0 ? (
            products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))
          ) : (
            <p style={{ textAlign: "center", width: "100%", padding: "2rem" }}>
              Aucun produit disponible pour le moment.
            </p>
          )}
        </div>

        <div className={styles.cta}>
          <Link href="/boutique" className={styles.ctaBtn}>
            <span className={styles.ctaBtnInner}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.68l1.62-8.32H6" />
              </svg>
              Voir toute la boutique
            </span>
            <span className={styles.ctaBtnArrow} aria-hidden="true">→</span>
          </Link>

          <p className={styles.ctaHint}>
            +50 créations disponibles · Livraison dans toute Madagascar
          </p>
        </div>
      </div>
    </section>
  );
}