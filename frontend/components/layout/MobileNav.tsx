"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  disableBodyScroll,
  enableBodyScroll,
  clearAllBodyScrollLocks,
} from "body-scroll-lock";
import Link from "next/link";
import { FaInstagram, FaFacebook } from "react-icons/fa";
import styles from "./MobileNav.module.css"; // Import du nouveau design

export interface NavItem {
  href: string;
  label: string;
}

export default function MobileNav({ navItems }: { navItems: NavItem[] }) {
  const [navShow, setNavShow] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const onToggleNav = () => setNavShow((status) => !status);

  useEffect(() => {
    const target = navRef.current;
    if (!target) return;
    if (navShow) {
      disableBodyScroll(target);
    } else {
      enableBodyScroll(target);
    }
    return () => clearAllBodyScrollLocks();
  }, [navShow]);

  return (
    <>
      {/* Bouton Burger (intégré dans le Header) */}
      <button
        aria-label="Toggle Menu"
        onClick={onToggleNav}
        className={`md:hidden ${styles.burgerBtn}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
        >
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <Transition show={navShow} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[200] md:hidden"
          onClose={onToggleNav}
        >
          {/* L'OVERLAY : Fond assombri et flou */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          {/* ZONE DU MENU */}
          <div className="fixed inset-0 flex justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className={styles.panel} ref={navRef}>
                {/* 1. HEADER DU MENU */}
                <div className={styles.header}>
                  <span className={styles.brand}>Art Jatie</span>
                  <button
                    onClick={onToggleNav}
                    className={styles.closeBtn}
                    aria-label="Fermer le menu"
                  >
                    <svg
                      className="h-7 w-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* 2. LIENS DE NAVIGATION */}
                <nav className={styles.navContainer}>
                  {navItems.map((item, index) => {
                    // Pour afficher "01", "02", etc.
                    const number = String(index + 1).padStart(2, "0");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={styles.navLink}
                        onClick={onToggleNav}
                      >
                        <span className={styles.navNumber}>{number}</span>
                        <span className={styles.navText}>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                {/* 3. FOOTER (Réseaux Sociaux) */}
                <div className={styles.footer}>
                  <p className={styles.footerLabel}>Suivez-nous</p>
                  <div className={styles.socials}>
                    <a
                      href="#"
                      className={styles.socialIcon}
                      aria-label="Instagram"
                    >
                      <FaInstagram size={22} />
                    </a>
                    <a
                      href="#"
                      className={styles.socialIcon}
                      aria-label="Facebook"
                    >
                      <FaFacebook size={22} />
                    </a>
                    {/* Ajout de TikTok si besoin */}
                    <a
                      href="#"
                      className={styles.socialIcon}
                      aria-label="TikTok"
                    >
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
                        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
