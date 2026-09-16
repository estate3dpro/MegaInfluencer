import { PageHeader } from "@/components/app/PageHeader";
import { roleMeta, type Role } from "@/config/nav";

type WorkspacePageProps = { role: Role; page: string };

export function WorkspacePage({ role, page }: WorkspacePageProps) {
  const title = page
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={`${roleMeta[role].name} workspace`} />
      <div className="rounded-xl border border-dashed bg-card p-8 text-sm text-muted-foreground">
        {title} is ready for its feature module.
      </div>
    </div>
  );
}
