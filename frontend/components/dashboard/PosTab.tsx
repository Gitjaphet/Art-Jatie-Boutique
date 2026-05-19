"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import styles from "./PosTab.module.css";
import {
  CheckCircle,
  Printer,
  ArrowLeft,
  User,
  Banknote,
  CreditCard,
  Smartphone,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────

type Color = { id: number; name: string; hex_code: string };

type PosProduct = {
  id: number;
  name: string;
  category: string;
  genre: string;
  price_ar: number;
  badge: string;
  on_order: boolean;
  image: string;
  sizes?: string | string[];
  colors?: string | string[];
  stock_quantity?: number;
  stock_qty?: number;
  brand?: string;
};

type CartItem = PosProduct & { qty: number; discount?: number };
type NumpadMode = "qty" | "discount" | "price";

type PosTabProps = {
  products: PosProduct[];
  settings: Record<string, unknown> | null;
  toast: (msg: string, type?: "success" | "error") => void;
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── HELPERS ──────────────────────────────────────────────────────

function parseSizesFlat(raw?: string | string[]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed))
      return parsed.map((item: any) => item.nom ?? item.name ?? String(item));
  } catch { /* CSV */ }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseColorsFlat(raw?: string | string[]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((c: any) => c.name ?? String(c));
  } catch { /* CSV */ }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

const BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  "En stock": { bg: "#16a34a", color: "#fff" },
  Nouveau:    { bg: "#8b5cf6", color: "#fff" },
  Derniers:   { bg: "#f97316", color: "#fff" },
};

const BADGE_LABEL: Record<string, string> = {
  "En stock": "EN STOCK",
  Nouveau:    "NOUVEAU",
  Derniers:   "DERNIERS",
};

const PAYMENT_METHODS = [
  { id: "Espèces",       icon: <Banknote size={20} />   },
  { id: "MVola",         icon: <Smartphone size={20} /> },
  { id: "Orange Money",  icon: <Smartphone size={20} /> },
  { id: "Carte",         icon: <CreditCard size={20} /> },
  { id: "Compte client", icon: <User size={20} />       },
];

const CAISSE_NUMPAD_KEYS = [
  "1","2","3","Qté",
  "4","5","6","%",
  "7","8","9","Prix",
  "+/-","0","⌫","",
];

const PAYMENT_NUMPAD_KEYS = [
  "1","2","3","+10k",
  "4","5","6","+50k",
  "7","8","9","⌫",
  "+/-","0",".","",
];

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────

