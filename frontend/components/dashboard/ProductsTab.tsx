import { useState } from "react";
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
  tag?: string;
  sizes?: string;
  stock_quantity?: number;
  is_hot?: boolean;
  on_order?: boolean;
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
      strokeWidth="1.9"
      strokeLinecap="round"
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
      strokeWidth="2.4"
      strokeLinecap="round"
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
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
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
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
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

  const filt = products.filter(
    (p: Product) =>
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
        toast("Création supprimée avec succès.", "success");
        refresh();
      } else {
        const err = await res.json();
        toast(`Erreur : ${err.detail || "Impossible de supprimer."}`, "error");
      }
    } catch (err) {
      console.error("Détail de l'erreur :", err);
      toast("Erreur de connexion au serveur.", "error");
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  return (
    <div style={{ animation: "fadeUp .4s var(--ease) both" }}>
      {/* ── TOOLBAR ── */}
      <div className={dashboardStyles.toolbar}>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: "11px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          >
            <I.Search />
          </span>
          <input
            type="text"
            placeholder="Rechercher…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={dashboardStyles.searchInput}
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className={dashboardStyles.btnPrimary}
        >
          <I.Plus /> Nouvelle création
        </button>
      </div>

      {/* ══════════════════════════════════════════
          TABLEAU — visible uniquement sur desktop
      ══════════════════════════════════════════ */}
      <div className={`${dashboardStyles.tableCard} ${styles.tableWrapper}`}>
        <table className={dashboardStyles.table}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--border)",
                background: "var(--surface2)",
              }}
            >
              {[
                "Création",
                "Catégorie",
                "Couleurs",
                "Prix",
                "Statut",
                "Actions",
              ].map((h, i) => (
                <th key={i} className={dashboardStyles.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filt.map((p: Product, i: number) => (
              <tr
                key={p.id}
                className={dashboardStyles.tr}
                style={{
                  animation: `fadeUp .35s var(--ease) ${i * 0.04}s both`,
                }}
              >
                <td className={dashboardStyles.td}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "11px",
                    }}
                  >
                    <Image
                      src={p.image}
                      alt={p.name}
                      width={42}
                      height={42}
                      style={{
                        objectFit: "cover",
                        borderRadius: "9px",
                        border: "1px solid var(--border)",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "var(--text-primary)",
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                          fontWeight: "500",
                        }}
                      >
                        {p.genre}
                      </div>
                    </div>
                  </div>
                </td>
                <td className={dashboardStyles.td}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "var(--text-secondary)",
                      background: "var(--surface2)",
                      padding: "3px 9px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {p.category}
                  </span>
                </td>
                <td className={dashboardStyles.td}>
                  <div
                    style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}
                  >
                    {p.colors &&
                      p.colors.split(",").map((c: string) => (
                        <span
                          key={c}
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "var(--text-muted)",
                            background: "var(--surface)",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {c.trim()}
                        </span>
                      ))}
                  </div>
                </td>
                <td
                  className={dashboardStyles.td}
                  style={{ whiteSpace: "nowrap" }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: "var(--text-primary)",
                    }}
                  >
                    {p.price_ar.toLocaleString("fr-FR")}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginLeft: "3px",
                      fontWeight: "500",
                    }}
                  >
                    Ar
                  </span>
                </td>
                <td className={dashboardStyles.td}>
                  <Badge b={p.badge} />
                </td>
                <td className={dashboardStyles.td}>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button
                      title="Modifier"
                      onClick={() => setEditingProduct(p)}
                      className={`${dashboardStyles.actionBtn} ${dashboardStyles.editBtn}`}
                    >
                      <I.Pen />
                    </button>
                    <button
                      title="Supprimer"
                      onClick={() => setProductToDelete(p)}
                      className={`${dashboardStyles.actionBtn} ${dashboardStyles.deleteBtn}`}
                    >
                      <I.Bin />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!filt.length && (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  Aucun résultat trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════
          CARDS — visible sur mobile & tablette
      ══════════════════════════════════════════ */}
      <div className={styles.cardGrid}>
        {filt.length === 0 && (
          <div className={styles.emptyState}>Aucun résultat trouvé</div>
        )}
        {filt.map((p: Product, i: number) => (
          <div
            key={p.id}
            className={styles.productCard}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {/* Image */}
            <div className={styles.cardImage}>
              <Image
                src={p.image}
                alt={p.name}
                fill
                sizes="64px"
                style={{ objectFit: "cover" }}
              />
            </div>

            {/* Contenu */}
            <div className={styles.cardBody}>
              <p className={styles.cardName}>{p.name}</p>

              <div className={styles.cardMeta}>
                <span className={styles.cardGenre}>{p.genre}</span>
                <span className={styles.cardCategory}>{p.category}</span>
                <Badge b={p.badge} />
              </div>

              <p className={styles.cardPrice}>
                {p.price_ar.toLocaleString("fr-FR")}
                <span className={styles.cardPriceSub}>Ar</span>
              </p>

              {p.colors && (
                <div className={styles.cardColors}>
                  {p.colors
                    .split(",")
                    .slice(0, 4)
                    .map((c) => (
                      <span key={c} className={styles.colorTag}>
                        {c.trim()}
                      </span>
                    ))}
                  {p.colors.split(",").length > 4 && (
                    <span className={styles.colorTag}>
                      +{p.colors.split(",").length - 4}
                    </span>
                  )}
                </div>
              )}

              <div className={styles.cardActions}>
                <button
                  className={`${styles.cardBtn} ${styles.cardBtnEdit}`}
                  onClick={() => setEditingProduct(p)}
                >
                  <I.Pen /> Modifier
                </button>
                <button
                  className={`${styles.cardBtn} ${styles.cardBtnDelete}`}
                  onClick={() => setProductToDelete(p)}
                >
                  <I.Bin /> Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MODALS ── */}
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
                <h3 className={styles.deleteTitle}>Supprimer la création</h3>
                <p className={styles.deleteSubtitle}>Action irréversible</p>
              </div>
            </div>
            <p className={styles.deleteText}>
              Êtes-vous sûr de vouloir supprimer{" "}
              <strong>{productToDelete.name}</strong> ?<br />
              Cette création et ses données seront définitivement effacées du
              catalogue.
            </p>
            <div className={styles.deleteActions}>
              <button
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className={styles.btnCancel}
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className={styles.btnConfirm}
              >
                {isDeleting ? (
                  <div className={styles.spinnerSmall} />
                ) : (
                  <I.Bin />
                )}
                {isDeleting ? "Suppression..." : "Oui, supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
