import Link from "next/link";
import Image from "next/image";

interface NewsletterStatusPageProps {
  actionHref: string;
  actionLabel: string;
  eyebrow: string;
  imageSrc: string;
  imageAlt: string;
  statusDescription: string;
  statusTitle: string;
  title: string;
}

export function NewsletterStatusPage({
  actionHref,
  actionLabel,
  eyebrow,
  imageSrc,
  imageAlt,
  statusDescription,
  statusTitle,
  title,
}: NewsletterStatusPageProps) {
  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-background text-foreground">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-4xl items-center px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <section className="w-full overflow-hidden rounded-4xl border border-border bg-card/70 shadow-sm backdrop-blur">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="relative aspect-square w-full sm:aspect-auto sm:min-h-full">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="flex flex-col justify-between px-6 py-10 sm:px-10 sm:py-12">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                  {eyebrow}
                </span>

                <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  {title}
                </h1>

                <div className="mt-8 rounded-2xl border border-border bg-background px-5 py-6 sm:px-6">
                  <h2 className="text-base font-semibold text-foreground">{statusTitle}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {statusDescription}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={actionHref}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-xs font-bold uppercase tracking-[0.24em] text-background transition-colors hover:bg-foreground/90"
                >
                  {actionLabel}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}