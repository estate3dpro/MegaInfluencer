import { useMemo, useState } from "react";
import {
  CircleCheck,
  FileText,
  Image,
  Info,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  Smile,
  UsersRound,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Role } from "@/features/auth/types";

type ChatMode = "workspace" | "support";
type Conversation = {
  id: string;
  title: string;
  subtitle: string;
  preview: string;
  time: string;
  unread: number;
  online?: boolean;
  group?: boolean;
  members: Member[];
};
type Member = { id: string; name: string; role: string; initials: string; influencer?: boolean };
type Message = { id: string; sender: string; text: string; time: string; mine?: boolean; file?: string };

const teamMembers: Member[] = [
  { id: "aarav", name: "Aarav Shah", role: "Store admin", initials: "AS" },
  { id: "nisha", name: "Nisha Patel", role: "Marketing", initials: "NP" },
  { id: "rohan", name: "Rohan Mehta", role: "Campaign manager", initials: "RM" },
  { id: "kavya", name: "Kavya Nair", role: "Content lead", initials: "KN" },
];

const influencers: Member[] = [
  { id: "meera", name: "Meera Kapoor", role: "Influencer", initials: "MK", influencer: true },
  { id: "aditi", name: "Aditi Nair", role: "Influencer", initials: "AN", influencer: true },
  { id: "kabir", name: "Kabir Singh", role: "Influencer", initials: "KS", influencer: true },
];

const workspaceConversations: Conversation[] = [
  {
    id: "summer-launch",
    title: "Summer Launch Team",
    subtitle: "4 members",
    preview: "Meera: The reel draft is ready for review.",
    time: "11:42",
    unread: 3,
    group: true,
    members: [teamMembers[0], teamMembers[1], teamMembers[2], influencers[0]],
  },
  {
    id: "meera-direct",
    title: "Meera Kapoor",
    subtitle: "@meerastyles",
    preview: "Perfect, I will publish it tomorrow morning.",
    time: "10:18",
    unread: 0,
    online: true,
    members: [influencers[0]],
  },
  {
    id: "festive-campaign",
    title: "Festive Campaign",
    subtitle: "3 members",
    preview: "Nisha: Added the updated campaign brief.",
    time: "Yesterday",
    unread: 1,
    group: true,
    members: [teamMembers[0], teamMembers[1], influencers[1]],
  },
  {
    id: "kabir-direct",
    title: "Kabir Singh",
    subtitle: "@kabirwears",
    preview: "Can you confirm the product delivery date?",
    time: "Mon",
    unread: 0,
    members: [influencers[2]],
  },
];

const supportForAdmin: Conversation[] = [
  {
    id: "support-urban",
    title: "Urban Threads",
    subtitle: "Store support · #SUP-1842",
    preview: "Our Instagram catalogue is not syncing.",
    time: "11:32",
    unread: 2,
    online: true,
    members: [{ id: "urban", name: "Aarav Shah", role: "Store admin", initials: "AS" }],
  },
  {
    id: "support-meera",
    title: "Meera Kapoor",
    subtitle: "Creator support · #SUP-1839",
    preview: "Thank you, the payout is visible now.",
    time: "09:14",
    unread: 0,
    members: [influencers[0]],
  },
  {
    id: "support-northstar",
    title: "Northstar Home",
    subtitle: "Store support · #SUP-1835",
    preview: "We need help updating our billing profile.",
    time: "Yesterday",
    unread: 0,
    members: [{ id: "northstar", name: "Ishaan Bose", role: "Store admin", initials: "IB" }],
  },
];

const directSupport: Conversation[] = [
  {
    id: "platform-support",
    title: "Platform Support",
    subtitle: "Usually replies within an hour",
    preview: "Ananya: I am checking this with our team.",
    time: "11:26",
    unread: 1,
    online: true,
    members: [{ id: "ananya", name: "Ananya Sharma", role: "Platform admin", initials: "AS" }],
  },
];

