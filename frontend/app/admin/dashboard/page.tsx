"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./AdminDashboard.module.css";
import Image from "next/image";
import Link from "next/link";
import OverviewTab from "../../../components/dashboard/OverviewTab";
import ProductsTab from "../../../components/dashboard/ProductsTab";
import SettingsTab from "../../../components/dashboard/SettingsTab";
import PlanningTab from "../../../components/dashboard/PlanningTab";
import PosTab from "../../../components/dashboard/PosTab";
import UsersTab from "../../../components/dashboard/UsersTab";
import OrdersTab from "@/components/dashboard/OrdersTab";
import CartOrdersTab from "@/components/dashboard/CartOrdersTab";
import ClientsTab from "../../../components/dashboard/ClientsTab";
import PosHistoryTab from "../../../components/dashboard/PosHistoryTab";
import ReviewsTab from "../../../components/dashboard/ReviewsTab";

type SettingsData = {
  exchange_rate_eur?: string | number;
  available_colors?: string;
  available_sizes?: string;
  available_categories?: string;
};

const I = {
  Grid: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Bag: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Gear: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Out: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Menu: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Monitor: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  Users: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  ClipboardList: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  ),
  Calendar: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  ShoppingCart: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  ContactBook: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <circle cx="12" cy="8" r="2" />
      <path d="M15 13a3 3 0 1 0-6 0" />
    </svg>
  ),Receipt: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 17V7" />
    </svg>
  ),
  Star: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),

};

type ToastProps = { message: string; type: string; onDone: () => void };

function Toast({ message, type, onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 3400);
    return () => clearTimeout(t);
  }, [onDone]);
  const ok = type !== "error";
  return (
    <div
      className={styles.toast}
      style={{
        background: ok ? "var(--green-dim)" : "var(--red-dim)",
        border: `1px solid ${ok ? "rgba(5,150,105,0.25)" : "rgba(220,38,38,0.25)"}`,
        color: ok ? "var(--green)" : "var(--red)",
      }}
    >
      <span style={{ fontSize: "15px", marginRight: "8px" }}>
        {ok ? "✓" : "✗"}
      </span>
      {message}
    </div>
  );
}

type ToastItem = { id: number; message: string; type: string };

function useToast() {
  const [toasts, set] = useState<ToastItem[]>([]);
  const add = useCallback((msg: string, type = "success") => {
    const id = Date.now();
    set((p) => [...p, { id, message: msg, type }]);
  }, []);
  const rem = useCallback(
    (id: number) => set((p) => p.filter((t) => t.id !== id)),
    [],
  );
  return { toasts, add, rem };
}

type Tab =
  | "overview"
  | "products"
  | "pos"
  | "planning"
  | "orders"
  | "cart_orders"
  | "pos_history"
  | "clients"
  | "reviews"
  | "users"
  | "settings";

const TABS: {
  id: Tab;
  label: string;
  shortLabel: string;
  Icon: React.ElementType;
}[] = [
  {
    id: "overview",
    label: "Vue d'ensemble",
    shortLabel: "Accueil",
    Icon: I.Grid,
  },
  { id: "pos", label: "Point de vente", shortLabel: "Caisse", Icon: I.Monitor },
  { id: "pos_history", label: "Historique Caisse", shortLabel: "Ventes", Icon: I.Receipt },
  { id: "products", label: "Catalogue", shortLabel: "Produits", Icon: I.Bag },
  {
    id: "planning",
    label: "Planning",
    shortLabel: "Planning",
    Icon: I.Calendar,
  },
  { id: "clients", label: "Base Clients", shortLabel: "Clients", Icon: I.ContactBook },
  { id: "reviews", label: "Avis clients", shortLabel: "Avis", Icon: I.Star },
  { id: "users", label: "Utilisateurs", shortLabel: "Users", Icon: I.Users },
  {
    id: "orders",
    label: "Sur commande",
    shortLabel: "Commandes",
    Icon: I.ClipboardList,
  },
  {
    id: "cart_orders",
    label: "Commandes panier",
    shortLabel: "Panier",
    Icon: I.ShoppingCart,
  },
  { id: "settings", label: "Réglages", shortLabel: "Réglages", Icon: I.Gear },
];

