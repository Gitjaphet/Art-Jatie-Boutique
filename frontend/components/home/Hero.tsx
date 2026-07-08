"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./Hero.module.css";
import Image from "next/image";

type CSSVars = React.CSSProperties & {
  [key: `--${string}`]: string;
};

const HERO_IMAGES = [
  {
    src: "/images/hero/crochet-sac-madame.jpeg",
    label: "Sac Madame",
    price: "25 000 Ar",
    pos: { top: "15%", left: "55%" },
    size: { w: 200, h: 260 },
    delay: 0,
    floatClass: styles.float0,
  },
  {
    src: "/images/hero/crochet-vetement-efant.jpeg",
    label: "Robe Enfant Fuchsia",
    price: "25 000 Ar",
    pos: { top: "12%", right: "8%" },
    size: { w: 160, h: 210 },
    delay: 0.15,
    floatClass: styles.float1,
  },
  {
    src: "/images/hero/crochet-tenue-plage.jpeg",
    label: "Ensemble Tournesol",
    price: "40 000 Ar",
    pos: { bottom: "18%", left: "53%" },
    size: { w: 180, h: 235 },
    delay: 0.3,
    floatClass: styles.float2,
  },
  {
    src: "/images/hero/crochet-vetement-plage.jpeg",
    label: "Top & Short Émeraude",
    price: "40 000 Ar",
    pos: { bottom: "10%", right: "10%" },
    size: { w: 150, h: 190 },
    delay: 0.45,
    floatClass: styles.float3,
  },
];

export default function Hero() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className={styles.heroRoot}>
      {/* Arrière-plan */}
      <div className={styles.heroBackground}>
        <Image
          src="/images/hero/art-jatie-plage.jpeg"
          alt="Créatrice Art Jatie posant en tenue crochet sur la plage à Madagascar"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          style={{ objectFit: "cover", objectPosition: "center" }}
          quality={80}
        />
      </div>

      {/* Dégradé de superposition */}
      <div className={styles.heroOverlay} />

      {/* Halo lumineux au centre */}
      <div className={styles.centerGlow} />

      {/* Ligne décorative (cachée sur mobile) */}
      <div
        className={`${styles.decoLine} ${ready ? styles.decoLineReady : ""}`}
      />

      {/* Texte ghost arrière-plan (caché sur mobile) */}
      <div
        className={`${styles.ghostText} ${ready ? styles.ghostTextReady : ""}`}
      >
        ART JATIE
      </div>

      {/* Contenu principal texte */}
      <div className={styles.content}>
        <div className={`${styles.badge} ${ready ? styles.badgeReady : ""}`}>
          <span className={styles.badgeDot} />
          Mode Artisanale — Madagascar
        </div>

        <h1 className={`${styles.title} ${ready ? styles.titleReady : ""}`}>
          {"L'Art du"}
          <br />
          Crochet
          <br />
          <span className={styles.titleItalic}>Réinventé.</span>
        </h1>

        <p
          className={`${styles.subtitle} ${ready ? styles.subtitleReady : ""}`}
        >
          Sacs tendances, pantalons fluides, robes et tenues de plage... Chaque
          création est une pièce unique, tissée à la main avec passion par nos
          artisanes.
        </p>

        <div className={`${styles.ctas} ${ready ? styles.ctasReady : ""}`}>
          <Link href="#boutique" className={styles.btnPrimaryWrapper}>
            <button className={styles.btnPrimary}>Voir la collection</button>
          </Link>
          <Link href="/commande" className={styles.btnGhostWrapper}>
            <button className={styles.btnGhost}>Sur mesure →</button>
          </Link>
        </div>
      </div>

      {/* Photos flottantes */}
      <div className={styles.heroPhotos}>
        {HERO_IMAGES.map((img, i) => (
          <div
            key={i}
            className={`${styles.photoCard} ${img.floatClass} ${ready ? styles.photoCardReady : ""}`}
            style={
              {
                ...img.pos,
                width: img.size.w,
                height: img.size.h,
                "--card-rot": `${[-2, 3, -1.5, 2.5][i]}deg`,
                transitionDelay: `${img.delay + 0.4}s`,
                zIndex: [8, 7, 8, 7][i],
              } as CSSVars
            }
          >
            <Image
              src={img.src}
              alt={img.label}
              fill
              sizes={`(max-width: 339px) 90px, (max-width: 389px) 100px, (max-width: 430px) 118px, (max-width: 1024px) 160px, ${img.size.w}px`}
              style={{ objectFit: "cover" }}
            />
            <div className={styles.photoCardLabel}>
              <p className={styles.cardEyebrow}>Art Jatie</p>
              <p className={styles.cardTitle}>{img.label}</p>
              <p className={styles.cardPrice}>{img.price}</p>
            </div>
          </div>
        ))}

        {/* Badge stat flottant */}
        <div
          className={`${styles.statBadge} ${ready ? styles.statBadgeReady : ""}`}
          style={{
            top: "42%",
            left: "48%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <p className={styles.statEyebrow}>Clientes satisfaites</p>
          <p className={styles.statValue}>100+ ★ 4.9</p>
        </div>
      </div>

      {/* Scroll indicator (caché sur mobile) */}
      <div className={`${styles.scroll} ${ready ? styles.scrollReady : ""}`}>
        <div className={styles.scrollLine} />
        <span className={styles.scrollText}>Défiler</span>
      </div>

      {/* Numéro de page éditorial (caché sur mobile) */}
      <div
        className={styles.editorialNumber}
        style={{ opacity: ready ? 1 : 0 }}
      >
        <span>Art Jatie</span>
        <span className={styles.editorialDigit}>01</span>
      </div>
    </section>
  );
}
