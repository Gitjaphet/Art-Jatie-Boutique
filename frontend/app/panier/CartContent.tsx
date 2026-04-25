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

type DeliveryZone =
  | "tana"
  | "nosybe_ville"
  | "darsalam"
  | "dzamanjar"
  | "nosybe_autre"
  | "hors_nosybe";
type HorsCooperative = "service_rapide" | "besady" | "cotisse" | "autre";

const DELIVERY_COSTS: Record<DeliveryZone, number> = {
  tana: 0,
  nosybe_ville: 0,
  darsalam: 5000,
  dzamanjar: 7000,
  nosybe_autre: 0, // contact requis
  hors_nosybe: 0, // coopérative
};

export default function CartContent() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const [removing, setRemoving] = useState<number | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [zone, setZone] = useState<DeliveryZone>("tana");
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

  // Label livraison pour le récapitulatif
  const deliveryLabel = () => {
    if (zone === "tana") return "Gratuite";
    if (zone === "nosybe_ville") return "Gratuite";
    if (zone === "darsalam") return formatAr(5000);
    if (zone === "dzamanjar") return formatAr(7000);
    if (zone === "nosybe_autre") return "Sur devis (contactez-nous)";
    if (zone === "hors_nosybe") {
      if (horsCoop === "autre" && autreCoopText)
        return `Coopérative : ${autreCoopText}`;
      const labels: Record<HorsCooperative, string> = {
        service_rapide: "Service Rapide",
        besady: "Besady",
        cotisse: "Cotisse",
        autre: "Autre coopérative",
      };
      return labels[horsCoop];
    }
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
      {/* ── GAUCHE ── */}
      <section className={styles.cartSection}>
        {/* Articles */}
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

        {/* ── LIVRAISON ── */}
        <div className={styles.deliveryCard}>
          <h3 className={styles.deliveryTitle}>
            <Truck size={16} /> Options de livraison
          </h3>

          {/* ── Nosy Be ── */}
          <div className={styles.deliveryGroup}>
            <p className={styles.deliveryGroupLabel}>🏝️ Nosy Be</p>

            {/* Ville (Jabala) */}
            <label
              className={`${styles.deliveryOption} ${zone === "nosybe_ville" ? styles.deliveryActive : ""}`}
            >
              <input
                type="radio"
                name="delivery"
                value="nosybe_ville"
                checked={zone === "nosybe_ville"}
                onChange={() => setZone("nosybe_ville")}
              />
              <div className={styles.deliveryInfo}>
                <span className={styles.deliveryName}>Nosy Be — En ville</span>
                <span className={styles.deliveryDesc}>
                  Livraison dans Jabala et ses alentours immédiats
                </span>
              </div>
              <span
                className={styles.deliveryPrice}
                style={{ color: "#22c55e", fontWeight: 700 }}
              >
                Gratuite
              </span>
            </label>

            {/* Darsalam */}
            <label
              className={`${styles.deliveryOption} ${zone === "darsalam" ? styles.deliveryActive : ""}`}
            >
              <input
                type="radio"
                name="delivery"
                value="darsalam"
                checked={zone === "darsalam"}
                onChange={() => setZone("darsalam")}
              />
              <div className={styles.deliveryInfo}>
                <span className={styles.deliveryName}>Nosy Be — Darsalam</span>
                <span className={styles.deliveryDesc}>
                  À partir de 1 km de Jabala
                </span>
              </div>
              <span className={styles.deliveryPrice}>{formatAr(5000)}</span>
            </label>

            {/* Dzamanjar */}
            <label
              className={`${styles.deliveryOption} ${zone === "dzamanjar" ? styles.deliveryActive : ""}`}
            >
              <input
                type="radio"
                name="delivery"
                value="dzamanjar"
                checked={zone === "dzamanjar"}
                onChange={() => setZone("dzamanjar")}
              />
              <div className={styles.deliveryInfo}>
                <span className={styles.deliveryName}>Nosy Be — Dzamanjar</span>
                <span className={styles.deliveryDesc}>
                  À partir de 1 km de Jabala
                </span>
              </div>
              <span className={styles.deliveryPrice}>{formatAr(7000)}</span>
            </label>

            {/* Autre Nosy Be */}
            <label
              className={`${styles.deliveryOption} ${zone === "nosybe_autre" ? styles.deliveryActive : ""}`}
            >
              <input
                type="radio"
                name="delivery"
                value="nosybe_autre"
                checked={zone === "nosybe_autre"}
                onChange={() => setZone("nosybe_autre")}
              />
              <div className={styles.deliveryInfo}>
                <span className={styles.deliveryName}>Autre zone Nosy Be</span>
                <span className={styles.deliveryDesc}>
                  Contactez-nous pour le tarif :{" "}
                  <a href="tel:0320225170" className={styles.phoneLink}>
                    032 022 5170
                  </a>
                </span>
              </div>
              <span
                className={styles.deliveryPrice}
                style={{ color: "#f59e0b", fontWeight: 700 }}
              >
                Sur devis
              </span>
            </label>
          </div>

          {/* ── Hors Nosy Be ── */}
          <div className={styles.deliveryGroup}>
            <p className={styles.deliveryGroupLabel}>🚚 Hors de Nosy Be</p>
            <label
              className={`${styles.deliveryOption} ${zone === "hors_nosybe" ? styles.deliveryActive : ""}`}
            >
              <input
                type="radio"
                name="delivery"
                value="hors_nosybe"
                checked={zone === "hors_nosybe"}
                onChange={() => setZone("hors_nosybe")}
              />
              <div className={styles.deliveryInfo}>
                <span className={styles.deliveryName}>
                  Livraison via coopérative
                </span>
                <span className={styles.deliveryDesc}>
                  Choisissez votre coopérative ci-dessous
                </span>
              </div>
              <span className={styles.deliveryPrice} style={{ color: "#888" }}>
                Variable
              </span>
            </label>

            {/* Sous-options coopérative */}
            {zone === "hors_nosybe" && (
              <div className={styles.coopGrid}>
                {(
                  [
                    "service_rapide",
                    "besady",
                    "cotisse",
                    "autre",
                  ] as HorsCooperative[]
                ).map((c) => {
                  const labels: Record<HorsCooperative, string> = {
                    service_rapide: "⚡ Service Rapide",
                    besady: "🚛 Besady",
                    cotisse: "📦 Cotisse",
                    autre: "✏️ Autre",
                  };
                  return (
                    <label
                      key={c}
                      className={`${styles.coopOption} ${horsCoop === c ? styles.coopActive : ""}`}
                    >
                      <input
                        type="radio"
                        name="coop"
                        value={c}
                        checked={horsCoop === c}
                        onChange={() => setHorsCoop(c)}
                      />
                      <span>{labels[c]}</span>
                    </label>
                  );
                })}
                {horsCoop === "autre" && (
                  <input
                    className={styles.coopInput}
                    value={autreCoopText}
                    onChange={(e) => setAutreCoopText(e.target.value)}
                    placeholder="Nom de votre coopérative…"
                  />
                )}
                <p className={styles.coopNote}>
                  💡 Les tarifs des coopératives varient selon le poids et la
                  destination. Le coût final vous sera confirmé avant
                  l&apos;expédition.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── DROITE — Résumé ── */}
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
                className={
                  deliveryCost === 0 &&
                  zone !== "hors_nosybe" &&
                  zone !== "nosybe_autre"
                    ? styles.freeTag
                    : styles.bold
                }
              >
                {deliveryLabel()}
              </span>
            </div>
            {deliveryCost > 0 && (
              <div className={styles.summaryRow}>
                <span>Estimation EUR</span>
                <span style={{ color: "#aaa" }}>{formatEur(total)}</span>
              </div>
            )}
            {deliveryCost === 0 &&
              zone !== "hors_nosybe" &&
              zone !== "nosybe_autre" && (
                <div className={styles.summaryRow}>
                  <span>Estimation EUR</span>
                  <span style={{ color: "#aaa" }}>{formatEur(total)}</span>
                </div>
              )}
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

          {/* Total */}
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total</span>
            <div className={styles.totalPrices}>
              <span className={styles.finalAr}>{formatAr(total)}</span>
              <span className={styles.finalEur}>{formatEur(total)}</span>
            </div>
          </div>

          {/* Note si hors Nosy Be ou sur devis */}
          {(zone === "hors_nosybe" || zone === "nosybe_autre") && (
            <p className={styles.deliveryNote}>
              ⚠️ Les frais de livraison pour cette zone seront calculés et
              confirmés avant l&apos;expédition.
            </p>
          )}

          <button className={styles.checkoutBtn}>
            Passer la commande <ChevronRight size={18} />
          </button>

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
