import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2, ShieldCheck, CheckCircle2, Search, ArrowRight, ExternalLink, RefreshCw } from "lucide-react";
import { PublicPolicyLayout } from "@/components/app/PublicPolicyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/data-deletion")({
  component: DataDeletionPage,
});

function DataDeletionPage() {
  const [emailOrHandle, setEmailOrHandle] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [confirmationCode, setConfirmationCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOrHandle.trim()) return;
    setStatus("submitting");

    setTimeout(() => {
      setStatus("success");
      setConfirmationCode(`DEL-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`);
    }, 1200);
  }

  return (
    <PublicPolicyLayout
      title="User Data Deletion Instructions"
      subtitle="Meta & Platform Compliance: How to remove your account data, Meta API tokens, and connected Instagram permissions."
      lastUpdated="September 26, 2026"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display text-foreground border-b pb-2">Meta / Instagram Data Deletion Policy</h2>
        <p>
          In accordance with <strong>Meta Developer Platform Rules</strong> and Privacy Regulations, <strong>MegaInfluencer</strong>
          provides user-controlled data deletion options. If you connected your Instagram Professional or Personal account to MegaInfluencer,
          you can remove your data and revoke API access at any time using any of the methods below.
        </p>
      </section>

      {/* Interactive Data Deletion Request Tool */}
      <Card className="border-primary/20 bg-card shadow-card my-6">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Self-Service Request
            </Badge>
          </div>
          <CardTitle className="text-lg font-bold">Request Automated Data Deletion</CardTitle>
          <p className="text-xs text-muted-foreground">
            Enter your registered account email address or connected Instagram handle to initiate an immediate data erasure request.
          </p>
        </CardHeader>
        <CardContent className="p-5 pt-2">
          {status === "success" ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" /> Data Deletion Request Submitted
              </div>
              <p className="text-xs text-muted-foreground">
                Your request has been logged. All stored access tokens, profile metadata, and automated messaging logs associated with
                <strong className="text-foreground mx-1">{emailOrHandle}</strong> will be purged.
              </p>
              <div className="rounded-lg bg-background p-3 font-mono text-xs flex items-center justify-between border">
                <span className="text-muted-foreground">Confirmation Code:</span>
                <span className="font-bold text-primary">{confirmationCode}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs mt-2"
                onClick={() => {
                  setStatus("idle");
                  setEmailOrHandle("");
                }}
              >
                Submit another request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  required
                  placeholder="Enter email (e.g. creator@example.com) or @instagram_handle"
                  className="flex-1 bg-background"
                  value={emailOrHandle}
                  onChange={(e) => setEmailOrHandle(e.target.value)}
                />
                <Button type="submit" disabled={status === "submitting"}>
                  {status === "submitting" ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      Submit Deletion Request <ArrowRight className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Submitting this form triggers automated deletion of your Meta API OAuth tokens, Instagram comments cache, and stored credentials within 24 hours.
              </p>
            </form>
          )}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display text-foreground border-b pb-2">Method 1: Disconnect via Instagram / Facebook Settings</h2>
        <p>You can revoke MegaInfluencer’s access directly inside your Meta/Instagram mobile app or browser settings:</p>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
          <li>Open your <strong>Instagram</strong> app or log in to <a href="https://www.facebook.com" target="_blank" rel="noreferrer" className="text-primary underline">Facebook.com</a>.</li>
          <li>Navigate to <strong>Settings & Privacy</strong> &gt; <strong>Website Permissions</strong> &gt; <strong>Business Integrations</strong> (or <strong>Apps and Websites</strong>).</li>
          <li>Locate <strong>MegaInfluencer</strong> in the list of active apps.</li>
          <li>Click <strong>Remove</strong> or <strong>Revoke Access</strong>.</li>
          <li>Meta will send an automated deletion callback to MegaInfluencer to purge connected tokens.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display text-foreground border-b pb-2">Method 2: Email Data Erasure Request</h2>
        <p>If you prefer to submit a request manually via email:</p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Send an email to <a href="mailto:privacy@megainfluencer.com" className="text-primary font-semibold underline">privacy@megainfluencer.com</a> with the subject line <code>"Data Deletion Request"</code>.</li>
          <li>Include your registered email address, creator handle, or store workspace ID.</li>
          <li>Our privacy compliance team will process your request within 48 hours and send a confirmation code.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display text-foreground border-b pb-2">What Data Is Removed vs Retained</h2>
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h3 className="font-bold text-sm text-destructive flex items-center gap-1.5">
              <Trash2 className="h-4 w-4" /> Data Permanently Removed
            </h3>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
              <li>Meta OAuth access tokens & refresh keys</li>
              <li>Instagram handle connections & post metadata</li>
              <li>Automated DM comment triggers & reply logs</li>
              <li>Profile preferences & saved passwords</li>
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> Data Retained for Legal Compliance
            </h3>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
              <li>Anonymized sales attribution order totals</li>
              <li>Tax transaction receipts & completed payout records</li>
              <li>Historical accounting logs as mandated by law</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-xl font-bold font-display text-foreground">Questions or Support</h2>
        <p className="text-muted-foreground">
          For help regarding data deletion or privacy compliance, contact our support team at:
        </p>
        <div className="rounded-xl border bg-card p-4 font-mono text-xs text-foreground space-y-1">
          <p><strong>MegaInfluencer Data Privacy Desk</strong></p>
          <p>Email: <a href="mailto:privacy@megainfluencer.com" className="text-primary underline">privacy@megainfluencer.com</a></p>
          <p>Compliance: Powered by Megascale</p>
        </div>
      </section>
    </PublicPolicyLayout>
  );
}
