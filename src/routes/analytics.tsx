import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Stat } from "@/components/Stat";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Skel } from "@/components/ui-bits";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — SPARK" }] }),
  component: AnalyticsPage,
});

const PERSONA_COLORS: Record<string, string> = {
  "Trend Chaser": "#06B6D4",
  "Discount Hunter": "#F59E0B",
  "Loyalist": "#10B981",
  "Lapsed High-Value": "#F43F5E",
  "New Shopper": "#7C3AED",
};

function AnalyticsPage() {
  const [data, setData] = useState<{
    totalCustomers: number; activeCampaigns: number; avgOpen: number; avgClick: number;
    totalPoints: number; iconCount: number;
    personas: { name: string; value: number }[];
    channels: { name: string; openRate: number }[];
    types: { name: string; openRate: number; clickRate: number }[];
    cities: { name: string; value: number }[];
  } | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: cust }, { data: camps }] = await Promise.all([
        supabase.from("customers").select("persona, city, loyalty_tier, loyalty_points"),
        supabase.from("campaigns").select("status, channel, campaign_type, sent_count, opened_count, clicked_count"),
      ]);
      const personaMap: Record<string, number> = {};
      const cityMap: Record<string, number> = {};
      let totalPoints = 0, iconCount = 0;
      for (const c of cust ?? []) {
        personaMap[c.persona ?? "?"] = (personaMap[c.persona ?? "?"] ?? 0) + 1;
        cityMap[c.city ?? "?"] = (cityMap[c.city ?? "?"] ?? 0) + 1;
        totalPoints += c.loyalty_points ?? 0;
        if (c.loyalty_tier === "Icon") iconCount++;
      }
      const channelMap: Record<string, { sent: number; opened: number }> = {};
      const typeMap: Record<string, { sent: number; opened: number; clicked: number }> = {};
      let totalSent = 0, totalOpened = 0, totalClicked = 0, activeCount = 0;
      for (const c of camps ?? []) {
        if (c.status === "live") activeCount++;
        const s = c.sent_count ?? 0, o = c.opened_count ?? 0, ck = c.clicked_count ?? 0;
        totalSent += s; totalOpened += o; totalClicked += ck;
        const ch = c.channel ?? "?";
        channelMap[ch] = channelMap[ch] ?? { sent: 0, opened: 0 };
        channelMap[ch].sent += s; channelMap[ch].opened += o;
        const t = c.campaign_type ?? "standard";
        typeMap[t] = typeMap[t] ?? { sent: 0, opened: 0, clicked: 0 };
        typeMap[t].sent += s; typeMap[t].opened += o; typeMap[t].clicked += ck;
      }
      setData({
        totalCustomers: cust?.length ?? 0,
        activeCampaigns: activeCount,
        avgOpen: totalSent ? Math.round((totalOpened / totalSent) * 100) : 0,
        avgClick: totalSent ? Math.round((totalClicked / totalSent) * 100) : 0,
        totalPoints, iconCount,
        personas: Object.entries(personaMap).map(([name, value]) => ({ name, value })),
        channels: Object.entries(channelMap).map(([name, v]) => ({ name, openRate: v.sent ? Math.round((v.opened / v.sent) * 100) : 0 })),
        types: Object.entries(typeMap).map(([name, v]) => ({ name, openRate: v.sent ? Math.round((v.opened / v.sent) * 100) : 0, clickRate: v.sent ? Math.round((v.clicked / v.sent) * 100) : 0 })),
        cities: Object.entries(cityMap).sort((a,b) => b[1]-a[1]).map(([name, value]) => ({ name, value })),
      });
    })();
  }, []);

  if (!data) {
    return <AppShell title="Analytics"><div className="p-8 grid grid-cols-3 gap-3">{Array.from({length:6}).map((_,i)=><Skel key={i} className="h-24" />)}</div></AppShell>;
  }

  return (
    <AppShell title="Analytics">
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat label="Shoppers" value={data.totalCustomers} />
          <Stat label="Live Campaigns" value={data.activeCampaigns} color="var(--violet)" />
          <Stat label="Avg Open" value={data.avgOpen} suffix="%" color="var(--cyan)" />
          <Stat label="Avg Click" value={data.avgClick} suffix="%" color="var(--emerald)" />
          <Stat label="Loyalty Pts" value={data.totalPoints} />
          <Stat label="Icon Tier" value={data.iconCount} color="var(--gold)" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Persona distribution">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.personas} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} stroke="none">
                  {data.personas.map((p) => <Cell key={p.name} fill={PERSONA_COLORS[p.name] ?? "#7C3AED"} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid #1A1A2E", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Channel open-rate">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.channels}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid #1A1A2E", borderRadius: 8 }} />
                <Bar dataKey="openRate" fill="#06B6D4" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Campaign type effectiveness">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.types}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid #1A1A2E", borderRadius: 8 }} />
                <Bar dataKey="openRate" fill="#7C3AED" radius={[6,6,0,0]} />
                <Bar dataKey="clickRate" fill="#10B981" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Shoppers by city">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.cities} layout="vertical">
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} width={80} />
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid #1A1A2E", borderRadius: 8 }} />
                <Bar dataKey="value" fill="#F59E0B" radius={[0,6,6,0]} />
              </BarChart>
            </ResponsiveContainer>
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