const TITLES: Record<Tab, string> = {
  overview: "Vue d'ensemble",
  pos: "Caisse (Point de vente)",
  pos_history: "Historique des ventes Boutique",
  products: "Gestion du catalogue",
  planning: "Planning des commandes",
  clients: "CRM - Base Clients",
  reviews: "Modération des avis clients",
  users: "Gestion des utilisateurs",
  orders: "Commandes sur mesure",
  cart_orders: "Commandes panier",
  settings: "Paramètres",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const { toasts, add: toast, rem } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState<SettingsData | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin");
    } else {
      fetchSettings();
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API}/settings/`);
      if (!res.ok) throw new Error();
      setSettings(await res.json());
    } catch {
      toast("Impossible de joindre le serveur Backend.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API}/products/`);
      if (!res.ok) throw new Error();
      setProducts(await res.json());
    } catch {
      toast("Backend déconnecté. Vérifiez votre terminal.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin");
  };

  const animateContent = (cb: () => void) => {
    if (contentRef.current) {
      contentRef.current.style.opacity = "0";
      contentRef.current.style.transform = "translateY(8px)";
    }
    setTimeout(() => {
      cb();
      if (contentRef.current) {
        contentRef.current.style.transition = "none";
        contentRef.current.style.opacity = "0";
        contentRef.current.style.transform = "translateY(8px)";
        requestAnimationFrame(() => {
          if (contentRef.current) {
            contentRef.current.style.transition =
              "opacity .35s var(--ease), transform .35s var(--ease)";
            contentRef.current.style.opacity = "1";
            contentRef.current.style.transform = "translateY(0)";
          }
        });
      }
    }, 120);
  };

  const switchTab = (t: Tab) => {
    if (t === activeTab) return;
    // ✅ Rechargement silencieux des données à chaque changement d'onglet
    fetchProducts();
    animateContent(() => setActiveTab(t));
  };

  if (loading)
    return (
      <div className={styles.loader}>
        <Image
          src="/images/logo/art_jatie.png"
          alt="Art Jatie"
          width={180}
          height={180}
          style={{ animation: "fadeIn 0.5s ease", objectFit: "contain" }}
          priority
        />
        <div className={styles.spinner} />
      </div>
    );

  const dateStr = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className={styles.layout}>
      {/* ── SIDEBAR ── */}
      <aside
        className={styles.sidebar}
        style={{ width: collapsed ? "66px" : "260px" }}
      >
        {/* Header */}
        <div
          className={styles.sidebarHeader}
          style={{
            padding: collapsed ? "22px 14px" : "26px 22px",
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          {!collapsed && (
            <div
              style={{
                animation: "fadeIn .3s ease",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.logo}
              >
                <Image
                  src="/images/logo/art_jatie.png"
                  alt="Art Jatie"
                  width={130}
                  height={45}
                  style={{
                    objectFit: "contain",
                    objectPosition: "left",
                    display: "block",
                  }}
                  priority
                />
              </Link>
              <div className={styles.sidebarSubtitle}>Administration</div>
            </div>
          )}
          {/* Bouton menu caché sur mobile (inutile avec bottom nav) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`${styles.menuBtn} ${styles.menuBtnDesktop}`}
          >
            <I.Menu />
          </button>
        </div>

        {/* Nav */}
        <nav
          className={styles.nav}
          style={{ padding: collapsed ? "14px 8px" : "18px 10px" }}
        >
          {TABS.map(({ id, label, shortLabel, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => switchTab(id)}
                title={collapsed ? label : undefined}
                className={`${styles.navItem} ${active ? styles.navItemActive : styles.navItemInactive}`}
                style={{
                  padding: collapsed ? "10px 0" : "10px 13px",
                  justifyContent: collapsed ? "center" : "flex-start",
                }}
              >
                <span
                  className={styles.navIcon}
                  style={{ opacity: active ? 1 : 0.65 }}
                >
                  <Icon />
                </span>
                {/* Label desktop */}
                {!collapsed && <span className={styles.navLabel}>{label}</span>}
                {/* Short label mobile (géré par CSS) */}
                <span className={styles.navShortLabel}>{shortLabel}</span>
                {/* Dot actif desktop */}
                {!collapsed && active && <div className={styles.activeDot} />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div
          style={{
            padding: collapsed ? "14px 8px" : "14px 10px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            onClick={handleLogout}
            title={collapsed ? "Déconnexion" : undefined}
            className={styles.logoutBtn}
            style={{
              padding: collapsed ? "10px 0" : "10px 13px",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            <I.Out />
            <span className={styles.logoutLabel}>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ── MAINS ── */}
      <main className={styles.main}>
        <header className={styles.topbar}>
          <h1 className={styles.pageTitle}>{TITLES[activeTab]}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                fontWeight: 500,
                textTransform: "capitalize",
              }}
            >
              {dateStr}
            </div>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "var(--rose-dim)",
                border: "1.5px solid rgba(190,24,93,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display)",
                fontSize: "1.1rem",
                color: "var(--rose)",
                fontWeight: "600",
              }}
            >
              A
            </div>
          </div>
        </header>

        <div ref={contentRef} className={styles.content}>
          {activeTab === "overview" && <OverviewTab products={products} settings={settings} />}
          {activeTab === "pos" && <PosTab products={products} settings={settings} toast={toast} />}
          {activeTab === "pos_history" && <PosHistoryTab toast={toast} />}
          {activeTab === "products" && (
            <ProductsTab
              products={products}
              refresh={fetchProducts}
              toast={toast}
              settings={settings}
            />
          )}
          {activeTab === "planning" && <PlanningTab products={products} />}
          {activeTab === "users" && <UsersTab toast={toast} />}
          {activeTab === "orders" && <OrdersTab toast={toast} />}
          {activeTab === "cart_orders" && <CartOrdersTab toast={toast} />}
          {activeTab === "clients" && <ClientsTab toast={toast} />}
          {activeTab === "reviews" && <ReviewsTab toast={toast} products={products} />}
                    {activeTab === "settings" && (
            <SettingsTab
              initialSettings={settings}
              refreshSettings={fetchSettings}
              toast={toast}
            />
          )}
        </div>
      </main>

      {/* ── TOASTS ── */}
      <div
        style={{
          position: "fixed",
          bottom: "22px",
          right: "22px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          zIndex: 9999,
        }}
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onDone={() => rem(t.id)}
          />
        ))}
      </div>
    </div>
  );
}