const workspaceMessages: Message[] = [
  { id: "1", sender: "Nisha Patel", text: "The campaign brief and content references are ready.", time: "10:48" },
  { id: "2", sender: "You", text: "Great. Meera, can you share the first reel draft by this afternoon?", time: "10:52", mine: true },
  { id: "3", sender: "Meera Kapoor", text: "Yes, I have completed the first cut. Sharing it here for review.", time: "11:18" },
  { id: "4", sender: "Meera Kapoor", text: "Summer-launch-reel-v1.mp4", time: "11:19", file: "24.8 MB" },
  { id: "5", sender: "You", text: "The direction looks good. Please use the shorter product close-up at the end.", time: "11:31", mine: true },
  { id: "6", sender: "Meera Kapoor", text: "Done. The updated reel draft is ready for review.", time: "11:42" },
];

const directSupportMessages: Message[] = [
  { id: "1", sender: "You", text: "Our Instagram catalogue has not synced since this morning. Can you help us check it?", time: "10:54", mine: true },
  { id: "2", sender: "Ananya Sharma", text: "Of course. I can see the connection is active, but the latest catalogue sync did not complete.", time: "11:08" },
  { id: "3", sender: "Ananya Sharma", text: "I have restarted the sync. It should update within 15 minutes, and I will keep this conversation open until it completes.", time: "11:26" },
];

const adminSupportMessages: Message[] = [
  { id: "1", sender: "Aarav Shah", text: "Our Instagram catalogue has not synced since this morning. Products added today are missing.", time: "10:54" },
  { id: "2", sender: "You", text: "I can see the connection is active, but the latest catalogue sync did not complete. I am restarting it now.", time: "11:08", mine: true },
  { id: "3", sender: "Aarav Shah", text: "Thanks. Please let me know when the new products are visible.", time: "11:32" },
];

