// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  // ... vos autres réglages
  theme: {
    extend: {
      fontFamily: {
        // On définit 'gochi' pour utiliser la police importée
        gochi: ['"Gochi Hand"', 'cursive'],
      },
    },
  },
  plugins: [],
};
export default config;