"use client";

import { useEffect, useState, useRef } from "react";
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
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, scrollLeft: 0 });

  // Intersection Observer → reveal au scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    getProducts()
      .then((data) => {
        setProducts(
          data
            .filter((p) => p.slug !== currentSlug)
            .slice(0, 20) as CarouselProduct[]
        );
      })
      .catch(console.error);
  }, [currentSlug]);

  const updateScrollButtons = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  const scroll = (dir: "left" | "right") => {
    trackRef.current?.scrollBy({ left: dir === "left" ? -640 : 640, behavior: "smooth" });
  };

  // Drag-to-scroll (desktop)
  const onMouseDown = (e: React.MouseEvent) => {
    const el = trackRef.current;
    if (!el) return;
    setIsDragging(true);
    dragStart.current = { x: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const el = trackRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = dragStart.current.scrollLeft - (x - dragStart.current.x);
  };
  const stopDrag = () => setIsDragging(false);

  if (products.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className={`${styles.section} ${visible ? styles.sectionVisible : ""}`}
      aria-label="Vous aimerez aussi"
    >
      {/* En-tête */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>Découvrir</span>
          <h2 className={styles.title}>Vous aimerez aussi</h2>
        </div>
        <div className={styles.arrows}>
          <button
            className={styles.arrow}
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Produits précédents"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button
            className={styles.arrow}
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Produits suivants"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Track scrollable */}
      <div
        ref={trackRef}
        className={`${styles.track} ${isDragging ? styles.dragging : ""}`}
        onScroll={updateScrollButtons}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        {products.map((product, i) => {
          const imageUrl =
            product.image ||
            (product.imagesString ? product.imagesString.split(",")[0].trim() : "") ||
            "/placeholder.jpg";

          return (
            <Link
              key={product.id}
              href={`/produit/${product.slug}`}
              className={`${styles.card} ${visible ? styles.cardVisible : ""}`}
              style={{ transitionDelay: `${Math.min(i * 60, 360)}ms` }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              aria-label={`${product.name} — ${product.rawPrice.toLocaleString("fr-FR")} Ar`}
            >
              <div className={`${styles.imageWrap} ${activeIndex === i ? styles.imageWrapActive : ""}`}>
                {/* Badge */}
                {product.badge && product.badge !== "En stock" && (
                  <span className={styles.badge}>{product.badge}</span>
                )}

                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 160px, 220px"
                  className={`${styles.image} ${activeIndex === i ? styles.imageActive : ""}`}
                />

                {/* Overlay au hover */}
                <div className={`${styles.overlay} ${activeIndex === i ? styles.overlayActive : ""}`}>
                  <span className={styles.overlayText}>Voir le produit</span>
                </div>
              </div>

              <div className={styles.info}>
                {product.tag && (
                  <span className={styles.tag}>{product.tag}</span>
                )}
                <p className={styles.name}>{product.name}</p>
                <p className={styles.price}>
                  {product.rawPrice.toLocaleString("fr-FR")} <span className={styles.currency}>Ar</span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Indicateur de scroll mobile */}
      <div className={styles.scrollHint} aria-hidden="true">
        <span className={styles.scrollLine} />
      </div>
    </section>
  );
}