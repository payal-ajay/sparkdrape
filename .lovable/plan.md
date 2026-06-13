This is a large body of work. I'll execute in phases, each verified before moving on. Nothing here changes the sidebar, landing page, routing, or visual design system — only additions and bug fixes.

## Phase 1 — Critical bugs (ship first)

**Bug 1: Analytics empty charts**
- Refactor `src/routes/analytics.tsx`:
  - Wrap every fetch in try/catch with `console.error`.
  - Persona Distribution: always computed from `customers` (already 300 seeded) — verify grouping logic.
  - Channel Open-Rate: query `messages` joined with `campaigns`, compute open_rate per channel, color bars (#10B981 / #06B6D4 / #F59E0B), show % labels.
  - Campaign Type Effectiveness: grouped bar (open_rate violet, click_rate cyan) per `campaign_type`, with legend.
  - Empty state component: centered SVG + "X will appear after your first campaign" + subtext, reused for every chart whose data is empty/all-zero.
  - Add Health Score Distribution chart (horizontal stacked bar: At Risk / Needs Attention / Healthy / Champion).

**Bug 2: Campaigns page not updating**
- `src/lib/spark-agent.functions.ts` already inserts segment/campaign/messages — verify and ensure it also calls `simulate-channel` and returns `campaign_id`.
- `src/routes/campaigns.tsx`: add Supabase Realtime subscription on `campaigns` table + manual refresh button (spinner while loading).
- Enable realtime via migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;`
- Campaign Ready Card in chat: after launch, show "✓ Campaign launched! View in Campaigns →" link to `/dashboard/campaigns`.

**Bug 3: Agent chat history disappears**
- `src/components/AgentChat.tsx`:
  - On mount: load last 50 rows from `agent_conversations` ordered by `created_at` asc.
  - On every user/agent message: insert row with `{ role, content, metadata }` where metadata holds card spec.
  - "Clear history" ghost button top-right → confirm dialog → DELETE all rows + reset state.
  - Re-render rich cards from `metadata` on history load. Completed campaigns show "✓ Launched" instead of Launch button.
  - Toast "Conversation restored (X messages)" on load, auto-dismiss 2s.

**Small fixes**
- One-time toast "300 DRAPE shoppers are ready…" (localStorage flag).
- `simulate-channel` function: add `console.log('Simulate channel called for campaign:', campaign_id)` at top.

## Phase 2 — Schema additions (single migration)

```sql
ALTER TABLE customers ADD COLUMN health_score integer DEFAULT 0;
ALTER TABLE messages  ADD COLUMN variant text DEFAULT 'A';
ALTER TABLE campaigns ADD COLUMN ab_test_enabled boolean DEFAULT false;
ALTER TABLE campaigns ADD COLUMN variant_a_description text;
ALTER TABLE campaigns ADD COLUMN variant_b_description text;
ALTER TABLE campaigns ADD COLUMN winner_variant text;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- Backfill health_score using the weighted formula
UPDATE customers SET health_score = <weighted-sum-expression>;
```

## Phase 3 — Feature 6: "Why this message" explainer (highest priority)
- Agent already stores `persona_reasoning` — strengthen the prompt template to follow the exact "[Name] is a [Persona] — [reason]. Message uses [tone] because [logic]. Channel: [channel] ([reason])." format.
- Campaign detail slide-over (`campaigns.tsx`): each message row gets a chevron expander revealing the violet-tinted reasoning card + monospace content block.
- Agent chat sample message previews: ⓘ icon with hover tooltip showing reasoning.

## Phase 4 — Feature 2: Campaign ROI Estimator
- Compute in `spark-agent.functions.ts` when returning a `campaign_ready`/`segment_preview` card. Add `roi` field on `AgentCardSpec`:
  - rates by type (Standard 0.44/0.20, Flash 0.65/0.35, Occasion 0.55/0.25, Loyalty 0.70/0.30)
  - fetch avg_order_value from matched customers
  - return recipients, expected_opens, expected_clicks, est_revenue, roi_multiplier
- Render `ROIEstimatorCard` in chat above Launch button — 2×2 grid, CountUp animation, disclaimer.

## Phase 5 — Feature 3: Occasion Countdown Banner
- `src/components/OccasionBanner.tsx`: compute next occasion from list, render only on `/dashboard` (Agent) and `/dashboard/campaigns`. Mount inside `AppShell` (gated by route check). Slide-down animation, pulsing dot if ≤7 days, dismiss-for-session, "Build Campaign →" prefills agent input.

## Phase 6 — Feature 4: Customer Health Score
- Ring SVG in `audience.tsx` table; default sort desc.
- Customer slide-over: large 64px ring + label + 5 component breakdown bars + plain-English explanation.
- Agent recognizes "at-risk" / "champions" / "needs attention" → filter by health_score range (extend agent system prompt + filter handler in `buildCampaignFromCard`).

## Phase 7 — Feature 1: A/B Testing
- Agent enables A/B when standard campaign with >20 recipients; returns `variant_a` and `variant_b` sample messages.
- Campaign Ready Card renders two side-by-side variant cards (violet / cyan tints).
- `simulate-channel`: assign A/B 50/50, apply rate modifiers (B opens ×1.15, clicks ×0.90), compute winner, store `winner_variant`.
- Campaign detail slide-over: A | B columns at top, "🏆 Variant X Won" badge, per-message A/B badges.

## Phase 8 — Feature 5: Campaign Replay
- `src/components/CampaignReplay.tsx`: dark modal, 640px, fetches all messages, compresses timeline to 10s, animates feed with status pops, live counters, progress bar, confetti burst (`canvas-confetti`) on completion, "Run Similar Campaign →" prefills agent.
- "▶ Replay" button on completed campaign cards + slide-over header.

## Verification at each phase
- Build check (auto), `code--read_console_logs error`, `supabase--read_query` to confirm rows insert, click through preview for Realtime + chat persistence + ROI card render.

## Files touched (additions, no deletions)
- Edit: `src/routes/analytics.tsx`, `src/routes/campaigns.tsx`, `src/routes/audience.tsx`, `src/components/AgentChat.tsx`, `src/components/AppShell.tsx`, `src/lib/spark-agent.functions.ts`, `src/lib/simulate-channel.functions.ts`
- New: `src/components/OccasionBanner.tsx`, `src/components/ROIEstimatorCard.tsx`, `src/components/HealthRing.tsx`, `src/components/CampaignReplay.tsx`, `src/components/EmptyChart.tsx`, `src/components/WhyMessage.tsx`, `src/lib/health-score.ts`, `src/lib/occasions.ts` (extend)
- Migration: schema additions + realtime publication + health_score backfill
- Install: `canvas-confetti`

Want me to proceed with all 8 phases sequentially, or trim/reorder?