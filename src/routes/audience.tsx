import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Search, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { PersonaBadge, TierBadge, ChannelDot, Skel } from "@/components/ui-bits";
import { inr } from "@/lib/personas";
import { HealthRing, healthLabel, healthBreakdown } from "@/components/HealthRing";

export const Route = createFileRoute("/audience")({
  head: () => ({ meta: [{ title: "Audience — SPARK" }] }),
  component: AudiencePage,
});

interface Customer {
  id: string; name: string | null; email: string | null; city: string | null; age: number | null;
  persona: string | null; preferred_channel: string | null;
  total_spent: number | null; order_count: number | null;
  last_order_date: string | null; days_since_last_order: number | null;
  loyalty_tier: string | null; loyalty_points: number | null;
  favorite_category: string | null; discount_sensitivity: string | null;
  try_on_items: string[] | null; last_review_rating: number | null;
  health_score: number | null; referral_count?: number | null;
}

function AudiencePage() {
  const [tab, setTab] = useState<"customers" | "segments">("customers");
  return (
    <AppShell title="Audience">
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-1 border-b border-[color:var(--surface-2)]">
          {(["customers", "segments"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm capitalize border-b-2 -mb-px transition-colors ${tab === t ? "border-[color:var(--violet)] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
        {tab === "customers" ? <CustomersTab /> : <SegmentsTab />}
      </div>
    </AppShell>
  );
}

function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [q, setQ] = useState("");
  const [persona, setPersona] = useState<string>("");
  const [selected, setSelected] = useState<Customer | null>(null);

  useEffect(() => {
    supabase
      .from("customers")
      .select("*")
      .order("health_score", { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (error) console.error("[audience] customers fetch", error);
        setCustomers((data as Customer[]) ?? []);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!customers) return null;
    return customers.filter(c => {
      if (persona && c.persona !== persona) return false;
      if (q && !((c.name ?? "").toLowerCase().includes(q.toLowerCase()) || (c.city ?? "").toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [customers, q, persona]);

  const personas = ["", "Trend Chaser", "Discount Hunter", "Loyalist", "Lapsed High-Value", "New Shopper"];
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex-1 surface flex items-center gap-2 px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or city…" className="flex-1 bg-transparent outline-none text-sm" />
        </div>
        <select value={persona} onChange={e => setPersona(e.target.value)} className="surface px-3 py-2 text-sm bg-[color:var(--surface)]">
          {personas.map(p => <option key={p} value={p}>{p || "All personas"}</option>)}
        </select>
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-[10px] mono uppercase tracking-widest text-muted-foreground bg-[color:var(--violet)]/5">
            <tr>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Persona</th>
              <th className="text-left px-4 py-3">City</th>
              <th className="text-right px-4 py-3">Spent</th>
              <th className="text-left px-4 py-3">Tier</th>
              <th className="text-left px-4 py-3">Channel</th>
              <th className="text-right px-4 py-3">Last order</th>
            </tr>
          </thead>
          <tbody>
            {!filtered ? Array.from({length: 8}).map((_,i) => (
              <tr key={i}><td colSpan={7} className="p-2"><Skel className="h-8" /></td></tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">No shoppers match. Try Seed Data in Settings.</td></tr>
            ) : filtered.slice(0, 200).map(c => {
              const init = (c.name ?? "?").split(" ").map(s => s[0]).join("").slice(0,2).toUpperCase();
              const personaColors: Record<string, string> = { "Trend Chaser":"var(--cyan)","Discount Hunter":"var(--amber)","Loyalist":"var(--emerald)","Lapsed High-Value":"var(--rose)","New Shopper":"var(--violet)" };
              const color = personaColors[c.persona ?? ""] ?? "var(--muted-foreground)";
              return (
                <tr key={c.id} onClick={() => setSelected(c)} className="border-t border-[color:var(--surface-2)] hover:bg-[color:var(--violet)]/5 cursor-pointer transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-full grid place-items-center text-[10px] font-bold mono" style={{ background: `color-mix(in oklab, ${color} 15%, transparent)`, color }}>{init}</div>
                      <div className="font-medium">{c.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><PersonaBadge persona={c.persona} /></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.city}</td>
                  <td className="px-4 py-2.5 text-right mono font-semibold">{inr(c.total_spent ?? 0)}</td>
                  <td className="px-4 py-2.5"><TierBadge tier={c.loyalty_tier} /></td>
                  <td className="px-4 py-2.5"><ChannelDot channel={c.preferred_channel} /></td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground mono text-xs">{c.last_order_date ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>{selected && <CustomerSlideOver c={selected} onClose={() => setSelected(null)} />}</AnimatePresence>
    </>
  );
}

function CustomerSlideOver({ c, onClose }: { c: Customer; onClose: () => void }) {
  const [orders, setOrders] = useState<{order_date: string | null; amount: number | null; category: string | null; on_sale: boolean | null}[]>([]);
  const [campMsgs, setCampMsgs] = useState<{id: string; personalized_content: string | null; status: string | null; campaign_id: string | null}[]>([]);
  useEffect(() => {
    supabase.from("orders").select("order_date, amount, category, on_sale").eq("customer_id", c.id).order("order_date", { ascending: false }).then(({ data }) => setOrders(data ?? []));
    supabase.from("messages").select("id, personalized_content, status, campaign_id").eq("customer_id", c.id).then(({ data }) => setCampMsgs(data ?? []));
  }, [c.id]);

  const personaReason = useMemo(() => {
    const total = c.total_spent ?? 0;
    const oc = c.order_count ?? 0;
    if (c.persona === "Discount Hunter") return `${oc} orders, high discount sensitivity, rarely pays full price.`;
    if (c.persona === "Loyalist") return `${oc} orders over time, ${inr(c.total_spent ?? 0)} lifetime spend, consistent and brand-loyal.`;
    if (c.persona === "Lapsed High-Value") return `${inr(total)} spent historically, but hasn't ordered in ${c.days_since_last_order ?? "?"} days.`;
    if (c.persona === "Trend Chaser") return `Young, frequent buyer in ${c.favorite_category ?? "drops"} — chases what's new.`;
    return `Just joined — ${oc} order${oc===1?"":"s"} so far. High-intent first impression matters.`;
  }, [c]);

  const tierProgress = Math.min(((c.loyalty_points ?? 0) / 5000) * 100, 100);

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-30 bg-black/60" onClick={onClose}>
      <motion.div initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{type:"spring",damping:28,stiffness:240}}
        className="absolute right-0 top-0 h-full w-full max-w-[640px] glass border-l border-[color:var(--surface-2)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{c.name}</h2>
              <div className="text-xs text-muted-foreground mono mt-1">{c.email} · {c.city}</div>
              <div className="flex gap-2 mt-2"><PersonaBadge persona={c.persona} /><TierBadge tier={c.loyalty_tier} /></div>
            </div>
            <button onClick={onClose} className="size-8 rounded-md hover:bg-[color:var(--violet)]/10 grid place-items-center"><X className="size-4" /></button>
          </div>

          <div className="surface p-4 space-y-2">
            <div className="text-[10px] mono uppercase tracking-widest text-[color:var(--violet)]">Why this persona</div>
            <div className="text-sm leading-relaxed">{personaReason}</div>
          </div>

          <div className="surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] mono uppercase tracking-widest text-muted-foreground">Loyalty progress</span>
              <span className="text-xs mono">{c.loyalty_points ?? 0} pts</span>
            </div>
            <div className="h-2 rounded-full bg-[color:var(--violet)]/10 overflow-hidden">
              <motion.div initial={{width:0}} animate={{width:`${tierProgress}%`}} transition={{duration:1}} className="h-full bg-gradient-to-r from-[color:var(--amber)] to-[color:var(--gold)]" />
            </div>
            <div className="flex justify-between text-[10px] mono uppercase text-muted-foreground"><span>Fan</span><span>Muse 1k</span><span>Icon 5k</span></div>
          </div>

          {c.try_on_items && c.try_on_items.length > 0 && (
            <div className="surface p-4 space-y-3">
              <div className="text-[10px] mono uppercase tracking-widest text-[color:var(--cyan)]">Try-On Studio</div>
              <div className="flex gap-4 items-start">
                <svg viewBox="0 0 80 160" className="size-32 text-[color:var(--surface-2)]" fill="currentColor"><circle cx="40" cy="20" r="12"/><path d="M28 36 Q 40 32 52 36 L 56 90 L 50 150 L 30 150 L 24 90 Z"/></svg>
                <div className="flex-1 space-y-2">
                  {c.try_on_items.map((item, i) => (
                    <div key={i} className="rounded-md bg-[color:var(--cyan)]/10 border border-[color:var(--cyan)]/30 px-3 py-2 text-xs">{item}</div>
                  ))}
                  <div className="text-xs text-muted-foreground italic mt-2">Virtually tried, didn't buy. Strong retargeting signal.</div>
                  <button className="text-xs text-[color:var(--cyan)] hover:underline inline-flex items-center gap-1"><Sparkles className="size-3" />Use in next campaign</button>
                </div>
              </div>
            </div>
          )}

          {typeof c.last_review_rating === "number" && (
            <div className="surface p-4 space-y-1">
              <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground">Last review</div>
              <div className="text-lg">{"★".repeat(c.last_review_rating)}<span className="text-muted-foreground">{"★".repeat(5 - c.last_review_rating)}</span></div>
            </div>
          )}

          <div className="surface p-4">
            <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground mb-3">Order timeline</div>
            {orders.length === 0 ? <div className="text-sm text-muted-foreground">No orders yet.</div> :
              <ul className="space-y-2">
                {orders.slice(0, 8).map((o, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs">
                    <span className="size-1.5 rounded-full bg-[color:var(--violet)]" />
                    <span className="mono text-muted-foreground w-24">{o.order_date}</span>
                    <span className="flex-1 capitalize">{o.category}</span>
                    {o.on_sale && <span className="text-[9px] mono uppercase text-[color:var(--amber)]">SALE</span>}
                    <span className="mono font-semibold">{inr(o.amount ?? 0)}</span>
                  </li>
                ))}
              </ul>}
          </div>

          {campMsgs.length > 0 && (
            <div className="surface p-4">
              <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground mb-3">Campaign history</div>
              <ul className="space-y-2">
                {campMsgs.slice(0, 5).map(m => (
                  <li key={m.id} className="text-xs rounded-md bg-[color:var(--violet)]/5 p-2.5">
                    <div className="flex items-center justify-between mb-1"><span className="mono uppercase text-[9px] text-muted-foreground">{m.status}</span></div>
                    <div className="leading-relaxed">{m.personalized_content}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

interface Segment {
  id: string; name: string; description: string | null; customer_count: number | null;
  created_by: string | null; campaign_type: string | null; filter_logic: unknown;
}

function SegmentsTab() {
  const [segments, setSegments] = useState<Segment[] | null>(null);
  useEffect(() => {
    supabase.from("segments").select("*").order("created_at", { ascending: false }).then(({ data }) => setSegments((data as Segment[]) ?? []));
  }, []);
  if (!segments) return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({length:4}).map((_,i)=><Skel key={i} className="h-32" />)}</div>;
  if (segments.length === 0) return (
    <div className="surface p-12 text-center max-w-lg mx-auto">
      <h3 className="font-semibold">No segments yet.</h3>
      <p className="text-sm text-muted-foreground mt-1">The Agent creates segments as you ask. Try: "Find lapsed high-value customers".</p>
    </div>
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {segments.map(s => (
        <div key={s.id} className="surface-hover p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] mono uppercase tracking-widest text-muted-foreground">{s.campaign_type ?? "segment"}</span>
            <span className={`text-[10px] mono uppercase px-1.5 py-0.5 rounded border ${s.created_by === "ai" ? "text-[color:var(--violet)] border-[color:var(--violet)]/40 bg-[color:var(--violet)]/10" : "text-muted-foreground border-[color:var(--surface-2)]"}`}>{s.created_by === "ai" ? "AI" : "MANUAL"}</span>
          </div>
          <div className="font-semibold">{s.name}</div>
          <div className="text-3xl mono font-bold text-[color:var(--cyan)]">{s.customer_count}</div>
          <div className="text-xs text-muted-foreground line-clamp-2">{s.description}</div>
        </div>
      ))}
    </div>
  );
}
