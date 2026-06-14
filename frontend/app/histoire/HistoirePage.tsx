"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import styles from "./HistoirePage.module.css";

/* ============================================================
   HOOK PERSONNALISÉ CORRIGÉ
   ============================================================ */
function useInView() {
  const [inView, setInView] = useState(false);
  const [node, setNode] = useState<HTMLElement | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    setNode(node);
  }, []);

  useEffect(() => {
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.15 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return { ref, inView };
}

/* ============================================================
   DONNÉES
   ============================================================ */
const VALEURS = [
  {
    icon: "🤲",
    titre: "Fait Main",
    texte:
      "Chaque pièce est entièrement réalisée à la main avec soin et précision. Aucune machine ne remplace le toucher humain dans notre atelier.",
  },
  {
    icon: "🌿",
    titre: "Authenticité",
    texte:
      "Nos créations reflètent l'âme de Madagascar — ses couleurs, ses textures, son savoir-faire ancestral transmis de génération en génération.",
  },
  {
    icon: "♻️",
    titre: "Durabilité",
    texte:
      "Nous utilisons des matières naturelles et durables. Acheter Art Jatie, c'est choisir une mode responsable et éthique.",
  },
];

const ETAPES = [
  {
    numero: "01",
    titre: "Inspiration",
    texte:
      "La nature, les couleurs de Madagascar et les tendances mondiales guident chaque nouvelle création.",
  },
  {
    numero: "02",
    titre: "Création",
    texte:
      "Chaque maille est tricotée à la main dans notre atelier avec des fils soigneusement sélectionnés.",
  },
  {
    numero: "03",
    titre: "Finition",
    texte:
      "Les détails font la différence — boutons, coutures, ajustements sont vérifiés avec soin.",
  },
  {
    numero: "04",
    titre: "Livraison",
    texte:
      "Votre commande est emballée avec amour et livrée partout à Madagascar et à l'international.",
  },
];

/* ============================================================
   COMPOSANT PRINCIPAL
   ============================================================ */
export default function HistoirePage() {
  const { ref: histoireRef, inView: histoireInView } = useInView();
  const { ref: valeursRef, inView: valeursInView } = useInView();
  const { ref: processusRef, inView: processusInView } = useInView();
  const { ref: fondatriceRef, inView: fondatriceInView } = useInView();

  return (
    <main className={styles.pageMain}>
      {/* ── 1. HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image
            src="/images/hero/art-jatie-plage.png"
            alt="Art Jatie - Collection"
            fill
            className={styles.heroImage}
            priority
          />
          <div className={styles.heroOverlay} />
        </div>
        <div className={styles.heroContent}>
          <p className={styles.heroSurtitle}>Notre Histoire</p>
          <h1 className={styles.heroTitle}>
            L&apos;art du crochet,
            <br />
            né à Madagascar
          </h1>
          <p className={styles.heroSubtitle}>
            &ldquo;Chaque maille raconte une histoire, chaque pièce porte une
            âme.&rdquo;
          </p>
        </div>
      </section>

      {/* ── 2. NOTRE HISTOIRE ── */}
      <section className={styles.section}>
        <div
          ref={histoireRef}
          className={`${styles.histoireLayout} ${histoireInView ? styles.fadeIn : styles.fadeOut}`}
        >
          <div className={styles.histoireImageWrapper}>
            <Image
              src="/images/hero/crochet-sac-madame.jpeg"
              alt="Notre atelier"
              fill
              className={styles.histoireImage}
            />
            <div className={styles.histoireBadge}>Depuis 2023</div>
          </div>

          <div className={styles.histoireTexte}>
            <span className={styles.sectionTag}>Notre Histoire</span>
            <h2 className={styles.sectionTitre}>
              Une passion née
              <br />
              du fil et du coeur
            </h2>
            <p className={styles.paragraph}>
              Art Jatie est née en 2023 à Lazaret CUR Belle Rose, Diego-Suarez, d'une passion profonde
              pour l'artisanat malgache et le crochet. Ce qui a commencé comme un hobby
              dans un petit atelier familial s'est transformé en une marque reconnue à
              Madagascar pour la qualité et l'authenticité de ses créations.
            </p>
            <p className={styles.paragraph}>
              Inspirée par la richesse culturelle de Madagascar et les tendances de la mode
              internationale, Art Jatie crée des pièces uniques qui allient tradition et modernité.
              Chaque tenue, sac ou maillot de bain en crochet est le fruit de longues heures
              de travail manuel, tissé à la main avec des fils soigneusement sélectionnés.
            </p>
            <p className={styles.paragraph}>
              En 2025, l'atelier a posé ses valises à Seganinga, Nosy Be, pour se rapprocher
              d'une clientèle internationale et s'épanouir dans l'écrin naturel de l'île aux
              parfums. Aujourd'hui, Art Jatie habille des femmes, des hommes et des enfants
              à travers toute Madagascar et à l'international — portant haut les couleurs
              du savoir-faire artisanal malgache.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. NOS VALEURS ── */}
      <section className={`${styles.section} ${styles.sectionBeige}`}>
        <div
          ref={valeursRef}
          className={`${styles.valeursContainer} ${valeursInView ? styles.fadeIn : styles.fadeOut}`}
        >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Ce qui nous guide</span>
            <h2 className={styles.sectionTitre}>Nos Valeurs</h2>
          </div>
          <div className={styles.valeursGrid}>
            {VALEURS.map((v, i) => (
              <div key={i} className={styles.valeurCard}>
                <div className={styles.valeurIcon}>{v.icon}</div>
                <h3 className={styles.valeurTitre}>{v.titre}</h3>
                <p className={styles.valeurTexte}>{v.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. PROCESSUS ── */}
      <section className={styles.section}>
        <div
          ref={processusRef}
          className={processusInView ? styles.fadeIn : styles.fadeOut}
        >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Comment on travaille</span>
            <h2 className={styles.sectionTitre}>Notre Processus</h2>
          </div>
          <div className={styles.etapesGrid}>
            {ETAPES.map((e, i) => (
              <div key={i} className={styles.etapeCard}>
                <div className={styles.etapeNumero}>{e.numero}</div>
                <h3 className={styles.etapeTitre}>{e.titre}</h3>
                <p className={styles.etapeTexte}>{e.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. LA FONDATRICE ── */}
      <section className={`${styles.section} ${styles.sectionBeige}`}>
        <div
          ref={fondatriceRef}
          className={`${styles.fondatriceLayout} ${fondatriceInView ? styles.fadeIn : styles.fadeOut}`}
        >
          <div className={styles.fondatriceTexte}>
            <span className={styles.sectionTag}>La fondatrice</span>
            <h2 className={styles.sectionTitre}>BEVAO Noeline Jennita</h2>
            <p className={styles.paragraph}>
              Passionnée de crochet depuis l&apos;enfance, Jenny a toujours rêvé
              de valoriser l&apos;artisanat malgache sur la scène
              internationale. Après des années de pratique et de
              perfectionnement, elle a fondé Art Jatie avec une vision claire :
              créer des pièces belles, durables et accessibles.
            </p>
            <p className={styles.paragraph}>
              Aujourd&apos;hui, elle dirige une petite équipe d&apos;artisans
              passionnés, partageant son savoir-faire et sa vision d&apos;une
              mode plus humaine et authentique.
            </p>
            <blockquote className={styles.citation}>
              &ldquo;Je crée chaque pièce comme si c&apos;était un cadeau — avec
              amour, soin et l&apos;intention qu&apos;elle rende celle qui la
              porte unique.&rdquo;
            </blockquote>
            <p className={styles.citationAuteur}>
              — BEVAO Noeline Jennita, Fondatrice
            </p>
          </div>

          {/* ── IMAGE BLOB STYLÉE ── */}
          <div className={styles.fondatriceBlob}>
            <svg
              className={styles.blobSvg}
              viewBox="0 0 200 280"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <clipPath id="blobClip">
                  <path
                    d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,73.1,42.2C64.8,55.2,53.8,66.6,40.4,74.1C27,81.6,11.3,85.1,-3.8,90.7C-18.9,96.3,-37.8,103.9,-52.2,98.6C-66.6,93.3,-76.5,75,-82.8,57.2C-89.1,39.4,-91.8,22.1,-89.8,5.7C-87.8,-10.6,-81.1,-26,-72.3,-39.7C-63.5,-53.4,-52.6,-65.4,-39.4,-73.2C-26.2,-81,-13.1,-84.6,1.2,-86.8C15.5,-89,30.6,-83.6,44.7,-76.4Z"
                    transform="translate(100 120)"
                  />
                </clipPath>
              </defs>
              <image
                href="/images/hero/art-jatie-plage.jpeg"
                x="5"
                y="-6"
                width="200"
                height="290"
                clipPath="url(#blobClip)"
                preserveAspectRatio="xMidYMid slice"
              />
            </svg>

            {/* Blob décoratif derrière */}
            <svg
              className={styles.blobDeco}
              viewBox="0 0 200 280"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,73.1,42.2C64.8,55.2,53.8,66.6,40.4,74.1C27,81.6,11.3,85.1,-3.8,90.7C-18.9,96.3,-37.8,103.9,-52.2,98.6C-66.6,93.3,-76.5,75,-82.8,57.2C-89.1,39.4,-91.8,22.1,-89.8,5.7C-87.8,-10.6,-81.1,-26,-72.3,-39.7C-63.5,-53.4,-52.6,-65.4,-39.4,-73.2C-26.2,-81,-13.1,-84.6,1.2,-86.8C15.5,-89,30.6,-83.6,44.7,-76.4Z"
                transform="translate(100 110)"
                fill="#fdf0f4"
                stroke="#e86b8c"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* ── 6. CTA FINAL ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaImageWrapper}>
          <Image
            src="/images/hero/art-jatie-plage.png"
            alt="Collection Art Jatie"
            fill
            className={styles.ctaImage}
          />
          <div className={styles.ctaOverlay} />
        </div>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitre}>
            Prête à porter l&apos;artisanat malgache ?
          </h2>
          <p className={styles.ctaTexte}>
            Découvrez nos collections ou créez votre pièce sur mesure avec nous.
          </p>
          <div className={styles.ctaBtns}>
            <Link href="/boutique" className={styles.btnPrimary}>
              Voir la Boutique
            </Link>
            <Link href="/commande" className={styles.btnSecondary}>
              Commander sur mesure
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
