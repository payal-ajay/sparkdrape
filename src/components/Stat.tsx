import CountUp from "react-countup";

export function Stat({ value, label, prefix, suffix, decimals = 0, color }: {
  value: number; label: string; prefix?: string; suffix?: string; decimals?: number; color?: string;
}) {
  return (
    <div className="surface-hover px-6 py-5">
      <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-[#9CA3AF]">{label}</div>
      <div className="mt-2 text-[32px] font-bold leading-none" style={{ color: color ?? "#111118" }}>
        {prefix}
        <CountUp end={value} duration={1.4} separator="," decimals={decimals} />
        {suffix}
      </div>
    </div>
  );
}
