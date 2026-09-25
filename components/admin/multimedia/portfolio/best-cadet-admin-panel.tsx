"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AlertCircleIcon, Search } from "lucide-react";
import { createBestCadet, deleteBestCadet, setBestCadetStatus } from "@/app/admin/multimedia/portfolio/actions";
import { searchBestCadetRecords } from "@/app/admin/multimedia/portfolio/search-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { DatePicker } from "@/components/ui/date-picker";
import { SingleFileField } from "@/components/ui/single-file-field";

export type BestCadetAdminRow = { id: number; displayName: string; awardYear: number; awardDate: string; intakeNoSnapshot: string | null; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" };
type BestCadetError = { title: string; detail: string; guidance: string };
const languageNames = { en: "English", ms: "Malay", zh: "中文", ta: "தமிழ்" } as const;
type LocaleKey = keyof typeof languageNames;

function getErrorGuidance(detail: string): string {
  if (/already has a Best Cadet|Only one Best Cadet/i.test(detail)) {
    return "Choose a different intake or award year, or remove the existing Best Cadet first.";
  }
  if (/all four languages|localized summary|summary is required/i.test(detail)) {
    return "Complete the summary in English, Malay, Mandarin, and Tamil before saving or publishing.";
  }
  if (/portrait/i.test(detail)) {
    return "Select a clear JPG, PNG, or WebP portrait no larger than 5 MB.";
  }
  if (/published story/i.test(detail)) {
    return "Choose an available published story, or leave the optional field empty.";
  }
  if (/permission|not authorized/i.test(detail)) {
    return "Ask an authorised Multimedia administrator to complete this action.";
  }
  return "Review the form, correct the issue, and try again.";
}

export function BestCadetAdminPanel({ rows: initialRows, totalCount }: { rows: BestCadetAdminRow[]; totalCount: number }) {
  const [rows, setRows] = useState(initialRows);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<BestCadetError | null>(null);
  const [portrait, setPortrait] = useState<File | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const router = useRouter();

  function submit(form: HTMLFormElement) {
    const data = new FormData(form);
    setError(null);
    if (!portrait) {
      setError({ title: "Portrait required", detail: "Select a dedicated portrait for this Best Cadet.", guidance: "Use a clear JPG, PNG, or WebP image no larger than 5 MB." });
      return;
    }
    data.set("portrait", portrait);
    startTransition(async () => {
      const result = await createBestCadet(data);
      if (!result.success) {
        const detail = result.error ?? "The Best Cadet record could not be saved.";
        setError({ title: "Unable to save Best Cadet", detail, guidance: getErrorGuidance(detail) });
        return;
      }
      if (result.data) {
        setRows((items) => [{ ...result.data, awardYear: new Date(`${result.data.awardDate}T00:00:00Z`).getUTCFullYear() }, ...items]);
        form.reset();
        setPortrait(null);
        setFormVersion((version) => version + 1);
        router.refresh();
      }
    });
  }

  function changeStatus(row: BestCadetAdminRow) {
    const next = row.status === "DRAFT" ? "PUBLISHED" : row.status === "PUBLISHED" ? "ARCHIVED" : "DRAFT";
    setError(null);
    startTransition(async () => {
      const result = await setBestCadetStatus(row.id, next);
      if (result.success) { setRows((items) => items.map((item) => item.id === row.id ? { ...item, status: next } : item)); router.refresh(); }
      else {
        const detail = result.error ?? "The Best Cadet status could not be updated.";
        setError({ title: "Unable to update Best Cadet", detail, guidance: getErrorGuidance(detail) });
      }
    });
  }

  return <div className="grid gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(19rem,0.8fr)]">
    <form key={formVersion} className="grid content-start gap-5 border border-border bg-card p-5 sm:p-7" onSubmit={(event) => { event.preventDefault(); submit(event.currentTarget); }}>
      <header className="border-b border-border pb-4"><p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">Honours register / new entry</p><h3 className="mt-2 text-xl font-semibold">Add Best Cadet</h3><p className="mt-1 text-sm text-muted-foreground">Award year is derived from the ceremony date. Each localized summary is required.</p></header>
      {error ? (
        <div role="alert" aria-live="assertive" className="flex items-start gap-3 border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <AlertCircleIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0 space-y-1">
            <p className="font-semibold">{error.title}</p>
            <p className="text-sm leading-6">{error.detail}</p>
            <p className="text-sm leading-6 text-destructive/80">{error.guidance}</p>
          </div>
        </div>
      ) : null}
      <RecordPicker kind="cadet" name="memberId" label="Cadet recipient" required />
      <Field label="Award date" required><DateField /></Field>
      <RecordPicker kind="story" name="relatedStoryId" label="Related published story" />
      <LocaleContentFields />
      <Field label="Dedicated portrait" required><SingleFileField file={portrait} onChange={setPortrait} onRemove={() => setPortrait(null)} accept="image/png,image/jpeg,image/webp" helperText="JPG, PNG, or WebP. Maximum 5 MB." /></Field>
      <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save draft"}</Button></div>
    </form>
    <section><div className="mb-4 flex items-end justify-between gap-3"><div><p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">Published record history</p><h3 className="mt-2 text-xl font-semibold">Honours register</h3></div><span className="font-mono text-xs text-muted-foreground">{totalCount.toString().padStart(2, "0")} ENTRIES</span></div><div className="divide-y divide-border border-y border-border">{rows.length === 0 ? <p className="py-5 text-sm text-muted-foreground">No Best Cadet records yet.</p> : rows.map((row) => <article key={row.id} className="flex items-start justify-between gap-3 py-4"><div><p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{row.awardYear} · {row.status}</p><h4 className="mt-1 font-semibold">{row.displayName}</h4><p className="text-sm text-muted-foreground">Intake {row.intakeNoSnapshot ?? "—"}</p></div><div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => changeStatus(row)} disabled={isPending}>{row.status === "DRAFT" ? "Publish" : row.status === "PUBLISHED" ? "Archive" : "Draft"}</Button><Button type="button" size="sm" variant="ghost" onClick={() => startTransition(async () => { const result = await deleteBestCadet(row.id); if (result.success) { setRows((items) => items.filter((item) => item.id !== row.id)); router.refresh(); } else { const detail = result.error ?? "The Best Cadet record could not be deleted."; setError({ title: "Unable to delete Best Cadet", detail, guidance: getErrorGuidance(detail) }); } })} disabled={isPending}>Delete</Button></div></article>)}</div></section>
  </div>;
}

function DateField() {
  const [date, setDate] = useState<Date>();
  return <><DatePicker value={date} onChange={setDate} placeholder="Choose ceremony date" maxDate={new Date()} /><input type="hidden" name="awardDate" value={date ? format(date, "yyyy-MM-dd") : ""} /></>;
}

function LocaleContentFields() {
  const [locale, setLocale] = useState<LocaleKey>("en");
  return <div className="border-y border-border py-4"><div className="mb-3"><p className="text-sm font-medium">Localized public content</p><p className="text-xs text-muted-foreground">Summaries are required in all languages. Quotes can be left blank per language.</p></div><div className="grid grid-cols-4 border border-border">{Object.entries(languageNames).map(([key, label]) => <button key={key} type="button" aria-pressed={locale === key} onClick={() => setLocale(key as LocaleKey)} className="min-h-10 px-2 text-xs font-medium aria-pressed:bg-primary aria-pressed:text-primary-foreground">{label}</button>)}</div>{Object.entries(languageNames).map(([key, label]) => <div key={key} hidden={locale !== key} className="grid gap-4 pt-4"><Field label={`${label} summary`} required><Textarea name={`summary_${key}`} rows={4} /></Field><Field label={`${label} quote`}><Textarea name={`quote_${key}`} rows={3} /></Field></div>)}</div>;
}

function RecordPicker({ kind, name, label, required = false }: { kind: "cadet" | "story"; name: string; label?: string; required?: boolean }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ id: number; label: string; detail: string | null } | null>(null);
  const [results, setResults] = useState<Array<{ id: number; label: string; detail: string | null }>>([]);
  const [open, setOpen] = useState(false);
  const [loading, startTransition] = useTransition();
  useEffect(() => {
    if (query.trim().length < 2 || selected) return;
    let active = true;
    const timer = window.setTimeout(() => startTransition(async () => {
      const result = await searchBestCadetRecords(kind, query);
      if (active) setResults(result.success ? result.data : []);
    }), 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [kind, query, selected]);
  return <div className="grid gap-1.5">{label ? <label className="text-sm font-medium">{label}{required ? " *" : ""}</label> : null}<div className="relative"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={selected?.label ?? query} onChange={(event) => { setSelected(null); setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={kind === "cadet" ? "Search name, army no. or matric no." : "Search published stories"} className="pl-9" aria-label={label ?? "Search record"} autoComplete="off" /></div><input type="hidden" name={name} value={selected?.id ?? ""} required={required} />{open && !selected && query.length >= 2 ? <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto border border-border bg-popover shadow-lg" role="listbox">{loading ? <p className="p-3 text-sm text-muted-foreground">Searching…</p> : results.length ? results.map((item) => <button key={item.id} type="button" role="option" aria-selected={false} className="flex w-full flex-col px-3 py-2 text-left hover:bg-accent" onClick={() => { setSelected(item); setQuery(""); setOpen(false); }}><span className="text-sm font-medium">{item.label}</span>{item.detail ? <span className="text-xs text-muted-foreground">{item.detail}</span> : null}</button>) : <p className="p-3 text-sm text-muted-foreground">No matches. Enter at least two characters.</p>}</div> : null}</div>{selected ? <button type="button" className="w-fit text-xs text-muted-foreground underline underline-offset-4" onClick={() => { setSelected(null); setQuery(""); }}>Change selection · {selected.detail}</button> : null}</div>;
}
