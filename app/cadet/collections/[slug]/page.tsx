import Image from "next/image";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { collectionPayments } from "@/db/schema";
import { requireCurrentCadet } from "@/lib/auth/cadet";
import { getPublishedCollectionBySlug } from "@/lib/cadet/collections";
import { PaymentForm } from "../../../../components/cadet/payment-form";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CadetCollectionPage({ params }: PageProps) {
  const cadet = await requireCurrentCadet();
  const { slug } = await params;

  const collection = await getPublishedCollectionBySlug(slug, cadet.intakeId);
  if (!collection) notFound();

  const [existingPayment] = await db
    .select({ id: collectionPayments.id, paidAt: collectionPayments.paidAt })
    .from(collectionPayments)
    .where(
      and(
        eq(collectionPayments.collectionId, collection.id),
        eq(collectionPayments.memberId, cadet.memberId),
      ),
    )
    .limit(1);

  function formatPurpose(purpose: string) {
    return purpose.charAt(0) + purpose.slice(1).toLowerCase();
  }

  function formatBank(bank: string) {
    return bank.split("_").join(" ");
  }

  return (
    <main className="bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            ROTU Army UMT
          </p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                {collection.title}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border bg-muted px-2.5 py-1">
                  {formatPurpose(collection.purpose)}
                </span>
                {collection.isFixedAmount && collection.amount && (
                  <span className="rounded-full border border-border bg-muted px-2.5 py-1 font-medium text-foreground">
                    RM {Number(collection.amount).toFixed(2)}
                  </span>
                )}
                {collection.isReceiptRequired && (
                  <span className="rounded-full border border-border bg-muted px-2.5 py-1">
                    Receipt required
                  </span>
                )}
              </div>
            </div>
            {existingPayment ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-600/10 px-4 py-3 text-sm">
                <p className="font-semibold text-emerald-600">Payment recorded</p>
                <p className="mt-1 text-muted-foreground">
                  Submitted on{" "}
                  {new Date(existingPayment.paidAt).toLocaleDateString("en-MY", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ) : null}
          </div>
          {collection.description && (
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {collection.description}
            </p>
          )}
        </section>

        {existingPayment ? null : (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    Payment Details
                  </h2>
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-background px-4 py-3">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Bank
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {formatBank(collection.bankName)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background px-4 py-3">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Account
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {collection.accountNumber}
                    </p>
                  </div>
                  {collection.duitNowId && (
                    <div className="rounded-2xl border border-border bg-background px-4 py-3 sm:col-span-2">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        DuitNow
                      </p>
                      <p className="mt-1 font-medium text-foreground">
                        {collection.duitNowId}
                      </p>
                    </div>
                  )}
                </div>
                {collection.qrCodeUrl && (
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      QR Code
                    </p>
                    <div className="mt-3 flex justify-center">
                      <Image
                        src={collection.qrCodeUrl}
                        alt="Payment QR code"
                        width={240}
                        height={240}
                        className="rounded-2xl border border-border"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Submit Payment
              </h2>
              <div className="mt-4">
                <PaymentForm
                  collectionId={collection.id}
                  slug={collection.slug}
                  isFixedAmount={collection.isFixedAmount}
                  fixedAmount={collection.amount}
                  isReceiptRequired={collection.isReceiptRequired}
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
