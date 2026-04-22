"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "../../app/boutique/page";
import styles from "./ProductCard.module.css";

type Props = {
  product: Product;
  listView?: boolean;
  commandeMode?: boolean;
};

const COLOR_MAP: Record<string, string> = {
  Beige: "#D4B896",
  Blanc: "#F5F5F5",
  Bleu: "#4A90D9",
  Marron: "#795548",
  Noir: "#1a1a1a",
  Or: "#C9A84C",
  Rose: "#E86B8C",
  Rouge: "#E53935",
  Vert: "#4CAF50",
  Gris: "#9E9E9E",
};

export default function ProductCard({
  product,
  listView = false,
  commandeMode = false,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    // TODO: connecter au contexte panier / commande
  };

  return (
    <div
      className={`${styles.card} ${listView ? styles.listCard : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Image ── */}
      <div className={styles.imageWrapper}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className={styles.image}
          style={{ transform: hovered ? "scale(1.07)" : "scale(1)" }}
        />

        {product.badge && (
          <span
            className={`${styles.badge} ${
              product.badge === "Rupture"
                ? styles.badgeSoldOut
                : styles.badgeSale
            }`}
          >
            {product.badge}
          </span>
        )}

        <div
          className={`${styles.overlay} ${hovered ? styles.overlayVisible : ""}`}
        >
          <Link href={`/produit/${product.id}`} className={styles.btnDetails}>
            Voir les détails
          </Link>
        </div>
      </div>

      {/* ── Infos ── */}
      <div className={styles.info}>
        <span className={styles.tag}>{product.tag}</span>
        <h3 className={styles.name}>{product.name}</h3>

        <div className={styles.infoBottom}>
          {/* Colonne gauche : prix + couleurs */}
          <div className={styles.infoLeft}>
            <div className={styles.priceBlock}>
              <div className={styles.priceRow}>
                <span className={styles.priceAr}>{product.priceArDisplay}</span>
                {product.oldPriceAr && (
                  <span className={styles.oldPrice}>{product.oldPriceAr}</span>
                )}
              </div>
              <div className={styles.priceEur}>
                ≈ {product.priceEur} €
                {product.oldPriceEur && (
                  <span className={styles.oldPriceEur}>
                    {" "}
                    {product.oldPriceEur}
                  </span>
                )}
              </div>
            </div>

            {product.colors.length > 0 && (
              <div className={styles.colorDots}>
                {product.colors.map((c) => (
                  <span
                    key={c}
                    className={styles.colorDot}
                    title={c}
                    style={{ backgroundColor: COLOR_MAP[c] ?? "#ccc" }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Colonne droite : genre + tailles */}
          <div className={styles.infoRight}>
            {product.genre && (
              <span className={styles.genre}>
                {product.genre === "Femme"
                  ? "♀"
                  : product.genre === "Homme"
                    ? "♂"
                    : "🧒"}{" "}
                {product.genre}
              </span>
            )}
            {product.sizes && product.sizes.length > 0 && (
              <div className={styles.sizesRow}>
                {product.sizes.map((s) => (
                  <span key={s} className={styles.sizeChip}>
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          className={`${styles.btnCart} ${added ? styles.btnCartAdded : ""} ${
            commandeMode ? styles.btnCommande : ""
          }`}
          onClick={handleAction}
        >
          {added
            ? commandeMode
              ? "✓ Demande envoyée !"
              : "✓ Ajouté !"
            : commandeMode
              ? "Commander"
              : "Ajouter au panier"}
        </button>
      </div>
    </div>
  );
}
