import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Calendar, X, ArrowRight } from "lucide-react";
import { upcomingOccasions } from "@/lib/occasions";

const OCCASION_COLORS: Record<string, string> = {
  eoss: "#F59E0B",
  college: "#06B6D4",
  festive: "#7C3AED",
  wedding: "#F43F5E",
  valentine: "#EC4899",
  summer: "#10B981",
};

const OCCASION_PERSONAS: Record<string, string> = {
  eoss: "Discount Hunter",
  college: "Trend Chaser",
  festive: "Loyalist",
  wedding: "Icon Tier",
  valentine: "New Shopper",
  summer: "Trend Chaser",
};

const ELIGIBLE_PATHS = ["/dashboard", "/campaigns"];

export function OccasionBanner() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [counts, setCounts] = useState<number | null>(null);
  const next = upcomingOccasions()[0];

  useEffect(() => {
    setDismissed(sessionStorage.getItem("occ-banner-dismissed") === "1");
  }, []);

  useEffect(() => {
    // optional shopper count by persona — quick supabase fetch
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const persona = OCCASION_PERSONAS[next.key];
        const { count } = await supabase
          .from("customers")
          .select("*", { count: "exact", head: true })
          .eq("persona", persona);
        if (!cancelled) setCounts(count ?? 0);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [next.key]);

  if (!ELIGIBLE_PATHS.some((p) => path.startsWith(p))) return null;
  if (dismissed) return null;

  const color = OCCASION_COLORS[next.key] ?? "#7C3AED";
  const persona = OCCASION_PERSONAS[next.key] ?? "your shoppers";
  const urgent = next.daysAway <= 7;

  const onBuild = () => {
    const prompt = `Create a ${next.name} campaign for our ${persona} customers who bought ${next.categories.join(", ")} items before`;
    sessionStorage.setItem("spark-prefill", prompt);
    if (!path.startsWith("/dashboard")) navigate({ to: "/dashboard" });
    window.dispatchEvent(new CustomEvent("spark-prefill", { detail: prompt }));
  };

  return (
    <div
      className="w-full flex items-center justify-between gap-3 px-6 animate-[occ-slide-down_300ms_ease-out]"
      style={{
        height: 44,
        background: `color-mix(in oklab, ${color} ${urgent ? "14%" : "8%"}, white)`,
        borderBottom: "1px solid #E5E7EB",
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {urgent && <span className="size-1.5 rounded-full animate-pulse" style={{ background: color }} />}
        <Calendar className="size-4 shrink-0" style={{ color }} />
        <span className="text-[13px] font-semibold truncate" style={{ color: "#111118" }}>
          {next.name} in {next.daysAway} days
        </span>
        <span className="text-[13px] truncate" style={{ color: "#6B7280" }}>
          · {counts ?? "—"} {persona} customers ready
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onBuild}
          className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full text-[11px] font-semibold text-white hover:brightness-110 transition"
          style={{ background: color }}
        >
          Build Campaign <ArrowRight className="size-3" />
        </button>
        <button
          onClick={() => {
            sessionStorage.setItem("occ-banner-dismissed", "1");
            setDismissed(true);
          }}
          className="size-7 grid place-items-center rounded-full hover:bg-black/5"
          aria-label="Dismiss"
          style={{ color: "#9CA3AF" }}
        >
          <X className="size-3.5" />
        </button>
      </div>
      <style>{`@keyframes occ-slide-down { from { transform: translateY(-44px); opacity:0 } to { transform: translateY(0); opacity:1 } }`}</style>
    </div>
  );
}
