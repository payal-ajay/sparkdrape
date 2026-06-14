import { motion } from "motion/react";
import { Flame, Mail, Crown, ArrowRight, Sparkles } from "lucide-react";
import { SUGGESTED_CAMPAIGNS } from "@/lib/preset-campaigns";
import { useCampaignLauncher } from "@/hooks/use-campaign-launcher";

const ICONS = [Flame, Mail, Crown];
const ACCENTS = [
  { tint: "var(--tint-rose)",     accent: "var(--rose)" },
  { tint: "var(--tint-lavender)", accent: "var(--violet)" },
  { tint: "var(--tint-amber)",    accent: "var(--gold)" },
];

export function SuggestedCampaigns() {
  const { launchPreset, busy } = useCampaignLauncher();
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-[color:var(--violet)]" />
        <h2 className="text-sm font-semibold text-[#111118]">Suggested campaigns — ready to launch</h2>
        <span className="text-[11px] text-[#9CA3AF]">tuned to your seed customers</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SUGGESTED_CAMPAIGNS.map((card, i) => {
          const Icon = ICONS[i % ICONS.length];
          const { tint, accent } = ACCENTS[i % ACCENTS.length];
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-4 border bg-white flex flex-col gap-3"
              style={{ borderColor: `color-mix(in oklab, ${accent} 22%, transparent)`, background: tint }}
            >
              <div className="flex items-center gap-2">
                <span className="size-7 grid place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${accent} 20%, white)`, color: accent }}>
                  <Icon className="size-3.5" />
                </span>
                <span className="text-[10px] mono uppercase tracking-wider" style={{ color: accent }}>
                  {card.campaign_type?.replace("_", " ") ?? "campaign"}
                </span>
                <span className="text-[10px] mono uppercase text-[color:var(--ink)]/40 ml-auto">{card.channel}</span>
              </div>
              <div className="text-sm font-semibold leading-snug text-[color:var(--ink)]">{card.title}</div>
              <div className="text-xs text-[color:var(--ink)]/65 leading-relaxed">{card.description}</div>
              <button
                onClick={() => launchPreset(card, { navigateToCampaigns: true })}
                disabled={busy}
                className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-[color:var(--ink)] text-white hover:bg-[color:var(--ink)]/90 disabled:opacity-50 transition"
              >
                {card.cta_label ?? "Launch"} <ArrowRight className="size-3.5" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
