import { createServerFn } from "@tanstack/react-start";
import { callLovableAI, type ChatMessage } from "./ai-gateway.server";

export interface AgentCardSpec {
  type:
    | "segment_preview"
    | "campaign_ready"
    | "occasion_alert"
    | "loyalty_milestone"
    | "viral_campaign"
    | "results"
    | "none";
  title?: string;
  description?: string;
  segment_name?: string;
  campaign_type?: "standard" | "flash_drop" | "loyalty" | "re-engagement" | "occasion" | "challenge" | "contest";
  channel?: "whatsapp" | "email" | "sms";
  filter?: {
    personas?: string[];
    min_total_spent?: number;
    max_days_since_last_order?: number;
    min_days_since_last_order?: number;
    favorite_category?: string;
    discount_sensitivity?: string;
    loyalty_tier?: string[];
    last_review_rating_gte?: number;
    last_review_rating_lte?: number;
    has_try_on?: boolean;
    min_health_score?: number;
    max_health_score?: number;
  };
  sample_messages?: { persona: string; content: string; reasoning: string }[];
  template?: string;
  occasion_key?: string;
  rationale?: string;
  cta_label?: string;
  // A/B variants
  variant_a?: { description: string; content: string };
  variant_b?: { description: string; content: string };
  ab_test_enabled?: boolean;
  // ROI estimate (filled server-side post-LLM)
  roi?: {
    recipients: number;
    expected_opens: number;
    expected_clicks: number;
    estimated_revenue: number;
    roi_multiplier: number;
    open_rate: number;
    click_rate: number;
    avg_order_value: number;
  };
  // Set after a successful launch so persisted history can render "✓ Launched"
  launched_campaign_id?: string;
}

export interface AgentResponse {
  message: string;
  card?: AgentCardSpec;
}

interface AgentInput {
  message: string;
  history: ChatMessage[];
  brandStats: {
    total_customers: number;
    persona_breakdown: Record<string, number>;
    loyalty_breakdown: Record<string, number>;
    upcoming_occasions: { name: string; days_away: number }[];
    last_campaign_performance?: { open_rate: number; click_rate: number } | null;
  };
}

const SYSTEM_PROMPT = `You are SPARK, the campaign strategist for DRAPE — a premium Indian D2C fashion label.
You are sharp, data-driven, creative. Indian fashion: festive seasonality, wedding season, metro vs tier-2 patterns, WhatsApp-first shoppers.

When you create campaigns, explain WHY this audience + this message will work. Never generic.

Health-score vocabulary the user may use → map to filter ranges:
- "at risk" / "lapsed" → max_health_score: 30
- "needs attention" / "soft" → min_health_score: 31, max_health_score: 60
- "healthy" → min_health_score: 61, max_health_score: 80
- "champions" / "best customers" → min_health_score: 81

If campaign_type is "standard" AND recipient count likely > 20, set ab_test_enabled: true and ALSO return variant_a and variant_b:
- variant_a: discount-forward, urgency tone (offer %, time-bound)
- variant_b: story-forward, emotional tone (narrative, brand voice)
Each variant ~30 words.

Persona reasoning EXACT format:
"[Name] is a [Persona] — [1-line behavioral reason]. Message uses [tone] because [logic]. Channel: [channel] ([reason])."

You MUST respond with a single JSON object (no markdown):
{
  "message": "<conversational reply 1-3 sentences>",
  "card": {
    "type": "segment_preview"|"campaign_ready"|"occasion_alert"|"loyalty_milestone"|"viral_campaign"|"results"|"none",
    "title": "...", "description": "...", "segment_name": "...",
    "campaign_type": "standard"|"flash_drop"|"loyalty"|"re-engagement"|"occasion"|"challenge"|"contest",
    "channel": "whatsapp"|"email"|"sms",
    "filter": { "personas": [...], "min_total_spent": n, "max_days_since_last_order": n, "min_days_since_last_order": n, "favorite_category": "...", "discount_sensitivity": "...", "loyalty_tier": [...], "min_health_score": n, "max_health_score": n, "has_try_on": true },
    "sample_messages": [ { "persona": "...", "content": "...", "reasoning": "<see format above>" } ],
    "template": "<master template with {{name}}>",
    "occasion_key": "festive"|"wedding"|"summer"|"eoss"|"valentine"|"college",
    "rationale": "<one line WHY>",
    "cta_label": "...",
    "ab_test_enabled": true|false,
    "variant_a": { "description": "Discount-forward, urgency tone", "content": "..." },
    "variant_b": { "description": "Story-forward, emotional tone", "content": "..." }
  }
}
Output ONLY the JSON.`;

