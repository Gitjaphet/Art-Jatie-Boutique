import { getProductBySlug } from "@/lib/api";
import Link from "next/link";
import AddToCartButton from "@/components/product/AddToCartButton";

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
        <Link href="/" className="text-blue-500 underline mt-4 block">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-10 flex flex-col items-center">
      <Link href="/" className="mb-10 text-blue-500 hover:underline">
        ← Retour à la boutique
      </Link>
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-gray-100 rounded-lg overflow-hidden">
          {product.images[0] && (
            <img
              src={product.images[0].src}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
          <p className="text-2xl text-green-600 font-bold mb-6">
            {product.price} Ar
          </p>
          <div
            className="prose mb-8 text-gray-600"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
