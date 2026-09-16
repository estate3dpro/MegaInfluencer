import { createFileRoute } from "@tanstack/react-router";
import { ProductDetailsPage } from "@/features/store-admin/pages/ProductDetailsPage";

export const Route = createFileRoute("/store-admin/products/$productId")({ component: ProductDetailsPage });
