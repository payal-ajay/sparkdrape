import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { AgentChat } from "@/components/AgentChat";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Agent — SPARK by DRAPE" },
      { name: "description", content: "Agentic marketing platform for premium Indian fashion brands." },
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
