"use client";

import { useState, useMemo } from "react";
import { submitProductReview } from "@/lib/api";

interface Review {
  id: number;
  author_name: string;
  rating: number;
  title?: string | null;
  comment: string;
  created_at: string;
}

interface Aggregate {
  average_rating: number;
  review_count: number;
}

const REVIEWS_PER_PAGE = 8;

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }} aria-label={`${rating} étoiles sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" fill={n <= rating ? "#e8a020" : "none"} stroke={n <= rating ? "#e8a020" : "#ccc"} strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

function InteractiveStars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: "0.5rem" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
        >
          <svg width={24} height={24} viewBox="0 0 24 24" fill={(hovered || value) >= n ? "#e8a020" : "none"} stroke={(hovered || value) >= n ? "#e8a020" : "#ccc"} strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
      {value > 0 && (
        <span style={{ fontSize: "0.78rem", color: "#888", fontFamily: "'Helvetica Neue', sans-serif", marginLeft: 4, alignSelf: "center" }}>
          {["", "Médiocre", "Passable", "Bien", "Très bien", "Excellent"][value]}
        </span>
      )}
    </div>
  );
}

function AuthorInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const colors = [
    { bg: "#fdf0e8", color: "#c8402f" },
    { bg: "#e8f4fd", color: "#1a6fa8" },
    { bg: "#eef7ee", color: "#2a6e42" },
    { bg: "#f5eef8", color: "#7d3c98" },
    { bg: "#fef9e7", color: "#9a7d0a" },
  ];
  const pick = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: 38, height: 38, borderRadius: "50%",
      background: pick.bg, color: pick.color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.78rem", fontWeight: 600,
      fontFamily: "'Helvetica Neue', sans-serif",
      flexShrink: 0,
    }}>
      {initials || "?"}
    </div>
  );
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.73rem", fontFamily: "'Helvetica Neue', sans-serif", color: "#888" }}>
      <span style={{ width: 10, textAlign: "right" }}>{star}</span>
      <svg width={12} height={12} viewBox="0 0 24 24" fill="#e8a020" stroke="#e8a020" strokeWidth="1.5" style={{ flexShrink: 0 }}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <div style={{ flex: 1, height: 6, background: "#f0ede7", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#e8a020", borderRadius: 3, transition: "width 0.3s ease" }} />
      </div>
      <span style={{ width: 28, textAlign: "right" }}>{count}</span>
    </div>
  );
}

export default function ReviewsSection({
  productId,
  reviews,
  aggregate,
}: {
  productId: number;
  reviews: Review[];
  aggregate: Aggregate | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ author_name: "", rating: 0, title: "", comment: "" });

  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const visibleReviews = reviews.slice((page - 1) * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE);

  const starCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => { counts[r.rating] = (counts[r.rating] ?? 0) + 1; });
    return counts;
  }, [reviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.rating === 0) { setError("Merci de sélectionner une note."); return; }
    setError(null);
    setSubmitting(true);
    try {
      await submitProductReview(productId, form);
      setSubmitted(true);
      setShowForm(false);
      setForm({ author_name: "", rating: 0, title: "", comment: "" });
    } catch {
      setError("Une erreur est survenue, réessaie plus tard.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.65rem 0.85rem",
    border: "1px solid #e0dbd4",
    borderRadius: 4,
    fontFamily: "'Helvetica Neue', sans-serif",
    fontSize: "0.88rem",
    color: "#333",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  return (
    <section style={{
      maxWidth: 1300,
      margin: "0 auto",
      padding: "3.5rem 4rem 5rem",
      borderTop: "1px solid #ede9e3",
      fontFamily: "'Helvetica Neue', sans-serif",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#1a1a1a", margin: 0, letterSpacing: "-0.01em", fontFamily: "'Georgia', serif" }}>
          Avis clients
        </h2>
        {!showForm && !submitted && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              background: "#1a1a1a", color: "#fff", border: "none",
              padding: "0.62rem 1.35rem", borderRadius: 3,
              fontSize: "0.72rem", letterSpacing: "0.16em",
              textTransform: "uppercase", cursor: "pointer",
              fontFamily: "'Helvetica Neue', sans-serif",
              transition: "background 0.2s",
            }}
          >
            Laisser un avis
          </button>
        )}
      </div>

      {/* Aggregate block */}
      {aggregate && aggregate.review_count > 0 ? (
        <div style={{ display: "flex", gap: "3rem", alignItems: "flex-start", marginBottom: "2.5rem", flexWrap: "wrap" }}>
          {/* Big score */}
          <div style={{ textAlign: "center", minWidth: 80 }}>
            <div style={{ fontSize: "3rem", fontWeight: 700, color: "#1a1a1a", lineHeight: 1, fontFamily: "'Georgia', serif" }}>
              {aggregate.average_rating.toFixed(1)}
            </div>
            <div style={{ marginTop: 6 }}>
              <StarRating rating={Math.round(aggregate.average_rating)} size={15} />
            </div>
            <div style={{ fontSize: "0.72rem", color: "#aaa", marginTop: 5, letterSpacing: "0.06em" }}>
              {aggregate.review_count} avis
            </div>
          </div>
          {/* Bars */}
          <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 }}>
            {[5, 4, 3, 2, 1].map((s) => (
              <RatingBar key={s} star={s} count={starCounts[s] ?? 0} total={aggregate.review_count} />
            ))}
          </div>
        </div>
      ) : (
        <p style={{ fontSize: "0.88rem", color: "#aaa", marginBottom: "2rem" }}>
          Aucun avis pour le moment — soyez le premier à en laisser un !
        </p>
      )}

      {/* Form */}
      {showForm && (
        <div style={{
          background: "#faf9f6",
          border: "1px solid #ede9e3",
          borderRadius: 6,
          padding: "1.75rem",
          marginBottom: "2.5rem",
          maxWidth: 560,
        }}>
          <h3 style={{ fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1a1a1a", marginBottom: "1.25rem", marginTop: 0 }}>
            Votre avis
          </h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div>
              <label style={{ fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#aaa", display: "block", marginBottom: 6 }}>
                Ta note
              </label>
              <InteractiveStars value={form.rating} onChange={(n) => setForm({ ...form, rating: n })} />
            </div>
            <input
              required
              placeholder="Ton nom"
              value={form.author_name}
              onChange={(e) => setForm({ ...form, author_name: e.target.value })}
              style={inputStyle}
            />
            <input
              placeholder="Titre (optionnel)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={inputStyle}
            />
            <textarea
              required
              placeholder="Ton commentaire"
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            {error && <p style={{ color: "#dc2626", fontSize: "0.8rem", margin: 0 }}>{error}</p>}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: "#1a1a1a", color: "#fff", border: "none",
                  padding: "0.75rem 1.75rem", borderRadius: 3,
                  fontSize: "0.73rem", letterSpacing: "0.18em",
                  textTransform: "uppercase", cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                  fontFamily: "'Helvetica Neue', sans-serif",
                }}
              >
                {submitting ? "Envoi…" : "Envoyer mon avis"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(null); }}
                style={{
                  background: "transparent", color: "#888",
                  border: "1px solid #ddd",
                  padding: "0.75rem 1.25rem", borderRadius: 3,
                  fontSize: "0.73rem", letterSpacing: "0.14em",
                  textTransform: "uppercase", cursor: "pointer",
                  fontFamily: "'Helvetica Neue', sans-serif",
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success message */}
      {submitted && (
        <div style={{
          background: "rgba(22, 163, 74, 0.07)",
          border: "1px solid rgba(22, 163, 74, 0.2)",
          borderRadius: 4, padding: "0.9rem 1.1rem",
          color: "#16a34a", fontSize: "0.85rem",
          marginBottom: "2rem", display: "flex", alignItems: "center", gap: 8,
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Merci ! Ton avis sera publié après modération.
        </div>
      )}

      {/* Reviews list */}
      {reviews.length > 0 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
            {visibleReviews.map((r) => {
              const date = new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
              return (
                <div
                  key={r.id}
                  style={{
                    background: "#fff",
                    border: "1px solid #ede9e3",
                    borderRadius: 6,
                    padding: "1.1rem 1.35rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <AuthorInitials name={r.author_name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1a1a1a" }}>
                            {r.author_name}
                          </span>
                          <StarRating rating={r.rating} size={13} />
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "#bbb", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                          {date}
                        </span>
                      </div>
                      {r.title && (
                        <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#333", margin: "0.45rem 0 0.2rem" }}>
                          {r.title}
                        </p>
                      )}
                      <p style={{ color: "#666", fontSize: "0.86rem", margin: r.title ? "0" : "0.45rem 0 0", lineHeight: 1.65 }}>
                        {r.comment}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  width: 34, height: 34, border: "1px solid #ddd",
                  borderRadius: 3, background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer",
                  color: page === 1 ? "#ccc" : "#555",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem",
                }}
                aria-label="Page précédente"
              >‹</button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isVisible = p === 1 || p === totalPages || Math.abs(p - page) <= 1;
                const isEllipsis = !isVisible && (p === 2 || p === totalPages - 1);
                if (isEllipsis) return <span key={p} style={{ color: "#ccc", fontSize: "0.85rem" }}>…</span>;
                if (!isVisible) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: 34, height: 34, border: p === page ? "1px solid #1a1a1a" : "1px solid #ddd",
                      borderRadius: 3,
                      background: p === page ? "#1a1a1a" : "#fff",
                      color: p === page ? "#fff" : "#555",
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      fontFamily: "'Helvetica Neue', sans-serif",
                    }}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  width: 34, height: 34, border: "1px solid #ddd",
                  borderRadius: 3, background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer",
                  color: page === totalPages ? "#ccc" : "#555",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem",
                }}
                aria-label="Page suivante"
              >›</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}