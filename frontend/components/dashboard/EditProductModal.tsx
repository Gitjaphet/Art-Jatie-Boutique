import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./EditProductModal.module.css"; // ✅ son propre CSS
import Image from "next/image";

const I = {
  X: () => (
    <svg
      width="17"
      height="17"
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
  Upload: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  ),
  Fire: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M12 2c0 6-6 8-6 13a6 6 0 0 0 12 0c0-5-6-7-6-13z" />
    </svg>
  ),
  Check: () => (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Save: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
};

type ProductType = {
  id: number;
  name: string;
  price_ar: number;
  category: string;
  genre: string;
  tag?: string;
  badge: string;
  stock_quantity?: number;
  is_hot?: boolean;
  hot?: boolean;
  colors?: string;
  sizes?: string;
  image: string;
};

type EditProductModalProps = {
  productToEdit: ProductType;
  onClose: () => void;
  onSuccess: () => void;
  toast: (msg: string, type?: "success" | "error") => void;
  settings: Record<string, unknown> | null;
};

export default function EditProductModal({
  productToEdit,
  onClose,
  onSuccess,
  toast,
  settings,
}: EditProductModalProps) {
  const [sub, setSub] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [cat, setCat] = useState("");
  const [genre, setGenre] = useState("");
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState("");
  const [qty, setQty] = useState("");
  const [hot, setHot] = useState(false);
  const [cols, setCols] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [img, setImg] = useState<File | null>(null);
  const [prev, setPrev] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setPrice(productToEdit.price_ar.toString());
      setCat(productToEdit.category);
      setGenre(productToEdit.genre);
      setTag(productToEdit.tag || "");
      setStatus(productToEdit.badge);
      setQty((productToEdit.stock_quantity || 1).toString());
      setHot(productToEdit.is_hot || productToEdit.hot || false);
      setCols(
        productToEdit.colors
          ? productToEdit.colors.split(",").map((c) => c.trim())
          : [],
      );
      setSizes(
        productToEdit.sizes
          ? productToEdit.sizes.split(",").map((s) => s.trim())
          : [],
      );
      setPrev(productToEdit.image);
    }
  }, [productToEdit]);

  const COLORS = useMemo(() => {
    const val = settings?.available_colors;
    return typeof val === "string" ? val.split(",").map((c) => c.trim()) : [];
  }, [settings?.available_colors]);

  const SIZES = useMemo(() => {
    const val = settings?.available_sizes;
    return typeof val === "string" ? val.split(",").map((s) => s.trim()) : [];
  }, [settings?.available_sizes]);

  const CATS = useMemo(() => {
    const val = settings?.available_categories;
    return typeof val === "string" ? val.split(",").map((c) => c.trim()) : [];
  }, [settings?.available_categories]);

  const tog = useCallback(
    (
      item: string,
      list: string[],
      setList: React.Dispatch<React.SetStateAction<string[]>>,
    ) => {
      setList((prev) =>
        prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
      );
    },
    [],
  );

  const onFile = (f: File) => {
    if (!f || !f.type.startsWith("image/")) return;
    setImg(f);
    if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
    setPrev(URL.createObjectURL(f));
  };

  useEffect(() => {
    return () => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
    };
  }, [prev]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cols.length || !sizes.length) {
      toast("Choisissez couleur & taille", "error");
      return;
    }
    setSub(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("price_ar", price);
    formData.append("category", cat);
    formData.append("genre", genre);
    formData.append("tag", tag);
    formData.append("colors", cols.join(","));
    formData.append("sizes", sizes.join(","));
    formData.append("badge", status);
    formData.append("on_order", status === "Sur commande" ? "true" : "false");
    formData.append("stock_quantity", status === "Sur commande" ? "0" : qty);
    formData.append("is_hot", hot ? "true" : "false");
    if (img) formData.append("image", img);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/products/${productToEdit.id}`,
        { method: "PUT", body: formData },
      );
      if (res.ok) {
        toast("Création modifiée avec succès !", "success");
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        toast(`Erreur: ${err.detail}`, "error");
      }
    } catch (err) {
      console.error("Erreur détaillée :", err);
      toast("Erreur réseau.", "error");
    } finally {
      setSub(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        {/* ── HEADER ── */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Modifier la Création</h2>
            <p className={styles.subtitle}>
              Mettre à jour les informations de l&apos;article
            </p>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            <I.X />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className={styles.body}>
          <form id="edit-form" onSubmit={submit}>
            <div className={styles.grid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Nom *</label>
                <input
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Prix (Ar) *</label>
                <input
                  type="number"
                  className={styles.input}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.grid} style={{ marginTop: "16px" }}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Catégorie</label>
                <select
                  className={styles.input}
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                >
                  {CATS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Cible</label>
                <select
                  className={styles.input}
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                >
                  {["Femme", "Homme", "Enfant", "Unisexe"].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.inputGroup} style={{ marginTop: "16px" }}>
              <label className={styles.label}>Couleurs *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => tog(c, cols, setCols)}
                    className={`${styles.tagBtn} ${cols.includes(c) ? styles.tagBtnColorActive : styles.tagBtnColor}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.inputGroup} style={{ marginTop: "16px" }}>
              <label className={styles.label}>Tailles *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => tog(sz, sizes, setSizes)}
                    className={`${styles.tagBtn} ${styles.tagBtnSize} ${sizes.includes(sz) ? styles.tagBtnSizeActive : ""}`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.grid} style={{ marginTop: "16px" }}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Statut</label>
                <select
                  className={styles.input}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {[
                    "En stock",
                    "Nouveau",
                    "Derniers",
                    "Sur commande",
                    "Rupture",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {status !== "Sur commande" && (
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Quantité *</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    min="0"
                    required
                  />
                </div>
              )}
            </div>

            <div className={styles.inputGroup} style={{ marginTop: "16px" }}>
              <label className={styles.label}>Tag / Matière</label>
              <input
                className={styles.input}
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup} style={{ marginTop: "16px" }}>
              <label className={styles.label}>
                Changer l&apos;image (Optionnel)
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  onFile(e.dataTransfer.files[0]);
                }}
                onClick={() => document.getElementById("editImgI")?.click()}
                className={`${styles.dropZone} ${drag ? styles.dropZoneActive : prev ? styles.dropZoneHasFile : ""}`}
              >
                {prev ? (
                  <Image
                    src={prev}
                    alt="Aperçu"
                    width={500}
                    height={500}
                    style={{
                      width: "100%",
                      height: "110px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                ) : (
                  <>
                    <div style={{ color: "var(--text-muted)" }}>
                      <I.Upload />
                    </div>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        fontWeight: "600",
                      }}
                    >
                      Glisser ou{" "}
                      <span style={{ color: "var(--rose)" }}>parcourir</span>
                    </span>
                  </>
                )}
                <input
                  id="editImgI"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => e.target.files && onFile(e.target.files[0])}
                />
              </div>
            </div>

            <label
              onClick={() => setHot(!hot)}
              style={{ marginTop: "16px", display: "flex" }}
              className={`${styles.hotToggle} ${hot ? styles.hotToggleActive : ""}`}
            >
              <div
                className={`${styles.hotCheckbox} ${hot ? styles.hotCheckboxActive : ""}`}
              >
                {hot && (
                  <span style={{ color: "white" }}>
                    <I.Check />
                  </span>
                )}
              </div>
              <div className={styles.hotText}>
                <div
                  className={`${styles.hotTitle} ${hot ? styles.hotTitleActive : ""}`}
                >
                  Coup de cœur
                </div>
                <div className={styles.hotSub}>
                  Affiché en vedette sur la boutique
                </div>
              </div>
              <span
                className={`${styles.hotIcon} ${hot ? styles.hotIconActive : ""}`}
              >
                <I.Fire />
              </span>
            </label>
          </form>
        </div>

        {/* ── FOOTER ── */}
        <div className={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            className={styles.btnSecondary}
          >
            Annuler
          </button>
          <button
            type="submit"
            form="edit-form"
            disabled={sub}
            className={styles.btnPrimary}
          >
            {sub ? (
              <>
                <div className={styles.spinnerSmall} /> En cours…
              </>
            ) : (
              <>
                <I.Save /> Enregistrer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
