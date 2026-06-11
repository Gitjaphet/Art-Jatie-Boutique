"use client";

import { useSearchParams } from "next/navigation";
import ProductDetailPage from "./ProductDetailPage";

export default function ProductDetailWrapper({ product }: { product: any }) {
  const searchParams = useSearchParams();
  const isSurMesure = searchParams.get("mode") === "sur-mesure";

  return <ProductDetailPage product={product} isSurMesure={isSurMesure} />;
}