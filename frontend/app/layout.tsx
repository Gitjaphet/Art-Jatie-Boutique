"use client";

import { usePathname } from "next/navigation";
import "@/css/globals.css";
import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import SmoothScroll from "@/components/SmoothScroll";
import { GoogleAuthProvider } from "@/lib/googleAuth";

const Footer = dynamic(() => import("@/components/layout/Footer"));
const FloatingWhatsApp = dynamic(() => import("@/components/FloatingWhatsApp"), { ssr: false });
const FloatingAI = dynamic(() => import("@/components/FloatingAI"), { ssr: false });

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
    pathname.startsWith("/formation") ||
    pathname.startsWith("/guide") ||
    pathname === "/";

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
          <SmoothScroll>
            <Header darkIcons={isLightPage} />
            <main style={{ paddingTop: isHome ? "0" : "100px" }}>
              {children}
            </main>
            <Footer />
          </SmoothScroll>
          <FloatingAI />
          <FloatingWhatsApp />
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
