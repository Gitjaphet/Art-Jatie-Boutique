"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag,
  Package,
  Baby,
  Shirt,
  Footprints,
  ClipboardList,
  Zap,
  CheckCircle2,
  DollarSign,
  Search,
  Calendar,
  BarChart3,
  Plus,
  Phone,
  StickyNote,
  ChevronLeft,
  ChevronRight,
  Truck,
  RefreshCw,
  AlertCircle,
  X,
  Save,
  User,
  CreditCard,
  Tag,
  Scissors,
} from "lucide-react";
import styles from "./PlanningTab.module.css";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types ──────────────────────────────────────────────────────────────
type Priority = "Urgente" | "Haute" | "Normale" | "Basse";
type PlanningStatus = "a_fabriquer" | "en_cours" | "pret_a_livrer";

interface ApiOrder {
  id: number;
  client_name: string;
  client_whatsapp: string;
  client_email: string;
  client_message?: string;
  product_name?: string;
  product_price_ar?: number;
  cart_items_json?: string;
  total_ar?: number;
  subtotal_ar?: number;
  selected_size?: string;
  selected_color?: string;
  status: string;
  planning_status: PlanningStatus | null;
  planning_note?: string | null;
  created_at: string;
  acompte?: number;
  progress?: number;
}

interface PlanningOrder {
  id: number;
  ref: string;
  name: string;
  categorie: string;
  client: {
    name: string;
    phone: string;
    email: string;
    initials: string;
    color: string;
  };
  priority: Priority;
  status: PlanningStatus;
  prixTotal: number;
  taille?: string;
  note?: string;
  dateCommande: string;
  dateLivraison: string;
  planning_note?: string;
  acompte: number;
  progress: number;
}

interface NewOrderForm {
  client_name: string;
  client_whatsapp: string;
  client_email: string;
  product_name: string;
  total_ar: number;
  selected_size: string;
  selected_color: string;
  planning_status: PlanningStatus;
  acompte: number;
  client_message: string;
}

type PlanningTabProps = { products: Record<string, unknown>[] };

const CLIENT_COLORS = [
  "#e91e8c",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#6366f1",
  "#dc2626",
  "#14b8a6",
  "#0ea5e9",
];

function getClientColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return CLIENT_COLORS[Math.abs(h) % CLIENT_COLORS.length];
}
function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
function inferPriority(o: ApiOrder): Priority {
  const d = Math.floor(
    (Date.now() - new Date(o.created_at).getTime()) / 86400000,
  );
  if (d >= 7) return "Urgente";
  if (d >= 4) return "Haute";
  if (d >= 2) return "Normale";
  return "Basse";
}
function mapApiOrder(o: ApiOrder): PlanningOrder {
  let name = o.product_name || "Commande";
  let categorie = "TENUES";
  if (o.cart_items_json) {
    try {
      const items = JSON.parse(o.cart_items_json);
      if (items.length > 0) {
        name =
          items.length === 1
            ? items[0].name
            : `${items[0].name} +${items.length - 1}`;
        categorie = items[0].category || categorie;
      }
    } catch {
      /**/
    }
  }
  const total = o.total_ar ?? o.subtotal_ar ?? o.product_price_ar ?? 0;
  const delivery = new Date(o.created_at);
  delivery.setDate(delivery.getDate() + 7);
  return {
    id: o.id,
    ref: `CMD-${String(o.id).padStart(4, "0")}`,
    name,
    categorie,
    client: {
      name: o.client_name,
      phone: o.client_whatsapp,
      email: o.client_email || "",
      initials: getInitials(o.client_name),
      color: getClientColor(o.client_name),
    },
    priority: inferPriority(o),
    status: o.planning_status as PlanningStatus,
    prixTotal: total,
    taille: o.selected_size || undefined,
    note: o.planning_note || o.client_message || undefined,
    dateCommande: o.created_at.split("T")[0],
    dateLivraison: delivery.toISOString().split("T")[0],
    planning_note: o.planning_note || undefined,
    acompte: o.acompte || 0,
    progress: o.progress || 0,
  };
}

