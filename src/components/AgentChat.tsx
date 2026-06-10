import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Send, Sparkles, ArrowRight, Flame, Trophy, Crown, Calendar, Users as UsersIcon } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { askSpark, buildCampaignFromCard, type AgentCardSpec, type AgentResponse } from "@/lib/spark-agent.functions";
import { launchCampaign, processCampaignTick } from "@/lib/simulate-channel.functions";
import { supabase } from "@/integrations/supabase/client";
import { upcomingOccasions } from "@/lib/occasions";

interface UIMsg { role: "user" | "assistant"; content: string; card?: AgentCardSpec; ts: number }

const STARTERS = [
  "Run a WhatsApp flash drop for Trend Chasers in coords",
  "Who's close to hitting Icon tier?",
  "Find lapsed high-value customers and re-engage them",
  "What should I run for Diwali?",
];

export function AgentChat() {
  const [messages, setMessages] = useState<UIMsg[]>([{
    role: "assistant",
    ts: Date.now(),
    content: "I'm SPARK. I read your shoppers, write your campaigns, and tell you why each one will land. Try one of the prompts below — or describe an audience.",
    card: { type: "none" },
  }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const ask = useServerFn(askSpark);
  const build = useServerFn(buildCampaignFromCard);
  const launch = useServerFn(launchCampaign);
  const tick = useServerFn(processCampaignTick);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function gatherBrandStats() {
    const { data: customers } = await supabase.from("customers").select("persona, loyalty_tier");
    const persona_breakdown: Record<string, number> = {};
    const loyalty_breakdown: Record<string, number> = {};
    for (const c of customers ?? []) {
      const p = c.persona ?? "Unknown";
      persona_breakdown[p] = (persona_breakdown[p] ?? 0) + 1;
      const t = c.loyalty_tier ?? "Fan";
      loyalty_breakdown[t] = (loyalty_breakdown[t] ?? 0) + 1;
    }
    const { data: lastCamp } = await supabase
      .from("campaigns")
      .select("sent_count, opened_count, clicked_count")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    let last_campaign_performance = null;
    if (lastCamp && lastCamp.sent_count) {
      last_campaign_performance = {
        open_rate: +((lastCamp.opened_count ?? 0) / lastCamp.sent_count).toFixed(2),
        click_rate: +((lastCamp.clicked_count ?? 0) / lastCamp.sent_count).toFixed(2),
      };
    }
    return {
      total_customers: customers?.length ?? 0,
      persona_breakdown,
      loyalty_breakdown,
      upcoming_occasions: upcomingOccasions().slice(0, 4).map(o => ({ name: o.name, days_away: o.daysAway })),
      last_campaign_performance,
    };
  }

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const userMsg: UIMsg = { role: "user", content: text.trim(), ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);
    try {
      const brandStats = await gatherBrandStats();
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const resp = (await ask({ data: { message: text.trim(), history, brandStats } })) as AgentResponse;
      setMessages((m) => [...m, { role: "assistant", content: resp.message, card: resp.card ?? { type: "none" }, ts: Date.now() }]);
      // persist
      await supabase.from("agent_conversations").insert([
        { role: "user", content: text.trim() },
        { role: "assistant", content: resp.message, metadata: resp.card ?? null },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      toast.error(msg);
      setMessages((m) => [...m, { role: "assistant", content: msg, card: { type: "none" }, ts: Date.now() }]);
    } finally {
      setBusy(false);
    }
  }

  async function handleLaunch(card: AgentCardSpec) {
    setBusy(true);
    const id = toast.loading("Building segment & messages…");
    try {
      const { campaign_id, total } = await build({ data: { card } }) as { ok: boolean; campaign_id: string; segment_id: string; total: number };
      await launch({ data: { campaignId: campaign_id } });
      toast.success(`Campaign live — ${total} recipients`, { id });
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, colors: ["#7C3AED", "#06B6D4", "#F59E0B"] });
      // Drive the simulation
      const drive = async () => {
        for (let i = 0; i < 30; i++) {
          const r = await tick({ data: { campaignId: campaign_id } }) as { done: boolean };
          if (r.done) break;
          await new Promise(res => setTimeout(res, 1500));
        }
      };
      drive();
      setMessages((m) => [...m, { role: "assistant", ts: Date.now(), content: "Campaign launched. Watch it land in real time over in Campaigns.", card: { type: "none" } }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Launch failed", { id });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      <div className="flex-1 flex flex-col min-w-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-10 py-8 space-y-6">
          {messages.map((m, i) => (
            <MessageRow key={i} msg={m} onLaunch={handleLaunch} />
          ))}
          {busy && <TypingDots />}
          {messages.length === 1 && (
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-left px-4 py-3 surface-hover text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <span className="text-[color:var(--violet)] mr-2">›</span>{s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 md:px-10 pb-6">
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 surface px-3 py-2 focus-within:border-[color:var(--violet)] focus-within:shadow-[0_0_30px_-10px_var(--violet)] transition-all"
          >
            <Sparkles className="size-4 text-[color:var(--violet)] ml-1.5" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask SPARK — describe an audience, an occasion, or a campaign idea…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground py-2"
              disabled={busy}
            />
            <button type="submit" disabled={busy || !input.trim()}
              className="size-9 rounded-md bg-[color:var(--violet)] hover:bg-[color:var(--violet)]/90 disabled:opacity-30 grid place-items-center transition-all">
              <Send className="size-4 text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function MessageRow({ msg, onLaunch }: { msg: UIMsg; onLaunch: (c: AgentCardSpec) => void }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] surface px-4 py-2.5 text-sm">{msg.content}</div>
      </div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 max-w-3xl">
      <div className="shrink-0 size-7 rounded-md bg-gradient-to-br from-[color:var(--violet)] to-[color:var(--cyan)] grid place-items-center mt-0.5">
        <Zap className="size-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="text-[10px] mono uppercase tracking-widest text-[color:var(--violet)]">SPARK AI</div>
        <div className="text-sm leading-relaxed text-foreground/90 border-l-2 border-[color:var(--violet)]/40 pl-3">{msg.content}</div>
        {msg.card && msg.card.type !== "none" && <AgentCard card={msg.card} onLaunch={onLaunch} />}
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 size-7 rounded-md bg-gradient-to-br from-[color:var(--violet)] to-[color:var(--cyan)] grid place-items-center">
        <Zap className="size-3.5 text-white" />
      </div>
      <div className="flex items-center gap-1.5 px-3 py-3">
        {[0,1,2].map(i => (
          <motion.span key={i}
            className="size-1.5 rounded-full bg-[color:var(--violet)]"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }} />
        ))}
      </div>
    </div>
  );
}

function AgentCard({ card, onLaunch }: { card: AgentCardSpec; onLaunch: (c: AgentCardSpec) => void }) {
  const icon = {
    flash_drop: <Flame className="size-3.5" />,
    challenge: <Sparkles className="size-3.5" />,
    contest: <Trophy className="size-3.5" />,
    loyalty: <Crown className="size-3.5" />,
    occasion: <Calendar className="size-3.5" />,
    standard: <UsersIcon className="size-3.5" />,
  }[card.campaign_type ?? "standard"] ?? <Sparkles className="size-3.5" />;

  const accent = card.campaign_type === "flash_drop" ? "var(--rose)"
    : card.campaign_type === "contest" ? "var(--gold)"
    : card.campaign_type === "loyalty" ? "var(--emerald)"
    : card.campaign_type === "challenge" ? "var(--cyan)"
    : "var(--violet)";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="surface p-5 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] mono uppercase tracking-wider border" style={{ color: accent, background: `color-mix(in oklab, ${accent} 10%, transparent)`, borderColor: `color-mix(in oklab, ${accent} 30%, transparent)` }}>
            {icon}
            {(card.campaign_type ?? card.type).replace(/_/g, " ")}
          </span>
          {card.segment_name && <span className="text-xs text-muted-foreground">{card.segment_name}</span>}
        </div>
        {card.channel && <span className="text-[10px] mono uppercase text-muted-foreground">{card.channel}</span>}
      </div>

      {card.title && <div className="text-base font-semibold tracking-tight">{card.title}</div>}
      {card.description && <div className="text-sm text-muted-foreground">{card.description}</div>}

      {card.sample_messages && card.sample_messages.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground">Sample copy per persona</div>
          {card.sample_messages.slice(0, 3).map((s, i) => (
            <div key={i} className="rounded-md bg-white/[0.02] border border-white/[0.04] p-3 space-y-1.5">
              <div className="text-[10px] mono uppercase tracking-wider" style={{ color: accent }}>{s.persona}</div>
              <div className="text-sm leading-relaxed">{s.content}</div>
              <div className="text-[11px] text-muted-foreground italic">› {s.reasoning}</div>
            </div>
          ))}
        </div>
      )}

      {card.rationale && (
        <div className="text-xs text-muted-foreground border-l-2 pl-3" style={{ borderColor: accent }}>
          <span className="mono uppercase text-[10px] tracking-wider mr-1.5" style={{ color: accent }}>Why</span>
          {card.rationale}
        </div>
      )}

      {card.type === "campaign_ready" || card.type === "viral_campaign" || card.type === "occasion_alert" || card.type === "loyalty_milestone" ? (
        <button onClick={() => onLaunch(card)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-white transition-all" style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in oklab, ${accent} 60%, var(--violet)))` }}>
          {card.cta_label ?? "🚀 Launch Campaign"} <ArrowRight className="size-4" />
        </button>
      ) : null}
    </motion.div>
  );
}

export { AnimatePresence };
