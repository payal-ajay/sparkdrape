import { type ReactNode } from "react";
import { Search, Bell, ChevronDown } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function AppShell({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background" data-app>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-8 flex items-center justify-between bg-background sticky top-0 z-20 border-b border-[color:var(--surface-2)]">
          <h1 className="text-xl font-bold tracking-tight text-[color:var(--ink)]">{title}</h1>
          <div className="flex items-center gap-2">
            {action}
            <button className="size-9 rounded-full grid place-items-center text-muted-foreground hover:bg-[color:var(--secondary)] transition-colors" aria-label="Search">
              <Search className="size-[18px]" strokeWidth={1.75} />
            </button>
            <button className="size-9 rounded-full grid place-items-center text-muted-foreground hover:bg-[color:var(--secondary)] transition-colors relative" aria-label="Notifications">
              <Bell className="size-[18px]" strokeWidth={1.75} />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[color:var(--rose)]" />
            </button>
            <button className="ml-2 flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-[color:var(--secondary)] transition-colors">
              <span className="size-7 rounded-full bg-gradient-to-br from-[color:var(--violet)] to-[color:var(--cyan)] grid place-items-center text-[10px] font-semibold text-white">DR</span>
              <span className="text-sm font-medium text-[color:var(--ink)]">DRAPE</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
          </div>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