export const askSpark = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as AgentInput)
  .handler(async ({ data }) => {
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: `Brand stats:\n${JSON.stringify(data.brandStats, null, 2)}` },
      ...data.history.slice(-10),
      { role: "user", content: data.message },
    ];
    const raw = await callLovableAI({ messages, responseFormat: "json_object" });
    let parsed: AgentResponse;
    try {
      parsed = JSON.parse(raw) as AgentResponse;
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? (JSON.parse(m[0]) as AgentResponse) : { message: raw || "Hmm, let me try that again.", card: { type: "none" } };
    }
    if (!parsed.message) parsed.message = "Done.";

    // Compute ROI server-side if we have a filter
    if (parsed.card && parsed.card.filter && (parsed.card.type === "segment_preview" || parsed.card.type === "campaign_ready" || parsed.card.type === "occasion_alert" || parsed.card.type === "viral_campaign")) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { customers, avgAOV } = await resolveSegment(supabaseAdmin, parsed.card.filter);
        if (customers.length > 0) {
          const type = parsed.card.campaign_type ?? "standard";
          const rates: Record<string, { o: number; c: number }> = {
            standard: { o: 0.44, c: 0.2 },
            flash_drop: { o: 0.65, c: 0.35 },
            occasion: { o: 0.55, c: 0.25 },
            loyalty: { o: 0.7, c: 0.3 },
            challenge: { o: 0.5, c: 0.28 },
            contest: { o: 0.5, c: 0.28 },
            "re-engagement": { o: 0.38, c: 0.18 },
          };
          const r = rates[type] ?? rates.standard;
          const expected_opens = Math.round(customers.length * r.o);
          const expected_clicks = Math.round(expected_opens * r.c);
          const projected_converters = expected_clicks * 0.3;
          const estimated_revenue = Math.round(projected_converters * (avgAOV || 1800));
          const cost = Math.max(1, customers.length * 2);
          parsed.card.roi = {
            recipients: customers.length,
            expected_opens,
            expected_clicks,
            estimated_revenue,
            roi_multiplier: +(estimated_revenue / cost).toFixed(1),
            open_rate: r.o,
            click_rate: r.c,
            avg_order_value: Math.round(avgAOV),
          };
          // Auto-enable A/B for standard >20
          if (type === "standard" && customers.length > 20 && parsed.card.variant_a && parsed.card.variant_b) {
            parsed.card.ab_test_enabled = true;
          }
        }
      } catch (e) {
        console.error("[spark] ROI compute failed", e);
      }
    }
    return parsed;
  });

async function runSegmentQuery(
  supabaseAdmin: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  f: NonNullable<AgentCardSpec["filter"]>,
) {
  let q = supabaseAdmin.from("customers").select("id, name, persona, preferred_channel, try_on_items, favorite_category, avg_order_value, health_score");
  if (f.personas?.length) q = q.in("persona", f.personas);
  if (typeof f.min_total_spent === "number") q = q.gte("total_spent", f.min_total_spent);
  if (typeof f.max_days_since_last_order === "number") q = q.lte("days_since_last_order", f.max_days_since_last_order);
  if (typeof f.min_days_since_last_order === "number") q = q.gte("days_since_last_order", f.min_days_since_last_order);
  if (f.favorite_category) q = q.eq("favorite_category", f.favorite_category);
  if (f.discount_sensitivity) q = q.eq("discount_sensitivity", f.discount_sensitivity);
  if (f.loyalty_tier?.length) q = q.in("loyalty_tier", f.loyalty_tier);
  if (typeof f.last_review_rating_gte === "number") q = q.gte("last_review_rating", f.last_review_rating_gte);
  if (typeof f.last_review_rating_lte === "number") q = q.lte("last_review_rating", f.last_review_rating_lte);
  if (typeof f.min_health_score === "number") q = q.gte("health_score", f.min_health_score);
  if (typeof f.max_health_score === "number") q = q.lte("health_score", f.max_health_score);
  if (f.has_try_on) q = q.not("try_on_items", "is", null);
  const { data } = await q;
  return (data ?? []) as { id: string; name: string | null; persona: string | null; preferred_channel: string | null; try_on_items: string[] | null; favorite_category: string | null; avg_order_value: number | null; health_score: number | null }[];
}

