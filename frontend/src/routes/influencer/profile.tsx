import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/features/influencer/pages/ProfilePage";

export const Route = createFileRoute("/influencer/profile")({ component: ProfilePage });
