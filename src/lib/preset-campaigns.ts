import type { AgentCardSpec } from "@/lib/spark-agent.functions";

// Ready-to-launch campaigns tuned to the actual seed data so the user
// always sees a non-empty segment and a full launch → simulate → results
// flow without having to prompt the agent.
export const SUGGESTED_CAMPAIGNS: AgentCardSpec[] = [
  {
    type: "campaign_ready",
    title: "Flash Drop: Coords Capsule for Trend Chasers",
    description: "Drop the new coords capsule to your 80 Trend Chasers — they buy fast and share faster.",
    segment_name: "Trend Chasers · coords-leaning",
    campaign_type: "flash_drop",
    channel: "whatsapp",
    filter: { personas: ["Trend Chaser"] },
    template: "Hey {{name}} 👀 — the coords capsule just dropped. 12 pieces, editor-picked, 48h early access for you.",
    sample_messages: [
      { persona: "Trend Chaser", content: "Hey {{name}} 👀 — the coords capsule just dropped. 12 pieces, editor-picked, 48h early access for you.", reasoning: "Trend Chasers respond to scarcity + early-access framing on WhatsApp." },
    ],
    rationale: "Trend Chasers index 1.8× on coords purchases and convert within 24h on flash drops.",
    cta_label: "Launch Flash Drop",
  },
  {
    type: "campaign_ready",
    title: "Re-engage 50 Lapsed High-Value shoppers",
    description: "These customers spent ₹34k+ on average but haven't ordered in 100+ days. A soft, story-led nudge.",
    segment_name: "Lapsed High-Value · win-back",
    campaign_type: "re-engagement",
    channel: "email",
    filter: { personas: ["Lapsed High-Value"] },
    template: "{{name}}, we miss you. A quiet new chapter just landed at DRAPE — we saved you a first look.",
    sample_messages: [
      { persona: "Lapsed High-Value", content: "{{name}}, we miss you. A quiet new chapter just landed at DRAPE — we saved you a first look.", reasoning: "High-value lapsed buyers respond to exclusivity, not discounts. Email keeps the tone editorial." },
    ],
    rationale: "Lapsed High-Value cohort has 0% offers in last 60 days — earned win-back outperforms 20% off here.",
    cta_label: "Launch Win-back",
  },
  {
    type: "campaign_ready",
    title: "Icon Tier: Stylist Concierge Invite",
    description: "Surprise-and-delight your 36 Icon-tier shoppers with a complimentary stylist session.",
    segment_name: "Icon Tier · top 12%",
    campaign_type: "loyalty",
    channel: "whatsapp",
    filter: { loyalty_tier: ["Icon"] },
    template: "{{name}}, you're Icon tier 👑. Your stylist Aanya has a curated edit ready — reply STYLE to book a session.",
    sample_messages: [
      { persona: "Loyalist", content: "{{name}}, you're Icon tier 👑. Your stylist Aanya has a curated edit ready — reply STYLE to book a session.", reasoning: "Icon-tier loyalists value status + 1:1 access far more than promo codes." },
    ],
    rationale: "Loyalty experience rewards outperform discounts 3.2× on repeat-purchase rate for top-tier shoppers.",
    cta_label: "Send Concierge Invite",
  },
];

