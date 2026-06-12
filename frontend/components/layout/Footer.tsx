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
                <a href="https://www.instagram.com/artjatie" target="_blank" rel="noopener noreferrer" aria-label="Instagram">IG</a>
                <a href="https://www.facebook.com/profile.php?id=61588409926655" target="_blank" rel="noopener noreferrer" aria-label="Facebook">FB</a>
                <a href="https://www.tiktok.com/@jatiejeart" target="_blank" rel="noopener noreferrer" aria-label="TikTok">TK</a>
                <a href="https://wa.me/261343051360" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">WA</a>
              </div>
            </div>

            {/* Colonne Navigation */}
            <div className={styles.linkCol}>
              <h3 className={styles.columnTitle}>Explorer</h3>
              <nav className={styles.nav}>
                <Link href="/boutique">La Boutique</Link>
                <Link href="/commande">Sur Mesure</Link>
                <Link href="/histoire">Notre Histoire</Link>
                <Link href="/galerie">Nos galeries</Link>
              </nav>
            </div>

            {/* Colonne Aide */}
            <div className={styles.linkCol}>
              <h3 className={styles.columnTitle}>Aide & Infos</h3>
              <nav className={styles.nav}>
                <Link href="/livraison">Livraison & Retours</Link>
                <Link href="/guide">Guide des Tailles</Link>
                <Link href="/mentions">Mentions légales</Link>
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
                  <a href="tel:+261340000000">+261 32 02 251 70</a>
                </div>

                <div className={styles.contactItem}>
                  <svg
                    className={styles.contactIcon}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.121 1.535 5.856L.057 23.882a.5.5 0 00.606.61l6.208-1.625A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.003-1.368l-.36-.214-3.706.972.988-3.613-.235-.372A9.789 9.789 0 012.182 12C2.182 6.575 6.575 2.182 12 2.182c5.424 0 9.818 4.393 9.818 9.818 0 5.424-4.394 9.818-9.818 9.818z" />
                  </svg>
                  
                  <a href="https://wa.me/261343051360"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    +261 34 30 513 60
                  </a>
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
