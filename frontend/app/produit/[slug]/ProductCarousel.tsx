"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/api";
import styles from "./ProductCarousel.module.css";

// Type issu du retour de getProducts()
type CarouselProduct = {
  id: number;
  name: string;
  slug: string;
  rawPrice: number;
  image: string;
  imagesString: string;
};

export default function ProductCarousel({ currentSlug }: { currentSlug: string }) {
  const [products, setProducts] = useState<CarouselProduct[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    getProducts()
      .then((data) => {
        const filtered = data
          .filter((p) => p.slug !== currentSlug)
          .slice(0, 20) as CarouselProduct[];
        setProducts(filtered);
      })
      .catch((err) => console.error("Carousel produits:", err));
  }, [currentSlug]);

  const updateScrollButtons = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  const scroll = (dir: "left" | "right") => {
    trackRef.current?.scrollBy({
      left: dir === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  if (products.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Vous aimerez aussi</h2>
        <div className={styles.arrows}>
          <button
            className={styles.arrow}
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Précédent"
          >←</button>
          <button
            className={styles.arrow}
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Suivant"
          >→</button>
        </div>
      </div>

      <div
        ref={trackRef}
        className={styles.track}
        onScroll={updateScrollButtons}
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
            >
              <div className={styles.imageWrap}>
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  sizes="220px"
                  className={styles.image}
                />
              </div>
              <div className={styles.info}>
                <p className={styles.name}>{product.name}</p>
                <p className={styles.price}>
                  {product.rawPrice.toLocaleString("fr-FR")} Ar
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}