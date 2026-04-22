// types/index.ts

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  description: string;
  image_url: string;
  stock: number;
  category: string;
  is_active: boolean;
  images: { src: string }[];
}

export interface NavItem {
  label: string;
  href: string;
}
