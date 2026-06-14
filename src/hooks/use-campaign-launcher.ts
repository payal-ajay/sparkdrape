import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { buildCampaignFromCard, type AgentCardSpec } from "@/lib/spark-agent.functions";
import { launchCampaign, processCampaignTick } from "@/lib/simulate-channel.functions";

// Shared end-to-end launcher: build segment → create campaign + messages →
// flip campaign live → tick simulation in background → navigate to Campaigns
// so the user sees the full workflow play out.
export function useCampaignLauncher() {
  const build = useServerFn(buildCampaignFromCard);
  const launch = useServerFn(launchCampaign);
  const tick = useServerFn(processCampaignTick);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function launchPreset(card: AgentCardSpec, opts?: { navigateToCampaigns?: boolean }) {
    if (busy) return null;
    setBusy(true);
    const id = toast.loading("Building segment & messages…");
    try {
      const built = (await build({ data: { card } })) as { ok: boolean; campaign_id: string; segment_id: string; total: number };
      await launch({ data: { campaignId: built.campaign_id } });
      toast.success(`Campaign live — ${built.total} recipients`, { id });
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, colors: ["#7C3AED", "#06B6D4", "#F59E0B"] });
      // Drive simulation in background
      (async () => {
        for (let i = 0; i < 30; i++) {
          const r = (await tick({ data: { campaignId: built.campaign_id } })) as { done: boolean };
          if (r.done) break;
          await new Promise((res) => setTimeout(res, 1500));
        }
      })();
      if (opts?.navigateToCampaigns) {
        setTimeout(() => navigate({ to: "/campaigns" }), 600);
      }
      return built;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Launch failed", { id });
      return null;
    } finally {
      setBusy(false);
    }
  }

  return { launchPreset, busy };
}
