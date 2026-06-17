# SPARK by DRAPE

> AI-powered campaign intelligence platform for premium Indian D2C fashion brands.
> Built as a full-stack TanStack Start app with an LLM-driven marketing agent on top of a Supabase backend.

---

## 1. What it does (the elevator pitch)

DRAPE is a fictional premium Indian fashion label. **SPARK** is its in-house marketing CRM that lets the brand:

1. Understand its shoppers through **personas**, **loyalty tiers**, and a **Customer Health Score**.
2. Talk to a built-in **AI agent** in plain English ("re-engage my lapsed high-value shoppers") and get back a ready-to-launch campaign — segment, message copy, channel, and an ROI estimate.
3. **Launch** the campaign and watch it play out in real time: queued → sent → delivered → opened → clicked, with A/B variants, a replay timeline, and persona-level reasoning behind every message.

It's a demo-grade product, so the channel send (WhatsApp/Email/SMS) is simulated server-side instead of hitting real providers — but the lifecycle, data model, and UX are real.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | **TanStack Start v1** (React 19 + Vite 7, SSR + server functions) |
| Routing | **TanStack Router** — file-based routes under `src/routes/` |
| Data fetching | **TanStack Query** + Supabase realtime subscriptions |
| Backend / DB | **Supabase** (Postgres, RLS, Realtime) — wired in as "Lovable Cloud" |
| AI | **Lovable AI Gateway** (LLM) for the SPARK agent |
| Styling | **Tailwind CSS v4** + custom design tokens in `src/styles.css` |
| UI primitives | shadcn/ui (Radix) + lucide-react icons |
| Animation | **Framer Motion** (`motion`) and `canvas-confetti` |
| Charts | **Recharts** |
| Validation | **Zod** |
| Runtime | Edge / Cloudflare Workers |

---

## 3. High-level architecture

```text
                ┌───────────────────────────────────────────────┐
                │              Browser (React 19)              │
                │  routes/* ── components/* ── hooks/*         │
                └───────────┬────────────────────┬──────────────┘
                            │ supabase-js        │ useServerFn()
                            │ (publishable key)  │  (typed RPC)
                            ▼                    ▼
            ┌──────────────────────┐   ┌──────────────────────────┐
            │  Supabase Postgres   │   │   TanStack Server Funcs  │
            │  ─ customers         │   │   src/lib/*.functions.ts │
            │  ─ orders            │◀──┤   ─ seedDemoData         │
            │  ─ segments          │   │   ─ askSpark   (LLM)     │
            │  ─ campaigns         │   │   ─ buildCampaignFromCard│
            │  ─ messages          │   │   ─ launchCampaign       │
            │  ─ loyalty_events    │   │   ─ processCampaignTick  │
            │  ─ agent_conv…       │   └──────────┬───────────────┘
            └──────────┬───────────┘              │ uses supabaseAdmin
                       │ Realtime (WS)            ▼
                       └────────────────► Lovable AI Gateway (LLM)
```

**Two Supabase clients** are used deliberately:

- `src/integrations/supabase/client.ts` — browser, publishable key, RLS enforced. Used for reads and realtime subscriptions on every page.
- `src/integrations/supabase/client.server.ts` (`supabaseAdmin`) — service-role key, **bypasses RLS**, only imported inside server function `handler()` bodies. Used for writes, seeding, and the simulation tick.

**Server functions** (`createServerFn` from `@tanstack/react-start`) are the only place secrets and admin writes live. The client calls them via `useServerFn(fn)` and gets typed RPC.

---

## 4. Folder layout

