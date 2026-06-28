export default function CollectionNotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Collection not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This collection may have been archived or is not available for your
          intake.
        </p>
      </div>
    </main>
  );
}
