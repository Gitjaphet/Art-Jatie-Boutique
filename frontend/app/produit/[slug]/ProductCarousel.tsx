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
  const [loaded, setLoaded] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, scrollLeft: 0 });

  useEffect(() => {
    getProducts()
      .then((data) => {
        setProducts(
          data.filter((p) => p.slug !== currentSlug).slice(0, 20) as CarouselProduct[]
        );
        setLoaded(true);
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

  const onMouseDown = (e: React.MouseEvent) => {
    const el = trackRef.current;
    if (!el) return;
    isDragging.current = true;
    dragStart.current = { x: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    el.style.cursor = "grabbing";
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const el = trackRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = dragStart.current.scrollLeft - (x - dragStart.current.x);
  };
  const stopDrag = () => {
    isDragging.current = false;
    if (trackRef.current) trackRef.current.style.cursor = "grab";
  };

  if (!loaded || products.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Vous aimerez aussi">
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button
            className={styles.arrow}
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Produits suivants"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className={styles.track}
        onScroll={updateScrollButtons}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        {products.map((product) => {
          const imageUrl =
            product.image ||
            (product.imagesString ? product.imagesString.split(",")[0].trim() : "") ||
            "/placeholder.jpg";

          return (
            <Link
              key={product.id}
              href={`/produit/${product.slug}`}
              className={styles.card}
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
                  sizes="(max-width: 640px) 160px, 220px"
                  className={styles.image}
                />
                <div className={styles.overlay}>
                  <span className={styles.overlayText}>Voir le produit</span>
                </div>
              </div>

              <div className={styles.info}>
                {product.tag && <span className={styles.tag}>{product.tag}</span>}
                <p className={styles.name}>{product.name}</p>
                <p className={styles.price}>
                  {product.rawPrice.toLocaleString("fr-FR")} <span className={styles.currency}>Ar</span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}