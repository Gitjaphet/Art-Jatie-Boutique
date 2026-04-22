import Link from 'next/link';
import Image from 'next/image'; // Utilisation du composant Image de Next pour la performance

interface ProductCardProps {
  product: any; // Tu pourras remplacer 'any' par ton interface Product plus tard
}

export default function ProductCard({ product }: ProductCardProps) {
  // Image par défaut si aucune image n'est fournie par WooCommerce
  const imageUrl = product.images?.[0]?.src || '/placeholder-product.png';

  return (
    <div className="border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden flex flex-col h-full">
      {/* Image du produit */}
      <div className="relative h-64 w-full bg-gray-100">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Détails du produit */}
      <div className="p-4 flex flex-col flex-grow">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{product.name}</h2>
        <p className="text-green-600 font-bold text-lg mb-4">
          {product.price} Ar
        </p>

        <div className="mt-auto">
          <Link href={`/produit/${product.slug}`}>
            <button className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition-colors">
              Voir le produit
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}