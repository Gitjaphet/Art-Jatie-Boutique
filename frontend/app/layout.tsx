"use client";

import { usePathname } from "next/navigation";
import "@/css/globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import FloatingAI from "@/components/FloatingAI";
import { GoogleAuthProvider } from "@/lib/googleAuth";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const isLightPage =
    pathname.startsWith("/boutique") ||
    pathname.startsWith("/produit") ||
    pathname.startsWith("/panier") ||
    pathname.startsWith("/galerie") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/commande") ||
    pathname.startsWith("/livraison") ||
    pathname.startsWith("/mentions-legales") ||
    pathname.startsWith("/confidentialite") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/histoire") ||
    pathname.startsWith("/guide") ||  // ← virgule au lieu de point-virgule
    pathname === "/";                  // ← maintenant évalué correctement

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: isHome ? "#2d2d2d" : "#fdfaf7",
          color: isHome ? "#f8f4ef" : "#1a1a1a",
          minHeight: "100vh",
        }}
      >
        <GoogleAuthProvider>
          {!isHome && <Header darkIcons={isLightPage} />}

          <main style={{ paddingTop: !isHome ? "100px" : "0" }}>
            {children}
          </main>

          {!isHome && <Footer />}
          <FloatingAI />
          <FloatingWhatsApp />
        </GoogleAuthProvider>
      </body>
    </html>
  );
}