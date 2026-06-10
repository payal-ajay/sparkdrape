import { createServerFn } from "@tanstack/react-start";
import { callLovableAI, type ChatMessage } from "./ai-gateway.server";

// Card spec the model returns; frontend renders rich cards from this.
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
  };
  sample_messages?: { persona: string; content: string; reasoning: string }[];
  template?: string;
  occasion_key?: string;
  rationale?: string;
  cta_label?: string;
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
You are sharp, data-driven, creative. You understand Indian fashion: festive seasonality, wedding season,
metro vs tier-2 buying patterns, WhatsApp-first Indian shoppers. You know Myntra's personalization model,
Savana's viral flash mechanics, Tira's loyalty logic, and Blinkit's engagement-first thinking.

When you create campaigns, always explain WHY this audience + this message will work.
Never be generic. Quantify expected impact when suggesting viral campaigns.

You MUST respond with a single JSON object that matches this schema (do not wrap in markdown):
{
  "message": "<your conversational reply, 1-3 sentences, editorial tone>",
  "card": {
    "type": "segment_preview" | "campaign_ready" | "occasion_alert" | "loyalty_milestone" | "viral_campaign" | "results" | "none",
    "title": "<short title>",
    "description": "<one line>",
    "segment_name": "<short label like 'Lapsed High-Value Loyalists'>",
    "campaign_type": "standard" | "flash_drop" | "loyalty" | "re-engagement" | "occasion" | "challenge" | "contest",
    "channel": "whatsapp" | "email" | "sms",
    "filter": {
      "personas": ["Trend Chaser" | "Discount Hunter" | "Loyalist" | "Lapsed High-Value" | "New Shopper"],
      "min_total_spent": number, "max_days_since_last_order": number, "min_days_since_last_order": number,
      "favorite_category": "denim"|"ethnic"|"western"|"footwear"|"accessories"|"coords",
      "discount_sensitivity": "high"|"medium"|"low",
      "loyalty_tier": ["Fan"|"Muse"|"Icon"],
      "last_review_rating_gte": 1-5, "last_review_rating_lte": 1-5,
      "has_try_on": true
    },
    "sample_messages": [
      { "persona": "...", "content": "<actual message body, ~30 words>", "reasoning": "<why this copy for this persona>" }
    ],
    "template": "<master template with {{name}} placeholder>",
    "occasion_key": "festive"|"wedding"|"summer"|"eoss"|"valentine"|"college",
    "rationale": "<one line WHY this works>",
    "cta_label": "<button label>"
  }
}

Card selection rules:
- User describes audience criteria → "segment_preview" with filter
- User asks to run/launch/create a campaign → "campaign_ready" with filter + 3 sample_messages (one per persona present)
- Flash drop / 30 minutes / scarcity → "viral_campaign" with campaign_type=flash_drop
- Style challenge / UGC → "viral_campaign" with campaign_type=challenge
- Best look contest → "viral_campaign" with campaign_type=contest
- Eid / festive / Diwali / wedding / Valentine → "occasion_alert" with occasion_key + filter
- Loyalty tier / Icon / points → "loyalty_milestone"
- Performance / open rate / click rate question → "results"
- Pure chat / greeting → "none"

For sample_messages use Indian fashion voice. Persona tone:
- Loyalist: warm, early-access, "you were with us from the start"
- Discount Hunter: urgency, percent off prominent, countdown
- Lapsed High-Value: re-engagement, "we missed you"
- Trend Chaser: FOMO, fresh drop, editorial tone
- New Shopper: welcoming, guided

Output ONLY the JSON object. No prose before or after.`;

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
    return parsed;
  });

// Build a segment + campaign + messages from a card spec (called when user clicks "Launch")
export interface BuildCampaignInput {
  card: AgentCardSpec;
}

export const buildCampaignFromCard = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as BuildCampaignInput)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { card } = data;

    // 1. Resolve customers from filter
    let q = supabaseAdmin.from("customers").select("id, name, persona, preferred_channel, try_on_items, favorite_category");
    const f = card.filter ?? {};
    if (f.personas?.length) q = q.in("persona", f.personas);
    if (typeof f.min_total_spent === "number") q = q.gte("total_spent", f.min_total_spent);
    if (typeof f.max_days_since_last_order === "number") q = q.lte("days_since_last_order", f.max_days_since_last_order);
    if (typeof f.min_days_since_last_order === "number") q = q.gte("days_since_last_order", f.min_days_since_last_order);
    if (f.favorite_category) q = q.eq("favorite_category", f.favorite_category);
    if (f.discount_sensitivity) q = q.eq("discount_sensitivity", f.discount_sensitivity);
    if (f.loyalty_tier?.length) q = q.in("loyalty_tier", f.loyalty_tier);
    if (typeof f.last_review_rating_gte === "number") q = q.gte("last_review_rating", f.last_review_rating_gte);
    if (typeof f.last_review_rating_lte === "number") q = q.lte("last_review_rating", f.last_review_rating_lte);
    if (f.has_try_on) q = q.not("try_on_items", "is", null);

    const { data: customers, error: cerr } = await q;
    if (cerr) throw cerr;
    if (!customers || customers.length === 0) throw new Error("No customers match this segment.");

    // 2. Create segment
    const { data: seg, error: serr } = await supabaseAdmin.from("segments").insert({
      name: card.segment_name ?? card.title ?? "AI Segment",
      description: card.description ?? "",
      filter_logic: f,
      customer_count: customers.length,
      created_by: "ai",
      campaign_type: card.campaign_type ?? "standard",
    }).select().single();
    if (serr) throw serr;

    // 3. Create campaign
    const channel = card.channel ?? "whatsapp";
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
    }).select().single();
    if (cerr2) throw cerr2;

    // 4. Create personalized messages per customer
    const byPersona: Record<string, { content: string; reasoning: string }> = {};
    for (const s of card.sample_messages ?? []) byPersona[s.persona] = { content: s.content, reasoning: s.reasoning };
    const fallback = card.template ?? card.sample_messages?.[0]?.content ?? "Hey {{name}}, something new just dropped at DRAPE.";

    const msgs = customers.map((c) => {
      const tmpl = byPersona[c.persona ?? ""]?.content ?? fallback;
      let content = tmpl.replace(/\{\{\s*name\s*\}\}/gi, (c.name?.split(" ")[0] ?? "there"));
      // Try-on personalization
      if (c.try_on_items && c.try_on_items.length) {
        content += ` (PS: the ${c.try_on_items[0]} you tried — still waiting for you.)`;
      }
      const reasoning = byPersona[c.persona ?? ""]?.reasoning ?? `Generic ${card.campaign_type ?? "campaign"} message for ${c.persona ?? "shopper"}.`;
      return {
        campaign_id: camp.id,
        customer_id: c.id,
        personalized_content: content,
        channel,
        status: "queued",
        persona_reasoning: reasoning,
      };
    });

    for (let i = 0; i < msgs.length; i += 200) {
      await supabaseAdmin.from("messages").insert(msgs.slice(i, i + 200));
    }

    return { ok: true, campaign_id: camp.id, segment_id: seg.id, total: customers.length };
  });
