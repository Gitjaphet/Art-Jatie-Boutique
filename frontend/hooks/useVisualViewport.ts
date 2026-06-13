import { useEffect, useState } from "react";

/**
 * Retourne la hauteur réelle du viewport visible (au-dessus du clavier virtuel).
 * Sur iOS Safari, window.innerHeight ne se met pas à jour quand le clavier s'ouvre.
 * visualViewport.height, lui, reflète l'espace réellement disponible.
 */
export function useVisualViewport(): number {
  const getHeight = () =>
    typeof window !== "undefined"
      ? (window.visualViewport?.height ?? window.innerHeight)
      : 0;

  const [height, setHeight] = useState<number>(getHeight);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handler = () => setHeight(vv.height);

    vv.addEventListener("resize", handler);
    vv.addEventListener("scroll", handler);

    // Init immédiat
    handler();

    return () => {
      vv.removeEventListener("resize", handler);
      vv.removeEventListener("scroll", handler);
    };
  }, []);

  return height;
}