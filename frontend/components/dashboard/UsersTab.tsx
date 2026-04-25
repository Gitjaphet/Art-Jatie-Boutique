"use client";
import React, { useState, useEffect, useCallback } from "react";
import styles from "./AddProductModal.module.css";
import dash from "../../app/admin/dashboard/AdminDashboard.module.css";

type User = { id: number; email: string; is_admin: boolean };

const I = {
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
  Trash: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  ),
  User: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

type Props = {
  toast: (msg: string, type?: "success" | "error") => void;
};

export default function UsersTab({ toast }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/`,
      );
      if (res.ok) setUsers(await res.json());
    } catch {
      toast("Impossible de charger les utilisateurs.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSub(true);
    try {
      const res = await fetch("http://localhost:8000/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, is_admin: isAdmin }),
      });
      if (res.ok) {
        toast("Utilisateur créé avec succès !");
        setEmail("");
        setPassword("");
        setShowForm(false);
        fetchUsers();
      } else {
        const err = await res.json();
        toast(`Erreur : ${err.detail}`, "error");
      }
    } catch {
      toast("Erreur réseau.", "error");
    } finally {
      setSub(false);
    }
  };

  const handleDelete = async (id: number, userEmail: string) => {
    if (!confirm(`Supprimer ${userEmail} ?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/users/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast("Utilisateur supprimé.");
        fetchUsers();
      } else toast("Erreur lors de la suppression.", "error");
    } catch {
      toast("Erreur réseau.", "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Utilisateurs
          </h2>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "3px",
              fontWeight: 500,
            }}
          >
            {users.length} compte{users.length > 1 ? "s" : ""} enregistré
            {users.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={dash.btnPrimary}
        >
          <I.Plus />
          Nouvel utilisateur
        </button>
      </div>

      {/* FORMULAIRE DE CRÉATION */}
      {showForm && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "24px",
            animation: "fadeUp 0.25s var(--ease)",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.2rem",
              fontWeight: 600,
              margin: "0 0 18px",
              color: "var(--text-primary)",
            }}
          >
            Créer un compte
          </h3>

          <div onSubmit={handleSubmit as React.FormEventHandler}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
                marginBottom: "14px",
              }}
            >
              <div className={styles.inputGroup}>
                <label className={styles.label}>Email *</label>
                <input
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@artjatie.mg"
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Mot de passe *</label>
                <input
                  type="password"
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* TOGGLE ADMIN */}
            <div
              onClick={() => setIsAdmin(!isAdmin)}
              className={`${styles.hotToggle} ${isAdmin ? styles.hotToggleActive : ""}`}
              style={{ marginBottom: "18px", cursor: "pointer" }}
            >
              <div
                className={`${styles.hotCheckbox} ${isAdmin ? styles.hotCheckboxActive : ""}`}
              >
                {isAdmin && (
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div className={styles.hotText}>
                <div
                  className={`${styles.hotTitle} ${isAdmin ? styles.hotTitleActive : ""}`}
                >
                  Accès administrateur
                </div>
                <div className={styles.hotSub}>
                  Peut accéder au dashboard et gérer le catalogue
                </div>
              </div>
              <span
                style={{ color: isAdmin ? "var(--rose)" : "var(--text-muted)" }}
              >
                <I.User />
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={styles.btnSecondary}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={sub}
                className={styles.btnPrimary}
              >
                {sub ? (
                  <>
                    <div className={styles.spinnerSmall} /> En cours…
                  </>
                ) : (
                  <>
                    <I.Plus /> Créer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LISTE DES UTILISATEURS */}
      <div className={dash.tableCard}>
        <table className={dash.table}>
          <thead>
            <tr>
              <th className={dash.th}>Email</th>
              <th className={dash.th}>Rôle</th>
              <th className={dash.th}>ID</th>
              <th className={dash.th} style={{ textAlign: "right" }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                  }}
                >
                  Chargement…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                  }}
                >
                  Aucun utilisateur pour le moment.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className={dash.tr}>
                  <td className={dash.td}>
                    <span
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                      }}
                    >
                      {u.email}
                    </span>
                  </td>
                  <td className={dash.td}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: "20px",
                        background: u.is_admin
                          ? "var(--rose-dim)"
                          : "var(--surface2)",
                        color: u.is_admin ? "var(--rose)" : "var(--text-muted)",
                        border: `1px solid ${u.is_admin ? "rgba(190,24,93,0.2)" : "var(--border)"}`,
                      }}
                    >
                      {u.is_admin ? "Administrateur" : "Utilisateur"}
                    </span>
                  </td>
                  <td className={dash.td}>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        fontFamily: "monospace",
                      }}
                    >
                      #{u.id}
                    </span>
                  </td>
                  <td className={dash.td} style={{ textAlign: "right" }}>
                    <button
                      onClick={() => handleDelete(u.id, u.email)}
                      className={`${dash.actionBtn} ${dash.deleteBtn}`}
                      title="Supprimer"
                    >
                      <I.Trash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
