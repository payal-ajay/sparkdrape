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
  customer_id: string | null;
}
interface CustomerLite { id: string; name: string | null; persona: string | null }

function CampaignSlideOver({ campaign, onClose, onReplay }: { campaign: Campaign; onClose: () => void; onReplay: () => void }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [customers, setCustomers] = useState<Record<string, CustomerLite>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase.from("messages").select("id, status, personalized_content, persona_reasoning, created_at, sent_at, customer_id").eq("campaign_id", campaign.id).order("sent_at", { ascending: false, nullsFirst: false }).limit(40);
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
            <button onClick={onClose} className="size-8 rounded-md hover:bg-[color:var(--violet)]/10 grid place-items-center"><X className="size-4" /></button>
          </div>

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
                messages.map(m => {
                  const c = m.customer_id ? customers[m.customer_id] : undefined;
                  const isOpen = expanded === m.id;
                  return (
                    <motion.div key={m.id} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-md bg-[color:var(--violet)]/5 border border-[color:var(--surface-2)] p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium truncate">{c?.name ?? "—"}</span>
                          <PersonaBadge persona={c?.persona} />
                        </div>
                        <StatusPill status={m.status} />
                      </div>
                      <button onClick={() => setExpanded(isOpen ? null : m.id)} className="text-xs text-left text-foreground/80 hover:text-foreground line-clamp-2">{m.personalized_content}</button>
                      {isOpen && m.persona_reasoning && (
                        <div className="text-[11px] italic text-muted-foreground border-l-2 border-[color:var(--violet)]/40 pl-2 mt-1">› {m.persona_reasoning}</div>
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
