"use client";

import { useMemo } from "react";
import styles from "./Boutique.module.css";

// 1. On ajoute "settingsCategories" dans les props pour recevoir la liste du backend
type Props = {
  titre?: string;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  settingsCategories?: string; // Ex: "TENUES, MAILLOTS, ACCESSOIRES"
};

// 2. Le dictionnaire d'icônes
// Vous pouvez ajouter autant de correspondances que vous voulez ici !
const ICON_MAP: Record<string, string> = {
  "TENUES": "👗",
  "MAILLOTS": "👙",
  "ACCESSOIRES": "👜",
  "MAISON": "🏠",
  "HOMME": "👔",
  "ENFANT": "🧸",
};

const DEFAULT_ICON = "🛍️"; // L'icône si la catégorie n'est pas dans la liste

export default function BoutiqueHeader({
  titre = "BOUTIQUE",
  activeCategory,
  onCategoryChange,
  settingsCategories = "TENUES, MAILLOTS, ACCESSOIRES", // Valeur de secours par défaut
}: Props) {
  
  // 3. On transforme la chaîne de texte en vrai tableau dynamique
  const dynamicCategories = useMemo(() => {
    return settingsCategories
      .split(",")
      .map((cat) => cat.trim())
      .filter((cat) => cat.length > 0); // Enlève les espaces vides
  }, [settingsCategories]);

  const handleClick = (name: string) => {
    onCategoryChange(activeCategory === name ? "" : name);
  };

  return (
    <div className={styles.boutiqueHeader}>
      <div className={styles.titleSquare}>{titre}</div>
      <div className={styles.categoryCircles}>
        
        {/* 4. On boucle sur nos catégories dynamiques */}
        {dynamicCategories.map((catName) => {
          const isActive = activeCategory === catName;
          // On cherche l'icône, en majuscules pour éviter les erreurs de casse
          const icon = ICON_MAP[catName.toUpperCase()] || DEFAULT_ICON;

          return (
            <button
              key={catName}
              className={`${styles.circleItem} ${isActive ? styles.circleItemActive : ""}`}
              onClick={() => handleClick(catName)}
            >
              <div
                className={`${styles.circle} ${isActive ? styles.circleActive : ""}`}
              >
                {icon}
              </div>
              <span className={isActive ? styles.circleLabelActive : ""}>
                {catName}
              </span>
            </button>
          );
        })}

        {/* Le bouton TOUT reste toujours à la fin */}
        <button
          className={`${styles.circleItem} ${activeCategory === "" ? styles.circleItemActive : ""}`}
          onClick={() => onCategoryChange("")}
        >
          <div
            className={`${styles.circle} ${activeCategory === "" ? styles.circleActive : ""}`}
          >
            ✨
          </div>
          <span
            className={activeCategory === "" ? styles.circleLabelActive : ""}
          >
            TOUT
          </span>
        </button>
      </div>
    </div>
  );
}