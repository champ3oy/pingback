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
    <div className="mx-4 mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
      <p className="text-xs text-amber-600 dark:text-amber-400">
        You&apos;ve used {warnings.join(", ")}. Consider upgrading for higher limits.
      </p>
      <button
        onClick={() => checkout.mutate(nextPlan as "pro" | "team")}
        disabled={checkout.isPending}
        className="text-xs font-medium px-3 py-1 rounded-full bg-amber-500 text-white hover:bg-amber-600 transition-colors shrink-0 ml-3"
      >
        {checkout.isPending ? "..." : `Upgrade to ${nextPlan}`}
      </button>
    </div>
  );
}
