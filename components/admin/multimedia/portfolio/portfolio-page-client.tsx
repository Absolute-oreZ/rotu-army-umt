"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { AlertCircleIcon, HelpCircleIcon, ImageIcon, LinkIcon, Loader2Icon, MessageSquareIcon, PencilIcon, PlusIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SingleFileField } from "@/components/ui/single-file-field";
import { getAllowedImageExtension } from "@/lib/admin/form-helpers";
import { storageUrl } from "@/lib/supabase/storage-public";
import { reorderFAQs, reorderSeeMoreLinks, reorderTestimonials, setFAQStatus, setSeeMoreLinkStatus, setTestimonialStatus, updateWebappContent } from "@/app/admin/multimedia/portfolio/actions";
import type { RawSearchParams } from "@/lib/admin/table-search-params";
import type { FAQRow, SeeMoreRow, TestimonialRow } from "./table-config";
import { FAQDialog } from "./faq-dialog";
import { FAQDetailsSheet } from "./faq-details-sheet";
import { DeleteFAQDialog } from "./delete-faq-dialog";
import { FAQTable } from "./faq-table";
import { SeeMoreDialog } from "./see-more-dialog";
import { SeeMoreDetailsSheet } from "./see-more-details-sheet";
import { DeleteSeeMoreDialog } from "./delete-see-more-dialog";
import { SeeMoreTable } from "./see-more-table";
import { TestimonialDialog } from "./testimonial-dialog";
import { TestimonialDetailsSheet } from "./testimonial-details-sheet";
import { DeleteTestimonialDialog } from "./delete-testimonial-dialog";
import { TestimonialTable } from "./testimonial-table";
import { PortfolioReorderDialog, type PortfolioOrderItem } from "./portfolio-reorder-dialog";