// Progressive relaxation: when the LLM over-constrains (common with
// stacked health-score + category + spend filters), peel off the
// narrowest criteria until we have a non-empty segment instead of
// returning "no customers match".
async function resolveSegment(
  supabaseAdmin: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  f: NonNullable<AgentCardSpec["filter"]>,
) {
  const attempts: Array<NonNullable<AgentCardSpec["filter"]>> = [
    f,
    { ...f, min_health_score: undefined, max_health_score: undefined },
    { ...f, min_health_score: undefined, max_health_score: undefined, favorite_category: undefined, discount_sensitivity: undefined },
    { personas: f.personas },
    {},
  ];
  let customers: Awaited<ReturnType<typeof runSegmentQuery>> = [];
  for (const attempt of attempts) {
    customers = await runSegmentQuery(supabaseAdmin, attempt);
    if (customers.length > 0) break;
  }
  const aovSum = customers.reduce((s, c) => s + (c.avg_order_value ?? 0), 0);
  const avgAOV = customers.length ? aovSum / customers.length : 1800;
  return { customers, avgAOV };
}

export interface BuildCampaignInput {
  card: AgentCardSpec;
}

export const buildCampaignFromCard = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as BuildCampaignInput)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { card } = data;
    const f = card.filter ?? {};

    const { customers } = await resolveSegment(supabaseAdmin, f);
    if (!customers || customers.length === 0) throw new Error("No customers match this segment.");

    const { data: seg, error: serr } = await supabaseAdmin.from("segments").insert({
      name: card.segment_name ?? card.title ?? "AI Segment",
      description: card.description ?? "",
      filter_logic: f,
      customer_count: customers.length,
      created_by: "ai",
      campaign_type: card.campaign_type ?? "standard",
    }).select().single();
    if (serr) throw serr;

    const channel = card.channel ?? "whatsapp";
    const abEnabled = !!card.ab_test_enabled && !!card.variant_a && !!card.variant_b;

    const { data: camp, error: cerr2 } = await supabaseAdmin.from("campaigns").insert({
      name: card.title ?? card.segment_name ?? "AI Campaign",
      segment_id: seg.id,
      channel,
      status: "draft",
      campaign_type: card.campaign_type ?? "standard",
      total_recipients: customers.length,
      message_template: card.template ?? card.sample_messages?.[0]?.content ?? "",
      ai_generated: true,
      occasion_trigger: card.occasion_key ?? null,
      ab_test_enabled: abEnabled,
      variant_a_description: abEnabled ? card.variant_a!.description : null,
      variant_b_description: abEnabled ? card.variant_b!.description : null,
    }).select().single();
    if (cerr2) throw cerr2;

    const byPersona: Record<string, { content: string; reasoning: string }> = {};
    for (const s of card.sample_messages ?? []) byPersona[s.persona] = { content: s.content, reasoning: s.reasoning };
    const fallback = card.template ?? card.sample_messages?.[0]?.content ?? "Hey {{name}}, something new just dropped at DRAPE.";

    const msgs = customers.map((c, idx) => {
      const persona = c.persona ?? "shopper";
      const channelLabel = channel === "whatsapp" ? "WhatsApp" : channel === "email" ? "Email" : "SMS";
      const channelReason =
        channel === "sms" ? "fastest open rate for time-sensitive offers" :
        channel === "email" ? "preferred channel, longer-form resonates" :
        "highest engagement in India, conversational tone";
      const variant: "A" | "B" = abEnabled ? (idx % 2 === 0 ? "A" : "B") : "A";
      let tmpl: string;
      if (abEnabled) {
        tmpl = variant === "A" ? card.variant_a!.content : card.variant_b!.content;
      } else {
        tmpl = byPersona[persona]?.content ?? fallback;
      }
      let content = tmpl.replace(/\{\{\s*name\s*\}\}/gi, c.name?.split(" ")[0] ?? "there");
      if (c.try_on_items && c.try_on_items.length) {
        content += ` (PS: the ${c.try_on_items[0]} you tried — still waiting for you.)`;
      }
      const baseReason = byPersona[persona]?.reasoning ?? `${persona} segment.`;
      const reasoning = `${c.name?.split(" ")[0] ?? "Shopper"} is a ${persona} — ${baseReason} Channel: ${channelLabel} (${channelReason}).`;
      return {
        campaign_id: camp.id,
        customer_id: c.id,
        personalized_content: content,
        channel,
        status: "queued",
        persona_reasoning: reasoning,
        variant,
      };
    });

    for (let i = 0; i < msgs.length; i += 200) {
      await supabaseAdmin.from("messages").insert(msgs.slice(i, i + 200));
    }

    return { ok: true, campaign_id: camp.id, segment_id: seg.id, total: customers.length };
  });
