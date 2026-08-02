"use client";

import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, GripVerticalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type PortfolioOrderItem = { id: number; sortOrder: number; label: string };

type Props = {
  title: string;
  items: PortfolioOrderItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (ids: number[]) => void;
  isPending: boolean;
};

export function PortfolioReorderDialog({ title, items, open, onOpenChange, onSave, isPending }: Props) {
  const [ordered, setOrdered] = useState(items);
  const [draggedId, setDraggedId] = useState<number | null>(null);

  function move(id: number, offset: number) {
    setOrdered((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function drop(targetId: number) {
    if (draggedId === null || draggedId === targetId) return;
    setOrdered((current) => {
      const from = current.findIndex((item) => item.id === draggedId);
      const to = current.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setDraggedId(null);
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader><div className="max-h-[60vh] space-y-2 overflow-y-auto">{ordered.map((item, index) => <div key={item.id} draggable onDragStart={() => setDraggedId(item.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => drop(item.id)} className="flex items-center gap-2 rounded-md border bg-card p-2"><GripVerticalIcon className="size-4 shrink-0 text-muted-foreground" /><span className="w-6 text-sm text-muted-foreground">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm">{item.label}</span><Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={index === 0 || isPending} onClick={() => move(item.id, -1)}><ArrowUpIcon className="size-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={index === ordered.length - 1 || isPending} onClick={() => move(item.id, 1)}><ArrowDownIcon className="size-4" /></Button></div>)}</div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button><Button onClick={() => onSave(ordered.map((item) => item.id))} disabled={isPending}>Save order</Button></DialogFooter></DialogContent></Dialog>;
}
