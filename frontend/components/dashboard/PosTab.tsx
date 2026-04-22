"use client";

import { useState } from "react";
import styles from "./PosTab.module.css";

// ─── TYPES ────────────────────────────────────────────────────────
type PosProduct = {
  id: number;
  name: string;
  category: string;
  genre: string;
  price_ar: number;
  badge: string;
  on_order: boolean;
  image: string;
};

type CartItem = PosProduct & {
  qty: number;
};

type PosTabProps = {
  products: PosProduct[];
  toast: (msg: string, type?: "success" | "error") => void;
};
// ───────────────────────────────────────────────────────────────────────────

export default function PosTab({ products, toast }: PosTabProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("TOUT");
  const [activeGenre, setActiveGenre] = useState("TOUT");

  // SÉCURITÉ : On s'assure d'avoir un tableau pour éviter le crash .map()
  const safeProducts = products || [];

  // Extraire les catégories uniques depuis les produits sécurisés
  const categories = [
    "TOUT",
    ...Array.from(new Set(safeProducts.map((p) => p.category))),
  ];
  const genres = ["TOUT", "Femme", "Homme", "Enfant", "Unisexe"];

  // Filtrage des produits
  const availableProducts = safeProducts.filter((p) => {
    const isEnStock =
      p.badge === "En stock" || p.badge === "Nouveau" || p.badge === "Derniers";
    const isNotOnOrder = !p.on_order;
    const matchSearch = (p.name || "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchCat = activeCat === "TOUT" || p.category === activeCat;
    const matchGenre = activeGenre === "TOUT" || p.genre === activeGenre;

    return isEnStock && isNotOnOrder && matchSearch && matchCat && matchGenre;
  });

  const total = cart.reduce(
    (sum, item) => sum + (item.price_ar || 0) * item.qty,
    0,
  );

  const addToCart = (product: PosProduct) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
        ),
      );
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
      setCart([]);
      toast("Commande annulée.", "success");
    }
  };

  const handlePayment = () => {
    if (cart.length === 0) {
      toast("Le panier est vide.", "error");
      return;
    }
    toast("Paiement simulé !", "success");
  };

  return (
    <div className={styles.container}>
      {/* GAUCHE : LE TICKET DE CAISSE */}
      <div className={styles.sidebar}>
        <div className={styles.header}>
          <button className={styles.tabActive}>Caisse</button>
          <button className={styles.tabInactive}>Commandes</button>
        </div>

        <div className={styles.cartArea}>
          {cart.length === 0 ? (
            <div className={styles.emptyCart}>
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              Panier vide
            </div>
          ) : (
            cart.map((item, i) => (
              <div key={i} className={styles.cartItem}>
                <div
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <span className={styles.cartItemQty}>{item.qty}</span>
                  <span className={styles.cartItemName}>{item.name}</span>
                </div>
                <span className={styles.cartItemPrice}>
                  {(item.price_ar * item.qty).toLocaleString("fr-FR")} Ar
                </span>
              </div>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.totalRow}>
            <span>Total</span>
            <span>
              {total.toLocaleString("fr-FR")}{" "}
              <span className={styles.totalCurrency}>Ar</span>
            </span>
          </div>

          <div className={styles.customerNoteArea}>
            <button className={styles.actionBtn}>Client</button>
            <button className={styles.actionBtn}>Note</button>
          </div>

          <div className={styles.numpad}>
            {[
              "1",
              "2",
              "3",
              "Qté",
              "4",
              "5",
              "6",
              "%",
              "7",
              "8",
              "9",
              "Prix",
              "+/-",
              "0",
              ".",
              "⌫",
            ].map((btn, i) => {
              let btnClass = styles.numDefault;
              if (["Qté", "%", "Prix"].includes(btn))
                btnClass = styles.numAction;
              if (btn === "⌫" || btn === "+/-") btnClass = styles.numDelete;

              return (
                <button
                  key={i}
                  className={`${styles.numBtn} ${btnClass}`}
                  onClick={() => {
                    if (btn === "⌫" && cart.length > 0) {
                      const newCart = [...cart];
                      const lastItem = newCart[newCart.length - 1];
                      if (lastItem.qty > 1) lastItem.qty -= 1;
                      else newCart.pop();
                      setCart(newCart);
                    }
                  }}
                >
                  {btn}
                </button>
              );
            })}
          </div>

          <div className={styles.checkoutArea}>
            <button onClick={clearCart} className={styles.cancelBtn}>
              Annuler
            </button>
            <button onClick={handlePayment} className={styles.payBtn}>
              Encaisser {total > 0 && ` • ${total.toLocaleString("fr-FR")} Ar`}
            </button>
          </div>
        </div>
      </div>

      {/* DROITE : GRILLE DES PRODUITS */}
      <div className={styles.mainArea}>
        <div className={styles.searchArea}>
          <div className={styles.searchWrapper}>
            <svg
              className={styles.searchIcon}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Rechercher un produit..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.filtersWrapper}>
          <div className={styles.filterRow}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`${styles.filterBtn} ${activeCat === cat ? styles.filterCatActive : styles.filterCatInactive}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className={styles.filterRow}>
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className={`${styles.filterBtn} ${activeGenre === genre ? styles.filterTargetActive : styles.filterTargetInactive}`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.productGrid} style={{ paddingTop: "15px" }}>
          {availableProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => addToCart(p)}
              className={styles.productCard}
            >
              <div
                className={styles.productImage}
                style={{ backgroundImage: `url(${p.image})` }}
              />
              <div className={styles.productInfo}>
                <div className={styles.productName}>{p.name}</div>
                <div className={styles.productPrice}>
                  {p.price_ar.toLocaleString("fr-FR")} Ar
                </div>
              </div>
            </div>
          ))}

          {availableProducts.length === 0 && (
            <div
              style={{
                padding: "20px",
                color: "var(--text-muted)",
                gridColumn: "1 / -1",
                textAlign: "center",
              }}
            >
              Aucun produit en stock disponible.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
