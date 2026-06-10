import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export function AppShell({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen" data-app>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 px-6 flex items-center justify-between border-b border-[color:var(--surface-2)] glass sticky top-0 z-20">
          <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
          <div>{action}</div>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
