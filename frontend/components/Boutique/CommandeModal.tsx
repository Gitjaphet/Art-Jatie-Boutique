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

const COLORS_MAP: Record<string, string> = {
  Beige: "#D4B896",
  Blanc: "#F5F5F5",
  Bleu: "#4A90D9",
  Marron: "#795548",
  Noir: "#1a1a1a",
  Or: "#C9A84C",
  Rose: "#E86B8C",
  Rouge: "#E53935",
  Vert: "#4CAF50",
  Kaki: "#8B9467",
  Multicolore: "linear-gradient(135deg,#E86B8C,#4A90D9,#4CAF50)",
};

export default function CommandeModal({ product, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [size, setSize] = useState(product.sizes[0] || "");
  const [color, setColor] = useState(product.colors[0] || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name || !email || !whatsapp || !size || !color) {
      setError("Veuillez remplir tous les champs obligatoires.");
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

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
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
                {product.priceArDisplay} <span>≈ {product.priceEur} €</span>
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

          {/* TAILLES */}
          <div className={styles.field}>
            <label className={styles.label}>Taille *</label>
            <div className={styles.sizeGrid}>
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`${styles.sizeBtn} ${size === s ? styles.sizeBtnActive : ""}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* COULEURS */}
          <div className={styles.field}>
            <label className={styles.label}>
              Couleur * <span className={styles.selectedLabel}>{color}</span>
            </label>
            <div className={styles.colorGrid}>
              {product.colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  title={c}
                  className={`${styles.colorBtn} ${color === c ? styles.colorBtnActive : ""}`}
                  style={{ background: COLORS_MAP[c] ?? "#ccc" }}
                />
              ))}
            </div>
          </div>

          <div className={styles.divider} />
          <p className={styles.sectionTitle}>Vos coordonnées</p>

          {/* FORMULAIRE */}
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

          {error && <p className={styles.error}>{error}</p>}
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.btnCancel}>
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
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