const COLUMNS: {
  id: PlanningStatus;
  title: string;
  icon: React.ElementType;
  accent: string;
  bg: string;
  border: string;
}[] = [
  {
    id: "a_fabriquer",
    title: "À Fabriquer",
    icon: ClipboardList,
    accent: "#e91e8c",
    bg: "#fff5fb",
    border: "#fad4ed",
  },
  {
    id: "en_cours",
    title: "En cours",
    icon: Zap,
    accent: "#3b82f6",
    bg: "#f0f7ff",
    border: "#bfdbfe",
  },
  {
    id: "pret_a_livrer",
    title: "Prêt à livrer",
    icon: CheckCircle2,
    accent: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
  },
];
const STATUS_ORDER: PlanningStatus[] = [
  "a_fabriquer",
  "en_cours",
  "pret_a_livrer",
];
const PROGRESS_STEPS = [20, 50, 80, 99];

function daysLeft(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}
function priorityColor(p: Priority) {
  return {
    Urgente: "#ef4444",
    Haute: "#f97316",
    Normale: "#3b82f6",
    Basse: "#6b7280",
  }[p];
}

// ── Modal base (sans backdrop-filter) ─────────────────────────────────
function Modal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(15,15,15,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          width: "100%",
          maxWidth: 520,
          boxShadow: "0 30px 80px rgba(0,0,0,0.22)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        padding: "18px 22px 14px",
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <h3
        style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}
      >
        {title}
      </h3>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#aaa",
          padding: 4,
          borderRadius: 6,
          display: "flex",
        }}
      >
        <X size={19} />
      </button>
    </div>
  );
}

