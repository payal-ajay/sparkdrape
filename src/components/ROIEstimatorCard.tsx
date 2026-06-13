import CountUp from "react-countup";
import { inr } from "@/lib/personas";

export interface ROIData {
  recipients: number;
  expected_opens: number;
  expected_clicks: number;
  estimated_revenue: number;
  roi_multiplier: number;
  open_rate: number;
  click_rate: number;
}

export function computeROI(opts: {
  recipients: number;
  campaign_type?: string | null;
  avg_order_value: number;
}): ROIData {
  const t = opts.campaign_type ?? "standard";
  const rates: Record<string, { o: number; c: number }> = {
    standard: { o: 0.44, c: 0.2 },
    flash_drop: { o: 0.65, c: 0.35 },
    occasion: { o: 0.55, c: 0.25 },
    loyalty: { o: 0.7, c: 0.3 },
    challenge: { o: 0.5, c: 0.28 },
    contest: { o: 0.5, c: 0.28 },
    "re-engagement": { o: 0.38, c: 0.18 },
  };
  const r = rates[t] ?? rates.standard;
  const expected_opens = Math.round(opts.recipients * r.o);
  const expected_clicks = Math.round(expected_opens * r.c);
  const projected_converters = expected_clicks * 0.3;
  const estimated_revenue = Math.round(projected_converters * (opts.avg_order_value || 1800));
  const cost = Math.max(1, opts.recipients * 2);
  const roi_multiplier = +(estimated_revenue / cost).toFixed(1);
  return {
    recipients: opts.recipients,
    expected_opens,
    expected_clicks,
    estimated_revenue,
    roi_multiplier,
    open_rate: r.o,
    click_rate: r.c,
  };
}

export function ROIEstimatorCard({ roi }: { roi: ROIData }) {
  return (
    <div className="rounded-xl bg-white border border-[#E5E7EB] p-5 space-y-4">
      <div className="text-[11px] mono uppercase tracking-[0.08em]" style={{ color: "#9CA3AF" }}>
        Estimated Campaign Impact
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Box label="RECIPIENTS" value={<CountUp end={roi.recipients} duration={1.2} separator="," />} color="#111118" big />
        <Box
          label="EXPECTED OPENS"
          value={
            <>
              <CountUp end={roi.expected_opens} duration={1.4} separator="," />
              <span className="text-xs ml-1 font-medium" style={{ color: "#06B6D4" }}>
                {Math.round(roi.open_rate * 100)}%
              </span>
            </>
          }
          color="#06B6D4"
        />
        <Box
          label="EST. CLICKS"
          value={
            <>
              <CountUp end={roi.expected_clicks} duration={1.4} separator="," />
              <span className="text-xs ml-1 font-medium" style={{ color: "#7C3AED" }}>
                {Math.round(roi.click_rate * 100)}%
              </span>
            </>
          }
          color="#7C3AED"
        />
        <Box
          label="EST. REVENUE"
          value={<><span>₹</span><CountUp end={roi.estimated_revenue} duration={1.6} separator="," /></>}
          color="#10B981"
          big
        />
      </div>
      <div className="h-px bg-[#E5E7EB]" />
      <div className="text-xs" style={{ color: "#6B7280" }}>
        ROI estimate: <span className="font-semibold" style={{ color: "#111118" }}>{roi.roi_multiplier}×</span> return on messaging cost
      </div>
      <div className="text-[10px] italic" style={{ color: "#9CA3AF" }}>
        Based on historical persona performance averages
      </div>
    </div>
  );
}

function Box({ label, value, color, big }: { label: string; value: React.ReactNode; color: string; big?: boolean }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "#FAFAF8", border: "1px solid #F0F0EC" }}>
      <div className="text-[10px] mono uppercase tracking-widest" style={{ color: "#9CA3AF" }}>
        {label}
      </div>
      <div className={`mt-1 ${big ? "text-2xl" : "text-xl"} font-bold leading-tight`} style={{ color }}>
        {value}
      </div>
    </div>
  );
}

// Avoid unused-import warning if inr ever needed externally
export const _inr = inr;
