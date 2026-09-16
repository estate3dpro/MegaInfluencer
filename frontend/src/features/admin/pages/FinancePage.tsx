import { Download, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type FinancePageConfig = {
  title: string;
  description: string;
  searchLabel: string;
  icon: LucideIcon;
  metrics: ReadonlyArray<{ label: string; value: string; detail: string }>;
  columns: readonly string[];
  rows: ReadonlyArray<
    readonly [primary: string, secondary: string, values: readonly string[], status: string]
  >;
};

export function FinancePage({ config }: { config: FinancePageConfig }) {
  const Icon = config.icon;
  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <>
            <Button variant="outline">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button variant="outline">Date range</Button>
          </>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        {config.metrics.map((metric) => (
          <Card key={metric.label} className="shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{metric.value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <Card className="shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder={`Search ${config.searchLabel}…`} />
          </div>
          <Button variant="outline">Filters</Button>
        </div>
        <CardContent className="overflow-x-auto border-t p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Record</th>
                {config.columns.map((column) => (
                  <th key={column} className="px-4 py-3 font-medium">
                    {column}
                  </th>
                ))}
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {config.rows.map(([primary, secondary, values, status]) => (
                <tr key={primary} className="border-b last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-medium">{primary}</p>
                        <p className="text-xs text-muted-foreground">{secondary}</p>
                      </div>
                    </div>
                  </td>
                  {values.map((value, index) => (
                    <td key={`${primary}-${index}`} className="px-4 py-4">
                      {value}
                    </td>
                  ))}
                  <td className="px-5 py-4">
                    <Badge
                      variant={
                        status === "Paid" || status === "Completed" || status === "Settled"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
