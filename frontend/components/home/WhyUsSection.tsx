"use client";

import { useRef, useState, useEffect } from "react";
import styles from "./WhyUsSection.module.css";

/* ── Raisons ── */
const REASONS = [
  {
    id: 1,
    num: "01",
    icon: "✦",
    title: "100% Fait Main",
    titleItalic: "à Madagascar",
    desc: "Chaque maille est nouée par nos artisanes formées et rémunérées équitablement. Pas d'usine, pas de machine — uniquement des mains expertes et du fil de qualité.",
    accent: "#e86b8c",
    stat: "15+ artisanes",
  },
  {
    id: 2,
    num: "02",
    icon: "◈",
    title: "Qualité",
    titleItalic: "sans compromis",
    desc: "Fils certifiés, teintures naturelles, finitions soignées. Chaque pièce passe par un contrôle rigoureux avant de partir chez vous — zéro défaut, zéro approximation.",
    accent: "#c2a87a",
    stat: "★ 4.9 / 5",
  },
  {
    id: 3,
    num: "03",
    icon: "❋",
    title: "Sur Mesure",
    titleItalic: "& personnalisé",
    desc: "Votre taille, votre couleur, vos envies. Nous créons à la demande et collaborons avec vous jusqu'à ce que la pièce soit exactement ce que vous aviez imaginé.",
    accent: "#7b9e87",
    stat: "500+ clientes",
  },
  {
    id: 4,
    num: "04",
    icon: "⬡",
    title: "Livraison",
    titleItalic: "partout à Mada",
    desc: "Commandez depuis Tana, Tamatave, Diego ou Tuléar — nous livrons partout à Madagascar. Emballage cadeau soigné inclus à chaque commande.",
    accent: "#9b72cf",
    stat: "48h en moyenne",
  },
];

/* ── Composant carte raison ── */
function ReasonCard({
  reason,
  index,
}: {
  reason: (typeof REASONS)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.card} ${visible ? styles.cardVisible : ""}`}
      style={
        {
          transitionDelay: `${index * 0.12}s`,
          "--accent": reason.accent,
        } as React.CSSProperties
      }
    >
      {/* Numéro en fond */}
      <span className={styles.cardBgNum}>{reason.num}</span>

      {/* Barre colorée gauche */}
      <div className={styles.cardBar} />

      {/* Icône */}
      <div className={styles.cardIcon}>{reason.icon}</div>

      {/* Contenu */}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>
          {reason.title}
          <br />
          <em className={styles.cardTitleItalic}>{reason.titleItalic}</em>
        </h3>
        <p className={styles.cardDesc}>{reason.desc}</p>
      </div>

      {/* Stat flottante */}
      <div className={styles.cardStat}>
        <span className={styles.cardStatText}>{reason.stat}</span>
      </div>

      {/* Coin décoratif */}
      <div className={styles.cardCorner} aria-hidden="true" />
    </div>
  );
}

/* ── Section principale ── */
export default function WhyUsSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    if (headerRef.current) observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  const TICKER_ITEMS = [
    "Fait Main",
    "✦",
    "Artisanat Malgache",
    "✦",
    "Qualité Premium",
    "✦",
    "Sur Mesure",
    "✦",
    "Livraison Rapide",
    "✦",
    "500+ Clientes",
    "✦",
  ];

  return (
    <section className={styles.root}>
      {/* ── Fond décoratif ── */}
      <div className={styles.bgGrid} aria-hidden="true" />
      <div className={styles.bgOrb} aria-hidden="true" />

      {/* ── Grand watermark ── */}
      <span className={styles.watermark} aria-hidden="true">
        AJ
      </span>

      <div className={styles.container}>

        {/* ── En-tête asymétrique ── */}
        <div
          ref={headerRef}
          className={`${styles.header} ${headerVisible ? styles.headerVisible : ""}`}
        >
          {/* Colonne gauche — label vertical */}
          <div className={styles.headerLeft}>
            <div className={styles.verticalLabel}>
              <span className={styles.verticalLine} />
              <span className={styles.verticalText}>Nos engagements</span>
            </div>
          </div>

          {/* Colonne droite — titre + intro */}
          <div className={styles.headerRight}>
            <p className={styles.eyebrow}>Pourquoi nous choisir</p>
            <h2 className={styles.title}>
              L'artisanat malgache
              <br />
              <span className={styles.titleAccent}>réinventé</span>
              <span className={styles.titleDot}>.</span>
            </h2>
            <p className={styles.intro}>
              Art Jatie n'est pas une boutique comme les autres. Derrière chaque
              pièce se cache une femme, un savoir-faire, une fierté. Voici
              pourquoi des centaines de clientes nous font confiance.
            </p>

            {/* Mini stats row */}
            <div className={styles.miniStats}>
              <div className={styles.miniStat}>
                <span className={styles.miniStatNum}>500+</span>
                <span className={styles.miniStatLabel}>Commandes livrées</span>
              </div>
              <div className={styles.miniStatSep} />
              <div className={styles.miniStat}>
                <span className={styles.miniStatNum}>4.9★</span>
                <span className={styles.miniStatLabel}>Note moyenne</span>
              </div>
              <div className={styles.miniStatSep} />
              <div className={styles.miniStat}>
                <span className={styles.miniStatNum}>3 ans</span>
                <span className={styles.miniStatLabel}>D'expérience</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Grille des raisons ── */}
        <div className={styles.grid}>
          {REASONS.map((r, i) => (
            <ReasonCard key={r.id} reason={r} index={i} />
          ))}
        </div>

        {/* ── Citation signature ── */}
        <div
          className={`${styles.quote} ${headerVisible ? styles.quoteVisible : ""}`}
        >
          <div className={styles.quoteBar} />
          <blockquote className={styles.quoteText}>
            "Nous ne fabriquons pas des vêtements.{" "}
            <em>Nous racontons des histoires</em> avec du fil."
          </blockquote>
          <cite className={styles.quoteCite}>— Art Jatie, fondatrices</cite>
        </div>

      </div>

      {/* ── Bandeau défilant ── */}
      <div className={styles.ticker} aria-hidden="true">
        <div className={styles.tickerTrack}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className={styles.tickerItem}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
