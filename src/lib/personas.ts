export type Persona = "Trend Chaser" | "Discount Hunter" | "Loyalist" | "Lapsed High-Value" | "New Shopper";
export type Channel = "whatsapp" | "email" | "sms";
export type LoyaltyTier = "Fan" | "Muse" | "Icon";

export const PERSONAS: Persona[] = ["Trend Chaser", "Discount Hunter", "Loyalist", "Lapsed High-Value", "New Shopper"];

export const personaColor: Record<Persona, string> = {
  "Trend Chaser": "var(--cyan)",
  "Discount Hunter": "var(--amber)",
  "Loyalist": "var(--emerald)",
  "Lapsed High-Value": "var(--rose)",
  "New Shopper": "var(--violet)",
};

export const personaClass: Record<Persona, string> = {
  "Trend Chaser": "text-[color:var(--cyan)] bg-[color:var(--cyan)]/10 border-[color:var(--cyan)]/30",
  "Discount Hunter": "text-[color:var(--amber)] bg-[color:var(--amber)]/10 border-[color:var(--amber)]/30",
  "Loyalist": "text-[color:var(--emerald)] bg-[color:var(--emerald)]/10 border-[color:var(--emerald)]/30",
  "Lapsed High-Value": "text-[color:var(--rose)] bg-[color:var(--rose)]/10 border-[color:var(--rose)]/30",
  "New Shopper": "text-[color:var(--violet)] bg-[color:var(--violet)]/10 border-[color:var(--violet)]/30",
};

export const tierClass: Record<LoyaltyTier, string> = {
  Fan: "text-slate-300 bg-slate-700/30 border-slate-600/40",
  Muse: "text-[color:var(--cyan)] bg-[color:var(--cyan)]/10 border-[color:var(--cyan)]/30",
  Icon: "text-[color:var(--gold)] bg-[color:var(--gold)]/10 border-[color:var(--gold)]/40",
};

export const TIER_THRESHOLD = { Fan: 0, Muse: 1000, Icon: 5000 } as const;

export function tierFromPoints(p: number): LoyaltyTier {
  if (p >= 5000) return "Icon";
  if (p >= 1000) return "Muse";
  return "Fan";
}

export function inr(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function channelIcon(c: Channel) {
  if (c === "whatsapp") return { label: "WhatsApp", color: "var(--emerald)" };
  if (c === "email") return { label: "Email", color: "var(--cyan)" };
  return { label: "SMS", color: "var(--amber)" };
}
