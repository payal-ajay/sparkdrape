import { BarChart3 } from "lucide-react";

export function EmptyChart({ title, height = 260 }: { title: string; height?: number }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6" style={{ height }}>
      <div className="size-12 rounded-full grid place-items-center mb-3" style={{ background: "#F4F4F0", color: "#9CA3AF" }}>
        <BarChart3 className="size-5" strokeWidth={1.5} />
      </div>
      <div className="text-sm font-medium" style={{ color: "#374151" }}>
        {title} will appear after your first campaign
      </div>
      <div className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
        Launch a campaign from the Agent to see data here
      </div>
    </div>
  );
}
