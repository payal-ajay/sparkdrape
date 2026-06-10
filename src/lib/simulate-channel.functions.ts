import { createServerFn } from "@tanstack/react-start";

interface LaunchInput {
  campaignId: string;
}

interface ProcessBatch {
  campaignId: string;
}

export const launchCampaign = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as LaunchInput)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("campaigns")
      .update({ status: "live", launched_at: new Date().toISOString() })
      .eq("id", data.campaignId);
    return { ok: true };
  });

// Process one tick of message lifecycle. Frontend calls this repeatedly until done.
export const processCampaignTick = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as ProcessBatch)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: campaign } = await supabaseAdmin
      .from("campaigns")
      .select("id, campaign_type, status")
      .eq("id", data.campaignId)
      .single();
    if (!campaign) return { done: true };

    // Modifiers per campaign_type
    const type = campaign.campaign_type ?? "standard";
    let openRate = 0.45, clickRate = 0.20;
    if (type === "flash_drop") { openRate = 0.65; clickRate = 0.35; }
    if (type === "occasion") { openRate = 0.55; clickRate = 0.25; }
    if (type === "loyalty") { openRate = 0.70; clickRate = 0.30; }

    const now = new Date().toISOString();

    // queued -> sent (in batches of 20)
    const { data: queued } = await supabaseAdmin
      .from("messages")
      .select("id")
      .eq("campaign_id", data.campaignId)
      .eq("status", "queued")
      .limit(20);
    if (queued && queued.length) {
      await supabaseAdmin.from("messages").update({ status: "sent", sent_at: now }).in("id", queued.map(m => m.id));
    }

    // sent -> delivered/failed
    const { data: sent } = await supabaseAdmin
      .from("messages")
      .select("id")
      .eq("campaign_id", data.campaignId)
      .eq("status", "sent")
      .limit(30);
    if (sent && sent.length) {
      const delivered: string[] = [];
      const failed: string[] = [];
      for (const m of sent) (Math.random() < 0.85 ? delivered : failed).push(m.id);
      if (delivered.length) await supabaseAdmin.from("messages").update({ status: "delivered", delivered_at: now }).in("id", delivered);
      if (failed.length) await supabaseAdmin.from("messages").update({ status: "failed" }).in("id", failed);
    }

    // delivered -> opened
    const { data: delivered } = await supabaseAdmin
      .from("messages")
      .select("id")
      .eq("campaign_id", data.campaignId)
      .eq("status", "delivered")
      .limit(30);
    if (delivered && delivered.length) {
      const opened = delivered.filter(() => Math.random() < openRate).map(m => m.id);
      if (opened.length) await supabaseAdmin.from("messages").update({ status: "opened", opened_at: now }).in("id", opened);
    }

    // opened -> clicked
    const { data: opened } = await supabaseAdmin
      .from("messages")
      .select("id")
      .eq("campaign_id", data.campaignId)
      .eq("status", "opened")
      .limit(30);
    if (opened && opened.length) {
      const clicked = opened.filter(() => Math.random() < clickRate).map(m => m.id);
      if (clicked.length) await supabaseAdmin.from("messages").update({ status: "clicked", clicked_at: now }).in("id", clicked);
    }

    // Recompute counts
    const { data: allMsgs } = await supabaseAdmin
      .from("messages")
      .select("status")
      .eq("campaign_id", data.campaignId);
    if (allMsgs) {
      const c = { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 };
      for (const m of allMsgs) {
        const s = m.status as string;
        if (s === "sent") c.sent++;
        if (s === "delivered" || s === "opened" || s === "clicked") { c.sent++; c.delivered++; }
        if (s === "opened" || s === "clicked") c.opened++;
        if (s === "clicked") c.clicked++;
        if (s === "failed") { c.sent++; c.failed++; }
      }
      // Done if nothing left moving forward
      const stillMoving = allMsgs.some(m => m.status === "queued" || m.status === "sent" || m.status === "delivered" || m.status === "opened");
      await supabaseAdmin.from("campaigns").update({
        sent_count: c.sent, delivered_count: c.delivered,
        opened_count: c.opened, clicked_count: c.clicked, failed_count: c.failed,
        status: stillMoving ? "live" : "completed",
      }).eq("id", data.campaignId);
      return { done: !stillMoving };
    }
    return { done: false };
  });
