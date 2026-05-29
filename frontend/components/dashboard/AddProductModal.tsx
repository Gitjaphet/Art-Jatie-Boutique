import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./AddProductModal.module.css";
import Image from "next/image";

type Color = {
  id: number;
  name: string;
  hex_code: string;
};

type SizeItem = {
  nom: string;
  genres: string[];
};

function parseSizes(raw?: unknown): SizeItem[] {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        nom: item.nom ?? item.name ?? "",
        genres: Array.isArray(item.genres)
          ? item.genres
          : item.genre
          ? [item.genre]
          : ["Tous"],
      }));
    }
  } catch {
    return raw.split(",").map(s => ({ nom: s.trim(), genres: ["Tous"] }));
  }
  return [];
}

const I = {
  X: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Upload: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  ),
  Fire: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 2c0 6-6 8-6 13a6 6 0 0 0 12 0c0-5-6-7-6-13z" />
    </svg>
  ),
  Check: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

type AddProductModalProps = {
  onClose: () => void;
  onSuccess: () => void;
  toast: (msg: string, type?: "success" | "error") => void;
  settings: Record<string, unknown> | null;
};

export default function AddProductModal({
  onClose,
  onSuccess,
  toast,
  settings,
}: AddProductModalProps) {
  const [sub, setSub] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  // ✅ NOUVEAU : ancien prix (affiché barré sur la boutique)
  const [oldPrice, setOldPrice] = useState("");
  // ✅ NOUVEAU : description du produit
  const [description, setDescription] = useState("");
  const [cat, setCat] = useState("");
  const [genre, setGenre] = useState("");
  const [tag, setTag] = useState("");
  const [onOrder, setOnOrder] = useState("false"); 
  const [badge, setBadge] = useState("");
  const [qty, setQty] = useState("1");
  const [hot, setHot] = useState(false);
  const [sizes, setSizes] = useState<string[]>([]);

  // ✅ NOUVEAU : on remplace "img" (1 fichier) par "imgs" (plusieurs fichiers)
  // "imgs" = tableau de fichiers sélectionnés
  // "prevs" = tableau d'URLs de prévisualisation
  const [imgs, setImgs] = useState<File[]>([]);
  const [prevs, setPrevs] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);

  const [allColors, setAllColors] = useState<Color[]>([]);
  const [selectedColors, setSelectedColors] = useState<Color[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/colors`);
        if (res.ok) {
          const data = await res.json();
          setAllColors(data);
        }
      } catch (err) {
        console.error("Erreur de chargement des couleurs:", err);
      }
    };
    fetchColors();
  }, []);

  const CATS = useMemo(() => {
    const val = settings?.available_categories;
    return typeof val === "string" ? val.split(",").map((c) => c.trim()) : [];
  }, [settings?.available_categories]);

  const GENRES = useMemo(() => {
    const val = settings?.available_genres;
    return typeof val === "string" ? val.split(",").map((g) => g.trim()) : ["Femme", "Homme", "Enfant", "Unisexe"];
  }, [settings?.available_genres]);

  const currentCat = cat || CATS[0] || "";
  const currentGenre = genre || GENRES[0] || "Femme";

  const SIZES = useMemo(() => {
    const allSizes = parseSizes(settings?.available_sizes as string);
    if (!currentGenre) return allSizes;
    return allSizes.filter(
      sz => sz.genres.includes("Tous") || sz.genres.includes(currentGenre)
    );
  }, [settings?.available_sizes, currentGenre]);

  const tog = useCallback(
    (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
      setList((prev) =>
        prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
      );
    },
    [],
  );

  const handleRemoveColor = (colorIdToRemove: number) => {
    setSelectedColors(selectedColors.filter((c) => c.id !== colorIdToRemove));
  };

  const handleCreateNewColor = async () => {
    const newName = colorInput.trim();
    if (!newName) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/colors/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, hex_code: "#CCCCCC" })
      });
      if (res.ok) {
        const newColor = await res.json();
        setAllColors([...allColors, newColor]);
        setSelectedColors([...selectedColors, newColor]);
        setColorInput("");
        setIsDropdownOpen(false);
      } else {
        const err = await res.json();
        const errorMessage = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
        toast(`Erreur: ${errorMessage}`, "error");
      }
    } catch (error) {
      toast("Erreur réseau lors de la création de la couleur", "error");
    }
  };

  const availableFiltered = allColors.filter(c =>
    c.name.toLowerCase().includes(colorInput.toLowerCase()) &&
    !selectedColors.some(sc => sc.id === c.id)
  );

  const isExactMatch = allColors.some(c =>
    c.name.toLowerCase() === colorInput.trim().toLowerCase()
  );

  // ✅ NOUVEAU : fonction qui ajoute des fichiers au tableau imgs[]
  // Elle vérifie que c'est bien une image avant d'ajouter
  const onFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(f => f.type.startsWith("image/"));
    if (validFiles.length === 0) return;

    // On crée les URLs de prévisualisation pour chaque nouvelle image
    const newPrevs = validFiles.map(f => URL.createObjectURL(f));

    setImgs(prev => [...prev, ...validFiles]);
    setPrevs(prev => [...prev, ...newPrevs]);
  };

  // ✅ NOUVEAU : supprimer une image de la liste (par son index)
  const removeImage = (index: number) => {
    // On libère l'URL de prévisualisation pour éviter les fuites mémoire
    URL.revokeObjectURL(prevs[index]);
    setImgs(prev => prev.filter((_, i) => i !== index));
    setPrevs(prev => prev.filter((_, i) => i !== index));
  };

  // Nettoyage des URLs quand le composant se ferme
  useEffect(() => {
    return () => {
      prevs.forEach(p => URL.revokeObjectURL(p));
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ MODIFIÉ : on vérifie qu'il y a au moins 1 image
    if (imgs.length === 0) {
      toast("Sélectionnez au moins une image", "error");
      return;
    }
    if (!selectedColors.length || !sizes.length) {
      toast("Choisissez couleur & taille", "error");
      return;
    }

    setSub(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("price_ar", price);

    // ✅ NOUVEAU : on envoie old_price_ar seulement si rempli
    if (oldPrice) {
      formData.append("old_price_ar", oldPrice);
    }

    // ✅ NOUVEAU : on envoie description seulement si rempli
    if (description) {
      formData.append("description", description);
    }

    formData.append("category", currentCat);
    formData.append("genre", currentGenre);
    formData.append("tag", tag);
    formData.append("sizes", sizes.join(","));
    if (badge) {
      formData.append("badge", badge);
    }
    formData.append("on_order", onOrder);
    formData.append("stock_quantity", onOrder === "true" ? "0" : qty);
    formData.append("is_hot", hot ? "true" : "false");
    formData.append("colors", selectedColors.map(c => c.name).join(","));
    formData.append("color_ids", JSON.stringify(selectedColors.map(c => c.id)));

    // ✅ MODIFIÉ : on envoie toutes les images avec le champ "images" (au pluriel)
    // Le backend attend : images: List[UploadFile]
    imgs.forEach(img => {
      formData.append("images", img);
    });

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/products/`,
        { method: "POST", body: formData },
      );
      if (res.ok) {
        toast("Création ajoutée avec succès !");
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        const errorMessage = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
        toast(`Erreur: ${errorMessage}`, "error");
      }
    } catch (err) {
      console.error("Erreur détaillée :", err);
      toast("Erreur réseau.", "error");
    } finally {
      setSub(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* ── HEADER ── */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Nouvelle Création</h2>
            <p className={styles.subtitle}>Ajouter un article au catalogue Art Jatie</p>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            <I.X />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className={styles.body}>
          <form id="pf" onSubmit={submit}>

            {/* ── LIGNE 1 : NOM ET PRIX ── */}
            <div className={styles.grid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Nom *</label>
                <input
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Robe Raphia Soleil"
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
                  placeholder="185 000"
                />
              </div>
            </div>

            {/* ── ✅ NOUVEAU : ANCIEN PRIX ── */}
            {/* Affiché barré sur la boutique pour montrer une réduction */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Ancien prix (Ar)
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "400", marginLeft: "8px" }}>
                  Optionnel — affiché barré si renseigné
                </span>
              </label>
              <input
                type="number"
                className={styles.input}
                value={oldPrice}
                onChange={(e) => setOldPrice(e.target.value)}
                placeholder="220 000"
              />
            </div>

            {/* ── LIGNE 2 : CATEGORIE ET CIBLE ── */}
            <div className={styles.grid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Catégorie</label>
                <select className={styles.input} value={currentCat} onChange={(e) => setCat(e.target.value)}>
                  {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Cible</label>
                <select className={styles.input} value={currentGenre} onChange={(e) => setGenre(e.target.value)}>
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* ── LIGNE 3 : COULEURS ── */}
            <div className={styles.inputGroup} ref={dropdownRef}>
              <label className={styles.label}>Couleurs *</label>
              <div style={{
                display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px",
                border: "1px solid var(--border-color, #e5e7eb)", borderRadius: "8px",
                padding: "8px", minHeight: "45px", backgroundColor: "#fff", position: "relative"
              }}>
                {selectedColors.map((color) => (
                  <span key={color.id} style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    backgroundColor: "var(--bg-accent, #fce7f3)", color: "var(--text-accent, #9d174d)",
                    fontSize: "13px", fontWeight: "500", padding: "4px 10px", borderRadius: "9999px"
                  }}>
                    <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: color.hex_code || "#ccc", border: "1px solid rgba(0,0,0,0.1)" }}></span>
                    {color.name}
                    <button type="button" onClick={() => handleRemoveColor(color.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.6, display: "flex", alignItems: "center", padding: 0, marginLeft: "2px" }}>
                      <I.X />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={colorInput}
                  onChange={(e) => { setColorInput(e.target.value); setIsDropdownOpen(true); }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (colorInput.trim() !== "" && !isExactMatch) handleCreateNewColor();
                    }
                  }}
                  placeholder={selectedColors.length === 0 ? "Rechercher ou créer..." : ""}
                  style={{ flex: 1, minWidth: "140px", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                />
                {isDropdownOpen && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0,
                    backgroundColor: "white", border: "1px solid #e5e7eb",
                    borderRadius: "6px", marginTop: "4px", zIndex: 50,
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", maxHeight: "200px", overflowY: "auto"
                  }}>
                    {availableFiltered.map(c => (
                      <div key={c.id}
                        onClick={() => { setSelectedColors([...selectedColors, c]); setColorInput(""); setIsDropdownOpen(false); }}
                        style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = "white"}
                      >
                        <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: c.hex_code, border: "1px solid rgba(0,0,0,0.1)" }}></span>
                        {c.name}
                      </div>
                    ))}
                    {colorInput.trim() !== "" && !isExactMatch && (
                      <div onClick={handleCreateNewColor}
                        style={{ padding: "10px 12px", cursor: "pointer", color: "var(--text-accent, #9d174d)", fontWeight: "600", fontSize: "14px", backgroundColor: "#fdf2f8" }}>
                        Créer "{colorInput.trim()}"
                      </div>
                    )}
                    {availableFiltered.length === 0 && colorInput.trim() === "" && (
                      <div style={{ padding: "8px 12px", color: "#9ca3af", fontSize: "13px" }}>Aucune autre couleur disponible</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── LIGNE 4 : TAILLES ── */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Tailles *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {SIZES.map((sz) => (
                  <button key={sz.nom} type="button"
                    onClick={() => tog(sz.nom, sizes, setSizes)}
                    className={`${styles.tagBtn} ${styles.tagBtnSize} ${sizes.includes(sz.nom) ? styles.tagBtnSizeActive : ""}`}>
                    {sz.nom}
                  </button>
                ))}
              </div>
            </div>

            {/* ── LIGNE 5 : DISPONIBILITÉ ET QUANTITÉ ── */}
            <div className={styles.grid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Disponibilité</label>
                <select className={styles.input} value={onOrder} onChange={(e) => setOnOrder(e.target.value)}>
                  <option value="false">En stock</option>
                  <option value="true">Sur commande</option>
                </select>
              </div>
              
              {onOrder === "false" && (
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Quantité *</label>
                  <input type="number" className={styles.input} value={qty} onChange={(e) => setQty(e.target.value)} min="1" required />
                </div>
              )}
            </div>

            {/* ── LIGNE 6 : BADGE VISUEL (Optionnel) ── */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Badge Visuel
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "400", marginLeft: "8px" }}>
                  Optionnel — s'affiche comme un ruban sur la photo
                </span>
              </label>
              <select className={styles.input} value={badge} onChange={(e) => setBadge(e.target.value)}>
                <option value="">Aucun badge</option>
                <option value="Nouveau">Nouveau</option>
                <option value="Derniers">Dernières pièces</option>
                <option value="Promo">Promo</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Tag / Matière</label>
              <input className={styles.input} value={tag} onChange={(e) => setTag(e.target.value)} placeholder="100% Raphia naturel" />
            </div>

            {/* ── ✅ NOUVEAU : DESCRIPTION ── */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Description
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "400", marginLeft: "8px" }}>
                  Optionnel
                </span>
              </label>
              <textarea
                className={styles.input}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez le produit : matière, coupe, occasion..."
                rows={3}
                style={{ resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }}
              />
            </div>

            {/* ── ✅ MODIFIÉ : UPLOAD MULTIPLE IMAGES ── */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Images *
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "400", marginLeft: "8px" }}>
                  Plusieurs photos autorisées — la 1ère sera l'image principale
                </span>
              </label>

              {/* Zone de drop : on peut glisser ou cliquer pour ajouter des images */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); }}
                onClick={() => document.getElementById("imgI")?.click()}
                className={`${styles.dropZone} ${drag ? styles.dropZoneActive : imgs.length > 0 ? styles.dropZoneHasFile : ""}`}
              >
                <div style={{ color: "var(--text-muted)" }}><I.Upload /></div>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>
                  Glisser ou <span style={{ color: "var(--rose)" }}>parcourir</span>
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500" }}>
                  PNG · JPG · WEBP — {imgs.length} image{imgs.length > 1 ? "s" : ""} sélectionnée{imgs.length > 1 ? "s" : ""}
                </span>

                {/* ✅ IMPORTANT : multiple={true} pour permettre la sélection de plusieurs fichiers */}
                <input
                  id="imgI"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => e.target.files && onFiles(e.target.files)}
                />
              </div>

              {/* ✅ NOUVEAU : grille de prévisualisation des images sélectionnées */}
              {prevs.length > 0 && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                  gap: "10px",
                  marginTop: "12px"
                }}>
                  {prevs.map((src, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", aspectRatio: "1" }}>
                      {/* Aperçu de l'image */}
                      <Image
                        src={src}
                        alt={`Aperçu ${i + 1}`}
                        width={90}
                        height={90}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      {/* Badge "Principale" sur la 1ère image */}
                      {i === 0 && (
                        <span style={{
                          position: "absolute", bottom: "4px", left: "4px",
                          backgroundColor: "rgba(0,0,0,0.6)", color: "white",
                          fontSize: "9px", fontWeight: "700", padding: "2px 6px",
                          borderRadius: "4px", letterSpacing: "0.5px"
                        }}>
                          PRINCIPALE
                        </span>
                      )}
                      {/* Bouton ✕ pour supprimer cette image */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        style={{
                          position: "absolute", top: "4px", right: "4px",
                          backgroundColor: "rgba(0,0,0,0.55)", color: "white",
                          border: "none", borderRadius: "50%", width: "22px", height: "22px",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                      >
                        <I.X />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label onClick={() => setHot(!hot)} className={`${styles.hotToggle} ${hot ? styles.hotToggleActive : ""}`}>
              <div className={`${styles.hotCheckbox} ${hot ? styles.hotCheckboxActive : ""}`}>
                {hot && <span style={{ color: "white" }}><I.Check /></span>}
              </div>
              <div className={styles.hotText}>
                <div className={`${styles.hotTitle} ${hot ? styles.hotTitleActive : ""}`}>Coup de cœur</div>
                <div className={styles.hotSub}>Affiché en vedette sur la boutique</div>
              </div>
              <span className={`${styles.hotIcon} ${hot ? styles.hotIconActive : ""}`}><I.Fire /></span>
            </label>
          </form>
        </div>

        {/* ── FOOTER ── */}
        <div className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.btnSecondary}>Annuler</button>
          <button type="submit" form="pf" disabled={sub} className={styles.btnPrimary}>
            {sub ? <><div className={styles.spinnerSmall} /> En cours…</> : <><I.Plus /> Ajouter</>}
          </button>
        </div>
      </div>
    </div>
  );
}