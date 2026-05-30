"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./CommandeModal.module.css";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Props = {
  product: any; // On utilise 'any' pour accepter sereinement les différences entre Boutique et Sur-mesure
  onClose: () => void;
  onSuccess: () => void;
};

export default function CommandeModal({ product, onClose, onSuccess }: Props) {
  // 1. Récupération sécurisée du prix (corrige le bug "NaN")
  const priceAr = product.priceAr || product.rawPrice || product.price_ar || 0;
  const priceEur = product.priceEur || Math.round(priceAr / 4800) || 0;

  // 2. Récupération des tailles et couleurs par défaut
  const defaultSizes: string[] = product.sizesArray || (typeof product.sizes === 'string' ? product.sizes.split(',').map((s: string) => s.trim()) : (product.sizes || []));
  const defaultColors: string[] = product.colorsArray || (typeof product.colors === 'string' ? product.colors.split(',').map((c: string) => c.trim()) : (product.colors || []));

  // États du formulaire
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // États pour les étiquettes (Tags) de tailles et couleurs
  const [sizes, setSizes] = useState<string[]>([...defaultSizes]);
  const [sizeInput, setSizeInput] = useState("");
  
  const [colors, setColors] = useState<string[]>([...defaultColors]);
  const [colorInput, setColorInput] = useState("");

  // Vérification des modifications pour afficher les avertissements
  const isSizeChanged = JSON.stringify(sizes) !== JSON.stringify(defaultSizes);
  const isColorChanged = JSON.stringify(colors) !== JSON.stringify(defaultColors);

  // --- Gestion des Tailles ---
  const handleAddSize = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && sizeInput.trim()) {
      e.preventDefault();
      if (!sizes.includes(sizeInput.trim())) setSizes([...sizes, sizeInput.trim()]);
      setSizeInput("");
    }
  };
  const removeSize = (s: string) => setSizes(sizes.filter((x) => x !== s));

  // --- Gestion des Couleurs ---
  const handleAddColor = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && colorInput.trim()) {
      e.preventDefault();
      if (!colors.includes(colorInput.trim())) setColors([...colors, colorInput.trim()]);
      setColorInput("");
    }
  };
  const removeColor = (c: string) => setColors(colors.filter((x) => x !== c));

  // --- Soumission ---
  const handleSubmit = async () => {
    if (!name || !email || !whatsapp || sizes.length === 0 || colors.length === 0) {
      setError("Veuillez remplir tous les champs obligatoires (incluant au moins 1 taille et 1 couleur).");
      return;
    }
    if (!agreed) {
      setError("Veuillez accepter les conditions de paiement avant de confirmer.");
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
          product_price_ar: priceAr,
          selected_size: sizes.join(", "), // On rassemble les tags en texte pour votre backend
          selected_color: colors.join(", "), // Idem ici
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

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const advance = Math.round(priceAr * 0.5);
  const formatAr = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " Ar";

  // --- Styles CSS en ligne pour les "Chips" (Étiquettes) ---
  const chipContainerStyle: React.CSSProperties = {
    display: "flex", flexWrap: "wrap", gap: "6px", padding: "8px", 
    border: "1px solid #d1d5db", borderRadius: "4px", backgroundColor: "#fff", alignItems: "center"
  };
  const chipStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", backgroundColor: "#f3f4f6", 
    padding: "4px 10px", borderRadius: "16px", fontSize: "13px", color: "#374151"
  };
  const chipBtnStyle: React.CSSProperties = {
    border: "none", background: "none", marginLeft: "6px", cursor: "pointer", 
    fontWeight: "bold", color: "#9ca3af", padding: "0 2px"
  };
  const warningStyle: React.CSSProperties = {
    marginTop: "6px", padding: "8px 12px", backgroundColor: "#fffbeb", 
    borderLeft: "3px solid #f59e0b", color: "#b45309", fontSize: "12px", borderRadius: "0 4px 4px 0"
  };

  return (
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
                {formatAr(priceAr)}
                <span> ≈ {priceEur} €</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.sectionTitle}>Votre sélection</p>

          {/* TAILLE — Système de tags */}
          <div className={styles.field}>
            <label className={styles.label}>Taille *</label>
            <div style={chipContainerStyle}>
              {sizes.map((s) => (
                <span key={s} style={chipStyle}>
                  {s}
                  <button type="button" onClick={() => removeSize(s)} style={chipBtnStyle}>×</button>
                </span>
              ))}
              <input
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={handleAddSize}
                placeholder={sizes.length === 0 ? "Tapez une taille et Entrée..." : "Ajouter..."}
                style={{ border: "none", outline: "none", flexGrow: 1, minWidth: "120px", fontSize: "14px" }}
              />
            </div>
            {isSizeChanged && (
              <div style={warningStyle}>
                ⚠️ <strong>Attention :</strong> Si vous changez ou ajoutez une taille personnalisée, il se pourrait que le tarif change en fonction de votre choix. Nous vous enverrons le prix exact via WhatsApp ou email.
              </div>
            )}
          </div>

          {/* COULEUR — Système de tags */}
          <div className={styles.field} style={{ marginTop: "16px" }}>
            <label className={styles.label}>Couleur *</label>
            <div style={chipContainerStyle}>
              {colors.map((c) => (
                <span key={c} style={chipStyle}>
                  {c}
                  <button type="button" onClick={() => removeColor(c)} style={chipBtnStyle}>×</button>
                </span>
              ))}
              <input
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyDown={handleAddColor}
                placeholder={colors.length === 0 ? "Tapez une couleur et Entrée..." : "Ajouter..."}
                style={{ border: "none", outline: "none", flexGrow: 1, minWidth: "120px", fontSize: "14px" }}
              />
            </div>
            {isColorChanged && (
              <div style={warningStyle}>
                💡 <strong>Personnalisation :</strong> Vous avez modifié les couleurs. Veuillez décrire dans le champ "Message" ci-dessous quelle couleur par défaut vous souhaitez remplacer (ou contactez-nous pour en discuter).
              </div>
            )}
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
                placeholder="Exemple: 034 30 513 60"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Message (optionnel mais recommandé si modifications)</label>
            <textarea
              className={styles.textarea}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Précisions sur votre commande, vos modifications de couleurs, mensurations…"
              rows={3}
            />
          </div>

          {/* CLAUSE 50% AVANCE */}
          <div className={styles.paymentNotice}>
            <div className={styles.paymentHeader}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Conditions de paiement</span>
            </div>
            <ul className={styles.paymentList}>
              <li>
                Une avance de <strong>50% ({formatAr(advance)})</strong> est requise pour lancer la fabrication de votre commande.
              </li>
              <li>
                En cas d&apos;annulation après confirmation, seulement <strong> 50% de votre avance</strong> vous sera remboursée — les 50% restants couvrent les frais de fabrication engagés.
              </li>
              <li>
                Notre équipe vous contactera via WhatsApp pour les modalités de paiement de l&apos;avance.
              </li>
            </ul>

            <label className={styles.agreeRow}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className={styles.checkbox} />
              <span>J&apos;ai lu et j&apos;accepte les conditions de paiement ci-dessus.</span>
            </label>
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.btnCancel}>Annuler</button>
          <button onClick={handleSubmit} disabled={loading || !agreed} className={styles.btnConfirm}>
            {loading ? <><span className={styles.spinner} /> Envoi…</> : "✓ Confirmer la commande"}
          </button>
        </div>
      </div>
    </div>
  );
}