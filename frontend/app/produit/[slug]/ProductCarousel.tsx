"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/api";
import styles from "./ProductCarousel.module.css";

type CarouselProduct = {
  id: number;
  name: string;
  slug: string;
  rawPrice: number;
  badge?: string;
  tag?: string;
  image: string;
  imagesString: string;
};

export default function ProductCarousel({ currentSlug }: { currentSlug: string }) {
  const [products, setProducts] = useState<CarouselProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(3);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getProducts()
      .then((data) => {
        const filtered = data
          .filter((p) => p.slug !== currentSlug)
          .slice(0, 10) as CarouselProduct[];
        setProducts(filtered);
        setActive(Math.min(3, Math.floor(filtered.length / 2)));
        setLoaded(true);
      })
      .catch(console.error);
  }, [currentSlug]);

  const goNext = useCallback(() => {
    setActive((prev) => (prev + 1 < products.length ? prev + 1 : prev));
  }, [products.length]);

  const goPrev = useCallback(() => {
    setActive((prev) => (prev - 1 >= 0 ? prev - 1 : prev));
  }, []);

  const startAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setActive((prev) => {
        if (prev + 1 < products.length) return prev + 1;
        return 0; // retour au début
      });
    }, 3000);
  }, [products.length]);

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (loaded && products.length > 0) startAutoplay();
    return () => stopAutoplay();
  }, [loaded, products.length, startAutoplay, stopAutoplay]);

  // Calcul du style 3D de chaque card selon sa position par rapport à active
  const getCardStyle = (index: number): React.CSSProperties => {
    const diff = index - active;
    const absDiff = Math.abs(diff);

    if (absDiff === 0) {
      return {
        transform: "translateX(0) scale(1)",
        zIndex: 10,
        filter: "none",
        opacity: 1,
      };
    }

    const direction = diff > 0 ? 1 : -1;
    const translateX = direction * (130 * absDiff);
    const scale = Math.max(1 - 0.18 * absDiff, 0.46);
    const rotateY = direction * -1;
    const blur = absDiff > 2 ? 8 : absDiff * 3;
    const opacity = absDiff > 2 ? 0 : absDiff === 2 ? 0.4 : 0.7;

    return {
      transform: `translateX(${translateX}px) scale(${scale}) perspective(16px) rotateY(${rotateY}deg)`,
      zIndex: -absDiff,
      filter: `blur(${blur}px)`,
      opacity,
    };
  };

  if (!loaded || products.length === 0) return null;

  return (
    <section
      className={styles.section}
      aria-label="Vous aimerez aussi"
      onMouseEnter={stopAutoplay}
      onMouseLeave={startAutoplay}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>Découvrir</span>
          <h2 className={styles.title}>Vous aimerez aussi</h2>
        </div>
        <div className={styles.arrows}>
          <button
            className={styles.arrow}
            onClick={goPrev}
            disabled={active === 0}
            aria-label="Produit précédent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button
            className={styles.arrow}
            onClick={goNext}
            disabled={active === products.length - 1}
            aria-label="Produit suivant"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Carousel 3D */}
      <div className={styles.sliderWrap}>
        <div className={styles.slider}>
          {products.map((product, index) => {
            const imageUrl =
              product.image ||
              (product.imagesString ? product.imagesString.split(",")[0].trim() : "") ||
              "/placeholder.jpg";
            const isActive = index === active;

            return (
              <div
                key={product.id}
                className={`${styles.item} ${isActive ? styles.itemActive : ""}`}
                style={getCardStyle(index)}
                onClick={() => {
                  if (!isActive) {
                    stopAutoplay();
                    setActive(index);
                    startAutoplay();
                  }
                }}
              >
                <Link
                  href={`/produit/${product.slug}`}
                  className={styles.cardLink}
                  tabIndex={isActive ? 0 : -1}
                  aria-label={`${product.name} — ${product.rawPrice.toLocaleString("fr-FR")} Ar`}
                  onClick={(e) => !isActive && e.preventDefault()}
                >
                  <div className={styles.imageWrap}>
                    {product.badge && product.badge !== "En stock" && (
                      <span className={styles.badge}>{product.badge}</span>
                    )}
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      sizes="260px"
                      className={styles.image}
                      priority={isActive}
                    />
                  </div>
                  <div className={styles.info}>
                    {product.tag && <span className={styles.tag}>{product.tag}</span>}
                    <p className={styles.name}>{product.name}</p>
                    <p className={styles.price}>
                      {product.rawPrice.toLocaleString("fr-FR")}{" "}
                      <span className={styles.currency}>Ar</span>
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots pagination */}
      <div className={styles.dots} aria-label="Navigation carousel">
        {products.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === active ? styles.dotActive : ""}`}
            onClick={() => { stopAutoplay(); setActive(i); startAutoplay(); }}
            aria-label={`Aller au produit ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}