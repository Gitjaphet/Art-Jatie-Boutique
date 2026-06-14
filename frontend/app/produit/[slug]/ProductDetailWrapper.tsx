import ProductDetailPage from "./ProductDetailPage";

export default function ProductDetailWrapper({ product }: { product: any }) {
  return <ProductDetailPage product={product} isSurMesure={Boolean(product.on_order)} />;
}