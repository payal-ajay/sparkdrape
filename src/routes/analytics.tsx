import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Stat } from "@/components/Stat";
import { supabase } from "@/integrations/supabase/client";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, LabelList, Legend,
} from "recharts";
import { Skel } from "@/components/ui-bits";
import { EmptyChart } from "@/components/EmptyChart";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — SPARK" }] }),
  component: AnalyticsPage,
});

const PERSONA_COLORS: Record<string, string> = {
  "Trend Chaser": "#06B6D4",
  "Discount Hunter": "#F59E0B",
  Loyalist: "#10B981",
  "Lapsed High-Value": "#F43F5E",
  "New Shopper": "#7C3AED",
};

const CHANNEL_COLORS: Record<string, string> = { whatsapp: "#10B981", email: "#06B6D4", sms: "#F59E0B" };

interface Data {
  totalCustomers: number;
  activeCampaigns: number;
  avgOpen: number;
  avgClick: number;
  totalPoints: number;
  iconCount: number;
  personas: { name: string; value: number }[];
  channels: { name: string; openRate: number; raw: string }[];
  types: { name: string; openRate: number; clickRate: number }[];
  cities: { name: string; value: number }[];
  health: { name: string; value: number; color: string }[];
}

function AnalyticsPage() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: cust, error: cerr }, { data: camps, error: cmerr }, { data: msgs, error: merr }] = await Promise.all([
          supabase.from("customers").select("persona, city, loyalty_tier, loyalty_points, health_score"),
          supabase.from("campaigns").select("id, status, channel, campaign_type, sent_count, opened_count, clicked_count"),
          supabase.from("messages").select("channel, status, campaign_id"),
        ]);
        if (cerr) console.error("[analytics] customers fetch", cerr);
        if (cmerr) console.error("[analytics] campaigns fetch", cmerr);
        if (merr) console.error("[analytics] messages fetch", merr);

        // Personas (always from customers)
        const personaMap: Record<string, number> = {};
        const cityMap: Record<string, number> = {};
        const healthBands = { "At Risk": 0, "Needs Attention": 0, Healthy: 0, Champion: 0 };
        let totalPoints = 0, iconCount = 0;
        for (const c of cust ?? []) {
          if (c.persona) personaMap[c.persona] = (personaMap[c.persona] ?? 0) + 1;
          if (c.city) cityMap[c.city] = (cityMap[c.city] ?? 0) + 1;
          totalPoints += c.loyalty_points ?? 0;
          if (c.loyalty_tier === "Icon") iconCount++;
          const s = c.health_score ?? 0;
          if (s <= 30) healthBands["At Risk"]++;
          else if (s <= 60) healthBands["Needs Attention"]++;
          else if (s <= 80) healthBands.Healthy++;
          else healthBands.Champion++;
        }

        // Channel open-rate from messages
        const channelAgg: Record<string, { sent: number; opened: number }> = {};
        let totalSent = 0, totalOpened = 0, totalClicked = 0;
        for (const m of msgs ?? []) {
          const ch = m.channel ?? "?";
          channelAgg[ch] = channelAgg[ch] ?? { sent: 0, opened: 0 };
          channelAgg[ch].sent++;
          if (m.status === "opened" || m.status === "clicked") channelAgg[ch].opened++;
          totalSent++;
          if (m.status === "opened" || m.status === "clicked") totalOpened++;
          if (m.status === "clicked") totalClicked++;
        }

        // Campaign type effectiveness from messages joined with campaigns
        const typeMap = new Map<string, string>();
        for (const c of camps ?? []) typeMap.set(c.id, c.campaign_type ?? "standard");
        const typeAgg: Record<string, { sent: number; opened: number; clicked: number }> = {};
        for (const m of msgs ?? []) {
          const t = (m.campaign_id && typeMap.get(m.campaign_id)) || "standard";
          typeAgg[t] = typeAgg[t] ?? { sent: 0, opened: 0, clicked: 0 };
          typeAgg[t].sent++;
          if (m.status === "opened" || m.status === "clicked") typeAgg[t].opened++;
          if (m.status === "clicked") typeAgg[t].clicked++;
        }

        const activeCount = (camps ?? []).filter((c) => c.status === "live").length;

        setData({
          totalCustomers: cust?.length ?? 0,
          activeCampaigns: activeCount,
          avgOpen: totalSent ? Math.round((totalOpened / totalSent) * 100) : 0,
          avgClick: totalSent ? Math.round((totalClicked / totalSent) * 100) : 0,
          totalPoints,
          iconCount,
          personas: Object.entries(personaMap).map(([name, value]) => ({ name, value })),
          channels: Object.entries(channelAgg).map(([raw, v]) => ({
            name: raw === "whatsapp" ? "WhatsApp" : raw === "email" ? "Email" : raw === "sms" ? "SMS" : raw,
            openRate: v.sent ? Math.round((v.opened / v.sent) * 1000) / 10 : 0,
            raw,
          })),
          types: Object.entries(typeAgg).map(([name, v]) => ({
            name,
            openRate: v.sent ? Math.round((v.opened / v.sent) * 1000) / 10 : 0,
            clickRate: v.sent ? Math.round((v.clicked / v.sent) * 1000) / 10 : 0,
          })),
          cities: Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value })),
          health: [
            { name: "At Risk", value: healthBands["At Risk"], color: "#F43F5E" },
            { name: "Needs Attention", value: healthBands["Needs Attention"], color: "#F59E0B" },
            { name: "Healthy", value: healthBands.Healthy, color: "#06B6D4" },
            { name: "Champion", value: healthBands.Champion, color: "#10B981" },
          ],
        });
      } catch (e) {
        console.error("[analytics] fatal", e);
      }
    })();
  }, []);

  if (!data) {
    return (
      <AppShell title="Analytics">
        <div className="p-8 grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skel key={i} className="h-24" />)}
        </div>
      </AppShell>
    );
  }

  const isAllZero = (arr: { value?: number; openRate?: number; clickRate?: number }[]) =>
    !arr.length || arr.every((d) => !(d.value || d.openRate || d.clickRate));

  return (
    <AppShell title="Analytics">
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat label="Shoppers" value={data.totalCustomers} />
          <Stat label="Live Campaigns" value={data.activeCampaigns} color="#7C3AED" />
          <Stat label="Avg Open" value={data.avgOpen} suffix="%" color="#06B6D4" />
          <Stat label="Avg Click" value={data.avgClick} suffix="%" color="#10B981" />
          <Stat label="Loyalty Pts" value={data.totalPoints} />
          <Stat label="Icon Tier" value={data.iconCount} color="#D4AF37" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Persona distribution">
            {isAllZero(data.personas) ? (
              <EmptyChart title="Persona distribution" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data.personas} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} stroke="none">
                    {data.personas.map((p) => <Cell key={p.name} fill={PERSONA_COLORS[p.name] ?? "#7C3AED"} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="Channel open-rate">
            {isAllZero(data.channels) ? (
              <EmptyChart title="Channel open-rate" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.channels} margin={{ top: 24, right: 12, bottom: 8, left: 0 }}>
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} />
                  <YAxis stroke="#9CA3AF" fontSize={11} unit="%" />
                  <Tooltip />
                  <Bar dataKey="openRate" radius={[6, 6, 0, 0]}>
                    {data.channels.map((c) => <Cell key={c.raw} fill={CHANNEL_COLORS[c.raw] ?? "#7C3AED"} />)}
                    <LabelList dataKey="openRate" position="top" formatter={(v: number) => `${v}%`} style={{ fontSize: 11, fill: "#374151" }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="Campaign type effectiveness">
            {isAllZero(data.types) ? (
              <EmptyChart title="Campaign type effectiveness" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.types} margin={{ top: 8, right: 12, bottom: 24, left: 0 }}>
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} />
                  <YAxis stroke="#9CA3AF" fontSize={11} unit="%" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="openRate" name="Open %" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="clickRate" name="Click %" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="Shoppers by city">
            {isAllZero(data.cities) ? (
              <EmptyChart title="Shoppers by city" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.cities} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                  <XAxis type="number" stroke="#9CA3AF" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={11} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#F59E0B" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="Customer health distribution">
            <div className="space-y-3 pt-4">
              <div className="flex h-3 rounded-full overflow-hidden bg-[#F4F4F0]">
                {(() => {
                  const total = data.health.reduce((a, b) => a + b.value, 0) || 1;
                  return data.health.map((h) => (
                    <div key={h.name} title={`${h.name}: ${h.value}`} style={{ width: `${(h.value / total) * 100}%`, background: h.color, transition: "width 700ms ease" }} />
                  ));
                })()}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                {data.health.map((h) => (
                  <div key={h.name} className="flex items-center gap-2 text-xs">
                    <span className="size-2 rounded-full" style={{ background: h.color }} />
                    <span className="text-[#374151]">{h.name}</span>
                    <span className="ml-auto mono font-semibold" style={{ color: h.color }}>{h.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface p-5">
      <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground mb-4">{title}</div>
      {children}
    </div>
  );
}
