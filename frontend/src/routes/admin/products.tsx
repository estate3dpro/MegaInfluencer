import { createFileRoute } from "@tanstack/react-router";
import { ProductsPage } from "@/features/admin/pages/EcosystemPages";
export const Route = createFileRoute("/admin/products")({ component: ProductsPage });
