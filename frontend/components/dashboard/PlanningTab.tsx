"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag,
  Package,
  Baby,
  Shirt,
  Footprints,
  Palmtree,
  ClipboardList,
  Zap,
  CheckCircle2,
  DollarSign,
  Search,
  Calendar,
  BarChart3,
  Plus,
  MoreHorizontal,
  Phone,
  StickyNote,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Truck,
  RefreshCw,
  AlertCircle,
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
  product_image?: string;
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
  delivery_label?: string;
  delivery_cost?: number;
}

interface PlanningOrder {
  id: number;
  ref: string;
  name: string;
  categorie: string;
  client: { name: string; phone: string; initials: string; color: string };
  priority: Priority;
  status: PlanningStatus;
  prixTotal: number;
  taille?: string;
  couleurs: string[];
  note?: string;
  dateLivraison: string;
  dateCommande: string;
  planning_note?: string;
}

type PlanningTabProps = {
  products: Record<string, unknown>[];
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Sac: ShoppingBag,
  Bonnet: Package,
  Couverture: Baby,
  Vêtement: Shirt,
  Accessoire: Footprints,
  Plage: Palmtree,
  TENUES: Shirt,
  ACCESSOIRES: Footprints,
  MAISON: Baby,
};

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

function getClientColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return CLIENT_COLORS[Math.abs(hash) % CLIENT_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function inferPriority(order: ApiOrder): Priority {
  const daysSinceOrder = Math.floor(
    (Date.now() - new Date(order.created_at).getTime()) / 86400000,
  );
  if (daysSinceOrder >= 7) return "Urgente";
  if (daysSinceOrder >= 4) return "Haute";
  if (daysSinceOrder >= 2) return "Normale";
  return "Basse";
}

function mapApiOrder(o: ApiOrder): PlanningOrder {
  let name = o.product_name || "Commande";
  let categorie = "Vêtement";

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
      /* ignore */
    }
  }

  const total = o.total_ar ?? o.subtotal_ar ?? o.product_price_ar ?? 0;
  // Livraison estimée : 7 jours après la commande
  const orderDate = new Date(o.created_at);
  const deliveryDate = new Date(orderDate);
  deliveryDate.setDate(deliveryDate.getDate() + 7);

  return {
    id: o.id,
    ref: `CMD-${String(o.id).padStart(4, "0")}`,
    name,
    categorie,
    client: {
      name: o.client_name,
      phone: o.client_whatsapp,
      initials: getInitials(o.client_name),
      color: getClientColor(o.client_name),
    },
    priority: inferPriority(o),
    status: o.planning_status as PlanningStatus,
    prixTotal: total,
    taille: o.selected_size || undefined,
    couleurs: o.selected_color ? [o.selected_color] : ["#c8956c"],
    note: o.planning_note || o.client_message || undefined,
    dateLivraison: deliveryDate.toISOString().split("T")[0],
    dateCommande: o.created_at.split("T")[0],
    planning_note: o.planning_note || undefined,
  };
}

const COLUMNS: {
  id: PlanningStatus;
  title: string;
  icon: React.ElementType;
  bg: string;
  border: string;
}[] = [
  {
    id: "a_fabriquer",
    title: "À Fabriquer",
    icon: ClipboardList,
    bg: "#fff5fb",
    border: "#fad4ed",
  },
  {
    id: "en_cours",
    title: "En cours",
    icon: Zap,
    bg: "#f0f7ff",
    border: "#bfdbfe",
  },
  {
    id: "pret_a_livrer",
    title: "Prêt à livrer",
    icon: CheckCircle2,
    bg: "#f0fdf4",
    border: "#bbf7d0",
  },
];

const STATUS_ORDER: PlanningStatus[] = [
  "a_fabriquer",
  "en_cours",
  "pret_a_livrer",
];

