import { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Edit2,
  Eye,
  FileCode2,
  Heart,
  HelpCircle,
  History,
  Instagram,
  LifeBuoy,
  MessageCircle,
  MousePointerClick,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldAlert,
  Sparkles,
  Terminal,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  deleteInstagramAutomation,
  getInstagramAutomation,
  getInstagramAutomations,
  getInstagramConnection,
  getInstagramWebhookLogs,
  updateInstagramAutomation,
  type InstagramAutomation,
  type InstagramAutomationDeliveryLog,
  type InstagramWebhookDeliveryLog,
} from "../api/instagram-automations.api";

export const automationRules = [
  {
    id: "keyword-lookbook",
    name: "Festive lookbook DM",
    trigger: "Comment contains “LOOKBOOK”",
    action: "Send link and welcome message",
    sent: 428,
    rate: "87%",
    active: true,
  },
  {
    id: "keyword-glow",
    name: "Skincare routine DM",
    trigger: "Comment contains “GLOW”",
    action: "Send routine and product links",
    sent: 216,
    rate: "82%",
    active: true,
  },
  {
    id: "new-follower",
    name: "New follower welcome",
    trigger: "New account follows you",
    action: "Send a friendly welcome",
    sent: 98,
    rate: "71%",
    active: false,
  },
];

