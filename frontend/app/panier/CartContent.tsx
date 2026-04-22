"use client";

import { useCartStore, CartItem } from "@/lib/cart";
import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Trash2,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  Heart,
} from "lucide-react";
import styles from "./CartePage.module.css";

const EXCHANGE_RATE = 4800;

const MOCK_DATA: CartItem[] = [
  {
    id: 991,
    name: "Robe Raphia 'Soleil d'Été'",
    price: 185000,
    quantity: 1,
    image: "/images/logo/art_jatie.png",
    category: "Tenues",
  },
  {
    id: 992,
    name: "Sac Cabas Tressé Main",
    price: 95000,
    quantity: 2,
    image: "/images/logo/art_jatie.png",
    category: "Accessoires",
  },
];

export default function CartContent() {
  const {
    items: storeItems,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCartStore();
  const [removing, setRemoving] = useState<number | null>(null);

  // Utilisation des MOCKS si le store est vide pour voir le design
  const displayItems = storeItems.length > 0 ? storeItems : MOCK_DATA;

  const subtotal = useMemo(
    () =>
      displayItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [displayItems],
  );

  const formatAr = (p: number) =>
    new Intl.NumberFormat("fr-FR").format(p) + " Ar";
  const formatEur = (pAr: number) => `≈ ${Math.round(pAr / EXCHANGE_RATE)} €`;

  const handleRemove = (id: number) => {
    setRemoving(id);
    setTimeout(() => {
      removeItem(id);
      setRemoving(null);
    }, 300);
  };

  return (
    <div className={styles.grid}>
      <section className={styles.cartSection}>
        <div className={styles.cartCard}>
          <div className={styles.cartListHeader}>
            <span>Article</span>
            <span>Prix</span>
            <span>Quantité</span>
            <span>Total</span>
          </div>

          <div className={styles.itemsList}>
            {displayItems.map((item) => (
              <div
                key={item.id}
                className={`${styles.cartItem} ${removing === item.id ? styles.isRemoving : ""}`}
              >
                <div className={styles.productCell}>
                  <div className={styles.imageBox}>
                    <Image
                      src={item.image || "/images/logo/art_jatie.png"}
                      alt={item.name}
                      fill
                      sizes="100px"
                      style={{ objectFit: "contain", padding: "10px" }}
                    />
                  </div>
                  <div className={styles.productMeta}>
                    <h3>{item.name}</h3>
                    <p>{item.category || "Fait main"}</p>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className={styles.mobileRemove}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className={styles.priceCell}>
                  <span className={styles.priceAr}>{formatAr(item.price)}</span>
                  <span className={styles.priceEur}>
                    {formatEur(item.price)}
                  </span>
                </div>

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
                      <Minus size={14} />
                    </button>
                    <span className={styles.qtyNum}>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className={styles.totalCell}>
                  <span className={styles.rowTotal}>
                    {formatAr(item.price * item.quantity)}
                  </span>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className={styles.desktopRemove}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.cartActions}>
            <button onClick={clearCart} className={styles.textBtn}>
              Vider le panier
            </button>
          </div>
        </div>
      </section>

      <aside className={styles.sidebar}>
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>Résumé</h2>
          <div className={styles.summaryRow}>
            <span>Sous-total</span>
            <span className={styles.bold}>{formatAr(subtotal)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Estimation EUR</span>
            <span>{formatEur(subtotal)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Livraison</span>
            <span className={styles.freeTag}>Gratuite (Tana)</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.totalRow}>
            <span>Total</span>
            <div className={styles.totalPrices}>
              <span className={styles.finalAr}>{formatAr(subtotal)}</span>
              <span className={styles.finalEur}>{formatEur(subtotal)}</span>
            </div>
          </div>
          <button className={styles.checkoutBtn}>
            Commander <ArrowRight size={20} />
          </button>
          <div className={styles.trustBadges}>
            <div className={styles.trustItem}>
              <ShieldCheck size={18} />
              <span>Sécurisé</span>
            </div>
            <div className={styles.trustItem}>
              <Truck size={18} />
              <span>Livraison</span>
            </div>
            <div className={styles.trustItem}>
              <Heart size={18} />
              <span>Artisanat</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
