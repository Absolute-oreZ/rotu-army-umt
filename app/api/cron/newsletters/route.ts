import { NextResponse } from "next/server";
import { getDueNewsletterCampaignIds, deliverNewsletterCampaign } from "@/lib/newsletter-campaigns";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const campaignIds = await getDueNewsletterCampaignIds();
    const results = [];

    for (const campaignId of campaignIds) {
      results.push({
        campaignId,
        result: await deliverNewsletterCampaign(campaignId, null),
      });
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    console.error("newsletter cron failed", error);
    return NextResponse.json({ error: "Newsletter cron failed." }, { status: 500 });
  }
}
