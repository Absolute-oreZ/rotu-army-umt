import { redirectAdminRoot } from "@/lib/admin/rbac";
import { signOutAdmin } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  const admin = await redirectAdminRoot();

  return (
    <main className="min-h-dvh bg-background px-6 py-10 text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Admin dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Command overview</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Signed in as {admin.email}. The Officer and Instructor dashboard
            will collect cross-system summaries here.
          </p>
        </div>

        <form action={signOutAdmin}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </section>
    </main>
  );
}
