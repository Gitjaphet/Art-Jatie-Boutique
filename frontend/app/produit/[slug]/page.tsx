import { getProductBySlug, getProducts, getProductReviews, getProductReviewAggregate } from "@/lib/api";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import ProductDetailWrapper from "./ProductDetailWrapper";

export async function generateStaticParams() {
  try {
    const [inStock, onOrder] = await Promise.all([
      getProducts(false),
      getProducts(true),
    ]);
    const all = [...inStock, ...onOrder];
    return all
      .filter((p: any) => p.slug)
      .map((p: any) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);

  if (!product) {
    return { title: "Produit introuvable — Art Jatie" };
  }

  const description =
    product.description?.replace(/<[^>]+>/g, "").slice(0, 155) ||
    "Création artisanale en crochet fait main par nos artisanes malgaches.";

  const pageTitle = product.name.toLowerCase().includes("crochet")
    ? `${product.name} | Art Jatie`
    : `${product.name} – crochet fait main | Art Jatie`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      images: product.image ? [{ url: product.image }] : [],
      type: "website",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);

  if (!product) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-red-500">Produit introuvable</h1>
        <Link href="/boutique" className="text-blue-500 underline mt-4 block">
          Retour à la boutique
        </Link>
      </div>
    );
  }

   const [reviews, aggregate] = await Promise.all([
    getProductReviews(product.id),
    getProductReviewAggregate(product.id),
  ]);

  // Délai de fabrication (sur commande) ou de préparation (en stock)
  const handlingTime = {
    "@type": "QuantitativeValue",
    minValue: product.on_order ? 7 : 1,
    maxValue: product.on_order ? 14 : 2,
    unitCode: "DAY",
  };

  // Schema.org Product
  const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description:
    product.description ||
    "Création artisanale en crochet fait main par nos artisanes malgaches.",
  image: product.image,
  sku: `artjatie-${product.id}`,
  brand: {
    "@type": "Brand",
    name: "Art Jatie",
  },
  offers: {
    "@type": "Offer",
    priceCurrency: "MGA",
    price: product.rawPrice,
    // Produit sur commande = fabriqué à la demande, donc disponible
    availability:
      product.on_order || (product.stock_quantity && product.stock_quantity > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    seller: {
      "@type": "Organization",
      name: "Art Jatie",
    },
    // Les tarifs sont sur devis (cf. /livraison) : aucun shippingRate déclaré
    shippingDetails: [
      {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "MG",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime,
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 0,   // Demi-journée à Nosy Be
            maxValue: 7,   // Jusqu'à 7 jours pour le reste de Madagascar
            unitCode: "DAY",
          },
        },
      },
      {
        "@type": "OfferShippingDetails",
        shippingDestination: ["FR", "RE", "YT", "MU", "BE", "DE", "IT"].map(
          (c) => ({ "@type": "DefinedRegion", addressCountry: c })
        ),
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime,
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 7,   // 7 jours (avion) à 3 mois (bateau)
            maxValue: 90,
            unitCode: "DAY",
          },
        },
      },
    ],
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "MG",
      returnPolicyCategory:
        "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 2,
      returnMethod: "https://schema.org/ReturnByMail",
      merchantReturnLink: "https://www.artjatie.com/livraison",
      refundType: "https://schema.org/FullRefund",
      returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
    },
  },
};

  if (aggregate) {
    (jsonLd as any).aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregate.average_rating,
      reviewCount: aggregate.review_count,
    };
  }

  if (reviews.length > 0) {
    (jsonLd as any).review = reviews.slice(0, 10).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author_name },
      datePublished: r.created_at.split("T")[0],
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: r.comment,
      ...(r.title ? { name: r.title } : {}),
    }));
  }

  return (
    <>
      {/* Schema.org injecté dans le <head> */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <ProductDetailWrapper product={product} reviews={reviews} aggregate={aggregate} />
      </Suspense>
    </>
  );
}
