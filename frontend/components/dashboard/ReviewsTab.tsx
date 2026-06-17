"use client";

import { useEffect, useState } from "react";
import dashboardStyles from "../../app/admin/dashboard/AdminDashboard.module.css";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Review = {
  id: number;
  product_id: number;
  author_name: string;
  author_email?: string | null;
  rating: number;
  title?: string | null;
  comment: string;
  is_approved: boolean;
  created_at: string;
};

type ReviewsTabProps = {
  toast: (msg: string, type?: "success" | "error") => void;
  products: { id: number; name: string }[];
};

const I = {
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Bin: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  ),
  Warning: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  return { Authorization: `Bearer ${token}` };
}

export default function ReviewsTab({ toast, products }: ReviewsTabProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [reviewToReject, setReviewToReject] = useState<Review | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/products/admin/reviews/pending`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      setReviews(await res.json());
    } catch {
      toast("Impossible de charger les avis en attente.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productName = (id: number) =>
    products.find((p) => p.id === id)?.name || `Produit #${id}`;

  const filt = reviews.filter(
    (r) =>
      r.author_name.toLowerCase().includes(q.toLowerCase()) ||
      productName(r.product_id).toLowerCase().includes(q.toLowerCase())
  );

  const handleApprove = async (review: Review) => {
    setProcessingId(review.id);
    try {
      const res = await fetch(`${API}/products/admin/reviews/${review.id}/approve`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      toast("Avis approuvé et publié.", "success");
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch {
      toast("Erreur lors de l'approbation.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const confirmReject = async () => {
    if (!reviewToReject) return;
    setProcessingId(reviewToReject.id);
    try {
      const res = await fetch(`${API}/products/admin/reviews/${reviewToReject.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      toast("Avis supprimé.", "success");
      setReviews((prev) => prev.filter((r) => r.id !== reviewToReject.id));
    } catch {
      toast("Erreur lors de la suppression.", "error");
    } finally {
      setProcessingId(null);
      setReviewToReject(null);
    }
  };

  return (
    <div style={{ animation: "fadeUp .4s var(--ease) both" }}>
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
            placeholder="Rechercher un avis…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={dashboardStyles.searchInput}
          />
        </div>
        <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
          {reviews.length} avis en attente
        </span>
      </div>

      <div className={dashboardStyles.tableCard}>
        <table className={dashboardStyles.table}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
              {["Produit", "Client", "Note", "Avis", "Date", "Actions"].map((h, i) => (
                <th key={i} className={dashboardStyles.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filt.map((r, i) => (
              <tr
                key={r.id}
                className={dashboardStyles.tr}
                style={{ animation: `fadeUp .35s var(--ease) ${i * 0.04}s both` }}
              >
                <td className={dashboardStyles.td}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    {productName(r.product_id)}
                  </span>
                </td>
                <td className={dashboardStyles.td}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    {r.author_name}
                  </div>
                  {r.author_email && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.author_email}</div>
                  )}
                </td>
                <td className={dashboardStyles.td}>
                  <span style={{ color: "#e8830a", fontSize: 13 }}>
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </span>
                </td>
                <td className={dashboardStyles.td} style={{ maxWidth: 280 }}>
                  {r.title && (
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{r.title}</div>
                  )}
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.comment}</div>
                </td>
                <td
                  className={dashboardStyles.td}
                  style={{ whiteSpace: "nowrap", fontSize: 12, color: "var(--text-muted)" }}
                >
                  {new Date(r.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className={dashboardStyles.td}>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button
                      title="Approuver"
                      onClick={() => handleApprove(r)}
                      disabled={processingId === r.id}
                      className={`${dashboardStyles.actionBtn} ${dashboardStyles.editBtn}`}
                    >
                      <I.Check />
                    </button>
                    <button
                      title="Supprimer"
                      onClick={() => setReviewToReject(r)}
                      disabled={processingId === r.id}
                      className={`${dashboardStyles.actionBtn} ${dashboardStyles.deleteBtn}`}
                    >
                      <I.Bin />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !filt.length && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
                  Aucun avis en attente
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {reviewToReject && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 14,
              padding: "24px",
              maxWidth: 380,
              width: "90%",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
              <div style={{ color: "var(--red)" }}>
                <I.Warning />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Supprimer l'avis</h3>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>Action irréversible</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 18 }}>
              Supprimer l'avis de <strong>{reviewToReject.author_name}</strong> sur{" "}
              <strong>{productName(reviewToReject.product_id)}</strong> ?
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setReviewToReject(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Annuler
              </button>
              <button
                onClick={confirmReject}
                disabled={processingId === reviewToReject.id}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--red)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <I.Bin /> Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}