export function InstagramAutomationPage() {
  const queryClient = useQueryClient();

  // Dialog States
  const [webhookLogsOpen, setWebhookLogsOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<InstagramAutomation | null>(null);
  const [deletingRule, setDeletingRule] = useState<InstagramAutomation | null>(null);

  // Edit Form States
  const [editName, setEditName] = useState("");
  const [editKeywordDraft, setEditKeywordDraft] = useState("");
  const [editKeywords, setEditKeywords] = useState<string[]>([]);
  const [editMessage, setEditMessage] = useState("");
  const [editFallbackMessage, setEditFallbackMessage] = useState("");
  const [editFallbackEnabled, setEditFallbackEnabled] = useState(true);
  const [editWholeWord, setEditWholeWord] = useState(true);
  const [editReplyToAny, setEditReplyToAny] = useState(false);
  const [editReplyDuplicate, setEditReplyDuplicate] = useState(false);
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "PAUSED">("ACTIVE");

  const connectionQuery = useQuery({
    queryKey: ["influencer", "instagram-connection"],
    queryFn: getInstagramConnection,
  });

  const automationsQuery = useQuery({
    queryKey: ["influencer", "instagram-automations"],
    queryFn: getInstagramAutomations,
  });

  const webhookLogsQuery = useQuery({
    queryKey: ["influencer", "instagram-webhook-logs"],
    queryFn: getInstagramWebhookLogs,
    refetchInterval: webhookLogsOpen ? 4000 : 30000,
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateInstagramAutomation>[1];
    }) => updateInstagramAutomation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["influencer", "instagram-automations"] });
      queryClient.invalidateQueries({ queryKey: ["influencer", "instagram-webhook-logs"] });
      toast.success("Automation rule updated successfully!");
      setEditingRule(null);
    },
    onError: () => {
      toast.error("Failed to update automation rule. Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInstagramAutomation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["influencer", "instagram-automations"] });
      queryClient.invalidateQueries({ queryKey: ["influencer", "instagram-webhook-logs"] });
      toast.success("Automation rule deleted successfully.");
      setDeletingRule(null);
    },
    onError: () => {
      toast.error("Failed to delete automation rule. Please try again.");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "PAUSED" }) =>
      updateInstagramAutomation(id, { status }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["influencer", "instagram-automations"] });
      toast.success(
        vars.status === "ACTIVE" ? "Automation rule activated." : "Automation rule paused.",
      );
    },
    onError: () => {
      toast.error("Failed to update status.");
    },
  });

  function startEdit(rule: InstagramAutomation) {
    setEditingRule(rule);
    setEditName(rule.name);
    setEditKeywords([...rule.keywords]);
    setEditKeywordDraft("");
    setEditMessage(rule.dmMessage);
    setEditFallbackMessage(
      rule.fallbackMessage ||
        "Hey {username}! We ran into a temporary issue with that exact link, but you can explore all our latest deals and catalog here: ",
    );
    setEditFallbackEnabled(rule.fallbackEnabled ?? true);
    setEditWholeWord(rule.wholeWordMatch);
    setEditReplyToAny(rule.replyToAnyComment);
    setEditReplyDuplicate(rule.replyOnDuplicateCommentWebhook);
    setEditStatus(rule.status);
  }

  function handleAddKeyword() {
    const keyword = editKeywordDraft.trim().replace(/^#/, "");
    if (!keyword || editKeywords.some((item) => item.toLowerCase() === keyword.toLowerCase()))
      return;
    setEditKeywords((prev) => [...prev, keyword]);
    setEditKeywordDraft("");
  }

  function handleKeywordKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      handleAddKeyword();
    }
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRule) return;

    const finalKeywords = editKeywordDraft.trim()
      ? [...editKeywords, editKeywordDraft.trim().replace(/^#/, "")]
      : editKeywords;

    if (!editName.trim() || finalKeywords.length === 0 || !editMessage.trim()) {
      toast.error("Please provide a name, at least one keyword, and a DM response message.");
      return;
    }

    updateMutation.mutate({
      id: editingRule.id,
      data: {
        name: editName.trim(),
        keywords: finalKeywords,
        dmMessage: editMessage.trim(),
        fallbackMessage: editFallbackEnabled ? editFallbackMessage.trim() : null,
        fallbackEnabled: editFallbackEnabled,
        wholeWordMatch: editWholeWord,
        replyToAnyComment: editReplyToAny,
        replyOnDuplicateCommentWebhook: editReplyDuplicate,
        status: editStatus,
      },
    });
  }

  const rawRules = automationsQuery.data ?? [];
  const connection = connectionQuery.data;
  const totalSent = rawRules.reduce((sum, rule) => sum + (rule.sentCount || 0), 0);
  const totalDeliveries = rawRules.reduce((sum, rule) => sum + (rule.deliveryCount || 0), 0);
  const recentDeliveries = webhookLogsQuery.data?.deliveries ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instagram Automation"
        description="Turn conversations into meaningful connections and conversions."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => setWebhookLogsOpen(true)}
              className="gap-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5"
            >
              <Terminal className="h-4 w-4 text-primary" />
              <span>Webhook update logging</span>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
            </Button>
            <Button asChild>
              <Link to="/influencer/instagram-automation/new">
                <Sparkles className="h-4 w-4" /> Create automation
              </Link>
            </Button>
          </div>
        }
      />

      {/* Connection Banner */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/10 via-fuchsia-500/5 to-transparent shadow-card">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground shadow-sm">
            <Instagram className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-lg font-semibold">
                {connection ? `@${connection.username} is connected` : "Instagram is not connected"}
              </p>
              {connection ? (
                <Badge className="bg-success/15 text-success hover:bg-success/15">
                  {connection.status === "ACTIVE" ? "Active" : connection.status}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {connection
                ? "Automations are responding to your audience around the clock."
                : "Connect Instagram to start responding to comments automatically."}
            </p>
            {connection ? (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Development: Instagram account ID {connection.instagramUserId}
              </p>
            ) : null}
          </div>
          <Button variant="outline" asChild>
            <Link to="/influencer/profile">Manage connection</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Metrics Row */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={MessageCircle}
          label="Messages sent"
          value={String(totalSent)}
          detail="Successfully delivered"
        />
        <Metric
          icon={Users}
          label="Delivery attempts"
          value={String(totalDeliveries)}
          detail="From your automation rules"
        />
        <Metric
          icon={MousePointerClick}
          label="Link clicks"
          value="—"
          detail="Click tracking is not available yet"
        />
        <Metric
          icon={Heart}
          label="Response rate"
          value="—"
          detail="Reply tracking is not available yet"
        />
      </section>

      {/* 1. ACTIVE AUTOMATIONS TABLE (Full Width) */}
      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-3">
          <div>
            <div className="flex items-center gap-2.5">
              <CardTitle>Active automations</CardTitle>
              <Badge variant="secondary" className="font-mono text-xs">
                {rawRules.length} {rawRules.length === 1 ? "rule" : "rules"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Rules currently listening for your audience comments and triggering direct messages.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/influencer/instagram-automation/new">
              <Plus className="h-4 w-4" /> Add rule
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 p-5 pt-1">
          {rawRules.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </span>
              <p className="mt-3 font-semibold">No automation rules created yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Set up a rule to automatically send direct messages when people comment on your Instagram posts.
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link to="/influencer/instagram-automation/new">
                  <Plus className="h-4 w-4" /> Create first automation
                </Link>
              </Button>
            </div>
          ) : (
            rawRules.map((rule) => {
              const isActive = rule.status === "ACTIVE";
              return (
                <div
                  key={rule.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border p-4 transition-all hover:border-primary/40 hover:shadow-sm lg:flex-row lg:items-center"
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() =>
                        toggleStatusMutation.mutate({
                          id: rule.id,
                          status: isActive ? "PAUSED" : "ACTIVE",
                        })
                      }
                      title={isActive ? "Click to Pause" : "Click to Activate"}
                      className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-transform active:scale-95 ${
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {isActive ? <Play className="h-4 w-4 fill-primary" /> : <Pause className="h-4 w-4" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{rule.name}</p>
                        <Badge
                          variant={isActive ? "outline" : "secondary"}
                          className={
                            isActive
                              ? "border-success/30 bg-success/10 text-success"
                              : "text-muted-foreground"
                          }
                        >
                          {isActive ? "Active" : "Paused"}
                        </Badge>
                        {rule.fallbackEnabled && rule.fallbackMessage && (
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                            Fallback Active
                          </Badge>
                        )}
                        {rule.postLabel ? (
                          <span className="truncate rounded bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground max-w-[200px]">
                            {rule.postLabel}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Comment contains{" "}
                        <span className="font-medium text-foreground">
                          “{rule.keywords.join("” or “")}”
                        </span>{" "}
                        <ArrowRight className="inline h-3.5 w-3.5 text-primary" /> Send direct message
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs italic text-muted-foreground">
                        “{rule.dmMessage}”
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-t pt-3 lg:border-t-0 lg:pt-0">
                    <div className="flex items-center gap-5 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{rule.sentCount}</p>
                        <p className="text-xs text-muted-foreground">sent</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{rule.deliveryCount}</p>
                        <p className="text-xs text-muted-foreground">attempts</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(rule)}
                        className="gap-1.5 h-8 px-2.5 text-xs font-medium"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-primary" />
                        <span>Edit</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeletingRule(rule)}
                        title="Delete automation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Rule Settings">
                        <Link
                          to="/influencer/instagram-automation/rules/$ruleId"
                          params={{ ruleId: rule.id }}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 2. RECENT ACTIVITY TABLE (Positioned Directly Below Active Automations) */}
      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Recent activity</CardTitle>
              <Badge variant="outline" className="text-xs">Live stream</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Automation performance, comment triggers, and message deliveries.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => webhookLogsQuery.refetch()}
            disabled={webhookLogsQuery.isFetching}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", webhookLogsQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 p-5 pt-2">
          {recentDeliveries.length > 0 ? (
            <div className="divide-y rounded-xl border">
              {recentDeliveries.slice(0, 5).map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex flex-col gap-2 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-semibold",
                        delivery.status === "SENT"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : delivery.status === "FAILED"
                          ? "bg-rose-500/10 text-rose-600"
                          : "bg-amber-500/10 text-amber-600",
                      )}
                    >
                      {delivery.status === "SENT" ? (
                        <Check className="h-4 w-4" />
                      ) : delivery.status === "FAILED" ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {delivery.commenterName ? `@${delivery.commenterName}` : "Commenter"}
                        </p>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] uppercase font-mono tracking-wider",
                            delivery.status === "SENT" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
                            delivery.status === "FAILED" && "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
                            delivery.status === "SKIPPED" && "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
                          )}
                        >
                          {delivery.status}
                        </Badge>
                        {delivery.fallbackSent && (
                          <Badge variant="outline" className="text-[10px] border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Fallback Delivered
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          via rule: <strong className="text-foreground">{delivery.automation?.name ?? "Automation"}</strong>
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        Comment: “{delivery.commentText}”
                      </p>
                      {delivery.errorMessage && (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 line-clamp-1">
                          Note: {delivery.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center">
                    <p className="font-mono text-xs text-muted-foreground">
                      {new Date(delivery.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(delivery.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : rawRules.some((rule) => rule.sentCount > 0) ? (
            <div className="space-y-3">
              {rawRules
                .filter((rule) => rule.sentCount > 0)
                .map((rule) => (
                  <Event
                    key={rule.id}
                    icon={MessageCircle}
                    text={`${rule.sentCount} message${rule.sentCount === 1 ? "" : "s"} sent by rule "${rule.name}"`}
                    time="Recorded from webhook deliveries"
                  />
                ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              <Activity className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 font-medium">No webhook automation deliveries recorded yet.</p>
              <p className="mt-1 text-xs">
                When people comment matching keywords on your Instagram posts, activity logs will appear here in real-time.
              </p>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWebhookLogsOpen(true)}
              className="gap-2 text-xs"
            >
              <Terminal className="h-3.5 w-3.5 text-primary" />
              View full webhook logs & fallback timeline
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="shadow-card">
        <CardContent className="grid gap-5 p-5 md:grid-cols-3">
          <div className="md:col-span-1">
            <p className="font-display text-lg font-semibold">How it works</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Use keywords in your posts and let automation deliver the right response instantly with automatic fallback protection.
            </p>
          </div>
          <HowStep
            number="1"
            title="Choose a trigger"
            text="A comment keyword or follower action starts the flow."
          />
          <HowStep
            number="2"
            title="Craft the response"
            text="Send a personal message, link or product recommendation."
          />
        </CardContent>
      </Card>

      {/* EDIT AUTOMATION DIALOG */}
      <Dialog open={Boolean(editingRule)} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle>Edit Automation Rule</DialogTitle>
              <DialogDescription>
                Update keyword triggers, primary response message, and fallback message for this automation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Rule Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Festive Lookbook Link"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Keywords Trigger</Label>
                <div className="flex gap-2">
                  <Input
                    value={editKeywordDraft}
                    onChange={(e) => setEditKeywordDraft(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    placeholder="Type a keyword and press Enter or comma"
                  />
                  <Button type="button" variant="outline" onClick={handleAddKeyword}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {editKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => setEditKeywords(editKeywords.filter((k) => k !== kw))}
                        className="text-primary hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {editKeywords.length === 0 && (
                    <p className="text-xs text-muted-foreground">Add at least one trigger keyword.</p>
                  )}
                </div>
              </div>

              {/* Primary Direct Message */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-message">Primary Direct Message</Label>
                  <span className="text-xs text-muted-foreground">Use {"{username}"} for recipient name</span>
                </div>
                <Textarea
                  id="edit-message"
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  rows={3}
                  placeholder="Hey {username}! Thanks for commenting. Here is the link: https://..."
                  required
                />
              </div>

              {/* Fallback Direct Message */}
              <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LifeBuoy className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Automated Fallback Message</p>
                      <p className="text-xs text-muted-foreground">
                        Sent automatically if the primary link is unavailable or an error occurs.
                      </p>
                    </div>
                  </div>
                  <Switch checked={editFallbackEnabled} onCheckedChange={setEditFallbackEnabled} />
                </div>

                {editFallbackEnabled && (
                  <div className="space-y-2 pt-1">
                    <Textarea
                      value={editFallbackMessage}
                      onChange={(e) => setEditFallbackMessage(e.target.value)}
                      rows={2}
                      className="bg-background text-xs"
                      placeholder="Hey {username}! We had a temporary issue finding that exact link, but you can explore our main store here: https://..."
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Helps maintain high conversions and customer satisfaction even if a specific campaign link fails.
                    </p>
                  </div>
                )}
              </div>

              {/* Configuration Switches */}
              <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Whole Word Match</p>
                    <p className="text-xs text-muted-foreground">
                      Only trigger when the keyword is an isolated whole word.
                    </p>
                  </div>
                  <Switch checked={editWholeWord} onCheckedChange={setEditWholeWord} />
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <div>
                    <p className="text-sm font-medium">Reply to Any Comment</p>
                    <p className="text-xs text-muted-foreground">
                      Trigger for every comment on the post regardless of keyword.
                    </p>
                  </div>
                  <Switch checked={editReplyToAny} onCheckedChange={setEditReplyToAny} />
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <div>
                    <p className="text-sm font-medium">Reply on Duplicate Webhooks</p>
                    <p className="text-xs text-muted-foreground">
                      Allow sending multiple times if duplicate comment webhook is received.
                    </p>
                  </div>
                  <Switch checked={editReplyDuplicate} onCheckedChange={setEditReplyDuplicate} />
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-xs text-muted-foreground">
                      Enable or pause this automation rule.
                    </p>
                  </div>
                  <Switch
                    checked={editStatus === "ACTIVE"}
                    onCheckedChange={(checked) => setEditStatus(checked ? "ACTIVE" : "PAUSED")}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingRule(null)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE AUTOMATION CONFIRMATION DIALOG */}
      <AlertDialog open={Boolean(deletingRule)} onOpenChange={(open) => !open && setDeletingRule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Automation Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong className="text-foreground">“{deletingRule?.name}”</strong>?
              This will permanently remove the rule and stop automated replies to comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingRule) {
                  deleteMutation.mutate(deletingRule.id);
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Rule"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* FULL-SCREEN WEBHOOK LOGS & FALLBACK TIMELINE POPUP */}
      <WebhookLogsFullscreenModal
        open={webhookLogsOpen}
        onOpenChange={setWebhookLogsOpen}
        data={webhookLogsQuery.data}
        isFetching={webhookLogsQuery.isFetching}
        onRefresh={() => webhookLogsQuery.refetch()}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// FULL-SCREEN WEBHOOK LOGS & FALLBACK TIMELINE MODAL
// ---------------------------------------------------------------------------
function WebhookLogsFullscreenModal({
  open,
  onOpenChange,
  data,
  isFetching,
  onRefresh,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    deliveries: InstagramAutomationDeliveryLog[];
    webhookDeliveries: InstagramWebhookDeliveryLog[];
  };
  isFetching: boolean;
  onRefresh: () => void;
}) {
  const [activeTab, setActiveTab] = useState("deliveries");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedPayload, setSelectedPayload] = useState<unknown | null>(null);

  const deliveries = data?.deliveries ?? [];
  const webhooks = data?.webhookDeliveries ?? [];
  const fallbackDeliveries = useMemo(
    () => deliveries.filter((d) => d.fallbackSent || d.fallbackError || Boolean(d.fallbackMessage)),
    [deliveries],
  );

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((item) => {
      const matchSearch =
        searchTerm === "" ||
        item.commenterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.commentText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.automation?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.commentId?.includes(searchTerm);

      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [deliveries, searchTerm, statusFilter]);

  const filteredFallbackDeliveries = useMemo(() => {
    return fallbackDeliveries.filter((item) => {
      if (!searchTerm) return true;
      return (
        item.commenterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.commentText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.automation?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fallbackMessage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.errorMessage?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [fallbackDeliveries, searchTerm]);

  const filteredWebhooks = useMemo(() => {
    return webhooks.filter((item) => {
      if (!searchTerm) return true;
      const str = JSON.stringify(item.payload).toLowerCase();
      return str.includes(searchTerm.toLowerCase()) || item.payloadHash.includes(searchTerm);
    });
  }, [webhooks, searchTerm]);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl h-[90vh] max-h-[90vh] flex flex-col p-0 rounded-2xl overflow-hidden border shadow-2xl bg-background">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Terminal className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <DialogTitle className="text-xl font-bold">Instagram Webhook & Fallback Logs</DialogTitle>
                <Badge variant="outline" className="gap-1.5 border-emerald-500/40 text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Receiver Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inspect raw Meta webhook events, triggered automations, error intercepts, and fallback timelines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isFetching}
              className="gap-2 h-9 px-3"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              <span>Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs and Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b px-6 py-3 bg-card">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="grid grid-cols-3 h-9">
              <TabsTrigger value="deliveries" className="gap-2 text-xs">
                <Send className="h-3.5 w-3.5" />
                <span>Deliveries ({deliveries.length})</span>
              </TabsTrigger>
              <TabsTrigger value="fallback" className="gap-2 text-xs">
                <History className="h-3.5 w-3.5 text-amber-500" />
                <span>Fallback Timeline ({fallbackDeliveries.length})</span>
              </TabsTrigger>
              <TabsTrigger value="raw" className="gap-2 text-xs">
                <FileCode2 className="h-3.5 w-3.5" />
                <span>Raw Webhooks ({webhooks.length})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs & timeline..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {activeTab === "deliveries" && (
              <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
                {(["ALL", "SENT", "FAILED", "SKIPPED"] as const).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={statusFilter === status ? "secondary" : "ghost"}
                    onClick={() => setStatusFilter(status)}
                    className="h-7 px-2 text-[11px] font-medium"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
          {/* TAB 1: ALL DELIVERIES */}
          {activeTab === "deliveries" && (
            filteredDeliveries.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center bg-card">
                <Activity className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 font-semibold text-foreground">No matching delivery logs</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {searchTerm || statusFilter !== "ALL"
                    ? "Try resetting your search filters."
                    : "Incoming comments from Instagram will appear here once an automation rule runs."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="group rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "gap-1 font-mono text-xs uppercase tracking-wider",
                            delivery.status === "SENT" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
                            delivery.status === "FAILED" && "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
                            delivery.status === "SKIPPED" && "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
                            delivery.status === "PENDING" && "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
                          )}
                        >
                          {delivery.status === "SENT" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : delivery.status === "FAILED" ? (
                            <XCircle className="h-3.5 w-3.5 text-rose-500" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                          )}
                          {delivery.status}
                        </Badge>
                        {delivery.fallbackSent && (
                          <Badge variant="outline" className="gap-1 text-xs border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                            <LifeBuoy className="h-3 w-3" />
                            Fallback Sent
                          </Badge>
                        )}
                        <span className="font-semibold text-sm text-foreground">
                          Rule: {delivery.automation?.name ?? "Automation"}
                        </span>
                        {delivery.automation?.postLabel && (
                          <span className="truncate max-w-[250px] rounded bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                            {delivery.automation.postLabel}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                        <span>{new Date(delivery.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-muted/40 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Comment Event
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {delivery.commenterName ? `@${delivery.commenterName}` : "Commenter"} (ID: {delivery.commenterId})
                        </p>
                        <p className="mt-1 rounded bg-background/80 p-2 text-xs italic text-foreground border">
                          “{delivery.commentText}”
                        </p>
                        <p className="mt-1.5 font-mono text-[10px] text-muted-foreground truncate">
                          Comment ID: {delivery.commentId}
                        </p>
                      </div>

                      <div className="rounded-lg bg-muted/40 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Delivery Details
                        </p>
                        {delivery.providerMessageId ? (
                          <p className="mt-1 font-mono text-xs text-emerald-600 dark:text-emerald-400 truncate">
                            Instagram Message ID: {delivery.providerMessageId}
                          </p>
                        ) : null}
                        {delivery.errorMessage ? (
                          <div className="mt-1 rounded bg-rose-500/10 border border-rose-500/20 p-2 text-xs text-rose-600 dark:text-rose-400">
                            <strong>Note:</strong> {delivery.errorMessage}
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {delivery.status === "SENT"
                              ? "Direct message delivered successfully to user's inbox."
                              : "Delivery completed without error."}
                          </p>
                        )}
                        {delivery.sentAt && (
                          <p className="mt-1.5 text-[10px] text-muted-foreground">
                            Delivered at: {new Date(delivery.sentAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB 2: DEDICATED FALLBACK TIMELINE */}
          {activeTab === "fallback" && (
            filteredFallbackDeliveries.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center bg-card">
                <LifeBuoy className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 font-semibold text-foreground">No Fallback Messages Triggered Yet</p>
                <p className="mt-1 max-w-md text-xs text-muted-foreground">
                  When a primary message or link fails, the system automatically intervenes and dispatches your configured backup fallback message. All fallback attempts and timelines will be logged here.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
                {filteredFallbackDeliveries.map((delivery) => (
                  <div key={delivery.id} className="relative group">
                    <span
                      className={cn(
                        "absolute -left-6 top-1.5 grid h-5 w-5 place-items-center rounded-full border bg-background",
                        delivery.fallbackSent ? "border-amber-500 text-amber-500" : "border-rose-500 text-rose-500",
                      )}
                    >
                      <span className="h-2 w-2 rounded-full bg-current" />
                    </span>

                    <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              "font-mono text-xs uppercase",
                              delivery.fallbackSent
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-600 border-rose-500/30",
                            )}
                            variant="outline"
                          >
                            {delivery.fallbackSent ? "Fallback Delivered" : "Fallback Failed"}
                          </Badge>
                          <span className="text-sm font-semibold text-foreground">
                            Rule: {delivery.automation?.name ?? "Automation"}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">
                          {new Date(delivery.fallbackSentAt || delivery.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Primary Error Root Cause */}
                        <div className="rounded-lg bg-rose-500/5 border border-rose-500/20 p-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Primary Intercept Reason
                          </div>
                          <p className="text-xs text-foreground font-mono">
                            {delivery.errorMessage || "Primary message execution encountered an error."}
                          </p>
                          <p className="text-[11px] text-muted-foreground pt-1">
                            Recipient: {delivery.commenterName ? `@${delivery.commenterName}` : "Commenter"} on “{delivery.commentText}”
                          </p>
                        </div>

                        {/* Fallback Message Sent */}
                        <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                            <LifeBuoy className="h-3.5 w-3.5" />
                            Fallback DM Dispatched
                          </div>
                          <p className="text-xs italic bg-background/80 p-2 rounded border text-foreground">
                            “{delivery.fallbackMessage || "Configured fallback response"}”
                          </p>
                          {delivery.providerMessageId && (
                            <p className="font-mono text-[10px] text-muted-foreground truncate pt-1">
                              Meta Message ID: {delivery.providerMessageId}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB 3: RAW WEBHOOKS */}
          {activeTab === "raw" && (
            filteredWebhooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center bg-card">
                <FileCode2 className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 font-semibold text-foreground">No incoming Meta webhooks recorded</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Payloads received at <code className="font-mono text-primary">/api/v1/webhooks/instagram</code> will be logged here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWebhooks.map((webhook, idx) => (
                  <div
                    key={webhook.id || idx}
                    className="rounded-xl border bg-card p-4 transition-all hover:border-primary/40"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          PAYLOAD #{idx + 1}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[320px]">
                          SHA256: {webhook.payloadHash}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {new Date(webhook.receivedAt).toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(webhook.payload, null, 2))}
                          className="h-7 px-2 text-xs gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          Copy JSON
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPayload(webhook.payload)}
                          className="h-7 px-2 text-xs gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Inspect
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <pre className="max-h-48 overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-100 dark:bg-slate-900">
                        <code>{JSON.stringify(webhook.payload, null, 2)}</code>
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Payload Inspector Modal */}
        <Dialog open={Boolean(selectedPayload)} onOpenChange={(open) => !open && setSelectedPayload(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Payload Details</DialogTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(selectedPayload, null, 2))}
                  className="gap-1.5 text-xs mr-6"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy JSON
                </Button>
              </div>
              <DialogDescription>
                Full JSON body received from Meta Instagram Graph API Webhook.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto mt-2">
              <pre className="rounded-xl bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-400 dark:bg-slate-900 border">
                <code>{JSON.stringify(selectedPayload, null, 2)}</code>
              </pre>
            </div>
            <DialogFooter className="mt-4">
              <Button onClick={() => setSelectedPayload(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// HELPER COMPONENTS
// ---------------------------------------------------------------------------
function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function AutomationRulePage({ ruleId }: { ruleId: string }) {
  const demoRule = automationRules.find((item) => item.id === ruleId);
  const automationQuery = useQuery({
    queryKey: ["influencer", "instagram-automations", ruleId],
    queryFn: () => getInstagramAutomation(ruleId),
    enabled: !demoRule,
  });
  const rule = automationQuery.data
    ? {
        id: automationQuery.data.id,
        name: automationQuery.data.name,
        trigger: `Comment contains “${automationQuery.data.keywords.join("” or “")}”`,
        action: "Send a personalized direct message",
        sent: automationQuery.data.sentCount,
        rate: "—",
        active: automationQuery.data.status === "ACTIVE",
      }
    : (demoRule ?? automationRules[0]!);
  return (
    <div className="space-y-6">
      <PageHeader
        title={rule.name}
        description="Automation rule details and performance."
        actions={
          <Button variant="outline" asChild>
            <Link to="/influencer/instagram-automation">Back to automation</Link>
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric
          icon={Send}
          label="Messages sent"
          value={String(rule.sent)}
          detail="Since activation"
        />
        <Metric icon={Eye} label="Open rate" value={rule.rate} detail="Messages opened" />
        <Metric
          icon={MousePointerClick}
          label="Link clicks"
          value="—"
          detail="Click tracking is not available yet"
        />
      </section>
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="p-5 pb-3">
            <CardTitle>Automation flow</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              This is what your audience experiences.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 pt-2 md:grid-cols-3">
            <FlowStep label="Trigger" value={rule.trigger} icon={MessageCircle} />
            <FlowStep label="Response" value={rule.action} icon={Send} />
            <FlowStep label="Goal" value="Start a helpful conversation" icon={Sparkles} />
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="font-display text-lg font-semibold">Rule status</p>
            <Badge
              className={cn(
                "mt-3",
                rule.active
                  ? "bg-success/15 text-success hover:bg-success/15"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {rule.active ? "Active and running" : "Paused"}
            </Badge>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Configure or modify this rule using the edit controls on the main automations dashboard.
            </p>
            <Button className="mt-5 w-full" variant="outline" asChild>
              <Link to="/influencer/instagram-automation">Manage in Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-0.5 font-display text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Event({ icon: Icon, text, time }: { icon: typeof Eye; text: string; time: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-medium">{text}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

function HowStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {number}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function FlowStep({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Eye;
}) {
  return (
    <div className="rounded-xl border p-4">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
