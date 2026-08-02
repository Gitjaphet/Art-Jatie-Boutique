import type { Metadata } from "next";
import FormationPage from "./FormationPage";

const SITE_URL = "https://artjatie.com";

export const metadata: Metadata = {
  title: "Formation Crochet à Nosy Be | Hell-Ville, Senganinga – Art Jatie",
  description:
    "Cours de crochet à Hell-Ville (Senganinga), Nosy Be. Formation complète 2 mois à 80 000 Ar (shorts, robes, bikinis, sacs...) ou cours à la carte à 5 000 Ar/séance.",
  alternates: {
    canonical: `${SITE_URL}/formation`,
  },
  openGraph: {
    title: "Formation Crochet à Nosy Be – Art Jatie",
    description:
      "Formation complète (2 mois, 80 000 Ar) ou cours à la carte (5 000 Ar/séance) à Hell-Ville, Nosy Be. Apprenez à confectionner shorts, robes, bikinis, sacs et plus.",
    url: `${SITE_URL}/formation`,
    siteName: "Art Jatie",
    type: "website",
    locale: "fr_FR",
    images: [
      {
        url: `${SITE_URL}/images/formation/formation-crochet-nosybe-og.jpg`,
        width: 1200,
        height: 630,
        alt: "Cours de crochet Art Jatie à Nosy Be",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Formation Crochet à Nosy Be – Art Jatie",
    description:
      "Formation complète (2 mois, 80 000 Ar) ou cours à la carte (5 000 Ar/séance) à Hell-Ville, Nosy Be.",
    images: [`${SITE_URL}/images/formation/formation-crochet-nosybe-og.jpg`],
  },
  keywords: [
    "formation crochet Nosy Be",
    "cours crochet Hell-Ville",
    "cours crochet Senganinga",
    "apprendre le crochet Nosy Be",
    "crochet débutant Nosy Be",
    "atelier crochet Madagascar",
    "Art Jatie formation",
  ],
};

const businessAddress = {
  "@type": "PostalAddress",
  streetAddress: "Senganinga",
  addressLocality: "Hell-Ville",
  addressRegion: "Nosy Be",
  addressCountry: "MG",
};

// JSON-LD : Course + Provider + Breadcrumb.
// Pas d'AggregateRating ici volontairement : on n'a pas de notes vérifiables,
// et Google sanctionne les faux avis structurés. Les témoignages restent en HTML visible.
const courseJsonLd = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Formation Crochet – Art Jatie",
  description:
    "Formation crochet à Hell-Ville (Senganinga), Nosy Be : point de base, granny square, finitions, et réalisation de vos propres pièces (shorts, pantalons, robes, jupes, tops, bikinis, soutiens-gorge, sacs).",
  provider: {
    "@type": "Organization",
    name: "Art Jatie",
    sameAs: "https://www.facebook.com/artjatie",
    url: SITE_URL,
  },
  hasCourseInstance: [
    {
      "@type": "CourseInstance",
      name: "Formation complète",
      courseMode: "Onsite",
      courseSchedule: {
        "@type": "Schedule",
        repeatFrequency: "P2D",
        repeatCount: 24,
      },
      location: {
        "@type": "Place",
        name: "Art Jatie",
        address: businessAddress,
      },
      offers: {
        "@type": "Offer",
        price: "80000",
        priceCurrency: "MGA",
        availability: "https://schema.org/InStock",
        description:
          "Formation complète, 2 mois, 3 séances par semaine. Paiement en 2 fois possible : 40 000 Ar à l'inscription puis 40 000 Ar une semaine après le début des cours.",
      },
    },
    {
      "@type": "CourseInstance",
      name: "Cours à la carte",
      courseMode: "Onsite",
      location: {
        "@type": "Place",
        name: "Art Jatie",
        address: businessAddress,
      },
      offers: {
        "@type": "Offer",
        price: "5000",
        priceCurrency: "MGA",
        availability: "https://schema.org/InStock",
        description: "Tarif à la séance, par modèle réalisé.",
      },
    },
  ],
};

const videoJsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "Aperçu d'une session de formation crochet Art Jatie à Nosy Be",
  description:
    "Immersion dans une session de formation crochet en petit groupe avec Art Jatie, à Nosy Be.",
  thumbnailUrl: [`${SITE_URL}/images/formation/video-poster.jpg`],
  uploadDate: "2026-07-01",
  contentUrl: `${SITE_URL}/videos/formation/session-apercu.mp4`,
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Accueil",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Formation Crochet",
      item: `${SITE_URL}/formation`,
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
      <FormationPage />
    </>
  );
}