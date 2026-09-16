import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
};

export type Filter<T> = {
  key: string;
  label: string;
  options: string[];
  match: (row: T, value: string) => boolean;
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  search,
  searchPlaceholder = "Search…",
  filters = [],
  selectable = false,
  bulkActions,
  onRowClick,
  pageSize = 8,
  toolbarExtra,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  className,
}: {
  rows: T[];
  columns: Column<T>[];
  search?: (row: T) => string;
  searchPlaceholder?: string;
  filters?: Filter<T>[];
  selectable?: boolean;
  bulkActions?: (selected: T[], clear: () => void) => ReactNode;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  toolbarExtra?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (query && search && !search(row).toLowerCase().includes(query.toLowerCase())) return false;
      for (const f of filters) {
        const value = active[f.key];
        if (value && value !== "all" && !f.match(row, value)) return false;
      }
      return true;
    });
  }, [rows, query, active, filters, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const selectedRows = rows.filter((r) => selected.includes(r.id));
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.includes(r.id));

  return (
    <div className={cn("rounded-xl border bg-card shadow-card", className)}>
      <div className="flex flex-wrap items-center gap-2 border-b p-4">
        {search ? (
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
        ) : null}
        {filters.map((f) => (
          <Select
            key={f.key}
            value={active[f.key] ?? "all"}
            onValueChange={(v) => {
              setActive((prev) => ({ ...prev, [f.key]: v }));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {f.label.toLowerCase()}</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o} value={o} className="capitalize">
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        {toolbarExtra}
      </div>

      {selectable && selectedRows.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-secondary/60 px-4 py-2.5">
          <p className="text-sm font-medium text-secondary-foreground">
            {selectedRows.length} selected
          </p>
          <div className="flex items-center gap-2">
            {bulkActions?.(selectedRows, () => setSelected([]))}
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="p-4">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                {selectable ? (
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={(checked) =>
                        setSelected((prev) =>
                          checked
                            ? Array.from(new Set([...prev, ...visible.map((r) => r.id)]))
                            : prev.filter((id) => !visible.some((r) => r.id === id)),
                        )
                      }
                      aria-label="Select all rows"
                    />
                  </th>
                ) : null}
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 font-medium",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                    )}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b last:border-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-accent/50",
                  )}
                >
                  {selectable ? (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.includes(row.id)}
                        onCheckedChange={(checked) =>
                          setSelected((prev) =>
                            checked ? [...prev, row.id] : prev.filter((id) => id !== row.id),
                          )
                        }
                        aria-label={`Select ${row.id}`}
                      />
                    </td>
                  ) : null}
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-4 py-3 align-middle",
                        c.align === "right" && "text-right",
                        c.align === "center" && "text-center",
                        c.className,
                      )}
                    >
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
        <span>
          {filtered.length === 0
            ? "0 results"
            : `${(current - 1) * pageSize + 1}–${Math.min(current * pageSize, filtered.length)} of ${filtered.length}`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 text-xs">
            Page {current} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={current === pageCount}
            onClick={() => setPage(current + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
