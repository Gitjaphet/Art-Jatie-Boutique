"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";

// Hauteur du header fixe : les ancres (#formules…) s'arrêtent juste en dessous
const HEADER_OFFSET = -100;

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [reduceMotion, setReduceMotion] = useState(false);

  // Respecte le réglage "réduire les animations" du système
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const smooth = !reduceMotion && !pathname.startsWith("/admin");

  // Options mémorisées : Lenis n'est recréé que si "smooth" change.
  // Quand smooth = false, Lenis n'intercepte plus la molette (défilement natif).
  const options = useMemo(
    () => ({
      lerp: 0.08, // plus petit = plus "glissant" (0.1 par défaut)
      smoothWheel: smooth,
      anchors: { offset: HEADER_OFFSET },
    }),
    [smooth]
  );

  return (
    <ReactLenis root options={options}>
      <ResetScrollOnRouteChange />
      {children}
    </ReactLenis>
  );
}

// Remonte en haut à chaque nouvelle page, sauf si l'URL vise une ancre (#…)
function ResetScrollOnRouteChange() {
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis || window.location.hash) return;
    lenis.scrollTo(0, { immediate: true });
  }, [pathname, lenis]);

  return null;
}
