"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { AlertCircleIcon, Loader2Icon, PaperclipIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stepper } from "@/components/ui/stepper";
import { createCampaign } from "@/app/admin/multimedia/newsletters/actions";
import { locales } from "@/lib/i18n/config";
import { NewsletterRichEditor } from "@/components/admin/multimedia/newsletters/newsletter-rich-editor";

type Variant = { subject: string; contentHtml: string };
type Props = { trigger: ReactNode; onCreated?: () => void };

const emptyVariants = () => locales.reduce(
  (acc, locale) => ({ ...acc, [locale]: { subject: "", contentHtml: "" } }),
  {} as Record<string, Variant>,
);

function buildEmailHtml(contentHtml: string) {
  return `<div style="max-width:640px;margin:0 auto;padding:32px 20px;font-family:Arial,sans-serif;color:#0f172a"><div style="border:1px solid #e2e8f0;border-radius:16px;padding:32px;background:#ffffff"><p style="margin:0 0 24px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#64748b">ROTU Army UMT</p><div style="line-height:1.7;color:#334155">${contentHtml}</div></div></div>`;
}

function htmlToText(html: string) {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.innerText.trim();
}

export function AddNewsletterDialog({ trigger, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState<"DRAFT" | "SCHEDULED">("DRAFT");
  const [scheduledAt, setScheduledAt] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [variants, setVariants] = useState<Record<string, Variant>>(emptyVariants);

  const steps = [{ label: "Content" }, { label: "Preview & Schedule" }];

  function reset() {
    setError(null);
    setCurrentStep(0);
    setStatus("DRAFT");
    setScheduledAt("");
    setAttachments([]);
    setVariants(emptyVariants());
  }

  function updateVariant(locale: string, key: keyof Variant, value: string) {
    setVariants((current) => ({ ...current, [locale]: { ...current[locale], [key]: value } }));
  }

  function validateStep(step: number) {
    if (step === 0 && (!variants.en.subject.trim() || !htmlToText(variants.en.contentHtml))) {
      return "English subject and message are required.";
    }
    if (step === 1 && status === "SCHEDULED" && (!scheduledAt || new Date(scheduledAt) <= new Date())) {
      return "Scheduled date must be in the future.";
    }
    return null;
  }

  function handleAttachments(files: FileList | null) {
    const selected = Array.from(files ?? []);
    const next = [...attachments, ...selected].filter((file, index, all) => all.findIndex((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified) === index);
    if (next.some((file) => file.size > 10 * 1024 * 1024)) {
      setError("Each attachment must be 10 MB or smaller.");
      return;
    }
    if (next.reduce((total, file) => total + file.size, 0) > 25 * 1024 * 1024) {
      setError("Attachments must be 25 MB or smaller in total.");
      return;
    }
    setError(null);
    setAttachments(next);
  }

  function nextStep() {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setCurrentStep((step) => Math.min(steps.length - 1, step + 1));
  }

  function submit() {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }

    const formData = new FormData();
    for (const locale of locales) {
      const variant = variants[locale];
      formData.set(`subject_${locale}`, variant.subject);
      formData.set(`previewText_${locale}`, "");
      formData.set(`contentHtml_${locale}`, buildEmailHtml(variant.contentHtml));
      formData.set(`contentText_${locale}`, htmlToText(variant.contentHtml));
    }
    formData.set("status", status);
    if (scheduledAt) formData.set("scheduledAt", scheduledAt);
    attachments.forEach((file) => formData.append("attachments", file));
    setError(null);

    startTransition(async () => {
      const result = await createCampaign(formData);
      if (!result.success) setError(result.error ?? "Failed to create campaign.");
      else {
        setOpen(false);
        reset();
        onCreated?.();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) reset(); }}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
          <DialogDescription>Write your message, review the rendered email, then save or schedule it.</DialogDescription>
        </DialogHeader>
        <div className="mb-5"><Stepper steps={steps} currentStep={currentStep} /></div>
        <div className="min-h-0 flex-1 overflow-y-auto px-1 py-1">
          {error && <div className="mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400"><AlertCircleIcon className="mt-0.5 size-4 shrink-0" /><span>{error}</span></div>}
          {currentStep === 0 && (
            <div className="space-y-4">
            <Tabs defaultValue={locales[0]}>
              <TabsList className="w-full overflow-x-auto">{locales.map((locale) => <TabsTrigger key={locale} value={locale} className="min-w-20 uppercase">{locale}</TabsTrigger>)}</TabsList>
              {locales.map((locale) => (
                <TabsContent key={locale} value={locale} className="mt-4 space-y-4 rounded-lg border bg-muted/50 p-4">
                  <Field label="Subject" required={locale === "en"}>
                    <Input value={variants[locale].subject} maxLength={200} placeholder="e.g. ROTU Army UMT monthly update" onChange={(event) => updateVariant(locale, "subject", event.target.value)} />
                  </Field>
                  <Field label="Content" required={locale === "en"} description="Use the toolbar to format your message. The email layout is applied automatically.">
                    <NewsletterRichEditor value={variants[locale].contentHtml} onChange={(value) => updateVariant(locale, "contentHtml", value)} onAttach={handleAttachments} attachments={attachments} onRemoveAttachment={(file) => setAttachments((current) => current.filter((item) => item !== file))} placeholder="Write your newsletter message here..." />
                  </Field>
                </TabsContent>
              ))}
            </Tabs>
            <div className="hidden">
              <input ref={attachmentInputRef} type="file" multiple className="hidden" onChange={(event) => handleAttachments(event.target.files)} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Attachments</p>
                  <p className="text-xs text-muted-foreground">Optional · Maximum 10 MB per file and 25 MB total.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => attachmentInputRef.current?.click()}>
                  <PaperclipIcon className="mr-2 size-4" />Attach files
                </Button>
              </div>
              {attachments.length > 0 && <div className="mt-3 space-y-1 text-xs text-muted-foreground">{attachments.map((file) => <p key={`${file.name}-${file.size}`}>{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>)}</div>}
            </div>
            </div>
          )}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Email preview</p>
                <p className="mb-2 text-sm font-semibold">{variants.en.subject || "Your subject will appear here"}</p>
                {variants.en.contentHtml ? <div className="min-h-96 py-4 text-sm text-foreground [&_a]:text-primary [&_a]:underline [&_img]:mx-0 [&_img]:block [&_img]:max-w-full [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6" dangerouslySetInnerHTML={{ __html: variants.en.contentHtml }} /> : <div className="flex min-h-96 items-center justify-center text-sm text-muted-foreground">Complete the English content to see a preview.</div>}
              </div>
              {attachments.length > 0 && <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attachments</p><div className="flex flex-wrap gap-2">{attachments.map((file) => <span key={`${file.name}-${file.size}-${file.lastModified}`} className="inline-flex max-w-full items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"><PaperclipIcon className="size-3" /><span className="max-w-64 truncate">{file.name}</span><span>({(file.size / 1024 / 1024).toFixed(1)} MB)</span></span>)}</div></div>}
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Status" description="Save as a draft or schedule it for later.">
                  <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                    <SelectTrigger><SelectValue>{status === "DRAFT" ? "Draft" : "Scheduled"}</SelectValue></SelectTrigger>
                    <SelectContent><SelectItem value="DRAFT">Draft</SelectItem><SelectItem value="SCHEDULED">Scheduled</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="Scheduled at">
                  <Input type="datetime-local" value={scheduledAt} min={new Date().toISOString().slice(0, 16)} onChange={(event) => setScheduledAt(event.target.value)} disabled={status !== "SCHEDULED"} />
                </Field>
              </div>
              {/* attachments are selected with the composer control in step one */}
              <div className="hidden">
                <Input type="file" multiple onChange={(event) => handleAttachments(event.target.files)} />
                {attachments.length > 0 && <div className="space-y-1 text-xs text-muted-foreground">{attachments.map((file) => <p key={`${file.name}-${file.size}`}>{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>)}</div>}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          {currentStep > 0 && <Button variant="outline" onClick={() => { setError(null); setCurrentStep((step) => step - 1); }} disabled={isPending}>Back</Button>}
          {currentStep < steps.length - 1 ? <Button onClick={nextStep}>Next</Button> : <Button onClick={submit} disabled={isPending}>{isPending && <Loader2Icon className="mr-1.5 size-4 animate-spin" />}Create Campaign</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
