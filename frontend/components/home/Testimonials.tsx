"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./Testimonials.module.css";

const REVIEWS = [
  {
    id: 1,
    text: "La qualité du crochet est incroyable. J'ai commandé une robe sur mesure et elle tombe parfaitement. Le savoir-faire des artisanes malgaches est exceptionnel.",
    author: "Sophie M.",
    product: "Robe Filet Sur Mesure",
    rating: 5,
  },
  {
    id: 2,
    text: "Mon ensemble maillot de bain a fait sensation tout l'été ! Les finitions sont parfaites et on sent que c'est une pièce unique faite avec passion.",
    author: "Claire D.",
    product: "Ensemble Tournesol",
    rating: 5,
  },
  {
    id: 3,
    text: "Livraison hyper rapide sur Tana et le packaging est très soigné. C'est du vrai luxe éthique. Je recommanderai sans hésiter pour mes prochaines vacances.",
    author: "Elodie R.",
    product: "Top Vert Émeraude",
    rating: 5,
  },
  {
    id: 4,
    text: "Le service client a été à l'écoute pour mes choix de couleurs. Le résultat final dépasse mes attentes. Une vraie œuvre d'art à porter.",
    author: "Nadia K.",
    product: "Création Sur Mesure",
    rating: 5,
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === REVIEWS.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? REVIEWS.length - 1 : prev - 1));
  };

  // Autoplay : glisse toutes les 5 secondes
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <section className={styles.section}>
      <p className={styles.subtitle}>— Retours Clients</p>
      <h2 className={styles.title}>{"Elles l'ont adoré"}</h2>

      {/* Fenêtre visible du carrousel */}
      <div className={styles.carouselWindow}>
        {/* Piste qui contient toutes les cartes et glisse */}
        <div
          className={styles.carouselTrack}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {REVIEWS.map((review, index) => (
            <div
              key={review.id}
              className={`${styles.carouselSlide} ${
                index === currentIndex ? styles.carouselSlideActive : ""
              }`}
            >
              {/* Le design de la carte d'avis */}
              <div className={styles.card}>
                <div className={styles.quoteIcon}></div>
                <div className={styles.stars}>{"★".repeat(review.rating)}</div>
                <p className={styles.text}>{review.text}</p>
                <p className={styles.author}>{review.author}</p>
                <p className={styles.productInfo}>Acheté : {review.product}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contrôles du carrousel */}
      <div className={styles.controls}>
        <button
          onClick={prevSlide}
          className={styles.navBtn}
          aria-label="Précédent"
        >
          ←
        </button>

        <div className={styles.dots}>
          {REVIEWS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`${styles.dot} ${
                index === currentIndex ? styles.dotActive : ""
              }`}
              aria-label={`Aller au slide ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className={styles.navBtn}
          aria-label="Suivant"
        >
          →
        </button>
      </div>
    </section>
  );
}
