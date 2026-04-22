// lib/cart.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

// 1. Définition de la structure d'un article (Interface)
export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category?: string; // Optionnel pour le dynamisme
}

// 2. Définition des actions du Store
interface CartState {
  items: CartItem[];
  addItem: (product: CartItem) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
}

// 3. Création du Store avec Persistance
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      // Ajouter un produit ou augmenter la quantité s'il existe déjà
      addItem: (product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(
          (item) => item.id === product.id,
        );

        if (existingItem) {
          set({
            items: currentItems.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            ),
          });
        } else {
          set({ items: [...currentItems, { ...product, quantity: 1 }] });
        }
      },

      // Supprimer un article
      removeItem: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id),
        });
      },

      // Mettre à jour la quantité (crucial pour les boutons + et -)
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item,
          ),
        });
      },

      // Vider tout le panier
      clearCart: () => set({ items: [] }),

      // Calculer le nombre total d'articles (pour la bulle sur l'icône panier)
      totalItems: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },
    }),
    {
      name: "art-jatie-cart-storage", // Nom de la clé dans le localStorage
    },
  ),
);
