import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/40",
  paused: "bg-yellow-500/10 text-yellow-500 border-yellow-500/40",
  inactive: "bg-zinc-500/10 text-zinc-500 border-zinc-500/40",
  success: "bg-green-500/10 text-green-500 border-green-500/40",
  failed: "bg-red-500/10 text-red-500 border-red-500/40",
  running: "bg-blue-500/10 text-blue-500 border-blue-500/40",
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/40",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-normal capitalize", statusStyles[status] || "")}
    >
      {status}
    </Badge>
  );
}