```text
src/
  routes/                    # File-based routing (one file = one URL)
    __root.tsx               # HTML shell, providers, fonts, head meta
    index.tsx                # / (entry, redirects into the app)
    dashboard.tsx            # /dashboard – Agent chat
    campaigns.tsx            # /campaigns – live campaign grid
    audience.tsx             # /audience – customers + segments tabs
    loyalty.tsx              # /loyalty – tier ladder + occasion presets
    analytics.tsx            # /analytics – charts
    settings.tsx             # /settings – seed data button etc.

  components/                # Presentational + interactive UI
    AppShell.tsx             # Sidebar + topbar wrapper
    AgentChat.tsx            # Chat UI + card renderer
    SuggestedCampaigns.tsx   # Ready-to-launch suggestions
    CampaignReplay.tsx       # 10-sec compressed lifecycle replay
    HealthRing.tsx           # Customer health donut + breakdown
    ROIEstimatorCard.tsx     # Animated ROI projection
    OccasionBanner.tsx       # Countdown to next Indian fashion event
    ui/*                     # shadcn primitives
    ui-bits.tsx              # Project-specific small bits

  lib/
    spark-agent.functions.ts # askSpark + buildCampaignFromCard (server)
    simulate-channel.functions.ts # launchCampaign + processCampaignTick
    seed-data.functions.ts   # 300-shopper seed + health score
    preset-campaigns.ts      # Suggested + occasion presets (data-tuned)
    personas.ts              # Persona metadata, INR formatter
    occasions.ts             # Indian fashion calendar (Diwali, EOSS…)
    ai-gateway.server.ts     # Thin wrapper around the AI gateway

  hooks/
    use-campaign-launcher.ts # Build → Launch → start ticking helper

  integrations/supabase/     # Auto-generated clients + types (don't edit)
  styles.css                 # Tailwind v4 + design tokens
  router.tsx                 # Router bootstrap (QueryClient in context)
```

---

## 5. Data model

Seven Postgres tables in the `public` schema. RLS is on for all of them; the admin client is what writes during seeding and simulation.

| Table | Purpose | Key columns |
|---|---|---|
| `customers` | The shopper. One row per person. | `persona`, `preferred_channel`, `loyalty_tier`, `loyalty_points`, `total_spent`, `order_count`, `days_since_last_order`, `health_score`, `try_on_items[]`, `last_review_rating` |
| `orders` | Transaction history feeding RFM. | `customer_id`, `order_date`, `amount`, `category`, `on_sale` |
| `segments` | A saved audience definition. | `name`, `filter_logic` (JSON), `customer_count`, `created_by` (`ai`/`manual`) |
| `campaigns` | A send to a segment. | `segment_id`, `channel`, `status` (`draft`/`live`/`completed`), `campaign_type`, `total_recipients`, funnel counts (`sent_count`, `delivered_count`, `opened_count`, `clicked_count`, `failed_count`), `ab_test_enabled`, `winner_variant` |
| `messages` | One personalized message per recipient. | `campaign_id`, `customer_id`, `personalized_content`, `persona_reasoning`, `variant` (A/B), `status`, lifecycle timestamps |
| `loyalty_events` | Points earned (purchase, review, referral). | `customer_id`, `event_type`, `points_earned` |
| `agent_conversations` | Persisted SPARK chat history. | `messages` (JSON) |

```text
customers ─< orders
customers ─< loyalty_events
customers ─< messages >─ campaigns >─ segments
```

---

## 6. Key workflows

### 6.1 Seed data — `seedDemoData` (`src/lib/seed-data.functions.ts`)

One button in `/settings` seeds the whole demo in seconds.

1. Wipes the 6 tables in FK-safe order.
2. Generates **300 customers** across 5 personas — Trend Chaser (80), Discount Hunter (70), Loyalist (60), Lapsed High-Value (50), New Shopper (40). Each persona has its own age range, preferred channel, discount sensitivity, and loyalty point distribution.
3. Generates 1–12 orders per customer depending on persona.
4. **Aggregates orders in memory** (one Map pass) then **batches updates 25 in parallel** to write back `total_spent`, `order_count`, `days_since_last_order`, `avg_order_value`, and the health score.
5. Sprinkles in loyalty events.

Why the aggregation + parallel batch? Before, the function did 600 sequential round-trips and timed out. After, it finishes in a couple of seconds.

### 6.2 Customer Health Score

