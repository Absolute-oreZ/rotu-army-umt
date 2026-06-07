import { redirectAdminRoot } from "@/lib/admin/rbac";

export default async function AdminPage() {
  const admin = await redirectAdminRoot();

  return (
    <section className="flex w-full max-w-6xl flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Admin dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Command overview</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Signed in as {admin.email}. The Officer and Instructor dashboard will
          collect cross-system summaries here.
        </p>
      </div>
    </section>
  );
}
