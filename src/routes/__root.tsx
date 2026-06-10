import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SPARK by DRAPE" },
      { name: "description", content: "Campaign intelligence platform for Indian fashion brands." },
      { name: "theme-color", content: "#0A0A0F" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorComp,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body><div id="app">{children}</div><Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: "rgba(17,17,24,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(124,58,237,0.3)", color: "#F8FAFC" } }} />
    </QueryClientProvider>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center space-y-3">
        <div className="text-6xl font-bold mono text-[color:var(--violet)]">404</div>
        <div className="text-muted-foreground">This route doesn't exist yet.</div>
        <a href="/" className="inline-block text-sm text-[color:var(--violet)] hover:underline">← Back to SPARK</a>
      </div>
    </div>
  );
}

function ErrorComp({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="surface p-6 max-w-md text-center space-y-3">
        <div className="text-sm font-semibold">Something flickered.</div>
        <div className="text-xs text-muted-foreground">{error.message}</div>
        <button onClick={reset} className="text-xs text-[color:var(--violet)] hover:underline">Try again</button>
      </div>
    </div>
  );
}
