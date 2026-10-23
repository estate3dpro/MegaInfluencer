import { Outlet, createFileRoute } from "@tanstack/react-router";

// This is a layout route: the affiliate table and an individual link report
// are sibling children, so navigating to a report does not render the table.
export const Route = createFileRoute("/store-admin/affiliate")({ component: Outlet });
