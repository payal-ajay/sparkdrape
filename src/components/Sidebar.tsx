import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles, Megaphone, Users, BarChart3, Crown, Settings, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Agent", icon: Sparkles },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/audience", label: "Audience", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/loyalty", label: "Loyalty", icon: Crown },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [customerCount, setCustomerCount] = useState(0);
  const [liveCampaigns, setLiveCampaigns] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ count: cc }, { count: lc }] = await Promise.all([
        supabase.from("customers").select("*", { count: "exact", head: true }),
        supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("status", "live"),
      ]);
      if (cancelled) return;
      setCustomerCount(cc ?? 0);
      setLiveCampaigns(lc ?? 0);
    }
    load();
    const ch = supabase
      .channel("sidebar-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, []);

  return (
    <aside className="w-[240px] shrink-0 h-screen sticky top-0 surface !rounded-none border-r border-l-0 border-t-0 border-b-0 flex flex-col">
      <div className="p-5 flex items-center gap-2.5 border-b border-[color:var(--surface-2)]">
        <div className="size-9 rounded-lg bg-gradient-to-br from-[color:var(--violet)] to-[color:var(--cyan)] grid place-items-center shadow-[0_0_20px_-5px_var(--violet)]">
          <Zap className="size-5 text-white" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="font-bold tracking-tight text-base">SPARK</div>
          <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground">by DRAPE</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all relative ${
                active
                  ? "text-foreground bg-[color:var(--violet)]/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-[color:var(--violet)]/5"
              }`}
            >
              {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-[color:var(--violet)] shadow-[0_0_10px_var(--violet)]" />}
              <Icon className="size-4 shrink-0" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[color:var(--surface-2)] space-y-2">
        <div className="flex items-center justify-between px-3 py-2 rounded-md bg-[color:var(--violet)]/5 text-xs">
          <span className="text-muted-foreground">Shoppers</span>
          <span className="mono font-semibold">{customerCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between px-3 py-2 rounded-md bg-[color:var(--violet)]/5 text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5">
            {liveCampaigns > 0 && <span className="relative size-1.5 rounded-full text-[color:var(--violet)] bg-current pulse-dot" />}
            Live campaigns
          </span>
          <span className="mono font-semibold">{liveCampaigns}</span>
        </div>
      </div>
    </aside>
  );
}
