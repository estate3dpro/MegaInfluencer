import { useEffect, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Inbox,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Trash2,
  User,
} from "lucide-react";
import {
  ContactInquiry,
  InquiriesResponse,
  InquiryStatus,
  deleteAdminInquiry,
  getAdminInquiries,
  updateAdminInquiry,
} from "../api/inquiries.api";
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";

const statusConfig: Record<
  InquiryStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; colorClass: string }
> = {
  NEW: {
    label: "New",
    variant: "default",
    colorClass: "bg-[#5341cd]/10 text-[#5341cd] border-[#5341cd]/20",
  },
  IN_REVIEW: {
    label: "In Review",
    variant: "secondary",
    colorClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  RESOLVED: {
    label: "Resolved",
    variant: "outline",
    colorClass: "bg-[#00655a]/10 text-[#00655a] border-[#00655a]/20",
  },
  ARCHIVED: {
    label: "Archived",
    variant: "outline",
    colorClass: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  },
};

export function InquiriesPage() {
  const [data, setData] = useState<InquiriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<InquiryStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await getAdminInquiries({
        page,
        limit: 20,
        search: search.trim() || undefined,
        status: activeStatus === "ALL" ? undefined : activeStatus,
      });
      setData(res);
    } catch (err) {
      console.error("Failed to fetch inquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [page, activeStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInquiries();
  };

  const handleOpenDetail = (inquiry: ContactInquiry) => {
    setSelectedInquiry(inquiry);
    setAdminNotes(inquiry.adminNotes || "");
  };

  const handleStatusChange = async (inquiryId: string, newStatus: InquiryStatus) => {
    try {
      const updated = await updateAdminInquiry(inquiryId, { status: newStatus });
      if (selectedInquiry && selectedInquiry.id === inquiryId) {
        setSelectedInquiry(updated);
      }
      fetchInquiries();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    setIsSavingNotes(true);
    try {
      const updated = await updateAdminInquiry(selectedInquiry.id, {
        adminNotes: adminNotes.trim() || null,
      });
      setSelectedInquiry(updated);
      fetchInquiries();
    } catch (err) {
      console.error("Failed to save admin notes:", err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this inquiry?")) return;
    setIsDeleting(true);
    try {
      await deleteAdminInquiry(id);
      setSelectedInquiry(null);
      fetchInquiries();
    } catch (err) {
      console.error("Failed to delete inquiry:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const counts = data?.counts || { NEW: 0, IN_REVIEW: 0, RESOLVED: 0, ARCHIVED: 0, ALL: 0 };

  return (
    <div className="space-y-8 p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Contact Inquiries & Support
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage incoming messages, brand inquiries, creator requests, and partner questions.
          </p>
        </div>
        <Button onClick={fetchInquiries} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer border-sidebar-border transition hover:border-primary/50" onClick={() => setActiveStatus("ALL")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Messages
            </CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl font-bold">{counts.ALL}</div>
            <p className="mt-1 text-xs text-muted-foreground">All submitted inquiries</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition hover:border-[#5341cd]/50 ${
            activeStatus === "NEW" ? "ring-2 ring-[#5341cd]" : ""
          }`}
          onClick={() => setActiveStatus("NEW")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#5341cd]">
              New & Unread
            </CardTitle>
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#5341cd] ring-4 ring-[#5341cd]/20" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl font-bold text-[#5341cd]">{counts.NEW}</div>
            <p className="mt-1 text-xs text-muted-foreground">Pending initial response</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition hover:border-amber-500/50 ${
            activeStatus === "IN_REVIEW" ? "ring-2 ring-amber-500" : ""
          }`}
          onClick={() => setActiveStatus("IN_REVIEW")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              In Review
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl font-bold text-amber-600">{counts.IN_REVIEW}</div>
            <p className="mt-1 text-xs text-muted-foreground">Being processed by team</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition hover:border-[#00655a]/50 ${
            activeStatus === "RESOLVED" ? "ring-2 ring-[#00655a]" : ""
          }`}
          onClick={() => setActiveStatus("RESOLVED")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#00655a]">
              Resolved
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-[#00655a]" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl font-bold text-[#00655a]">{counts.RESOLVED}</div>
            <p className="mt-1 text-xs text-muted-foreground">Closed inquiries</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(["ALL", "NEW", "IN_REVIEW", "RESOLVED", "ARCHIVED"] as const).map((st) => (
            <Button
              key={st}
              size="sm"
              variant={activeStatus === st ? "default" : "outline"}
              onClick={() => {
                setActiveStatus(st);
                setPage(1);
              }}
              className="text-xs"
            >
              {st === "ALL" ? `All (${counts.ALL})` : `${statusConfig[st as InquiryStatus]?.label || st} (${counts[st as keyof typeof counts] || 0})`}
            </Button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, subject..."
              className="pl-9 text-xs"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="text-xs">
            Search
          </Button>
        </form>
      </div>

      {/* Inquiries Table Card */}
      <Card className="border-sidebar-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Sender</TableHead>
              <TableHead className="w-[220px]">Subject</TableHead>
              <TableHead>Message Preview</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[140px]">Date</TableHead>
              <TableHead className="w-[100px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading inquiries...
                  </div>
                </TableCell>
              </TableRow>
            ) : !data?.items.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No contact inquiries found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((inquiry) => {
                const conf = statusConfig[inquiry.status];
                return (
                  <TableRow
                    key={inquiry.id}
                    className="cursor-pointer transition hover:bg-muted/50"
                    onClick={() => handleOpenDetail(inquiry)}
                  >
                    <TableCell>
                      <div className="font-semibold text-foreground">{inquiry.fullName}</div>
                      <div className="text-xs text-muted-foreground">{inquiry.email}</div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <div className="truncate max-w-[200px]">{inquiry.subject}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="truncate max-w-[320px]">{inquiry.message}</div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${conf.colorClass}`}
                      >
                        {conf.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(inquiry.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(inquiry);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
        {selectedInquiry && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <DialogTitle className="font-display text-xl">{selectedInquiry.subject}</DialogTitle>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    statusConfig[selectedInquiry.status].colorClass
                  }`}
                >
                  {statusConfig[selectedInquiry.status].label}
                </span>
              </div>
              <DialogDescription className="text-xs">
                Received on {formatDate(selectedInquiry.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-3">
              {/* Sender Details */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border bg-muted/40 p-4 text-xs">
                <div>
                  <span className="font-semibold text-muted-foreground">From:</span>
                  <p className="mt-0.5 font-medium text-foreground">{selectedInquiry.fullName}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Email:</span>
                  <p className="mt-0.5 font-mono text-primary">{selectedInquiry.email}</p>
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Message
                </label>
                <div className="mt-2 whitespace-pre-wrap rounded-xl border bg-card p-4 text-sm leading-relaxed text-foreground">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Status Update Buttons */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Update Status
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["NEW", "IN_REVIEW", "RESOLVED", "ARCHIVED"] as InquiryStatus[]).map((st) => (
                    <Button
                      key={st}
                      type="button"
                      size="sm"
                      variant={selectedInquiry.status === st ? "default" : "outline"}
                      onClick={() => handleStatusChange(selectedInquiry.id, st)}
                      className="text-xs"
                    >
                      {statusConfig[st].label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Internal Admin Notes
                </label>
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add private staff notes regarding this inquiry..."
                    rows={3}
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="text-xs"
                  >
                    {isSavingNotes ? "Saving notes..." : "Save Notes"}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(selectedInquiry.id)}
                disabled={isDeleting}
                className="text-xs gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  asChild
                  className="bg-[#5341cd] hover:bg-[#4029ba] text-xs gap-1.5"
                  size="sm"
                >
                  <a
                    href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(
                      selectedInquiry.subject
                    )}`}
                  >
                    <Mail className="h-3.5 w-3.5" /> Reply via Email
                  </a>
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
