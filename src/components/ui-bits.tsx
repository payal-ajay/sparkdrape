export function Skel({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-md ${className}`} />;
}

export function PersonaBadge({ persona, className = "" }: { persona: string | null | undefined; className?: string }) {
  const map: Record<string, string> = {
    "Trend Chaser": "text-[color:var(--cyan)] bg-[color:var(--cyan)]/10 border-[color:var(--cyan)]/30",
    "Discount Hunter": "text-[color:var(--amber)] bg-[color:var(--amber)]/10 border-[color:var(--amber)]/30",
    "Loyalist": "text-[color:var(--emerald)] bg-[color:var(--emerald)]/10 border-[color:var(--emerald)]/30",
    "Lapsed High-Value": "text-[color:var(--rose)] bg-[color:var(--rose)]/10 border-[color:var(--rose)]/30",
    "New Shopper": "text-[color:var(--violet)] bg-[color:var(--violet)]/10 border-[color:var(--violet)]/30",
  };
  const cls = map[persona ?? ""] ?? "text-muted-foreground bg-[color:var(--violet)]/10 border-[color:var(--surface-2)]";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] mono uppercase tracking-wider border ${cls} ${className}`}>{persona ?? "—"}</span>;
}

export function TierBadge({ tier }: { tier: string | null | undefined }) {
  const map: Record<string, string> = {
    Fan: "text-[#6B7280] bg-transparent border-[#E5E7EB]",
    Muse: "text-[#374151] bg-[#E5E7EB] border-[#E5E7EB]",
    Icon: "text-white bg-[#F59E0B] border-[#F59E0B]",
  };
  const cls = map[tier ?? "Fan"] ?? map.Fan;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] mono uppercase tracking-wider border ${cls}`}>
    {tier ?? "Fan"}
  </span>;
}

export function ChannelDot({ channel }: { channel: string | null | undefined }) {
  const color = channel === "whatsapp" ? "var(--emerald)" : channel === "email" ? "var(--cyan)" : "var(--amber)";
  return <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
    <span className="size-1.5 rounded-full" style={{ background: color }} />
    {channel ?? "—"}
  </span>;
}
