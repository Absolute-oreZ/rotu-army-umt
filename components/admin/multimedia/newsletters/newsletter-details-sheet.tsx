"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { PencilIcon, Loader2Icon, AlertCircleIcon, SendIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetSkeleton,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  getCampaignDetails,
  updateCampaign,
  sendCampaign,
  retryFailedCampaign,
} from "@/app/admin/multimedia/newsletters/actions";
import { type CampaignRow } from "@/components/admin/multimedia/newsletters/newsletters-table";
import { locales } from "@/lib/i18n/config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { campaignStatusClass, formatCampaignStatus } from "@/components/admin/multimedia/newsletters/table-config";
import { NewsletterRichEditor } from "@/components/admin/multimedia/newsletters/newsletter-rich-editor";

function convertDetailsToRow(data: {
  id: number;
  subject: string;
  previewText: string | null;
  contentHtml: string;
  contentText: string | null;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  sentByAdminUserId: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: Array<{ id: number; fileName: string; fileSize: number; contentType: string }>;
  translations?: Array<{ locale: string; subject: string; previewText: string | null; contentHtml: string; contentText: string | null }>;
}): CampaignRow {
  return {
    ...data,
    status: data.status as "DRAFT" | "SENT" | "SCHEDULED" | "SENDING" | "FAILED",
    scheduledAt: data.scheduledAt ?? null,
    sentAt: data.sentAt ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    translations: data.translations,
  };
}

