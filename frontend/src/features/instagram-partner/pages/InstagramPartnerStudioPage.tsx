import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Instagram,
  MessageCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  connectPartnerAccount,
  deletePartnerRule,
  getPartnerAccountStatus,
  getPartnerAnalytics,
  getPartnerConversationMessages,
  getPartnerConversations,
  getPartnerLogs,
  getPartnerRules,
  sendPartnerConversationMessage,
  sendPartnerDirectMessage,
  simulateInboundComment,
  simulateInboundMessage,
  upsertPartnerRule,
  type PartnerConversation,
} from "../api/instagram-partner.api";

export function InstagramPartnerStudioPage({ role = "store-admin" }: { role?: "store-admin" | "admin" }) {
  const queryClient = useQueryClient();
  const [tenantId, setTenantId] = useState("brand_partner_demo");
  const [activeTab, setActiveTab] = useState("chat");

  // Status query
  const statusQuery = useQuery({
    queryKey: ["partner-status", tenantId],
    queryFn: () => getPartnerAccountStatus(tenantId),
  });

  // Conversations query
  const convQuery = useQuery({
    queryKey: ["partner-conversations", tenantId],
    queryFn: () => getPartnerConversations(tenantId),
    enabled: !!tenantId,
    refetchInterval: 5000, // Live poll every 5s for chat updates
  });

  // Selected conversation
  const [selectedConvId, setSelectedConvId] = useState<string>();
  const items = convQuery.data?.items || [];

  useEffect(() => {
    if (items.length > 0 && (!selectedConvId || !items.some((i) => i.id === selectedConvId))) {
      setSelectedConvId(items[0].id);
    }
  }, [items, selectedConvId]);

  const selectedConv = items.find((i) => i.id === selectedConvId);

  // Messages query
  const messagesQuery = useQuery({
    queryKey: ["partner-messages", tenantId, selectedConvId],
    queryFn: () => getPartnerConversationMessages(tenantId, selectedConvId!),
    enabled: !!tenantId && !!selectedConvId,
    refetchInterval: 3000,
  });

  // Reply state
  const [replyText, setReplyText] = useState("");
  const [useHumanAgentTag, setUseHumanAgentTag] = useState(false);

  const sendReplyMutation = useMutation({
    mutationFn: () =>
      sendPartnerConversationMessage(
        tenantId,
        selectedConvId!,
        replyText.trim(),
        undefined,
        useHumanAgentTag
      ),
    onSuccess: () => {
      setReplyText("");
      toast.success("Outbound message sent via Meta Graph API v21.0!");
      void queryClient.invalidateQueries({ queryKey: ["partner-messages", tenantId, selectedConvId] });
      void queryClient.invalidateQueries({ queryKey: ["partner-conversations", tenantId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || "Failed to deliver message.");
    },
  });

  // Simulation state
  const [simMessageText, setSimMessageText] = useState("Hi! Is this product still in stock?");
  const [simUsername, setSimUsername] = useState("shopper_maya");
  const [simOpen, setSimOpen] = useState(false);

  const simulateMessageMutation = useMutation({
    mutationFn: () => simulateInboundMessage(tenantId, simMessageText, simUsername),
    onSuccess: () => {
      toast.success("Simulated inbound customer message received!");
      setSimOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["partner-conversations", tenantId] });
      void queryClient.invalidateQueries({ queryKey: ["partner-messages", tenantId, selectedConvId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || "Simulation failed.");
    },
  });

  // Direct Message to Recipient modal state
  const [directRecipientId, setDirectRecipientId] = useState("");
  const [directMessageText, setDirectMessageText] = useState("");
  const [directOpen, setDirectOpen] = useState(false);

  const sendDirectMutation = useMutation({
    mutationFn: () => sendPartnerDirectMessage(tenantId, directRecipientId, directMessageText),
    onSuccess: () => {
      toast.success("Message dispatched to recipient!");
      setDirectOpen(false);
      setDirectRecipientId("");
      setDirectMessageText("");
      void queryClient.invalidateQueries({ queryKey: ["partner-conversations", tenantId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || "Direct send failed.");
    },
  });

  // Demo Account Connect Mutation
  const connectDemoMutation = useMutation({
    mutationFn: () =>
      connectPartnerAccount({
        tenantId,
        instagramBusinessAccountId: `ig_biz_${Date.now().toString().slice(-6)}`,
        username: "urban_threads_official",
        accessToken: "EAAB_mock_page_access_token_demo",
        profilePictureUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      }),
    onSuccess: () => {
      toast.success("Instagram Account connected successfully!");
      void queryClient.invalidateQueries({ queryKey: ["partner-status", tenantId] });
    },
  });

  // Rules query
  const rulesQuery = useQuery({
    queryKey: ["partner-rules", tenantId],
    queryFn: () => getPartnerRules(tenantId),
    enabled: !!tenantId,
  });

  // Create rule state
  const [ruleOpen, setRuleOpen] = useState(false);
  const [matchType, setMatchType] = useState("CONTAINS");
  const [keywords, setKeywords] = useState("PRICE, LINK, BUY, COST");
  const [publicReplies, setPublicReplies] = useState("Sent you a DM! 📩\nCheck your inbox! ✨\nCheck your DMs for the exclusive link! 🛍️");
  const [dmMessage, setDmMessage] = useState("Hey there! Here is the link you requested: {{link}}");
  const [linkUrl, setLinkUrl] = useState("https://store.example.com/item/viral-jacket");

  const createRuleMutation = useMutation({
    mutationFn: () =>
      upsertPartnerRule({
        tenantId,
        targetPostId: "ALL_POSTS",
        matchType,
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        publicReplies: publicReplies.split("\n").map((r) => r.trim()).filter(Boolean),
        dmMessage,
        linkUrl,
        isActive: true,
      }),
    onSuccess: () => {
      toast.success("Comment automation rule created!");
      setRuleOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["partner-rules", tenantId] });
      void queryClient.invalidateQueries({ queryKey: ["partner-status", tenantId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || "Failed to create rule.");
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => deletePartnerRule(tenantId, ruleId),
    onSuccess: () => {
      toast.success("Rule deleted!");
      void queryClient.invalidateQueries({ queryKey: ["partner-rules", tenantId] });
      void queryClient.invalidateQueries({ queryKey: ["partner-status", tenantId] });
    },
  });

  // Comment simulator state
  const [simCommentText, setSimCommentText] = useState("price please link!");
  const [simCommenter, setSimCommenter] = useState("fashion_lover_99");

  const simulateCommentMutation = useMutation({
    mutationFn: () => simulateInboundComment(tenantId, simCommentText, simCommenter),
    onSuccess: (data: any) => {
      if (data?.result?.success) {
        toast.success(`Matched rule! Public reply: ${data.result.publicReplyStatus}, DM: ${data.result.dmStatus}`);
      } else {
        toast.info(`Comment processed: ${data?.result?.reason || "Skipped"}`);
      }
      void queryClient.invalidateQueries({ queryKey: ["partner-analytics", tenantId] });
      void queryClient.invalidateQueries({ queryKey: ["partner-logs", tenantId] });
    },
  });

  // Analytics query
  const analyticsQuery = useQuery({
    queryKey: ["partner-analytics", tenantId],
    queryFn: () => getPartnerAnalytics(tenantId, 30),
    enabled: !!tenantId,
  });

  // Logs query
  const logsQuery = useQuery({
    queryKey: ["partner-logs", tenantId],
    queryFn: () => getPartnerLogs(tenantId, 1, 20),
    enabled: !!tenantId,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instagram & MegaChat Partner Studio"
        description="Core Instagram Service Provider: Two-Way Direct Messaging, Comment-to-DM Automations, and Meta Graph API v21.0 Engine."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Tenant ID:</span>
              <Input
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value.trim() || "default_tenant")}
                className="h-8 w-44 font-mono text-xs"
                placeholder="tenant_id"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void statusQuery.refetch();
                void convQuery.refetch();
                void rulesQuery.refetch();
                void analyticsQuery.refetch();
                toast.success("Refreshed data.");
              }}
            >
              <RefreshCw className={cn("h-4 w-4", statusQuery.isFetching && "animate-spin")} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Account Status Card Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-fuchsia-500/5 to-transparent shadow-card">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 text-white shadow-md">
              <Instagram className="h-6 w-6" />
              {statusQuery.data?.connected && (
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-background">
                  <CheckCircle2 className="h-3 w-3" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">
                  {statusQuery.data?.username ? `@${statusQuery.data.username}` : "No Account Connected"}
                </p>
                <Badge variant={statusQuery.data?.connected ? "default" : "secondary"}>
                  {statusQuery.data?.connected ? "Connected (Active)" : "Disconnected"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Business ID: {statusQuery.data?.businessAccountId || "—"} &bull; Active Rules:{" "}
                <span className="font-semibold text-foreground">{statusQuery.data?.activeRulesCount || 0}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!statusQuery.data?.connected ? (
              <Button
                size="sm"
                onClick={() => connectDemoMutation.mutate()}
                disabled={connectDemoMutation.isPending}
              >
                <Zap className="h-4 w-4 mr-1.5" />
                {connectDemoMutation.isPending ? "Connecting..." : "Quick Connect Demo Account"}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => connectDemoMutation.mutate()}
                disabled={connectDemoMutation.isPending}
              >
                Reconnect / Switch
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-grid">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Two-Way Live Chat</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span>Comment Automations</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Analytics & KPIs</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            <span>Execution Logs</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 1: TWO-WAY LIVE CHAT */}
        {/* ========================================================================= */}
        <TabsContent value="chat" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Instagram Direct Messaging Inbox</h3>
              <p className="text-xs text-muted-foreground">
                Live two-way chat supporting Meta's 24-hour response window and Human Agent tag.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={simOpen} onOpenChange={setSimOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Sparkles className="h-4 w-4 mr-1.5 text-fuchsia-500" />
                    Simulate Inbound Customer DM
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Simulate Inbound Customer DM</DialogTitle>
                    <DialogDescription>
                      Injects a simulated webhook event as if a customer sent a DM on Instagram.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1">
                      <Label>Customer Instagram Username</Label>
                      <Input
                        value={simUsername}
                        onChange={(e) => setSimUsername(e.target.value)}
                        placeholder="shopper_jane"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Message Text</Label>
                      <Textarea
                        value={simMessageText}
                        onChange={(e) => setSimMessageText(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => simulateMessageMutation.mutate()}
                      disabled={simulateMessageMutation.isPending || !simMessageText.trim()}
                    >
                      {simulateMessageMutation.isPending ? "Injecting..." : "Send Simulated Inbound DM"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={directOpen} onOpenChange={setDirectOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Send Direct to IGSID
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Direct Message to Customer ID</DialogTitle>
                    <DialogDescription>
                      Initiates an outbound DM to a known Instagram Scoped ID (IGSID).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1">
                      <Label>Recipient Customer ID (IGSID)</Label>
                      <Input
                        value={directRecipientId}
                        onChange={(e) => setDirectRecipientId(e.target.value)}
                        placeholder="e.g. 1784140000000123"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Message</Label>
                      <Textarea
                        value={directMessageText}
                        onChange={(e) => setDirectMessageText(e.target.value)}
                        placeholder="Hello! Here is your custom coupon..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => sendDirectMutation.mutate()}
                      disabled={sendDirectMutation.isPending || !directRecipientId.trim() || !directMessageText.trim()}
                    >
                      {sendDirectMutation.isPending ? "Sending..." : "Send Message"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card className="overflow-hidden shadow-card">
            <div className="grid min-h-[580px] lg:grid-cols-[340px_1fr]">
              {/* Left Pane: Conversations */}
              <aside className="border-r bg-muted/20">
                <div className="border-b p-4">
                  <p className="font-semibold text-sm">Conversation Threads</p>
                  <p className="text-xs text-muted-foreground">
                    {items.length} active chat thread{items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="max-h-[520px] overflow-y-auto p-2 space-y-1.5">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedConvId(item.id)}
                      className={cn(
                        "w-full rounded-xl p-3 text-left transition-all",
                        item.id === selectedConvId
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/60"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                          <User className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {item.participantUsername ? `@${item.participantUsername}` : "Instagram Customer"}
                            </p>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(item.lastMessageAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {item.lastMessage?.messageText || "No messages yet"}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] py-0 px-1.5",
                                item.isWindowOpen
                                  ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                                  : "border-amber-500/40 text-amber-600 bg-amber-500/10"
                              )}
                            >
                              <Clock className="h-2.5 w-2.5 mr-1" />
                              {item.isWindowOpen ? "24h Window Active" : "Window Expired (Tag Req)"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {items.length === 0 && (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      No Instagram conversation threads found.
                      <div className="mt-3">
                        <Button variant="outline" size="sm" onClick={() => setSimOpen(true)}>
                          Simulate Incoming DM
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </aside>

              {/* Right Pane: Chat History & Send Box */}
              <main className="flex min-w-0 flex-col">
                {selectedConv ? (
                  <>
                    <header className="flex items-center justify-between border-b px-5 py-3.5 bg-card">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {selectedConv.participantUsername
                              ? `@${selectedConv.participantUsername}`
                              : "Instagram Customer"}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              selectedConv.isWindowOpen
                                ? "border-emerald-500 text-emerald-600"
                                : "border-amber-500 text-amber-600"
                            )}
                          >
                            {selectedConv.isWindowOpen ? "24h Window Active" : "Window Expired"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Customer ID: {selectedConv.participantId} &bull; Window Expiration:{" "}
                          {selectedConv.windowExpiresAt
                            ? new Date(selectedConv.windowExpiresAt).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    </header>

                    {/* Messages Body */}
                    <div className="flex-1 space-y-3 overflow-y-auto bg-muted/10 p-5 min-h-[380px] max-h-[440px]">
                      {messagesQuery.data?.messages?.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                            msg.direction === "OUTBOUND"
                              ? "ml-auto rounded-tr-none bg-primary text-primary-foreground"
                              : "rounded-tl-none border bg-card text-card-foreground"
                          )}
                        >
                          <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 mb-1">
                            <span className="font-medium">
                              {msg.direction === "OUTBOUND" ? "Brand / Agent" : "Customer"}
                            </span>
                            <span>{new Date(msg.sentAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.messageText}</p>
                        </div>
                      ))}
                      {(!messagesQuery.data?.messages || messagesQuery.data.messages.length === 0) && (
                        <p className="text-center text-xs text-muted-foreground py-8">
                          No messages in this conversation yet.
                        </p>
                      )}
                    </div>

                    {/* Reply Footer */}
                    <footer className="border-t p-4 bg-card">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>Replying via Meta Graph API v21.0</span>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useHumanAgentTag}
                            onChange={(e) => setUseHumanAgentTag(e.target.checked)}
                            className="rounded border-input text-primary"
                          />
                          <span>Use Human Agent Tag (7-day extended)</span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type an outbound direct message..."
                          rows={2}
                          className="min-h-16"
                        />
                        <Button
                          disabled={!replyText.trim() || sendReplyMutation.isPending}
                          onClick={() => sendReplyMutation.mutate()}
                          className="self-end"
                        >
                          <Send className="h-4 w-4 mr-1.5" />
                          {sendReplyMutation.isPending ? "Sending..." : "Send"}
                        </Button>
                      </div>
                    </footer>
                  </>
                ) : (
                  <div className="grid flex-1 place-items-center p-8 text-center text-muted-foreground">
                    <div>
                      <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                      <p className="font-medium text-foreground">Select a conversation thread</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Or simulate an incoming DM from a customer to begin testing.
                      </p>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: COMMENT AUTOMATION RULES */}
        {/* ========================================================================= */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Instagram Comment-to-DM Rules</h3>
              <p className="text-xs text-muted-foreground">
                Automatic keyword triggers that reply publicly to comments and send private 1-time DMs with links.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    New Automation Rule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Instagram Comment Rule</DialogTitle>
                    <DialogDescription>
                      When a customer comments with your keywords, this rule triggers public and private replies.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2 text-xs">
                    <div className="space-y-1">
                      <Label>Match Type</Label>
                      <select
                        value={matchType}
                        onChange={(e) => setMatchType(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="CONTAINS">CONTAINS (Word boundary or text match)</option>
                        <option value="EXACT">EXACT (Exact full comment match)</option>
                        <option value="ANY">ANY (Triggers on any comment)</option>
                        <option value="REGEX">REGEX (Custom Regular Expression)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>Trigger Keywords (comma separated)</Label>
                      <Input
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="PRICE, LINK, BUY, COST"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Public Comment Replies (Random Pool - one per line)</Label>
                      <Textarea
                        value={publicReplies}
                        onChange={(e) => setPublicReplies(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Private Direct Message Template (supports {'{{link}}'} and {'{{username}}'})</Label>
                      <Textarea
                        value={dmMessage}
                        onChange={(e) => setDmMessage(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Destination Link URL</Label>
                      <Input
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => createRuleMutation.mutate()}
                      disabled={createRuleMutation.isPending || !dmMessage.trim()}
                    >
                      {createRuleMutation.isPending ? "Saving..." : "Save Rule"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Comment Simulator Card */}
          <Card className="border-fuchsia-500/20 bg-muted/20">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-fuchsia-500" />
                Live Comment Trigger Simulator
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0 flex flex-wrap items-center gap-2">
              <Input
                value={simCommenter}
                onChange={(e) => setSimCommenter(e.target.value)}
                placeholder="commenter username"
                className="w-36 h-8 text-xs"
              />
              <Input
                value={simCommentText}
                onChange={(e) => setSimCommentText(e.target.value)}
                placeholder="type comment e.g. 'price please link'"
                className="flex-1 min-w-[200px] h-8 text-xs"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => simulateCommentMutation.mutate()}
                disabled={simulateCommentMutation.isPending || !simCommentText.trim()}
                className="h-8 text-xs"
              >
                {simulateCommentMutation.isPending ? "Simulating..." : "Simulate Comment Webhook"}
              </Button>
            </CardContent>
          </Card>

          {/* Rules List */}
          <div className="grid gap-4">
            {rulesQuery.data?.map((rule) => (
              <Card key={rule.id} className="shadow-card">
                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{rule.matchType}</Badge>
                      <span className="font-semibold text-sm">Target: {rule.targetPostId}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(rule.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => deleteRuleMutation.mutate(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div>
                    <span className="font-medium text-foreground">Keywords: </span>
                    <div className="inline-flex flex-wrap gap-1 ml-1">
                      {rule.keywords.map((kw, idx) => (
                        <Badge key={idx} variant="secondary" className="font-mono text-[10px]">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <p className="font-medium text-foreground mb-1">Private DM Template:</p>
                    <p className="text-muted-foreground italic font-mono text-[11px]">{rule.dmMessage}</p>
                    {rule.linkUrl && (
                      <p className="mt-1 text-primary flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{rule.linkUrl}</span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {rulesQuery.data?.length === 0 && (
              <Card className="p-8 text-center text-xs text-muted-foreground">
                No automation rules found for this tenant. Click "New Automation Rule" to add one.
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: ANALYTICS & KPIS */}
        {/* ========================================================================= */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Total Comments</CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {analyticsQuery.data?.summary.totalComments ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Matched Rules</CardDescription>
                <CardTitle className="text-2xl font-bold text-primary">
                  {analyticsQuery.data?.summary.matchedComments ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">DMs Delivered</CardDescription>
                <CardTitle className="text-2xl font-bold text-emerald-600">
                  {analyticsQuery.data?.summary.dmsSent ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Delivery Success Rate</CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {analyticsQuery.data?.summary.deliverySuccessRate ?? 100}%
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: EXECUTION LOGS */}
        {/* ========================================================================= */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Real-Time Execution Logs</CardTitle>
              <CardDescription className="text-xs">
                History of received comments, matched keywords, and delivery statuses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-muted/40 font-medium text-muted-foreground">
                    <tr>
                      <th className="p-2.5">Time</th>
                      <th className="p-2.5">Commenter</th>
                      <th className="p-2.5">Comment Text</th>
                      <th className="p-2.5">Matched Keyword</th>
                      <th className="p-2.5">Public Reply</th>
                      <th className="p-2.5">DM Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logsQuery.data?.items?.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30">
                        <td className="p-2.5 text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="p-2.5 font-medium">@{log.commenterUsername}</td>
                        <td className="p-2.5 max-w-xs truncate">{log.commentText}</td>
                        <td className="p-2.5">
                          {log.matchedKeyword ? (
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {log.matchedKeyword}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-2.5">
                          <Badge
                            variant={
                              log.publicReplyStatus === "SUCCESS"
                                ? "default"
                                : log.publicReplyStatus === "FAILED"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {log.publicReplyStatus}
                          </Badge>
                        </td>
                        <td className="p-2.5">
                          <Badge
                            variant={
                              log.dmStatus === "SUCCESS"
                                ? "default"
                                : log.dmStatus === "FAILED"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {log.dmStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {(!logsQuery.data?.items || logsQuery.data.items.length === 0) && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-muted-foreground">
                          No execution logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
