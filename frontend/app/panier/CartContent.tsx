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
  Info,
} from "lucide-react";
import styles from "./CartePage.module.css";

const EXCHANGE_RATE = 4800;

type DeliveryZone =
  | "nosybe_ville"
  | "darsalam"
  | "dzamanjar"
  | "nosybe_autre"
  | "hors_nosybe";

type HorsCooperative = "service_rapide" | "besady" | "cotisse" | "autre";

const DELIVERY_COSTS: Record<DeliveryZone, number> = {
  nosybe_ville: 0,
  darsalam: 5000,
  dzamanjar: 7000,
  nosybe_autre: 0,
  hors_nosybe: 0,
};

export default function CartContent() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const [removing, setRemoving] = useState<number | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [zone, setZone] = useState<DeliveryZone>("nosybe_ville");
  const [horsCoop, setHorsCoop] = useState<HorsCooperative>("service_rapide");
  const [autreCoopText, setAutreCoopText] = useState("");

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [items],
  );

  const deliveryCost = DELIVERY_COSTS[zone] ?? 0;
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

  const deliveryLabel = () => {
    if (zone === "nosybe_ville") return "Gratuite";
    if (zone === "darsalam") return formatAr(5000);
    if (zone === "dzamanjar") return formatAr(7000);
    if (zone === "nosybe_autre") return "Sur devis";
    if (zone === "hors_nosybe") return "À la charge du client";
    return "—";
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
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </div>
        <h2 className={styles.emptyTitle}>Votre panier est vide</h2>
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
      <section className={styles.cartSection}>
        <div className={styles.cartCard}>
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
                <div className={styles.priceCell}>
                  <span className={styles.priceAr}>{formatAr(item.price)}</span>
                  <span className={styles.priceEur}>
                    {formatEur(item.price)}
                  </span>
                </div>
                <div className={styles.qtyCell}>
                  <div className={styles.qtySelector}>
                    <button
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
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={12} />
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
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.cartActions}>
            <Link href="/boutique" className={styles.continueShopping}>
              ← Continuer mes achats
            </Link>
            <button onClick={clearCart} className={styles.textBtn}>
              Vider le panier
            </button>
          </div>
        </div>

        <div className={styles.deliveryCard}>
          <h3 className={styles.deliveryTitle}>
            <Truck size={16} /> Options de livraison
          </h3>

          <div className={styles.deliveryGroup}>
            <p className={styles.deliveryGroupLabel}>🏝️ Nosy Be</p>
            <label
              className={`${styles.deliveryOption} ${zone === "nosybe_ville" ? styles.deliveryActive : ""}`}
            >
              <input
                type="radio"
                name="delivery"
                checked={zone === "nosybe_ville"}
                onChange={() => setZone("nosybe_ville")}
              />
              <div className={styles.deliveryInfo}>
                <span className={styles.deliveryName}>En ville (Jabala)</span>
                <span className={styles.deliveryDesc}>
                  Livraison immédiate - Centre ville
                </span>
              </div>
              <span
                className={styles.deliveryPrice}
                style={{ color: "#22c55e" }}
              >
                Gratuite
              </span>
            </label>
            <label
              className={`${styles.deliveryOption} ${zone === "darsalam" ? styles.deliveryActive : ""}`}
            >
              <input
                type="radio"
                name="delivery"
                checked={zone === "darsalam"}
                onChange={() => setZone("darsalam")}
              />
              <div className={styles.deliveryInfo}>
                <span className={styles.deliveryName}>Darsalam</span>
              </div>
              <span className={styles.deliveryPrice}>{formatAr(5000)}</span>
            </label>
            <label
              className={`${styles.deliveryOption} ${zone === "dzamanjar" ? styles.deliveryActive : ""}`}
            >
              <input
                type="radio"
                name="delivery"
                checked={zone === "dzamanjar"}
                onChange={() => setZone("dzamanjar")}
              />
              <div className={styles.deliveryInfo}>
                <span className={styles.deliveryName}>Dzamanjar</span>
              </div>
              <span className={styles.deliveryPrice}>{formatAr(7000)}</span>
            </label>
          </div>

          <div className={styles.deliveryGroup}>
            <p className={styles.deliveryGroupLabel}>
              🚚 Province / Madagascar
            </p>
            <label
              className={`${styles.deliveryOption} ${zone === "hors_nosybe" ? styles.deliveryActive : ""}`}
            >
              <input
                type="radio"
                name="delivery"
                checked={zone === "hors_nosybe"}
                onChange={() => setZone("hors_nosybe")}
              />
              <div className={styles.deliveryInfo}>
                <span className={styles.deliveryName}>
                  Expédition via Coopérative
                </span>
                <span className={styles.deliveryDesc}>
                  Frais de transport à payer à la réception du colis
                </span>
              </div>
            </label>

            {zone === "hors_nosybe" && (
              <div className={styles.coopGrid}>
                {(
                  [
                    "service_rapide",
                    "besady",
                    "cotisse",
                    "autre",
                  ] as HorsCooperative[]
                ).map((c) => (
                  <label
                    key={c}
                    className={`${styles.coopOption} ${horsCoop === c ? styles.coopActive : ""}`}
                  >
                    <input
                      type="radio"
                      name="coop"
                      checked={horsCoop === c}
                      onChange={() => setHorsCoop(c)}
                    />
                    <span>
                      {c === "service_rapide"
                        ? "⚡ Service Rapide"
                        : c === "besady"
                          ? "🚛 Besady"
                          : c === "cotisse"
                            ? "📦 Cotisse"
                            : "✏️ Autre"}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <aside className={styles.sidebar}>
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>Récapitulatif</h2>

          {/* Info de livraison détaillée */}
          <div className={styles.deliveryHighlight}>
            <div className={styles.highlightIcon}>
              <Info size={16} />
            </div>
            <div className={styles.highlightContent}>
              <p className={styles.highlightTitle}>
                Logistique : {zone === "hors_nosybe" ? "Expédition" : "Locale"}
              </p>
              <p className={styles.highlightDesc}>
                {zone === "hors_nosybe"
                  ? `Via ${horsCoop.replace("_", " ")}. Le transport est à votre charge et payable au transporteur.`
                  : "Livraison à domicile effectuée par nos coursiers locaux."}
              </p>
            </div>
          </div>

          <div className={styles.summaryLines}>
            <div className={styles.summaryRow}>
              <span>Sous-total</span>
              <span className={styles.bold}>{formatAr(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className={styles.summaryRow}>
                <span className={styles.promoLabel}>Remise 10%</span>
                <span className={styles.promoValue}>−{formatAr(discount)}</span>
              </div>
            )}
            <div className={styles.summaryRow}>
              <span>Livraison</span>
              <span
                className={
                  deliveryCost === 0 && zone !== "hors_nosybe"
                    ? styles.freeTag
                    : styles.bold
                }
              >
                {deliveryLabel()}
              </span>
            </div>
          </div>

          <div className={styles.promoSection}>
            <div className={styles.promoInput}>
              <Tag size={14} />
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Code promo"
                className={styles.promoField}
              />
              <button onClick={handlePromo} className={styles.promoBtn}>
                OK
              </button>
            </div>
          </div>

          <div className={styles.divider} />
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total à payer</span>
            <div className={styles.totalPrices}>
              <span className={styles.finalAr}>{formatAr(total)}</span>
              <span className={styles.finalEur}>{formatEur(total)}</span>
            </div>
          </div>

          <button className={styles.checkoutBtn}>
            Confirmer la commande <ChevronRight size={18} />
          </button>

          <div className={styles.trustBadges}>
            <div className={styles.trustItem}>
              <ShieldCheck size={14} /> <span>Paiement sécurisé</span>
            </div>
            <div className={styles.trustItem}>
              <Heart size={14} /> <span>100% Fait main</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