// Occasion presets — used by the Loyalty page so every occasion card
// can launch a real end-to-end campaign with the seed data.
export const OCCASION_PRESETS: Record<string, AgentCardSpec> = {
  eoss: {
    type: "campaign_ready",
    title: "End of Season Sale — Discount Hunters",
    description: "Up to 60% off on Denims & Coords for your 70 Discount Hunters.",
    segment_name: "Discount Hunters · EOSS",
    campaign_type: "flash_drop",
    channel: "whatsapp",
    occasion_key: "eoss",
    filter: { personas: ["Discount Hunter"] },
    template: "{{name}} 🚨 EOSS is LIVE. Up to 60% off Denims & Coords. Your size is still in stock — shop now.",
    sample_messages: [
      { persona: "Discount Hunter", content: "{{name}} 🚨 EOSS is LIVE. Up to 60% off Denims & Coords. Your size is still in stock — shop now.", reasoning: "Discount Hunters convert on price + urgency. WhatsApp is fastest open channel." },
    ],
    rationale: "EOSS open rates on this cohort hit 65% historically — fastest sell-through for clearance stock.",
    cta_label: "Launch EOSS Campaign",
  },
  festive: {
    type: "campaign_ready",
    title: "Festive Edit — Loyalists & Trend Chasers",
    description: "Hand-picked festive pieces for shoppers who buy ethnic & coords.",
    segment_name: "Festive shoppers",
    campaign_type: "occasion",
    channel: "whatsapp",
    occasion_key: "festive",
    filter: { personas: ["Loyalist", "Trend Chaser"] },
    template: "{{name}}, the Festive Edit is here ✨ — 18 hand-picked pieces ready for the celebrations ahead.",
    sample_messages: [
      { persona: "Loyalist", content: "{{name}}, the Festive Edit is here ✨ — 18 hand-picked pieces ready for the celebrations ahead.", reasoning: "Loyalists pre-shop festive 3-4 weeks early. Early notification drives full-price conversion." },
    ],
    rationale: "Festive AOV is 2.1× annual average — early outreach to Loyalists captures budget before competitors.",
    cta_label: "Launch Festive Edit",
  },
  wedding: {
    type: "campaign_ready",
    title: "Wedding Season — Icon & Muse Tier",
    description: "Occasion-led pieces for your top-tier loyalists during wedding season.",
    segment_name: "Wedding-ready shoppers",
    campaign_type: "occasion",
    channel: "email",
    occasion_key: "wedding",
    filter: { loyalty_tier: ["Icon", "Muse"] },
    template: "{{name}}, the Wedding Atelier is open. Personal styling, made-to-measure alterations, complimentary delivery.",
    sample_messages: [
      { persona: "Loyalist", content: "{{name}}, the Wedding Atelier is open. Personal styling, made-to-measure alterations, complimentary delivery.", reasoning: "High-tier shoppers expect concierge-level service for wedding purchases." },
    ],
    rationale: "Wedding-season AOV averages ₹18k+. Concierge framing converts top-tier shoppers 4× better than discounts.",
    cta_label: "Open the Atelier",
  },
  valentine: {
    type: "campaign_ready",
    title: "Valentine's Edit — New Shoppers & Couples",
    description: "Romantic, gifting-led pieces for fresh shoppers.",
    segment_name: "Valentine's gifters",
    campaign_type: "occasion",
    channel: "whatsapp",
    occasion_key: "valentine",
    filter: { personas: ["New Shopper", "Trend Chaser"] },
    template: "{{name}} 🌹 — the Valentine's Edit is live. Gifting-ready, beautifully packaged, free delivery this week.",
    sample_messages: [
      { persona: "New Shopper", content: "{{name}} 🌹 — the Valentine's Edit is live. Gifting-ready, beautifully packaged, free delivery this week.", reasoning: "New shoppers respond to occasion-led entry points + free shipping." },
    ],
    rationale: "Valentine's drives first-time gift purchases — packaging cues + free delivery lift conversion 38%.",
    cta_label: "Launch Valentine's",
  },
  summer: {
    type: "campaign_ready",
    title: "Summer Drop — Coords & Western",
    description: "Breezy editorial pieces for warm-weather wardrobes.",
    segment_name: "Summer wardrobe refreshers",
    campaign_type: "occasion",
    channel: "email",
    occasion_key: "summer",
    filter: { personas: ["Trend Chaser", "Loyalist"] },
    template: "{{name}}, summer is in the building. A breezy 22-piece capsule, styled by our editors — peek inside.",
    sample_messages: [
      { persona: "Trend Chaser", content: "{{name}}, summer is in the building. A breezy 22-piece capsule, styled by our editors — peek inside.", reasoning: "Editorial framing resonates with Trend Chasers planning summer travel wardrobes." },
    ],
    rationale: "Summer drops have highest add-to-cart rate of the year — editorial styling cues convert browsers.",
    cta_label: "Launch Summer Drop",
  },
  college: {
    type: "campaign_ready",
    title: "Back to College — Fresh & Youthful",
    description: "Denims & western basics for the back-to-college rush.",
    segment_name: "College-bound shoppers",
    campaign_type: "occasion",
    channel: "whatsapp",
    occasion_key: "college",
    filter: { personas: ["New Shopper", "Trend Chaser"] },
    template: "{{name}} 🎒 — back-to-college edit just landed. Denims, fresh basics, ready to ship in 24h.",
    sample_messages: [
      { persona: "New Shopper", content: "{{name}} 🎒 — back-to-college edit just landed. Denims, fresh basics, ready to ship in 24h.", reasoning: "Fresh shoppers respond to fast-shipping cues during back-to-college rush." },
    ],
    rationale: "Back-to-college is the #2 acquisition window of the year — speed + value framing wins this cohort.",
    cta_label: "Launch College Edit",
  },
};
