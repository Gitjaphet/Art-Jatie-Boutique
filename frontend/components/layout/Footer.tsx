"use client";

import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footerRoot}>
      {/* Section Newsletter / CTA élégante */}
      <div className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaFlex}>
            <h2 className={styles.ctaTitle}>
              Restez inspirée. <br />
              <span className={styles.ctaTitleItalic}>
                Rejoignez {"l'univers"} Art Jatie.
              </span>
            </h2>
            <div className={styles.newsletterBox}>
              <input
                type="email"
                placeholder="Votre email"
                className={styles.newsInput}
              />
              <button className={styles.newsBtn}>{"S'abonner"}</button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mainFooter}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {/* Colonne Marque */}
            <div className={styles.brandCol}>
              <h2 className={styles.logo}>
                ART JATIE<span>.</span>
              </h2>
              <p className={styles.brandDesc}>
                {"L'excellence"} du crochet malgache. Chaque pièce est une œuvre
                unique, tissée à la main pour sublimer votre féminité avec
                audace et élégance.
              </p>
              <div className={styles.socials}>
                <a href="#" aria-label="Instagram">
                  IG
                </a>
                <a href="#" aria-label="Facebook">
                  FB
                </a>
                <a href="#" aria-label="TikTok">
                  TK
                </a>
                <a href="#" aria-label="WhatsApp">
                  WA
                </a>
              </div>
            </div>

            {/* Colonne Navigation */}
            <div className={styles.linkCol}>
              <h3 className={styles.columnTitle}>Explorer</h3>
              <nav className={styles.nav}>
                <Link href="/boutique">La Boutique</Link>
                <Link href="/commande">Sur Mesure</Link>
                <Link href="/histoire">Notre Histoire</Link>
                
              </nav>
            </div>

            {/* Colonne Aide */}
            <div className={styles.linkCol}>
              <h3 className={styles.columnTitle}>Aide & Infos</h3>
              <nav className={styles.nav}>
                <Link href="/livraison">Livraison & Retours</Link>
                <Link href="/guide">Guide des Tailles</Link>
                  
                <Link href="/contact">Contactez-nous</Link>
              </nav>
            </div>

            {/* Colonne Contact / Localisation */}
            <div className={styles.contactCol}>
              <h3 className={styles.columnTitle}>Atelier</h3>
              <div className={styles.contactList}>
                <div className={styles.contactItem}>
                  <svg
                    className={styles.contactIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>Seganinga, Nosy Be, Madagascar</span>
                </div>

                <div className={styles.contactItem}>
                  <svg
                    className={styles.contactIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <a href="mailto:contact@artjatie.mg">contact@artjatie.mg</a>
                </div>

                <div className={styles.contactItem}>
                  <svg
                    className={styles.contactIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  <a href="tel:+261340000000">+261 34 30 513 60</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de fin avec Watermark géant en fond */}
      <div className={styles.bottomBar}>
        <div className={styles.container}>
          <div className={styles.bottomFlex}>
            <p className={styles.copyright}>
              © {new Date().getFullYear()} Art Jatie. Conçu avec passion à
              Madagascar.
            </p>
            <div className={styles.legalLinks}>
              <Link href="/mentions">Mentions Légales</Link>
              <Link href="/confidentialite">Confidentialité</Link>
            </div>
          </div>
        </div>
        <div className={styles.bigWatermark}>ART JATIE</div>
      </div>
    </footer>
  );
}
