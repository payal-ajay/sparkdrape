import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { AgentChat } from "@/components/AgentChat";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SPARK by DRAPE — Campaign Intelligence" },
      { name: "description", content: "Agentic marketing platform for premium Indian fashion brands. Read your shoppers, write campaigns that land." },
    ],
  }),
  component: AgentPage,
});

function AgentPage() {
  return (
    <AppShell title="Agent">
      <AgentChat />
    </AppShell>
  );
}
