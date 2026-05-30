import { getProductBySlug } from "@/lib/api";
import Link from "next/link";
import ProductDetailPage from "./ProductDetailPage";

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

  return <ProductDetailPage product={product} />;
}