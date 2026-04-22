'use client'; // ⚠️ Très important : Ce composant fonctionne dans le navigateur

import { useCartStore } from '@/lib/cart';

export default function AddToCartButton({ product }: { product: any }) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <button
      onClick={() => {
        addItem(product);
        alert("Ajouté au panier !"); // Petit message temporaire
      }}
      className="bg-black text-white px-8 py-3 rounded-full text-lg hover:bg-gray-800 transition active:scale-95"
    >
      Ajouter au panier
    </button>
  );
}