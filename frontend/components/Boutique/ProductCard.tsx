"use client";


import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "../../app/boutique/page";
import { useCartStore } from "../../lib/cart";
import CommandeModal from "./CommandeModal";
import styles from "./ProductCard.module.css";
import { useAuth } from "../../lib/googleAuth";


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
  Kaki: "#8B9467",
};


type Props = {
  product: Product;
  listView?: boolean;
  commandeMode?: boolean;
};

export default function ProductCard({
  product,
  listView = false,
  commandeMode = false,
}: Props) {

  const { user, setShowLoginModal, setOnLoginSuccess } = useAuth();
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  // Remplacez handleAddToCart :
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    const doAdd = () => {
      addItem({
        id: product.id,
        name: product.name,
        price: product.priceAr,
        quantity: 1,
        image: product.image,
        category: product.category,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    };

    if (!user) {
      setOnLoginSuccess(() => doAdd);
      setShowLoginModal(true);
    } else {
      doAdd();
    }
  };

  const handleOrderSuccess = () => {
    setOrderSuccess(true);
    setTimeout(() => setOrderSuccess(false), 3000);
  };

  // Helper pour l'icône de genre
  const getGenreIcon = (genre: string) => {
    switch (genre) {
      case "Femme":
        return "";
      case "Homme":
        return "";
      case "Enfant":
        return "";
      default:
        return "";
    }
  };

  return (
    <>
      {showModal && (
        <CommandeModal
          product={product}
          onClose={() => setShowModal(false)}
          onSuccess={handleOrderSuccess}
        />
      )}

      <div
        className={`${styles.card} ${listView ? styles.listCard : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image */}
        <Link 
          href={`/produit/${product.slug}${commandeMode ? "?mode=sur-mesure" : ""}`} 
          className={styles.imageWrapper}
        >
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
              className={`${styles.badge} ${product.badge === "Rupture" ? styles.badgeSoldOut : styles.badgeSale}`}
            >
              {product.badge}
            </span>
          )}
          <div
            className={`${styles.overlay} ${hovered ? styles.overlayVisible : ""}`}
          >
            <span className={styles.btnDetails}>
              Voir les détails
            </span>
          </div>
        </Link>

        {/* Infos */}
        <div className={styles.info}>
          <span className={styles.tag}>{product.tag}</span>
          <h3 className={styles.name}>{product.name}</h3>

          {/* ✅ NOUVEAU : La description s'affiche proprement ici sous le nom */}
          {product.description && (
            <p className={styles.description}>
              {product.description}
            </p>
          )}

          <div className={styles.infoBottom}>
            <div className={styles.infoLeft}>
              <div className={styles.priceBlock}>
                <div className={styles.priceRow}>
                  <span className={styles.priceAr}>
                    {product.priceArDisplay}
                  </span>
                  {product.oldPriceAr && (
                    <span className={styles.oldPrice}>
                      {product.oldPriceAr}
                    </span>
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
                  {product.colors.map((c: string) => (
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

            <div className={styles.infoRight}>
              {product.genre && (
                <span className={styles.genre}>
                  {getGenreIcon(product.genre)} {product.genre}
                </span>
              )}
              {product.sizes && product.sizes.length > 0 && (
                <div className={styles.sizesRow}>
                  {product.sizes.map((s: string) => (
                    <span key={s} className={styles.sizeChip}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {/* ✅ Stock affiché sous les tailles */}
              {!product.on_order && product.stock_quantity !== undefined && (
                <span
                  className={styles.stockBadge}
                  style={{
                    color: product.stock_quantity === 0
                      ? "#ef4444"
                      : product.stock_quantity <= 2
                      ? "#f97316"
                      : "#16a34a",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {product.stock_quantity === 0
                    ? "Épuisé"
                    : product.stock_quantity === 1
                    ? "● 1 pièce restante"
                    : `● ${product.stock_quantity} en stock`}
                </span>
              )}
            </div>
          </div>

          {/* BOUTON */}
          {commandeMode ? (
            <button
              className={`${styles.btnCart} ${orderSuccess ? styles.btnCartAdded : styles.btnCommande}`}
              onClick={(e) => {
                e.preventDefault();
                if (!orderSuccess) {
                  if (!user) {
                    setOnLoginSuccess(() => () => setShowModal(true));
                    setShowLoginModal(true);
                  } else {
                    setShowModal(true);
                  }
                }
              }}
            >
              {orderSuccess ? "✓ Commande envoyée !" : "Commander"}
            </button>
          ) : (
            <button
              className={`${styles.btnCart} ${added ? styles.btnCartAdded : ""}`}
              onClick={handleAddToCart}
            >
              {added ? "✓ Ajouté au panier !" : "Ajouter au panier"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
