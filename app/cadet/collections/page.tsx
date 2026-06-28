import Link from "next/link";
import { desc, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { collections } from "@/db/schema";
import { requireCurrentCadet } from "@/lib/auth/cadet";
import { CoinsIcon } from "lucide-react";
import { Empty } from "@/components/ui/empty";

function formatPurpose(purpose: string) {
  return purpose.split("_").join(" ");
}

export default async function CadetCollectionsPage() {
  const cadet = await requireCurrentCadet();

  const rows = await db
    .select({
      id: collections.id,
      title: collections.title,
      slug: collections.slug,
      purpose: collections.purpose,
      amount: collections.amount,
      isFixedAmount: collections.isFixedAmount,
      createdAt: collections.createdAt,
    })
    .from(collections)
    .where(
      and(
        eq(collections.status, "PUBLISHED"),
        eq(collections.intakeId, cadet.intakeId),
      ),
    )
    .orderBy(desc(collections.createdAt));

  return (
    <>
      <div className="mb-6 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Cadet portal
        </p>
        <h1 className="text-2xl font-semibold text-foreground">Collections</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          View the active collections for your intake and open each one to submit payment.
        </p>
      </div>

      {rows.length === 0 ? (
        <Empty
          title="No collections"
          description="There are no active collections for your intake right now."
          icon={<CoinsIcon className="size-5 text-muted-foreground" />}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => (
            <Link
              key={c.id}
              href={`/cadet/collections/${c.slug}`}
              className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground group-hover:text-primary">
                  {c.title}
                </h2>
                <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {formatPurpose(c.purpose)}
                </span>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  {c.isFixedAmount && c.amount ? (
                    <p className="text-lg font-semibold text-foreground">
                      RM {Number(c.amount).toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Flexible amount</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
