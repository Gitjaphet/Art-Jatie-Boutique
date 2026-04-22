"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import styles from "./CartePage.module.css";

// 1. On importe le contenu du panier de manière dynamique
// ssr: false dit à Next.js de ne jamais l'exécuter côté serveur
// loading: () => ... affiche ton spinner pendant que le client charge le store
const CartContent = dynamic(() => import("./CartContent"), {
  ssr: false,
  loading: () => (
    <div className={styles.loadingScreen}>
      <div className={styles.spinner} />
    </div>
  ),
});

export default function CartPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <Link href="/boutique" className={styles.backBtn}>
            <ChevronLeft size={16} /> Continuer mes achats
          </Link>
          <h1 className={styles.mainTitle}>Mon Panier</h1>
        </div>

        {/* Ce composant ne s'affichera que sur le client, sans erreur de linter */}
        <CartContent />
      </div>
    </main>
  );
}
