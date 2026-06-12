import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Stat } from "@/components/Stat";
import { Skel, TierBadge } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { upcomingOccasions } from "@/lib/occasions";
import { Crown, Calendar, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/loyalty")({
  head: () => ({ meta: [{ title: "Loyalty — SPARK" }] }),
  component: LoyaltyPage,
});

interface Customer { id: string; name: string | null; loyalty_tier: string | null; loyalty_points: number | null; persona: string | null }
interface Event { id: string; event_type: string | null; points_earned: number | null; description: string | null; created_at: string | null; customer_id: string | null }

function LoyaltyPage() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [events, setEvents] = useState<Event[] | null>(null);
  const [custMap, setCustMap] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from("customers").select("id, name, loyalty_tier, loyalty_points, persona").order("loyalty_points", { ascending: false }).then(({ data }) => {
      setCustomers((data as Customer[]) ?? []);
      setCustMap(Object.fromEntries((data ?? []).map(c => [c.id, c.name ?? ""])));
    });
    supabase.from("loyalty_events").select("*").order("created_at", { ascending: false }).limit(20).then(({ data }) => setEvents((data as Event[]) ?? []));
  }, []);

  const totalPoints = customers?.reduce((s, c) => s + (c.loyalty_points ?? 0), 0) ?? 0;
  const tierCounts = { Fan: 0, Muse: 0, Icon: 0 } as Record<string, number>;
  for (const c of customers ?? []) tierCounts[c.loyalty_tier ?? "Fan"] = (tierCounts[c.loyalty_tier ?? "Fan"] ?? 0) + 1;
  const closeToIcon = (customers ?? []).filter(c => (c.loyalty_points ?? 0) >= 4000 && (c.loyalty_points ?? 0) < 5000);
  const occ = upcomingOccasions().slice(0, 6);

  return (
    <AppShell title="Loyalty Engine">
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total Points" value={totalPoints} />
          <Stat label="Icon Tier" value={tierCounts.Icon} color="var(--gold)" />
          <Stat label="Muse Tier" value={tierCounts.Muse} color="var(--cyan)" />
          <Stat label="Fan Tier" value={tierCounts.Fan} />
        </div>

        <section className="surface p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Crown className="size-4 text-[color:var(--gold)]" /> Tier ladder</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: "Fan", range: "0 – 999", desc: "Basic member", color: "var(--muted-foreground)" },
              { name: "Muse", range: "1,000 – 4,999", desc: "Early access to drops", color: "var(--cyan)" },
              { name: "Icon", range: "5,000+", desc: "Personal stylist · birthday gift · first look", color: "var(--gold)" },
            ].map(t => (
              <div key={t.name} className="rounded-md p-4 border" style={{ borderColor: `color-mix(in oklab, ${t.color} 30%, transparent)`, background: `color-mix(in oklab, ${t.color} 6%, transparent)` }}>
                <div className="text-xs mono uppercase tracking-widest" style={{ color: t.color }}>{t.name}</div>
                <div className="text-xl font-bold mono mt-1">{tierCounts[t.name]}</div>
                <div className="text-[11px] mono text-muted-foreground mt-1">{t.range} pts</div>
                <div className="text-xs text-muted-foreground mt-2">{t.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {closeToIcon.length > 0 && (
          <section className="surface p-6 space-y-3">
            <h3 className="font-semibold">⚡ {closeToIcon.length} close to hitting Icon tier</h3>
            <p className="text-sm text-muted-foreground">Push them over with a milestone campaign — ask SPARK in Agent.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {closeToIcon.slice(0, 6).map(c => (
                <div key={c.id} className="flex items-center justify-between text-sm rounded-md bg-[color:var(--violet)]/5 p-2.5">
                  <span>{c.name}</span>
                  <span className="mono text-[color:var(--gold)]">{c.loyalty_points} pts</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="surface p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Calendar className="size-4 text-[color:var(--amber)]" /> Upcoming Indian fashion occasions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {occ.map(o => (
              <Link key={o.key} to="/dashboard" className="surface-hover p-4 group">
                <div className="text-2xl">{o.emoji}</div>
                <div className="text-sm font-semibold mt-2">{o.name}</div>
                <div className="text-[10px] mono uppercase text-muted-foreground mt-0.5">in {o.daysAway}d</div>
                <div className="text-[11px] text-muted-foreground mt-2">{o.tone}</div>
                <div className="text-[11px] text-[color:var(--violet)] mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">Build campaign <ArrowRight className="size-3" /></div>
              </Link>
            ))}
          </div>
        </section>

        <section className="surface overflow-hidden">
          <div className="px-6 py-4 border-b border-[color:var(--surface-2)] font-semibold">Recent loyalty actions</div>
          {!events ? <Skel className="h-40 m-3" /> : events.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No actions yet. Seed data first.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-[10px] mono uppercase text-muted-foreground bg-[color:var(--violet)]/5">
                <tr><th className="text-left px-4 py-2.5">Customer</th><th className="text-left px-4 py-2.5">Event</th><th className="text-left px-4 py-2.5">Description</th><th className="text-right px-4 py-2.5">Points</th></tr>
              </thead>
              <tbody>
                {events.map(e => (
                  <tr key={e.id} className="border-t border-[color:var(--surface-2)]">
                    <td className="px-4 py-2.5">{custMap[e.customer_id ?? ""] ?? "—"}</td>
                    <td className="px-4 py-2.5 capitalize"><TierBadge tier={e.event_type === "purchase" ? "Muse" : "Fan"} /></td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{e.description}</td>
                    <td className="px-4 py-2.5 text-right mono font-semibold text-[color:var(--gold)]">+{e.points_earned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </AppShell>
  );
}