function daysLeft(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function priorityAccent(p: Priority) {
  return {
    Urgente: styles.priorityUrgente,
    Haute: styles.priorityHaute,
    Normale: styles.priorityNormale,
    Basse: styles.priorityBasse,
  }[p];
}
function priorityTag(p: Priority) {
  return {
    Urgente: styles.tagUrgente,
    Haute: styles.tagHaute,
    Normale: styles.tagNormale,
    Basse: styles.tagBasse,
  }[p];
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

// ── NoteModal ──────────────────────────────────────────────────────────
function NoteModal({
  order,
  onSave,
  onClose,
}: {
  order: PlanningOrder;
  onSave: (id: number, note: string) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState(order.planning_note || "");
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Note de production — {order.ref}</h3>
        <textarea
          className={styles.modalTextarea}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex: Couleur caramel uniquement, anse plus longue…"
          rows={4}
          autoFocus
        />
        <div className={styles.modalActions}>
          <button className={styles.cardActionBtn} onClick={onClose}>
            Annuler
          </button>
          <button
            className={styles.cardActionBtnPrimary}
            onClick={() => {
              onSave(order.id, note);
              onClose();
            }}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── OrderCard ──────────────────────────────────────────────────────────
function OrderCard({
  order,
  onMove,
  onDeliver,
  onEditNote,
}: {
  order: PlanningOrder;
  onMove: (id: number, dir: "prev" | "next") => void;
  onDeliver: (id: number) => void;
  onEditNote: (order: PlanningOrder) => void;
}) {
  const days = daysLeft(order.dateLivraison);
  const dlClass =
    days < 0
      ? styles.deadlineOverdue
      : days <= 2
        ? styles.deadlineWarning
        : styles.deadlineOk;
  const CategoryIcon = CATEGORY_ICONS[order.categorie] || Package;

  return (
    <div className={`${styles.card} ${priorityAccent(order.priority)}`}>
      <div className={styles.cardTop}>
        <div className={styles.cardImagePlaceholder}>
          <CategoryIcon size={22} strokeWidth={2} color="#e91e8c" />
        </div>
        <div className={styles.cardMeta}>
          <div className={styles.cardName}>{order.name}</div>
          <div className={styles.cardId}>{order.ref}</div>
        </div>
        <button
          className={styles.cardMenuBtn}
          onClick={() => onEditNote(order)}
          title="Modifier la note"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className={styles.cardClient}>
        <div
          className={styles.clientAvatar}
          style={{ background: order.client.color }}
        >
          {order.client.initials}
        </div>
        <div className={styles.clientInfo}>
          <div className={styles.clientName}>{order.client.name}</div>
          <div className={styles.clientContact}>{order.client.phone}</div>
        </div>
        <a
          href={`https://wa.me/${order.client.phone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.clientContactIcon}
          title="Contacter sur WhatsApp"
        >
          <Phone size={14} />
        </a>
      </div>

      <div className={styles.cardDetails}>
        <div className={styles.cardDetail}>
          <div className={styles.cardDetailLabel}>Prix total</div>
          <div className={styles.cardDetailValue}>
            {order.prixTotal.toLocaleString()} Ar
          </div>
        </div>
        {order.taille && (
          <div className={styles.cardDetail}>
            <div className={styles.cardDetailLabel}>Taille</div>
            <div className={styles.cardDetailValue}>{order.taille}</div>
          </div>
        )}
        <div className={styles.cardDetail}>
          <div className={styles.cardDetailLabel}>Commandé le</div>
          <div className={styles.cardDetailValue}>
            {new Date(order.dateCommande).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </div>
        </div>
      </div>

      {order.note && (
        <div className={styles.noteCard}>
          <p>
            <StickyNote
              size={12}
              style={{ verticalAlign: "middle", marginRight: "4px" }}
            />
            {order.note}
          </p>
        </div>
      )}

      <div className={styles.cardFooter}>
        <div className={styles.cardTags}>
          <span className={`${styles.tag} ${styles.tagCategorie}`}>
            {order.categorie}
          </span>
          <span className={`${styles.tag} ${priorityTag(order.priority)}`}>
            {order.priority}
          </span>
        </div>
        <span className={`${styles.cardDeadline} ${dlClass}`}>
          <Calendar size={12} />
          {days < 0
            ? `${Math.abs(days)}j retard`
            : days === 0
              ? "Auj."
              : `J-${days}`}
        </span>
      </div>

      <div className={styles.cardActions}>
        {order.status !== "a_fabriquer" && (
          <button
            className={styles.cardActionBtn}
            onClick={() => onMove(order.id, "prev")}
          >
            <ChevronLeft size={14} /> Retour
          </button>
        )}
        <button
          className={styles.cardActionBtn}
          onClick={() => onEditNote(order)}
        >
          <Edit2 size={14} /> Note
        </button>
        {order.status !== "pret_a_livrer" ? (
          <button
            className={styles.cardActionBtnPrimary}
            onClick={() => onMove(order.id, "next")}
          >
            Avancer <ChevronRight size={14} />
          </button>
        ) : (
          <button
            className={styles.cardActionBtnPrimary}
            onClick={() => onDeliver(order.id)}
          >
            <Truck size={14} /> Livrer
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
  const [filterCat, setFilterCat] = useState("Toutes");
  const [editingNote, setEditingNote] = useState<PlanningOrder | null>(null);

  const productsLen = products ? products.length : 0;
  console.log(`[PlanningTab] Produits chargés : ${productsLen}`);

  const fetchPlanning = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/orders/planning`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiOrder[] = await res.json();
      setOrders(data.map(mapApiOrder));
    } catch (e) {
      setError(
        "Impossible de charger le planning. Vérifiez que le serveur est démarré.",
      );
      console.error("[PlanningTab] fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlanning();
  }, [fetchPlanning]);

  // Déplace une commande vers le statut précédent ou suivant
  async function moveOrder(id: number, dir: "prev" | "next") {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const idx = STATUS_ORDER.indexOf(order.status);
    const next = STATUS_ORDER[idx + (dir === "next" ? 1 : -1)];
    if (!next) return;

    // Mise à jour optimiste
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: next } : o)),
    );

    try {
      const res = await fetch(`${API}/orders/${id}/planning-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planning_status: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Rollback si erreur
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: order.status } : o)),
      );
      alert("Erreur lors de la mise à jour du statut.");
    }
  }

  // Marque comme livrée
  async function deliverOrder(id: number) {
    if (!confirm("Marquer cette commande comme livrée ?")) return;

    setOrders((prev) => prev.filter((o) => o.id !== id));

    try {
      await fetch(`${API}/orders/${id}/planning-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planning_status: "livree" }),
      });
    } catch {
      alert("Erreur lors de la livraison. Rechargez la page.");
      fetchPlanning();
    }
  }

  // Sauvegarde une note de production
  async function saveNote(id: number, note: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, planning_note: note, note: note || o.note } : o,
      ),
    );

    try {
      const order = orders.find((o) => o.id === id);
      await fetch(`${API}/orders/${id}/planning-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planning_status: order?.status,
          planning_note: note,
        }),
      });
    } catch {
      alert("Erreur lors de la sauvegarde de la note.");
    }
  }

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      (search === "" ||
        o.name.toLowerCase().includes(q) ||
        o.client.name.toLowerCase().includes(q) ||
        o.ref.toLowerCase().includes(q)) &&
      (filterPriority === "Toutes" || o.priority === filterPriority) &&
      (filterCat === "Toutes" || o.categorie === filterCat)
    );
  });

  const caTotal = orders.reduce((s, o) => s + o.prixTotal, 0);
  const categories = [...new Set(orders.map((o) => o.categorie))];

  if (loading) {
    return (
      <div className={styles.container}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 300,
            flexDirection: "column",
            gap: 16,
            color: "#999",
          }}
        >
          <RefreshCw
            size={32}
            strokeWidth={1.5}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p>Chargement du planning…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 300,
            flexDirection: "column",
            gap: 16,
            color: "#e91e8c",
          }}
        >
          <AlertCircle size={40} strokeWidth={1.5} />
          <p style={{ color: "#666", textAlign: "center", maxWidth: 400 }}>
            {error}
          </p>
          <button className={styles.btnPrimary} onClick={fetchPlanning}>
            <RefreshCw size={16} /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {editingNote && (
        <NoteModal
          order={editingNote}
          onSave={saveNote}
          onClose={() => setEditingNote(null)}
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
            <RefreshCw size={16} /> Actualiser
          </button>
          <button className={styles.btnSecondary}>
            <BarChart3 size={16} /> Exporter
          </button>
          <button className={styles.btnSecondary}>
            <Calendar size={16} /> Calendrier
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
          <Search size={16} color="#9ca3af" />
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
          <option value="Urgente">Urgente</option>
          <option value="Haute">Haute</option>
          <option value="Normale">Normale</option>
          <option value="Basse">Basse</option>
        </select>
        <select
          className={styles.filterSelect}
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="Toutes">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {orders.length === 0 ? (
        <div
          className={styles.emptyColumn}
          style={{ margin: "60px auto", textAlign: "center" }}
        >
          <Package size={56} strokeWidth={1} color="#e91e8c" />
          <p style={{ marginTop: 12, color: "#999", fontSize: 15 }}>
            Aucune commande en production.
            <br />
            Confirmez une commande dans l&apos;onglet <strong>
              Commandes
            </strong>{" "}
            pour qu&apos;elle apparaisse ici.
          </p>
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
                      size={18}
                      strokeWidth={2}
                      className={styles.columnIcon}
                    />
                    <span className={styles.columnTitle}>{col.title}</span>
                    <span className={styles.columnBadge}>
                      {colOrders.length}
                    </span>
                  </div>
                </div>
                <div className={styles.columnBody}>
                  {colOrders.length === 0 ? (
                    <div className={styles.emptyColumn}>
                      <Package size={40} strokeWidth={1} />
                      <p>Aucun flux actif</p>
                    </div>
                  ) : (
                    colOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onMove={moveOrder}
                        onDeliver={deliverOrder}
                        onEditNote={setEditingNote}
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
