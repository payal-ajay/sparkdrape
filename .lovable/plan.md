## Plan: Write a Technical Interview README for SPARK by DRAPE

### Goal
Create a single `README.md` at the project root that explains the full architecture, tech stack, data model, and end-to-end workflows in plain, interview-ready language.

### What the README will cover

1. **Project Overview** — What SPARK by DRAPE is (AI-powered CRM / campaign intelligence platform for Indian D2C fashion), the problem it solves, and who uses it.

2. **Tech Stack** — TanStack Start (React 19 + Vite 7 + SSR), TypeScript, Tailwind CSS v4, Supabase (Postgres + Realtime), TanStack Query, Recharts, Framer Motion, Zod.

3. **Architecture** — File-based routing via TanStack Router, server functions (`createServerFn`) for backend RPC, Supabase client (browser + admin server), realtime subscriptions for live campaign dashboards.

4. **Data Model** — 7 core tables with relationships:
   - `customers` (persona, loyalty tier, health score, RFM-derived)
   - `orders` (transaction history)
   - `segments` (AI-generated or manual audience filters)
   - `campaigns` (status lifecycle: draft → live → completed)
   - `messages` (per-customer personalized messages with status funnel)
   - `loyalty_events` (points/ tier actions)
   - `agent_conversations` (chat history with the SPARK AI agent)

5. **Key Workflows** (with data flow):
   - **Seed Data** — 300 synthetic Indian shoppers across 5 personas, auto-computed health scores via RFM + engagement.
   - **Agent Chat → Campaign Launch** — User describes a campaign in natural language → LLM (via `spark-agent.functions.ts`) returns a structured card with segment filter, template, ROI estimate, and optional A/B variants → server resolves the segment, creates the campaign, queues personalized messages.
   - **Campaign Simulation** — `processCampaignTick` server fn advances messages through queued → sent → delivered → opened → clicked (or failed), with type-based base rates and A/B variant modifiers.
   - **Live Dashboard** — Frontend subscribes to Postgres changes; campaign cards show real-time funnel bars; slide-overs show per-message status + "Why This Message" reasoning.
   - **A/B Testing** — 50/50 split, 1.15× open boost for variant B, 0.9× click penalty; winner auto-computed on completion.
   - **Loyalty Engine** — Tier ladder (Fan → Muse → Icon), occasion-aware preset campaigns (EOSS, Festive, Wedding, etc.), one-click launch from the loyalty page.
   - **Customer Health Score** — 100-point RFM-derived score (Recency 30 + Frequency 25 + Monetary 25 + Loyalty 10 + Engagement 10), rendered as a ring with breakdown bars in the audience table and customer slide-over.

6. **Notable Features** — Campaign Replay (10s compressed timeline), Occasion Countdown Banner, Suggested Campaigns tuned to seed data, ROI Estimator with animated counters.

### Deliverable
One `README.md` file at project root, cleanly structured with headings, bullet points, and a workflow diagram in ASCII. No code changes to existing functionality.