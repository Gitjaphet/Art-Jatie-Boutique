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
  Info,
  Star,
} from "lucide-react";
import styles from "./CheckoutPage.module.css";
import { useAuth } from "@/lib/googleAuth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type PaymentMethod = "mvola" | "orange_money" | "whatsapp";
type CheckoutStep = "form" | "mvola_pending" | "success";

// ─────────────────────────────────────────────────────────────────────────────
// ⚙️  À personnaliser : numéros de la boutique
// ─────────────────────────────────────────────────────────────────────────────
const BOUTIQUE_MVOLA = "034 30 513 60"; // ← ton vrai numéro MVola
const BOUTIQUE_OM = "032 02 251 70"; // ← ton vrai numéro Orange Money
const BOUTIQUE_NAME = "Noeline";

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────
function CheckoutContent() {

  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { items, clearCart } = useCartStore();

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

  // ── State ───────────────────────────────────────────────────────────────
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("mvola");
  const [mvolaPhone, setMvolaPhone] = useState("");
  const [mvolaAccountName, setMvolaAccountName] = useState("");
  const [omPhone, setOmPhone] = useState("");
  const [omAccountName, setOmAccountName] = useState("");
  const [proofText, setProofText] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [step, setStep] = useState<CheckoutStep>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [polling, setPolling] = useState(false);
  

  // ── Panier vide ─────────────────────────────────────────────────────────
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

  // ── Upload preuve image ──────────────────────────────────────────────────
  const uploadProof = async (): Promise<string | null> => {
    if (!proofFile) return null;
    const formData = new FormData();
    formData.append("file", proofFile);
    try {
      const res = await fetch(`${API_URL}/orders/upload-proof`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.url as string;
    } catch {
      return null;
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────
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
    if (payment === "orange_money" && !omPhone.trim()) {
      setError("Veuillez entrer votre numéro Orange Money.");
      return;
    }

    setLoading(true);

    try {
      const proofImageUrl = await uploadProof();

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
          mvola_account_name: payment === "mvola" ? mvolaAccountName : null,
          om_phone: payment === "orange_money" ? omPhone : null,
          om_account_name: payment === "orange_money" ? omAccountName : null,
          payment_proof_text: proofText || null,
          payment_proof_image: proofImageUrl,
        }),
      });

      if (!orderRes.ok)
        throw new Error("Erreur lors de la création de la commande.");
      const order = await orderRes.json();
      setOrderId(order.id);

      // MVola → initier la transaction automatique
      // Tous les modes → confirmation manuelle via WhatsApp
      handleWhatsAppCheckout(order.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // ── WhatsApp ─────────────────────────────────────────────────────────────
  const handleWhatsAppCheckout = (oid: number) => {
    const itemsText = items
      .map(
        (i) =>
          `• ${i.name} ×${i.quantity} = ${new Intl.NumberFormat("fr-FR").format(i.price * i.quantity)} Ar`,
      )
      .join("\n");

    const payInfo =
      payment === "mvola"
        ? `💳 MVola : ${mvolaPhone} (${mvolaAccountName || "—"})\nRéf : ${proofText || "en attente"}`
        : payment === "orange_money"
          ? `🟠 Orange Money : ${omPhone} (${omAccountName || "—"})\nRéf : ${proofText || "en attente"}`
          : "💬 Paiement à confirmer via WhatsApp";

    const msg = encodeURIComponent(
      `🛍️ *Nouvelle commande Art Jatie #${oid}*\n\n` +
        `👤 *Client :* ${name}\n` +
        `📱 *WhatsApp :* ${whatsapp}\n\n` +
        `📦 *Articles :*\n${itemsText}\n\n` +
        `🚚 *Livraison :* ${deliveryLabel} — ${deliveryCost > 0 ? formatAr(deliveryCost) : "Gratuite"}\n` +
        `💰 *Total :* ${formatAr(total)} (${formatEur(total)})\n\n` +
        `${payInfo}\n\n` +
        `${message ? `💬 *Message :* ${message}\n\n` : ""}` +
        `Merci de confirmer ma commande ! 🙏`,
    );

    window.open(`https://wa.me/261320225170?text=${msg}`, "_blank");
    clearCart();
    setStep("success");
  };

  // ── Polling MVola ────────────────────────────────────────────────────────
  const startPolling = (corrId: string, oid: number) => {
    setPolling(true);
    let attempts = 0;
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
            setError("Paiement MVola échoué.");
            setStep("form");
          }
        }
      } catch {
        /* continue */
      }
      if (attempts >= 24) {
        clearInterval(interval);
        setPolling(false);
        clearCart();
        setStep("success");
      }
    }, 5000);
  };

  // ── Écran MVola en attente ───────────────────────────────────────────────
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
              <span className={styles.stepNum}>3</span>Entrez votre PIN pour
              confirmer
            </div>
          </div>
          {polling && (
            <div className={styles.pollingIndicator}>
              <Loader2 size={16} className={styles.spin} />
              <span>En attente de confirmation…</span>
            </div>
          )}
          <p className={styles.pendingNote}>
            La page se mettra à jour automatiquement.
          </p>
        </div>
      </div>
    );
  }

  // ── Écran succès ─────────────────────────────────────────────────────────
  if (step === "success") {
    const isPrepaid = payment === "mvola" || payment === "orange_money";
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
          {isPrepaid && (
            <div className={styles.successPriority}>
              <Star size={14} />
              <span>
                Votre stock est <strong>réservé en priorité</strong> grâce à
                votre paiement à l'avance.
              </span>
            </div>
          )}
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

  // ── Formulaire principal ─────────────────────────────────────────────────
  const isPrepaid = payment === "mvola" || payment === "orange_money";

  return (
    <div className={styles.grid}>
      {/* ── GAUCHE ── */}
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
                placeholder="Ex: Japhet Valeureux"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email (facultatif)</label>
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="artjatie@example.com"
              />
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>Numéro WhatsApp *</label>
              <input
                className={styles.input}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="032 XX XXX XX"
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

          {/* Bannière avantage paiement anticipé */}
          <div className={styles.priorityBanner}>
            <Star size={14} />
            <p>
              <strong>Paiement à l'avance = stock garanti.</strong> Si un
              article est en rupture, les clients ayant payé à l'avance sont
              servis en priorité.
            </p>
          </div>

          <div className={styles.paymentOptions}>
            {/* MVola */}
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
                  Paiement mobile — réservation garantie
                </span>
              </div>
              <div className={styles.paymentBadges}>
                <span className={styles.stockBadge}>Stock réservé</span>
              </div>
            </label>

            {/* Orange Money */}
            <label
              className={`${styles.paymentOption} ${payment === "orange_money" ? styles.paymentActiveOm : ""}`}
            >
              <input
                type="radio"
                name="payment"
                value="orange_money"
                checked={payment === "orange_money"}
                onChange={() => setPayment("orange_money")}
              />
              <div
                className={styles.paymentIcon}
                style={{ background: "#FFF0E0" }}
              >
                <Smartphone size={22} style={{ color: "#FF6600" }} />
              </div>
              <div className={styles.paymentInfo}>
                <span className={styles.paymentName}>Orange Money</span>
                <span className={styles.paymentDesc}>
                  Paiement mobile — réservation garantie
                </span>
              </div>
              <div className={styles.paymentBadges}>
                <span className={styles.stockBadge}>Stock réservé</span>
              </div>
            </label>

            {/* WhatsApp */}
            <label
              className={`${styles.paymentOption} ${payment === "whatsapp" ? styles.paymentActiveWa : ""}`}
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
                  Paiement à la livraison — sous réserve de stock
                </span>
              </div>
            </label>
          </div>

          {/* ── Champs MVola ── */}
          {payment === "mvola" && (
            <div className={styles.paymentFields}>
              <div className={styles.paymentInstructions}>
                <p className={styles.instrTitle}>Comment payer avec MVola :</p>
                <ol className={styles.instrList}>
                  <li>
                    Envoyez <strong>{formatAr(total)}</strong> au numéro MVola :{" "}
                    <strong className={styles.boutiqueNum}>
                      {BOUTIQUE_MVOLA}
                    </strong>{" "}
                    ({BOUTIQUE_NAME})
                  </li>
                  <li>
                    Notez la <strong>référence de transaction</strong> reçue par
                    SMS
                  </li>
                  <li>Remplissez les champs ci-dessous et soumettez</li>
                </ol>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Nom du compte MVola *</label>
                  <input
                    className={styles.input}
                    value={mvolaAccountName}
                    onChange={(e) => setMvolaAccountName(e.target.value)}
                    placeholder="Nom sur le compte"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Votre numéro MVola *</label>
                  <input
                    className={styles.input}
                    value={mvolaPhone}
                    onChange={(e) => setMvolaPhone(e.target.value)}
                    placeholder="034 XX XXX XX"
                  />
                </div>
                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label className={styles.label}>
                    Référence de transaction
                  </label>
                  <input
                    className={styles.input}
                    value={proofText}
                    onChange={(e) => setProofText(e.target.value)}
                    placeholder="Ex : TXN-XXXXXX"
                  />
                </div>
                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label className={styles.label}>
                    Capture d'écran du paiement (facultatif)
                  </label>
                  <input
                    className={styles.inputFile}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  />
                  <p className={styles.fieldNote}>
                    JPG, PNG — max 5 Mo. Accélère la confirmation de votre
                    commande.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Champs Orange Money ── */}
          {payment === "orange_money" && (
            <div
              className={styles.paymentFields}
              style={{ borderLeftColor: "#FF6600" }}
            >
              <div
                className={styles.paymentInstructions}
                style={{ borderLeftColor: "#FF6600", background: "#FFF7ED" }}
              >
                <p className={styles.instrTitle}>
                  Comment payer avec Orange Money :
                </p>
                <ol className={styles.instrList}>
                  <li>
                    Envoyez <strong>{formatAr(total)}</strong> au numéro Orange
                    Money :{" "}
                    <strong
                      className={styles.boutiqueNum}
                      style={{ color: "#FF6600" }}
                    >
                      {BOUTIQUE_OM}
                    </strong>{" "}
                    ({BOUTIQUE_NAME})
                  </li>
                  <li>
                    Notez la <strong>référence de transaction</strong> reçue par
                    SMS
                  </li>
                  <li>Remplissez les champs ci-dessous et soumettez</li>
                </ol>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>
                    Nom du compte Orange Money *
                  </label>
                  <input
                    className={styles.input}
                    value={omAccountName}
                    onChange={(e) => setOmAccountName(e.target.value)}
                    placeholder="Nom sur le compte"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    Votre numéro Orange Money *
                  </label>
                  <input
                    className={styles.input}
                    value={omPhone}
                    onChange={(e) => setOmPhone(e.target.value)}
                    placeholder="032 XX XXX XX"
                  />
                </div>
                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label className={styles.label}>
                    Référence de transaction
                  </label>
                  <input
                    className={styles.input}
                    value={proofText}
                    onChange={(e) => setProofText(e.target.value)}
                    placeholder="Ex : OM-XXXXXX"
                  />
                </div>
                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label className={styles.label}>
                    Capture d'écran du paiement (facultatif)
                  </label>
                  <input
                    className={styles.inputFile}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  />
                  <p className={styles.fieldNote}>
                    JPG, PNG — max 5 Mo. Accélère la confirmation de votre
                    commande.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Info WhatsApp ── */}
          {payment === "whatsapp" && (
            <div className={styles.whatsappInfo}>
              <Info size={14} />
              <p>
                Votre commande sera transmise via WhatsApp. Le paiement se fait
                à la livraison ou selon accord.{" "}
                <strong>Le stock n'est pas réservé</strong> — en cas de rupture,
                les clients ayant payé à l'avance sont prioritaires.
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

      {/* ── DROITE : Récap + NB ── */}
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

          {isPrepaid && (
            <div className={styles.guaranteeBadge}>
              <Star size={13} />
              <span>Stock réservé en priorité</span>
            </div>
          )}

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
            ) : payment === "orange_money" ? (
              <>
                <Smartphone size={16} /> Payer avec Orange Money
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

        {/* ── NB / Conditions ── */}
        <div className={styles.nbCard}>
          <h4 className={styles.nbTitle}>
            <Info size={14} />
            Informations importantes
          </h4>
          <ul className={styles.nbList}>
            <li>
              <span
                className={styles.nbDot}
                style={{ background: "#22c55e" }}
              />
              <span>
                <strong>Paiement à l'avance (MVola / Orange Money)</strong> :
                votre commande est confirmée et votre stock réservé
                immédiatement, même si l'article affiche « rupture de stock ».
              </span>
            </li>
            <li>
              <span
                className={styles.nbDot}
                style={{ background: "#f59e0b" }}
              />
              <span>
                <strong>Paiement WhatsApp</strong> : commande enregistrée sous
                réserve de disponibilité. En cas de rupture, les clients ayant
                payé à l'avance sont servis en priorité.
              </span>
            </li>
            <li>
              <span
                className={styles.nbDot}
                style={{ background: "#e86b8c" }}
              />
              <span>
                <strong>Délai de traitement</strong> : les commandes confirmées
                sont traitées sous 24–48h. Vous serez contacté(e) sur WhatsApp
                pour la livraison.
              </span>
            </li>
            <li>
              <span
                className={styles.nbDot}
                style={{ background: "#a855f7" }}
              />
              <span>
                <strong>Remboursement</strong> : en cas d'indisponibilité après
                paiement à l'avance, vous serez intégralement remboursé(e) ou
                proposé(e) un article de remplacement.
              </span>
            </li>
            <li>
              <span
                className={styles.nbDot}
                style={{ background: "#3b82f6" }}
              />
              <span>
                <strong>Sur mesure</strong> : les articles sur commande
                nécessitent un acompte de 50% pour lancer la fabrication.
              </span>
            </li>
          </ul>
          <p className={styles.nbContact}>
            Une question ?{" "}
            <a
              href="https://wa.me/261320225170"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.nbLink}
            >
              Contactez-nous sur WhatsApp
            </a>
          </p>
        </div>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export avec Suspense
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
