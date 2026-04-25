"use client";

import { useCartStore } from "@/lib/cart";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ShieldCheck,
  Smartphone,
  MessageCircle,
  Check,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";
import styles from "./CheckoutPage.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type PaymentMethod = "mvola" | "orange_money" | "whatsapp";
type CheckoutStep = "form" | "mvola_pending" | "success";

function CheckoutContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { items, clearCart } = useCartStore();

  // Données du panier
  const zone = params.get("zone") || "nosybe_ville";
  const deliveryCost = parseInt(params.get("deliveryCost") || "0");
  const deliveryLabel = params.get("deliveryLabel") || "Livraison";
  const subtotal = parseInt(params.get("subtotal") || "0");
  const discount = parseInt(params.get("discount") || "0");
  const total = parseInt(params.get("total") || "0");

  const EXCHANGE_RATE = 4800;
  const formatAr = (p: number) =>
    new Intl.NumberFormat("fr-FR").format(p) + " Ar";
  const formatEur = (p: number) => `≈ ${Math.round(p / EXCHANGE_RATE)} €`;

  // ── States Formulaire ──
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("mvola");

  // Nouveaux champs pour la validation manuelle
  const [accountName, setAccountName] = useState("");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [proofText, setProofText] = useState("");

  const [step, setStep] = useState<CheckoutStep>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [correlationId, setCorrelationId] = useState("");
  const [polling, setPolling] = useState(false);

  if (items.length === 0 && step !== "success") {
    return (
      <div className={styles.emptyState}>
        <p>Votre panier est vide.</p>
        <Link href="/boutique" className={styles.backLink}>
          Retour à la boutique
        </Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    setError("");
    if (!name.trim() || !whatsapp.trim()) {
      setError("Le nom et le numéro WhatsApp sont obligatoires.");
      return;
    }

    // Validation spécifique MVola/OM
    if (payment !== "whatsapp") {
      if (!paymentPhone.trim() || !proofText.trim()) {
        setError("Le numéro de paiement et la référence (preuve) sont requis.");
        return;
      }
    }

    setLoading(true);

    try {
      const orderRes = await fetch(`${API_URL}/orders/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: name,
          client_email: email || "non renseigné",
          client_whatsapp: whatsapp,
          client_message: message,
          cart_items: items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
            category: i.category,
          })),
          delivery_zone: zone,
          delivery_cost: deliveryCost,
          delivery_label: deliveryLabel,
          subtotal_ar: subtotal,
          discount_ar: discount,
          total_ar: total,
          payment_method: payment,
          // Champs dynamiques selon le mode
          mvola_phone: payment === "mvola" ? paymentPhone : null,
          mvola_account_name: payment === "mvola" ? accountName : null,
          om_phone: payment === "orange_money" ? paymentPhone : null,
          om_account_name: payment === "orange_money" ? accountName : null,
          payment_proof_text: proofText,
        }),
      });

      if (!orderRes.ok)
        throw new Error("Erreur lors de la création de la commande.");
      const order = await orderRes.json();
      setOrderId(order.id);

      // Gestion MVola automatique (si configuré)
      if (
        payment === "mvola" &&
        process.env.NEXT_PUBLIC_MVOLA_AUTO === "true"
      ) {
        // Ta logique de polling actuelle...
        return;
      }

      // Fallback WhatsApp
      if (payment === "whatsapp") {
        handleWhatsAppCheckout(order.id);
      } else {
        // Pour MVola/OM manuel, on passe direct au succès car la preuve est fournie
        clearCart();
        setStep("success");
      }
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppCheckout = (oid: number) => {
    const itemsText = items.map((i) => `• ${i.name} x${i.quantity}`).join("\n");
    const msg = encodeURIComponent(
      `🛍️ *Commande Art Jatie #${oid}*\n👤 *Client :* ${name}\n📦 *Articles :*\n${itemsText}\n💰 *Total :* ${formatAr(total)}`,
    );
    window.open(`https://wa.me/261320225170?text=${msg}`, "_blank");
    clearCart();
    setStep("success");
  };

  // Les fonctions polling restent identiques à ton code original...

  return (
    <div className={styles.grid}>
      <section className={styles.formSection}>
        {/* RECAP ARTICLES (Ton design original) */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            Votre commande ({items.length} articles)
          </h3>
          <div className={styles.miniCart}>
            {items.map((item) => (
              <div key={item.id} className={styles.miniItem}>
                <div className={styles.miniImageWrap}>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className={styles.miniInfo}>
                  <span className={styles.miniName}>{item.name}</span>
                  <span className={styles.miniQty}>×{item.quantity}</span>
                </div>
                <span className={styles.miniPrice}>
                  {formatAr(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* INFOS CLIENT */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Vos informations</h3>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Nom complet *</label>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marie Rakoto"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>WhatsApp *</label>
              <input
                className={styles.input}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="032 XX XXX XX"
              />
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>Message / Précisions</label>
              <textarea
                className={styles.textarea}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* MODE DE PAIEMENT */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Mode de paiement</h3>
          <div className={styles.paymentOptions}>
            <label
              className={`${styles.paymentOption} ${payment === "mvola" ? styles.paymentActive : ""}`}
            >
              <input
                type="radio"
                name="pay"
                onChange={() => setPayment("mvola")}
                checked={payment === "mvola"}
              />
              <div
                className={styles.paymentIcon}
                style={{ background: "#fff0f3" }}
              >
                <Smartphone size={22} color="#be185d" />
              </div>
              <div className={styles.paymentInfo}>
                <span className={styles.paymentName}>MVola</span>
                <span className={styles.paymentDesc}>
                  Transfert mobile instantané
                </span>
              </div>
            </label>

            <label
              className={`${styles.paymentOption} ${payment === "orange_money" ? styles.paymentActive : ""}`}
            >
              <input
                type="radio"
                name="pay"
                onChange={() => setPayment("orange_money")}
                checked={payment === "orange_money"}
              />
              <div
                className={styles.paymentIcon}
                style={{ background: "#fff7ed" }}
              >
                <Smartphone size={22} color="#f58220" />
              </div>
              <div className={styles.paymentInfo}>
                <span className={styles.paymentName}>Orange Money</span>
                <span className={styles.paymentDesc}>
                  Transfert mobile instantané
                </span>
              </div>
            </label>

            <label
              className={`${styles.paymentOption} ${payment === "whatsapp" ? styles.paymentActive : ""}`}
            >
              <input
                type="radio"
                name="pay"
                onChange={() => setPayment("whatsapp")}
                checked={payment === "whatsapp"}
              />
              <div
                className={styles.paymentIcon}
                style={{ background: "#e8f5e9" }}
              >
                <MessageCircle size={22} color="#25d366" />
              </div>
              <div className={styles.paymentInfo}>
                <span className={styles.paymentName}>WhatsApp / Sur place</span>
                <span className={styles.paymentDesc}>
                  Validation avec un conseiller
                </span>
              </div>
            </label>
          </div>

          {payment !== "whatsapp" && (
            <div className={styles.instructions}>
              <div className={styles.instHeader}>
                <Info size={16} /> Instructions de transfert
              </div>
              <p>
                Envoyez <strong>{formatAr(total)}</strong> au numéro suivant :
              </p>
              <div className={styles.accountBox}>
                <p>
                  Numéro : <strong>032 022 51 70</strong>
                </p>
                <p>
                  Nom : <strong>RAKOTOMALALA Marie</strong>
                </p>
              </div>
              <div className={styles.proofGrid}>
                <input
                  className={styles.input}
                  placeholder="Votre numéro de paiement"
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                />
                <input
                  className={styles.input}
                  placeholder="Référence du transfert (ID)"
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SIDEBAR RÉCAP */}
      <aside className={styles.sidebar}>
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>Récapitulatif</h2>
          <div className={styles.summaryLines}>
            <div className={styles.summaryRow}>
              <span>Sous-total</span>
              <span className={styles.bold}>{formatAr(subtotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Livraison</span>
              <span className={styles.bold}>
                {deliveryCost === 0 ? "Gratuite" : formatAr(deliveryCost)}
              </span>
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total</span>
            <div className={styles.totalPrices}>
              <span className={styles.finalAr}>{formatAr(total)}</span>
              <span className={styles.finalEur}>{formatEur(total)}</span>
            </div>
          </div>

          <div className={styles.nbSection}>
            <p className={styles.nbTitle}>
              <AlertCircle size={14} /> NB / Conditions
            </p>
            <ul className={styles.nbList}>
              <li>
                Les frais de livraison hors Nosy Be sont à la charge du client.
              </li>
              <li>Délai de confection : 3 à 7 jours pour le sur-mesure.</li>
              <li>La commande est validée dès réception du paiement.</li>
            </ul>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className={styles.spin} />
            ) : payment === "whatsapp" ? (
              "Confirmer via WhatsApp"
            ) : (
              "Confirmer ma commande"
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <Link href="/panier" className={styles.backBtn}>
            <ChevronLeft size={16} /> Retour au panier
          </Link>
          <h1 className={styles.mainTitle}>Finaliser la commande</h1>
        </div>
        <Suspense
          fallback={
            <div className={styles.loading}>
              <Loader2 size={32} className={styles.spin} />
            </div>
          }
        >
          <CheckoutContent />
        </Suspense>
      </div>
    </main>
  );
}
