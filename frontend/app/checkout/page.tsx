"use client";

import { useCartStore } from "@/lib/cart";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
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
} from "lucide-react";
import styles from "./CheckoutPage.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type PaymentMethod = "mvola" | "whatsapp";
type CheckoutStep = "form" | "mvola_pending" | "success";

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal (wrapped dans Suspense pour useSearchParams)
// ─────────────────────────────────────────────────────────────────────────────
function CheckoutContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { items, clearCart } = useCartStore();

  // Récupérer les données du panier depuis l'URL
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

  // ── State formulaire ────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("mvola");
  const [mvolaPhone, setMvolaPhone] = useState("");
  const [step, setStep] = useState<CheckoutStep>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [correlationId, setCorrelationId] = useState("");
  const [polling, setPolling] = useState(false);

  // ── Redirect si panier vide ─────────────────────────────────────────────
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

  // ── Étape 1 : Créer la commande ─────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");

    if (!name.trim() || !whatsapp.trim()) {
      setError("Le nom et le numéro WhatsApp sont obligatoires.");
      return;
    }
    if (payment === "mvola" && !mvolaPhone.trim()) {
      setError("Veuillez entrer votre numéro MVola.");
      return;
    }

    setLoading(true);

    try {
      // 1. Créer la commande en DB
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
          mvola_phone: payment === "mvola" ? mvolaPhone : null,
        }),
      });

      if (!orderRes.ok)
        throw new Error("Erreur lors de la création de la commande.");
      const order = await orderRes.json();
      setOrderId(order.id);

      // 2a. Paiement MVola → initier la transaction
      if (payment === "mvola") {
        const mvolaRes = await fetch(`${API_URL}/mvola/initiate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: order.id,
            customer_msisdn: mvolaPhone,
            amount: total,
            description: `Art Jatie commande #${order.id}`,
          }),
        });

        if (!mvolaRes.ok) {
          const err = await mvolaRes.json();
          throw new Error(err.detail || "Erreur MVola.");
        }

        const mvolaData = await mvolaRes.json();
        setCorrelationId(mvolaData.serverCorrelationId);
        setStep("mvola_pending");
        startPolling(mvolaData.serverCorrelationId, order.id);
        return;
      }

      // 2b. Paiement WhatsApp → succès direct + ouvrir WhatsApp
      handleWhatsAppCheckout(order.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // ── WhatsApp checkout ───────────────────────────────────────────────────
  const handleWhatsAppCheckout = (oid: number) => {
    const itemsText = items
      .map(
        (i) =>
          `• ${i.name} x${i.quantity} = ${new Intl.NumberFormat("fr-FR").format(i.price * i.quantity)} Ar`,
      )
      .join("\n");

    const msg = encodeURIComponent(
      `🛍️ *Nouvelle commande Art Jatie #${oid}*\n\n` +
        `👤 *Client :* ${name}\n` +
        `📱 *WhatsApp :* ${whatsapp}\n\n` +
        `📦 *Articles :*\n${itemsText}\n\n` +
        `🚚 *Livraison :* ${deliveryLabel} — ${deliveryCost > 0 ? formatAr(deliveryCost) : "Gratuite"}\n` +
        `💰 *Total :* ${formatAr(total)} (${formatEur(total)})\n\n` +
        `${message ? `💬 *Message :* ${message}\n\n` : ""}` +
        `Merci de confirmer ma commande ! 🙏`,
    );

    window.open(`https://wa.me/261320225170?text=${msg}`, "_blank");
    clearCart();
    setStep("success");
  };

  // ── Polling statut MVola ────────────────────────────────────────────────
  const startPolling = (corrId: string, oid: number) => {
    setPolling(true);
    let attempts = 0;
    const maxAttempts = 24; // 2 minutes (5s * 24)

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${API_URL}/mvola/status/${corrId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "completed") {
            clearInterval(interval);
            setPolling(false);
            clearCart();
            setStep("success");
          } else if (data.status === "failed") {
            clearInterval(interval);
            setPolling(false);
            setError("Le paiement MVola a échoué. Veuillez réessayer.");
            setStep("form");
          }
        }
      } catch {
        // On continue le polling même en cas d'erreur réseau
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setPolling(false);
        // Timeout : on considère que le callback MVola arrivera plus tard
        clearCart();
        setStep("success");
      }
    }, 5000);
  };

  // ──────────────────────────────────────────────────────────────────────
  // RENDU : Étape "MVola en attente"
  // ──────────────────────────────────────────────────────────────────────
  if (step === "mvola_pending") {
    return (
      <div className={styles.pendingScreen}>
        <div className={styles.pendingCard}>
          <div className={styles.pendingIcon}>
            <Smartphone size={40} />
          </div>
          <h2 className={styles.pendingTitle}>Confirmez sur votre téléphone</h2>
          <p className={styles.pendingText}>
            Une demande de paiement MVola de <strong>{formatAr(total)}</strong>{" "}
            a été envoyée au <strong>{mvolaPhone}</strong>.
          </p>
          <div className={styles.pendingSteps}>
            <div className={styles.pendingStep}>
              <span className={styles.stepNum}>1</span>Ouvrez votre app MVola
            </div>
            <div className={styles.pendingStep}>
              <span className={styles.stepNum}>2</span>Vérifiez la notification
              de paiement
            </div>
            <div className={styles.pendingStep}>
              <span className={styles.stepNum}>3</span>Entrez votre PIN MVola
              pour confirmer
            </div>
          </div>
          {polling && (
            <div className={styles.pollingIndicator}>
              <Loader2 size={16} className={styles.spin} />
              <span>En attente de confirmation…</span>
            </div>
          )}
          <p className={styles.pendingNote}>
            La page se mettra à jour automatiquement après confirmation.
          </p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // RENDU : Succès
  // ──────────────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className={styles.successScreen}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <Check size={36} />
          </div>
          <h2 className={styles.successTitle}>Commande confirmée !</h2>
          <p className={styles.successText}>
            Merci <strong>{name}</strong> ! Votre commande{" "}
            <strong>#{orderId}</strong> a été enregistrée.
          </p>
          <p className={styles.successSubtext}>
            Nous vous contacterons sur WhatsApp au <strong>{whatsapp}</strong>{" "}
            pour finaliser la livraison.
          </p>
          <Link href="/boutique" className={styles.successBtn}>
            Continuer mes achats
          </Link>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // RENDU : Formulaire principal
  // ──────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.grid}>
      {/* ── GAUCHE : Formulaire ── */}
      <section className={styles.formSection}>
        {/* Récap articles */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            Votre commande ({items.reduce((a, i) => a + i.quantity, 0)}{" "}
            articles)
          </h3>
          <div className={styles.miniCart}>
            {items.map((item) => (
              <div key={item.id} className={styles.miniItem}>
                <div className={styles.miniImageWrap}>
                  <Image
                    src={item.image || "/images/logo/art_jatie.png"}
                    alt={item.name}
                    fill
                    sizes="50px"
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

        {/* Infos client */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Vos informations</h3>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Nom complet *</label>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Marie Rakoto"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email (facultatif)</label>
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marie@example.com"
              />
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>Numéro WhatsApp *</label>
              <input
                className={styles.input}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="032 XX XX XXX"
              />
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>Message (facultatif)</label>
              <textarea
                className={styles.textarea}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Instructions spéciales, taille exacte, couleur…"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Mode de paiement */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Mode de paiement</h3>
          <div className={styles.paymentOptions}>
            <label
              className={`${styles.paymentOption} ${payment === "mvola" ? styles.paymentActive : ""}`}
            >
              <input
                type="radio"
                name="payment"
                value="mvola"
                checked={payment === "mvola"}
                onChange={() => setPayment("mvola")}
              />
              <div
                className={styles.paymentIcon}
                style={{ background: "#FFF3CD" }}
              >
                <Smartphone size={22} style={{ color: "#F5A623" }} />
              </div>
              <div className={styles.paymentInfo}>
                <span className={styles.paymentName}>MVola</span>
                <span className={styles.paymentDesc}>
                  Paiement mobile instantané
                </span>
              </div>
              <span className={styles.paymentBadge}>Recommandé</span>
            </label>

            <label
              className={`${styles.paymentOption} ${payment === "whatsapp" ? styles.paymentActive : ""}`}
            >
              <input
                type="radio"
                name="payment"
                value="whatsapp"
                checked={payment === "whatsapp"}
                onChange={() => setPayment("whatsapp")}
              />
              <div
                className={styles.paymentIcon}
                style={{ background: "#E8F5E9" }}
              >
                <MessageCircle size={22} style={{ color: "#25D366" }} />
              </div>
              <div className={styles.paymentInfo}>
                <span className={styles.paymentName}>WhatsApp</span>
                <span className={styles.paymentDesc}>
                  Paiement confirmé via WhatsApp
                </span>
              </div>
            </label>
          </div>

          {/* Champ numéro MVola */}
          {payment === "mvola" && (
            <div className={styles.mvolaField}>
              <label className={styles.label}>Votre numéro MVola *</label>
              <input
                className={styles.input}
                value={mvolaPhone}
                onChange={(e) => setMvolaPhone(e.target.value)}
                placeholder="034 XX XX XXX"
              />
              <p className={styles.mvolaNote}>
                Vous recevrez une notification de paiement sur ce numéro à
                confirmer avec votre PIN MVola.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* ── DROITE : Récapitulatif final ── */}
      <aside className={styles.sidebar}>
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>Récapitulatif</h2>

          <div className={styles.summaryLines}>
            <div className={styles.summaryRow}>
              <span>Sous-total</span>
              <span className={styles.bold}>{formatAr(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className={styles.summaryRow}>
                <span style={{ color: "#22c55e" }}>Code promo</span>
                <span style={{ color: "#22c55e", fontWeight: 700 }}>
                  −{formatAr(discount)}
                </span>
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
            <div className={styles.summaryRowSub}>
              <span>{deliveryLabel}</span>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total</span>
            <div>
              <span className={styles.finalAr}>{formatAr(total)}</span>
              <span className={styles.finalEur}>{formatEur(total)}</span>
            </div>
          </div>

          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className={styles.spin} /> Traitement…
              </>
            ) : payment === "mvola" ? (
              <>
                <Smartphone size={16} /> Payer avec MVola
              </>
            ) : (
              <>
                <MessageCircle size={16} /> Confirmer via WhatsApp
              </>
            )}
          </button>

          <div className={styles.trustRow}>
            <ShieldCheck size={14} />
            <span>Paiement sécurisé · 100% artisanat malgache</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export avec Suspense (requis pour useSearchParams dans Next.js)
// ─────────────────────────────────────────────────────────────────────────────
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
