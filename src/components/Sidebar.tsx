import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles, Megaphone, Users, BarChart3, Crown, Settings, Zap, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/dashboard", label: "Agent", icon: Sparkles },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/audience", label: "Audience", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/loyalty", label: "Loyalty", icon: Crown },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [liveCampaigns, setLiveCampaigns] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { count: lc } = await supabase
        .from("campaigns").select("*", { count: "exact", head: true }).eq("status", "live");
      if (cancelled) return;
      setLiveCampaigns(lc ?? 0);
    }
    load();
    const ch = supabase
      .channel("sidebar-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns" }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, []);

  const settingsActive = pathname.startsWith("/settings");

  return (
    <aside
      className="w-[72px] shrink-0 h-screen sticky top-0 flex flex-col items-center py-5 gap-2"
      style={{ background: "var(--sidebar)", color: "rgba(255,255,255,0.7)" }}
    >
      {/* Brand mark */}
      <Link to="/dashboard" className="size-9 rounded-full grid place-items-center mb-3" style={{ background: "#7C3AED" }} aria-label="SPARK home">
        <Zap className="size-4 text-white" strokeWidth={2.5} fill="white" />
      </Link>

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center gap-1.5">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              title={label}
              className={`relative size-10 rounded-xl grid place-items-center transition-all ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:text-white hover:bg-white/5"
              }`}
            >
              {active && (
                <span className="absolute -left-[14px] top-2 bottom-2 w-[3px] rounded-r bg-[color:var(--violet)]" />
              )}
              <Icon className="size-[20px]" strokeWidth={1.75} />
              {label === "Campaigns" && liveCampaigns > 0 && (
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[color:var(--violet)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: settings + avatar */}
      <div className="flex flex-col items-center gap-3 pt-3 border-t border-white/10 w-10">
        <Link
          to="/settings"
          title="Settings"
          className={`size-10 rounded-xl grid place-items-center transition-all ${
            settingsActive ? "bg-white/10 text-white" : "text-white/55 hover:text-white hover:bg-white/5"
          }`}
        >
          <Settings className="size-[20px]" strokeWidth={1.75} />
        </Link>
        <button
          title="Sign out"
          className="size-10 rounded-xl grid place-items-center text-white/45 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut className="size-[18px]" strokeWidth={1.75} />
        </button>
        <div
          className="size-9 rounded-full grid place-items-center transition-colors hover:border-[#A78BFA]"
          style={{ background: "#1A0533", border: "2px solid #7C3AED" }}
          title="DRAPE"
        >
          <Zap className="size-4 text-white" strokeWidth={2.5} fill="white" />
        </div>
      </div>
    </aside>
  );
}
