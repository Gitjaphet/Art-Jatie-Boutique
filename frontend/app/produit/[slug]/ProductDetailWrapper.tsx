import ProductDetailPage from "./ProductDetailPage";

export default function ProductDetailWrapper({
  product,
  reviews,
  aggregate,
}: {
  product: any;
  reviews?: any[];
  aggregate?: { average_rating: number; review_count: number } | null;
}) {
  return (
    <ProductDetailPage
      product={product}
      isSurMesure={Boolean(product.on_order)}
      reviews={reviews ?? []}
      aggregate={aggregate ?? null}
    />
  );
}