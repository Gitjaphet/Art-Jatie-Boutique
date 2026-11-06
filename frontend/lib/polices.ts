// Source unique des polices du site, chargées et hébergées par Next.js (next/font).
// Les variables CSS --nf-* sont reprises dans css/globals.css :
//   --font-manuscrite (Caveat), --font-display (Cormorant Garamond), --font-body (Jost).
import { Caveat, Cormorant_Garamond, Jost } from "next/font/google";

const manuscrite = Caveat({
  subsets: ["latin"],
  variable: "--nf-caveat",
  display: "swap",
});

const titres = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--nf-cormorant",
  display: "swap",
});

const texte = Jost({
  subsets: ["latin"],
  variable: "--nf-jost",
  display: "swap",
});

export const classesPolices = [manuscrite.variable, titres.variable, texte.variable].join(" ");
