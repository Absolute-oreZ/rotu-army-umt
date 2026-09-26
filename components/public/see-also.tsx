import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { storageUrl } from "@/lib/supabase/storage-public";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import FlowingMenu from "./flowing-menu";

export function SeeAlso({ items, dictionary }: { items: Array<{ title: string; link: string; imagePath: string | null }>; dictionary: Dictionary }) {
  if (!items.length) return <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">{dictionary.home.seeAlsoEmpty}</p>;
  return <>
    <div className="hidden min-h-176 w-full lg:block">
      <FlowingMenu items={items.map((item) => ({ image: item.imagePath ? storageUrl(item.imagePath) : undefined, link: item.link, text: item.title }))} />
    </div>
    <div className="grid gap-0 border-y border-border sm:grid-cols-2 lg:hidden">{items.map((item) => <Link key={item.link} href={item.link} target="_blank" rel="noopener noreferrer" className="group flex min-h-28 items-center gap-4 border-b border-border p-4 transition-colors hover:bg-muted"><div className="relative size-14 shrink-0 overflow-hidden border border-border bg-muted">{item.imagePath ? <Image src={storageUrl(item.imagePath)} alt="" fill sizes="56px" className="object-cover" /> : null}</div><span className="flex min-w-0 items-center gap-2 text-sm font-semibold leading-5">{item.title}<span className="sr-only"> ({dictionary.common.externalLink})</span><ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span></Link>)}</div>
  </>;
}
