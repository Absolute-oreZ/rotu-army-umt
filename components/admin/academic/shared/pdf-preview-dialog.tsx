"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buttonClasses, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DownloadIcon, FileTextIcon } from "lucide-react";

type PdfPreviewDialogProps = {
  title: string;
  pdfUrl: string | null;
  fileName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PdfPreviewDialog({
  title,
  pdfUrl,
  fileName = "document.pdf",
  open,
  onOpenChange,
}: PdfPreviewDialogProps) {
  if (!pdfUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="shrink-0 pb-2">
          <div className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5 text-primary" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>
            Preview and download the official document.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 w-full min-h-0 rounded-lg border border-border bg-muted/20 overflow-hidden relative">
          <iframe
            src={`${pdfUrl}#toolbar=0`}
            title={title}
            className="w-full h-full border-none"
          />
        </div>

        <DialogFooter className="shrink-0 pt-4 flex flex-row justify-between sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <a
            href={pdfUrl}
            download={fileName}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonClasses({}),
              "gap-1.5 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
            )}
          >
            <DownloadIcon className="h-4 w-4" />
            Download PDF
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
