"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Header.module.css";
import Image from "next/image";
import MobileNav from "./MobileNav";
import CartBadge from "./CartBadge";

const NAV_LINKS = [
  { href: "/boutique", label: "Boutique" },
  { href: "/commande", label: "Sur Commande" },
  { href: "/histoire", label: "À propos" },
  { href: "/galerie", label: "Galerie" },
  { href: "/contact", label: "Contactez-nous" },
];

export default function Header({ darkIcons = false }: { darkIcons?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const colorClass = isScrolled || darkIcons ? styles.darkTheme : "";

  return (
    <header
      className={`${styles.header} ${isScrolled ? styles.headerScrolled : ""} ${colorClass}`}
    >
      <Link href="/" className={styles.logo}>
        <Image
          src="/images/logo/art_jatie.png"
          alt="Art Jatie"
          width={180}
          height={180}
          style={{ objectFit: "contain" }}
        />
      </Link>

      <nav className={styles.nav}>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.navLink} 
              ${pathname === link.href ? styles.active : ""} 
              ${!darkIcons && !isScrolled ? styles.navHome : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className={styles.actions}>
        <div className={styles.socials}>
          <a href="#" className={styles.socialLink} aria-label="Facebook">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a href="#" className={styles.socialLink} aria-label="TikTok">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
            </svg>
          </a>
          <a href="#" className={styles.socialLink} aria-label="YouTube">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
            </svg>
          </a>
        </div>

        {/* ✅ CartBadge est un composant client isolé — zéro erreur linter */}
        <Link
          href="/panier"
          className={styles.cartBtn}
          aria-label="Voir le panier"
        >
          <div className={styles.cartIcon}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <CartBadge />
        </Link>

        <div className={styles.mobileNavWrapper}>
          <MobileNav navItems={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
