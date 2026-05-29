import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./EditProductModal.module.css";
import Image from "next/image";

// 1. Ajout du type Color
type Color = {
  id: number;
  name: string;
  hex_code: string;
};

// Ajoutez ce type et helper en haut du fichier (avant le composant)
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
  Save: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
  old_price_ar?: number;   // ✅ Ajouté
  description?: string;    // ✅ Ajouté
  category: string;
  genre: string;
  tag?: string;
  badge: string;
  on_order?: boolean;      // ✅ Ajouté
  stock_quantity?: number;
  is_hot?: boolean;
  hot?: boolean;
  colors?: string;
  full_colors?: Color[]; 
  sizes?: string;
  image: string;
  images?: string;         // ✅ Ajouté pour multi-images
};

type EditProductModalProps = {
  productToEdit: ProductType;
  onClose: () => void;
  onSuccess: () => void;
  toast: (msg: string, type?: "success" | "error") => void;
  settings: Record<string, unknown> | null;
}

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
  const [oldPrice, setOldPrice] = useState("");      // ✅ Ajouté
  const [description, setDescription] = useState("");// ✅ Ajouté
  const [cat, setCat] = useState("");
  const [genre, setGenre] = useState("");
  const [tag, setTag] = useState("");
  
  const [onOrder, setOnOrder] = useState("false");   // ✅ Séparé
  const [badge, setBadge] = useState("");            // ✅ Séparé
  
  const [qty, setQty] = useState(0);
  const [hot, setHot] = useState(false);
  const [sizes, setSizes] = useState<string[]>([]);
  
  const [imgs, setImgs] = useState<File[]>([]);      // ✅ Multi-images
  const [prevs, setPrevs] = useState<string[]>([]);  // ✅ Multi-images
  const [drag, setDrag] = useState(false);

  // ── ÉTATS POUR LES COULEURS ──
  const [allColors, setAllColors] = useState<Color[]>([]);
  const [selectedColors, setSelectedColors] = useState<Color[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch de toutes les couleurs disponibles
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/colors`);
        if (res.ok) {
          const data = await res.json();
          setAllColors(data);
        }
      } catch (err) {
        console.error("Erreur couleurs:", err);
      }
    };
    fetchColors();
  }, []);

  // Initialisation des données du produit
  // Initialisation des données du produit
  useEffect(() => {
    if (!productToEdit) return;
    setName(productToEdit.name);
    setPrice(productToEdit.price_ar.toString());
    setOldPrice(productToEdit.old_price_ar ? productToEdit.old_price_ar.toString() : ""); // ✅
    setDescription(productToEdit.description || ""); // ✅
    setCat(productToEdit.category);
    setGenre(productToEdit.genre);
    setTag(productToEdit.tag || "");
    
    setOnOrder(productToEdit.on_order ? "true" : "false"); // ✅
    setBadge(productToEdit.badge || "");                   // ✅
    
    setQty(productToEdit.stock_quantity ?? 0);
    setHot(productToEdit.is_hot || productToEdit.hot || false);
    setSizes(productToEdit.sizes ? productToEdit.sizes.split(",").map((s) => s.trim()) : []);
    
    // ✅ Charger les images existantes
    const existingImages = productToEdit.images 
      ? productToEdit.images.split(",").map(s => s.trim()).filter(Boolean)
      : productToEdit.image ? [productToEdit.image] : [];
    setPrevs(existingImages);
    setImgs([]); // Pas de nouveaux fichiers au départ
    
    // ── SYNC DES COULEURS ──
    // Si le backend nous envoie déjà "full_colors", c'est parfait
    if (productToEdit.full_colors && productToEdit.full_colors.length > 0) {
      setSelectedColors(productToEdit.full_colors);
    } 
    // Sinon, on fait la correspondance avec la chaîne de texte "Rouge, Noir" et allColors
    else if (productToEdit.colors && allColors.length > 0) {
      const colorNames = productToEdit.colors.split(",").map(c => c.trim().toLowerCase());
      const matched = allColors.filter(c => colorNames.includes(c.name.toLowerCase()));
      setSelectedColors(matched);
    }
  }, [productToEdit, allColors]);

  const CATS = useMemo(() => {
    const v = settings?.available_categories;
    return typeof v === "string" ? v.split(",").map((c) => c.trim()) : [];
  }, [settings?.available_categories]);

  const GENRES = useMemo(() => {
    const val = settings?.available_genres;
    return typeof val === "string" ? val.split(",").map((g) => g.trim()) : ["Femme", "Homme", "Enfant", "Unisexe"];
  }, [settings?.available_genres]);

  const currentGenre = genre || GENRES[0] || "Femme";

  // Remplacez le useMemo SIZES :
  const SIZES = useMemo(() => {
    const allSizes = parseSizes(settings?.available_sizes as string);
    if (!currentGenre) return allSizes;
    return allSizes.filter(
      sz => sz.genres.includes("Tous") || sz.genres.includes(currentGenre)
    );
  }, [settings?.available_sizes, currentGenre]);

  const tog = useCallback(
    (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
      setList((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]);
    }, []
  );

  // ── FONCTIONS COULEURS ODOO ──
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
        const errorMessage = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
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
  
  const isExactMatch = allColors.some(c => c.name.toLowerCase() === colorInput.trim().toLowerCase());

  const onFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(f => f.type.startsWith("image/"));
    if (validFiles.length === 0) return;

    const newPrevs = validFiles.map(f => URL.createObjectURL(f));
    setImgs(prev => [...prev, ...validFiles]);
    setPrevs(prev => [...prev, ...newPrevs]);
  };

  const removeImage = (index: number) => {
    const urlToRemove = prevs[index];
    if (urlToRemove.startsWith("blob:")) {
      URL.revokeObjectURL(urlToRemove);
      // Supprimer le bon fichier dans `imgs` (qui ne contient que les nouveaux)
      const remoteCount = prevs.slice(0, index).filter(p => !p.startsWith("blob:")).length;
      setImgs(prev => prev.filter((_, i) => i !== (index - remoteCount)));
    }
    setPrevs(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    return () => { prevs.forEach(p => { if (p.startsWith("blob:")) URL.revokeObjectURL(p); }); };
  }, [prevs]);

  const stockColor = qty === 0 ? "#ef4444" : qty <= 2 ? "#f97316" : "#16a34a";
  const stockBg = qty === 0 ? "#fff5f5" : qty <= 2 ? "#fff7ed" : "#f0fdf4";
  const stockLabel = qty === 0 ? "Épuisé" : qty === 1 ? "1 pièce" : `${qty} pièces`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColors.length || !sizes.length) {
      toast("Choisissez couleur & taille", "error");
      return;
    }
    setSub(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("price_ar", price);
    if (oldPrice) formData.append("old_price_ar", oldPrice);
    if (description) formData.append("description", description);
    
    formData.append("category", cat);
    formData.append("genre", currentGenre);
    formData.append("tag", tag);
    formData.append("sizes", sizes.join(","));
    
    if (badge) formData.append("badge", badge);
    formData.append("on_order", onOrder);
    formData.append("stock_quantity", onOrder === "true" ? "0" : String(qty));
    formData.append("is_hot", hot ? "true" : "false");
    
    imgs.forEach(imgFile => {
      formData.append("images", imgFile);
    });
    
    // Si ton backend supporte la conservation d'images partielles, tu peux envoyer les URLs gardées ici.
    const retainedImages = prevs.filter(p => !p.startsWith("blob:"));
    formData.append("retained_images", retainedImages.join(","));

    // Envoi des couleurs
    formData.append("colors", selectedColors.map(c => c.name).join(","));
    formData.append("color_ids", JSON.stringify(selectedColors.map(c => c.id)));

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/products/${productToEdit.id}`,
        { method: "PUT", body: formData }
      );
      if (res.ok) {
        toast("Création modifiée avec succès !", "success");
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        const errorMessage = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
        toast(`Erreur: ${errorMessage}`, "error");
      }
    } catch (err) {
      console.error(err);
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
            <h2 className={styles.title}>Modifier la Création</h2>
            <p className={styles.subtitle}>Mettre à jour les informations de l&apos;article</p>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            <I.X />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className={styles.body}>
          <form id="edit-form" onSubmit={submit}>
            {/* Nom + Prix */}
            <div className={styles.grid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Nom *</label>
                <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Prix (Ar) *</label>
                <input type="number" className={styles.input} value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              {/* ── NOUVEAU : ANCIEN PRIX ── */}
            <div className={styles.inputGroup} style={{ marginTop: 16 }}>
              <label className={styles.label}>
                Ancien prix (Ar)
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "400", marginLeft: "8px" }}>Optionnel</span>
              </label>
              <input type="number" className={styles.input} value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} />
            </div>
            </div>

            {/* Catégorie + Cible */}
            <div className={styles.grid} style={{ marginTop: 16 }}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Catégorie</label>
                <select className={styles.input} value={cat} onChange={(e) => setCat(e.target.value)}>
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

            {/* ── COULEURS FAÇON ODOO ── */}
            <div className={styles.inputGroup} style={{ marginTop: 16 }} ref={dropdownRef}>
              <label className={styles.label}>Couleurs *</label>
              
              <div style={{
                display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", 
                border: "1px solid var(--border-color, #e5e7eb)", borderRadius: "8px", 
                padding: "8px", minHeight: "45px", backgroundColor: "#fff", position: "relative"
              }}>
                {selectedColors.map((color) => (
                  <span
                    key={color.id}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      backgroundColor: "var(--bg-accent, #fce7f3)", color: "var(--text-accent, #9d174d)",
                      fontSize: "13px", fontWeight: "500", padding: "4px 10px", borderRadius: "9999px"
                    }}
                  >
                    <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: color.hex_code || "#ccc", border: "1px solid rgba(0,0,0,0.1)" }}></span>
                    {color.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(color.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.6, display: "flex", alignItems: "center", padding: 0, marginLeft: "2px" }}
                    >
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
                    backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "6px", marginTop: "4px", zIndex: 50,
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", maxHeight: "200px", overflowY: "auto"
                  }}>
                    {availableFiltered.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => { setSelectedColors([...selectedColors, c]); setColorInput(""); setIsDropdownOpen(false); }} 
                        style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = "white"}
                      >
                        <span style={{width:"12px", height:"12px", borderRadius:"50%", backgroundColor: c.hex_code, border: "1px solid rgba(0,0,0,0.1)"}}></span>
                        {c.name}
                      </div>
                    ))}
                    {colorInput.trim() !== "" && !isExactMatch && (
                      <div onClick={handleCreateNewColor} style={{ padding: "10px 12px", cursor: "pointer", color: "var(--text-accent, #9d174d)", fontWeight: "600", fontSize: "14px", backgroundColor: "#fdf2f8" }}>
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

            {/* Tailles */}
            <div className={styles.inputGroup} style={{ marginTop: 16 }}>
              <label className={styles.label}>Tailles *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {SIZES.map((sz) => (
                  <button
                    key={sz.nom}
                    type="button"
                    onClick={() => tog(sz.nom, sizes, setSizes)}
                    className={`${styles.tagBtn} ${styles.tagBtnSize} ${sizes.includes(sz.nom) ? styles.tagBtnSizeActive : ""}`}
                  >
                    {sz.nom}
                  </button>
                ))}
              </div>
            </div>

            {/* Statut + Stock */}
            <div className={styles.grid} style={{ marginTop: 16 }}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Disponibilité</label>
                <select className={styles.input} value={onOrder} onChange={(e) => setOnOrder(e.target.value)}>
                  <option value="false">En stock</option>
                  <option value="true">Sur commande</option>
                </select>
              </div>

              {onOrder === "false" && (
                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    Stock <span className={styles.stockBadge} style={{ background: stockBg, color: stockColor }}>{stockLabel}</span>
                  </label>
                  <div className={styles.stockRow}>
                    <button type="button" className={styles.stockBtn} onClick={() => setQty((v) => Math.max(0, v - 1))}>−</button>
                    <input type="number" className={styles.stockInput} value={qty} min={0} onChange={(e) => setQty(Math.max(0, Number(e.target.value)))} />
                    <button type="button" className={styles.stockBtn} onClick={() => setQty((v) => v + 1)}>+</button>
                  </div>
                </div>
              )}
            </div>

            {/* Badge */}
            <div className={styles.inputGroup} style={{ marginTop: 16 }}>
              <label className={styles.label}>Badge Visuel (Optionnel)</label>
              <select className={styles.input} value={badge} onChange={(e) => setBadge(e.target.value)}>
                <option value="">Aucun badge</option>
                <option value="Nouveau">Nouveau</option>
                <option value="Derniers">Dernières pièces</option>
                <option value="Promo">Promo</option>
              </select>
            </div>

            {/* Tag / Matière */}
            <div className={styles.inputGroup} style={{ marginTop: 16 }}>
              <label className={styles.label}>Tag / Matière</label>
              <input className={styles.input} value={tag} onChange={(e) => setTag(e.target.value)} />
            </div>

            {/* Description */}
            <div className={styles.inputGroup} style={{ marginTop: 16 }}>
              <label className={styles.label}>Description <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "400", marginLeft: "8px" }}>Optionnel</span></label>
              <textarea className={styles.input} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }} />
            </div>

            {/* Images */}
            <div className={styles.inputGroup} style={{ marginTop: 16 }}>
              <label className={styles.label}>Images</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); }}
                onClick={() => document.getElementById("editImgI")?.click()}
                className={`${styles.dropZone} ${drag ? styles.dropZoneActive : prevs.length > 0 ? styles.dropZoneHasFile : ""}`}
              >
                <div style={{ color: "var(--text-muted)" }}><I.Upload /></div>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>Ajouter de <span style={{ color: "var(--rose)" }}>nouvelles images</span></span>
                <input id="editImgI" type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => e.target.files && onFiles(e.target.files)} />
              </div>

              {prevs.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "10px", marginTop: "12px" }}>
                  {prevs.map((src, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", aspectRatio: "1" }}>
                      <Image src={src} alt={`Aperçu ${i}`} width={90} height={90} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {i === 0 && <span style={{ position: "absolute", bottom: "4px", left: "4px", backgroundColor: "rgba(0,0,0,0.6)", color: "white", fontSize: "9px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px" }}>PRINCIPALE</span>}
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(i); }} style={{ position: "absolute", top: "4px", right: "4px", backgroundColor: "rgba(0,0,0,0.55)", color: "white", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <I.X />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            

            {/* Coup de cœur */}
            <label onClick={() => setHot(!hot)} style={{ marginTop: 16, display: "flex" }} className={`${styles.hotToggle} ${hot ? styles.hotToggleActive : ""}`}>
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
          <button type="submit" form="edit-form" disabled={sub} className={styles.btnPrimary}>
            {sub ? <><div className={styles.spinnerSmall} /> En cours…</> : <><I.Save /> Enregistrer</>}
          </button>
        </div>
      </div>
    </div>
  );
}