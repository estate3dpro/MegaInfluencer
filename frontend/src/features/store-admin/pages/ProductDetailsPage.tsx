import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Package } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/lib/api/client";
import { Route } from "@/routes/store-admin/products/$productId";

function money(price: string | null | undefined, currency: string | null | undefined) { const value = Number(price); const code = currency ?? "INR"; return Number.isFinite(value) ? new Intl.NumberFormat("en-IN", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(value) : "Price unavailable"; }

export function ProductDetailsPage() {
  const { productId } = Route.useParams();
  const query = useQuery({ queryKey: ["store", "products", productId], queryFn: async () => (await apiClient.get<{ product: any }>(`/store/products/${productId}`)).data.product });
  const product = query.data; const raw = product?.payload ?? {}; const images = raw.images?.nodes ?? raw.images ?? []; const variants = raw.variants?.nodes ?? raw.variants ?? [];
  if (query.isLoading) return <div className="h-80 animate-pulse rounded-xl bg-muted" />;
  if (!product) return <Card><CardContent className="p-6 text-destructive">Unable to load product details.</CardContent></Card>;
  return <div className="space-y-6"><Link to="/store-admin/products" className="inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft className="h-4 w-4" /> Products</Link><PageHeader title={product.title} description={`${product.vendor ?? ""} ${product.productType ? `· ${product.productType}` : ""}`} /><Card><CardContent className="p-6"><div className="flex gap-6"><img src={product.imageUrl ?? ""} alt="" className="h-32 w-32 rounded-xl bg-muted object-cover" /><div><Badge>{product.status ?? "Active"}</Badge><p className="mt-3 text-sm text-muted-foreground">Inventory: {Number(product.inventoryTotal ?? 0).toLocaleString("en-IN")}</p><p className="mt-1 text-xl font-semibold">{money(product.price, product.currency)}</p></div></div>{product.descriptionHtml ? <div className="prose mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} /> : null}</CardContent></Card><Card><CardContent className="p-6"><h2 className="font-semibold">Variants ({variants.length})</h2><div className="mt-4 space-y-2">{variants.map((variant: any) => <div key={variant.id} className="flex justify-between border-b py-3 text-sm"><span>{variant.title} · {variant.sku ?? "No SKU"}</span><span>{Number(variant.inventoryQuantity ?? 0).toLocaleString("en-IN")} in stock · {money(variant.price, product.currency)}</span></div>)}</div></CardContent></Card><Card><CardContent className="p-6"><h2 className="font-semibold">Images ({images.length})</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{images.map((image: any) => <img key={image.id ?? image.url} src={image.url} alt={image.altText ?? product.title} className="aspect-square rounded-lg object-cover" />)}</div></CardContent></Card></div>;
}
