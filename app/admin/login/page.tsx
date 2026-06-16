import Image from "next/image";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { signInWithGoogle } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";
import { getCurrentAdmin } from "@/lib/admin/rbac";
import {
  getDefaultAdminRoute,
  isFullAccessAdminRole,
} from "@/lib/admin/roles";

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "auth-code-missing": "Google did not return a login code. Please try again.",
  "auth-exchange-failed": "The login session could not be completed.",
  "missing-origin": "The login request could not determine this site URL.",
  "oauth-start-failed": "Google login could not be started.",
  "not-authorized": "This Google account is not registered as an admin. Contact the Secretary to request access.",
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const admin = await getCurrentAdmin();

  if (admin) {
    redirect(
      isFullAccessAdminRole(admin.role)
        ? "/admin"
        : getDefaultAdminRoute(admin.role),
    );
  }

  const { error } = await searchParams;
  const message = error
    ? errorMessages[error] ?? "Something went wrong. Please try again."
    : null;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-12 text-foreground">
      <section className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
            <Image
              src="/icons/logo.png"
              alt=""
              width={44}
              height={44}
              className="size-full object-contain p-0.5"
              priority
            />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em]">
              ROTU Army UMT
            </p>
            <p className="text-sm text-muted-foreground">Admin dashboard</p>
          </div>
        </div>

        <div className="border-y border-border py-8">
          <div className="mb-6 flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold">Sign in with Google</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Admin access is restricted to invited UMT Google accounts.
          </p>

          {message ? (
            <p role="alert" className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {message}
            </p>
          ) : null}

          <form action={signInWithGoogle} className="mt-6">
            <Button type="submit" size="lg" className="w-full">
              Continue with Google
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
