"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Euro,
  Check,
  Tags,
  Palette,
  Maximize,
  Settings2,
  Loader2,
  Users,
  Plus,
  X,
  Info,
  Ruler,
  RefreshCw,
  Layers,
} from "lucide-react";
import styles from "./SettingsTab.module.css";

// ─── TYPES ────────────────────────────────────────────────────────────────────

/**
 * Une taille peut désormais être associée à PLUSIEURS genres.
 * Ex: { nom: "XL", genres: ["Femme", "Homme"] }
 *
 * RÉTROCOMPATIBILITÉ : l'ancien format { nom, genre: string } est converti
 * automatiquement à l'initialisation.
 *
 * CÔTÉ BACKEND : new_sizes est envoyé en JSON stringify de SizeItem[].
 * Pour filtrer dans le catalogue produit :
 *   sizes.filter(s => s.genres.includes("Tous") || s.genres.includes(selectedGenre))
 */
export type SizeItem = {
  nom: string;
  genres: string[]; // "Tous" = universel
};

type SettingsData = {
  exchange_rate_eur?: string | number;
  available_colors?: string;
  available_sizes?: string;
  available_categories?: string;
  available_genres?: string;
};

type SettingsTabProps = {
  toast: (msg: string, type?: "success" | "error") => void;
  initialSettings: SettingsData | null;
  refreshSettings: () => void;
};

type ActiveTab = "general" | "catalogue" | "tailles";

// ─── UTILS ────────────────────────────────────────────────────────────────────

// Parse le format sauvegardé (JSON ou ancien format CSV/objet genre:string)
function parseSizes(raw?: string): SizeItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        nom: item.nom ?? item.name ?? "",
        // Supporte l'ancien champ `genre` (string) ET le nouveau `genres` (string[])
        genres: Array.isArray(item.genres)
          ? item.genres
          : item.genre
          ? [item.genre]
          : ["Tous"],
      }));
    }
  } catch {
    // Ancien format CSV simple : "XS,S,M,L,XL"
    return raw.split(",").map(s => ({ nom: s.trim(), genres: ["Tous"] }));
  }
  return [];
}

// Palette couleurs pour les dots
const COLOR_PALETTE: Record<string, string> = {
  rouge: "#ef4444", rose: "#ec4899", "rose bombon": "#f472b6",
  "rose foussia": "#e11d87", orange: "#f97316", jaune: "#eab308",
  vert: "#22c55e", "vert olive": "#6b7280", bleu: "#3b82f6",
  marine: "#1e3a8a", violet: "#8b5cf6", gris: "#9ca3af",
  blanc: "#e5e7eb", noir: "#1f2937", beige: "#d4b896",
  turquoise: "#14b8a6", bordeaux: "#7f1d1d", lavande: "#c4b5fd",
  corail: "#fb7185", kaki: "#84855e", marron: "#92400e",
  or: "#d97706", argent: "#94a3b8", multicolore: "linear-gradient(135deg,#f472b6,#60a5fa,#34d399)",
};

function getColorStyle(name: string): string | null {
  const key = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [k, v] of Object.entries(COLOR_PALETTE)) {
    const kn = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (key === kn || key.includes(kn)) return v;
  }
  return null;
}

// ─── SOUS-COMPOSANT : TagInput ─────────────────────────────────────────────────

function TagInput({
  list,
  setList,
  placeholder = "Taper puis Entrée…",
  withColorDot = false,
}: {
  list: string[];
  setList: (v: string[]) => void;
  placeholder?: string;
  withColorDot?: boolean;
}) {
  const [val, setVal] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const add = () => {
    const t = val.trim();
    if (t && !list.includes(t)) { setList([...list, t]); setVal(""); }
  };

  return (
    <div className={styles.tagField} onClick={() => ref.current?.focus()}>
      {list.map(item => {
        const colorStyle = withColorDot ? getColorStyle(item) : null;
        return (
          <span key={item} className={styles.tag}>
            {colorStyle && (
              <span
                className={styles.colorDot}
                style={
                  colorStyle.startsWith("linear")
                    ? { background: colorStyle }
                    : { backgroundColor: colorStyle }
                }
              />
            )}
            {item}
            <button
              type="button"
              className={styles.tagRemove}
              onClick={() => setList(list.filter(i => i !== item))}
              aria-label={`Retirer ${item}`}
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          </span>
        );
      })}
      <input
        ref={ref}
        type="text"
        className={styles.tagInput}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") { e.preventDefault(); add(); }
          if (e.key === "Backspace" && !val && list.length) {
            setList(list.slice(0, -1));
          }
        }}
        placeholder={list.length === 0 ? placeholder : ""}
      />
    </div>
  );
}

