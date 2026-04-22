"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import styles from "./BubbleGrid.module.css";
import Image from "next/image";

const FEATURED_PRODUCTS = [
  {
    id: "1",
    name: "Robe Filet",
    nameAccent: "Corail.",
    category: "Collection Plage",
    desc: "Une robe en crochet délicate, parfaite pour vos balades en bord de mer. Ses mailles aérées et sa couleur corail vibrante capturent l'essence même de l'été.",
    price: "85 000 Ar",
    slug: "robe-filet-corail",
    image: "/images/hero/crochet-vetement-plage.jpeg",
    index: "001",
  },
  {
    id: "2",
    name: "Ensemble",
    nameAccent: "Tournesol.",
    category: "Tenues d'Été",
    desc: "Cet ensemble deux pièces est un incontournable de la saison. Tissé à la main avec un fil de coton doux, il offre un confort absolu tout en restant incroyablement chic.",
    price: "68 000 Ar",
    slug: "ensemble-tournesol",
    image: "/images/hero/crochet-sac-madame.jpeg",
    index: "002",
  },
  {
    id: "3",
    name: "Top Vert",
    nameAccent: "Émeraude.",
    category: "Hauts",
    desc: "Un crop top en maille serrée qui se marie parfaitement avec un pantalon taille haute. Sa teinte émeraude profonde met en valeur toutes les carnations.",
    price: "38 000 Ar",
    slug: "top-vert-emeraude",
    image: "/images/hero/crochet-vetement-efant.jpeg",
    index: "003",
  },
];

export default function BubbleGrid() {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    const rows = listRef.current?.querySelectorAll(`.${styles.row}`);
    rows?.forEach((row) => observer.observe(row));

    const footer = listRef.current
      ?.closest("section")
      ?.querySelector(`.${styles.footer}`);
    if (footer) observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.root}>
      {/* HEADER */}
      <div className={styles.header}>
        <p className={styles.eyebrow}>Nos Créations</p>
        <h2 className={styles.sectionTitle}>
          Sélection <em>Éditoriale</em>
        </h2>
      </div>

      {/* LIST */}
      <div className={styles.list} ref={listRef}>
        {FEATURED_PRODUCTS.map((product, i) => (
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
                  alt={product.name}
                  /* On remplace width/height par fill */
                  fill
                  /* sizes aide Next.js à choisir la bonne résolution d'image */
                  sizes="(max-width: 860px) 100vw, 50vw"
                  /* On garde objectFit pour ne pas déformer l'image */
                  style={{ objectFit: "cover" }}
                  className={styles.img}
                />
              </div>
            </div>

            <div className={styles.txtCol}>
              <span className={styles.num}>
                No. {product.index} — Art Jatie
              </span>
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
