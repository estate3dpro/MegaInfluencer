import { createFileRoute } from "@tanstack/react-router";
import { ProductsPage } from "@/features/store-admin/pages/CommercePages";

export const Route = createFileRoute("/store-admin/products/")({ component: ProductsPage });
