import { getProductBySlug, getProducts } from "@/lib/api";
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

  return {
    title: `${product.name} — Art Jatie`,
    description,
    openGraph: {
      title: `${product.name} — Art Jatie`,
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

  return (
    <Suspense fallback={null}>
      <ProductDetailWrapper product={product} />
    </Suspense>
  );
}