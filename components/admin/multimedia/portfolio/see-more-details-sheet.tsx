"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { PencilIcon, Loader2Icon, AlertCircleIcon, ExternalLinkIcon } from "lucide-react";
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
import { SingleFileField } from "@/components/ui/single-file-field";
import { storageUrl } from "@/lib/supabase/storage-public";
import { getAllowedImageExtension } from "@/lib/admin/form-helpers";
import { getSeeMoreLinkDetails, updateSeeMoreLink } from "@/app/admin/multimedia/portfolio/actions";
import { SeeMoreRow } from "./table-config";
import { STATUS_OPTIONS } from "./table-config";

export function SeeMoreDetailsSheet({
  linkId,
  initialMode,
  open,
  onOpenChange,
}: {
  linkId: number | null;
  initialMode: "view" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetContent className="w-110 max-w-[calc(100vw-2rem)] p-0">
        {open && linkId != null && (
          <SheetInner
            key={linkId}
            linkId={linkId}
            initialMode={initialMode}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function SheetInner({
  linkId,
  initialMode,
  onClose,
}: {
  linkId: number;
  initialMode: "view" | "edit";
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [details, setDetails] = useState<SeeMoreRow | null>(null);
  const [mode, setMode] = useState<"view" | "edit">(initialMode);

  useEffect(() => {
    let cancelled = false;
    getSeeMoreLinkDetails(linkId).then((res) => {
      if (cancelled) return;
      if (res.error) setFetchError(res.error);
      else if (res.data) setDetails(res.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [linkId]);

  if (loading) return <SheetSkeleton className="w-110 max-w-[calc(100vw-2rem)] p-0" />;
  if (fetchError || !details) {
    return (
      <>
        <SheetHeader><SheetTitle>Error</SheetTitle></SheetHeader>
        <div className="flex flex-1 items-center justify-center px-6 py-12 text-sm text-red-500">
          {fetchError ?? "Link not found."}
        </div>
      </>
    );
  }

  if (mode === "view") return <ViewMode details={details} onEdit={() => setMode("edit")} />;
  return <EditMode details={details} onCancel={() => setMode("view")} onClose={onClose} />;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground wrap-break-word">{value}</span>
    </div>
  );
}

function ViewMode({ details, onEdit }: { details: SeeMoreRow; onEdit: () => void }) {
  return (
    <>
      <SheetHeader><SheetTitle>See More Link Details</SheetTitle></SheetHeader>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Information</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <DetailRow label="ID" value={details.id} />
              <DetailRow label="Title" value={details.title} />
              <DetailRow label="Link" value={<a href={details.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">{details.link} <ExternalLinkIcon className="size-3" /></a>} />
              <DetailRow label="Sort Order" value={details.sortOrder} />
              <DetailRow
                label="Status"
                value={
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    details.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800"
                    : details.status === "DRAFT" ? "bg-gray-100 text-gray-800"
                    : "bg-amber-100 text-amber-800"
                  }`}>
                    {details.status.charAt(0).toUpperCase() + details.status.slice(1).toLowerCase()}
                  </span>
                }
              />
              <DetailRow label="Created" value={format(new Date(details.createdAt), "dd MMM yyyy")} />
              <DetailRow label="Updated" value={format(new Date(details.updatedAt), "dd MMM yyyy")} />
            </div>
          </section>
          {details.imagePath && (
            <section className="flex flex-col gap-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Image</h3>
              <div className="relative max-w-64">
                <Image width={240} height={240} src={storageUrl(details.imagePath)} alt="See more link image" className="w-full rounded-lg border border-border object-contain" />
              </div>
            </section>
          )}
        </div>
      </div>
      <SheetFooter><Button onClick={onEdit}><PencilIcon className="size-3.5" /> Edit</Button></SheetFooter>
    </>
  );
}

function EditMode({ details, onCancel, onClose }: { details: SeeMoreRow; onCancel: () => void; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [formData, setFormData] = useState({
    title: details.title,
    link: details.link,
    status: details.status,
  });

  function handleImageChange(file: File | null) {
    setImageFile(file);
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5 MB."); setImageFile(null); return; }
      if (!getAllowedImageExtension(file)) { setError("Image must be a JPG, PNG, or WebP image."); setImageFile(null); return; }
      setError(null); setRemoveImage(false);
    } else if (details.imagePath) { setRemoveImage(true); }
  }

  function handleUpdate() {
    if (!formData.title.trim() || !formData.link.trim()) return;
    setError(null);
    const fd = new FormData();
    fd.set("linkId", String(details.id));
    fd.set("title", formData.title);
    fd.set("link", formData.link);
    fd.set("status", formData.status);
    if (removeImage) fd.set("removeImage", "true");
    if (imageFile) fd.set("imageFile", imageFile);
    startTransition(async () => {
      const result = await updateSeeMoreLink(fd);
      if (result.success) onClose();
      else setError(result.error ?? "Failed to update link.");
    });
  }

  return (
    <>
      <SheetHeader className="px-6 pt-6 pb-4"><SheetTitle>Edit See More Link</SheetTitle></SheetHeader>
      {error && <div className="mx-6 mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400"><AlertCircleIcon className="mt-0.5 size-4 shrink-0" /><span>{error}</span></div>}
      <div className="flex-1 overflow-y-auto px-6 py-2">
        <div className="flex flex-col gap-4">
          <Field label="Title" required><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></Field>
          <Field label="Link URL" required><Input type="url" value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} /></Field>
          <Field label="Image" className="md:col-span-2">
             <SingleFileField file={imageFile} onChange={handleImageChange} existingUrl={removeImage || !details.imagePath ? null : storageUrl(details.imagePath)} className="max-w-64" onRemove={() => { setRemoveImage(true); setImageFile(null); }} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Status"><Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v as "DRAFT" | "PUBLISHED" | "ARCHIVED"})}><SelectTrigger><SelectValue>{STATUS_OPTIONS.find((o) => o.value === formData.status)?.label}</SelectValue></SelectTrigger><SelectContent>{STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></Field>
          </div>
        </div>
      </div>
      <div className="border-t border-border px-6 py-4 flex justify-end gap-2"><Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>Cancel</Button><Button size="sm" onClick={handleUpdate} disabled={isPending}>{isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}Save Changes</Button></div>
    </>
  );
}