// ── NoteModal — Acompte + Note ─────────────────────────────────────────
function NoteModal({
  order,
  onSave,
  onClose,
}: {
  order: PlanningOrder;
  onSave: (id: number, note: string, acompte: number) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState(order.planning_note || "");
  const [acompte, setAcompte] = useState(order.acompte || 0);
  const solde = order.prixTotal - acompte;
  const pct =
    order.prixTotal > 0 ? Math.round((acompte / order.prixTotal) * 100) : 0;

  const inp: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 9,
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader title={`${order.ref} — ${order.name}`} onClose={onClose} />
      <div style={{ padding: "18px 22px" }}>
        {/* Recap client */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: "9px 13px",
            background: "#fafafa",
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: order.client.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            {order.client.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>
              {order.client.name}
            </div>
            <div style={{ fontSize: 11, color: "#888" }}>
              {order.client.phone}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 10,
                color: "#aaa",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Total
            </div>
            <div style={{ fontWeight: 700, color: "#e91e8c", fontSize: 14 }}>
              {order.prixTotal.toLocaleString()} Ar
            </div>
          </div>
        </div>

        {/* Acompte */}
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginBottom: 6,
            }}
          >
            <CreditCard size={13} color="#e91e8c" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#374151",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Acompte reçu (Ar)
            </span>
          </div>
          <input
            type="number"
            style={inp}
            value={acompte || ""}
            min={0}
            max={order.prixTotal}
            onChange={(e) => setAcompte(Number(e.target.value))}
            placeholder="0"
          />
          {/* Mini barre acompte */}
          <div
            style={{
              marginTop: 7,
              background: "#f3f4f6",
              borderRadius: 99,
              height: 5,
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 99,
                background: "#e91e8c",
                width: `${Math.min(pct, 100)}%`,
                transition: "width 0.3s",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: 11, color: "#888" }}>
              Solde :{" "}
              <strong style={{ color: solde > 0 ? "#ef4444" : "#16a34a" }}>
                {solde.toLocaleString()} Ar
              </strong>
            </span>
            <span style={{ fontSize: 11, color: "#aaa" }}>{pct}% payé</span>
          </div>
        </div>

        {/* Note */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginBottom: 6,
            }}
          >
            <StickyNote size={13} color="#e91e8c" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#374151",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Note de production
            </span>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}
            placeholder="Ex: Couleur caramel uniquement, anse plus longue…"
          />
        </div>

        <div style={{ display: "flex", gap: 9 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px",
              border: "1.5px solid #e5e7eb",
              borderRadius: 9,
              background: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              color: "#666",
            }}
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onSave(order.id, note, acompte);
              onClose();
            }}
            style={{
              flex: 2,
              padding: "11px",
              border: "none",
              borderRadius: 9,
              background: "#e91e8c",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Save size={13} /> Enregistrer
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── NewOrderModal ──────────────────────────────────────────────────────
function NewOrderModal({
  onSave,
  onClose,
}: {
  onSave: (f: NewOrderForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<NewOrderForm>({
    client_name: "",
    client_whatsapp: "",
    client_email: "",
    product_name: "",
    total_ar: 0,
    selected_size: "",
    selected_color: "",
    planning_status: "a_fabriquer",
    acompte: 0,
    client_message: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof NewOrderForm, v: string | number) =>
    setForm((p) => ({ ...p, [k]: v }));
  const solde = form.total_ar - form.acompte;

  const inp: React.CSSProperties = {
    width: "100%",
    padding: "9px 11px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };
  const sec: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: 10,
    display: "flex",
    alignItems: "center",
    gap: 5,
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="✂️ Commande sur place" onClose={onClose} />
      <div
        style={{
          padding: "16px 22px 20px",
          maxHeight: "72vh",
          overflowY: "auto",
        }}
      >
        {/* Client */}
        <p style={{ ...sec, color: "#e91e8c" }}>
          <User size={11} /> Client
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 9,
            marginBottom: 9,
          }}
        >
          <label>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
              Nom *
            </div>
            <input
              style={inp}
              value={form.client_name}
              onChange={(e) => set("client_name", e.target.value)}
              placeholder="Marie Rakoto"
            />
          </label>
          <label>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
              WhatsApp *
            </div>
            <input
              style={inp}
              value={form.client_whatsapp}
              onChange={(e) => set("client_whatsapp", e.target.value)}
              placeholder="+261 34 00 111 22"
            />
          </label>
        </div>
        <label style={{ display: "block", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
            Email (optionnel)
          </div>
          <input
            type="email"
            style={inp}
            value={form.client_email}
            onChange={(e) => set("client_email", e.target.value)}
            placeholder="client@email.com"
          />
        </label>

        <div style={{ borderTop: "1px solid #f3f4f6", marginBottom: 12 }} />

        {/* Article */}
        <p style={{ ...sec, color: "#3b82f6" }}>
          <Tag size={11} /> Article
        </p>
        <label style={{ display: "block", marginBottom: 9 }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
            Nom de l&apos;article *
          </div>
          <input
            style={inp}
            value={form.product_name}
            onChange={(e) => set("product_name", e.target.value)}
            placeholder="Robe fleurie, Sac tressé…"
          />
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 9,
            marginBottom: 9,
          }}
        >
          <label>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
              <Scissors size={10} style={{ verticalAlign: "middle" }} /> Taille
            </div>
            <input
              style={inp}
              value={form.selected_size}
              onChange={(e) => set("selected_size", e.target.value)}
              placeholder="S, M, Sur mesure…"
            />
          </label>
          <label>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
              Couleur
            </div>
            <input
              style={inp}
              value={form.selected_color}
              onChange={(e) => set("selected_color", e.target.value)}
              placeholder="Rose, Beige…"
            />
          </label>
        </div>
        <label style={{ display: "block", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
            Instructions / Note
          </div>
          <textarea
            rows={2}
            style={{ ...inp, resize: "none" }}
            value={form.client_message}
            onChange={(e) => set("client_message", e.target.value)}
            placeholder="Ex: Livraison le 30 avril, anse longue…"
          />
        </label>

        <div style={{ borderTop: "1px solid #f3f4f6", marginBottom: 12 }} />

        {/* Paiement */}
        <p style={{ ...sec, color: "#16a34a" }}>
          <CreditCard size={11} /> Paiement
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 9,
            marginBottom: 9,
          }}
        >
          <label>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
              Prix total (Ar) *
            </div>
            <input
              type="number"
              style={inp}
              value={form.total_ar || ""}
              onChange={(e) => set("total_ar", Number(e.target.value))}
              placeholder="85000"
            />
          </label>
          <label>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
              Acompte reçu (Ar)
            </div>
            <input
              type="number"
              style={inp}
              value={form.acompte || ""}
              onChange={(e) => set("acompte", Number(e.target.value))}
              placeholder="0"
            />
          </label>
        </div>
        {form.total_ar > 0 && (
          <div
            style={{
              padding: "7px 11px",
              borderRadius: 8,
              background: solde > 0 ? "#fff5f5" : "#f0fdf4",
              fontSize: 12,
              fontWeight: 600,
              color: solde > 0 ? "#ef4444" : "#16a34a",
              marginBottom: 14,
            }}
          >
            {solde > 0
              ? `Solde restant : ${solde.toLocaleString()} Ar`
              : "✅ Entièrement soldée"}
          </div>
        )}

        {/* Colonne planning */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 7 }}>
            Placer dans
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            {COLUMNS.map((col) => (
              <button
                key={col.id}
                onClick={() => set("planning_status", col.id)}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  border: `2px solid ${form.planning_status === col.id ? col.accent : "#e5e7eb"}`,
                  borderRadius: 8,
                  background: form.planning_status === col.id ? col.bg : "#fff",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  color: form.planning_status === col.id ? col.accent : "#aaa",
                  transition: "all 0.15s",
                }}
              >
                {col.title}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 9 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              border: "1.5px solid #e5e7eb",
              borderRadius: 9,
              background: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              color: "#666",
            }}
          >
            Annuler
          </button>
          <button
            onClick={async () => {
              setSaving(true);
              await onSave(form);
              setSaving(false);
            }}
            disabled={saving}
            style={{
              flex: 2,
              padding: "12px",
              border: "none",
              borderRadius: 9,
              background: "#e91e8c",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: saving ? 0.75 : 1,
            }}
          >
            <Plus size={14} /> {saving ? "Création…" : "Créer la commande"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── StatCard ───────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  value,
  label,
  bg,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  bg: string;
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: bg }}>
        <Icon size={20} strokeWidth={2.5} color="#e91e8c" />
      </div>
      <div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

// ── OrderCard ──────────────────────────────────────────────────────────
function OrderCard({
  order,
  onMove,
  onDeliver,
  onOpenNote,
  onProgress,
}: {
  order: PlanningOrder;
  onMove: (id: number, dir: "prev" | "next") => void;
  onDeliver: (id: number) => void;
  onOpenNote: (o: PlanningOrder) => void;
  onProgress: (id: number, p: number) => void;
}) {
  const days = daysLeft(order.dateLivraison);
  const dlColor = days < 0 ? "#ef4444" : days <= 2 ? "#f97316" : "#16a34a";
  const pColor = priorityColor(order.priority);
  const solde = order.prixTotal - order.acompte;
  const CategoryIcon =
    (
      {
        TENUES: Shirt,
        ACCESSOIRES: Footprints,
        MAISON: Baby,
        Sac: ShoppingBag,
        Bonnet: Package,
        Vêtement: Shirt,
      } as Record<string, React.ElementType>
    )[order.categorie] || Package;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 13,
        marginBottom: 10,
        border: "1.5px solid #f0f0f0",
        borderLeft: `4px solid ${pColor}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        overflow: "hidden",
      }}
    >
      {/* Top */}
      <div
        style={{
          padding: "13px 13px 9px",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: "#fff5fb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CategoryIcon size={17} color="#e91e8c" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: "#1a1a1a",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {order.name}
          </div>
          <div style={{ fontSize: 10.5, color: "#bbb", marginTop: 1 }}>
            {order.ref}
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 20,
            background: `${pColor}15`,
            color: pColor,
            flexShrink: 0,
          }}
        >
          {order.priority}
        </span>
      </div>

      {/* Client */}
      <div
        style={{
          padding: "0 13px 9px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: order.client.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 10,
            flexShrink: 0,
          }}
        >
          {order.client.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#333",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {order.client.name}
          </div>
          <div style={{ fontSize: 11, color: "#aaa" }}>
            {order.client.phone}
          </div>
        </div>
        <a
          href={`https://wa.me/${order.client.phone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#aaa", display: "flex", padding: 3 }}
        >
          <Phone size={12} />
        </a>
      </div>

      {/* Infos financières */}
      <div
        style={{
          margin: "0 13px 9px",
          padding: "8px 11px",
          background: "#fafafa",
          borderRadius: 9,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9.5,
              color: "#aaa",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Prix total
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#1a1a1a",
              marginTop: 2,
            }}
          >
            {order.prixTotal.toLocaleString()} Ar
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 9.5,
              color: "#aaa",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Solde dû
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: solde > 0 ? "#e91e8c" : "#16a34a",
              marginTop: 2,
            }}
          >
            {solde > 0 ? `${solde.toLocaleString()} Ar` : "✓ Soldé"}
          </div>
        </div>
        {order.acompte > 0 && (
          <div
            style={{
              gridColumn: "span 2",
              borderTop: "1px solid #f0f0f0",
              paddingTop: 5,
              marginTop: 2,
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                color: "#aaa",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Acompte reçu
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#16a34a",
                fontWeight: 700,
                marginTop: 1,
              }}
            >
              +{order.acompte.toLocaleString()} Ar
            </div>
          </div>
        )}
        <div
          style={{
            gridColumn: "span 2",
            borderTop: "1px solid #f0f0f0",
            paddingTop: 5,
            marginTop: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {order.taille && (
            <div style={{ fontSize: 11, color: "#555", fontWeight: 600 }}>
              📐 {order.taille}
            </div>
          )}
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: dlColor,
              marginLeft: "auto",
            }}
          >
            <Calendar
              size={9}
              style={{ verticalAlign: "middle", marginRight: 3 }}
            />
            {days < 0
              ? `${Math.abs(days)}j retard`
              : days === 0
                ? "Aujourd'hui"
                : `J-${days}`}
          </div>
        </div>
      </div>

      {/* Note */}
      {order.note && (
        <div
          style={{
            margin: "0 13px 9px",
            padding: "7px 10px",
            background: "#fffbeb",
            borderRadius: 8,
            border: "1px solid #fde68a",
            display: "flex",
            gap: 5,
            alignItems: "flex-start",
          }}
        >
          <StickyNote
            size={11}
            color="#d97706"
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: "#92400e",
              lineHeight: 1.5,
            }}
          >
            {order.note}
          </p>
        </div>
      )}

      {/* Progression (seulement "en cours") */}
      {order.status === "en_cours" && (
        <div style={{ margin: "0 13px 9px" }}>
          <div
            style={{
              fontSize: 10,
              color: "#aaa",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 6,
            }}
          >
            Avancement
          </div>
          {/* Boutons % rapides */}
          <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
            {PROGRESS_STEPS.map((p) => (
              <button
                key={p}
                onClick={() => onProgress(order.id, p)}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  transition: "all 0.15s",
                  background: order.progress >= p ? "#e91e8c" : "#f3f4f6",
                  color: order.progress >= p ? "#fff" : "#999",
                }}
              >
                {p}%
              </button>
            ))}
          </div>
          {/* Barre */}
          <div
            style={{
              background: "#f3f4f6",
              borderRadius: 99,
              height: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 99,
                background: "linear-gradient(90deg,#e91e8c,#f472b6)",
                width: `${order.progress}%`,
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 3,
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: "#e91e8c" }}>
              {order.progress}%
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          padding: "9px 13px 11px",
          display: "flex",
          gap: 5,
          borderTop: "1px solid #f5f5f5",
        }}
      >
        {order.status !== "a_fabriquer" && (
          <button
            onClick={() => onMove(order.id, "prev")}
            style={{
              flex: 1,
              padding: "7px 3px",
              border: "1.5px solid #e5e7eb",
              borderRadius: 7,
              background: "#fff",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              color: "#555",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
            }}
          >
            <ChevronLeft size={12} /> Retour
          </button>
        )}
        <button
          onClick={() => onOpenNote(order)}
          style={{
            flex: 1,
            padding: "7px 3px",
            border: "1.5px solid #e5e7eb",
            borderRadius: 7,
            background: "#fff",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            color: "#555",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
          }}
        >
          <StickyNote size={12} /> Note
        </button>
        {order.status !== "pret_a_livrer" ? (
          <button
            onClick={() => onMove(order.id, "next")}
            style={{
              flex: 2,
              padding: "7px 3px",
              border: "none",
              borderRadius: 7,
              background: "#e91e8c",
              color: "#fff",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
            }}
          >
            Avancer <ChevronRight size={12} />
          </button>
        ) : (
          <button
            onClick={() => onDeliver(order.id)}
            style={{
              flex: 2,
              padding: "7px 3px",
              border: "none",
              borderRadius: 7,
              background: "#16a34a",
              color: "#fff",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
            }}
          >
            <Truck size={12} /> Livrer
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────
export default function PlanningTab({ products }: PlanningTabProps) {
  const [orders, setOrders] = useState<PlanningOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("Toutes");
  const [editingNote, setEditingNote] = useState<PlanningOrder | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);

  console.log(`[PlanningTab] ${products?.length || 0} produits`);

  const fetchPlanning = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/orders/planning`);
      if (!res.ok) throw new Error();
      setOrders((await res.json()).map(mapApiOrder));
    } catch (e) {
      setError("Impossible de charger le planning.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlanning();
  }, [fetchPlanning]);

  async function moveOrder(id: number, dir: "prev" | "next") {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    const next =
      STATUS_ORDER[STATUS_ORDER.indexOf(o.status) + (dir === "next" ? 1 : -1)];
    if (!next) return;
    setOrders((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: next } : x)),
    );
    try {
      await fetch(`${API}/orders/${id}/planning-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planning_status: next }),
      });
    } catch {
      setOrders((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status: o.status } : x)),
      );
    }
  }

  async function deliverOrder(id: number) {
    if (!confirm("Marquer cette commande comme livrée ?")) return;
    setOrders((prev) => prev.filter((x) => x.id !== id));
    try {
      await fetch(`${API}/orders/${id}/planning-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planning_status: "livree" }),
      });
    } catch {
      fetchPlanning();
    }
  }

  async function saveNote(id: number, note: string, acompte: number) {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    setOrders((prev) =>
      prev.map((x) =>
        x.id === id
          ? { ...x, planning_note: note, note: note || x.note, acompte }
          : x,
      ),
    );
    try {
      await fetch(`${API}/orders/${id}/planning-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planning_status: o.status,
          planning_note: note,
          acompte,
        }),
      });
    } catch {
      /**/
    }
  }

  async function updateProgress(id: number, progress: number) {
    setOrders((prev) =>
      prev.map((x) => (x.id === id ? { ...x, progress } : x)),
    );
    try {
      await fetch(`${API}/orders/${id}/planning-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planning_status: "en_cours", progress }),
      });
    } catch {
      /**/
    }
  }

  async function createManualOrder(form: NewOrderForm) {
    const body = {
      client_name: form.client_name,
      client_email: form.client_email || "surplace@artjatie.mg",
      client_whatsapp: form.client_whatsapp || "0000000000",
      client_message: form.client_message,
      cart_items: [
        {
          id: 0,
          name: form.product_name,
          price: form.total_ar,
          quantity: 1,
          image: "",
          category: "TENUES",
        },
      ],
      delivery_zone: "Sur place",
      delivery_cost: 0,
      delivery_label: "Retrait sur place",
      subtotal_ar: form.total_ar,
      discount_ar: 0,
      total_ar: form.total_ar,
      selected_size: form.selected_size,
      selected_color: form.selected_color,
      payment_method: "whatsapp",
      acompte: form.acompte,
    };
    try {
      const res = await fetch(`${API}/orders/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      await fetch(`${API}/orders/${created.id}/planning-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planning_status: form.planning_status,
          planning_note: form.client_message,
          acompte: form.acompte,
        }),
      });
      setShowNewOrder(false);
      fetchPlanning();
    } catch {
      alert("Erreur lors de la création. Vérifiez les champs requis.");
    }
  }

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      (search === "" ||
        o.name.toLowerCase().includes(q) ||
        o.client.name.toLowerCase().includes(q) ||
        o.ref.toLowerCase().includes(q)) &&
      (filterPriority === "Toutes" || o.priority === filterPriority)
    );
  });

  const caTotal = orders.reduce((s, o) => s + o.prixTotal, 0);

  if (loading)
    return (
      <div className={styles.container}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 300,
            flexDirection: "column",
            gap: 14,
            color: "#aaa",
          }}
        >
          <RefreshCw
            size={26}
            strokeWidth={1.5}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p style={{ fontSize: 13 }}>Chargement du planning…</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className={styles.container}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 300,
            flexDirection: "column",
            gap: 14,
          }}
        >
          <AlertCircle size={34} color="#e91e8c" />
          <p style={{ color: "#666", fontSize: 13 }}>{error}</p>
          <button className={styles.btnPrimary} onClick={fetchPlanning}>
            <RefreshCw size={13} /> Réessayer
          </button>
        </div>
      </div>
    );

  return (
    <div className={styles.container}>
      {editingNote && (
        <NoteModal
          order={editingNote}
          onSave={saveNote}
          onClose={() => setEditingNote(null)}
        />
      )}
      {showNewOrder && (
        <NewOrderModal
          onSave={createManualOrder}
          onClose={() => setShowNewOrder(false)}
        />
      )}

      <div className={styles.header}>
        <div>
          <h2 className={styles.headerTitle}>
            Planning <span>Production</span>
          </h2>
          <p className={styles.headerSub}>
            Interface professionnelle de gestion des flux de production
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={fetchPlanning}>
            <RefreshCw size={14} /> Actualiser
          </button>
          <button className={styles.btnSecondary}>
            <BarChart3 size={14} /> Exporter
          </button>
          <button
            className={styles.btnPrimary}
            onClick={() => setShowNewOrder(true)}
          >
            <Plus size={14} /> Nouvelle commande
          </button>
        </div>
      </div>

      <div className={styles.statsBar}>
        <StatCard
          icon={ClipboardList}
          value={orders.length}
          label="En production"
          bg="#fce4f3"
        />
        <StatCard
          icon={Zap}
          value={orders.filter((o) => o.status === "en_cours").length}
          label="En cours"
          bg="#eff6ff"
        />
        <StatCard
          icon={CheckCircle2}
          value={orders.filter((o) => o.status === "pret_a_livrer").length}
          label="Prêtes à livrer"
          bg="#f0fdf4"
        />
        <StatCard
          icon={DollarSign}
          value={`${(caTotal / 1000).toFixed(0)}k Ar`}
          label="CA en cours"
          bg="#fef9ee"
        />
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <Search size={14} color="#9ca3af" />
          <input
            placeholder="Rechercher commande, client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="Toutes">Toutes les priorités</option>
          <option value="Urgente">🔴 Urgente</option>
          <option value="Haute">🟠 Haute</option>
          <option value="Normale">🔵 Normale</option>
          <option value="Basse">⚫ Basse</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <Package size={48} strokeWidth={1} color="#e91e8c" />
          <p style={{ marginTop: 12, fontSize: 14, color: "#999" }}>
            Aucune commande en production.
            <br />
            Confirmez une commande dans <strong>Commandes</strong> ou créez-en
            une ici.
          </p>
          <button
            className={styles.btnPrimary}
            style={{ marginTop: 14 }}
            onClick={() => setShowNewOrder(true)}
          >
            <Plus size={13} /> Créer une commande sur place
          </button>
        </div>
      ) : (
        <div className={styles.board}>
          {COLUMNS.map((col) => {
            const colOrders = filtered.filter((o) => o.status === col.id);
            const ColIcon = col.icon;
            return (
              <div key={col.id} className={styles.column}>
                <div
                  className={styles.columnHeader}
                  style={{ background: col.bg, borderBottomColor: col.border }}
                >
                  <div className={styles.columnHeaderLeft}>
                    <ColIcon
                      size={15}
                      strokeWidth={2}
                      style={{ color: col.accent }}
                    />
                    <span className={styles.columnTitle}>{col.title}</span>
                    <span
                      className={styles.columnBadge}
                      style={{ background: col.border, color: col.accent }}
                    >
                      {colOrders.length}
                    </span>
                  </div>
                  <button
                    className={styles.columnAddBtn}
                    onClick={() => setShowNewOrder(true)}
                    title="Ajouter"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className={styles.columnBody}>
                  {colOrders.length === 0 ? (
                    <div className={styles.emptyColumn}>
                      <Package size={34} strokeWidth={1} />
                      <p>Aucun flux actif</p>
                    </div>
                  ) : (
                    colOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onMove={moveOrder}
                        onDeliver={deliverOrder}
                        onOpenNote={setEditingNote}
                        onProgress={updateProgress}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
