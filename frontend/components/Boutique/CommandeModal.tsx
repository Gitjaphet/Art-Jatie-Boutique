"use client";
import React, { useState } from "react";
import Image from "next/image";
import type { Product } from "../../app/boutique/page";
import styles from "./CommandeModal.module.css";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Props = {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CommandeModal({ product, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name || !email || !whatsapp || !size || !color) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (!agreed) {
      setError(
        "Veuillez accepter les conditions de paiement avant de confirmer.",
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/orders/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: name,
          client_email: email,
          client_whatsapp: whatsapp,
          client_message: message,
          product_id: product.id,
          product_name: product.name,
          product_image: product.image,
          product_price_ar: product.priceAr,
          selected_size: size,
          selected_color: color,
        }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const e = await res.json();
        setError(e.detail || "Erreur serveur.");
      }
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  // Fermer seulement si on clique exactement sur l'overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const advance = Math.round(product.priceAr * 0.5);
  const formatAr = (n: number) =>
    new Intl.NumberFormat("fr-FR").format(n) + " Ar";

  return (
    // ✅ Pas de backdrop-filter — juste un fond semi-transparent léger
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.productPreview}>
            <Image
              src={product.image}
              alt={product.name}
              width={56}
              height={56}
              className={styles.productImg}
            />
            <div>
              <p className={styles.productTag}>{product.tag}</p>
              <h3 className={styles.productName}>{product.name}</h3>
              <p className={styles.productPrice}>
                {product.priceArDisplay}
                <span> ≈ {product.priceEur} €</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.sectionTitle}>Votre sélection</p>

          {/* TAILLE — input libre */}
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>
                Taille *{" "}
                <span className={styles.hint}>XS, S, M, L, XL, 38, 40…</span>
              </label>
              <input
                className={styles.input}
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="Ex : M, 40, Sur mesure…"
              />
            </div>

            {/* COULEUR — input libre */}
            <div className={styles.field}>
              <label className={styles.label}>
                Couleur * <span className={styles.hint}>Soyez précis(e)</span>
              </label>
              <input
                className={styles.input}
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ex : Rouge vif, Beige rosé…"
              />
            </div>
          </div>

          <div className={styles.divider} />
          <p className={styles.sectionTitle}>Vos coordonnées</p>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Nom complet *</label>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email *</label>
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean@email.com"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>WhatsApp *</label>
            <div className={styles.inputWithIcon}>
              <span className={styles.inputIcon}>📱</span>
              <input
                className={styles.input}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+261 34 00 000 00"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Message (optionnel)</label>
            <textarea
              className={styles.textarea}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Précisions sur votre commande, mensurations, délai souhaité…"
              rows={3}
            />
          </div>

          {/* ✅ CLAUSE 50% AVANCE */}
          <div className={styles.paymentNotice}>
            <div className={styles.paymentHeader}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Conditions de paiement</span>
            </div>
            <ul className={styles.paymentList}>
              <li>
                Une avance de <strong>50% ({formatAr(advance)})</strong> est
                requise pour lancer la fabrication de votre commande.
              </li>
              <li>
                En cas d&apos;annulation après confirmation, seulement
                <strong> 50% de votre avance</strong> vous sera remboursée — les
                50% restants couvrent les frais de fabrication engagés.
              </li>
              <li>
                Notre équipe vous contactera via WhatsApp pour les modalités de
                paiement de l&apos;avance.
              </li>
            </ul>

            {/* Checkbox accord */}
            <label className={styles.agreeRow}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className={styles.checkbox}
              />
              <span>
                J&apos;ai lu et j&apos;accepte les conditions de paiement
                ci-dessus.
              </span>
            </label>
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.btnCancel}>
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !agreed}
            className={styles.btnConfirm}
          >
            {loading ? (
              <>
                <span className={styles.spinner} /> Envoi…
              </>
            ) : (
              "✓ Confirmer la commande"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
