import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ProductsPage } from "@/features/influencer/pages/CommercePages";
export const Route = createFileRoute("/influencer/products")({
  validateSearch: z.object({ campaignId: z.string().optional(), campaignTitle: z.string().optional() }),
  component: ProductsRoute,
});

function ProductsRoute() {
  const { campaignId, campaignTitle } = Route.useSearch();
  return <ProductsPage campaignId={campaignId} campaignTitle={campaignTitle} />;
}
