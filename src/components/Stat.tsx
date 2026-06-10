import CountUp from "react-countup";

export function Stat({ value, label, prefix, suffix, decimals = 0, color }: {
  value: number; label: string; prefix?: string; suffix?: string; decimals?: number; color?: string;
}) {
  return (
    <div className="surface px-5 py-4">
      <div className="text-[10px] uppercase mono tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold mono" style={color ? { color } : undefined}>
        {prefix}
        <CountUp end={value} duration={1.4} separator="," decimals={decimals} />
        {suffix}
      </div>
    </div>
  );
}
