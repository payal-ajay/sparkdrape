import { type ReactNode } from "react";
import { Search, Bell, ChevronDown, Zap } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function AppShell({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "#F4F4F0" }} data-app>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-8 flex items-center justify-between sticky top-0 z-20" style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E7EB" }}>
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: "#111118" }}>{title}</h1>
          <div className="flex items-center gap-2">
            {action}
            <button className="size-9 rounded-full grid place-items-center hover:bg-[#F4F4F0] transition-colors" style={{ color: "#6B7280" }} aria-label="Search">
              <Search className="size-5" strokeWidth={1.75} />
            </button>
            <button className="size-9 rounded-full grid place-items-center hover:bg-[#F4F4F0] transition-colors relative" style={{ color: "#6B7280" }} aria-label="Notifications">
              <Bell className="size-5" strokeWidth={1.75} />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full" style={{ background: "#F43F5E" }} />
            </button>
            <button
              className="ml-2 flex items-center gap-2 pl-2 pr-3 h-8 rounded-[20px] transition-all hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #1A0533, #3B0764)",
                border: "1px solid #4C1D95",
              }}
            >
              <Zap className="size-4" style={{ color: "#A78BFA" }} strokeWidth={2.5} fill="#A78BFA" />
              <span className="text-[13px] font-semibold text-white" style={{ letterSpacing: "0.05em" }}>DRAPE</span>
              <ChevronDown className="size-3.5" style={{ color: "#A78BFA" }} />
            </button>
          </div>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
