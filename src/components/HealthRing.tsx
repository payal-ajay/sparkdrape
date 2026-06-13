export function HealthRing({ score, size = 28 }: { score: number; size?: number }) {
  const s = Math.max(0, Math.min(100, Math.round(score || 0)));
  const color = s <= 30 ? "#F43F5E" : s <= 60 ? "#F59E0B" : s <= 80 ? "#06B6D4" : "#10B981";
  const stroke = Math.max(2, size / 10);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (s / 100) * c;
  const fontSize = Math.max(9, Math.round(size * 0.32));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#E5E7EB" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center font-bold mono" style={{ color, fontSize }}>
        {s}
      </div>
    </div>
  );
}

export function healthLabel(score: number) {
  if (score <= 30) return { label: "At Risk", color: "#F43F5E" };
  if (score <= 60) return { label: "Needs Attention", color: "#F59E0B" };
  if (score <= 80) return { label: "Healthy", color: "#06B6D4" };
  return { label: "Champion", color: "#10B981" };
}

export function healthBreakdown(c: {
  days_since_last_order: number | null;
  order_count: number | null;
  total_spent: number | null;
  loyalty_tier: string | null;
  last_review_rating: number | null;
  try_on_items: string[] | null;
  referral_count?: number | null;
}) {
  const d = c.days_since_last_order;
  const recency = d == null ? 0 : d <= 30 ? 30 : d <= 60 ? 20 : d <= 90 ? 10 : 0;
  const oc = c.order_count ?? 0;
  const frequency = oc < 1 ? 0 : oc === 1 ? 5 : oc <= 3 ? 10 : oc <= 6 ? 18 : oc <= 10 ? 22 : 25;
  const ts = c.total_spent ?? 0;
  const monetary = ts < 2000 ? 5 : ts < 8000 ? 12 : ts < 20000 ? 20 : 25;
  const loyalty = c.loyalty_tier === "Icon" ? 10 : c.loyalty_tier === "Muse" ? 6 : c.loyalty_tier === "Fan" ? 2 : 0;
  const engagement =
    ((c.last_review_rating ?? 0) >= 4 ? 5 : 0) +
    (c.try_on_items && c.try_on_items.length ? 3 : 0) +
    ((c.referral_count ?? 0) > 0 ? 2 : 0);
  return { recency, frequency, monetary, loyalty, engagement };
}
