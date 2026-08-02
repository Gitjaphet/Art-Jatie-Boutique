import type { Metadata } from "next";
import FormationPage from "./FormationPage";

const SITE_URL = "https://artjatie.com";

export const metadata: Metadata = {
  title: "Formation Crochet à Nosy Be | Cours Débutant – Art Jatie",
  description:
    "Apprenez le crochet à Nosy Be avec Art Jatie : cours pour débutantes, petits groupes de 10 personnes max, matériel inclus. Séance à 5 000 Ar ou forfait weekend à 25 000 Ar.",
  alternates: {
    canonical: `${SITE_URL}/formation`,
  },
  openGraph: {
    title: "Formation Crochet à Nosy Be – Art Jatie",
    description:
      "Cours de crochet pour débutantes à Nosy Be. Apprenez à réaliser vos propres pièces (culotte, soutif, top, sac...) avec Art Jatie.",
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
      "Cours de crochet pour débutantes à Nosy Be, petits groupes, matériel inclus.",
    images: [`${SITE_URL}/images/formation/formation-crochet-nosybe-og.jpg`],
  },
  keywords: [
    "formation crochet Nosy Be",
    "cours crochet Madagascar",
    "apprendre le crochet Nosy Be",
    "crochet débutant Nosy Be",
    "atelier crochet Madagascar",
    "Art Jatie formation",
  ],
};

// JSON-LD : Course + Provider + Breadcrumb.
// Pas d'AggregateRating ici volontairement : on n'a pas de notes vérifiables,
// et Google sanctionne les faux avis structurés. Les témoignages restent en HTML visible.
const courseJsonLd = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Formation Crochet Débutant – Art Jatie",
  description:
    "Cours de crochet pour débutantes à Nosy Be : point de base, technique du granny square, finitions, et réalisation de vos propres pièces (culotte, soutif, top, robe, short, sac, chapeau).",
  provider: {
    "@type": "Organization",
    name: "Art Jatie",
    sameAs: "https://www.facebook.com/artjatie",
    url: SITE_URL,
  },
  hasCourseInstance: [
    {
      "@type": "CourseInstance",
      courseMode: "Onsite",
      courseWorkload: "PT2H",
      location: {
        "@type": "Place",
        name: "Art Jatie",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Nosy Be",
          addressCountry: "MG",
        },
      },
      offers: {
        "@type": "Offer",
        price: "5000",
        priceCurrency: "MGA",
        availability: "https://schema.org/InStock",
        description: "Tarif à la séance",
      },
    },
    {
      "@type": "CourseInstance",
      courseMode: "Onsite",
      courseWorkload: "P2D",
      location: {
        "@type": "Place",
        name: "Art Jatie",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Nosy Be",
          addressCountry: "MG",
        },
      },
      offers: {
        "@type": "Offer",
        price: "25000",
        priceCurrency: "MGA",
        availability: "https://schema.org/InStock",
        description: "Forfait weekend complet (2 jours), matériel inclus",
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