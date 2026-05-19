"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import styles from "./CartOrdersTab.module.css";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Types ───────────────────────────────────────────────────────────────────

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category?: string;
};

type CartOrder = {
  id: number;
  client_name: string;
  client_email: string;
  client_whatsapp: string;
  client_message?: string;

  cart_items_json?: string;

  delivery_zone?: string;
  delivery_cost?: number;
  delivery_label?: string;

  subtotal_ar?: number;
  discount_ar?: number;
  total_ar?: number;

  payment_method: string;

  mvola_account_name?: string;
  mvola_phone?: string;

  om_account_name?: string;
  om_phone?: string;

  payment_proof_text?: string;
  payment_proof_image?: string;

  mvola_status?: string;

  status: string;
  created_at: string;

  is_pos?: boolean;
};

// ─── Constantes ──────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  "En attente",
  "Confirmée",
  "En cours",
  "Livrée",
  "Annulée",
];

const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> =
  {
    "En attente": { bg: "#fff8e6", color: "#b45309", dot: "#f59e0b" },
    Confirmée: { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
    "En cours": { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
    Livrée: { bg: "#fdf4ff", color: "#7e22ce", dot: "#a855f7" },
    Annulée: { bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444" },
  };

const PAYMENT_STYLE: Record<
  string,
  { label: string; bg: string; color: string; icon: string }
> = {
  mvola: { label: "MVola", bg: "#fff0f3", color: "#c0392b", icon: "🔴" },
  orange_money: {
    label: "Orange Money",
    bg: "#fff7ed",
    color: "#c2410c",
    icon: "🟠",
  },
  whatsapp: { label: "WhatsApp", bg: "#f0fdf4", color: "#15803d", icon: "💬" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAr(n?: number) {
  if (!n) return "—";
  return new Intl.NumberFormat("fr-FR").format(n) + " Ar";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseCart(json?: string): CartItem[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = { toast: (msg: string, type?: string) => void };

// ─── Composant principal ─────────────────────────────────────────────────────

export default function CartOrdersTab({ toast }: Props) {
  const [orders, setOrders] = useState<CartOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tous");
  const [payFilter, setPayFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [proofModal, setProofModal] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API}/orders/`);
      if (!res.ok) throw new Error();
      const all: CartOrder[] = await res.json();
      // On garde seulement les commandes avec panier (cart_items_json non null)
      setOrders(all.filter((o) => o.cart_items_json && !o.is_pos));
    } catch {
      toast("Impossible de charger les commandes.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const updateStatus = async (id: number, status: string) => {
    setConfirming(id);
    try {
      const res = await fetch(
        `${API}/orders/${id}/status?status=${encodeURIComponent(status)}`,
        { method: "PATCH" },
      );
      if (!res.ok) throw new Error();
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o)),
      );
      toast(
        status === "Confirmée"
          ? "✅ Commande confirmée — stock déduit automatiquement."
          : `Statut mis à jour : ${status}`,
      );
    } catch {
      toast("Erreur lors de la mise à jour.", "error");
    } finally {
      setConfirming(null);
    }
  };

  const deleteOrder = async (id: number) => {
    setDeleting(id);
    try {
      const res = await fetch(`${API}/orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setOrders((prev) => prev.filter((o) => o.id !== id));
      toast("Commande supprimée.");
    } catch {
      toast("Erreur lors de la suppression.", "error");
    } finally {
      setDeleting(null);
    }
  };

  // ── Filtres ────────────────────────────────────────────────────────────────

  const filtered = orders.filter((o) => {
    if (filter !== "Tous" && o.status !== filter) return false;
    if (payFilter !== "Tous" && o.payment_method !== payFilter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      o.client_name.toLowerCase().includes(q) ||
      o.client_email.toLowerCase().includes(q) ||
      String(o.id).includes(q)
    );
  });

  const counts = STATUS_OPTIONS.reduce(
    (acc, s) => {
      acc[s] = orders.filter((o) => o.status === s).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalRevenue = orders
    .filter((o) => o.status === "Livrée")
    .reduce((s, o) => s + (o.total_ar || 0), 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading)
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p>Chargement des commandes…</p>
      </div>
    );

  return (
    <div className={styles.wrap}>
      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{orders.length}</span>
          <span className={styles.statLabel}>Total commandes</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum} style={{ color: "#f59e0b" }}>
            {counts["En attente"] || 0}
          </span>
          <span className={styles.statLabel}>En attente</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum} style={{ color: "#22c55e" }}>
            {counts["Confirmée"] || 0}
          </span>
          <span className={styles.statLabel}>Confirmées</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum} style={{ color: "#a855f7" }}>
            {counts["Livrée"] || 0}
          </span>
          <span className={styles.statLabel}>Livrées</span>
        </div>
        <div
          className={styles.statCard}
          style={{ borderColor: "rgba(34,197,94,0.3)" }}
        >
          <span
            className={styles.statNum}
            style={{ color: "#15803d", fontSize: "1.1rem" }}
          >
            {formatAr(totalRevenue)}
          </span>
          <span className={styles.statLabel}>Revenus livrés</span>
        </div>
      </div>

      {/* ── TOOLBAR ───────────────────────────────────────────────────────── */}
      <div className={styles.toolbar}>
        {/* Filtre statut */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Statut</span>
          <div className={styles.filters}>
            {["Tous", ...STATUS_OPTIONS].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ""}`}
                style={
                  filter === s && s !== "Tous"
                    ? {
                        background: STATUS_STYLE[s]?.bg,
                        color: STATUS_STYLE[s]?.color,
                        borderColor: STATUS_STYLE[s]?.dot,
                      }
                    : {}
                }
              >
                {s}
                {s !== "Tous" && counts[s] > 0 && (
                  <span className={styles.filterCount}>{counts[s]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filtre paiement */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Paiement</span>
          <div className={styles.filters}>
            {["Tous", "mvola", "orange_money", "whatsapp"].map((p) => {
              const pm = PAYMENT_STYLE[p];
              return (
                <button
                  key={p}
                  onClick={() => setPayFilter(p)}
                  className={`${styles.filterBtn} ${payFilter === p ? styles.filterActive : ""}`}
                  style={
                    payFilter === p && p !== "Tous"
                      ? { background: pm?.bg, color: pm?.color }
                      : {}
                  }
                >
                  {p === "Tous" ? "Tous" : `${pm?.icon} ${pm?.label}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recherche */}
        <div className={styles.searchBox}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher client, #id…"
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* ── LISTE ─────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <p>Aucune commande trouvée</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((order) => {
            const st = STATUS_STYLE[order.status] || STATUS_STYLE["En attente"];
            const pm =
              PAYMENT_STYLE[order.payment_method] || PAYMENT_STYLE["whatsapp"];
            const isExpanded = expandedId === order.id;
            const cartItems = parseCart(order.cart_items_json);
            const isConfirming = confirming === order.id;
            const isDeleting = deleting === order.id;

            return (
              <div
                key={order.id}
                className={`${styles.card} ${isDeleting ? styles.cardRemoving : ""}`}
              >
                {/* ── CARD HEADER ─────────────────────────────────────────── */}
                <div
                  className={styles.cardHeader}
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  {/* Résumé panier */}
                  <div className={styles.cartSummary}>
                    <div className={styles.cartThumbs}>
                      {cartItems.slice(0, 3).map((item, i) => (
                        <div
                          key={i}
                          className={styles.thumb}
                          style={{ zIndex: 3 - i }}
                        >
                          <Image
                            src={item.image || "/images/logo/art_jatie.png"}
                            alt={item.name}
                            fill
                            sizes="40px"
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                      ))}
                      {cartItems.length > 3 && (
                        <div className={styles.thumbMore}>
                          +{cartItems.length - 3}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className={styles.cartCount}>
                        {cartItems.length} article
                        {cartItems.length > 1 ? "s" : ""}
                      </p>
                      <p className={styles.cartTotal}>
                        {formatAr(order.total_ar)}
                      </p>
                    </div>
                  </div>

                  {/* Client */}
                  <div className={styles.clientInfo}>
                    <p className={styles.clientName}>{order.client_name}</p>
                    <p className={styles.clientContact}>{order.client_email}</p>
                    <p className={styles.clientContact}>
                      📱 {order.client_whatsapp}
                    </p>
                  </div>

                  {/* Paiement + date */}
                  <div className={styles.metaCol}>
                    <span
                      className={styles.payBadge}
                      style={{ background: pm.bg, color: pm.color }}
                    >
                      {pm.icon} {pm.label}
                    </span>
                    <p className={styles.dateText}>
                      {formatDate(order.created_at)}
                    </p>
                    <p className={styles.orderId}>#{order.id}</p>
                  </div>

                  {/* Statut */}
                  <div className={styles.statusCol}>
                    <div
                      className={styles.statusBadge}
                      style={{ background: st.bg, color: st.color }}
                    >
                      <span
                        className={styles.statusDot}
                        style={{ background: st.dot }}
                      />
                      {order.status}
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      style={{
                        color: "#bbb",
                        transition: "transform 0.2s",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* ── CARD BODY (expanded) ─────────────────────────────────── */}
                {isExpanded && (
                  <div className={styles.cardBody}>
                    <div className={styles.bodyGrid}>
                      {/* Articles du panier */}
                      <div className={styles.bodySection}>
                        <p className={styles.bodySectionTitle}>
                          🛒 Articles commandés
                        </p>
                        <div className={styles.itemsList}>
                          {cartItems.map((item, i) => (
                            <div key={i} className={styles.itemRow}>
                              <div className={styles.itemImg}>
                                <Image
                                  src={
                                    item.image || "/images/logo/art_jatie.png"
                                  }
                                  alt={item.name}
                                  fill
                                  sizes="36px"
                                  style={{ objectFit: "cover" }}
                                />
                              </div>
                              <span className={styles.itemName}>
                                {item.name}
                              </span>
                              <span className={styles.itemQty}>
                                ×{item.quantity}
                              </span>
                              <span className={styles.itemPrice}>
                                {formatAr(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                          {/* Récapitulatif */}
                          <div className={styles.orderSummary}>
                            {order.delivery_label && (
                              <div className={styles.summaryRow}>
                                <span>Livraison ({order.delivery_label})</span>
                                <span>{formatAr(order.delivery_cost)}</span>
                              </div>
                            )}
                            {(order.discount_ar ?? 0) > 0 && (
                              <div
                                className={styles.summaryRow}
                                style={{ color: "#15803d" }}
                              >
                                <span>Réduction</span>
                                <span>−{formatAr(order.discount_ar)}</span>
                              </div>
                            )}
                            <div className={styles.summaryTotal}>
                              <span>Total</span>
                              <span>{formatAr(order.total_ar)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Infos paiement */}
                      <div className={styles.bodySection}>
                        <p className={styles.bodySectionTitle}>
                          💳 Infos paiement
                        </p>
                        <div className={styles.paymentDetails}>
                          <div
                            className={styles.paymentMethodBadge}
                            style={{ background: pm.bg, color: pm.color }}
                          >
                            <span style={{ fontSize: "1.2rem" }}>
                              {pm.icon}
                            </span>
                            <span className={styles.paymentMethodLabel}>
                              {pm.label}
                            </span>
                          </div>

                          {/* MVola */}
                          {order.payment_method === "mvola" && (
                            <div className={styles.payInfoGrid}>
                              <div className={styles.payInfoItem}>
                                <span className={styles.payInfoLabel}>
                                  Nom du compte
                                </span>
                                <span className={styles.payInfoValue}>
                                  {order.mvola_account_name || "—"}
                                </span>
                              </div>
                              <div className={styles.payInfoItem}>
                                <span className={styles.payInfoLabel}>
                                  Numéro MVola
                                </span>
                                <span className={styles.payInfoValue}>
                                  {order.mvola_phone || "—"}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Orange Money */}
                          {order.payment_method === "orange_money" && (
                            <div className={styles.payInfoGrid}>
                              <div className={styles.payInfoItem}>
                                <span className={styles.payInfoLabel}>
                                  Nom du compte
                                </span>
                                <span className={styles.payInfoValue}>
                                  {order.om_account_name || "—"}
                                </span>
                              </div>
                              <div className={styles.payInfoItem}>
                                <span className={styles.payInfoLabel}>
                                  Numéro Orange Money
                                </span>
                                <span className={styles.payInfoValue}>
                                  {order.om_phone || "—"}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* WhatsApp */}
                          {order.payment_method === "whatsapp" && (
                            <p className={styles.whatsappNote}>
                              Le client paiera sur place ou après confirmation
                              par WhatsApp.
                            </p>
                          )}

                          {/* Preuve de paiement */}
                          {(order.payment_proof_text ||
                            order.payment_proof_image) && (
                            <div className={styles.proofBox}>
                              <p className={styles.payInfoLabel}>
                                🧾 Preuve de paiement
                              </p>
                              {order.payment_proof_text && (
                                <p className={styles.proofRef}>
                                  Réf : {order.payment_proof_text}
                                </p>
                              )}
                              {order.payment_proof_image && (
                                <button
                                  className={styles.proofImgBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProofModal(order.payment_proof_image!);
                                  }}
                                >
                                  <Image
                                    src={order.payment_proof_image}
                                    alt="Preuve"
                                    width={80}
                                    height={80}
                                    style={{
                                      objectFit: "cover",
                                      borderRadius: "6px",
                                    }}
                                  />
                                  <span>Voir en grand</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Message client */}
                        {order.client_message && (
                          <div style={{ marginTop: "12px" }}>
                            <p className={styles.bodySectionTitle}>
                              💬 Message du client
                            </p>
                            <p className={styles.messageText}>
                              {order.client_message}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Changer le statut */}
                      <div
                        className={styles.bodySection}
                        style={{ gridColumn: "1 / -1" }}
                      >
                        <p className={styles.bodySectionTitle}>
                          ⚡ Modifier le statut
                        </p>
                        <div className={styles.statusBtns}>
                          {STATUS_OPTIONS.map((s) => {
                            const ss = STATUS_STYLE[s];
                            const isActive = order.status === s;
                            const isValidate = s === "Confirmée";
                            return (
                              <button
                                key={s}
                                onClick={() => updateStatus(order.id, s)}
                                disabled={isActive || isConfirming}
                                className={`${styles.statusBtn} ${isActive ? styles.statusBtnActive : ""} ${isValidate && !isActive ? styles.statusBtnValidate : ""}`}
                                style={
                                  isActive
                                    ? {
                                        background: ss.bg,
                                        color: ss.color,
                                        borderColor: ss.dot,
                                      }
                                    : {}
                                }
                              >
                                {isConfirming && s === "Confirmée" ? (
                                  <span className={styles.btnSpinner} />
                                ) : (
                                  <span
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      background: ss.dot,
                                      display: "inline-block",
                                      marginRight: 6,
                                    }}
                                  />
                                )}
                                {s}
                                {isValidate && !isActive && (
                                  <span className={styles.validateNote}>
                                    → déduit stock
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* ── Actions ─────────────────────────────────────────── */}
                    <div className={styles.cardActions}>
                      <a
                        href={`https://wa.me/${order.client_whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.btnWhatsapp}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.138.566 4.14 1.548 5.864L.057 23.926l6.204-1.628A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.002-1.364l-.36-.214-3.682.966.982-3.59-.234-.371A9.818 9.818 0 0 1 2.182 12c0-5.422 4.396-9.818 9.818-9.818s9.818 4.396 9.818 9.818-4.396 9.818-9.818 9.818z" />
                        </svg>
                        Contacter sur WhatsApp
                      </a>
                      <a
                        href={`mailto:${order.client_email}`}
                        className={styles.btnEmail}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        Envoyer un email
                      </a>
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className={styles.btnDelete}
                        disabled={isDeleting}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                        {isDeleting ? "Suppression…" : "Supprimer"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL PREUVE ──────────────────────────────────────────────────── */}
      {proofModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setProofModal(null)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalClose}
              onClick={() => setProofModal(null)}
            >
              ✕
            </button>
            <Image
              src={proofModal}
              alt="Preuve de paiement"
              width={600}
              height={600}
              style={{ objectFit: "contain", maxHeight: "80vh", width: "auto" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
