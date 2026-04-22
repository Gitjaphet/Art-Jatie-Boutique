"use client";

import { usePathname } from "next/navigation";
import "@/css/globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import FloatingAI from "@/components/FloatingAI";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  // On définit les pages qui ont un fond clair (Boutique, etc.)
  const isLightPage =
    pathname.startsWith("/boutique") ||
    pathname.startsWith("/produit") ||
    pathname.startsWith("/panier") ||
    pathname.startsWith("/") ||
    pathname.startsWith("/galerie") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/commande");

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: isHome ? "#2d2d2d" : "#fdfaf7",
          color: isHome ? "#f8f4ef" : "#1a1a1a",
          minHeight: "100vh",
          // ← retire display: flex et flexDirection: column
        }}
      >
        {!isHome && <Header darkIcons={isLightPage} />}

        <main
          style={{
            // ← retire flex: 1
            paddingTop: !isHome ? "100px" : "0",
          }}
        >
          {children}
        </main>

        {!isHome && <Footer />}
        {/* Composants flottants */}
        <FloatingAI />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
