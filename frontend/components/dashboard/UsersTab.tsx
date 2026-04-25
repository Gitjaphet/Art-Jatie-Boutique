"use client";
import React, { useState, useEffect, useCallback } from "react";
import modalStyles from "./AddProductModal.module.css";
import dash from "../../app/admin/dashboard/AdminDashboard.module.css";
import styles from "./UsersTab.module.css";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  Key: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5l3 3L22 7l-3-3" />
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
  X: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Warning: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
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

  // Changement mot de passe
  const [changingPasswordFor, setChangingPasswordFor] = useState<User | null>(
    null,
  );
  const [newPassword, setNewPassword] = useState("");
  const [changingSub, setChangingSub] = useState(false);

  // Suppression
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletingSub, setDeletingSub] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/users/`);
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
      const res = await fetch(`${API}/users/`, {
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

  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeletingSub(true);
    try {
      const res = await fetch(`${API}/users/${userToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast("Utilisateur supprimé.");
        fetchUsers();
        setUserToDelete(null);
      } else toast("Erreur lors de la suppression.", "error");
    } catch {
      toast("Erreur réseau.", "error");
    } finally {
      setDeletingSub(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changingPasswordFor || !newPassword) return;
    setChangingSub(true);
    try {
      const res = await fetch(
        `${API}/users/${changingPasswordFor.id}/password`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_password: newPassword }),
        },
      );
      if (res.ok) {
        toast("Mot de passe modifié avec succès !");
        setChangingPasswordFor(null);
        setNewPassword("");
      } else {
        const err = await res.json();
        toast(`Erreur : ${err.detail}`, "error");
      }
    } catch {
      toast("Erreur réseau.", "error");
    } finally {
      setChangingSub(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* ── MODAL CHANGER MOT DE PASSE ── */}
      {changingPasswordFor && (
        <div
          className={styles.overlay}
          onClick={(e) =>
            e.target === e.currentTarget && setChangingPasswordFor(null)
          }
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Changer le mot de passe</h3>
                <p className={styles.modalSubtitle}>
                  {changingPasswordFor.email}
                </p>
              </div>
              <button
                className={styles.closeBtn}
                onClick={() => {
                  setChangingPasswordFor(null);
                  setNewPassword("");
                }}
              >
                <I.X />
              </button>
            </div>
            <div className={modalStyles.inputGroup}>
              <label className={modalStyles.label}>
                Nouveau mot de passe *
              </label>
              <input
                type="password"
                className={modalStyles.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                autoFocus
              />
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnCancel}
                onClick={() => {
                  setChangingPasswordFor(null);
                  setNewPassword("");
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingSub || newPassword.length < 6}
                className={modalStyles.btnPrimary}
              >
                {changingSub ? (
                  <>
                    <div className={modalStyles.spinnerSmall} /> En cours…
                  </>
                ) : (
                  <>
                    <I.Key /> Confirmer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL SUPPRIMER ── */}
      {userToDelete && (
        <div
          className={styles.overlay}
          onClick={(e) => e.target === e.currentTarget && setUserToDelete(null)}
        >
          <div className={styles.deleteModal}>
            <div className={styles.deleteHeader}>
              <div className={styles.warningIcon}>
                <I.Warning />
              </div>
              <div>
                <h3 className={styles.deleteTitle}>
                  Supprimer l&apos;utilisateur
                </h3>
                <p className={styles.deleteSubtitle}>Action irréversible</p>
              </div>
            </div>
            <p className={styles.deleteText}>
              Êtes-vous sûr de vouloir supprimer{" "}
              <strong>{userToDelete.email}</strong> ?<br />
              Ce compte sera définitivement effacé.
            </p>
            <div className={styles.deleteActions}>
              <button
                className={styles.btnCancel}
                onClick={() => setUserToDelete(null)}
                disabled={deletingSub}
              >
                Annuler
              </button>
              <button
                className={styles.btnConfirm}
                onClick={handleDelete}
                disabled={deletingSub}
              >
                {deletingSub ? (
                  <>
                    <div className={styles.spinnerSmall} /> Suppression…
                  </>
                ) : (
                  <>
                    <I.Trash /> Oui, supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
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
          <I.Plus /> Nouvel utilisateur
        </button>
      </div>

      {/* ── FORMULAIRE CRÉATION ── */}
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
              marginBottom: "14px",
            }}
          >
            <div className={modalStyles.inputGroup}>
              <label className={modalStyles.label}>Email *</label>
              <input
                type="email"
                className={modalStyles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@artjatie.mg"
                required
              />
            </div>
            <div className={modalStyles.inputGroup}>
              <label className={modalStyles.label}>Mot de passe *</label>
              <input
                type="password"
                className={modalStyles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>
          <div
            onClick={() => setIsAdmin(!isAdmin)}
            className={`${modalStyles.hotToggle} ${isAdmin ? modalStyles.hotToggleActive : ""}`}
            style={{ marginBottom: "18px", cursor: "pointer" }}
          >
            <div
              className={`${modalStyles.hotCheckbox} ${isAdmin ? modalStyles.hotCheckboxActive : ""}`}
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
            <div className={modalStyles.hotText}>
              <div
                className={`${modalStyles.hotTitle} ${isAdmin ? modalStyles.hotTitleActive : ""}`}
              >
                Accès administrateur
              </div>
              <div className={modalStyles.hotSub}>
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
            style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
          >
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className={modalStyles.btnSecondary}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={sub}
              className={modalStyles.btnPrimary}
            >
              {sub ? (
                <>
                  <div className={modalStyles.spinnerSmall} /> En cours…
                </>
              ) : (
                <>
                  <I.Plus /> Créer
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── LISTE ── */}
      <div className={dash.tableCard}>
        <table className={dash.table}>
          <thead>
            <tr>
              <th className={dash.th}>Email</th>
              <th className={dash.th}>Rôle</th>
              <th className={dash.th}>ID</th>
              <th className={dash.th} style={{ textAlign: "right" }}>
                Actions
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
                  Aucun utilisateur.
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
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => {
                          setChangingPasswordFor(u);
                          setNewPassword("");
                        }}
                        className={`${dash.actionBtn} ${dash.editBtn}`}
                        title="Changer le mot de passe"
                      >
                        <I.Key />
                      </button>
                      <button
                        onClick={() => setUserToDelete(u)}
                        className={`${dash.actionBtn} ${dash.deleteBtn}`}
                        title="Supprimer"
                      >
                        <I.Trash />
                      </button>
                    </div>
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
