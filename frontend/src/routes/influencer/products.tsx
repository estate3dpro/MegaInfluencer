import { createFileRoute } from "@tanstack/react-router";
import { ProductsPage } from "@/features/influencer/pages/CommercePages";
export const Route = createFileRoute("/influencer/products")({ component: ProductsPage });
