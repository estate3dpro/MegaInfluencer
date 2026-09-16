import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/store-admin/")({
  beforeLoad: () => {
    throw redirect({ to: "/store-admin/dashboard" });
  },
});
