import { NextResponse } from "next/server";
import { getDueNewsletterCampaignIds, getStuckSendingCampaigns, getFailedNewsletterCampaignIds, deliverNewsletterCampaign, retryFailedDeliveries } from "@/lib/newsletter-campaigns";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  return bufA.equals(bufB);
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || !authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expected = `Bearer ${cronSecret}`;
  if (!timingSafeEqual(authorization, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = [];

    // 1. Process scheduled campaigns
    const scheduledIds = await getDueNewsletterCampaignIds();
    for (const campaignId of scheduledIds) {
      results.push({
        campaignId,
        type: "scheduled",
        result: await deliverNewsletterCampaign(campaignId, null),
      });
    }

    // 2. Recover stuck SENDING campaigns
    const stuckIds = await getStuckSendingCampaigns();
    for (const campaignId of stuckIds) {
      results.push({
        campaignId,
        type: "stuck_recovery",
        result: await deliverNewsletterCampaign(campaignId, null),
      });
    }

    // 3. Retry campaigns with failed deliveries
    const failedIds = await getFailedNewsletterCampaignIds();
    for (const campaignId of failedIds) {
      results.push({
        campaignId,
        type: "failed_retry",
        result: await retryFailedDeliveries(campaignId, null),
      });
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    console.error("newsletter cron failed", error);
    return NextResponse.json({ error: "Newsletter cron failed." }, { status: 500 });
  }
}
