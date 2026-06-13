import { useEffect, useRef, useState } from "react";
import { X, Play } from "lucide-react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { PersonaBadge } from "@/components/ui-bits";

interface ReplayMsg {
  id: string;
  customer_id: string | null;
  status: string | null;
  created_at: string | null;
}

export function CampaignReplay({
  campaignId,
  campaignName,
  onClose,
  onRunSimilar,
}: {
  campaignId: string;
  campaignName: string;
  onClose: () => void;
  onRunSimilar?: () => void;
}) {
  const [feed, setFeed] = useState<{ msg: ReplayMsg; cust: { name: string | null; persona: string | null } | null; status: string }[]>([]);
  const [counts, setCounts] = useState({ sent: 0, delivered: 0, opened: 0, clicked: 0 });
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [best, setBest] = useState<{ persona: string; rate: number } | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, customer_id, status, created_at")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: true });
      if (!msgs || msgs.length === 0) return;
      const ids = Array.from(new Set(msgs.map((m) => m.customer_id).filter(Boolean))) as string[];
      const { data: custs } = await supabase.from("customers").select("id, name, persona").in("id", ids);
      const map: Record<string, { name: string | null; persona: string | null }> = {};
      (custs ?? []).forEach((c) => (map[c.id] = { name: c.name, persona: c.persona }));

      const total = msgs.length;
      const interval = Math.max(40, 10000 / total);
      const localFeed: typeof feed = [];
      const localCounts = { sent: 0, delivered: 0, opened: 0, clicked: 0 };
      const personaPerf: Record<string, { sent: number; opened: number }> = {};

      for (let i = 0; i < msgs.length; i++) {
        const m = msgs[i] as ReplayMsg;
        const c = m.customer_id ? map[m.customer_id] : null;
        const finalStatus = m.status ?? "sent";
        const persona = c?.persona ?? "?";
        personaPerf[persona] = personaPerf[persona] ?? { sent: 0, opened: 0 };
        personaPerf[persona].sent++;
        if (finalStatus === "opened" || finalStatus === "clicked") personaPerf[persona].opened++;

        localCounts.sent++;
        if (finalStatus === "delivered" || finalStatus === "opened" || finalStatus === "clicked") localCounts.delivered++;
        if (finalStatus === "opened" || finalStatus === "clicked") localCounts.opened++;
        if (finalStatus === "clicked") localCounts.clicked++;

        localFeed.unshift({ msg: m, cust: c, status: finalStatus });
        setFeed([...localFeed.slice(0, 30)]);
        setCounts({ ...localCounts });
        setProgress(((i + 1) / total) * 100);
        await new Promise((r) => setTimeout(r, interval));
      }

      const best = Object.entries(personaPerf)
        .map(([p, v]) => ({ persona: p, rate: v.sent ? v.opened / v.sent : 0 }))
        .sort((a, b) => b.rate - a.rate)[0];
      if (best) setBest({ persona: best.persona, rate: Math.round(best.rate * 100) });
      setDone(true);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#7C3AED", "#06B6D4", "#10B981"] });
    })();
  }, [campaignId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="w-full max-w-[640px] rounded-[20px] text-white overflow-hidden relative"
        style={{ background: "#111118", border: "1px solid #1F1F2E" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 bg-white/10 absolute top-0 left-0 right-0">
          <div className="h-full bg-[#7C3AED] transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] mono uppercase tracking-widest text-white/50">Campaign Replay</div>
              <h2 className="text-lg font-semibold mt-1">{campaignName}</h2>
              <div className="text-xs text-white/50 mt-1">Watching messages deliver in real time</div>
            </div>
            <button onClick={onClose} className="size-8 rounded-md hover:bg-white/10 grid place-items-center">
              <X className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { l: "Sent", v: counts.sent, c: "#A78BFA" },
              { l: "Delivered", v: counts.delivered, c: "#06B6D4" },
              { l: "Opened", v: counts.opened, c: "#F59E0B" },
              { l: "Clicked", v: counts.clicked, c: "#10B981" },
            ].map((s) => (
              <div key={s.l} className="rounded-lg bg-white/5 px-2 py-3">
                <div className="text-[9px] mono uppercase tracking-widest text-white/50">{s.l}</div>
                <div className="mt-1 text-xl font-bold mono" style={{ color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {feed.map((r, i) => (
              <motion.div
                key={r.msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/5"
                style={{ opacity: 1 - i * 0.02 }}
              >
                <span className="text-xs flex-1 truncate">{r.cust?.name ?? "—"}</span>
                <PersonaBadge persona={r.cust?.persona} />
                <motion.span
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-[9px] mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ background: statusColor(r.status) + "33", color: statusColor(r.status) }}
                >
                  {r.status}
                </motion.span>
              </motion.div>
            ))}
          </div>

          {done && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 text-center">
              <div className="text-xl font-bold">Campaign Complete</div>
              {best && (
                <div className="text-sm" style={{ color: "#10B981" }}>
                  Best performing persona: {best.persona} with {best.rate}% open rate
                </div>
              )}
              <div className="flex items-center justify-center gap-2 pt-1">
                <button onClick={onClose} className="px-4 py-2 rounded-full bg-white/10 text-sm hover:bg-white/15">Close</button>
                {onRunSimilar && (
                  <button onClick={onRunSimilar} className="px-4 py-2 rounded-full bg-[#7C3AED] text-sm font-semibold hover:bg-[#6D28D9]">
                    Run Similar Campaign →
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function statusColor(s: string) {
  return s === "clicked" ? "#10B981" : s === "opened" ? "#06B6D4" : s === "delivered" ? "#A78BFA" : s === "failed" ? "#F43F5E" : "#9CA3AF";
}

export function ReplayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md hover:bg-[#7C3AED]/10"
      style={{ color: "#7C3AED" }}
    >
      <Play className="size-3" fill="#7C3AED" />
      Replay
    </button>
  );
}
