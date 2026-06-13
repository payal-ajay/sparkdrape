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
    console.log("Simulate channel called for campaign:", data.campaignId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: campaign } = await supabaseAdmin
      .from("campaigns")
      .select("id, campaign_type, status, ab_test_enabled, winner_variant")
      .eq("id", data.campaignId)
      .single();
    if (!campaign) return { done: true };

    const type = campaign.campaign_type ?? "standard";
    let baseOpen = 0.45, baseClick = 0.2;
    if (type === "flash_drop") { baseOpen = 0.65; baseClick = 0.35; }
    if (type === "occasion")  { baseOpen = 0.55; baseClick = 0.25; }
    if (type === "loyalty")   { baseOpen = 0.70; baseClick = 0.30; }

    const now = new Date().toISOString();

    // queued -> sent
    const { data: queued } = await supabaseAdmin
      .from("messages").select("id, variant").eq("campaign_id", data.campaignId).eq("status", "queued").limit(20);
    if (queued && queued.length) {
      await supabaseAdmin.from("messages").update({ status: "sent", sent_at: now }).in("id", queued.map((m) => m.id));
    }

    // sent -> delivered/failed
    const { data: sent } = await supabaseAdmin
      .from("messages").select("id").eq("campaign_id", data.campaignId).eq("status", "sent").limit(30);
    if (sent && sent.length) {
      const delivered: string[] = [], failed: string[] = [];
      for (const m of sent) (Math.random() < 0.85 ? delivered : failed).push(m.id);
      if (delivered.length) await supabaseAdmin.from("messages").update({ status: "delivered", delivered_at: now }).in("id", delivered);
      if (failed.length)    await supabaseAdmin.from("messages").update({ status: "failed" }).in("id", failed);
    }

    // delivered -> opened (variant-aware)
    const { data: delivered } = await supabaseAdmin
      .from("messages").select("id, variant").eq("campaign_id", data.campaignId).eq("status", "delivered").limit(40);
    if (delivered && delivered.length) {
      const opened: string[] = [];
      for (const m of delivered) {
        const variantBoost = campaign.ab_test_enabled && m.variant === "B" ? 1.15 : 1;
        if (Math.random() < Math.min(0.95, baseOpen * variantBoost)) opened.push(m.id);
      }
      if (opened.length) await supabaseAdmin.from("messages").update({ status: "opened", opened_at: now }).in("id", opened);
    }

    // opened -> clicked
    const { data: opened } = await supabaseAdmin
      .from("messages").select("id, variant").eq("campaign_id", data.campaignId).eq("status", "opened").limit(40);
    if (opened && opened.length) {
      const clicked: string[] = [];
      for (const m of opened) {
        const variantPenalty = campaign.ab_test_enabled && m.variant === "B" ? 0.9 : 1;
        if (Math.random() < baseClick * variantPenalty) clicked.push(m.id);
      }
      if (clicked.length) await supabaseAdmin.from("messages").update({ status: "clicked", clicked_at: now }).in("id", clicked);
    }

    const { data: allMsgs } = await supabaseAdmin
      .from("messages").select("status, variant").eq("campaign_id", data.campaignId);
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
      const stillMoving = allMsgs.some((m) => ["queued","sent","delivered","opened"].includes(m.status as string));

      let winner_variant: string | null | undefined = undefined;
      if (!stillMoving && campaign.ab_test_enabled && !campaign.winner_variant) {
        const perVariant: Record<string, { sent: number; engaged: number }> = { A: { sent: 0, engaged: 0 }, B: { sent: 0, engaged: 0 } };
        for (const m of allMsgs) {
          const v = (m.variant as string) ?? "A";
          if (!perVariant[v]) perVariant[v] = { sent: 0, engaged: 0 };
          perVariant[v].sent++;
          if (m.status === "opened" || m.status === "clicked") perVariant[v].engaged++;
        }
        const aRate = perVariant.A.sent ? perVariant.A.engaged / perVariant.A.sent : 0;
        const bRate = perVariant.B.sent ? perVariant.B.engaged / perVariant.B.sent : 0;
        winner_variant = bRate > aRate ? "B" : "A";
      }

      await supabaseAdmin.from("campaigns").update({
        sent_count: c.sent, delivered_count: c.delivered,
        opened_count: c.opened, clicked_count: c.clicked, failed_count: c.failed,
        status: stillMoving ? "live" : "completed",
        ...(winner_variant ? { winner_variant } : {}),
      }).eq("id", data.campaignId);
      return { done: !stillMoving };
    }
    return { done: false };
  });
