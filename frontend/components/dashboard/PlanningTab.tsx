"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import styles from "./PlanningTab.module.css";

// ── Types ──────────────────────────────────────────────────────────────
type Priority = "Urgente" | "Haute" | "Normale" | "Basse";
type Status = "a_fabriquer" | "en_cours" | "pret_a_livrer";

interface Order {
  id: number;
  ref: string;
  name: string;
  categorie: string;
  couleurs: string[];
  taille?: string;
  motif?: string;
  client: { name: string; phone: string; initials: string; color: string };
  priority: Priority;
  status: Status;
  progress: number;
  prixTotal: number;
  acompte: number;
  dateCommande: string;
  dateLivraison: string;
  note?: string;
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
};

// ── Mock Data ──────────────────────────────────────────────────────────
const MOCK_ORDERS: Order[] = [
  {
    id: 1,
    ref: "CMD-1024",
    name: "Sac à main tressé",
    categorie: "Sac",
    couleurs: ["#c8956c", "#d4a574"],
    taille: "M",
    motif: "Losange",
    client: {
      name: "Miora Rakoto",
      phone: "+261 34 00 111 22",
      initials: "MR",
      color: "#e91e8c",
    },
    priority: "Urgente",
    status: "a_fabriquer",
    progress: 0,
    prixTotal: 85000,
    acompte: 40000,
    dateCommande: "2026-04-18",
    dateLivraison: "2026-04-25",
    note: "Anse plus longue, couleur caramel uniquement",
  },
  {
    id: 2,
    ref: "CMD-2048",
    name: "Bonnet d'hiver",
    categorie: "Bonnet",
    couleurs: ["#1e3a8a", "#fff"],
    motif: "Côtelé",
    client: {
      name: "Fanja Andria",
      phone: "+261 33 55 678 90",
      initials: "FA",
      color: "#8b5cf6",
    },
    priority: "Haute",
    status: "a_fabriquer",
    progress: 0,
    prixTotal: 25000,
    acompte: 0,
    dateCommande: "2026-04-20",
    dateLivraison: "2026-04-28",
    note: "Bleu marine + blanc, pompon blanc",
  },
  {
    id: 3,
    ref: "CMD-3072",
    name: "Couverture bébé",
    categorie: "Couverture",
    couleurs: ["#fda4af", "#fff"],
    taille: "60×80cm",
    motif: "Étoiles",
    client: {
      name: "Lalaina Raz.",
      phone: "+261 38 12 345 67",
      initials: "LR",
      color: "#10b981",
    },
    priority: "Normale",
    status: "en_cours",
    progress: 45,
    prixTotal: 120000,
    acompte: 60000,
    dateCommande: "2026-04-10",
    dateLivraison: "2026-04-30",
  },
  {
    id: 4,
    ref: "CMD-4096",
    name: "Top été dentelle",
    categorie: "Vêtement",
    couleurs: ["#fff", "#e91e8c"],
    taille: "S",
    client: {
      name: "Voahirana Solo",
      phone: "+261 34 99 000 11",
      initials: "VS",
      color: "#f59e0b",
    },
    priority: "Urgente",
    status: "en_cours",
    progress: 70,
    prixTotal: 95000,
    acompte: 50000,
    dateCommande: "2026-04-08",
    dateLivraison: "2026-04-23",
    note: "Anniversaire le 25 — livraison impérative !",
  },
  {
    id: 5,
    ref: "CMD-5120",
    name: "Pantoufles paire",
    categorie: "Accessoire",
    couleurs: ["#c8956c"],
    taille: "38-39",
    client: {
      name: "Hanta Rabe",
      phone: "+261 32 44 555 66",
      initials: "HR",
      color: "#6366f1",
    },
    priority: "Normale",
    status: "en_cours",
    progress: 90,
    prixTotal: 35000,
    acompte: 35000,
    dateCommande: "2026-04-14",
    dateLivraison: "2026-04-24",
  },
  {
    id: 6,
    ref: "CMD-6144",
    name: "Sac plage filet",
    categorie: "Sac",
    couleurs: ["#fbbf24", "#fff"],
    client: {
      name: "Noro Ravelon.",
      phone: "+261 33 77 888 99",
      initials: "NR",
      color: "#14b8a6",
    },
    priority: "Basse",
    status: "pret_a_livrer",
    progress: 100,
    prixTotal: 55000,
    acompte: 55000,
    dateCommande: "2026-04-05",
    dateLivraison: "2026-04-22",
  },
  {
    id: 7,
    ref: "CMD-7168",
    name: "Pull col roulé",
    categorie: "Vêtement",
    couleurs: ["#6b7280", "#1a1a2e"],
    taille: "L",
    client: {
      name: "Zo Rakotom.",
      phone: "+261 34 22 333 44",
      initials: "ZR",
      color: "#dc2626",
    },
    priority: "Urgente",
    status: "pret_a_livrer",
    progress: 100,
    prixTotal: 180000,
    acompte: 90000,
    dateCommande: "2026-04-01",
    dateLivraison: "2026-04-22",
    note: "Attente paiement solde avant livraison",
  },
];

