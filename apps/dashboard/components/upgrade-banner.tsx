"use client";

import { useSubscription, useCheckout } from "@/lib/hooks/use-subscription";

export function UpgradeBanner() {
  const { data: usage } = useSubscription();
  const checkout = useCheckout();

  if (!usage || usage.plan === "team") return null;

  const warnings: string[] = [];

  const checkLimit = (label: string, used: number, limit: number | null) => {
    if (limit === null || limit === Infinity) return;
    const pct = (used / limit) * 100;
    if (pct >= 80) warnings.push(`${Math.round(pct)}% of ${label.toLowerCase()}`);
  };

  checkLimit("Projects", usage.projects.used, usage.projects.limit);
  checkLimit("Jobs", usage.jobs.used, usage.jobs.limit);
  checkLimit("Executions", usage.executions.used, usage.executions.limit);

  if (warnings.length === 0) return null;

  const nextPlan = usage.plan === "free" ? "pro" : "team";

  return (
    <div className="mx-2 mb-2 p-3 rounded-lg" style={{ backgroundColor: "rgba(212, 165, 116, 0.08)" }}>
      <p className="text-[11px] mb-2" style={{ color: "#d4a574" }}>
        You&apos;ve used {warnings.join(", ")}.
      </p>
      <button
        onClick={() => checkout.mutate(nextPlan as "pro" | "team")}
        disabled={checkout.isPending}
        className="text-[11px] font-medium w-full py-1.5 rounded-md transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#d4a574", color: "#000" }}
      >
        {checkout.isPending ? "..." : `Upgrade to ${nextPlan}`}
      </button>
    </div>
  );
}
