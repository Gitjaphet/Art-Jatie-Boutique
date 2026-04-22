"use client";

import { useState } from "react";
import {
  Euro,
  Check,
  Tags,
  Palette,
  Maximize,
  Settings2,
  Loader2,
} from "lucide-react";
import styles from "../../app/admin/dashboard/AdminDashboard.module.css";

// ─── NOUVEAU TYPE : Définition stricte des paramètres ───
type SettingsData = {
  exchange_rate_eur?: string | number;
  available_colors?: string;
  available_sizes?: string;
  available_categories?: string;
};

type SettingsTabProps = {
  toast: (msg: string, type?: "success" | "error") => void;
  initialSettings: SettingsData | null;
  refreshSettings: () => void;
};
// ────────────────────────────────────────────────────────

export default function SettingsTab({
  toast,
  initialSettings,
  refreshSettings,
}: SettingsTabProps) {
  const [rate, setRate] = useState(initialSettings?.exchange_rate_eur || "");
  const [colors, setColors] = useState(initialSettings?.available_colors || "");
  const [sizes, setSizes] = useState(initialSettings?.available_sizes || "");
  const [cats, setCats] = useState(initialSettings?.available_categories || "");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const params = new URLSearchParams();
      if (rate) params.append("new_rate", rate.toString());
      if (colors) params.append("new_colors", colors);
      if (sizes) params.append("new_sizes", sizes);
      if (cats) params.append("new_categories", cats);
      const res = await fetch(
        `http://localhost:8000/settings/?${params.toString()}`,
        { method: "PATCH" },
      );
      if (res.ok) {
        toast("Réglages enregistrés avec succès !");
        refreshSettings();
      } else toast("Erreur lors de la sauvegarde.", "error");
    } catch (err) {
      console.error("Erreur de sauvegarde :", err); // Utilisation de 'err' pour le linter
      toast("Erreur réseau.", "error");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    {
      label: "Taux de change",
      hint: "1 Euro = X Ariary",
      v: rate,
      set: setRate,
      type: "number",
      pl: "5200",
      icon: <Euro size={16} strokeWidth={2} />,
    },
    {
      label: "Catégories",
      hint: "Séparées par virgules. Ex: TENUES, ACCESSOIRES, MAISON",
      v: cats,
      set: setCats,
      type: "text",
      pl: "TENUES, ACCESSOIRES…",
      icon: <Tags size={16} strokeWidth={2} />,
    },
    {
      label: "Couleurs disponibles",
      hint: "Séparées par virgules",
      v: colors,
      set: setColors,
      type: "text",
      pl: "Naturel, Blanc…",
      icon: <Palette size={16} strokeWidth={2} />,
    },
    {
      label: "Tailles disponibles",
      hint: "Séparées par virgules",
      v: sizes,
      set: setSizes,
      type: "text",
      pl: "XS, S, M…",
      icon: <Maximize size={16} strokeWidth={2} />,
    },
  ];

  return (
    <div
      style={{ animation: "fadeUp .4s var(--ease) both", maxWidth: "660px" }}
    >
      <div className={styles.card} style={{ padding: 0 }}>
        <div
          style={{
            padding: "22px 26px 18px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--primary-light)",
              color: "var(--primary)",
              padding: "8px",
              borderRadius: "8px",
              display: "flex",
            }}
          >
            <Settings2 size={20} />
          </div>
          <div>
            <h3
              className={styles.cardTitle}
              style={{ margin: 0, paddingBottom: 0, borderBottom: "none" }}
            >
              Configuration de la Boutique
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "2px",
                fontWeight: "500",
                margin: 0,
              }}
            >
              Paramètres globaux Art Jatie
            </p>
          </div>
        </div>

        <form onSubmit={save}>
          <div
            style={{
              padding: "22px 26px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {fields.map((fd, i) => (
              <div
                key={fd.label}
                className={styles.inputGroup}
                style={{
                  animation: `fadeUp .4s var(--ease) ${i * 0.06}s both`,
                  marginBottom: 0,
                }}
              >
                <label className={styles.label}>{fd.label}</label>
                <div style={{ position: "relative" }}>
                  {fd.icon && (
                    <div
                      style={{
                        position: "absolute",
                        left: "13px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {fd.icon}
                    </div>
                  )}
                  <input
                    type={fd.type}
                    className={styles.input}
                    style={{ paddingLeft: fd.icon ? "38px" : "14px" }}
                    value={fd.v}
                    onChange={(e) => fd.set(e.target.value)}
                    required
                    placeholder={fd.pl}
                  />
                </div>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "5px",
                  }}
                >
                  {fd.hint}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: "18px 26px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "flex-end",
              background: "var(--surface2)",
            }}
          >
            <button
              type="submit"
              disabled={saving}
              className={styles.btnPrimary}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {saving ? (
                <>
                  <Loader2
                    size={16}
                    className={styles.spinner}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Sauvegarde…
                </>
              ) : (
                <>
                  <Check size={16} strokeWidth={3} />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
