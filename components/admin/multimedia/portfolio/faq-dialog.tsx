"use client";

import { useState, useTransition } from "react";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createFAQ } from "@/app/admin/multimedia/portfolio/actions";
import { locales } from "@/lib/i18n/config";

export type FAQDialogProps = { trigger?: React.ReactNode };

export function FAQDialog({ trigger }: FAQDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, { question: string; answer: string }>>(() => locales.reduce((acc, locale) => ({ ...acc, [locale]: { question: "", answer: "" } }), {} as Record<string, { question: string; answer: string }>));

  function reset() {
    setError(null);
    setTranslations(locales.reduce((acc, locale) => ({ ...acc, [locale]: { question: "", answer: "" } }), {} as Record<string, { question: string; answer: string }>));
  }

  function handleSubmit() {
    if (!translations.en.question.trim()) { setError("English Question is required."); return; }
    if (!translations.en.answer.trim()) { setError("English Answer is required."); return; }
    const fd = new FormData();
    fd.set("status", "DRAFT");
    for (const locale of locales) { fd.set(`question_${locale}`, translations[locale]?.question ?? ""); fd.set(`answer_${locale}`, translations[locale]?.answer ?? ""); }
    setError(null);
    startTransition(async () => { const result = await createFAQ(fd); if (!result.success) setError(result.error ?? "Failed to create FAQ."); else { setOpen(false); reset(); } });
  }

  return <><span onClick={() => setOpen(true)}>{trigger}</span><Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) reset(); }}><DialogContent className="max-h-[90vh] max-w-2xl"><DialogHeader><DialogTitle>Create FAQ</DialogTitle></DialogHeader>{error && <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400"><AlertCircleIcon className="size-4 shrink-0" />{error}</div>}<Tabs defaultValue={locales[0]}><TabsList className="w-full overflow-x-auto">{locales.map((locale) => <TabsTrigger key={locale} value={locale} className="min-w-20 uppercase">{locale}</TabsTrigger>)}</TabsList>{locales.map((locale) => <TabsContent key={locale} value={locale} className="mt-4 space-y-4 rounded-lg border bg-muted/50 p-4"><Field label="Question" required={locale === "en"}><Input value={translations[locale]?.question ?? ""} onChange={(event) => setTranslations((current) => ({ ...current, [locale]: { ...current[locale], question: event.target.value } }))} placeholder={locale === "en" ? "Required for English" : "Optional"} /></Field><Field label="Answer" required={locale === "en"}><Textarea value={translations[locale]?.answer ?? ""} onChange={(event) => setTranslations((current) => ({ ...current, [locale]: { ...current[locale], answer: event.target.value } }))} rows={5} placeholder={locale === "en" ? "Required for English" : "Optional"} /></Field></TabsContent>)}</Tabs><DialogFooter><Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button><Button onClick={handleSubmit} disabled={isPending}>{isPending && <Loader2Icon className="mr-1.5 size-4 animate-spin" />}Create FAQ</Button></DialogFooter></DialogContent></Dialog></>;
}
