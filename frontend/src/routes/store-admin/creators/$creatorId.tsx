import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Package, Plus, Search, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  getCreatorAssignedProducts,
  updateCreatorAssignedProducts,
  type AssignableProduct,
} from "@/features/store-admin/api/creators.api";

export const Route = createFileRoute("/store-admin/creators/$creatorId")({ component: Page });

function Page() {
  const { creatorId } = Route.useParams();
  const queryClient = useQueryClient();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // 1. Fetch Creator Info
  const creatorQuery = useQuery({
    queryKey: ["store", "creator", creatorId],
    queryFn: async () => (await apiClient.get<any>(`/store/creators/${creatorId}`)).data,
  });

  // 2. Fetch Creator Products
  const productsQuery = useQuery({
    queryKey: ["store", "creator-products", creatorId],
    queryFn: () => getCreatorAssignedProducts(creatorId),
  });

  // 3. Mutation to update assigned products
  const updateMutation = useMutation({
    mutationFn: (productIds: string[]) => updateCreatorAssignedProducts(creatorId, productIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["store", "creator-products", creatorId] });
      setAssignDialogOpen(false);
      toast.success(`Updated assignments: ${data.assignedCount} products assigned to creator.`);
    },
    onError: () => {
      toast.error("Failed to update product assignments.");
    },
  });

  const openAssignModal = () => {
    const currentlyAssigned = productsQuery.data?.products.filter((p) => p.isAssigned).map((p) => p.id) ?? [];
    setSelectedProductIds(currentlyAssigned);
    setAssignDialogOpen(true);
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (!productsQuery.data?.products) return;
    setSelectedProductIds(productsQuery.data.products.map((p) => p.id));
  };

  const handleClearAll = () => {
    setSelectedProductIds([]);
  };

  const handleSaveAssignments = () => {
    updateMutation.mutate(selectedProductIds);
  };

  const handleRemoveSingle = (productId: string) => {
    const currentAssigned = productsQuery.data?.products.filter((p) => p.isAssigned).map((p) => p.id) ?? [];
    const newAssigned = currentAssigned.filter((id) => id !== productId);
    updateMutation.mutate(newAssigned);
  };

  if (creatorQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  if (!creatorQuery.data) {
    return <div className="text-destructive">Unable to load creator profile.</div>;
  }

  const { creator, assignedAt, instagramStatistics: stats } = creatorQuery.data;
  const instagram = creator.instagramConnection;
  const allProducts = productsQuery.data?.products ?? [];
  const assignedProducts = allProducts.filter((p) => p.isAssigned);

  const filteredModalProducts = allProducts.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const cards = [
    ["Followers", stats?.followers_count ?? "—"],
    ["Assigned Products", `${assignedProducts.length} items`],
    ["Account status", creator.status === "ACTIVE" ? "Active" : "Suspended"],
    ["Assigned to store", new Date(assignedAt).toLocaleDateString()],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2.5 mb-2">
            <Link to="/store-admin/creators">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to creators
            </Link>
          </Button>
          <h1 className="font-display text-3xl font-bold">{creator.displayName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {instagram?.username ? `@${instagram.username}` : creator.email ?? "No email address"}
          </p>
        </div>
        <Button onClick={openAssignModal}>
          <Package className="mr-2 h-4 w-4" /> Assign Products
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label as string} className="rounded-xl border bg-card p-5 shadow-card">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      {/* Assigned Products Section */}
      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-3">
          <div>
            <CardTitle>Assigned Products</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {assignedProducts.length > 0
                ? `Only these ${assignedProducts.length} products are visible to ${creator.displayName}.`
                : "No specific products assigned yet. All store products are visible to this creator by default."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={openAssignModal}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Manage Products
          </Button>
        </CardHeader>
        <CardContent className="p-5 pt-2">
          {assignedProducts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {assignedProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-xl border p-3">
                  <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-lg bg-muted shrink-0">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate text-sm">{product.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {product.price ? (product.price.startsWith("₹") ? product.price : `₹${product.price}`) : "—"}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleRemoveSingle(product.id)}
                    title="Remove assignment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Package className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No restricted product assignments</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Click &quot;Assign Products&quot; to pick specific catalog items that should exclusively appear on this creator&apos;s panel.
              </p>
              <Button size="sm" className="mt-4" onClick={openAssignModal}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Assign specific products
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Creator Profile Overview */}
      <section className="rounded-xl border bg-card p-6 shadow-card">
        <h2 className="font-semibold">Creator details</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Display name</dt>
            <dd className="mt-1 font-medium">{creator.displayName}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="mt-1 font-medium">{creator.email ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Instagram username</dt>
            <dd className="mt-1 font-medium">{instagram?.username ? `@${instagram.username}` : "Not connected"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Instagram display name</dt>
            <dd className="mt-1 font-medium">{stats?.name ?? instagram?.displayName ?? "Not available"}</dd>
          </div>
        </dl>
      </section>

      {/* Assignment Modal Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Assign Products to {creator.displayName}</DialogTitle>
            <DialogDescription>
              Select which products from your store catalog will be visible on this creator&apos;s panel.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-3 py-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select all
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Clear
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 border rounded-lg p-2 min-h-60 max-h-96">
            {filteredModalProducts.map((product) => {
              const isChecked = selectedProductIds.includes(product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    isChecked ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-5 w-5 place-items-center rounded border ${
                        isChecked ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground"
                      }`}
                    >
                      {isChecked && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="grid h-10 w-10 place-items-center overflow-hidden rounded bg-muted shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{product.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {product.price ? (product.price.startsWith("₹") ? product.price : `₹${product.price}`) : "—"}
                      </p>
                    </div>
                  </div>
                  {isChecked && <Badge variant="secondary">Selected</Badge>}
                </div>
              );
            })}
            {!filteredModalProducts.length && (
              <p className="py-10 text-center text-sm text-muted-foreground">No products match your search.</p>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              <b>{selectedProductIds.length}</b> products selected
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAssignments} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Assignments"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
