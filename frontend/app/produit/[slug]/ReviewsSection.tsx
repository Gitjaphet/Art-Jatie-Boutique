"use client";

import { useState } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ author_name: "", rating: 5, title: "", comment: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await submitProductReview(productId, form);
      setSubmitted(true);
      setShowForm(false);
    } catch {
      setError("Une erreur est survenue, réessaie plus tard.");
    }
  }

  return (
    <section style={{ marginTop: "3rem", borderTop: "1px solid #eee", paddingTop: "2rem" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>
        Avis clients
      </h2>

      {aggregate ? (
        <p style={{ marginBottom: "1rem", color: "#555" }}>
          ⭐ {aggregate.average_rating}/5 — basé sur {aggregate.review_count} avis
        </p>
      ) : (
        <p style={{ marginBottom: "1rem", color: "#888" }}>
          Aucun avis pour le moment, soyez le premier à en laisser un !
        </p>
      )}

      <ul style={{ listStyle: "none", padding: 0, marginBottom: "1.5rem" }}>
        {reviews.map((r) => (
          <li
            key={r.id}
            style={{ border: "1px solid #eee", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "0.75rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{r.author_name}</strong>
              <span>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
            </div>
            {r.title && <p style={{ fontWeight: 600, margin: "0.25rem 0" }}>{r.title}</p>}
            <p style={{ color: "#444", margin: 0 }}>{r.comment}</p>
          </li>
        ))}
      </ul>

      {submitted ? (
        <p style={{ color: "#16a34a" }}>Merci ! Ton avis sera publié après modération.</p>
      ) : showForm ? (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 420 }}>
          <input
            required
            placeholder="Ton nom"
            value={form.author_name}
            onChange={(e) => setForm({ ...form, author_name: e.target.value })}
            style={{ padding: "0.5rem", border: "1px solid #ddd", borderRadius: 6 }}
          />
          <select
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
            style={{ padding: "0.5rem", border: "1px solid #ddd", borderRadius: 6 }}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} étoiles</option>
            ))}
          </select>
          <input
            placeholder="Titre (optionnel)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={{ padding: "0.5rem", border: "1px solid #ddd", borderRadius: 6 }}
          />
          <textarea
            required
            placeholder="Ton commentaire"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            rows={4}
            style={{ padding: "0.5rem", border: "1px solid #ddd", borderRadius: 6 }}
          />
          {error && <p style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>}
          <button type="submit" style={{ background: "#1a1a1a", color: "#fff", padding: "0.6rem", borderRadius: 6, border: "none" }}>
            Envoyer mon avis
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{ border: "1px solid #1a1a1a", padding: "0.6rem 1.2rem", borderRadius: 6, background: "transparent" }}
        >
          Laisser un avis
        </button>
      )}
    </section>
  );
}