"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createStoryTag, type AvailableStoryTag } from "@/app/admin/multimedia/stories/actions";
import { cn } from "@/lib/utils";

export function StoryTagSelector({
  tags: initialTags,
  selectedIds,
  onChange,
}: {
  tags: AvailableStoryTag[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const [tags, setTags] = useState(initialTags);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredTags = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return tags;
    return tags.filter((tag) => tag.name.toLowerCase().includes(normalized) || tag.slug.includes(normalized));
  }, [query, tags]);

  const selectedTags = tags.filter((tag) => selectedIds.includes(tag.id));

  function toggleTag(id: number) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id]);
  }

  function handleCreateTag() {
    const name = newTagName.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      const result = await createStoryTag(name);
      if (result.error || !result.data) {
        setError(result.error ?? "Failed to create tag.");
        return;
      }
      setTags((current) => [...current, result.data!].sort((a, b) => a.name.localeCompare(b.name)));
      onChange([...selectedIds, result.data.id]);
      setNewTagName("");
      setQuery("");
    });
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
            <span className="truncate text-left">
              {selectedTags.length > 0 ? `${selectedTags.length} tag${selectedTags.length === 1 ? "" : "s"} selected` : "Select tags..."}
            </span>
            <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tags..."
            autoFocus
          />
          <div className="mt-2 max-h-48 overflow-y-auto">
            {filteredTags.length > 0 ? filteredTags.map((tag) => {
              const selected = selectedIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => toggleTag(tag.id)}
                >
                  <span className={cn("flex size-4 items-center justify-center rounded-sm border", selected && "border-primary bg-primary text-primary-foreground")}>
                    {selected && <CheckIcon className="size-3" />}
                  </span>
                  <span className="truncate">{tag.name}</span>
                </button>
              );
            }) : <p className="px-2 py-3 text-sm text-muted-foreground">No tags found.</p>}
          </div>
          <div className="mt-2 border-t pt-2">
            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(event) => setNewTagName(event.target.value)}
                placeholder="New tag name"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleCreateTag();
                  }
                }}
              />
              <Button type="button" size="icon" onClick={handleCreateTag} disabled={isPending || !newTagName.trim()} aria-label="Create tag">
                <PlusIcon className="size-4" />
              </Button>
            </div>
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>
        </PopoverContent>
      </Popover>
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <span key={tag.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
              {tag.name}
              <button type="button" onClick={() => toggleTag(tag.id)} aria-label={`Remove ${tag.name}`}>
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
