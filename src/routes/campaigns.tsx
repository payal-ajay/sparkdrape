import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Megaphone, X, Flame, Trophy, Crown, Calendar, Users, RefreshCw, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { PersonaBadge, ChannelDot, Skel } from "@/components/ui-bits";
import { processCampaignTick } from "@/lib/simulate-channel.functions";
import { CampaignReplay } from "@/components/CampaignReplay";

export const Route = createFileRoute("/campaigns")({
  head: () => ({ meta: [{ title: "Campaigns — SPARK" }] }),
  component: CampaignsPage,
});

interface Campaign {
  id: string; name: string; channel: string | null; status: string | null; campaign_type: string | null;
  total_recipients: number | null; sent_count: number | null; delivered_count: number | null;
  opened_count: number | null; clicked_count: number | null; failed_count: number | null;
  message_template: string | null; launched_at: string | null; created_at: string | null;
  ab_test_enabled?: boolean | null; winner_variant?: string | null;
}

function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [replay, setReplay] = useState<Campaign | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const tick = useServerFn(processCampaignTick);

  async function load() {
    const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    if (error) console.error("[campaigns] load", error);
    setCampaigns(data ?? []);
  }
  async function manualRefresh() {
    setRefreshing(true);
    await load();
    setTimeout(() => setRefreshing(false), 400);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("campaigns-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-tick any live campaigns (in case the originating tab closed)
  useEffect(() => {
    if (!campaigns) return;
    const live = campaigns.filter((c) => c.status === "live");
    if (live.length === 0) return;
    const t = setInterval(() => {
      live.forEach((c) => tick({ data: { campaignId: c.id } }).catch(() => {}));
    }, 2500);
    return () => clearInterval(t);
  }, [campaigns, tick]);

  return (
    <AppShell
      title="Campaigns"
      action={
        <button
          onClick={manualRefresh}
          className="size-9 rounded-full grid place-items-center hover:bg-[#F4F4F0] transition-colors"
          style={{ color: "#6B7280" }}
          aria-label="Refresh"
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="p-8">
        {!campaigns ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skel key={i} className="h-40" />)}
          </div>
        ) : campaigns.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} c={c} onClick={() => setSelected(c)} onReplay={() => setReplay(c)} />
            ))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {selected && <CampaignSlideOver campaign={selected} onClose={() => setSelected(null)} onReplay={() => setReplay(selected)} />}
        {replay && (
          <CampaignReplay
            campaignId={replay.id}
            campaignName={replay.name}
            onClose={() => setReplay(null)}
            onRunSimilar={() => {
              sessionStorage.setItem("spark-prefill", `Run a similar campaign to "${replay.name}"`);
              window.location.href = "/dashboard";
            }}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function typeAccent(t: string | null) {
  if (t === "flash_drop") return { color: "var(--rose)", icon: <Flame className="size-3" />, label: "FLASH DROP" };
  if (t === "contest") return { color: "var(--gold)", icon: <Trophy className="size-3" />, label: "CONTEST" };
  if (t === "challenge") return { color: "var(--cyan)", icon: <Crown className="size-3" />, label: "CHALLENGE" };
  if (t === "loyalty") return { color: "var(--emerald)", icon: <Crown className="size-3" />, label: "LOYALTY" };
  if (t === "occasion") return { color: "var(--amber)", icon: <Calendar className="size-3" />, label: "OCCASION" };
  return { color: "var(--violet)", icon: <Users className="size-3" />, label: "STANDARD" };
}

function CampaignCard({ c, onClick, onReplay }: { c: Campaign; onClick: () => void; onReplay: () => void }) {
  const t = typeAccent(c.campaign_type);
  const total = c.total_recipients || 1;
  const sent = c.sent_count ?? 0, delivered = c.delivered_count ?? 0, opened = c.opened_count ?? 0, clicked = c.clicked_count ?? 0;
  const openRate = sent ? Math.round((opened / sent) * 100) : 0;
  const live = c.status === "live";
  const completed = c.status === "completed";
  return (
    <button onClick={onClick} className="text-left surface-hover p-5 space-y-3 transition-all" style={{ borderColor: live ? `color-mix(in oklab, ${t.color} 40%, var(--surface-2))` : undefined }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative size-2 rounded-full" style={{ background: t.color, color: t.color }}>
            {live && <span className="absolute inset-0 rounded-full pulse-dot" />}
          </span>
          <span className="text-[10px] mono uppercase tracking-widest" style={{ color: t.color }}>{t.label}</span>
          {c.ab_test_enabled && <span className="text-[9px] mono px-1.5 py-0.5 rounded bg-[#7C3AED]/10 text-[#7C3AED] font-bold">A/B</span>}
        </div>
        <ChannelDot channel={c.channel} />
      </div>
      <div className="font-semibold text-sm tracking-tight line-clamp-1">{c.name}</div>
      <FunnelBar total={total} sent={sent} delivered={delivered} opened={opened} clicked={clicked} />
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground mono">{total} recipients</span>
        <span className="mono font-semibold">{openRate}% open</span>
      </div>
      {completed && (
        <div className="pt-1">
          <span
            onClick={(e) => { e.stopPropagation(); onReplay(); }}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md hover:bg-[#7C3AED]/10 cursor-pointer"
            style={{ color: "#7C3AED" }}
          >
            <Play className="size-3" fill="#7C3AED" /> Replay
          </span>
        </div>
      )}
    </button>
  );
}

function FunnelBar({ total, sent, delivered, opened, clicked }: { total: number; sent: number; delivered: number; opened: number; clicked: number }) {
  return (
    <div className="h-1.5 rounded-full bg-[color:var(--violet)]/10 overflow-hidden flex">
      <div className="h-full transition-all duration-700" style={{ width: `${(sent/total)*100}%`, background: "var(--violet)" }} />
      <div className="h-full transition-all duration-700 -ml-px" style={{ width: `${(delivered/total)*100 - (sent/total)*100}%`, background: "var(--cyan)" }} />
      <div className="h-full transition-all duration-700" style={{ width: `${((opened - clicked)/total)*100}%`, background: "var(--amber)" }} />
      <div className="h-full transition-all duration-700" style={{ width: `${(clicked/total)*100}%`, background: "var(--emerald)" }} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="surface p-12 text-center space-y-3 max-w-lg mx-auto mt-12">
      <div className="size-12 rounded-full bg-[color:var(--violet)]/10 grid place-items-center text-[color:var(--violet)] mx-auto"><Megaphone className="size-5" /></div>
      <h2 className="font-semibold">No campaigns yet.</h2>
      <p className="text-sm text-muted-foreground">300 shoppers are waiting to hear from DRAPE. Head to the Agent and describe one.</p>
    </div>
  );
}

interface Message {
  id: string; status: string | null; personalized_content: string | null; persona_reasoning: string | null;
  created_at: string | null; sent_at: string | null;
  customer_id: string | null; variant?: string | null;
}
interface CustomerLite { id: string; name: string | null; persona: string | null }

function CampaignSlideOver({ campaign, onClose, onReplay }: { campaign: Campaign; onClose: () => void; onReplay: () => void }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [customers, setCustomers] = useState<Record<string, CustomerLite>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase.from("messages").select("id, status, personalized_content, persona_reasoning, created_at, sent_at, customer_id, variant").eq("campaign_id", campaign.id).order("sent_at", { ascending: false, nullsFirst: false }).limit(40);
      if (cancelled || !data) return;
      setMessages(data as Message[]);
      const ids = Array.from(new Set(data.map(m => m.customer_id).filter(Boolean))) as string[];
      if (ids.length) {
        const { data: cust } = await supabase.from("customers").select("id, name, persona").in("id", ids);
        if (cust) setCustomers(Object.fromEntries(cust.map(c => [c.id, c as CustomerLite])));
      }
    }
    load();
    const ch = supabase.channel("camp-msgs-" + campaign.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `campaign_id=eq.${campaign.id}` }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [campaign.id]);

  const total = campaign.total_recipients || 1;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-30 bg-black/60" onClick={onClose}>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 240 }}
        className="absolute right-0 top-0 h-full w-full max-w-[640px] glass border-l border-[color:var(--surface-2)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground">{campaign.campaign_type ?? "campaign"}</div>
              <h2 className="text-lg font-semibold tracking-tight mt-1">{campaign.name}</h2>
            </div>
            <div className="flex items-center gap-1">
              {campaign.status === "completed" && (
                <button onClick={onReplay} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-[#7C3AED] hover:bg-[#7C3AED]/10">
                  <Play className="size-3" fill="#7C3AED" /> Instant Replay
                </button>
              )}
              <button onClick={onClose} className="size-8 rounded-md hover:bg-[color:var(--violet)]/10 grid place-items-center"><X className="size-4" /></button>
            </div>
          </div>

          {campaign.ab_test_enabled && (
            <ABResultsBlock campaignId={campaign.id} winner={campaign.winner_variant ?? null} live={campaign.status === "live"} />
          )}


          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { l: "Sent", v: campaign.sent_count ?? 0, c: "var(--violet)" },
              { l: "Delivered", v: campaign.delivered_count ?? 0, c: "var(--cyan)" },
              { l: "Opened", v: campaign.opened_count ?? 0, c: "var(--amber)" },
              { l: "Clicked", v: campaign.clicked_count ?? 0, c: "var(--emerald)" },
              { l: "Failed", v: campaign.failed_count ?? 0, c: "var(--rose)" },
            ].map(s => (
              <div key={s.l} className="surface px-2 py-3">
                <div className="text-[9px] mono uppercase tracking-widest text-muted-foreground">{s.l}</div>
                <div className="mt-1 text-lg font-bold mono" style={{ color: s.c }}>{s.v}</div>
                <div className="text-[10px] text-muted-foreground mono mt-0.5">{Math.round(((s.v as number) / total) * 100)}%</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              {campaign.status === "live" && <span className="size-1.5 rounded-full bg-[color:var(--emerald)] pulse-dot text-[color:var(--emerald)]" />}
              Live message feed
            </div>
            <div className="space-y-1.5">
              {!messages ? <Skel className="h-40" /> :
                messages.map((m) => {
                  const c = m.customer_id ? customers[m.customer_id] : undefined;
                  const isOpen = expanded === m.id;
                  return (
                    <motion.div key={m.id} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-md bg-white border border-[#E5E7EB] overflow-hidden">
                      <div className="p-3 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-medium truncate">{c?.name ?? "—"}</span>
                            <PersonaBadge persona={c?.persona} />
                            {m.variant && campaign.ab_test_enabled && (
                              <span className="text-[9px] mono font-bold px-1 rounded" style={{ background: m.variant === "A" ? "#F5F3FF" : "#ECFEFF", color: m.variant === "A" ? "#7C3AED" : "#06B6D4" }}>{m.variant}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <StatusPill status={m.status} />
                            <button onClick={() => setExpanded(isOpen ? null : m.id)} className="size-5 grid place-items-center rounded hover:bg-[#F4F4F0] text-[#9CA3AF]" aria-label="Why this message">
                              <span className={`inline-block transition-transform ${isOpen ? "rotate-90" : ""}`}>›</span>
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-[#374151] line-clamp-2">{m.personalized_content}</div>
                      </div>
                      {isOpen && (
                        <div className="px-4 py-3 space-y-2" style={{ background: "#F5F3FF", borderTop: "1px solid #E5E7EB", borderLeft: "2px solid #7C3AED" }}>
                          <div className="text-[11px] mono uppercase font-semibold" style={{ color: "#7C3AED", letterSpacing: "0.08em" }}>Why this message?</div>
                          <div className="text-[13px] leading-relaxed" style={{ color: "#374151" }}>{m.persona_reasoning || "—"}</div>
                          <pre className="text-[12px] mono whitespace-pre-wrap p-2.5 rounded-md" style={{ background: "#F8F7F4", border: "1px solid #E5E7EB", color: "#111118" }}>{m.personalized_content}</pre>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ABResultsBlock({ campaignId, winner, live }: { campaignId: string; winner: string | null; live: boolean }) {
  const [stats, setStats] = useState<Record<string, { sent: number; opened: number; clicked: number }>>({ A: { sent: 0, opened: 0, clicked: 0 }, B: { sent: 0, opened: 0, clicked: 0 } });
  useEffect(() => {
    let cancel = false;
    async function load() {
      const { data } = await supabase.from("messages").select("variant, status").eq("campaign_id", campaignId);
      if (cancel || !data) return;
      const acc: Record<string, { sent: number; opened: number; clicked: number }> = { A: { sent: 0, opened: 0, clicked: 0 }, B: { sent: 0, opened: 0, clicked: 0 } };
      for (const m of data) {
        const v = (m.variant as string) ?? "A";
        if (!acc[v]) acc[v] = { sent: 0, opened: 0, clicked: 0 };
        if (["sent","delivered","opened","clicked","failed"].includes(m.status as string)) acc[v].sent++;
        if (["opened","clicked"].includes(m.status as string)) acc[v].opened++;
        if (m.status === "clicked") acc[v].clicked++;
      }
      setStats(acc);
    }
    load();
    const ch = supabase.channel("ab-" + campaignId).on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `campaign_id=eq.${campaignId}` }, load).subscribe();
    return () => { cancel = true; supabase.removeChannel(ch); };
  }, [campaignId]);

  const aRate = stats.A.sent ? Math.round((stats.A.opened / stats.A.sent) * 100) : 0;
  const bRate = stats.B.sent ? Math.round((stats.B.opened / stats.B.sent) * 100) : 0;
  const diff = Math.abs(bRate - aRate);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {(["A", "B"] as const).map((v) => (
          <div key={v} className="surface p-3" style={{ borderColor: v === "A" ? "#7C3AED33" : "#06B6D433" }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] mono uppercase font-bold" style={{ color: v === "A" ? "#7C3AED" : "#06B6D4" }}>Variant {v}</span>
              <span className="text-[10px] mono text-muted-foreground">{v === "A" ? "Discount-forward" : "Story-forward"}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 mt-2 text-center text-xs">
              <div><div className="mono text-[9px] text-muted-foreground">SENT</div><div className="font-bold">{stats[v].sent}</div></div>
              <div><div className="mono text-[9px] text-muted-foreground">OPENED</div><div className="font-bold">{stats[v].sent ? Math.round((stats[v].opened / stats[v].sent) * 100) : 0}%</div></div>
              <div><div className="mono text-[9px] text-muted-foreground">CLICKED</div><div className="font-bold">{stats[v].sent ? Math.round((stats[v].clicked / stats[v].sent) * 100) : 0}%</div></div>
            </div>
          </div>
        ))}
      </div>
      {winner ? (
        <div className="rounded-md p-2.5 text-xs font-semibold" style={{ background: "#10B98115", color: "#10B981" }}>
          🏆 Variant {winner} Won — {winner === "B" ? "Story" : "Discount"} tone outperformed by {diff}%
        </div>
      ) : (
        <div className="rounded-md p-2.5 text-xs flex items-center gap-2" style={{ background: "#F5F3FF", color: "#7C3AED" }}>
          {live && <span className="size-1.5 rounded-full bg-[#7C3AED] animate-pulse" />} A/B test in progress…
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string | null }) {
  const map: Record<string, { c: string; l: string }> = {
    queued: { c: "var(--muted-foreground)", l: "QUEUED" },
    sent: { c: "var(--violet)", l: "SENT" },
    delivered: { c: "var(--cyan)", l: "DELIVERED" },
    opened: { c: "var(--amber)", l: "OPENED" },
    clicked: { c: "var(--emerald)", l: "CLICKED" },
    failed: { c: "var(--rose)", l: "FAILED" },
  };
  const s = map[status ?? "queued"] ?? map.queued;
  return <motion.span layout className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] mono uppercase tracking-wider border" style={{ color: s.c, borderColor: `color-mix(in oklab, ${s.c} 30%, transparent)`, background: `color-mix(in oklab, ${s.c} 8%, transparent)` }}>{s.l}</motion.span>;
}