export default function PosTab({ products, settings, toast }: PosTabProps) {
  const [step, setStep] = useState<"cart" | "payment" | "receipt">("cart");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [numpadMode, setNumpadMode] = useState<NumpadMode>("qty");
  const [numpadBuffer, setNumpadBuffer] = useState("");

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("TOUT");
  const [activeGenre, setActiveGenre] = useState("TOUT");

  const [paymentMethod, setPaymentMethod] = useState("Espèces");
  const [amountTenderedStr, setAmountTenderedStr] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientWhatsapp, setClientWhatsapp] = useState("");
  const [note, setNote] = useState("");

  const [ticketNumber, setTicketNumber] = useState("");
  const [lastOrderDate, setLastOrderDate] = useState("");
  const [lastChange, setLastChange] = useState(0);
  const [lastAmountTendered, setLastAmountTendered] = useState(0);

  const [colorRegistry, setColorRegistry] = useState<Map<string, string>>(new Map());

  // ── Couleurs ──
  useEffect(() => {
    fetch(`${API}/colors`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Color[]) => {
        const map = new Map<string, string>();
        data.forEach((c) => map.set(c.name.toLowerCase(), c.hex_code));
        setColorRegistry(map);
      })
      .catch(() => {});
  }, []);

  const resolveHex = (name: string) =>
    colorRegistry.get(name.toLowerCase()) ?? "#9ca3af";

  // ── Settings ──
  const safeProducts = products || [];

  const settingsCats: string[] =
    typeof settings?.available_categories === "string"
      ? settings.available_categories.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  const settingsGenres: string[] =
    typeof settings?.available_genres === "string"
      ? settings.available_genres.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  const categories = [
    "TOUT",
    ...(settingsCats.length
      ? settingsCats
      : Array.from(new Set(safeProducts.map((p) => p.category).filter(Boolean)))),
  ];

  const genres = [
    "TOUT",
    ...(settingsGenres.length
      ? settingsGenres
      : Array.from(new Set(safeProducts.map((p) => p.genre).filter(Boolean)))),
  ];

  // ── Filtrage ──
  const availableProducts = safeProducts.filter((p) => {
    const isEnStock = ["En stock", "Nouveau", "Derniers"].includes(p.badge);
    const matchSearch = (p.name || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCat === "TOUT" || p.category === activeCat;
    const matchGenre = activeGenre === "TOUT" || p.genre === activeGenre;
    return isEnStock && !p.on_order && matchSearch && matchCat && matchGenre;
  });

  // ── Total ──
  const totalWithDiscount = cart.reduce((sum, item) => {
    const disc = item.discount ?? 0;
    return sum + item.price_ar * item.qty * (1 - disc / 100);
  }, 0);

  // ── Paiement ──
  const amountTendered = amountTenderedStr ? parseInt(amountTenderedStr, 10) : 0;
  const change = amountTendered > totalWithDiscount ? amountTendered - totalWithDiscount : 0;
  const remaining = amountTendered < totalWithDiscount ? totalWithDiscount - amountTendered : 0;

  // ── Panier ──
  const addToCart = (product: PosProduct) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        setSelectedIdx(idx);
        return next;
      }
      setSelectedIdx(prev.length);
      return [...prev, { ...product, qty: 1, discount: 0 }];
    });
    setNumpadBuffer("");
    setNumpadMode("qty");
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
      setCart([]);
      setSelectedIdx(null);
      setNumpadBuffer("");
      toast("Commande annulée.", "success");
    }
  };

  const goToPayment = () => {
    if (cart.length === 0) { toast("Le panier est vide.", "error"); return; }
    setStep("payment");
    setAmountTenderedStr("");
  };

  // ── Numpad caisse ──
  const applyBuffer = useCallback(
    (buffer: string, idx: number, mode: NumpadMode) => {
      const val = parseFloat(buffer);
      if (isNaN(val) || val < 0) return;
      setCart((prev) => {
        const next = [...prev];
        const item = { ...next[idx] };
        if (mode === "qty")      item.qty      = Math.max(1, Math.floor(val));
        if (mode === "price")    item.price_ar  = Math.max(0, Math.floor(val));
        if (mode === "discount") item.discount  = Math.min(100, Math.max(0, val));
        next[idx] = item;
        return next;
      });
    },
    []
  );

  const handleCaisseNumpad = useCallback(
    (btn: string) => {
      if (btn === "Qté")  { setNumpadMode("qty");      setNumpadBuffer(""); return; }
      if (btn === "%")    { setNumpadMode("discount"); setNumpadBuffer(""); return; }
      if (btn === "Prix") { setNumpadMode("price");    setNumpadBuffer(""); return; }

      if (btn === "⌫") {
        // 1. Si on a tapé un chiffre (ex: on efface avec la touche retour)
        if (numpadBuffer.length > 0) {
          const nextBuffer = numpadBuffer.slice(0, -1);
          setNumpadBuffer(nextBuffer);
          if (nextBuffer && selectedIdx !== null && selectedIdx < cart.length) {
            applyBuffer(nextBuffer, selectedIdx, numpadMode);
          }
          return;
        }

        // 2. Sinon, on décrémente le produit de 1 de manière ultra-sécurisée
        if (selectedIdx !== null) {
          setCart((prevCart) => {
            if (selectedIdx >= prevCart.length) return prevCart;
            
            const nextCart = [...prevCart];
            const currentItem = nextCart[selectedIdx];
            
            if (currentItem.qty > 1) {
              // Le secret est ici : on DOIT recréer un objet avec { ...currentItem }
              // Ça empêche React de s'emmêler les pinceaux et d'enlever 2 !
              nextCart[selectedIdx] = { ...currentItem, qty: currentItem.qty - 1 };
            } else {
              // Si on arrive à 0, on supprime le produit du panier
              nextCart.splice(selectedIdx, 1);
              setTimeout(() => setSelectedIdx(null), 0);
            }
            return nextCart;
          });
        }
        return;
      }

      if (btn === "+/-") {
        setCart((prev) => prev.filter((_, i) => i !== selectedIdx));
        setSelectedIdx(null);
        setNumpadBuffer("");
        return;
      }

      if (selectedIdx === null || selectedIdx >= cart.length) return;

      const newBuffer = numpadBuffer + btn;
      setNumpadBuffer(newBuffer);
      applyBuffer(newBuffer, selectedIdx, numpadMode);
    },
    [selectedIdx, cart.length, numpadMode, numpadBuffer, applyBuffer]
  );

  // ── Numpad paiement ──
  const handlePaymentNumpad = (val: string) => {
    if (val === "⌫")
      setAmountTenderedStr((p) => p.slice(0, -1));
    else if (val === "+10k")
      setAmountTenderedStr((p) => (parseInt(p || "0") + 10000).toString());
    else if (val === "+50k")
      setAmountTenderedStr((p) => (parseInt(p || "0") + 50000).toString());
    else
      setAmountTenderedStr((p) => p + val);
  };

  // ── Validation — erreur détaillée ──
  const validateOrder = async () => {
    if (paymentMethod === "Espèces" && amountTendered < totalWithDiscount) {
      toast(
        `Il manque ${Math.round(totalWithDiscount - amountTendered).toLocaleString("fr-FR")} Ar.`,
        "error"
      );
      return;
    }

    setIsSubmitting(true);
    const finalTendered =
      paymentMethod === "Espèces" ? amountTendered : Math.round(totalWithDiscount);
    const finalChange = paymentMethod === "Espèces" ? Math.round(change) : 0;

    const payload = {
      client_name:     clientName || "Client de passage",
      client_whatsapp: clientWhatsapp || "0000000000",
      note,
      cart_items: cart.map((c) => ({
        id:       c.id,
        name:     c.name,
        price:    c.price_ar,
        quantity: c.qty,
        image:    c.image,
        category: c.category,
        discount: c.discount ?? 0,
      })),
      total_ar:       Math.round(totalWithDiscount),
      payment_method: paymentMethod,
      amount_tendered: finalTendered,
      change:          finalChange,
    };

    try {
      const res = await fetch(`${API}/orders/pos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Lire le JSON AVANT de tester res.ok pour récupérer le message d'erreur
      const savedOrder = await res.json();

      if (!res.ok) {
        const detail =
          savedOrder?.detail ||
          savedOrder?.message ||
          savedOrder?.error ||
          `Erreur HTTP ${res.status}`;
        console.error("[POS] Erreur API :", detail, savedOrder);
        toast(`Erreur : ${detail}`, "error");
        return;
      }

      if (!savedOrder?.id) {
        console.error("[POS] Réponse inattendue (id manquant) :", savedOrder);
        toast("Réponse inattendue du serveur.", "error");
        return;
      }

      setTicketNumber(
        `TKT-${new Date().getFullYear()}-${savedOrder.id.toString().padStart(4, "0")}`
      );
      setLastOrderDate(new Date().toLocaleString("fr-FR"));
      setLastChange(finalChange);
      setLastAmountTendered(finalTendered);
      setStep("receipt");
      toast("Paiement validé avec succès !", "success");
    } catch (err: unknown) {
      // Erreur réseau ou JSON malformé
      const msg = err instanceof Error ? err.message : "Erreur réseau inconnue";
      console.error("[POS] Erreur réseau :", err);
      toast(`Erreur réseau : ${msg}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPos = () => {
    setCart([]);
    setSelectedIdx(null);
    setNumpadBuffer("");
    setNumpadMode("qty");
    setClientName("");
    setClientWhatsapp("");
    setNote("");
    setAmountTenderedStr("");
    setPaymentMethod("Espèces");
    setStep("cart");
  };

  // ── Clavier physique ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (step === "cart") {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          handleCaisseNumpad(e.key);
          return;
        }
        if (e.key === "Backspace" || e.key === "Delete") {
          e.preventDefault();
          handleCaisseNumpad("⌫");
          return;
        }
        if (e.key === "Enter")  { e.preventDefault(); goToPayment(); return; }
        if (e.key === "Escape") {
          e.preventDefault();
          if (selectedIdx !== null) handleCaisseNumpad("+/-");
          return;
        }
        if (e.key.toLowerCase() === "q") { setNumpadMode("qty");      setNumpadBuffer(""); }
        if (e.key.toLowerCase() === "p") { setNumpadMode("price");    setNumpadBuffer(""); }
        if (e.key.toLowerCase() === "d") { setNumpadMode("discount"); setNumpadBuffer(""); }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIdx((prev) => (prev !== null ? Math.max(0, prev - 1) : 0));
          setNumpadBuffer("");
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIdx((prev) => {
            const max = cart.length - 1;
            return prev !== null ? Math.min(max, prev + 1) : 0;
          });
          setNumpadBuffer("");
        }
      }

      if (step === "payment" && paymentMethod === "Espèces") {
        if (/^[0-9]$/.test(e.key)) { e.preventDefault(); handlePaymentNumpad(e.key); }
        if (e.key === "Backspace")  { e.preventDefault(); handlePaymentNumpad("⌫"); }
        if (e.key === "Enter")      { e.preventDefault(); validateOrder(); }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, handleCaisseNumpad, selectedIdx, cart.length, paymentMethod]);

  // ─── RENDU ────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>

      {/* ══════════════════════════════════════════
          ÉCRAN 1 — CAISSE
      ══════════════════════════════════════════ */}
      {step === "cart" && (
        <>
          {/* ── Sidebar gauche : ticket ── */}
          <div className={styles.sidebar}>
            <div className={styles.header}>
              <button className={styles.tabActive}>Caisse</button>

              <div className={styles.keyboardMode}>
                <kbd className={styles.keyboardModeKbd}>
                  {numpadMode === "qty" ? "Q" : numpadMode === "price" ? "P" : "D"}
                </kbd>
                <span>
                  {numpadMode === "qty" ? "Qté" : numpadMode === "price" ? "Prix" : "Remise"}
                </span>
              </div>
            </div>

            {/* Lignes panier */}
            <div className={styles.cartArea}>
              {cart.length === 0 ? (
                <div className={styles.emptyCart}>
                  <span className={styles.emptyCartEmoji}>🛒</span>
                  <span>Panier vide</span>
                  <span className={styles.emptyCartHint}>
                    Cliquez sur un produit pour l'ajouter
                  </span>
                </div>
              ) : (
                cart.map((item, i) => {
                  const disc = item.discount ?? 0;
                  const lineTotal = Math.round(item.price_ar * item.qty * (1 - disc / 100));
                  const isSelected = selectedIdx === i;
                  return (
                    <div
                      key={i}
                      onClick={() => { setSelectedIdx(i); setNumpadBuffer(""); }}
                      className={`${styles.cartItem} ${isSelected ? styles.cartItemSelected : ""}`}
                    >
                      <div className={styles.cartItemThumb}>
                        {item.image && (
                          <img src={item.image} alt={item.name} />
                        )}
                      </div>

                      <div className={styles.cartItemBody}>
                        <div className={styles.cartItemTop}>
                          <span className={styles.cartItemQty}>{item.qty}×</span>
                          <span className={styles.cartItemName}>{item.name}</span>
                        </div>
                        {disc > 0 && (
                          <div className={styles.cartItemDiscount}>
                            Remise {disc}% · unité {item.price_ar.toLocaleString("fr-FR")} Ar
                          </div>
                        )}
                      </div>

                      <span className={styles.cartItemPrice}>
                        {lineTotal.toLocaleString("fr-FR")} Ar
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer sidebar */}
            <div className={styles.footer}>
              <div className={styles.totalRow}>
                <span>Total</span>
                <span>
                  {Math.round(totalWithDiscount).toLocaleString("fr-FR")}{" "}
                  <span className={styles.totalCurrency}>Ar</span>
                </span>
              </div>

              {/* Numpad caisse */}
              <div className={styles.numpad}>
                {CAISSE_NUMPAD_KEYS.map((btn, i) => {
                  const isMode   = ["Qté", "%", "Prix"].includes(btn);
                  const isActive =
                    (btn === "Qté"  && numpadMode === "qty") ||
                    (btn === "%"    && numpadMode === "discount") ||
                    (btn === "Prix" && numpadMode === "price");
                  const isDelete = btn === "⌫" || btn === "+/-";

                  let cls = styles.numDefault;
                  if (isMode)   cls = styles.numAction;
                  if (isDelete) cls = styles.numDelete;

                  return (
                    <button
                      key={i}
                      className={[
                        styles.numBtn,
                        cls,
                        isActive ? styles.numActionActive : "",
                        !btn     ? styles.numBtnHidden    : "",
                      ].join(" ")}
                      onClick={() => btn && handleCaisseNumpad(btn)}
                    >
                      {btn}
                    </button>
                  );
                })}
              </div>

              {/* Buffer saisie */}
              {numpadBuffer && selectedIdx !== null && (
                <div className={styles.numpadBuffer}>
                  <span>
                    {numpadMode === "qty"
                      ? "Quantité"
                      : numpadMode === "discount"
                      ? "Remise %"
                      : "Prix Ar"}{" "}
                    :
                  </span>
                  <span className={styles.numpadBufferValue}>{numpadBuffer}</span>
                </div>
              )}

              {/* Raccourcis clavier */}
              <div className={styles.shortcuts}>
                {(
                  [
                    { key: "Q", label: "Qté",    mode: "qty"      as NumpadMode },
                    { key: "P", label: "Prix",   mode: "price"    as NumpadMode },
                    { key: "D", label: "Remise", mode: "discount" as NumpadMode },
                  ] as const
                ).map(({ key, label, mode }) => (
                  <button
                    key={key}
                    onClick={() => { setNumpadMode(mode); setNumpadBuffer(""); }}
                    className={[
                      styles.shortcutBtn,
                      numpadMode === mode
                        ? styles.shortcutBtnActive
                        : styles.shortcutBtnInactive,
                    ].join(" ")}
                  >
                    <kbd
                      className={[
                        styles.shortcutKbd,
                        numpadMode === mode
                          ? styles.shortcutKbdActive
                          : styles.shortcutKbdInactive,
                      ].join(" ")}
                    >
                      {key}
                    </kbd>
                    {label}
                  </button>
                ))}
                <span className={styles.shortcutHint}>
                  ↑↓ naviguer · Esc supprimer · ⏎ payer
                </span>
              </div>

              <div className={styles.checkoutArea}>
                <button onClick={clearCart} className={styles.cancelBtn}>
                  Annuler
                </button>
                <button onClick={goToPayment} className={styles.payBtn}>
                  Paiement
                  {totalWithDiscount > 0 &&
                    ` • ${Math.round(totalWithDiscount).toLocaleString("fr-FR")} Ar`}
                </button>
              </div>
            </div>
          </div>

          {/* ── Zone droite : produits ── */}
          <div className={styles.mainArea}>
            <div className={styles.searchArea}>
              <input
                type="text"
                placeholder="Rechercher un produit..."
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className={styles.filtersWrapper}>
              <div className={styles.filterRow}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCat(cat)}
                    className={`${styles.filterBtn} ${
                      activeCat === cat
                        ? styles.filterCatActive
                        : styles.filterCatInactive
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className={styles.filterRow}>
                {genres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setActiveGenre(g)}
                    className={`${styles.filterBtn} ${
                      activeGenre === g
                        ? styles.filterTargetActive
                        : styles.filterTargetInactive
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Grille produits */}
            <div className={styles.productGrid}>
              {availableProducts.map((p) => {
                const badge    = BADGE_STYLE[p.badge] || { bg: "#6b7280", color: "#fff" };
                const inCart   = cart.find((c) => c.id === p.id);
                const sizeList = parseSizesFlat(p.sizes);
                const colorList = parseColorsFlat(p.colors);
                const stockQty = p.stock_quantity ?? p.stock_qty;

                return (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={`${styles.productCard} ${
                      inCart ? styles.productCardInCart : ""
                    }`}
                  >
                    {/* Badge statut */}
                    <div
                      className={styles.productBadge}
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {BADGE_LABEL[p.badge] ?? p.badge.toUpperCase()}
                    </div>

                    {/* Bulle quantité panier */}
                    {inCart && (
                      <div className={styles.productCartBubble}>{inCart.qty}</div>
                    )}

                    {/* Image */}
                    <div className={styles.productImageWrapper}>
                      {p.image ? (
                        <img src={p.image} alt={p.name} />
                      ) : (
                        <div className={styles.productNoImage}>Pas d'image</div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className={styles.productInfo}>
                      {p.brand && (
                        <div className={styles.productBrand}>{p.brand}</div>
                      )}
                      <div className={styles.productName}>{p.name}</div>

                      <div className={styles.productPriceRow}>
                        <span className={styles.productPrice}>
                          {p.price_ar.toLocaleString("fr-FR")} Ar
                        </span>
                        {p.genre && (
                          <span className={styles.productGenre}>{p.genre}</span>
                        )}
                        
                      </div>

                      {sizeList.length > 0 && (
                        <div className={styles.productSizes}>
                          {sizeList.map((s) => (
                            <span key={s} className={styles.productSizeTag}>
                              {s}
                            </span>
                          ))}
                          
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "18px" }}>
                        <div className={styles.productColors} style={{ marginTop: 0 }}>
                          {colorList.map((name) => (
                            <span
                              key={name}
                              title={name}
                              className={styles.productColorDot}
                              style={{ backgroundColor: resolveHex(name) }}
                            />
                          ))}
                        </div>

                        {stockQty !== undefined && stockQty <= 3 && (
                          <div className={styles.productStock} style={{ marginTop: 0, textAlign: "right" }}>
                            +{stockQty} en stock
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                        className={styles.productAddBtn}
                      >
                        AJOUTER AU PANIER
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════
          ÉCRAN 2 — PAIEMENT
      ══════════════════════════════════════════ */}
      {step === "payment" && (
        <div className={styles.paymentScreen}>

          {/* Sidebar méthodes */}
          <div className={styles.paymentSidebar}>
            <div className={styles.paymentBackHeader}>
              <button
                onClick={() => setStep("cart")}
                className={styles.paymentBackBtn}
              >
                <ArrowLeft size={18} /> Retour
              </button>
            </div>

            <div className={styles.paymentMethodList}>
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => { setPaymentMethod(method.id); setAmountTenderedStr(""); }}
                  className={`${styles.paymentMethodBtn} ${
                    paymentMethod === method.id ? styles.paymentMethodBtnActive : ""
                  }`}
                >
                  {method.icon}
                  {method.id}
                </button>
              ))}
            </div>

            {/* Infos client */}
            <div className={styles.clientInfoPanel}>
              <h4 className={styles.clientInfoTitle}>
                <User size={14} /> Informations Client
              </h4>
              <input
                type="text"
                placeholder="Nom (optionnel)"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className={styles.clientInput}
              />
              <input
                type="text"
                placeholder="WhatsApp"
                value={clientWhatsapp}
                onChange={(e) => setClientWhatsapp(e.target.value)}
                className={styles.clientInput}
              />
              <textarea
                placeholder="Note interne..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={styles.clientTextarea}
              />
            </div>
          </div>

          {/* Zone centrale */}
          <div className={styles.paymentMain}>
            <h1 className={styles.paymentTotal}>
              {Math.round(totalWithDiscount).toLocaleString("fr-FR")}{" "}
              <span className={styles.paymentTotalCurrency}>Ar</span>
            </h1>

            {/* Résumé */}
            <div className={styles.paymentSummaryCard}>
              <div className={styles.paymentSummaryTop}>
                <span>{paymentMethod}</span>
                <span className={styles.paymentSummaryTopAmount}>
                  {paymentMethod === "Espèces"
                    ? (amountTendered || 0).toLocaleString("fr-FR")
                    : Math.round(totalWithDiscount).toLocaleString("fr-FR")}{" "}
                  Ar
                </span>
              </div>
              <div
                className={`${styles.paymentSummaryBottom} ${
                  remaining > 0
                    ? styles.paymentSummaryBottomRed
                    : styles.paymentSummaryBottomGreen
                }`}
              >
                <span>
                  {remaining > 0 ? "Restant à payer" : "Monnaie à rendre"}
                </span>
                <span>
                  {remaining > 0
                    ? Math.round(remaining).toLocaleString("fr-FR")
                    : Math.round(change).toLocaleString("fr-FR")}{" "}
                  Ar
                </span>
              </div>
            </div>

            {/* Numpad espèces */}
            {paymentMethod === "Espèces" && (
              <>
                <div className={styles.paymentNumpad}>
                  {PAYMENT_NUMPAD_KEYS.map((btn, i) => (
                    <button
                      key={i}
                      onClick={() => btn && handlePaymentNumpad(btn)}
                      className={[
                        styles.payNumBtn,
                        !btn               ? styles.payNumBtnHidden : "",
                        btn.startsWith("+") ? styles.payNumBtnAdd   : "",
                        btn === "⌫"        ? styles.payNumBtnDel   : "",
                      ].join(" ")}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
                <p className={styles.paymentKeyboardHint}>
                  Pavé numérique supporté · ⏎ pour valider
                </p>
              </>
            )}

            <button
              onClick={validateOrder}
              disabled={isSubmitting || (paymentMethod === "Espèces" && remaining > 0)}
              className={`${styles.validateBtn} ${
                paymentMethod === "Espèces" && remaining > 0
                  ? styles.validateBtnDisabled
                  : ""
              }`}
            >
              {isSubmitting ? "Validation..." : "✓ Valider le paiement"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          ÉCRAN 3 — REÇU
      ══════════════════════════════════════════ */}
      {step === "receipt" && (
        <div className={styles.receiptScreen}>

          {/* Zone succès */}
          <div className={styles.receiptSuccess}>
            <div className={styles.receiptSuccessBox}>
              <CheckCircle size={44} />
              <h2 className={styles.receiptSuccessTitle}>Paiement réussi</h2>
              <p className={styles.receiptSuccessAmount}>
                {Math.round(totalWithDiscount).toLocaleString("fr-FR")} Ar
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className={styles.receiptPrintBtn}
            >
              <Printer size={18} /> Imprimer le reçu
            </button>

            <button onClick={resetPos} className={styles.receiptNewOrderBtn}>
              Nouvelle commande
            </button>
          </div>

          {/* Ticket papier */}
          <div className={`${styles.receiptPaper} printable-receipt`}>
            <div className={styles.receiptPaperHeader}>
              <Image
                src="/images/logo/art_jatie.png"
                alt="Art Jatie"
                width={110}
                height={40}
                style={{ objectFit: "contain", margin: "0 auto" }}
              />
              <p className={styles.receiptShopInfo}>
                Boutique Art Jatie · Ambonara, Nosy Be
                <br />
                +261 34 00 000 00
              </p>
              <div className={styles.receiptMeta}>
                {ticketNumber}
                <br />
                {lastOrderDate}
              </div>
            </div>

            <div className={styles.receiptItemsWrapper}>
              {cart.map((item, i) => {
                const disc = item.discount ?? 0;
                const lineTotal = Math.round(
                  item.price_ar * item.qty * (1 - disc / 100)
                );
                return (
                  <div key={i} className={styles.receiptItem}>
                    <div className={styles.receiptItemLeft}>
                      <span className={styles.receiptItemQty}>{item.qty}×</span>
                      {item.name}
                      {disc > 0 && (
                        <span className={styles.receiptItemDiscount}>
                          (-{disc}%)
                        </span>
                      )}
                    </div>
                    <div className={styles.receiptItemRight}>
                      {lineTotal.toLocaleString("fr-FR")} Ar
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.receiptTotal}>
              <span>Total</span>
              <span>{Math.round(totalWithDiscount).toLocaleString("fr-FR")} Ar</span>
            </div>

            <div className={styles.receiptPaymentDetails}>
              <div className={styles.receiptPaymentRow}>
                <span>{paymentMethod}</span>
                <span>
                  {paymentMethod === "Espèces"
                    ? lastAmountTendered.toLocaleString("fr-FR")
                    : Math.round(totalWithDiscount).toLocaleString("fr-FR")}{" "}
                  Ar
                </span>
              </div>
              {paymentMethod === "Espèces" && lastChange > 0 && (
                <div className={styles.receiptPaymentRow}>
                  <span>Monnaie rendue</span>
                  <span>{lastChange.toLocaleString("fr-FR")} Ar</span>
                </div>
              )}
            </div>

            <div className={styles.receiptFooter}>
              Merci de votre visite !
              {clientName && (
                <div className={styles.receiptClientName}>
                  Client : {clientName}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}