"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { PencilIcon, Loader2Icon, AlertCircleIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { getFAQDetails, updateFAQ } from "@/app/admin/multimedia/portfolio/actions";
import { locales } from "@/lib/i18n/config";
import { STATUS_OPTIONS } from "./table-config";

export function FAQDetailsSheet({
  faqId,
  initialMode,
  open,
  onOpenChange,
}: {
  faqId: number | null;
  initialMode: "view" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetContent className="w-120 max-w-[calc(100vw-2rem)] p-0">
        {open && faqId != null && (
          <SheetInner
            key={faqId}
            faqId={faqId}
            initialMode={initialMode}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function SheetInner({
  faqId,
  initialMode,
  onClose,
}: {
  faqId: number;
  initialMode: "view" | "edit";
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [details, setDetails] = useState<FAQDetails | null>(null);
  const [mode, setMode] = useState<"view" | "edit">(initialMode);

  useEffect(() => {
    let cancelled = false;
    getFAQDetails(faqId).then((res) => {
      if (cancelled) return;
      if (res.error) {
        setFetchError(res.error);
      } else if (res.data) {
        setDetails(res.data);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [faqId]);

  if (loading) return <SheetSkeleton className="w-120 max-w-[calc(100vw-2rem)] p-0" />;
  if (fetchError || !details) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Error</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 items-center justify-center px-6 py-12 text-sm text-red-500">
          {fetchError ?? "FAQ not found."}
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

function ViewMode({ details, onEdit }: { details: FAQDetails; onEdit: () => void }) {
  return (
    <>
      <SheetHeader>
        <SheetTitle>FAQ Details</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <DetailRow label="ID" value={details.id} />
              <DetailRow label="Sort Order" value={details.sortOrder} />
              <DetailRow
                label="Status"
                value={
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      details.status === "PUBLISHED"
                        ? "bg-emerald-100 text-emerald-800"
                        : details.status === "DRAFT"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {details.status.charAt(0).toUpperCase() + details.status.slice(1).toLowerCase()}
                  </span>
                }
              />
              <DetailRow label="Created" value={format(new Date(details.createdAt), "dd MMM yyyy")} />
              <DetailRow label="Updated" value={format(new Date(details.updatedAt), "dd MMM yyyy")} />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Translations
            </h3>
            <div className="space-y-4">
              {locales.map((locale) => (
                <div key={locale} className="p-4 rounded-lg border bg-muted/30">
                  <h4 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    {locale.toUpperCase()}
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2 text-sm">
                    <div>
                      <strong>Question:</strong> {details.translations[locale]?.question ?? "—"}
                    </div>
                    <div>
                      <strong>Answer:</strong> {details.translations[locale]?.answer ?? "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <SheetFooter>
        <Button onClick={onEdit}>
          <PencilIcon className="size-3.5" />
          Edit
        </Button>
      </SheetFooter>
    </>
  );
}

function EditMode({
  details,
  onCancel,
  onClose,
}: { details: FAQDetails; onCancel: () => void; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    status: details.status,
    translations: details.translations,
  });

  function handleUpdate() {
    if (!formData.translations.en?.question?.trim() || !formData.translations.en?.answer?.trim()) return;
    setError(null);

    const fd = new FormData();
    fd.set("faqId", String(details.id));
    fd.set("status", formData.status);
    fd.set("faqId", String(details.id));
    for (const locale of locales) {
      fd.set(`question_${locale}`, formData.translations[locale]?.question ?? "");
      fd.set(`answer_${locale}`, formData.translations[locale]?.answer ?? "");
    }

    startTransition(async () => {
      const result = await updateFAQ(fd);
      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "Failed to update FAQ.");
      }
    });
  }

  return (
    <>
      <SheetHeader className="px-6 pt-6 pb-4">
        <SheetTitle>Edit FAQ</SheetTitle>
      </SheetHeader>

      {error && (
        <div className="mx-6 mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-2">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Status">
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as "DRAFT" | "PUBLISHED" | "ARCHIVED" })}>
                <SelectTrigger>
                  <SelectValue>
                    {STATUS_OPTIONS.find((option) => option.value === formData.status)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="border-t pt-4">
            <h3 className="mb-4 text-lg font-semibold">Translations</h3>
            <div className="space-y-6">
              {locales.map((locale) => (
                <div key={locale} className="p-4 rounded-lg border bg-muted/30">
                  <h4 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    {locale.toUpperCase()}
                  </h4>
                  <div className="space-y-3">
                    <Field label="Question" required={locale === "en"}>
                      <Input
                        value={formData.translations[locale]?.question ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            translations: {
                              ...formData.translations,
                              [locale]: { ...formData.translations[locale], question: e.target.value },
                            },
                          })
                        }
                        placeholder={locale === "en" ? "Required" : "Optional"}
                      />
                    </Field>
                    <Field label="Answer" required={locale === "en"}>
                      <Textarea
                        value={formData.translations[locale]?.answer ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            translations: {
                              ...formData.translations,
                              [locale]: { ...formData.translations[locale], answer: e.target.value },
                            },
                          })
                        }
                        rows={3}
                        placeholder={locale === "en" ? "Required" : "Optional"}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-6 py-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleUpdate} disabled={isPending}>
          {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </>
  );
}

export type FAQDetails = {
  id: number;
  webappContentId: number;
  sortOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  translations: Record<string, { question: string; answer: string }>;
};
