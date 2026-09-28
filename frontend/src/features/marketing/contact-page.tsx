import { useState } from "react";
import { CheckCircle2, Mail, MessageSquare, Send, User } from "lucide-react";
import { LandingFooter, LandingHeader, Pill } from "./components";
import { submitContactInquiry } from "@/features/admin/api/inquiries.api";

export function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await submitContactInquiry({
        fullName,
        email,
        subject,
        message,
      });
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || "Failed to submit message. Please try again or email us directly."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setErrorMessage(null);
    setFullName("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

  return (
    <main className="min-h-screen bg-[#fbf8fc] font-sans text-[#1b1b1e]">
      {/* Sticky Header */}
      <LandingHeader />

      {/* Main Content Area */}
      <section className="px-5 py-12 sm:px-8 sm:py-16 md:py-20">
        <div className="mx-auto max-w-xl">
          {/* Header Title */}
          <div className="text-center">
            <Pill tone="violet">
              <span className="font-normal text-[#474554]">Direct Support</span>
            </Pill>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-[#1b1b1e] sm:text-5xl">
              Get in touch
            </h1>
            <p className="mt-3 text-base leading-7 text-[#474554]">
              Have questions, feedback, or need help? Send us a message and our team will get back to you within 24 hours.
            </p>
          </div>

          {/* Form Card */}
          <div className="mt-10 rounded-2xl border border-[#e6e6ef] bg-white p-6 shadow-sm sm:p-8">
            {isSubmitted ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00655a]/10 text-[#00655a]">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="mt-5 font-display text-2xl font-bold text-[#1b1b1e]">
                  Message Sent!
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#474554]">
                  Thank you, <strong>{fullName}</strong>. We have received your message and will reply to <strong>{email}</strong> shortly.
                </p>
                <button
                  onClick={handleReset}
                  className="mt-6 inline-flex items-center rounded-xl bg-[#5341cd] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4029ba]"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMessage && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                    {errorMessage}
                  </div>
                )}
                {/* 2-Column Name & Email */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-xs font-bold uppercase tracking-wider text-[#474554]"
                    >
                      Full Name <span className="text-[#a53361]">*</span>
                    </label>
                    <div className="relative mt-1.5">
                      <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#787586]" />
                      <input
                        id="fullName"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alex Rivera"
                        className="w-full rounded-xl border border-[#c8c4d7]/80 bg-[#fbf8fc]/50 py-2.5 pl-9 pr-3 text-sm text-[#1b1b1e] placeholder-[#787586] outline-none transition focus:border-[#5341cd] focus:bg-white focus:ring-2 focus:ring-[#5341cd]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-bold uppercase tracking-wider text-[#474554]"
                    >
                      Email Address <span className="text-[#a53361]">*</span>
                    </label>
                    <div className="relative mt-1.5">
                      <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#787586]" />
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="w-full rounded-xl border border-[#c8c4d7]/80 bg-[#fbf8fc]/50 py-2.5 pl-9 pr-3 text-sm text-[#1b1b1e] placeholder-[#787586] outline-none transition focus:border-[#5341cd] focus:bg-white focus:ring-2 focus:ring-[#5341cd]/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-xs font-bold uppercase tracking-wider text-[#474554]"
                  >
                    Subject <span className="text-[#a53361]">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <MessageSquare className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#787586]" />
                    <input
                      id="subject"
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What is this regarding?"
                      className="w-full rounded-xl border border-[#c8c4d7]/80 bg-[#fbf8fc]/50 py-2.5 pl-9 pr-3 text-sm text-[#1b1b1e] placeholder-[#787586] outline-none transition focus:border-[#5341cd] focus:bg-white focus:ring-2 focus:ring-[#5341cd]/20"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-xs font-bold uppercase tracking-wider text-[#474554]"
                  >
                    Message <span className="text-[#a53361]">*</span>
                  </label>
                  <div className="mt-1.5">
                    <textarea
                      id="message"
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us more about how we can help..."
                      className="w-full rounded-xl border border-[#c8c4d7]/80 bg-[#fbf8fc]/50 p-3 text-sm text-[#1b1b1e] placeholder-[#787586] outline-none transition focus:border-[#5341cd] focus:bg-white focus:ring-2 focus:ring-[#5341cd]/20"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5341cd] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4029ba] disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending message...
                      </>
                    ) : (
                      <>
                        Send Message <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Shared Landing Footer */}
      <LandingFooter />
    </main>
  );
}
