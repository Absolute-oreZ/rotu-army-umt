"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { BoldIcon, ItalicIcon, LinkIcon, ListIcon, ListOrderedIcon, PaperclipIcon, SmileIcon, UnderlineIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NewsletterRichEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onAttach?: (files: FileList | null) => void;
  attachments?: Array<{ name: string; size: number }>;
  onRemoveAttachment?: (attachment: { name: string; size: number }) => void;
  placeholder?: string;
};

const commands = [
  { command: "bold", label: "Bold", icon: BoldIcon },
  { command: "italic", label: "Italic", icon: ItalicIcon },
  { command: "underline", label: "Underline", icon: UnderlineIcon },
  { command: "insertUnorderedList", label: "Bulleted list", icon: ListIcon },
  { command: "insertOrderedList", label: "Numbered list", icon: ListOrderedIcon },
] as const;

export function NewsletterRichEditor({ value, onChange, onAttach, attachments = [], onRemoveAttachment, placeholder }: NewsletterRichEditorProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imageBounds, setImageBounds] = useState({ left: 0, top: 0, width: 0, height: 0 });

  const emojis = ["😀", "🎉", "📣", "✅", "⭐", "💪", "📅", "📍", "🔗", "❤️", "🙏", "🎖️"];

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  function updateActiveFormats() {
    setActiveFormats(commands.filter(({ command }) => document.queryCommandState(command)).map(({ command }) => command));
  }

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveFormats);
    return () => document.removeEventListener("selectionchange", updateActiveFormats);
  }, []);

  function runCommand(command: string) {
    editorRef.current?.focus();
    document.execCommand(command, false);
    onChange(editorRef.current?.innerHTML ?? "");
    updateActiveFormats();
  }

  function insertLink() {
    editorRef.current?.focus();
    const url = window.prompt("Enter the link URL");
    if (!url) return;
    document.execCommand("createLink", false, url);
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function insertEmoji(emoji: string) {
    editorRef.current?.focus();
    document.execCommand("insertText", false, emoji);
    onChange(editorRef.current?.innerHTML ?? "");
    setEmojiOpen(false);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;

    event.preventDefault();
    selectionRef.current = document.getSelection()?.rangeCount ? document.getSelection()!.getRangeAt(0).cloneRange() : null;
    const file = imageItem.getAsFile();
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      editorRef.current?.focus();
      const selection = document.getSelection();
      if (selectionRef.current && selection) {
        selection.removeAllRanges();
        selection.addRange(selectionRef.current);
      }
      document.execCommand("insertImage", false, String(reader.result));
      const images = editorRef.current?.querySelectorAll("img");
      const insertedImage = images?.[images.length - 1];
      if (insertedImage) {
        insertedImage.style.display = "block";
        insertedImage.style.marginLeft = "0";
        insertedImage.style.marginRight = "0";
        selectImage(insertedImage);
      }
      onChange(editorRef.current?.innerHTML ?? "");
    };
    reader.readAsDataURL(file);
  }

  function updateImageBounds(image = selectedImage) {
    const shell = shellRef.current;
    if (!shell || !image) return;
    const imageRect = image.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    setImageBounds({ left: imageRect.left - shellRect.left, top: imageRect.top - shellRect.top, width: imageRect.width, height: imageRect.height });
  }

  function selectImage(image: HTMLImageElement | null) {
    setSelectedImage(image);
    if (image) requestAnimationFrame(() => updateImageBounds(image));
  }

  function startImageResize(event: ReactPointerEvent<HTMLButtonElement>, corner: string) {
    if (!selectedImage || !shellRef.current) return;
    const image = selectedImage;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = image.getBoundingClientRect().width;
    const maxWidth = shellRef.current.getBoundingClientRect().width - 24;

    function handleMove(moveEvent: PointerEvent) {
      const delta = moveEvent.clientX - startX;
      const nextWidth = Math.max(40, Math.min(maxWidth, startWidth + (corner.includes("e") ? delta : -delta)));
      image.style.width = `${nextWidth}px`;
      image.style.maxWidth = "100%";
      image.style.display = "block";
      image.style.marginLeft = "0";
      image.style.marginRight = "0";
      updateImageBounds();
    }

    function handleUp() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      onChange(editorRef.current?.innerHTML ?? "");
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  }

  return (
    <div ref={shellRef} className="relative overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
      <div className="relative flex flex-wrap gap-1 border-b border-border bg-muted/40 p-1">
        {commands.map(({ command, label, icon: Icon }) => (
          <Button
            key={command}
            type="button"
            variant="ghost"
            size="icon-xs"
            className={cn("text-muted-foreground hover:text-foreground", activeFormats.includes(command) && "bg-primary/15 text-primary")}
            aria-label={label}
            title={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(command)}
          >
            <Icon className="size-3.5" />
          </Button>
        ))}
        <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-foreground" aria-label="Insert link" title="Insert link" onMouseDown={(event) => event.preventDefault()} onClick={insertLink}>
          <LinkIcon className="size-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon-xs" className={cn("text-muted-foreground hover:text-foreground", emojiOpen && "bg-primary/15 text-primary")} aria-label="Insert emoji" title="Insert emoji" onClick={() => setEmojiOpen((open) => !open)}>
          <SmileIcon className="size-3.5" />
        </Button>
        {onAttach && <>
          <input ref={attachmentInputRef} type="file" multiple className="hidden" onChange={(event) => onAttach(event.target.files)} />
          <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-foreground" aria-label="Attach files" title="Attach files" onClick={() => attachmentInputRef.current?.click()}>
            <PaperclipIcon className="size-3.5" />
          </Button>
        </>}
        {emojiOpen && <div className="absolute left-1 top-9 z-10 grid w-44 grid-cols-6 gap-1 rounded-md border border-border bg-popover p-2 shadow-lg">{emojis.map((emoji) => <button key={emoji} type="button" className="rounded p-1.5 text-base hover:bg-muted" onMouseDown={(event) => event.preventDefault()} onClick={() => insertEmoji(emoji)}>{emoji}</button>)}</div>}
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        suppressContentEditableWarning
        className="min-h-52 whitespace-pre-wrap p-3 text-sm outline-none empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] [&_a]:text-primary [&_a]:underline [&_img]:mx-0 [&_img]:block [&_img]:max-w-full [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        onPaste={handlePaste}
        onClick={(event) => selectImage(event.target instanceof HTMLImageElement ? event.target : null)}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
      />
      {attachments.length > 0 && <div className="flex flex-wrap gap-2 border-t border-border bg-muted/20 p-2">{attachments.map((file) => <span key={`${file.name}-${file.size}`} className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground"><PaperclipIcon className="size-3" /><span className="max-w-48 truncate">{file.name}</span>{onRemoveAttachment && <button type="button" className="rounded p-0.5 hover:bg-muted hover:text-foreground" aria-label={`Remove ${file.name}`} onClick={() => onRemoveAttachment(file)}><XIcon className="size-3" /></button>}</span>)}</div>}
      {selectedImage && imageBounds.width > 0 && <div className="pointer-events-none absolute z-20 border-2 border-primary" style={{ left: imageBounds.left, top: imageBounds.top, width: imageBounds.width, height: imageBounds.height }} onClick={(event) => event.stopPropagation()}>{["nw", "ne", "sw", "se"].map((corner) => <button key={corner} type="button" aria-label={`Resize image from ${corner} corner`} className={cn("pointer-events-auto absolute h-3 w-3 rounded-sm border border-primary bg-background", corner.includes("n") ? "-top-1.5" : "-bottom-1.5", corner.includes("w") ? "-left-1.5" : "-right-1.5")} onPointerDown={(event) => startImageResize(event, corner)} />)}</div>}
    </div>
  );
}
