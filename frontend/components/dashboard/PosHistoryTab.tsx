"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
// On réutilise intelligemment votre CSS existant !
import styles from "./CartOrdersTab.module.css"; 

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type CartItem = { id: number; name: string; price: number; quantity: number; image: string; };

type PosOrder = {
  id: number;
  client_name: string;
  client_whatsapp: string;
  cart_items_json?: string;
  total_ar?: number;
  payment_method: string;
  amount_tendered?: number;
  change_ar?: number;
  status: string;
  created_at: string;
  is_pos: boolean;
};

function formatAr(n?: number) { return !n ? "—" : new Intl.NumberFormat("fr-FR").format(n) + " Ar"; }
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function parseCart(json?: string): CartItem[] {
  if (!json) return []; try { return JSON.parse(json); } catch { return []; }
}

export default function PosHistoryTab({ toast }: { toast: (msg: string, type?: string) => void }) {
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API}/orders/`);
      if (!res.ok) throw new Error();
      const all: PosOrder[] = await res.json();
      // On ne garde QUE les ventes de la caisse (POS)
      setOrders(all.filter((o) => o.is_pos));
    } catch {
      toast("Impossible de charger l'historique.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const totalRevenue = orders.reduce((s, o) => s + (o.total_ar || 0), 0);

  if (loading) return <div className={styles.loadingWrap}><div className={styles.spinner} /><p>Chargement de l'historique…</p></div>;

  return (
    <div className={styles.wrap}>
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{orders.length}</span>
          <span className={styles.statLabel}>Ventes Boutique</span>
        </div>
        <div className={styles.statCard} style={{ borderColor: "rgba(34,197,94,0.3)" }}>
          <span className={styles.statNum} style={{ color: "#15803d", fontSize: "1.1rem" }}>{formatAr(totalRevenue)}</span>
          <span className={styles.statLabel}>Chiffre d'Affaires Caisse</span>
        </div>
      </div>

      <div className={styles.list} style={{ marginTop: "20px" }}>
        {orders.map((order) => {
          const isExpanded = expandedId === order.id;
          const cartItems = parseCart(order.cart_items_json);

          return (
            <div key={order.id} className={styles.card}>
              <div className={styles.cardHeader} onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                <div className={styles.cartSummary}>
                  <div className={styles.cartThumbs}>
                    {cartItems.slice(0, 2).map((item, i) => (
                      <div key={i} className={styles.thumb} style={{ zIndex: 2 - i }}>
                        <Image src={item.image || "/images/logo/art_jatie.png"} alt={item.name} fill sizes="40px" style={{ objectFit: "cover" }} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className={styles.cartCount}>{cartItems.length} article(s)</p>
                    <p className={styles.cartTotal} style={{ color: "#be185d" }}>{formatAr(order.total_ar)}</p>
                  </div>
                </div>

                <div className={styles.clientInfo}>
                  <p className={styles.clientName}>{order.client_name}</p>
                  <p className={styles.clientContact}>📱 {order.client_whatsapp}</p>
                </div>

                <div className={styles.metaCol}>
                  <span className={styles.payBadge} style={{ background: "#f3f4f6", color: "#374151" }}>
                    💳 {order.payment_method}
                  </span>
                  <p className={styles.dateText}>{formatDate(order.created_at)}</p>
                  <p className={styles.orderId}>TKT-2026-{String(order.id).padStart(4, "0")}</p>
                </div>

                <div className={styles.statusCol}>
                  <div className={styles.statusBadge} style={{ background: "#fdf4ff", color: "#7e22ce" }}>
                    <span className={styles.statusDot} style={{ background: "#a855f7" }} /> Vendue sur place
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className={styles.cardBody}>
                  <div className={styles.bodyGrid}>
                    <div className={styles.bodySection}>
                      <p className={styles.bodySectionTitle}>🛒 Détail du ticket</p>
                      <div className={styles.itemsList}>
                        {cartItems.map((item, i) => (
                          <div key={i} className={styles.itemRow}>
                            <span className={styles.itemName}>{item.name}</span>
                            <span className={styles.itemQty}>×{item.quantity}</span>
                            <span className={styles.itemPrice}>{formatAr(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={styles.bodySection}>
                      <p className={styles.bodySectionTitle}>💰 Paiement</p>
                      <p style={{ fontSize: "13px", marginTop: "8px" }}>
                        Donné : <strong>{formatAr(order.amount_tendered)}</strong><br/>
                        Rendu : <strong style={{ color: "#16a34a" }}>{formatAr(order.change_ar)}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}