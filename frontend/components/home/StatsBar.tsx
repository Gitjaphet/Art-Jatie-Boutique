"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./StatsBar.module.css";

// On sépare la cible numérique et le suffixe (+, %, h, etc.) pour pouvoir animer le chiffre
const STATS = [
  { target: 100, suffix: "%", label: "Fait main" },
  { target: 15, suffix: "+", label: "Artisanes Malgaches" },
  { target: 48, suffix: "h", label: "Livraison Express" },
  { target: null, suffix: "∞", label: "Sur mesure" }, // null car l'infini ne se compte pas
];

// ── SOUS-COMPOSANT QUI GÈRE LE COMPTEUR MAGIQUE ──
function AnimatedNumber({
  target,
  suffix,
  isVisible,
}: {
  target: number | null;
  suffix: string;
  isVisible: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Si ce n'est pas visible ou s'il n'y a pas de chiffre à animer (ex: ∞), on s'arrête
    if (!isVisible || target === null) return;

    let startTimestamp: number | null = null;
    const duration = 2000; // L'animation dure 2 secondes

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Effet "Ease-Out" : ça compte vite au début, et ça ralentit sur la fin
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setCount(Math.floor(easeProgress * target));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(target); // Force la valeur finale exacte à la fin
      }
    };

    window.requestAnimationFrame(step);
  }, [isVisible, target]);

  // Si la cible est null (pour le symbole infini), on affiche juste le symbole
  if (target === null) return <span>{suffix}</span>;

  // Sinon on affiche le compteur en cours + le suffixe (ex: "100" + "%")
  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

export default function StatsBar() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (containerRef.current) observer.unobserve(containerRef.current);
        }
      },
      { threshold: 0.2 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={containerRef}
      className={`${styles.statsContainer} ${isVisible ? styles.visible : ""}`}
    >
      <div className={styles.statsWrapper}>
        {STATS.map((stat, index) => (
          <div
            key={index}
            className={styles.statGroup}
            style={{ transitionDelay: `${index * 0.15}s` }}
          >
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {/* On appelle notre compteur ici */}
                <AnimatedNumber
                  target={stat.target}
                  suffix={stat.suffix}
                  isVisible={isVisible}
                />
              </span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
            {/* Séparateur */}
            {index < STATS.length - 1 && <div className={styles.separator} />}
          </div>
        ))}
      </div>
    </section>
  );
}
