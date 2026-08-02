"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DownloadIcon, PlusIcon, SendIcon, UsersIcon } from "lucide-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { NewslettersTable } from "@/components/admin/multimedia/newsletters/newsletters-table";
import { AddNewsletterDialog } from "@/components/admin/multimedia/newsletters/add-newsletter-dialog";
import { NewsletterDetailsSheet } from "@/components/admin/multimedia/newsletters/newsletter-details-sheet";
import { DeleteNewsletterDialog } from "@/components/admin/multimedia/newsletters/delete-newsletter-dialog";
import { SubscribersTable } from "@/components/admin/multimedia/newsletters/subscribers-table";
import {
  sendCampaign,
  exportSubscribers,
  getNewsletterCampaigns,
  retryFailedCampaign,
  resendSubscriberConfirmation,
  updateSubscriberStatus,
  deleteSubscriber,
} from "@/app/admin/multimedia/newsletters/actions";
import { type CampaignRow, type SubscriberRow } from "@/components/admin/multimedia/newsletters/newsletters-table";

type NewslettersPageClientProps = {
  tab: string;
  searchParams: Record<string, string | string[] | undefined>;
  initialCampaigns: CampaignRow[];
  initialCampaignsTotalCount: number;
  initialSubscribers: SubscriberRow[];
  initialSubscribersTotalCount: number;
};

export function NewslettersPageClient({
  tab,
  searchParams,
  initialCampaigns,
  initialCampaignsTotalCount,
  initialSubscribers,
  initialSubscribersTotalCount,
}: NewslettersPageClientProps) {
  const initialCampaignKey = useMemo(() => initialCampaigns.map((campaign) => `${campaign.id}:${campaign.status}:${campaign.updatedAt}`).join("|"), [initialCampaigns]);
  const [campaignOverride, setCampaignOverride] = useState<{ key: string; data: CampaignRow[]; totalCount: number } | null>(null);
  const campaigns = campaignOverride?.key === initialCampaignKey ? campaignOverride.data : initialCampaigns;
  const campaignsTotalCount = campaignOverride?.key === initialCampaignKey ? campaignOverride.totalCount : initialCampaignsTotalCount;
  const subscribers = initialSubscribers;
  const subscribersTotalCount = initialSubscribersTotalCount;
  const [detailTarget, setDetailTarget] = useState<{ campaign: CampaignRow | null; mode: "view" | "edit" }>({
    campaign: null,
    mode: "view",
  });
  const [deleteTarget, setDeleteTarget] = useState<CampaignRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(tab === "subscribers" ? "subscribers" : "campaigns");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleTabChange(value: string) {
    setActiveTab(value);
    if (value === "subscribers") {
      // Subscribers data is already loaded from server
    }
  }

  const handleSend = async (campaign: CampaignRow) => {
    setError(null);
    const result = campaign.status === "FAILED" ? await retryFailedCampaign(campaign.id) : await sendCampaign(campaign.id);
    if (result.success) {
      const refreshed = await getNewsletterCampaigns(searchParams);
      if (refreshed.success) {
        setCampaignOverride({ key: initialCampaignKey, data: refreshed.data, totalCount: refreshed.totalCount });
      }
    } else {
      setError(result.error ?? "Failed to send campaign.");
    }
  };


  const handleExport = async () => {
    const result = await exportSubscribers();
    if (result.success) {
      const blob = new Blob([result.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      setError(result.error ?? "Failed to export subscribers.");
    }
  };

  const handleResendConfirmation = (subscriber: SubscriberRow) => startTransition(async () => { const result = await resendSubscriberConfirmation(subscriber.id); if (!result.success) setError(result.error ?? "Failed to resend confirmation."); else router.refresh(); });
  const handleSubscriberStatus = (subscriber: SubscriberRow, status: "ACTIVE" | "UNSUBSCRIBED") => startTransition(async () => { const result = await updateSubscriberStatus(subscriber.id, status); if (!result.success) setError(result.error ?? "Failed to update subscriber."); else router.refresh(); });
  const handleDeleteSubscriber = (subscriber: SubscriberRow) => { if (!window.confirm(`Delete subscriber ${subscriber.email}?`)) return; startTransition(async () => { const result = await deleteSubscriber(subscriber.id); if (!result.success) setError(result.error ?? "Failed to delete subscriber."); else router.refresh(); }); };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Newsletters</h1>
        {activeTab === "campaigns" ? <AddNewsletterDialog trigger={<Button size="sm"><PlusIcon className="mr-2 size-4" />Create Campaign</Button>} onCreated={() => router.refresh()} /> : <Button size="sm" onClick={handleExport}><DownloadIcon className="mr-2 size-4" />Export CSV</Button>}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} defaultValue="campaigns">
        <TabsList className="mb-6">
          <TabsTrigger value="campaigns"><SendIcon className="mr-2 size-4" />Campaigns</TabsTrigger>
          <TabsTrigger value="subscribers"><UsersIcon className="mr-2 size-4" />Subscribers</TabsTrigger>
        </TabsList>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <span>{error}</span>
          </div>
        )}

      {activeTab === "campaigns" && (
        <>
          <NewslettersTable
            campaigns={campaigns}
            searchParams={searchParams}
            totalCount={campaignsTotalCount}
            onView={(campaign) => {
              setError(null);
              setDetailTarget({ campaign, mode: "view" });
            }}
            onEdit={(campaign) => {
              setError(null);
              setDetailTarget({ campaign, mode: "edit" });
            }}
            onDelete={(campaign) => {
              setError(null);
              setDeleteTarget(campaign);
            }}
            onSend={handleSend}
          />

          <NewsletterDetailsSheet
            key={detailTarget.campaign?.id ?? "none"}
            campaignId={detailTarget.campaign?.id ?? null}
            initialMode={detailTarget.mode}
            open={!!detailTarget.campaign}
            onOpenChange={(open) => {
              if (!open) setDetailTarget({ campaign: null, mode: "view" });
            }}
          />

          <DeleteNewsletterDialog
            campaign={deleteTarget}
            error={error}
            onError={setError}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
          />
        </>
      )}

      {activeTab === "subscribers" && (
        <SubscribersTable
          subscribers={subscribers}
          searchParams={searchParams}
          totalCount={subscribersTotalCount}
          onResendConfirmation={handleResendConfirmation}
          onStatusChange={handleSubscriberStatus}
          isPending={isPending}
          onDelete={handleDeleteSubscriber}
        />
      )}
      </Tabs>
    </div>
  );
}
