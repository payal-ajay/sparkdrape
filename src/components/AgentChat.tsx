import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Send, Sparkles, ArrowRight, Flame, Trophy, Crown, Calendar, Users as UsersIcon, Trash2, Info, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { askSpark, buildCampaignFromCard, type AgentCardSpec, type AgentResponse } from "@/lib/spark-agent.functions";
import { launchCampaign, processCampaignTick } from "@/lib/simulate-channel.functions";
import { supabase } from "@/integrations/supabase/client";
import { upcomingOccasions } from "@/lib/occasions";
import { ROIEstimatorCard } from "@/components/ROIEstimatorCard";

interface UIMsg {
  id?: string;
  role: "user" | "assistant";
  content: string;
  card?: AgentCardSpec;
  ts: number;
}

const STARTERS = [
  "Run a WhatsApp flash drop for Trend Chasers in coords",
  "Who's close to hitting Icon tier?",
  "Find lapsed high-value customers and re-engage them",
  "Show me at-risk customers",
];

const WELCOME: UIMsg = {
  role: "assistant",
  ts: 0,
  content: "I'm SPARK. I read your shoppers, write your campaigns, and tell you why each one will land. Try one of the prompts below — or describe an audience.",
  card: { type: "none" },
};

export function AgentChat() {
  const [messages, setMessages] = useState<UIMsg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const ask = useServerFn(askSpark);
  const build = useServerFn(buildCampaignFromCard);
  const launch = useServerFn(launchCampaign);
  const tick = useServerFn(processCampaignTick);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  // Load history once
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    (async () => {
      const { data, error } = await supabase
        .from("agent_conversations")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50);
      if (error) {
        console.error("[agent] history load failed", error);
        return;
      }
      if (!data || data.length === 0) {
        // One-time onboarding toast
        if (!localStorage.getItem("spark-seeded-toast")) {
          toast("300 DRAPE shoppers are ready. Ask SPARK to build your first campaign.", { icon: "✨", duration: 5000 });
          localStorage.setItem("spark-seeded-toast", "1");
        }
        return;
      }
      const restored: UIMsg[] = data.map((row) => {
        const raw = row.metadata as unknown;
        const meta = (raw && typeof raw === "object") ? (raw as { card?: AgentCardSpec } & Partial<AgentCardSpec>) : null;
        const card: AgentCardSpec = meta?.card ?? (meta && (meta as Partial<AgentCardSpec>).type ? (meta as AgentCardSpec) : { type: "none" });
        return {
          id: row.id,
          role: row.role as "user" | "assistant",
          content: row.content,
          card,
          ts: new Date(row.created_at ?? Date.now()).getTime(),
        };
      });
      setMessages([WELCOME, ...restored]);
      toast.success(`Conversation restored (${restored.length} messages)`, { duration: 2000 });
    })();
  }, []);

  // Prefill from OccasionBanner
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) {
        setInput(detail);
        setTimeout(() => send(detail), 50);
      }
    };
    window.addEventListener("spark-prefill", handler);
    const pre = sessionStorage.getItem("spark-prefill");
    if (pre) {
      sessionStorage.removeItem("spark-prefill");
      setInput(pre);
      setTimeout(() => send(pre), 200);
    }
    return () => window.removeEventListener("spark-prefill", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      upcoming_occasions: upcomingOccasions().slice(0, 4).map((o) => ({ name: o.name, days_away: o.daysAway })),
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
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const resp = (await ask({ data: { message: text.trim(), history, brandStats } })) as AgentResponse;
      const card = resp.card ?? { type: "none" };
      setMessages((m) => [...m, { role: "assistant", content: resp.message, card, ts: Date.now() }]);
      await supabase.from("agent_conversations").insert([
        { role: "user", content: text.trim(), metadata: null },
        { role: "assistant", content: resp.message, metadata: { card } as never },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      toast.error(msg);
      setMessages((m) => [...m, { role: "assistant", content: msg, card: { type: "none" }, ts: Date.now() }]);
    } finally {
      setBusy(false);
    }
  }

  async function handleLaunch(card: AgentCardSpec, idx: number) {
    setBusy(true);
    const id = toast.loading("Building segment & messages…");
    try {
      const { campaign_id, total } = (await build({ data: { card } })) as { ok: boolean; campaign_id: string; segment_id: string; total: number };
      await launch({ data: { campaignId: campaign_id } });
      toast.success(`Campaign live — ${total} recipients`, { id });
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, colors: ["#7C3AED", "#06B6D4", "#F59E0B"] });
      // Update card to launched state in local + persist metadata change as new message
      setMessages((m) => {
        const next = [...m];
        if (next[idx]) {
          next[idx] = { ...next[idx], card: { ...(next[idx].card ?? {}), launched_campaign_id: campaign_id } as AgentCardSpec };
        }
        return next;
      });
      const drive = async () => {
        for (let i = 0; i < 30; i++) {
          const r = (await tick({ data: { campaignId: campaign_id } })) as { done: boolean };
          if (r.done) break;
          await new Promise((res) => setTimeout(res, 1500));
        }
      };
      drive();
      const launchedMsg: UIMsg = {
        role: "assistant",
        ts: Date.now(),
        content: "Campaign launched. Watch it land in real time over in Campaigns.",
        card: { type: "none", launched_campaign_id: campaign_id },
      };
      setMessages((m) => [...m, launchedMsg]);
      await supabase.from("agent_conversations").insert([
        { role: "assistant", content: launchedMsg.content, metadata: { card: launchedMsg.card } as never },
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Launch failed", { id });
    } finally {
      setBusy(false);
    }
  }

  async function clearHistory() {
    setShowClear(false);
    await supabase.from("agent_conversations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setMessages([WELCOME]);
    toast.success("Chat history cleared");
  }

  return (
    <div className="h-[calc(100vh-4rem-44px)] flex flex-col">
      <div className="flex items-center justify-end px-8 md:px-14 pt-4">
        <button
          onClick={() => setShowClear(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-[#6B7280] hover:bg-[#F4F4F0] transition"
        >
          <Trash2 className="size-3.5" /> Clear history
        </button>
      </div>
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 md:px-14 py-6 space-y-8">
            {messages.length === 1 && (
              <div className="text-center text-sm text-[#9CA3AF] py-4">Start a new conversation with SPARK AI</div>
            )}
            {messages.map((m, i) => (
              <MessageRow key={m.id ?? i} msg={m} onLaunch={(c) => handleLaunch(c, i)} />
            ))}
            {busy && <TypingDots />}
            {messages.length === 1 && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left px-4 py-3 rounded-xl bg-white border border-[color:var(--surface-2)] text-sm text-[color:var(--ink)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_rgba(17,17,24,0.18)] transition-all"
                  >
                    <span className="text-[color:var(--violet)] mr-2">›</span>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-8 md:px-14 pb-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-3xl px-4 py-2 focus-within:border-[#7C3AED]/50 transition-all"
            >
              <Sparkles className="size-4 text-[#7C3AED] ml-1.5" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask SPARK — describe an audience, an occasion, or a campaign idea…"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#9CA3AF] py-2 text-[#111118]"
                disabled={busy}
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="h-9 px-4 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-30 flex items-center gap-1.5 transition-all"
              >
                <Send className="size-3.5 text-white" />
                <span className="text-xs font-medium text-white">Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {showClear && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={() => setShowClear(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4 border border-[#E5E7EB]" onClick={(e) => e.stopPropagation()}>
            <div className="font-semibold">Clear conversation history?</div>
            <div className="text-sm text-[#6B7280]">This cannot be undone.</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowClear(false)} className="px-3 py-1.5 rounded-md text-sm hover:bg-[#F4F4F0]">Cancel</button>
              <button onClick={clearHistory} className="px-3 py-1.5 rounded-md text-sm bg-[#F43F5E] text-white hover:brightness-110">Clear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageRow({ msg, onLaunch }: { msg: UIMsg; onLaunch: (c: AgentCardSpec) => void }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm bg-white border border-[#E5E7EB] text-[#111118]">{msg.content}</div>
      </div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 max-w-3xl">
      <div className="shrink-0 size-8 rounded-xl bg-[color:var(--ink)] grid place-items-center mt-0.5">
        <Zap className="size-4 text-white" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0 space-y-3 bg-white border-l-[3px] border-[#7C3AED] rounded-r-2xl border-y border-r border-y-[#E5E7EB] border-r-[#E5E7EB] px-5 py-4">
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium text-white" style={{ background: "#7C3AED", letterSpacing: "0.05em" }}>SPARK AI</span>
        <div className="text-[14px] leading-relaxed text-[#374151]">{msg.content}</div>
        {msg.card && msg.card.type !== "none" && <AgentCard card={msg.card} onLaunch={onLaunch} />}
        {msg.card?.launched_campaign_id && (
          <Link to="/campaigns" className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#10B981" }}>
            <CheckCircle2 className="size-3.5" /> Campaign launched! View it in Campaigns →
          </Link>
        )}
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 size-8 rounded-xl bg-[color:var(--ink)] grid place-items-center">
        <Zap className="size-4 text-white" strokeWidth={2} />
      </div>
      <div className="flex items-center gap-1.5 px-3 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-[color:var(--ink)]/60"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </div>
  );
}

const TYPE_THEME: Record<string, { tint: string; accent: string; label: string }> = {
  flash_drop:      { tint: "var(--tint-rose)",     accent: "var(--rose)",    label: "Flash Drop" },
  challenge:       { tint: "var(--tint-cyan)",     accent: "var(--cyan)",    label: "Style Challenge" },
  contest:         { tint: "var(--tint-amber)",    accent: "var(--gold)",    label: "Contest" },
  loyalty:         { tint: "var(--tint-emerald)",  accent: "var(--emerald)", label: "Loyalty" },
  occasion:        { tint: "var(--tint-amber)",    accent: "var(--amber)",   label: "Occasion" },
  standard:        { tint: "var(--tint-lavender)", accent: "var(--violet)",  label: "Standard" },
  "re-engagement": { tint: "var(--tint-pink)",     accent: "var(--rose)",    label: "Re-engagement" },
};

function AgentCard({ card, onLaunch }: { card: AgentCardSpec; onLaunch: (c: AgentCardSpec) => void }) {
  const iconMap: Record<string, React.ReactNode> = {
    flash_drop: <Flame className="size-3.5" />,
    challenge: <Sparkles className="size-3.5" />,
    contest: <Trophy className="size-3.5" />,
    loyalty: <Crown className="size-3.5" />,
    occasion: <Calendar className="size-3.5" />,
    standard: <UsersIcon className="size-3.5" />,
    "re-engagement": <UsersIcon className="size-3.5" />,
  };
  const ct = card.campaign_type ?? "standard";
  const icon = iconMap[ct] ?? <Sparkles className="size-3.5" />;
  const theme = TYPE_THEME[ct] ?? TYPE_THEME.standard;
  const launched = !!card.launched_campaign_id;

  const isDarkHero = card.type === "occasion_alert" || card.type === "viral_campaign" || card.type === "loyalty_milestone";

  if (isDarkHero) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="dark-card p-6 space-y-4 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 size-40 rounded-full" style={{ background: `color-mix(in oklab, ${theme.accent} 40%, transparent)`, filter: "blur(40px)" }} />
        <div className="relative flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] mono uppercase tracking-wider text-white" style={{ background: `color-mix(in oklab, ${theme.accent} 30%, transparent)` }}>{icon}{theme.label}</span>
          {card.channel && <span className="text-[10px] mono uppercase text-white/50">{card.channel}</span>}
        </div>
        {card.title && <div className="relative text-2xl font-bold tracking-tight leading-tight">{card.title}</div>}
        {card.description && <div className="relative text-sm text-white/70 max-w-md">{card.description}</div>}
        {card.rationale && (
          <div className="relative text-xs text-white/60 border-l-2 pl-3" style={{ borderColor: theme.accent }}>
            <span className="mono uppercase text-[10px] tracking-wider mr-1.5" style={{ color: theme.accent }}>Why</span>{card.rationale}
          </div>
        )}
        {card.roi && (
          <div className="relative">
            <ROIEstimatorCard roi={card.roi} />
          </div>
        )}
        {!launched && (
          <button onClick={() => onLaunch(card)} className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-white text-[color:var(--ink)] hover:bg-white/90 transition-all">
            {card.cta_label ?? "Launch Campaign"} <ArrowRight className="size-4" />
          </button>
        )}
        {launched && (
          <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-emerald-500/20 text-emerald-300">
            <CheckCircle2 className="size-4" /> Launched
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl p-5 space-y-4 relative overflow-hidden border"
      style={{ background: theme.tint, borderColor: `color-mix(in oklab, ${theme.accent} 25%, transparent)` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] mono uppercase tracking-wider" style={{ color: theme.accent, background: `color-mix(in oklab, ${theme.accent} 18%, white)` }}>{icon}{theme.label}</span>
          {card.segment_name && <span className="text-xs text-[color:var(--ink)]/60">{card.segment_name}</span>}
        </div>
        {card.channel && <span className="text-[10px] mono uppercase px-2 py-1 rounded-full bg-white/70 text-[color:var(--ink)]/70">{card.channel}</span>}
      </div>

      {card.title && <div className="text-lg font-semibold tracking-tight text-[color:var(--ink)]">{card.title}</div>}
      {card.description && <div className="text-sm text-[color:var(--ink)]/70">{card.description}</div>}

      {card.ab_test_enabled && card.variant_a && card.variant_b ? (
        <div className="space-y-2">
          <div className="text-[10px] mono uppercase tracking-widest text-[color:var(--ink)]/50">A/B test enabled — 50/50 split</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <VariantBox letter="A" label={card.variant_a.description} content={card.variant_a.content} tint="#F5F3FF" color="#7C3AED" />
            <VariantBox letter="B" label={card.variant_b.description} content={card.variant_b.content} tint="#ECFEFF" color="#06B6D4" />
          </div>
          <div className="text-[11px] text-[color:var(--ink)]/55 italic">Winner determined by open rate after delivery.</div>
        </div>
      ) : (
        card.sample_messages && card.sample_messages.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] mono uppercase tracking-widest text-[color:var(--ink)]/50">Sample copy per persona</div>
            {card.sample_messages.slice(0, 3).map((s, i) => (
              <div key={i} className="rounded-xl bg-white border border-black/5 p-3 space-y-1.5 relative group">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] mono uppercase tracking-wider" style={{ color: theme.accent }}>{s.persona}</div>
                  <div className="relative">
                    <Info className="size-3.5 text-[#9CA3AF] cursor-help" />
                    <div className="absolute right-0 top-5 z-10 hidden group-hover:block w-64 p-2.5 bg-white border border-[#E5E7EB] rounded-lg shadow-lg text-[11px] text-[#374151] leading-relaxed">
                      {s.reasoning}
                    </div>
                  </div>
                </div>
                <div className="text-sm leading-relaxed text-[color:var(--ink)]">{s.content}</div>
              </div>
            ))}
          </div>
        )
      )}

      {card.rationale && (
        <div className="text-xs text-[color:var(--ink)]/65 border-l-2 pl-3" style={{ borderColor: theme.accent }}>
          <span className="mono uppercase text-[10px] tracking-wider mr-1.5" style={{ color: theme.accent }}>Why</span>{card.rationale}
        </div>
      )}

      {card.roi && <ROIEstimatorCard roi={card.roi} />}

      {card.type === "campaign_ready" && !launched && (
        <button onClick={() => onLaunch(card)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-[color:var(--ink)] text-white hover:bg-[color:var(--ink)]/90 transition-all">
          {card.cta_label ?? "Launch Campaign"} <ArrowRight className="size-4" />
        </button>
      )}
      {launched && (
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#10B981" }}>
          <CheckCircle2 className="size-3.5" /> Launched
        </div>
      )}
    </motion.div>
  );
}

function VariantBox({ letter, label, content, tint, color }: { letter: string; label: string; content: string; tint: string; color: string }) {
  return (
    <div className="rounded-xl p-3 space-y-1.5" style={{ background: tint, border: `1px solid ${color}33` }}>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] mono font-bold" style={{ background: color, color: "white" }}>{letter}</span>
        <span className="text-[10px] mono uppercase tracking-wider" style={{ color }}>{label}</span>
      </div>
      <div className="text-sm leading-relaxed text-[color:var(--ink)]">{content}</div>
    </div>
  );
}

export { AnimatePresence };
