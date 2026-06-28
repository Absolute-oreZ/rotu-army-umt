import { redirect } from "next/navigation";
import { requireCurrentCadet } from "@/lib/auth/cadet";

export default async function CadetIndexPage() {
  await requireCurrentCadet();
  redirect("/cadet/collections");
}
