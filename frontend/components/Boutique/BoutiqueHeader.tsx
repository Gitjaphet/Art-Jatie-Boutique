"use client";

import styles from "./Boutique.module.css";

type Props = {
  titre?: string;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
};

const categories = [
  { name: "TENUES", icon: "👗" },
  { name: "MAILLOTS", icon: "👙" },
  { name: "ACCESSOIRES", icon: "👜" },
];

export default function BoutiqueHeader({
  titre = "BOUTIQUE",
  activeCategory,
  onCategoryChange,
}: Props) {
  const handleClick = (name: string) => {
    onCategoryChange(activeCategory === name ? "" : name);
  };

  return (
    <div className={styles.boutiqueHeader}>
      <div className={styles.titleSquare}>{titre}</div>
      <div className={styles.categoryCircles}>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              className={`${styles.circleItem} ${isActive ? styles.circleItemActive : ""}`}
              onClick={() => handleClick(cat.name)}
            >
              <div
                className={`${styles.circle} ${isActive ? styles.circleActive : ""}`}
              >
                {cat.icon}
              </div>
              <span className={isActive ? styles.circleLabelActive : ""}>
                {cat.name}
              </span>
            </button>
          );
        })}
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