type WebappContent = { heroImagePath?: string | null; googleMapLocationUrl?: string | null; officialEmail?: string | null; facebookUrl?: string | null; instagramUrl?: string | null; youtubeUrl?: string | null; tiktokUrl?: string | null; xUrl?: string | null };
type MemberOption = { id: number; displayName: string; armyNo: number };
type Props = { initialContent: WebappContent | null; initialFaqs: FAQRow[]; initialSeeMore: SeeMoreRow[]; initialTestimonials: TestimonialRow[]; faqTotalCount: number; seeMoreTotalCount: number; testimonialTotalCount: number; searchParams: RawSearchParams; members: MemberOption[]; faqOrderItems: PortfolioOrderItem[]; seeMoreOrderItems: PortfolioOrderItem[]; testimonialOrderItems: PortfolioOrderItem[] };
type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export function PortfolioPageClient({ initialContent, initialFaqs, initialSeeMore, initialTestimonials, faqTotalCount, seeMoreTotalCount, testimonialTotalCount, searchParams, members, faqOrderItems, seeMoreOrderItems, testimonialOrderItems }: Props) {
  const [activeTab, setActiveTab] = useState<"hero" | "faqs" | "seeMore" | "testimonials">("hero");
  const [faqTarget, setFaqTarget] = useState<{ item: FAQRow | null; mode: "view" | "edit" }>({ item: null, mode: "view" });
  const [linkTarget, setLinkTarget] = useState<{ item: SeeMoreRow | null; mode: "view" | "edit" }>({ item: null, mode: "view" });
  const [testimonialTarget, setTestimonialTarget] = useState<{ item: TestimonialRow | null; mode: "view" | "edit" }>({ item: null, mode: "view" });
  const [faqDelete, setFaqDelete] = useState<FAQRow | null>(null);
  const [linkDelete, setLinkDelete] = useState<SeeMoreRow | null>(null);
  const [testimonialDelete, setTestimonialDelete] = useState<TestimonialRow | null>(null);
  const [faqError, setFaqError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [testimonialError, setTestimonialError] = useState<string | null>(null);
  const [reorderTarget, setReorderTarget] = useState<"faqs" | "seeMore" | "testimonials" | null>(null);
  const [heroMode, setHeroMode] = useState<"view" | "edit">("view");
  const [heroContent, setHeroContent] = useState<WebappContent | null>(initialContent);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [removeHeroImage, setRemoveHeroImage] = useState(false);
  const [heroError, setHeroError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function getNextStatus(status: Status): Status {
    if (status === "DRAFT") return "PUBLISHED";
    if (status === "PUBLISHED") return "ARCHIVED";
    return "PUBLISHED";
  }

  function changeStatus(action: (id: number, status: Status) => Promise<{ success: boolean; error?: string }>, id: number, status: Status, onError: (message: string) => void) {
    startTransition(async () => {
      const result = await action(id, getNextStatus(status));
      if (!result.success) onError(result.error ?? "Failed to update status.");
    });
  }
  function revertToDraft(action: (id: number, status: Status) => Promise<{ success: boolean; error?: string }>, id: number, onError: (message: string) => void) {
    startTransition(async () => {
      const result = await action(id, "DRAFT");
      if (!result.success) onError(result.error ?? "Failed to update status.");
    });
  }
  function saveOrder(action: (ids: number[]) => Promise<{ success: boolean; error?: string }>, ids: number[]) { startTransition(async () => { const result = await action(ids); if (result.success) setReorderTarget(null); else setHeroError(result.error ?? "Failed to reorder items."); }); }
  function updateHero() { if (!heroContent) return; const fd = new FormData(); for (const key of ["heroImagePath", "googleMapLocationUrl", "officialEmail", "facebookUrl", "instagramUrl", "youtubeUrl", "tiktokUrl", "xUrl"] as const) fd.set(key, String(heroContent[key] ?? "")); if (heroFile) fd.set("heroImageFile", heroFile); if (removeHeroImage) fd.set("removeHeroImage", "true"); setHeroError(null); startTransition(async () => { const result = await updateWebappContent(fd); if (!result.success) setHeroError(result.error ?? "Failed to update"); else { setHeroFile(null); setRemoveHeroImage(false); setHeroMode("view"); } }); }
  function changeHeroFile(file: File | null) { if (!file) { setHeroFile(null); if (heroContent?.heroImagePath) setRemoveHeroImage(true); return; } if (!getAllowedImageExtension(file) || file.size > 5 * 1024 * 1024) { setHeroError("Hero image must be a JPG, PNG, or WebP image under 5 MB."); return; } setHeroError(null); setHeroFile(file); setRemoveHeroImage(false); }
  const closeFaq = (open: boolean) => !open && setFaqTarget({ item: null, mode: "view" });
  const closeLink = (open: boolean) => !open && setLinkTarget({ item: null, mode: "view" });
  const closeTestimonial = (open: boolean) => !open && setTestimonialTarget({ item: null, mode: "view" });

  return <div className="p-6"><Tabs defaultValue="hero" value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}><TabsList className="grid w-full grid-cols-4"><TabsTrigger value="hero"><ImageIcon className="mr-2 size-4" />Hero & Social Media</TabsTrigger><TabsTrigger value="faqs"><HelpCircleIcon className="mr-2 size-4" />FAQs</TabsTrigger><TabsTrigger value="seeMore"><LinkIcon className="mr-2 size-4" />See More Links</TabsTrigger><TabsTrigger value="testimonials"><MessageSquareIcon className="mr-2 size-4" />Testimonials</TabsTrigger></TabsList>
    <TabsContent value="hero" className="mt-6"><HeroSection content={heroContent} mode={heroMode} error={heroError} isPending={isPending} onEdit={() => setHeroMode("edit")} onCancel={() => setHeroMode("view")} onSave={updateHero} onFileChange={changeHeroFile} heroFile={heroFile} setContent={setHeroContent} removeHeroImage={removeHeroImage} setRemoveHeroImage={setRemoveHeroImage} /></TabsContent>
    <TabsContent value="faqs" className="mt-6"><SectionHeader title="FAQs"><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setReorderTarget("faqs")}>Reorder</Button><FAQDialog trigger={<Button size="sm"><PlusIcon className="mr-2 size-4" />Add FAQ</Button>} /></div></SectionHeader><FAQTable faqs={initialFaqs} searchParams={searchParams} totalCount={faqTotalCount} onView={(item) => setFaqTarget({ item, mode: "view" })} onEdit={(item) => setFaqTarget({ item, mode: "edit" })} onDelete={setFaqDelete} onStatusChange={(item, status) => changeStatus(setFAQStatus, item.id, status, setFaqError)} onRevertToDraft={(item) => revertToDraft(setFAQStatus, item.id, setFaqError)} isPending={isPending} /><FAQDetailsSheet key={`${faqTarget.item?.id ?? "none"}-${faqTarget.mode}`} faqId={faqTarget.item?.id ?? null} initialMode={faqTarget.mode} open={!!faqTarget.item} onOpenChange={closeFaq} /><DeleteFAQDialog faq={faqDelete} error={faqError} onError={setFaqError} onOpenChange={(open) => !open && setFaqDelete(null)} />{reorderTarget === "faqs" && <PortfolioReorderDialog title="Reorder FAQs" items={faqOrderItems} open onOpenChange={(open) => !open && setReorderTarget(null)} onSave={(ids) => saveOrder(reorderFAQs, ids)} isPending={isPending} />}</TabsContent>
    <TabsContent value="seeMore" className="mt-6"><SectionHeader title="See More Links"><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setReorderTarget("seeMore")}>Reorder</Button><SeeMoreDialog trigger={<Button size="sm"><PlusIcon className="mr-2 size-4" />Add Link</Button>} /></div></SectionHeader><SeeMoreTable links={initialSeeMore} searchParams={searchParams} totalCount={seeMoreTotalCount} onView={(item) => setLinkTarget({ item, mode: "view" })} onEdit={(item) => setLinkTarget({ item, mode: "edit" })} onDelete={setLinkDelete} onStatusChange={(item, status) => changeStatus(setSeeMoreLinkStatus, item.id, status, setLinkError)} onRevertToDraft={(item) => revertToDraft(setSeeMoreLinkStatus, item.id, setLinkError)} isPending={isPending} /><SeeMoreDetailsSheet key={`${linkTarget.item?.id ?? "none"}-${linkTarget.mode}`} linkId={linkTarget.item?.id ?? null} initialMode={linkTarget.mode} open={!!linkTarget.item} onOpenChange={closeLink} /><DeleteSeeMoreDialog link={linkDelete} error={linkError} onError={setLinkError} onOpenChange={(open) => !open && setLinkDelete(null)} />{reorderTarget === "seeMore" && <PortfolioReorderDialog title="Reorder See More Links" items={seeMoreOrderItems} open onOpenChange={(open) => !open && setReorderTarget(null)} onSave={(ids) => saveOrder(reorderSeeMoreLinks, ids)} isPending={isPending} />}</TabsContent>
    <TabsContent value="testimonials" className="mt-6"><SectionHeader title="Testimonials"><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setReorderTarget("testimonials")}>Reorder</Button><TestimonialDialog trigger={<Button size="sm"><PlusIcon className="mr-2 size-4" />Add Testimonial</Button>} members={members} /></div></SectionHeader><TestimonialTable testimonials={initialTestimonials} searchParams={searchParams} totalCount={testimonialTotalCount} onView={(item) => setTestimonialTarget({ item, mode: "view" })} onEdit={(item) => setTestimonialTarget({ item, mode: "edit" })} onDelete={setTestimonialDelete} onStatusChange={(item, status) => changeStatus(setTestimonialStatus, item.id, status, setTestimonialError)} onRevertToDraft={(item) => revertToDraft(setTestimonialStatus, item.id, setTestimonialError)} isPending={isPending} /><TestimonialDetailsSheet key={`${testimonialTarget.item?.id ?? "none"}-${testimonialTarget.mode}`} testimonialId={testimonialTarget.item?.id ?? null} initialMode={testimonialTarget.mode} open={!!testimonialTarget.item} onOpenChange={closeTestimonial} /><DeleteTestimonialDialog testimonial={testimonialDelete} error={testimonialError} onError={setTestimonialError} onOpenChange={(open) => !open && setTestimonialDelete(null)} />{reorderTarget === "testimonials" && <PortfolioReorderDialog title="Reorder Testimonials" items={testimonialOrderItems} open onOpenChange={(open) => !open && setReorderTarget(null)} onSave={(ids) => saveOrder(reorderTestimonials, ids)} isPending={isPending} />}</TabsContent>
  </Tabs></div>;
}