// ─── SOUS-COMPOSANT : SizeModal ────────────────────────────────────────────────

function SizeModal({
  genres,
  onAdd,
  onClose,
}: {
  genres: string[];
  onAdd: (item: SizeItem) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const toggleGenre = (g: string) => {
    if (g === "Tous") {
      // "Tous" est exclusif
      setSelected(prev => prev.includes("Tous") ? [] : ["Tous"]);
      return;
    }
    setSelected(prev => {
      const without = prev.filter(x => x !== "Tous"); // retire "Tous" si on choisit un genre précis
      return without.includes(g)
        ? without.filter(x => x !== g)
        : [...without, g];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selected.length === 0) return;
    onAdd({ nom: name.trim(), genres: selected });
    onClose();
  };

  const allOptions = ["Tous", ...genres];
  const canSubmit = name.trim().length > 0 && selected.length > 0;

  return (
    <div
      className={styles.overlay}
      onClick={e => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="sz-title">
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon}><Ruler size={17} /></div>
            <div>
              <h3 id="sz-title" className={styles.modalTitle}>Nouvelle taille</h3>
              <p className={styles.modalSub}>Nom + un ou plusieurs genres cibles</p>
            </div>
          </div>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Fermer">
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>

            {/* Nom */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="sz-name">Nom de la taille</label>
              <input
                id="sz-name"
                className={styles.input}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex : XL, 0–6 mois, 38/40, Unique…"
                required
                autoFocus
              />
            </div>

            {/* Genres — MULTI-SELECT */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Genres cibles
                <span style={{ marginLeft: 6, fontWeight: 400, textTransform: "none", fontSize: 10, opacity: .7 }}>
                  (plusieurs possibles)
                </span>
              </label>

              {allOptions.length === 1 ? (
                <div className={styles.infoBanner}>
                  <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>
                    Ajoutez d'abord des genres dans l'onglet <strong>Catalogue</strong> pour affiner par audience.
                  </span>
                </div>
              ) : (
                <>
                  <div className={styles.genrePillsGrid}>
                    {allOptions.map(g => {
                      const active = selected.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          className={`${styles.genrePill} ${active ? styles.genrePillActive : ""}`}
                          onClick={() => toggleGenre(g)}
                        >
                          {active && (
                            <span className={styles.genrePillCheck} aria-hidden="true">
                              <Check size={9} strokeWidth={3} color="#fff" />
                            </span>
                          )}
                          {g === "Tous" ? "Universel (tous)" : g}
                        </button>
                      );
                    })}
                  </div>
                  <p className={styles.genrePillsHint}>
                    Sélectionnez <strong>Universel</strong> pour ignorer le filtre genre, ou cochez plusieurs genres spécifiques.
                  </p>
                </>
              )}
            </div>

          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Annuler</button>
            <button type="submit" className={styles.btnPrimary} disabled={!canSubmit}>
              <Plus size={14} strokeWidth={2.5} />
              Ajouter la taille
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ───────────────────────────────────────────────────────

export default function SettingsTab({ toast, initialSettings, refreshSettings }: SettingsTabProps) {
  const [activeTab, setActiveTab]         = useState<ActiveTab>("general");
  const [rate, setRate]                   = useState("");
  const [cats, setCats]                   = useState<string[]>([]);
  const [genres, setGenres]               = useState<string[]>([]);
  const [colors, setColors]               = useState<string[]>([]);
  const [sizes, setSizes]                 = useState<SizeItem[]>([]);
  const [saving, setSaving]               = useState(false);
  const [lastSaved, setLastSaved]         = useState<Date | null>(null);
  const [sizeModalOpen, setSizeModalOpen] = useState(false);

  // Init
  useEffect(() => {
    if (!initialSettings) return;
    setRate(String(initialSettings.exchange_rate_eur ?? ""));
    setCats(
      initialSettings.available_categories
        ?.split(",").map(s => s.trim()).filter(Boolean) ?? []
    );
    setGenres(
      initialSettings.available_genres
        ?.split(",").map(s => s.trim()).filter(Boolean) ?? []
    );
    setColors(
      initialSettings.available_colors
        ?.split(",").map(s => s.trim()).filter(Boolean) ?? []
    );
    setSizes(parseSizes(initialSettings.available_sizes));
  }, [initialSettings]);

  // Save
  const save = useCallback(async () => {
    setSaving(true);
    try {
      const params = new URLSearchParams();
      if (rate) params.append("new_rate", rate);
      params.append("new_categories", cats.join(","));
      params.append("new_genres", genres.join(","));
      params.append("new_colors", colors.join(","));
      params.append("new_sizes", JSON.stringify(sizes));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/settings/?${params}`,
        { method: "PATCH" }
      );
      if (res.ok) {
        toast("Paramètres enregistrés !", "success");
        setLastSaved(new Date());
        refreshSettings();
      } else {
        toast("Erreur lors de la sauvegarde.", "error");
      }
    } catch {
      toast("Erreur réseau.", "error");
    } finally {
      setSaving(false);
    }
  }, [rate, cats, genres, colors, sizes, toast, refreshSettings]);

  const removeSize = (idx: number) => setSizes(prev => prev.filter((_, i) => i !== idx));

  // Grouper les tailles : une taille peut apparaître dans plusieurs groupes
  // On affiche chaque taille une seule fois groupée par son premier genre (ou "Tous")
  const sizeGroups = sizes.reduce<Record<string, SizeItem[]>>((acc, sz) => {
    const key = sz.genres[0] ?? "Tous";
    if (!acc[key]) acc[key] = [];
    acc[key].push(sz);
    return acc;
  }, {});

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "general",   label: "Général",   icon: <Euro size={13} /> },
    { id: "catalogue", label: "Catalogue", icon: <Layers size={13} />, count: cats.length + genres.length + colors.length },
    { id: "tailles",   label: "Tailles",   icon: <Ruler size={13} />, count: sizes.length },
  ];

  return (
    <div className={styles.wrapper}>

      {sizeModalOpen && (
        <SizeModal
          genres={genres}
          onAdd={sz => setSizes(prev => [...prev, sz])}
          onClose={() => setSizeModalOpen(false)}
        />
      )}

      <div className={styles.card}>

        {/* ── HEADER ── */}
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderIcon}><Settings2 size={19} /></div>
          <div style={{ flex: 1 }}>
            <h2 className={styles.cardHeaderTitle}>Configuration boutique</h2>
            <p className={styles.cardHeaderSub}>Paramètres dynamiques du catalogue produit</p>
          </div>
          <span className={styles.cardHeaderBadge}>Admin</span>
        </div>

        {/* ── TABS ── */}
        <div className={styles.tabs} role="tablist">
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.icon} {t.label}
              {t.count !== undefined && (
                <span className={styles.tabCount}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── BODY ── */}
        <div className={styles.cardBody}>

          {/* ── GÉNÉRAL ── */}
          {activeTab === "general" && (
            <>
              <div className={styles.section}>
                <div className={styles.sectionLabel}><Euro size={13} /> Taux de change</div>
                <div className={styles.rateRow}>
                  <div className={styles.rateWrap}>
                    <input
                      type="number"
                      className={styles.input}
                      value={rate}
                      onChange={e => setRate(e.target.value)}
                      placeholder="4500"
                      min={0}
                    />
                    <span className={styles.rateUnit}>Ar / €</span>
                  </div>
                  {Number(rate) > 0 && (
                    <div className={styles.ratePreview}>
                      <Euro size={12} />
                      <span>1 € =</span>
                      <span className={styles.ratePreviewVal}>
                        {Number(rate).toLocaleString("fr-FR")} Ar
                      </span>
                    </div>
                  )}
                </div>
                <p className={styles.sectionHint}>
                  Utilisé pour la conversion automatique des prix en boutique.
                </p>
              </div>
              <hr className={styles.divider} />
              <div className={styles.infoBanner}>
                <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  Les catégories, genres, couleurs et tailles sont dans les onglets
                  {" "}<strong>Catalogue</strong> et <strong>Tailles</strong>.
                  Pensez à enregistrer après chaque modification.
                </span>
              </div>
            </>
          )}

          {/* ── CATALOGUE ── */}
          {activeTab === "catalogue" && (
            <>
              <div className={styles.section}>
                <div className={styles.sectionLabel}><Tags size={13} /> Catégories produit</div>
                <TagInput list={cats} setList={setCats} placeholder="Ex : Robes, Tops, Accessoires…" />
                <p className={styles.sectionHint}>
                  Entrée pour valider · Backspace pour supprimer le dernier tag.
                </p>
              </div>

              <hr className={styles.divider} />

              <div className={styles.section}>
                <div className={styles.sectionLabel}><Users size={13} /> Genres / Cibles</div>
                <TagInput list={genres} setList={setGenres} placeholder="Ex : Femme, Homme, Enfant…" />
                <p className={styles.sectionHint}>
                  Les genres définis ici seront proposés lors de la création d'une taille.
                </p>
              </div>

              <hr className={styles.divider} />

              <div className={styles.section}>
                <div className={styles.sectionLabel}><Palette size={13} /> Couleurs disponibles</div>
                <TagInput
                  list={colors}
                  setList={setColors}
                  placeholder="Ex : Rouge, Bleu Marine, Crème…"
                  withColorDot
                />
                <p className={styles.sectionHint}>
                  Les couleurs reconnues affichent un dot de prévisualisation.
                </p>
              </div>
            </>
          )}

          {/* ── TAILLES ── */}
          {activeTab === "tailles" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionLabel}><Maximize size={13} /> Tailles par genre</div>
                <button type="button" className={styles.btnAdd} onClick={() => setSizeModalOpen(true)}>
                  <Plus size={12} strokeWidth={2.5} /> Ajouter
                </button>
              </div>

              <div className={styles.sizesPanel}>
                {sizes.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><Maximize size={18} /></div>
                    <p className={styles.emptyText}>Aucune taille configurée</p>
                    <p className={styles.emptySub}>Cliquez sur « Ajouter » pour créer votre première taille.</p>
                  </div>
                ) : (
                  Object.entries(sizeGroups).map(([group, items]) => (
                    <div key={group} className={styles.sizeGroup}>
                      <div className={styles.sizeGroupLabel}>{group}</div>
                      <div className={styles.sizeChips}>
                        {items.map(sz => {
                          const idx = sizes.indexOf(sz);
                          return (
                            <span key={idx} className={styles.sizeChip}>
                              <span className={styles.sizeChipName}>{sz.nom}</span>
                              {/* Affiche les genres associés si plusieurs ou différent du groupe */}
                              {(sz.genres.length > 1 || sz.genres[0] !== group) && (
                                <span className={styles.sizeChipGenres}>
                                  {sz.genres.map(g => (
                                    <span key={g} className={styles.sizeChipGenrePill}>{g}</span>
                                  ))}
                                </span>
                              )}
                              <button
                                type="button"
                                className={styles.sizeChipRemove}
                                onClick={() => removeSize(idx)}
                                aria-label={`Supprimer ${sz.nom}`}
                              >
                                <X size={13} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <p className={styles.sectionHint}>
                Une taille peut couvrir plusieurs genres. Côté produit, filtrez avec&nbsp;
                <code style={{ fontSize: 11, background: "var(--st-surface3)", padding: "1px 5px", borderRadius: 4 }}>
                  sizes.filter(s =&gt; s.genres.includes("Tous") || s.genres.includes(genre))
                </code>.
              </p>
            </div>
          )}

        </div>

        {/* ── FOOTER ── */}
        <div className={styles.cardFooter}>
          <div className={styles.footerStatus}>
            <span
              className={`${styles.statusDot} ${lastSaved ? styles.statusDotGreen : styles.statusDotAmber}`}
            />
            {lastSaved
              ? `Enregistré à ${lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
              : "Modifications non enregistrées"}
          </div>
          <div className={styles.footerRight}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={refreshSettings}
              title="Recharger depuis le serveur"
            >
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={save}
              disabled={saving}
            >
              {saving
                ? <><Loader2 size={14} className={styles.spinner} /> Sauvegarde…</>
                : <><Check size={14} strokeWidth={2.5} /> Enregistrer</>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}