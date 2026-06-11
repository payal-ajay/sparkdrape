import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Database, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { seedDemoData } from "@/lib/seed-data.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — SPARK" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const seed = useServerFn(seedDemoData);
  const [seeding, setSeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [counts, setCounts] = useState<{customers: number; orders: number; campaigns: number}>({ customers: 0, orders: 0, campaigns: 0 });

  async function refresh() {
    const [c, o, ca] = await Promise.all([
      supabase.from("customers").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("campaigns").select("*", { count: "exact", head: true }),
    ]);
    setCounts({ customers: c.count ?? 0, orders: o.count ?? 0, campaigns: ca.count ?? 0 });
  }

  useEffect(() => { refresh(); }, []);

  async function runSeed() {
    setSeeding(true); setProgress(5);
    const t = setInterval(() => setProgress(p => Math.min(p + Math.random() * 8, 92)), 400);
    try {
      const r = await seed({}) as { customers: number; orders: number };
      clearInterval(t); setProgress(100);
      toast.success(`Seeded ${r.customers} shoppers · ${r.orders} orders`);
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 }, colors: ["#7C3AED","#06B6D4","#F59E0B","#10B981"] });
      await refresh();
    } catch (e) {
      clearInterval(t);
      toast.error(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setTimeout(() => { setSeeding(false); setProgress(0); }, 1200);
    }
  }

  return (
    <AppShell title="Settings">
      <div className="p-8 max-w-3xl space-y-6">
        <div className="surface p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-md bg-[color:var(--violet)]/10 grid place-items-center text-[color:var(--violet)]"><Database className="size-5" /></div>
            <div className="flex-1">
              <h2 className="font-semibold">Seed demo data</h2>
              <p className="text-sm text-muted-foreground mt-1">Populates DRAPE with 300 Indian shoppers across all 5 personas, their order history, and loyalty events. Wipes existing campaigns and messages.</p>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <Tile label="Shoppers" value={counts.customers} />
                <Tile label="Orders" value={counts.orders} />
                <Tile label="Campaigns" value={counts.campaigns} />
              </div>
              {seeding && (
                <div className="mt-4 h-1 rounded-full bg-[color:var(--violet)]/10 overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-[color:var(--violet)] to-[color:var(--cyan)]"
                    initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                </div>
              )}
              <button onClick={runSeed} disabled={seeding}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[color:var(--violet)] text-white text-sm font-medium disabled:opacity-50 hover:shadow-[0_0_24px_-6px_var(--violet)] transition-all">
                <Sparkles className="size-4" />
                {seeding ? "Seeding…" : "Seed DRAPE demo data"}
              </button>
            </div>
          </div>
        </div>

        <div className="surface p-6">
          <h2 className="font-semibold flex items-center gap-2"><Trash2 className="size-4 text-[color:var(--rose)]" /> About</h2>
          <p className="text-sm text-muted-foreground mt-2">SPARK is a campaign intelligence platform for Indian fashion brands. Agent built on Lovable AI Gateway · Gemini 3 Flash · realtime via Lovable Cloud.</p>
        </div>
      </div>
    </AppShell>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-[color:var(--violet)]/5 border border-[color:var(--surface-2)] px-3 py-2.5">
      <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-lg font-bold mono mt-0.5">{value.toLocaleString()}</div>
    </div>
  );
}
