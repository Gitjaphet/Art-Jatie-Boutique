import { useState, useEffect } from "react";
import Image from "next/image";
import dashboardStyles from "../../app/admin/dashboard/AdminDashboard.module.css";
import styles from "./ProductsTab.module.css";

import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProductModal";

export type Product = {
  id: number;
  name: string;
  genre: string;
  category: string;
  colors: string;
  price_ar: number;
  badge: string;
  image: string;
};

type ProductsTabProps = {
  products: Product[];
  refresh: () => void;
  toast: (msg: string, type?: "success" | "error") => void;
  settings: Record<string, unknown> | null;
};

const I = {
  Search: () => (
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
  ),
  Plus: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Pen: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Bin: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  ),
  Warning: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

function Badge({ b }: { b: string }) {
  const map: Record<string, [string, string, string]> = {
    "En stock": ["var(--green)", "var(--green-dim)", "rgba(5,150,105,0.2)"],
    Nouveau: ["var(--blue)", "var(--blue-dim)", "rgba(37,99,235,0.2)"],
    "Sur commande": ["var(--gold)", "var(--gold-dim)", "rgba(217,119,6,0.2)"],
    Derniers: ["var(--red)", "var(--red-dim)", "rgba(220,38,38,0.2)"],
  };
  const [color, bg, border] = map[b] || map["En stock"];
  return (
    <span
      className={styles.badge}
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
      {b}
    </span>
  );
}

export default function ProductsTab({
  products,
  refresh,
  toast,
  settings,
}: ProductsTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [q, setQ] = useState("");
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  // Détection iPhone Pro Max (430px)
  useEffect(() => {
    const checkSize = () => setIsSmallMobile(window.innerWidth <= 430);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const filt = products.filter(
    (p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.category.toLowerCase().includes(q.toLowerCase()),
  );

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/products/${productToDelete.id}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        refresh();
        toast("Supprimé", "success");
      }
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── TOOLBAR ADAPTATIVE ── */}
      <div className={`${dashboardStyles.toolbar} ${styles.customToolbar}`}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <I.Search />
          </span>
          <input
            type="text"
            placeholder={
              isSmallMobile ? "Rechercher..." : "Rechercher une création..."
            }
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={dashboardStyles.searchInput}
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className={dashboardStyles.btnPrimary}
        >
          <I.Plus />{" "}
          <span>{isSmallMobile ? "Ajouter" : "Nouvelle création"}</span>
        </button>
      </div>

      {/* ── TABLEAU (Desktop > 900px) ── */}
      <div className={`${dashboardStyles.tableCard} ${styles.tableWrapper}`}>
        <table className={dashboardStyles.table}>
          <thead>
            <tr>
              {[
                "Création",
                "Catégorie",
                "Couleurs",
                "Prix",
                "Statut",
                "Actions",
              ].map((h) => (
                <th key={h} className={dashboardStyles.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filt.map((p, i) => (
              <tr
                key={p.id}
                className={dashboardStyles.tr}
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <td className={dashboardStyles.td}>
                  <div className={styles.flexCenter}>
                    <Image
                      src={p.image}
                      alt={p.name}
                      width={40}
                      height={40}
                      className={styles.tableImg}
                    />
                    <div>
                      <div className={styles.tableName}>{p.name}</div>
                      <div className={styles.tableSub}>{p.genre}</div>
                    </div>
                  </div>
                </td>
                <td className={dashboardStyles.td}>
                  <span className={styles.catTag}>{p.category}</span>
                </td>
                <td className={dashboardStyles.td}>
                  <div className={styles.colorWrap}>
                    {p.colors?.split(",").map((c) => (
                      <span key={c} className={styles.colorTag}>
                        {c.trim()}
                      </span>
                    ))}
                  </div>
                </td>
                <td className={dashboardStyles.td}>
                  <strong>{p.price_ar.toLocaleString()}</strong>{" "}
                  <small>Ar</small>
                </td>
                <td className={dashboardStyles.td}>
                  <Badge b={p.badge} />
                </td>
                <td className={dashboardStyles.td}>
                  <div className={styles.flexCenter}>
                    <button
                      onClick={() => setEditingProduct(p)}
                      className={dashboardStyles.actionBtn}
                    >
                      <I.Pen />
                    </button>
                    <button
                      onClick={() => setProductToDelete(p)}
                      className={`${dashboardStyles.actionBtn} ${dashboardStyles.deleteBtn}`}
                    >
                      <I.Bin />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── CARDS (Mobile & Tablette < 900px) ── */}
      <div className={styles.cardGrid}>
        {filt.map((p, i) => (
          <div
            key={p.id}
            className={styles.productCard}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className={styles.cardImage}>
              <Image
                src={p.image}
                alt={p.name}
                fill
                sizes="80px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardName}>{p.name}</h4>
                <span className={styles.cardPrice}>
                  {p.price_ar.toLocaleString()} <small>Ar</small>
                </span>
              </div>
              <div className={styles.cardMeta}>
                <span className={styles.cardGenre}>{p.genre}</span>
                <Badge b={p.badge} />
              </div>
              <div className={styles.cardActions}>
                <button
                  onClick={() => setEditingProduct(p)}
                  className={`${styles.cardBtn} ${styles.cardBtnEdit}`}
                >
                  <I.Pen /> {!isSmallMobile && "Modifier"}
                </button>
                <button
                  onClick={() => setProductToDelete(p)}
                  className={`${styles.cardBtn} ${styles.cardBtnDelete}`}
                >
                  <I.Bin /> {!isSmallMobile && "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MODALS (Statiques) ── */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onSuccess={refresh}
          toast={toast}
          settings={settings}
        />
      )}
      {editingProduct && (
        <EditProductModal
          productToEdit={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={refresh}
          toast={toast}
          settings={settings}
        />
      )}

      {/* ── MODAL SUPPRESSION ── */}
      {productToDelete && (
        <div className={styles.deleteOverlay}>
          <div className={styles.deleteModal}>
            <div className={styles.deleteHeader}>
              <div className={styles.warningIcon}>
                <I.Warning />
              </div>
              <div>
                <h3 className={styles.deleteTitle}>Supprimer ?</h3>
                <p className={styles.deleteSubtitle}>Action définitive</p>
              </div>
            </div>
            <p className={styles.deleteText}>
              Supprimer <strong>{productToDelete.name}</strong> ?
            </p>
            <div className={styles.deleteActions}>
              <button
                onClick={() => setProductToDelete(null)}
                className={styles.btnCancel}
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className={styles.btnConfirm}
              >
                {isDeleting ? "..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
