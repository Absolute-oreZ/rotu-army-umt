"use client";

import { useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { SingleFileField } from "@/components/ui/single-file-field";
import { getAllowedImageExtension } from "@/lib/admin/form-helpers";
import { createSeeMoreLink } from "@/app/admin/multimedia/portfolio/actions";
import { storageUrl } from "@/lib/supabase/storage-public";

export type SeeMoreDialogProps = {
  linkId?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: {
    id: number;
    title: string;
    link: string;
    imagePath: string | null;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  };
  trigger?: React.ReactNode;
};

export function SeeMoreDialog({
  linkId,
  open: controlledOpen,
  onOpenChange,
  initialData,
  trigger,
}: SeeMoreDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: initialData?.title ?? "",
    link: initialData?.link ?? "",
    imagePath: initialData?.imagePath ?? null,
    imageFile: null as File | null,
    removeImage: false,
  });

  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  function handleSubmit() {
    setError(null);
    if (!formData.title.trim()) { setError("Title is required."); return; }
    if (!formData.link.trim()) { setError("Link is required."); return; }

    const fd = new FormData();
    fd.set("title", formData.title);
    fd.set("link", formData.link);
    fd.set("status", "DRAFT");
    if (formData.imageFile) fd.set("imageFile", formData.imageFile);
    if (formData.removeImage) fd.set("removeImage", "true");

    startTransition(async () => {
      const result = await createSeeMoreLink(fd);

      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        if (isControlled) {
          onOpenChange?.(false);
        } else {
          setUncontrolledOpen(false);
        }
        setFormData({ title: "", link: "", imagePath: null, imageFile: null, removeImage: false });
      }
    });
  }

  function handleOpen() {
    if (!isControlled) {
      setUncontrolledOpen(true);
    }
  }

  function changeImageFile(file: File | null) {
    if (!file) {
      setFormData({ ...formData, imageFile: null, removeImage: formData.imagePath ? true : false });
      return;
    }
    if (!getAllowedImageExtension(file) || file.size > 5 * 1024 * 1024) {
      setError("Image must be a JPG, PNG, or WebP image under 5 MB.");
      return;
    }
    setError(null);
    setFormData({ ...formData, imageFile: file, removeImage: false });
  }

  return (
    <>
      {trigger && (
        <div
          role="button"
          tabIndex={0}
          onClick={handleOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleOpen();
          }}
          className="inline-flex"
        >
          {trigger}
        </div>
      )}
      <Dialog open={open} onOpenChange={onOpenChange ?? setUncontrolledOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{linkId ? "Edit Link" : "Create Link"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                <span>{error}</span>
              </div>
            )}
            <Field label="Title" required>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter title"
              />
            </Field>
            <Field label="Link URL" required>
              <Input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://example.com"
              />
            </Field>
            <Field label="Image" className="md:col-span-2">
              <SingleFileField
                file={formData.imageFile}
                onChange={changeImageFile}
                existingUrl={formData.removeImage || !formData.imagePath ? null : storageUrl(formData.imagePath)}
                accept="image/*"
                helperText="JPG, PNG, or WebP. Max 5 MB."
                className="max-w-96"
                onRemove={() => {
                  setFormData({ ...formData, imageFile: null, removeImage: true });
                }}
              />
            </Field>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
