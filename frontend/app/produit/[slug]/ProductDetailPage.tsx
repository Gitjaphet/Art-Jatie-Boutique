"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation"; // ◄ AJOUTÉ ICI
import { useCartStore } from "@/lib/cart";
import styles from "./ProductDetail.module.css";
import CommandeModal from "@/components/Boutique/CommandeModal"; // Ajustez le chemin si nécessaire
import { useAuth } from "@/lib/googleAuth";

const COLOR_MAP: Record<string, string> = {
  Beige: "#D4B896", Blanc: "#F5F5F5", Bleu: "#4A90D9",
  Marron: "#795548", Noir: "#1a1a1a", Or: "#C9A84C",
  Rose: "#E86B8C", Rouge: "#E53935", Vert: "#4CAF50",
  Gris: "#9E9E9E", Kaki: "#8B9467",
};

const EXCHANGE_RATE = 4800;

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);

  const prev = useCallback(() => setCurrent((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  return (
    <div className={styles.lightboxOverlay} onClick={onClose}>
      <button className={styles.lightboxClose} onClick={onClose} aria-label="Fermer">✕</button>
      <button
        className={`${styles.lightboxArrow} ${styles.lightboxArrowLeft}`}
        onClick={(e) => { e.stopPropagation(); prev(); }}
        aria-label="Image précédente"
      >
        ‹
      </button>
      <div className={styles.lightboxImageWrap} onClick={(e) => e.stopPropagation()}>
        <Image
          src={images[current]}
          alt={`Image ${current + 1}`}
          fill
          sizes="90vw"
          className={styles.lightboxImage}
          priority
        />
      </div>
      <button
        className={`${styles.lightboxArrow} ${styles.lightboxArrowRight}`}
        onClick={(e) => { e.stopPropagation(); next(); }}
        aria-label="Image suivante"
      >
        ›
      </button>
      <div className={styles.lightboxCounter}>
        {current + 1} / {images.length}
      </div>
    </div>
  );
}

// ─── Galerie principale ───────────────────────────────────────────────────────
function Gallery({ product }: { product: any }) {
  const mainImage: string = product.image ?? "";
  const extraImages: string[] = product.imagesString
    ? product.imagesString.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const badgeClass =
    product.badge === "Rupture" || product.badge === "Sur commande"
      ? styles.badgeSoldOut
      : product.is_hot
      ? styles.badgeHot
      : "";

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className={styles.gallery}>
        <div className={styles.mainImageWrapper} onClick={() => openLightbox(0)}>
          {product.badge && (
            <span className={`${styles.badge} ${badgeClass}`}>
              {product.badge}
            </span>
          )}
          {product.is_hot && !product.badge && (
            <span className={`${styles.badge} ${styles.badgeHot}`}>Coup de cœur</span>
          )}
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            className={styles.mainImage}
            priority
          />
          <div className={styles.zoomHint}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
            Agrandir
          </div>
        </div>

        {extraImages.length > 0 && (
          <div className={styles.thumbnailStrip}>
            {extraImages.map((src, i) => (
              <button
                key={i}
                className={styles.thumbBtn}
                onClick={() => openLightbox(i)}
                aria-label={`Image ${i + 1}`}
              >
                <Image
                  src={src}
                  alt={`${product.name} ${i + 1}`}
                  fill
                  className={styles.thumbImage}
                  sizes="88px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <Lightbox
          images={extraImages}
          startIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

// ─── Compteur de quantité ────────────────────────────────────────────────────
function QuantitySelector({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
  return (
    <div className={styles.qtySelector}>
      <button
        className={styles.qtyBtn}
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
      >−</button>
      <span className={styles.qtyValue}>{value}</span>
      <button
        className={styles.qtyBtn}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >+</button>
    </div>
  );
}

// ─── Section panier (Bouton dynamique) ────────────────────────────────────────
// ─── Section panier (Bouton dynamique) ────────────────────────────────────────
function AddToCartSection({ product, isSurMesure }: { product: any; isSurMesure: boolean }) {
  const { user, setShowLoginModal, setOnLoginSuccess } = useAuth();
  const [added, setAdded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  // ✅ LA VRAIE FIX : vérifier le choix mémorisé, pas seulement user
  const hasChosen = () => !!localStorage.getItem("artjatie_auth_choice");

  const handleAdd = () => {
    const doAdd = () => {
      for (let i = 0; i < qty; i++) {
        addItem({
          id: product.id, name: product.name, price: product.rawPrice,
          quantity: 1, image: product.image, category: product.category ?? "",
        });
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    };

    if (hasChosen()) {
      // ✅ Déjà choisi (Google ou invité) → on ajoute directement
      doAdd();
    } else {
      // Premier passage → afficher le modal
      setOnLoginSuccess(() => doAdd);
      setShowLoginModal(true);
    }
  };

  // ✅ CAS 1 : Produit "Sur commande" ou sur-mesure
  if (product.on_order || isSurMesure) {
    const handleCommande = () => {
      const doOpen = () => setShowModal(true);
      if (hasChosen()) {
        doOpen();
      } else {
        setOnLoginSuccess(() => doOpen);
        setShowLoginModal(true);
      }
    };

    return (
      <>
        {showModal && (
          <CommandeModal
            product={product}
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setAdded(true);
              setTimeout(() => setAdded(false), 3000);
            }}
          />
        )}
        <div className={styles.cartSection}>
          <div className={styles.onOrderBanner}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Fabriqué sur commande — délai 7 à 14 jours
          </div>

          <button
            className={`${styles.btnCart} ${styles.btnCommande} ${added ? styles.btnCartAdded : ""}`}
            onClick={() => { if (!added) handleCommande(); }}
          >
            {added ? "✓ Demande envoyée !" : "Commander sur mesure"}
          </button>
        </div>
      </>
    );
  }

  // ✅ CAS 2 : Produit en stock normal
  const maxQty = product.stock_quantity ?? 1;
  const isSoldOut = maxQty === 0;

  return (
    <div className={styles.cartSection}>
      {!isSoldOut && (
        <div className={styles.qtyRow}>
          <span className={styles.qtyLabel}>Quantité</span>
          <QuantitySelector value={qty} onChange={setQty} max={maxQty} />
          {maxQty <= 3 && maxQty > 0 && (
            <span className={styles.qtyWarning}>Plus que {maxQty} en stock</span>
          )}
        </div>
      )}
      <button
        className={`${styles.btnCart} ${added ? styles.btnCartAdded : ""}`}
        onClick={handleAdd}
        disabled={isSoldOut}
        style={isSoldOut ? { opacity: 0.4, cursor: "not-allowed" } : {}}
      >
        {isSoldOut
          ? "Épuisé"
          : added
          ? `✓ ${qty > 1 ? `${qty} articles` : "Article"} ajouté${qty > 1 ? "s" : ""} !`
          : "Ajouter au panier"}
      </button>
    </div>
  );
}
// ─── Page principale ──────────────────────────────────────────────────────────
export default function ProductDetailPage({ product }: { product: any }) {
  const searchParams = useSearchParams();
  const isSurMesure = searchParams.get("mode") === "sur-mesure";


  
  const colors = product.colorsArray ?? (product.colors ? product.colors.split(",").map((c: string) => c.trim()) : []);
  const sizes = product.sizesArray ?? (product.sizes ? product.sizes.split(",").map((s: string) => s.trim()) : []);
  const priceEur = Math.round((product.rawPrice ?? product.price_ar) / EXCHANGE_RATE);
  const oldPriceEur = product.rawOldPrice ? Math.round(product.rawOldPrice / EXCHANGE_RATE) : null;

  const stockColor =
    product.stock_quantity === 0 ? "#ef4444"
    : product.stock_quantity <= 2 ? "#f97316"
    : "#16a34a";

  const stockLabel =
    product.stock_quantity === 0 ? "Épuisé"
    : product.stock_quantity === 1 ? "Dernière pièce"
    : product.stock_quantity <= 3 ? `${product.stock_quantity} pièces restantes`
    : `${product.stock_quantity} en stock`;

  return (
    <div className={styles.page}>
      {/* ✅ Breadcrumb dynamique en fonction du paramètre */}
      <nav className={styles.breadcrumb}>
        <Link href="/">Accueil</Link>
        <span className={styles.breadcrumbSep}>/</span>
        {isSurMesure ? (
          <Link href="/commande">Sur Mesure</Link>
        ) : (
          <Link href="/boutique">Boutique</Link>
        )}
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{product.name}</span>
      </nav>

      <div className={styles.container}>
        <Gallery product={product} />

        <div className={styles.info}>
          <div className={styles.topMeta}>
            {product.tag && <span className={styles.tag}>{product.tag}</span>}
            {product.tag && product.genre && <span className={styles.separator}>·</span>}
            {product.genre && <span className={styles.genre}>{product.genre}</span>}
          </div>

          <h1 className={styles.name}>{product.name}</h1>
          {product.category && <p className={styles.category}>{product.category}</p>}

          <div className={styles.divider} />

          {/* Prix */}
          <div className={styles.priceBlock}>
            <div className={styles.priceMain}>
              <span className={styles.priceAr}>
                {(product.rawPrice ?? product.price_ar)?.toLocaleString("fr-FR")} Ar
              </span>
              {product.rawOldPrice && (
                <span className={styles.oldPrice}>
                  {product.rawOldPrice.toLocaleString("fr-FR")} Ar
                </span>
              )}
            </div>
            <span className={styles.priceEur}>
              ≈ {priceEur} €
              {oldPriceEur && <s className={styles.oldPriceEur}>{oldPriceEur} €</s>}
            </span>
            {product.rawOldPrice && (
              <span className={styles.discount}>
                −{Math.round((1 - product.rawPrice / product.rawOldPrice) * 100)}%
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div
              className={styles.description}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          {/* Couleurs */}
          {colors.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Couleurs disponibles</p>
              <div className={styles.colorDots}>
                {colors.map((c: string) => (
                  <span
                    key={c}
                    className={styles.colorDot}
                    title={c}
                    style={{ backgroundColor: COLOR_MAP[c] ?? "#ccc" }}
                  >
                    <span className={styles.colorTooltip}>{c}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tailles */}
          {sizes.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Tailles disponibles</p>
              <div className={styles.sizes}>
                {sizes.map((s: string) => (
                  <span key={s} className={styles.sizeChip}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* ✅ Stock indicator — Masqué si isSurMesure est vrai */}
          {!product.on_order && !isSurMesure && product.stock_quantity !== undefined && (
            <div className={styles.stockRow}>
              <span className={styles.stockDot} style={{ background: stockColor }} />
              <span className={styles.stockText} style={{ color: stockColor }}>
                {stockLabel}
              </span>
            </div>
          )}

          {/* Panier + quantité — On transmet l'état isSurMesure */}
          <AddToCartSection product={product} isSurMesure={isSurMesure} />

          {/* Garanties */}
          <div className={styles.trustRow}>
            <div className={styles.trustItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Qualité garantie
            </div>
            <div className={styles.trustItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              Livraison partout dans le monde
            </div>
            <div className={styles.trustItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              Artisanat malgache
            </div>
          </div>

          {/* Meta grid */}
          <div className={styles.metaGrid}>
            {product.category && (
              <div className={styles.metaItem}>
                <span className={styles.metaKey}>Catégorie</span>
                <span className={styles.metaVal}>{product.category}</span>
              </div>
            )}
            {product.genre && (
              <div className={styles.metaItem}>
                <span className={styles.metaKey}>Genre</span>
                <span className={styles.metaVal}>{product.genre}</span>
              </div>
            )}
            {product.tag && (
              <div className={styles.metaItem}>
                <span className={styles.metaKey}>Collection</span>
                <span className={styles.metaVal}>{product.tag}</span>
              </div>
            )}
            {product.slug && (
              <div className={styles.metaItem}>
                <span className={styles.metaKey}>Référence</span>
                <span className={styles.metaVal}>{product.slug}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}