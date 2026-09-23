import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronLeft,
  Hash,
  Image,
  Instagram,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createInstagramAutomation } from "../api/instagram-automations.api";
import { getInstagramPosts } from "../api/instagram.api";

export function AutomationRuleSetterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [postId, setPostId] = useState<string>();
  const [postPickerOpen, setPostPickerOpen] = useState(false);
  const [draftPostId, setDraftPostId] = useState<string>();
  const [keywordDraft, setKeywordDraft] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [message, setMessage] = useState(
    "Hey {username}! Thanks for your comment — here’s the link you asked for: ",
  );
  const [wholeWordMatch, setWholeWordMatch] = useState(true);
  const [replyOnDuplicateCommentWebhook, setReplyOnDuplicateCommentWebhook] = useState(false);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const postsQuery = useQuery({
    queryKey: ["influencer", "instagram", "posts"],
    queryFn: getInstagramPosts,
  });

  const selectedPost = postsQuery.data?.find((post) => post.id === postId);
  const renderedMessage = useMemo(() => message.replaceAll("{username}", "Alex"), [message]);

  function addKeyword() {
    const keyword = keywordDraft.trim().replace(/^#/, "");
    if (!keyword || keywords.some((item) => item.toLowerCase() === keyword.toLowerCase())) return;
    setKeywords((current) => [...current, keyword]);
    setKeywordDraft("");
  }

  function handleKeywordKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addKeyword();
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const finalKeywords = keywordDraft.trim()
      ? [...keywords, keywordDraft.trim().replace(/^#/, "")]
      : keywords;
    if (!name.trim() || !selectedPost || finalKeywords.length === 0 || !message.trim()) {
      setError("Add a rule name, post, keyword, and direct message before activating it.");
      return;
    }

    try {
      setSaving(true);
      await createInstagramAutomation({
        name: name.trim(),
        postId: selectedPost.id,
        keywords: finalKeywords,
        dmMessage: message.trim(),
        wholeWordMatch,
        replyOnDuplicateCommentWebhook,
      });
      await navigate({ to: "/influencer/instagram-automation" });
    } catch {
      setError(
        "We couldn’t create this automation. Confirm that your Instagram account is connected and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <Button type="button" variant="outline" size="icon" asChild>
            <Link to="/influencer/instagram-automation">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-sm font-medium text-primary">New comment-to-DM rule</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Build an automation
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Set the comment signal and the reply your audience receives.
            </p>
          </div>
        </div>
        <Button type="submit" disabled={saving || postsQuery.isLoading}>
          {
            <>
              <Sparkles className="h-4 w-4" /> {saving ? "Activating…" : "Activate automation"}
            </>
          }
        </Button>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <SetterSection
            step="01"
            title="Give this rule a name"
            description="This is only visible to you and your team."
          >
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              placeholder="e.g. Autumn collection link"
              className="h-11 bg-background"
            />
          </SetterSection>

          <SetterSection
            step="02"
            title="Choose the post to listen to"
            description="Comments on this Instagram post can start the conversation."
          >
            <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/20 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Image className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {selectedPost?.caption?.trim() ||
                      (selectedPost ? `${selectedPost.media_type} post` : "No post selected")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPost?.timestamp
                      ? new Date(selectedPost.timestamp).toLocaleDateString()
                      : "Choose one Instagram post"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraftPostId(postId);
                  setPostPickerOpen(true);
                }}
              >
                Select post
              </Button>
            </div>
            {postsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading posts from Instagram…</p>
            ) : null}
            {postsQuery.isError ? (
              <p className="text-sm text-destructive">
                Unable to load posts. Connect an active Instagram account, then try again.
              </p>
            ) : null}
            {!postsQuery.isLoading && !postsQuery.isError && !postsQuery.data?.length ? (
              <p className="text-sm text-muted-foreground">
                No Instagram posts are available to automate yet.
              </p>
            ) : null}
          </SetterSection>

          <SetterSection
            step="03"
            title="Set the comment trigger"
            description="Any of these words in a comment will send the response."
          >
            <div className="rounded-xl border bg-background p-2 focus-within:ring-2 focus-within:ring-ring/30">
              <div className="flex flex-wrap items-center gap-2">
                {keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary"
                  >
                    <Hash className="h-3.5 w-3.5" />
                    {keyword}
                    <button
                      type="button"
                      onClick={() =>
                        setKeywords((current) => current.filter((item) => item !== keyword))
                      }
                      aria-label={`Remove ${keyword}`}
                    >
                      <X className="ml-1 h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                <input
                  value={keywordDraft}
                  onChange={(event) => setKeywordDraft(event.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  onBlur={addKeyword}
                  placeholder={keywords.length ? "Add another" : "Type a keyword"}
                  className="h-8 min-w-32 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
                />
                <Button type="button" variant="ghost" size="sm" onClick={addKeyword}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </div>
            <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl border bg-muted/30 p-3.5">
              <span>
                <span className="block text-sm font-medium">Match complete words only</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {wholeWordMatch
                    ? "“linking” will not trigger “link”."
                    : "“linking” will trigger “link”."}
                </span>
              </span>
              <Switch checked={wholeWordMatch} onCheckedChange={setWholeWordMatch} />
            </label>
            <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border bg-muted/30 p-3.5">
              <span>
                <span className="block text-sm font-medium">
                  Reply again to duplicate comment webhooks
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {replyOnDuplicateCommentWebhook
                    ? "A Meta redelivery of the exact same comment can send another DM."
                    : "The same comment is answered once, even when Meta retries its webhook."}
                </span>
              </span>
              <Switch
                checked={replyOnDuplicateCommentWebhook}
                onCheckedChange={setReplyOnDuplicateCommentWebhook}
              />
            </label>
          </SetterSection>

          <SetterSection
            step="04"
            title="Write the direct message"
            description="Use {username} to make the first line feel personal."
          >
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={1000}
              className="min-h-32 resize-y bg-background"
              placeholder="Write a helpful reply…"
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Instagram allows a reply only after the customer starts the conversation.</span>
              <span>{message.length}/1000</span>
            </div>
          </SetterSection>
        </div>

        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <Card className="overflow-hidden shadow-card">
            <div className="bg-gradient-to-r from-primary to-fuchsia-500 px-5 py-4 text-primary-foreground">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Instagram className="h-4 w-4" /> Live customer preview
              </div>
              <p className="mt-1 text-xs text-primary-foreground/75">
                This is how the rule will behave.
              </p>
            </div>
            <CardContent className="space-y-5 p-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Comment
                </p>
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-sm font-medium">Alex</p>
                  <p className="mt-1 text-sm">
                    {keywords[0]
                      ? `Can I get the ${keywords[0]}?`
                      : "Your trigger keyword will appear here."}
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="h-6 border-l border-dashed border-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Automatic DM
                </p>
                <div className="rounded-2xl rounded-tl-sm bg-primary px-3.5 py-3 text-sm leading-6 text-primary-foreground">
                  {renderedMessage || "Your direct message will appear here."}
                </div>
              </div>
              <div className="rounded-xl border border-dashed p-3">
                <p className="text-xs text-muted-foreground">Listening on</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                  <span className="grid h-6 w-6 place-items-center rounded bg-primary/10 text-primary">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </span>
                  {selectedPost?.caption?.trim() ||
                    (selectedPost ? `${selectedPost.media_type} post` : "Select a post")}
                </p>
              </div>
            </CardContent>
          </Card>
          <p className="mt-3 flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <Send className="h-3.5 w-3.5" /> The rule starts active and can be paused anytime.
          </p>
        </aside>
      </div>
      <Dialog open={postPickerOpen} onOpenChange={setPostPickerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select an Instagram post</DialogTitle>
          </DialogHeader>
          <div className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-3">
            {(postsQuery.data ?? []).map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setDraftPostId(post.id)}
                className={cn(
                  "relative overflow-hidden rounded-xl border text-left",
                  draftPostId === post.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border",
                )}
              >
                <div className="relative aspect-square bg-muted">
                  {post.thumbnail_url || post.media_url ? (
                    <img
                      src={post.thumbnail_url ?? post.media_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <p className="line-clamp-2 p-3 text-sm font-medium">
                  {post.caption?.trim() || `${post.media_type} post`}
                </p>
                {draftPostId === post.id ? (
                  <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPostPickerOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!draftPostId}
              onClick={() => {
                setPostId(draftPostId);
                setPostPickerOpen(false);
              }}
            >
              Confirm post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

function SetterSection({
  step,
  title,
  description,
  children,
}: {
  step: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-5 flex gap-4">
          <span className="font-mono text-xs font-semibold text-primary">{step}</span>
          <div>
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