Computed during seed (and re-computed if you reseed). It's a **0–100 RFM + engagement** score:

| Component | Max | Rule |
|---|---|---|
| **Recency** | 30 | 30 if ≤30 days, 20 if ≤60, 10 if ≤90, else 0 |
| **Frequency** | 25 | Tiered by order count (1 → 5 … >10 → 25) |
| **Monetary** | 25 | Tiered by lifetime spend (<2k → 5 … >20k → 25) |
| **Loyalty** | 10 | Icon 10 / Muse 6 / Fan 2 |
| **Engagement** | 10 | +5 if last review ≥4★, +3 if try-on items, +2 if referrals |

Rendered as a `HealthRing` (donut) in the audience table and as a 5-bar breakdown + plain-English explanation in the customer slide-over. The agent can also filter on it ("show me at-risk shoppers" → `max_health_score: 30`).

### 6.3 Agent chat → campaign launch — the core flow

This is the headline feature. Files: `AgentChat.tsx`, `spark-agent.functions.ts`, `simulate-channel.functions.ts`, `use-campaign-launcher.ts`.

```text
User types in chat        ┌─────────────────────────────────────────────┐
   │                      │  askSpark (server fn)                       │
   ▼                      │   1. Builds system prompt + brand stats     │
┌──────────────┐          │   2. Calls Lovable AI gateway (JSON mode)   │
│  AgentChat   │──msg────▶│   3. LLM returns { message, card }          │
│              │          │   4. Resolves segment via SQL filters       │
│              │◀─card────│   5. Computes ROI from real customer rows   │
└──────┬───────┘          └─────────────────────────────────────────────┘
       │ user clicks "Launch"
       ▼
┌──────────────────────┐  buildCampaignFromCard
│ use-campaign-launcher│─▶  inserts segment + campaign + N messages
└──────┬───────────────┘    (variant A/B split if A/B is enabled)
       ▼
┌──────────────────────┐  launchCampaign → status = 'live'
│  Campaign goes live  │
└──────┬───────────────┘
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  processCampaignTick runs every 2.5s (from /campaigns or chat)       │
│   queued → sent → delivered (85%) / failed (15%)                     │
│   delivered → opened  (rate depends on campaign_type, A/B boost)    │
│   opened   → clicked  (with A/B penalty for variant B)              │
│   when no message is still moving → status = 'completed'             │
│   + auto-computes A/B winner by engagement rate                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Why the LLM returns a card, not just text.** The agent prompt forces it to emit a strict JSON object with a `card` describing `filter`, `channel`, `campaign_type`, `template`, and `sample_messages` with per-persona reasoning. That JSON is the contract the rest of the app builds on — segments, campaigns, ROI cards, A/B variants and replays are all driven from it.

**Progressive segment relaxation.** If the LLM over-constrains the filter (very common when it stacks health + category + spend), `resolveSegment` peels off the narrowest criteria until the segment is non-empty. This fixed the "no customers match" bug where exact matches existed but the stack of filters was too narrow.

**ROI estimator** is computed server-side from real rows — `recipients × open_rate × click_rate × 0.3 conversion × avg_order_value` — so the numbers in the chat card reflect *your* seeded data, not a guess.

### 6.4 A/B testing

When the LLM creates a `standard` campaign with >20 recipients, it returns `variant_a` (discount-forward) and `variant_b` (story-forward). `buildCampaignFromCard` splits the recipients 50/50 by index. During simulation:

- **Variant B** gets a **1.15× open-rate boost** (story copy gets more eyeballs).
- **Variant B** gets a **0.9× click-rate penalty** (discount copy converts harder).

When all messages have settled, the winner is the variant with the higher *engaged ÷ sent* ratio, written to `campaigns.winner_variant`. The campaign slide-over renders side-by-side variant cards with live counts.

### 6.5 Live dashboard (`/campaigns`)

- Loads all campaigns sorted by `created_at`.
- Subscribes to `postgres_changes` on the `campaigns` table for live updates.
- For any campaign whose status is `live`, the page itself calls `processCampaignTick` every 2.5s in case the originating tab is closed (so simulations always finish).
- Funnel bar = a single horizontal stack of `sent / delivered / opened / clicked` proportions.
- Click a card → slide-over with per-message feed (also realtime, filtered to that campaign_id), persona reasoning, and A/B results.
- Completed campaigns get a **Replay** button that opens a 10-second compressed playback of the lifecycle with confetti at the end.

### 6.6 Loyalty engine (`/loyalty`)

- Aggregates tier counts (Fan / Muse / Icon) from `customers`.
- Highlights "close-to-Icon" shoppers (4000–4999 points).
- Shows the **upcoming Indian fashion calendar** (Diwali, EOSS, Wedding season, Valentine, Summer, Back-to-College) — every card has a preset in `preset-campaigns.ts` matching the seeded persona mix, so they all launch end-to-end with one click via `useCampaignLauncher`.

### 6.7 Suggested Campaigns

On the agent page, three pinned cards (`SuggestedCampaigns.tsx`) are pre-tuned to the actual seed distribution so the user can launch a meaningful campaign without typing anything:

1. **Flash Drop: Coords Capsule** → Trend Chasers
2. **Re-engage Lapsed High-Value** → win-back email
3. **Icon Tier Stylist Concierge** → top-12% loyalists

Each one goes through the exact same `build → launch → tick` pipeline as an LLM-generated campaign.

---

## 7. Notable implementation details

- **No `useEffect + fetch` for first paint** where it can be avoided — we use TanStack Query through the router context (`QueryClient` provided in `router.tsx`). For realtime-heavy pages (`/campaigns`), we still use `supabase.channel(...)` + `setState` because the data churns multiple times a second.
- **All write paths funnel through server functions.** The browser never holds the service-role key, and `supabaseAdmin` is imported lazily inside `.handler()` bodies so it's stripped from the client bundle.
- **Design tokens, not raw colors.** Every accent color (`--violet`, `--cyan`, `--amber`, `--emerald`, `--rose`, `--gold`) is defined as a CSS variable in `styles.css` and referenced via `color-mix()` so the whole palette is themable.
- **Persona reasoning is generated, not stored as a string.** `buildCampaignFromCard` composes the per-recipient reasoning at insert time, mixing LLM-supplied persona logic with channel rationale, so the "Why this message?" expander in the slide-over has real context per shopper.

---

## 8. Running it

```bash
bun install
bun run dev       # http://localhost:5173
```

The Lovable platform manages Supabase URL/key and the `LOVABLE_API_KEY` for the AI gateway — they are set as environment secrets, not committed.

First-time setup in the UI:

1. Open **Settings** → click **Seed demo data** (creates 300 shoppers, their orders, and health scores).
2. Go to **Agent** → try *"Re-engage lapsed high-value customers"* or click a Suggested Campaign.
3. Hit **Launch** → switch to **Campaigns** to watch the funnel fill live.

---

## 9. Talking points for an interview

- **Why TanStack Start?** SSR + typed server functions + file-based routing in one Vite app, deployable to Cloudflare Workers. No separate API server, no `pages/api` ceremony.
- **Why split the Supabase client into browser + admin?** Security boundary. RLS protects reads from the browser; admin writes only ever happen inside server-function handler bodies, which are stripped from the client bundle.
- **Why simulate the channel server-side?** The product is a CRM, not a messaging gateway. The simulation gives us a deterministic, realistic lifecycle (with rates per campaign type and A/B modifiers) that demoes the entire funnel in seconds without paying for WhatsApp/Email sends.
- **Why a structured JSON contract for the LLM?** Free-text responses can't drive UI. Forcing the model to emit a typed `card` lets us validate, compute ROI, persist segments, and render rich cards — and the model can still chat in `message` alongside it.
- **Why an RFM-based health score (vs. ML)?** Interpretable, debuggable, instant to compute, and the breakdown bars in the slide-over literally show the merchant *why* a shopper is at risk — which is what they need to act on.
