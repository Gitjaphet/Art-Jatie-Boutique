"use client";
import { useCartStore } from "@/lib/cart";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trash2,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  Heart,
  Tag,
  ChevronRight,
} from "lucide-react";
import styles from "./CartePage.module.css";

const EXCHANGE_RATE = 4800;

export default function CartContent() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const [removing, setRemoving] = useState<number | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState<"tana" | "other">(
    "tana",
  );

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [items],
  );
  const deliveryCost = deliveryOption === "tana" ? 0 : 15000;
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount + deliveryCost;

  const formatAr = (p: number) =>
    new Intl.NumberFormat("fr-FR").format(p) + " Ar";
  const formatEur = (p: number) => `≈ ${Math.round(p / EXCHANGE_RATE)} €`;

  const handleRemove = (id: number) => {
    setRemoving(id);
    setTimeout(() => {
      removeItem(id);
      setRemoving(null);
    }, 300);
  };

  const handlePromo = () => {
    if (promoCode.toUpperCase() === "ARTJATIE10") setPromoApplied(true);
  };

  if (items.length === 0)
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIllustration}>
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinecap="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </div>
        <h2 className={styles.emptyTitle}>Votre panier est vide</h2>
        <p className={styles.emptyText}>
          Découvrez nos créations artisanales uniques et ajoutez vos favoris.
        </p>
        <Link
          href="/boutique"
          className={`${styles.checkoutBtn} ${styles.primaryBtn}`}
        >
          Découvrir la boutique <ChevronRight size={18} />
        </Link>
      </div>
    );

  return (
    <div className={styles.grid}>
      {/* GAUCHE — Articles */}
      <section className={styles.cartSection}>
        <div className={styles.cartCard}>
          {/* Header */}
          <div className={styles.cartListHeader}>
            <span>Article</span>
            <span>Prix unitaire</span>
            <span>Quantité</span>
            <span>Total</span>
          </div>

          <div className={styles.itemsList}>
            {items.map((item) => (
              <div
                key={item.id}
                className={`${styles.cartItem} ${removing === item.id ? styles.isRemoving : ""}`}
              >
                {/* Produit */}
                <div className={styles.productCell}>
                  <div className={styles.imageBox}>
                    <Image
                      src={item.image || "/images/logo/art_jatie.png"}
                      alt={item.name}
                      fill
                      sizes="80px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className={styles.productMeta}>
                    <p className={styles.productCategory}>
                      {item.category || "Fait main"}
                    </p>
                    <h3 className={styles.productName}>{item.name}</h3>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className={styles.mobileRemove}
                    >
                      <Trash2 size={12} /> Retirer
                    </button>
                  </div>
                </div>

                {/* Prix */}
                <div className={styles.priceCell}>
                  <span className={styles.priceAr}>{formatAr(item.price)}</span>
                  <span className={styles.priceEur}>
                    {formatEur(item.price)}
                  </span>
                </div>

                {/* Quantité */}
                <div className={styles.qtyCell}>
                  <div className={styles.qtySelector}>
                    <button
                      type="button"
                      onClick={() =>
                        item.quantity > 1
                          ? updateQuantity(item.id, item.quantity - 1)
                          : handleRemove(item.id)
                      }
                    >
                      <Minus size={12} />
                    </button>
                    <span className={styles.qtyNum}>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Total ligne */}
                <div className={styles.totalCell}>
                  <span className={styles.rowTotal}>
                    {formatAr(item.price * item.quantity)}
                  </span>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className={styles.desktopRemove}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer carte */}
          <div className={styles.cartActions}>
            <Link href="/boutique" className={styles.continueShopping}>
              ← Continuer mes achats
            </Link>
            <button onClick={clearCart} className={styles.textBtn}>
              Vider le panier
            </button>
          </div>
        </div>

        {/* LIVRAISON */}
        <div className={styles.deliveryCard}>
          <h3 className={styles.deliveryTitle}>
            <Truck size={16} /> Options de livraison
          </h3>
          <label
            className={`${styles.deliveryOption} ${deliveryOption === "tana" ? styles.deliveryActive : ""}`}
          >
            <input
              type="radio"
              name="delivery"
              value="tana"
              checked={deliveryOption === "tana"}
              onChange={() => setDeliveryOption("tana")}
            />
            <div className={styles.deliveryInfo}>
              <span className={styles.deliveryName}>
                Livraison Antananarivo
              </span>
              <span className={styles.deliveryDesc}>2–3 jours ouvrés</span>
            </div>
            <span
              className={styles.deliveryPrice}
              style={{ color: "#22c55e", fontWeight: 700 }}
            >
              Gratuite
            </span>
          </label>
          <label
            className={`${styles.deliveryOption} ${deliveryOption === "other" ? styles.deliveryActive : ""}`}
          >
            <input
              type="radio"
              name="delivery"
              value="other"
              checked={deliveryOption === "other"}
              onChange={() => setDeliveryOption("other")}
            />
            <div className={styles.deliveryInfo}>
              <span className={styles.deliveryName}>Livraison Province</span>
              <span className={styles.deliveryDesc}>5–7 jours ouvrés</span>
            </div>
            <span className={styles.deliveryPrice}>{formatAr(15000)}</span>
          </label>
        </div>
      </section>

      {/* DROITE — Résumé */}
      <aside className={styles.sidebar}>
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>Récapitulatif</h2>

          <div className={styles.summaryLines}>
            <div className={styles.summaryRow}>
              <span>
                Sous-total ({items.reduce((a, i) => a + i.quantity, 0)}{" "}
                articles)
              </span>
              <span className={styles.bold}>{formatAr(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className={styles.summaryRow}>
                <span className={styles.promoLabel}>Code promo ARTJATIE10</span>
                <span className={styles.promoValue}>−{formatAr(discount)}</span>
              </div>
            )}
            <div className={styles.summaryRow}>
              <span>Livraison</span>
              <span
                className={deliveryCost === 0 ? styles.freeTag : styles.bold}
              >
                {deliveryCost === 0 ? "Gratuite" : formatAr(deliveryCost)}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span>Estimation EUR</span>
              <span style={{ color: "#aaa" }}>{formatEur(total)}</span>
            </div>
          </div>

          {/* Code promo */}
          <div className={styles.promoSection}>
            <div className={styles.promoInput}>
              <Tag size={14} />
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Code promo"
                className={styles.promoField}
                onKeyDown={(e) => e.key === "Enter" && handlePromo()}
              />
              <button onClick={handlePromo} className={styles.promoBtn}>
                Appliquer
              </button>
            </div>
            {promoApplied && (
              <p className={styles.promoSuccess}>
                ✓ Réduction de 10% appliquée !
              </p>
            )}
          </div>

          <div className={styles.divider} />

          {/* Total final */}
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total</span>
            <div className={styles.totalPrices}>
              <span className={styles.finalAr}>{formatAr(total)}</span>
              <span className={styles.finalEur}>{formatEur(total)}</span>
            </div>
          </div>

          <button className={styles.checkoutBtn}>
            Passer la commande <ChevronRight size={18} />
          </button>

          {/* Badges */}
          <div className={styles.trustBadges}>
            <div className={styles.trustItem}>
              <ShieldCheck size={16} />
              <span>Paiement sécurisé</span>
            </div>
            <div className={styles.trustItem}>
              <Truck size={16} />
              <span>Livraison suivie</span>
            </div>
            <div className={styles.trustItem}>
              <Heart size={16} />
              <span>100% artisanat malgache</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
