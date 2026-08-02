"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./FormationPage.module.css";

type Slide = { src: string; alt: string };

const AUTO_ADVANCE_MS = 4000;

export default function ResultsCarousel({ images }: { images: Slide[] }) {
  const [index, setIndex] = useState(0);

  const goTo = (next: number) => {
    setIndex(((next % images.length) + images.length) % images.length);
  };
  const goPrev = () => goTo(index - 1);
  const goNext = () => goTo(index + 1);

  // Avance automatiquement toutes les 4s ; le minuteur repart à zéro
  // à chaque changement d'image, qu'il soit manuel ou automatique.
  // Désactivé si l'utilisateur préfère moins d'animations.
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [index, images.length]);

  return (
    <div className={styles.carousel}>
      <div
        className={styles.carouselTrack}
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((img) => (
          <div className={styles.carouselSlide} key={img.src}>
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 968px) 100vw, 50vw"
              className={styles.carouselImg}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={goPrev}
        className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`}
        aria-label="Image précédente"
      >
        <ChevronIcon direction="left" />
      </button>
      <button
        type="button"
        onClick={goNext}
        className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
        aria-label="Image suivante"
      >
        <ChevronIcon direction="right" />
      </button>

      <div className={styles.carouselDots} role="tablist" aria-label="Choisir une image">
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Image ${i + 1} sur ${images.length}`}
            onClick={() => goTo(i)}
            className={`${styles.carouselDot} ${
              i === index ? styles.carouselDotActive : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: direction === "left" ? "rotate(180deg)" : undefined,
      }}
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}