export function NewsletterDetailsSheet({
  campaignId,
  initialMode,
  open,
  onOpenChange,
}: {
  campaignId: number | null;
  initialMode: "view" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetContent className="w-140 max-w-[calc(100vw-2rem)] p-0">
        {open && campaignId != null && (
          <SheetInner
            key={campaignId}
            campaignId={campaignId}
            initialMode={initialMode}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function SheetInner({
  campaignId,
  initialMode,
  onClose,
}: {
  campaignId: number;
  initialMode: "view" | "edit";
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [details, setDetails] = useState<CampaignRow | null>(null);
  const [mode, setMode] = useState<"view" | "edit">(initialMode);

  useEffect(() => {
    let cancelled = false;
    getCampaignDetails(campaignId).then((res) => {
      if (cancelled) return;
      if (!res.success) {
        setFetchError(res.error);
      } else {
        setDetails(convertDetailsToRow(res.data));
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  if (loading) {
    return <SheetSkeleton  className="w-140 max-w-[calc(100vw-2rem)] p-0" />;
  }

  if (fetchError || !details) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Error</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 items-center justify-center px-6 py-12 text-sm text-red-500">
          {fetchError ?? "Campaign not found."}
        </div>
      </>
    );
  }

  if (mode === "view") {
    return <ViewMode details={details} onEdit={() => setMode("edit")} />;
  }

  return <EditMode details={details} onCancel={() => setMode("view")} onClose={onClose} />;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground wrap-break-word">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${campaignStatusClass(status)}`}
    >
      {formatCampaignStatus(status)}
    </span>
  );
}

function ViewMode({
  details,
  onEdit,
}: {
  details: CampaignRow;
  onEdit: () => void;
}) {
  const d = details;
  const [feedback, setFeedback] = useState<{ mode: "confirm" | "result"; title: string; message: string } | null>(null);

  async function sendCampaignNow() {
    const result = d.status === "FAILED" ? await retryFailedCampaign(d.id) : await sendCampaign(d.id);
    setFeedback({ mode: "result", title: result.success ? "Campaign sent" : "Send failed", message: result.success ? `Sent to ${result.data.sentCount} recipients. Failed: ${result.data.failedCount}.` : result.error ?? "Newsletter delivery failed." });
  }
  return (
    <>
      <SheetHeader>
        <SheetTitle>Campaign Details</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <DetailRow label="Subject" value={d.subject} />
              <DetailRow
                label="Status"
                value={<StatusBadge status={d.status} />}
              />
              <DetailRow
                label="Scheduled At"
                value={d.scheduledAt ? format(new Date(d.scheduledAt), "dd MMM yyyy HH:mm") : "—"}
              />
              <DetailRow
                label="Sent At"
                value={d.sentAt ? format(new Date(d.sentAt), "dd MMM yyyy HH:mm") : "—"}
              />
              <DetailRow label="Recipients" value={d.recipientCount.toString()} />
              <DetailRow label="Created" value={format(new Date(d.createdAt), "dd MMM yyyy HH:mm")} />
              <DetailRow label="Updated" value={format(new Date(d.updatedAt), "dd MMM yyyy HH:mm")} />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Email Content</h3>
            <div className="min-h-80 py-2 text-sm text-foreground [&_a]:text-primary [&_a]:underline [&_img]:mx-0 [&_img]:block [&_img]:max-w-full [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6" dangerouslySetInnerHTML={{ __html: getEditableHtml(d.contentHtml) }} />
          </section>
        </div>
      </div>

      <SheetFooter>
        {d.status === "DRAFT" && (
          <>
            <Button variant="outline" onClick={() => setFeedback({ mode: "confirm", title: "Send campaign?", message: `Send “${d.subject}” to all active subscribers?` })}>
              <SendIcon className="mr-2 size-3.5" />
              Send Now
            </Button>
          </>
        )}
        {d.status === "FAILED" && (
          <Button variant="outline" onClick={() => setFeedback({ mode: "confirm", title: "Retry campaign?", message: `Retry failed deliveries for “${d.subject}”?` })}>
            <SendIcon className="mr-2 size-3.5" />
            Retry Failed Deliveries
          </Button>
        )}
        <Button onClick={onEdit}>
          <PencilIcon className="mr-2 size-3.5" />
          Edit
        </Button>
      </SheetFooter>
      <Dialog open={!!feedback} onOpenChange={(open) => !open && setFeedback(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{feedback?.title}</DialogTitle>
            <DialogDescription>{feedback?.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {feedback?.mode === "confirm" ? <>
              <Button variant="outline" onClick={() => setFeedback(null)}>Cancel</Button>
              <Button onClick={sendCampaignNow}>Send Now</Button>
            </> : <Button onClick={() => setFeedback(null)}>Close</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditMode({
  details,
  onCancel,
  onClose,
}: {
  details: CampaignRow;
  onCancel: () => void;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    variants: buildCampaignVariants(details),
    status: details.status,
    scheduledAt: details.scheduledAt ? format(new Date(details.scheduledAt), "yyyy-MM-dd'T'HH:mm") : "",
  });

  function handleUpdate() {
    if (!formData.variants.en.subject || !formData.variants.en.contentHtml) {
      setError("Subject and HTML content are required.");
      return;
    }
    if (formData.status === "SCHEDULED" && !formData.scheduledAt) {
      setError("Scheduled date is required for scheduled campaigns.");
      return;
    }
    if (formData.status === "SCHEDULED" && new Date(formData.scheduledAt) <= new Date()) {
      setError("Scheduled date must be in the future.");
      return;
    }
    setError(null);

    const fd = new FormData();
    fd.set("campaignId", String(details.id));
    for (const locale of locales) { fd.set(`subject_${locale}`, formData.variants[locale].subject); fd.set(`previewText_${locale}`, ""); fd.set(`contentHtml_${locale}`, buildCampaignEmailHtml(formData.variants[locale].contentHtml)); fd.set(`contentText_${locale}`, htmlToText(formData.variants[locale].contentHtml)); }
    fd.set("status", formData.status);
    if (formData.scheduledAt) fd.set("scheduledAt", formData.scheduledAt);
    newAttachments.forEach((file) => fd.append("attachments", file));

    startTransition(async () => {
      const result = await updateCampaign(fd);
      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "Failed to update campaign.");
      }
    });
  }

  return (
    <>
      <SheetHeader className="px-6 pt-6 pb-4">
        <SheetTitle>Edit Campaign</SheetTitle>
      </SheetHeader>

      {error && (
        <div className="mx-6 mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-2">
        <div className="space-y-4">
          <Tabs defaultValue="en">
            <TabsList className="w-full overflow-x-auto">{locales.map((locale) => <TabsTrigger key={locale} value={locale} className="min-w-20 uppercase">{locale}</TabsTrigger>)}</TabsList>
            {locales.map((locale) => (
              <TabsContent key={locale} value={locale} className="mt-4 space-y-4">
                <Field label="Subject" required={locale === "en"}>
                  <Input value={formData.variants[locale].subject} maxLength={200} onChange={(event) => setFormData((current) => ({ ...current, variants: { ...current.variants, [locale]: { ...current.variants[locale], subject: event.target.value } } }))} />
                </Field>
                <Field label="Content" required={locale === "en"} description="Use the toolbar to format your message.">
                  <NewsletterRichEditor value={formData.variants[locale].contentHtml} onChange={(value) => setFormData((current) => ({ ...current, variants: { ...current.variants, [locale]: { ...current.variants[locale], contentHtml: value } } }))} onAttach={(files) => setNewAttachments((current) => [...current, ...Array.from(files ?? [])])} attachments={[...(details.attachments ?? []).map((attachment) => ({ name: attachment.fileName, size: attachment.fileSize })), ...newAttachments]} onRemoveAttachment={(attachment) => setNewAttachments((current) => current.filter((file) => file.name !== attachment.name || file.size !== attachment.size))} placeholder="Write your newsletter message here..." />
                </Field>
              </TabsContent>
            ))}
          </Tabs>

          {details.attachments && details.attachments.length > 0 && (
            <Field label="Attachments">
              <div className="flex flex-wrap gap-2">
                {details.attachments.map((attachment) => (
                  <span key={attachment.id} className="inline-flex max-w-full items-center gap-2 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                    <span className="max-w-56 truncate">{attachment.fileName}</span>
                    <span>({(attachment.fileSize / 1024 / 1024).toFixed(1)} MB)</span>
                  </span>
                ))}
              </div>
            </Field>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Status">
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as "DRAFT" | "SCHEDULED" })}
              >
                <SelectTrigger>
                  <SelectValue>{formData.status === "DRAFT" ? "Draft" : "Scheduled"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Scheduled At">
              <Input
                type="datetime-local"
                value={formData.scheduledAt}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                disabled={formData.status !== "SCHEDULED"}
              />
            </Field>
          </div>

          {formData.status === "SCHEDULED" && (
            <p className="text-xs text-muted-foreground">
              Campaign will be sent automatically at the scheduled time (requires background job).
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-border px-6 py-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleUpdate} disabled={isPending || !formData.variants.en.subject}>
          {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </>
  );
}

function buildCampaignEmailHtml(contentHtml: string) {
  return `<div style="max-width:640px;margin:0 auto;padding:32px 20px;font-family:Arial,sans-serif;color:#0f172a"><div style="border:1px solid #e2e8f0;border-radius:16px;padding:32px;background:#ffffff"><p style="margin:0 0 24px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#64748b">ROTU Army UMT</p><div style="line-height:1.7;color:#334155">${contentHtml}</div></div></div>`;
}

function htmlToText(html: string) {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.innerText.trim();
}

function getEditableHtml(html: string) {
  const documentRoot = new DOMParser().parseFromString(html, "text/html");
  return documentRoot.querySelector('div[style*="line-height:1.7"]')?.innerHTML ?? html;
}

function buildCampaignVariants(details: CampaignRow) {
  return locales.reduce((acc, locale) => {
    const variant = details.translations?.find((item) => item.locale === locale);
    acc[locale] = {
      subject: variant?.subject ?? (locale === "en" ? details.subject : ""),
      previewText: variant?.previewText ?? (locale === "en" ? details.previewText ?? "" : ""),
      contentHtml: getEditableHtml(variant?.contentHtml ?? (locale === "en" ? details.contentHtml : "")),
      contentText: variant?.contentText ?? (locale === "en" ? details.contentText ?? "" : ""),
    };
    return acc;
  }, {} as Record<string, { subject: string; previewText: string; contentHtml: string; contentText: string }>);
}
