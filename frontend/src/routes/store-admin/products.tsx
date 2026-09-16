import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/store-admin/products")({ component: Outlet });
