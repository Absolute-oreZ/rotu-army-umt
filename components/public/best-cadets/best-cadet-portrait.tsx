import Image from "next/image";
import { storageUrl } from "@/lib/supabase/storage-public";

export function BestCadetPortrait({ path, name, sizes, loading = "lazy" }: { path: string; name: string; sizes: string; loading?: "eager" | "lazy" }) {
  return <div className="relative aspect-[4/5] overflow-hidden border border-border bg-muted"><Image src={storageUrl(path)} alt={name} fill sizes={sizes} loading={loading} className="object-cover" /></div>;
}
