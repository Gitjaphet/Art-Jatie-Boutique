"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import styles from "./BubbleGrid.module.css";
import Image from "next/image";

interface FormattedProduct {
  id: string;
  name: string;
  nameAccent: string;
  category: string;
  desc: string;
  price: string;
  slug: string;
  image: string;
  index: string;
}

type BubbleGridProps = {
  products: FormattedProduct[];
};

export default function BubbleGrid({ products }: BubbleGridProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (products.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const rows = listRef.current?.querySelectorAll(`.${styles.row}`);
    rows?.forEach((row) => observer.observe(row));

    const footer = listRef.current
      ?.closest("section")
      ?.querySelector(`.${styles.footer}`);
    if (footer) observer.observe(footer);

    return () => observer.disconnect();
  }, [products]);

  if (products.length === 0) return null;

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Nos Créations</p>
        <h2 className={styles.sectionTitle}>
          Sélection <em>Éditoriale</em>
        </h2>
      </div>

      <div className={styles.list} ref={listRef}>
        {products.map((product, i) => (
          <div
            key={product.id}
            className={styles.row}
            style={{ "--delay": `${i * 0.15}s` } as React.CSSProperties}
          >
            <span className={styles.watermark}>0{i + 1}</span>

            <div className={styles.imgCol}>
              <div className={styles.frame}>
                <span className={styles.badge}>{product.category}</span>
                <Image
                  src={product.image}
                  alt={product.name + " " + product.nameAccent}
                  fill
                  sizes="(max-width: 860px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                  className={styles.img}
                />
              </div>
            </div>

            <div className={styles.txtCol}>
              <span className={styles.num}>No. {product.index} — Art Jatie</span>
              <h3 className={styles.name}>{product.name}</h3>
              <p className={styles.nameAccent}>{product.nameAccent}</p>
              <div className={styles.sep}>
                <div className={styles.sepLine} />
                <div className={styles.sepDot} />
              </div>
              <p className={styles.desc}>{product.desc}</p>
              <div className={styles.bottom}>
                <span className={styles.price}>{product.price}</span>
                <Link href={`/produit/${product.slug}`} className={styles.btn}>
                  <span>Voir le produit</span>
                  <span className={styles.arrow}>→</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}