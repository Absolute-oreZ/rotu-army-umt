"use client";

import { useState, useTransition } from "react";
import { PlusIcon, AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollectionsTable, type Collection } from "@/components/admin/treasurer/collections/collections-table";
import { AddCollectionDialog } from "@/components/admin/treasurer/collections/add-collection-dialog";
import { DeleteCollectionDialog } from "@/components/admin/treasurer/collections/delete-collection-dialog";
import { publishCollection, unpublishCollection, archiveCollection, restoreCollection } from "@/app/admin/treasurer/collections/actions";

type Account = {
  id: number;
  intakeId: number;
  bankName: string;
  accountNumber: number;
  treasurerName: string;
};

type DialogIntakeOption = {
  id: number;
  intakeNo: string;
};

type CollectionsPageClientProps = {
  searchParams: Record<string, string | string[] | undefined>;
  collections: Collection[];
  totalCount: number;
  accounts: Account[];
  intakeOptions: DialogIntakeOption[];
  isAdminIntakeScoped: boolean;
}

export function CollectionsPageClient({
  searchParams,
  collections,
  totalCount,
  accounts,
  intakeOptions,
  isAdminIntakeScoped,
}: CollectionsPageClientProps) {
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePublish(collectionId: number) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("collectionId", String(collectionId));
      const result = await publishCollection(fd);
      if (result?.error) setError(result.error);
    });
  }

  function handleUnpublish(collectionId: number) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("collectionId", String(collectionId));
      const result = await unpublishCollection(fd);
      if (result?.error) setError(result.error);
    });
  }

  function handleArchive(collectionId: number) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("collectionId", String(collectionId));
      const result = await archiveCollection(fd);
      if (result?.error) setError(result.error);
    });
  }

  function handleRestore(collectionId: number) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("collectionId", String(collectionId));
      const result = await restoreCollection(fd);
      if (result?.error) setError(result.error);
    });
  }

  function copyPaymentUrl(slug: string) {
    const url = `${window.location.origin}/cadet/collections/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Collections</h1>
        <AddCollectionDialog
          trigger={
            <Button size="sm">
              <PlusIcon className="mr-2 size-4" />
              New Collection
            </Button>
          }
          accounts={accounts}
          intakeOptions={intakeOptions}
          isAdminIntakeScoped={isAdminIntakeScoped}
        />
      </div>

      {error && !deleteTarget && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <CollectionsTable
        collections={collections}
        searchParams={searchParams}
        totalCount={totalCount}
        intakeOptions={intakeOptions.map((i) => ({ value: i.intakeNo, label: i.intakeNo }))}
        isAdminIntakeScoped={isAdminIntakeScoped}
        hasAccounts={accounts.length > 0}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        onArchive={handleArchive}
        onRestore={handleRestore}
        onDelete={(col) => {
          setError(null);
          setDeleteTarget(col);
        }}
        onCopyUrl={copyPaymentUrl}
        copiedSlug={copiedSlug}
        isPending={isPending}
      />

      <DeleteCollectionDialog
        collection={deleteTarget}
        error={error}
        onError={setError}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </>
  );
}