export function ChatPage({ role, mode = "workspace" }: { role: Role; mode?: ChatMode }) {
  const initialConversations = mode === "support" ? (role === "admin" ? supportForAdmin : directSupport) : workspaceConversations;
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState(initialConversations[0].id);
  const [messages, setMessages] = useState(
    mode === "support"
      ? role === "admin"
        ? adminSupportMessages
        : directSupportMessages
      : workspaceMessages,
  );
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const activeConversation = conversations.find((conversation) => conversation.id === activeId) ?? conversations[0];
  const filteredConversations = useMemo(
    () => conversations.filter((conversation) => conversation.title.toLowerCase().includes(search.toLowerCase())),
    [conversations, search],
  );
  const canCreateGroup = mode === "workspace" && role !== "influencer";

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      { id: `message-${current.length + 1}`, sender: "You", text, time: "Now", mine: true },
    ]);
    setDraft("");
  }

  function addConversation(conversation: Conversation) {
    setConversations((current) => [conversation, ...current]);
    setActiveId(conversation.id);
    setMessages([
      { id: "welcome", sender: "You", text: `Created ${conversation.title}. Use this space to coordinate campaign work.`, time: "Now", mine: true },
    ]);
  }

  return (
    <div
      className={cn(
        "overflow-hidden",
        mode === "workspace"
          ? "h-[calc(100dvh-4rem)]"
          : "h-[calc(100dvh-6rem)] md:h-[calc(100dvh-7rem)]",
      )}
    >
      <section
        className={cn(
          "grid h-full min-h-0 grid-rows-[240px_minmax(0,1fr)] overflow-hidden bg-card lg:grid-cols-[360px_minmax(0,1fr)] lg:grid-rows-1",
          mode === "workspace" ? "border-0" : "rounded-lg border",
        )}
      >
        <aside className="flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r">
          <div className="flex gap-2 border-b p-3">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations" className="bg-muted/40 pl-9" />
            </div>
            {canCreateGroup ? (
              <Button size="icon" onClick={() => setCreateOpen(true)} aria-label="Create group" title="Create group">
                <Plus className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          <ScrollArea className="min-h-0 min-w-0 flex-1">
            <div className="w-full min-w-0 max-w-full overflow-hidden p-2">
              <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase text-muted-foreground">Messages</p>
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveId(conversation.id)}
                  className={cn(
                    "relative flex w-full min-w-0 gap-3 overflow-hidden rounded-md px-2.5 py-3 text-left transition-colors hover:bg-muted/60",
                    conversation.id === activeId && "bg-primary/8",
                  )}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className={cn("text-xs font-semibold", conversation.group ? "bg-primary/10 text-primary" : "bg-teal/10 text-teal")}>
                      {conversation.group ? <UsersRound className="h-4 w-4" /> : conversation.members[0]?.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn("w-0 min-w-0 flex-1 overflow-hidden", conversation.unread && "pr-6")}>
                    <span className="flex min-w-0 items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{conversation.title}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{conversation.time}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 max-w-full whitespace-normal break-words text-xs leading-5 text-muted-foreground">{conversation.preview}</span>
                  </span>
                  {conversation.unread ? <span className="absolute bottom-2.5 right-2.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{conversation.unread}</span> : null}
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col">
          <header className="flex h-[72px] shrink-0 items-center gap-3 border-b px-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {activeConversation.group ? <UsersRound className="h-4 w-4" /> : activeConversation.members[0]?.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{activeConversation.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {activeConversation.online ? "Online · " : ""}{activeConversation.subtitle}
              </p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Conversation options">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDetailsOpen(true)} aria-label="Open conversation details" title="Conversation details">
              <Info className="h-4 w-4" />
            </Button>
          </header>

          <ScrollArea className="min-h-0 flex-1 bg-muted/25">
            <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 md:p-6">
              <div className="my-1 flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">Today</div>
              {messages.map((message) => (
                <div key={message.id} className={cn("flex min-w-0 max-w-[85%] gap-2", message.mine && "ml-auto flex-row-reverse")}>
                  {!message.mine ? (
                    <Avatar className="mt-5 h-7 w-7 shrink-0"><AvatarFallback className="bg-muted text-[10px]">{message.sender.split(" ").map((part) => part[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
                  ) : null}
                  <div className="min-w-0">
                    <div className={cn("mb-1 flex items-center gap-2 text-[11px] text-muted-foreground", message.mine && "justify-end")}>
                      <span>{message.sender}</span><span>{message.time}</span>
                    </div>
                    <div className={cn("break-words rounded-lg px-3.5 py-2.5 text-sm leading-6 shadow-sm", message.mine ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm border bg-card")}>
                      {message.file ? (
                        <div className="flex min-w-52 items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-md bg-coral/15 text-coral"><FileText className="h-4 w-4" /></span>
                          <span className="min-w-0"><span className="block truncate font-medium">{message.text}</span><span className="block text-xs opacity-70">{message.file}</span></span>
                        </div>
                      ) : message.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="shrink-0 border-t bg-card p-3">
            <div className="flex items-end gap-2 rounded-lg border bg-background p-2">
              <Button variant="ghost" size="icon" aria-label="Attach file"><Paperclip className="h-4 w-4" /></Button>
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") sendMessage(); }}
                placeholder="Write a message..."
                className="h-9 flex-1 border-0 shadow-none focus-visible:ring-0"
              />
              <Button variant="ghost" size="icon" aria-label="Add emoji"><Smile className="h-4 w-4" /></Button>
              <Button size="icon" onClick={sendMessage} disabled={!draft.trim()} aria-label="Send message"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
          <SheetContent className="w-full p-0 sm:max-w-sm">
            <div className="flex h-[72px] items-center gap-2 border-b px-5 pr-12"><Info className="h-4 w-4 text-muted-foreground" /><SheetTitle className="text-base">Conversation details</SheetTitle></div>
            <ScrollArea className="h-[calc(100dvh-72px)]">
            <div className="p-5 text-center">
              <Avatar className="mx-auto h-16 w-16"><AvatarFallback className="bg-primary/10 font-semibold text-primary">{activeConversation.group ? <UsersRound className="h-6 w-6" /> : activeConversation.members[0]?.initials}</AvatarFallback></Avatar>
              <p className="mt-3 font-semibold">{activeConversation.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{activeConversation.subtitle}</p>
              {mode === "support" ? <Badge variant="secondary" className="mt-3">Open support conversation</Badge> : null}
            </div>
            <div className="border-t p-4">
              <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">{activeConversation.group ? `Members · ${activeConversation.members.length}` : "Contact"}</p>
              <div className="space-y-3">
                {activeConversation.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px]">{member.initials}</AvatarFallback></Avatar>
                    <div className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-medium">{member.name}</p><p className="truncate text-xs text-muted-foreground">{member.role}</p></div>
                    {member.influencer ? <Badge variant="outline" className="px-1.5">Creator</Badge> : null}
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t p-4">
              <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Shared media</p>
              <button className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted"><span className="grid h-9 w-9 place-items-center rounded-md bg-blue-500/10 text-blue-600"><Image className="h-4 w-4" /></span><span><span className="block text-sm font-medium">Campaign assets</span><span className="block text-xs text-muted-foreground">8 files</span></span></button>
            </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </section>

      {canCreateGroup ? <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={addConversation} /> : null}
    </div>
  );
}

function CreateGroupDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (open: boolean) => void; onCreate: (conversation: Conversation) => void }) {
  const [name, setName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string[]>([teamMembers[0].id]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<string>("");

  function toggleTeam(id: string) {
    setSelectedTeam((current) => current.includes(id) ? current.filter((memberId) => memberId !== id) : [...current, id]);
  }

  function createGroup() {
    if (!name.trim() || !selectedTeam.length || !selectedInfluencer) return;
    const members = [...teamMembers.filter((member) => selectedTeam.includes(member.id)), ...influencers.filter((member) => member.id === selectedInfluencer)];
    onCreate({ id: `group-${Date.now()}`, title: name.trim(), subtitle: `${members.length} members`, preview: "Group created. Start the conversation.", time: "Now", unread: 0, group: true, members });
    setName("");
    setSelectedTeam([teamMembers[0].id]);
    setSelectedInfluencer("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>Create campaign group</DialogTitle><DialogDescription>Add store team members and exactly one influencer to the conversation.</DialogDescription></DialogHeader>
        <div className="space-y-5 py-2">
          <div><label htmlFor="group-name" className="mb-2 block text-sm font-medium">Group name</label><Input id="group-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Festive campaign team" /></div>
          <div>
            <div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium">Store team</p><span className="text-xs text-muted-foreground">Select one or more</span></div>
            <div className="grid gap-2 sm:grid-cols-2">{teamMembers.map((member) => <MemberOption key={member.id} member={member} checked={selectedTeam.includes(member.id)} onCheckedChange={() => toggleTeam(member.id)} />)}</div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium">Influencer</p><span className="text-xs font-medium text-primary">Maximum one</span></div>
            <div className="grid gap-2 sm:grid-cols-2">{influencers.map((member) => <MemberOption key={member.id} member={member} checked={selectedInfluencer === member.id} onCheckedChange={() => setSelectedInfluencer((current) => current === member.id ? "" : member.id)} />)}</div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><CircleCheck className="h-3.5 w-3.5 text-teal" />Groups are limited to one influencer.</p>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={createGroup} disabled={!name.trim() || !selectedTeam.length || !selectedInfluencer}><MessageCircle className="h-4 w-4" /> Create group</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MemberOption({ member, checked, onCheckedChange }: { member: Member; checked: boolean; onCheckedChange: () => void }) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50", checked && "border-primary bg-primary/5")}>
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
      <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px]">{member.initials}</AvatarFallback></Avatar>
      <span className="min-w-0"><span className="block truncate text-sm font-medium">{member.name}</span><span className="block truncate text-xs text-muted-foreground">{member.role}</span></span>
    </label>
  );
}
