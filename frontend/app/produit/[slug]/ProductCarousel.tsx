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
  const [active, setActive] = useState(2);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getProducts()
      .then((data) => {
        const filtered = data
          .filter((p) => p.slug !== currentSlug)
          .slice(0, 10) as CarouselProduct[];
        setProducts(filtered);
        setActive(2);
        setLoaded(true);
      })
      .catch(console.error);
  }, [currentSlug]);

  const goNext = useCallback((len: number) => {
    setActive((prev) => (prev + 1 < len ? prev + 1 : 0));
  }, []);

  const goPrev = useCallback((len: number) => {
    setActive((prev) => (prev - 1 >= 0 ? prev - 1 : len - 1));
  }, []);

  const startAutoplay = useCallback((len: number) => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setActive((prev) => (prev + 1 < len ? prev + 1 : 0));
    }, 3000);
  }, []);

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  const isHovered = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!loaded || products.length === 0) return;
    // Vérifier si la souris est déjà dans la section au moment du chargement
    isHovered.current = false;
    startAutoplay(products.length);
    return () => stopAutoplay();
  }, [loaded, products.length, startAutoplay, stopAutoplay]);

  // Style 3D pour chaque card
  const getCardStyle = (index: number): React.CSSProperties => {
    const diff = index - active;
    const absDiff = Math.abs(diff);

    if (absDiff > 3) {
      return { opacity: 0, pointerEvents: "none", zIndex: 0 };
    }

    if (absDiff === 0) {
      return {
        transform: "translateX(-50%) scale(1) perspective(1000px) rotateY(0deg)",
        zIndex: 10,
        filter: "none",
        opacity: 1,
        left: "50%",
      };
    }

    const direction = diff > 0 ? 1 : -1;
    // Espacement: 260px par rang
    const translateX = direction * (260 * absDiff);
    const scale = 1 - 0.15 * absDiff;
    const rotateY = direction * -8;
    const blur = absDiff === 1 ? 1 : absDiff === 2 ? 3 : 6;
    const opacity = absDiff === 1 ? 0.85 : absDiff === 2 ? 0.55 : 0.25;

    return {
      transform: `translateX(calc(-50% + ${translateX}px)) scale(${scale}) perspective(800px) rotateY(${rotateY}deg)`,
      zIndex: 10 - absDiff,
      filter: `blur(${blur}px)`,
      opacity,
      left: "50%",
    };
  };

  if (!loaded || products.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      aria-label="Vous aimerez aussi"
      onMouseEnter={() => {
        isHovered.current = true;
        stopAutoplay();
      }}
      onMouseLeave={() => {
        isHovered.current = false;
        startAutoplay(products.length);
      }}
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
            onClick={() => { stopAutoplay(); goPrev(products.length); startAutoplay(products.length); }}
            aria-label="Produit précédent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button
            className={styles.arrow}
            onClick={() => { stopAutoplay(); goNext(products.length); startAutoplay(products.length); }}
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
                    startAutoplay(products.length);
                  }
                }}
              >
                <Link
                  href={`/produit/${product.slug}`}
                  className={styles.cardLink}
                  tabIndex={isActive ? 0 : -1}
                  onClick={(e) => !isActive && e.preventDefault()}
                  aria-label={`${product.name} — ${product.rawPrice.toLocaleString("fr-FR")} Ar`}
                >
                  <div className={styles.imageWrap}>
                    {product.badge && product.badge !== "En stock" && (
                      <span className={styles.badge}>{product.badge}</span>
                    )}
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      sizes="240px"
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

      {/* Dots */}
      <div className={styles.dots}>
        {products.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === active ? styles.dotActive : ""}`}
            onClick={() => { stopAutoplay(); setActive(i); startAutoplay(products.length); }}
            aria-label={`Produit ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}