const COLUMNS: {
  id: Status;
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

const STATUS_ORDER: Status[] = ["a_fabriquer", "en_cours", "pret_a_livrer"];

// ── Helpers ────────────────────────────────────────────────────────────
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

// ── OrderCard ──────────────────────────────────────────────────────────
function OrderCard({
  order,
  onMove,
}: {
  order: Order;
  onMove: (id: number, dir: "prev" | "next") => void;
}) {
  const days = daysLeft(order.dateLivraison);
  const solde = order.prixTotal - order.acompte;
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
        <button className={styles.cardMenuBtn}>
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
        <span className={styles.clientContactIcon} title="Appeler">
          <Phone size={14} />
        </span>
      </div>

      <div className={styles.cardDetails}>
        <div className={styles.cardDetail}>
          <div className={styles.cardDetailLabel}>Prix total</div>
          <div className={styles.cardDetailValue}>
            {order.prixTotal.toLocaleString()} Ar
          </div>
        </div>
        <div className={styles.cardDetail}>
          <div className={styles.cardDetailLabel}>Solde dû</div>
          <div
            className={styles.cardDetailValue}
            style={{ color: solde > 0 ? "#e91e8c" : "#16a34a" }}
          >
            {solde > 0 ? `${solde.toLocaleString()} Ar` : "✓ Soldé"}
          </div>
        </div>
        {order.taille && (
          <div className={styles.cardDetail}>
            <div className={styles.cardDetailLabel}>Taille</div>
            <div className={styles.cardDetailValue}>{order.taille}</div>
          </div>
        )}
        {order.motif && (
          <div className={styles.cardDetail}>
            <div className={styles.cardDetailLabel}>Motif</div>
            <div className={styles.cardDetailValue}>{order.motif}</div>
          </div>
        )}
        <div className={styles.cardDetail}>
          <div className={styles.cardDetailLabel}>Couleurs</div>
          <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
            {order.couleurs.map((c, i) => (
              <div
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: c,
                  border: "1.5px solid #eee",
                  display: "inline-block",
                }}
              />
            ))}
          </div>
        </div>
        <div className={styles.cardDetail}>
          <div className={styles.cardDetailLabel}>Acompte</div>
          <div className={styles.cardDetailValue}>
            {order.acompte.toLocaleString()} Ar
          </div>
        </div>
      </div>

      {order.status === "en_cours" && (
        <div className={styles.cardProgress}>
          <div className={styles.cardProgressLabel}>
            <span>Avancement</span>
            <span style={{ color: "#e91e8c", fontWeight: 700 }}>
              {order.progress}%
            </span>
          </div>
          <div className={styles.cardProgressBar}>
            <div
              className={styles.cardProgressFill}
              style={{ width: `${order.progress}%` }}
            />
          </div>
        </div>
      )}

      {order.note && (
        <div className={styles.noteCard}>
          <p>
            <StickyNote
              size={12}
              style={{ verticalAlign: "middle", marginRight: "4px" }}
            />{" "}
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
          <Calendar size={12} />{" "}
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
        <button className={styles.cardActionBtn}>
          <Edit2 size={14} /> Modifier
        </button>
        {order.status !== "pret_a_livrer" ? (
          <button
            className={styles.cardActionBtnPrimary}
            onClick={() => onMove(order.id, "next")}
          >
            Avancer <ChevronRight size={14} />
          </button>
        ) : (
          <button className={styles.cardActionBtnPrimary}>
            <Truck size={14} /> Livrer
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────
export default function PlanningTab({ products }: PlanningTabProps) {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("Toutes");
  const [filterCat, setFilterCat] = useState("Toutes");

  // Sécurité sur .length pour éviter le crash au chargement
  const productsLen = products ? products.length : 0;
  console.log(`[PlanningTab] Produits chargés : ${productsLen}`);

  function moveOrder(id: number, dir: "prev" | "next") {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const idx = STATUS_ORDER.indexOf(o.status);
        const next = STATUS_ORDER[idx + (dir === "next" ? 1 : -1)];
        if (!next) return o;
        return {
          ...o,
          status: next,
          progress:
            dir === "next" && next === "pret_a_livrer" ? 100 : o.progress,
        };
      }),
    );
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

  return (
    <div className={styles.container}>
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
          <button className={styles.btnSecondary}>
            <BarChart3 size={16} /> Exporter
          </button>
          <button className={styles.btnSecondary}>
            <Calendar size={16} /> Calendrier
          </button>
          <button className={styles.btnPrimary}>
            <Plus size={16} /> Nouvelle commande
          </button>
        </div>
      </div>

      <div className={styles.statsBar}>
        <StatCard
          icon={ClipboardList}
          value={orders.length}
          label="Commandes totales"
          bg="#fce4f3"
        />
        <StatCard
          icon={Zap}
          value={orders.filter((o) => o.status === "en_cours").length}
          label="En production"
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
          label="CA total"
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
          <option value="Sac">Sac</option>
          <option value="Bonnet">Bonnet</option>
          <option value="Couverture">Couverture</option>
          <option value="Vêtement">Vêtement</option>
          <option value="Accessoire">Accessoire</option>
        </select>
      </div>

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
                  <span className={styles.columnBadge}>{colOrders.length}</span>
                </div>
                <button className={styles.columnAddBtn}>
                  <Plus size={16} />
                </button>
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
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
