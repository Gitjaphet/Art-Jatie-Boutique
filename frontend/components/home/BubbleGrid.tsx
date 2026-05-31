"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./BubbleGrid.module.css";
import Image from "next/image";
import { getProducts } from "../../lib/api"; // ⚠️ Vérifiez que ce chemin est correct

// Les données de secours au cas où l'API est indisponible ou vide
const FALLBACK_PRODUCTS = [
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

export default function BubbleGrid() {
  const listRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<FormattedProduct[]>([]);

  // 1. Récupération des données dynamiques
  useEffect(() => {
    const fetchEditorialData = async () => {
      try {
        const allProducts = await getProducts();

        // On garde uniquement les "Coup de coeur" et on trie du plus récent au plus ancien
        const hotProducts = allProducts
          .filter((p: any) => p.hot)
          .sort((a: any, b: any) => b.id - a.id)
          .slice(0, 3); // On ne prend que les 3 premiers

        if (hotProducts.length > 0) {
          const formatted = hotProducts.map((p: any, i: number) => {
            // Séparation intelligente du nom
            const words = p.name.trim().split(" ");
            let baseName = p.name;
            let accentName = "";

            if (words.length > 1) {
              const last = words.pop() || "";
              // On s'assure d'ajouter le point à la fin du dernier mot ("Corail" -> "Corail.")
              accentName = last.replace(/\.$/, "") + "."; 
              baseName = words.join(" ");
            } else {
              baseName = "";
              accentName = p.name.replace(/\.$/, "") + ".";
            }

            return {
              id: p.id.toString(),
              name: baseName,
              nameAccent: accentName,
              category: p.category || "Sélection",
              desc: p.description || "Une création unique Art Jatie, tissée à la main.",
              price: p.price,
              slug: p.slug,
              image: p.image,
              index: String(i + 1).padStart(3, "0"), // Transforme 1 en "001"
            };
          });
          setProducts(formatted);
        } else {
          setProducts(FALLBACK_PRODUCTS);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la section éditoriale", error);
        setProducts(FALLBACK_PRODUCTS);
      }
    };

    fetchEditorialData();
  }, []);

  // 2. Gestion des animations d'apparition au scroll
  // (On l'exécute uniquement une fois que les 'products' sont chargés)
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
  }, [products]); // <-- Se déclenche quand la liste est prête

  // Pendant le chargement, on peut afficher un état vide ou garder les classes
  if (products.length === 0) return null; 

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
              <span className={styles.num}>
                No. {product.index} — Art Jatie
              </span>
              <h3 className={styles.name}>{product.name}</h3>
              {/* Le nom accentué (dernier mot en rose) est géré ici */}
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