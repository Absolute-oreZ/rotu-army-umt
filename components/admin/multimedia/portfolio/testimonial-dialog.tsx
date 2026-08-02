"use client";

import { useState, useTransition } from "react";
import { AlertCircleIcon, CheckIcon, ChevronsUpDownIcon, Loader2Icon } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createTestimonial } from "@/app/admin/multimedia/portfolio/actions";
import { locales } from "@/lib/i18n/config";

type MemberOption = { id: number; displayName: string; armyNo: number };
export type TestimonialDialogProps = { members?: MemberOption[]; trigger?: React.ReactNode };

export function TestimonialDialog({ members = [], trigger }: TestimonialDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [translations, setTranslations] = useState<Record<string, string>>(() => locales.reduce((acc, locale) => ({ ...acc, [locale]: "" }), {} as Record<string, string>));

  function reset() { setError(null); setMemberSearch(""); setMemberId(""); setTranslations(locales.reduce((acc, locale) => ({ ...acc, [locale]: "" }), {} as Record<string, string>)); }
  function handleSubmit() {
    if (!memberId) { setError("Member is required."); return; }
    if (!translations.en.trim()) { setError("English content is required."); return; }
    const fd = new FormData(); fd.set("memberId", memberId); fd.set("status", "DRAFT"); for (const locale of locales) fd.set(`content_${locale}`, translations[locale] ?? "");
    setError(null);
    startTransition(async () => { const result = await createTestimonial(fd); if (!result.success) setError(result.error ?? "Failed to create testimonial."); else { setOpen(false); reset(); } });
  }
  const selectedMember = members.find((member) => String(member.id) === memberId);
  const filteredMembers = members.filter((member) => `${member.displayName} ${member.armyNo}`.toLowerCase().includes(memberSearch.toLowerCase()));

  return <><span onClick={() => setOpen(true)}>{trigger}</span><Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) reset(); }}><DialogContent className="max-h-[90vh] max-w-2xl"><DialogHeader><DialogTitle>Create Testimonial</DialogTitle></DialogHeader>{error && <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400"><AlertCircleIcon className="size-4 shrink-0" />{error}</div>}<Field label="Member" required><Popover open={memberPickerOpen} onOpenChange={setMemberPickerOpen}><PopoverTrigger asChild><Button type="button" variant="outline" className="w-full justify-between font-normal"><span className="truncate">{selectedMember ? `${selectedMember.displayName} (Army No: ${selectedMember.armyNo})` : "Select member"}</span><ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-(--radix-popover-trigger-width) p-2"><Input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Search member or army number" autoFocus /><div className="mt-2 max-h-56 overflow-y-auto">{filteredMembers.map((member) => <button type="button" key={member.id} className="flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm hover:bg-accent" onClick={() => { setMemberId(String(member.id)); setMemberPickerOpen(false); }}><span>{member.displayName} (Army No: {member.armyNo})</span>{String(member.id) === memberId && <CheckIcon className="size-4" />}</button>)}</div></PopoverContent></Popover></Field><Tabs className="mt-4" defaultValue={locales[0]}><TabsList className="w-full overflow-x-auto">{locales.map((locale) => <TabsTrigger key={locale} value={locale} className="min-w-20 uppercase">{locale}</TabsTrigger>)}</TabsList>{locales.map((locale) => <TabsContent key={locale} value={locale} className="mt-4 rounded-lg border bg-muted/50 p-4"><Field label="Content" required={locale === "en"}><Textarea value={translations[locale] ?? ""} onChange={(event) => setTranslations((current) => ({ ...current, [locale]: event.target.value }))} rows={6} placeholder={locale === "en" ? "Required for English" : "Optional"} /></Field></TabsContent>)}</Tabs><DialogFooter><Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button><Button onClick={handleSubmit} disabled={isPending}>{isPending && <Loader2Icon className="mr-1.5 size-4 animate-spin" />}Create Testimonial</Button></DialogFooter></DialogContent></Dialog></>;
}