function SectionHeader({ title, children }: { title: string; children: ReactNode }) { return <div className="mb-6 flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">{title}</h2>{children}</div>; }
function MapPreview({ url }: { url: string }) { return <iframe src={url} title="Google Maps preview" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-48 w-full max-w-xl rounded-lg border" />; }
function DetailRow({ label, value }: { label: string; value: ReactNode }) { return <div className="flex flex-col gap-0.5"><span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span><span className="text-sm wrap-break-word">{value}</span></div>; }

function HeroSection({ content, mode, error, isPending, onEdit, onCancel, onSave, onFileChange, heroFile, setContent, removeHeroImage, setRemoveHeroImage }: { content: WebappContent | null; mode: "view" | "edit"; error: string | null; isPending: boolean; onEdit: () => void; onCancel: () => void; onSave: () => void; onFileChange: (file: File | null) => void; heroFile: File | null; setContent: Dispatch<SetStateAction<WebappContent | null>>; removeHeroImage: boolean; setRemoveHeroImage: (value: boolean) => void }) {
  const heroUrl = content?.heroImagePath ? storageUrl(content.heroImagePath) : null;
  if (mode === "view") return <div><section className="mb-8"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">Hero Section & Social Media Links</h3><Button size="sm" onClick={onEdit}><PencilIcon className="mr-1.5 size-3.5" />Edit</Button></div><div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2"><DetailRow label="Hero Image" value={heroUrl ? <Image width={384} height={216} src={heroUrl} alt="Hero" className="max-w-96 rounded-lg border object-contain" /> : "No hero image"} /><DetailRow label="Google Map" value={content?.googleMapLocationUrl ? <MapPreview url={content.googleMapLocationUrl} /> : "No map URL"} /><DetailRow label="Official Email" value={content?.officialEmail ?? "—"} /><DetailRow label="Facebook" value={content?.facebookUrl ?? "—"} /><DetailRow label="Instagram" value={content?.instagramUrl ?? "—"} /><DetailRow label="YouTube" value={content?.youtubeUrl ?? "—"} /><DetailRow label="TikTok" value={content?.tiktokUrl ?? "—"} /><DetailRow label="X (Twitter)" value={content?.xUrl ?? "—"} /></div></section></div>;
  return <div>{error && <div className="mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400"><AlertCircleIcon className="size-4 shrink-0" />{error}</div>}<section className="mb-8"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">Hero Section & Social Media Links</h3></div><div className="grid gap-4 md:grid-cols-2"><Field label="Hero Image"><SingleFileField file={heroFile} onChange={onFileChange} existingUrl={removeHeroImage ? null : heroUrl} accept="image/*" helperText="JPG, PNG, or WebP. Max 5 MB. Recommended 16:9." className="max-w-96" onRemove={() => { setRemoveHeroImage(true); onFileChange(null); }} /></Field><Field label="Google Map URL"><Input value={content?.googleMapLocationUrl ?? ""} onChange={(event) => setContent((current) => ({ ...current, googleMapLocationUrl: event.target.value }))} />{content?.googleMapLocationUrl && <MapPreview url={content.googleMapLocationUrl} />}</Field><Field label="Official Email"><Input type="email" value={content?.officialEmail ?? ""} onChange={(event) => setContent((current) => ({ ...current, officialEmail: event.target.value }))} /></Field>{(["facebookUrl", "instagramUrl", "youtubeUrl", "tiktokUrl", "xUrl"] as const).map((key) => <Field key={key} label={key.replace("Url", "")}><Input value={content?.[key] ?? ""} onChange={(event) => setContent((current) => ({ ...current, [key]: event.target.value }))} /></Field>)}</div></section><div className="flex justify-end gap-2"><Button variant="outline" onClick={onCancel} disabled={isPending}>Cancel</Button><Button onClick={onSave} disabled={isPending}>{isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}Save Changes</Button></div></div>;
}
