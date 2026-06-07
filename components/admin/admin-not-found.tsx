import Image from "next/image";
import Link from "next/link";

export function AdminNotFound({
  backHref,
  backLabel,
}: {
  backHref: string;
  backLabel: string;
}) {
  return (
    <main className="flex items-center justify-center bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
        <div className="relative h-44 w-44 sm:h-52 sm:w-52">
          <Image
            src="/images/not-found.png"
            alt="Admin page not found"
            fill
            sizes="208px"
            className="object-contain"
            priority
          />
        </div>

        <span className="mt-8 text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          Admin unavailable
        </span>

        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Page not found
        </h1>

        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
          The admin route you tried to open does not exist or is no longer available.
          If this is unexpected, take a screenshot and share it with the developer so it can be traced quickly.
        </p>

        <div className="mt-8">
          <Link
            href={backHref}
            className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-xs font-bold uppercase tracking-[0.24em] text-background transition-colors hover:bg-foreground/90"
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
