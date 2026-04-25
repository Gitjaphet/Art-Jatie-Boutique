"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import styles from "./OrdersTab.module.css";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Order = {
  id: number;
  client_name: string;
  client_email: string;
  client_whatsapp: string;
  client_message?: string;
  product_id: number;
  product_name: string;
  product_image: string;
  product_price_ar: number;
  selected_size: string;
  selected_color: string;
  status: string;
  created_at: string;
  cart_items_json?: string; //
};

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

function formatAr(p: number) {
  return new Intl.NumberFormat("fr-FR").format(p) + " Ar";
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

type Props = { toast: (msg: string, type?: string) => void };

export default function OrdersTab({ toast }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API}/orders/`);
      if (!res.ok) throw new Error();
      const all = await res.json();
      setOrders(all.filter((o: Order) => !o.cart_items_json)); // ✅ sur mesure seulement
    } catch {
      toast("Impossible de charger les commandes.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(
        `${API}/orders/${id}/status?status=${encodeURIComponent(status)}`,
        {
          method: "PATCH",
        },
      );
      if (!res.ok) throw new Error();
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o)),
      );
      toast(`Statut mis à jour : ${status}`);
    } catch {
      toast("Erreur lors de la mise à jour.", "error");
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

  const filtered = orders.filter((o) => {
    const matchStatus = filter === "Tous" || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.client_name.toLowerCase().includes(q) ||
      o.product_name.toLowerCase().includes(q) ||
      o.client_email.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = STATUS_OPTIONS.reduce(
    (acc, s) => {
      acc[s] = orders.filter((o) => o.status === s).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (loading)
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p>Chargement des commandes…</p>
      </div>
    );

  return (
    <div className={styles.wrap}>
      {/* STATS HEADER */}
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
      </div>

      {/* FILTRES + SEARCH */}
      <div className={styles.toolbar}>
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
            placeholder="Rechercher client, produit…"
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* LISTE */}
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <p>Aucune commande trouvée</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((order) => {
            const st = STATUS_STYLE[order.status] || STATUS_STYLE["En attente"];
            const isExpanded = expandedId === order.id;

            return (
              <div
                key={order.id}
                className={`${styles.card} ${deleting === order.id ? styles.cardRemoving : ""}`}
              >
                {/* CARD HEADER */}
                <div
                  className={styles.cardHeader}
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  {/* Produit */}
                  <div className={styles.productInfo}>
                    <div className={styles.imgWrap}>
                      <Image
                        src={
                          order.product_image || "/images/logo/art_jatie.png"
                        }
                        alt={order.product_name}
                        fill
                        sizes="60px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div>
                      <p className={styles.productName}>{order.product_name}</p>
                      <p className={styles.productPrice}>
                        {formatAr(order.product_price_ar)}
                      </p>
                      <div className={styles.choices}>
                        <span className={styles.chip}>
                          {order.selected_size}
                        </span>
                        <span
                          className={styles.colorChip}
                          style={{
                            background:
                              COLORS_MAP[order.selected_color] ?? "#ccc",
                          }}
                          title={order.selected_color}
                        />
                        <span className={styles.chipLabel}>
                          {order.selected_color}
                        </span>
                      </div>
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

                  {/* Date */}
                  <div className={styles.dateCol}>
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

                {/* CARD EXPANDED */}
                {isExpanded && (
                  <div className={styles.cardBody}>
                    <div className={styles.bodyGrid}>
                      {/* Changer statut */}
                      <div className={styles.bodySection}>
                        <p className={styles.bodySectionTitle}>
                          Modifier le statut
                        </p>
                        <div className={styles.statusBtns}>
                          {STATUS_OPTIONS.map((s) => {
                            const ss = STATUS_STYLE[s];
                            return (
                              <button
                                key={s}
                                onClick={() => updateStatus(order.id, s)}
                                className={`${styles.statusBtn} ${order.status === s ? styles.statusBtnActive : ""}`}
                                style={
                                  order.status === s
                                    ? {
                                        background: ss.bg,
                                        color: ss.color,
                                        borderColor: ss.dot,
                                      }
                                    : {}
                                }
                              >
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
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Message client */}
                      <div className={styles.bodySection}>
                        <p className={styles.bodySectionTitle}>
                          Message du client
                        </p>
                        <p className={styles.messageText}>
                          {order.client_message || (
                            <span
                              style={{ color: "#bbb", fontStyle: "italic" }}
                            >
                              Aucun message
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
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
                        disabled={deleting === order.id}
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
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
