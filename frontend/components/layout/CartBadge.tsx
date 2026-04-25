"use client";

// ✅ Composant isolé pour le badge panier
// Séparé du Header pour éviter tout problème d'hydratation Next.js
// et l'erreur linter "setState synchronously within an effect"

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart";
import styles from "./Header.module.css";

export default function CartBadge() {
  const [count, setCount] = useState(0);
  const totalItems = useCartStore((s) => s.totalItems());

  // ✅ On lit le store APRÈS le montage client — propre et sans erreur
  useEffect(() => {
    setCount(totalItems);
  }, [totalItems]);

  if (count === 0) return null;

  return <span className={styles.cartBadge}>{count}</span>;
}
