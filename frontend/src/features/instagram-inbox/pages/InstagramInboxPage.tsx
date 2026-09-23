import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Instagram, MessageCircle, RefreshCw, Send, UserRound } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  getInstagramInbox,
  sendInstagramInboxReply,
  type InstagramInboxConversation,
} from "../api/instagram-inbox.api";

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

export function InstagramInboxPage({ role }: { role: "influencer" | "store-admin" }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [message, setMessage] = useState("");
  const inboxQuery = useQuery({ queryKey: ["instagram-inbox", role], queryFn: getInstagramInbox });
  const conversations = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return inboxQuery.data ?? [];
    return (inboxQuery.data ?? []).filter((item) =>
      [item.commenterUsername, item.commentText, item.influencer.displayName, item.influencer.instagramConnection?.username]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(term)),
    );
  }, [inboxQuery.data, search]);

  useEffect(() => {
    if (!conversations.length) {
      setSelectedId(undefined);
      return;
    }
    if (!selectedId || !conversations.some((conversation) => conversation.id === selectedId)) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  const selected = conversations.find((conversation) => conversation.id === selectedId);
  const replyMutation = useMutation({
    mutationFn: ({ conversationId, body }: { conversationId: string; body: string }) =>
      sendInstagramInboxReply(conversationId, body),
    onSuccess: async () => {
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["instagram-inbox", role] });
    },
  });

  function submitReply() {
    if (!selected || !message.trim() || replyMutation.isPending) return;
    replyMutation.mutate({ conversationId: selected.id, body: message.trim() });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instagram Inbox"
        description={
          role === "store-admin"
            ? "Reply to comments received by creators assigned to your store."
            : "Read Instagram comments and send private replies from one place."
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => void inboxQuery.refetch()} disabled={inboxQuery.isFetching}>
            <RefreshCw className={cn("h-4 w-4", inboxQuery.isFetching && "animate-spin")} /> Refresh
          </Button>
        }
      />

      <Card className="overflow-hidden shadow-card">
        <div className="grid min-h-[620px] lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="border-b bg-muted/20 lg:border-b-0 lg:border-r">
            <div className="border-b p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Instagram className="h-4 w-4" /></span>
                  <div><p className="font-semibold">Comment conversations</p><p className="text-xs text-muted-foreground">{inboxQuery.data?.length ?? 0} captured comments</p></div>
                </div>
              </div>
              <Input className="mt-4" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search comments or creators…" />
            </div>
            <div className="max-h-[500px] overflow-y-auto p-2 lg:max-h-[620px]">
              {inboxQuery.isLoading ? <p className="p-4 text-sm text-muted-foreground">Loading Instagram comments…</p> : null}
              {inboxQuery.isError ? <p className="p-4 text-sm text-destructive">Unable to load the inbox. Please refresh and try again.</p> : null}
              {!inboxQuery.isLoading && !inboxQuery.isError && conversations.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No Instagram comments have been captured yet.</p> : null}
              {conversations.map((conversation) => <ConversationRow key={conversation.id} conversation={conversation} role={role} selected={conversation.id === selectedId} onClick={() => setSelectedId(conversation.id)} />)}
            </div>
          </aside>

          <main className="flex min-w-0 flex-col">
            {selected ? <ConversationPanel role={role} conversation={selected} message={message} onMessageChange={setMessage} onSend={submitReply} sending={replyMutation.isPending} error={replyMutation.error instanceof Error ? replyMutation.error.message : undefined} /> : <div className="grid flex-1 place-items-center p-8 text-center text-muted-foreground"><div><MessageCircle className="mx-auto h-10 w-10" /><p className="mt-3 text-sm">Select a customer comment to view the conversation.</p></div></div>}
          </main>
        </div>
      </Card>
    </div>
  );
}

function ConversationRow({ conversation, role, selected, onClick }: { conversation: InstagramInboxConversation; role: "influencer" | "store-admin"; selected: boolean; onClick: () => void }) {
  const username = conversation.commenterUsername ? `@${conversation.commenterUsername}` : "Instagram customer";
  return <button type="button" onClick={onClick} className={cn("w-full rounded-xl p-3 text-left transition-colors", selected ? "bg-primary/10" : "hover:bg-muted") }><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fuchsia-500/10 text-fuchsia-600"><UserRound className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold">{username}</p><time className="shrink-0 text-[11px] text-muted-foreground">{new Date(conversation.updatedAt).toLocaleDateString()}</time></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{conversation.commentText}</p>{role === "store-admin" ? <p className="mt-1 truncate text-xs text-primary">@{conversation.influencer.instagramConnection?.username ?? conversation.influencer.displayName}</p> : null}</div></div></button>;
}

function ConversationPanel({ role, conversation, message, onMessageChange, onSend, sending, error }: { role: "influencer" | "store-admin"; conversation: InstagramInboxConversation; message: string; onMessageChange: (value: string) => void; onSend: () => void; sending: boolean; error?: string }) {
  const creatorUsername = conversation.influencer.instagramConnection?.username;
  return <><header className="flex flex-wrap items-center justify-between gap-3 border-b p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-fuchsia-500/10 text-fuchsia-600"><UserRound className="h-5 w-5" /></span><div><p className="font-semibold">{conversation.commenterUsername ? `@${conversation.commenterUsername}` : "Instagram customer"}</p><p className="text-xs text-muted-foreground">Commented {shortDate(conversation.createdAt)}</p></div></div>{role === "store-admin" ? <Badge variant="outline">Replying as @{creatorUsername ?? conversation.influencer.displayName}</Badge> : null}</header><div className="flex-1 space-y-5 overflow-y-auto bg-muted/10 p-5"><div className="max-w-xl rounded-2xl rounded-tl-sm border bg-card p-4"><p className="text-xs font-medium text-muted-foreground">Instagram comment</p><p className="mt-1.5 text-sm leading-6">{conversation.commentText}</p><p className="mt-2 text-xs text-muted-foreground">Post ID: {conversation.instagramMediaId}</p></div>{conversation.manualReplies.map((reply) => <div key={reply.id} className="ml-auto max-w-xl rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-primary-foreground"><p className="text-sm leading-6">{reply.message}</p><div className="mt-2 flex items-center justify-between gap-4 text-xs text-primary-foreground/75"><span>{reply.sender.displayName}</span><span className="inline-flex items-center gap-1">{reply.status === "SENT" ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}{reply.status.toLocaleLowerCase()}</span></div>{reply.status === "FAILED" && reply.errorMessage ? <p className="mt-2 text-xs text-amber-100">{reply.errorMessage}</p> : null}</div>)}{conversation.manualReplies.length === 0 ? <p className="text-center text-sm text-muted-foreground">No manual private replies have been sent yet.</p> : null}</div><footer className="border-t p-4"><Textarea value={message} onChange={(event) => onMessageChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); onSend(); } }} placeholder="Write a private reply to this commenter…" maxLength={1000} className="min-h-24 resize-none" /><div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Private replies are sent through Instagram. Meta may limit replies to eligible comments.</p><Button onClick={onSend} disabled={!message.trim() || sending}>{sending ? "Sending…" : "Send private reply"}<Send className="h-4 w-4" /></Button></div>{error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}</footer></>;
}
