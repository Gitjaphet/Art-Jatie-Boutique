"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ExternalLink, Edit2, Trash2, X, Save, User } from "lucide-react";
import styles from "./ClientsTab.module.css";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Client = {
  id: number;
  name: string;
  email: string | null;
  whatsapp: string;
  total_spent: number;
  total_orders: number;
  favorite_categories: string;
  favorite_colors: string;
  created_at: string;
};

type Props = {
  toast: (msg: string, type?: "success" | "error") => void;
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export default function ClientsTab({ toast }: Props) {
  const [clients, setClients]           = useState<Client[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [isSaving, setIsSaving]         = useState(false);
  const [isDeleting, setIsDeleting]     = useState(false);

  // Form state
  const [editName, setEditName]         = useState("");
  const [editEmail, setEditEmail]       = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editCats, setEditCats]         = useState("");
  const [editColors, setEditColors]     = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // ── Fetch ──
  const fetchClients = async () => {
    try {
      const res = await fetch(`${API}/clients/`);
      if (!res.ok) throw new Error();
      setClients(await res.json());
    } catch {
      toast("Erreur lors du chargement des clients.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  // ── Filtrage ──
  const filtered = useMemo(() =>
    clients.filter(c =>
      (c.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (c.whatsapp || "").includes(search)
    ), [clients, search]
  );

  // ── Edit ──
  const openEdit = (c: Client) => {
    setEditingClient(c);
    setEditName(c.name);
    setEditEmail(c.email || "");
    setEditWhatsapp(c.whatsapp);
    setEditCats(c.favorite_categories || "");
    setEditColors(c.favorite_colors || "");
  };

  const saveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API}/clients/${editingClient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName, email: editEmail, whatsapp: editWhatsapp,
          favorite_categories: editCats, favorite_colors: editColors,
        }),
      });
      if (res.ok) {
        toast("Fiche client mise à jour !", "success");
        fetchClients();
        setEditingClient(null);
      } else {
        toast("Erreur lors de la mise à jour.", "error");
      }
    } catch {
      toast("Erreur réseau.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ──
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API}/clients/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Client supprimé avec succès.", "success");
        fetchClients();
        setDeleteTarget(null);
      } else {
        toast("Erreur lors de la suppression.", "error");
      }
    } catch {
      toast("Erreur réseau.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.wrapper}>

      {/* ── MODAL ÉDITION ── */}
      {editingClient && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setEditingClient(null)}>
          <div className={styles.modal}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <div className={styles.modalHeaderIcon}><User size={17} /></div>
                <div>
                  <h3 className={styles.modalTitle}>Éditer le client</h3>
                  <p className={styles.modalSub}>{editingClient.name}</p>
                </div>
              </div>
              <button className={styles.modalClose} onClick={() => setEditingClient(null)} aria-label="Fermer">
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={saveClient}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Nom complet</label>
                    <input className={styles.formInput} value={editName} onChange={e => setEditName(e.target.value)} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>WhatsApp</label>
                    <input className={styles.formInput} value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)} required />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email</label>
                  <input type="email" className={styles.formInput} value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Catégories préférées</label>
                  <input className={styles.formInput} value={editCats} onChange={e => setEditCats(e.target.value)} placeholder="Ex : Robes, Sacs…" />
                  <p className={styles.formHint}>Utilisé pour personnaliser les recommandations IA</p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Couleurs préférées</label>
                  <input className={styles.formInput} value={editColors} onChange={e => setEditColors(e.target.value)} placeholder="Ex : Rouge, Beige…" />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={() => setEditingClient(null)}>
                  Annuler
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isSaving}>
                  {isSaving ? <><div className={styles.spinner} /> Enregistrement…</> : <><Save size={14} /> Enregistrer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRM SUPPRESSION ── */}
      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className={styles.confirmBox}>
            <p className={styles.confirmTitle}>Supprimer ce client ?</p>
            <p className={styles.confirmText}>
              <strong>{deleteTarget.name}</strong> sera retiré de votre base CRM. Cette action est irréversible.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.btnSecondary} onClick={() => setDeleteTarget(null)}>Annuler</button>
              <button className={styles.btnDanger} onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? <><div className={styles.spinner} /> Suppression…</> : <><Trash2 size={13} /> Supprimer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOOLBAR ── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Rechercher par nom ou WhatsApp…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <p className={styles.toolbarMeta}>
          <span className={styles.toolbarMetaCount}>{filtered.length}</span> client{filtered.length > 1 ? "s" : ""}
          {search && ` · filtre : "${search}"`}
        </p>
      </div>

      {/* ── TABLE ── */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>Chargement de la base clients…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>Aucun client trouvé.</div>
        ) : (
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Client</th>
                <th className={styles.th}>Contact</th>
                <th className={styles.th}>Statut & préférences</th>
                <th className={styles.th}>Total dépensé</th>
                <th className={`${styles.th} ${styles.thRight}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const isFidele = c.total_orders >= 5;
                return (
                  <tr
                    key={c.id}
                    className={styles.tr}
                    style={{ animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}
                  >
                    {/* CLIENT */}
                    <td className={styles.td}>
                      <div className={styles.clientName}>{c.name}</div>
                      {c.email && <div className={styles.clientEmail}>{c.email}</div>}
                    </td>

                    {/* CONTACT */}
                    <td className={styles.td}>
                      <span className={styles.contactChip}>{c.whatsapp}</span>
                    </td>

                    {/* STATUT */}
                    <td className={styles.td}>
                      <div className={styles.statusWrap}>
                        <div className={styles.statusRow}>
                          {isFidele ? (
                            <span className={styles.badgeFidele}>⭐ Fidèle</span>
                          ) : (
                            <span className={styles.badgeStandard}>Standard</span>
                          )}
                          <span className={styles.cmdCount}>{c.total_orders} cmd{c.total_orders > 1 ? "s" : ""}</span>
                        </div>
                        {(c.favorite_categories || c.favorite_colors) && (
                          <div className={styles.prefRow}>
                            {c.favorite_categories && (
                              <div><span className={styles.prefLabel}>Aime :</span>{c.favorite_categories}</div>
                            )}
                            {c.favorite_colors && (
                              <div><span className={styles.prefLabel}>Couleurs :</span>{c.favorite_colors}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* MONTANT */}
                    <td className={styles.td}>
                      <span className={styles.amount}>
                        {c.total_spent.toLocaleString("fr-FR")} Ar
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className={`${styles.td} ${styles.tdRight}`}>
                      <div className={styles.actions}>
                        <a
                          href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${styles.actionBtn} ${styles.actionBtnWa}`}
                          title="Ouvrir WhatsApp"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                          onClick={() => openEdit(c)}
                          title="Éditer"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDel}`}
                          onClick={() => setDeleteTarget(c)}
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}