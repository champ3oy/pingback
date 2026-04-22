import Image from "next/image";
import { GridSection } from "./grid-section";

export function DashboardPreview() {
  return (
    <GridSection>
      <div className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-3">
          See every execution in real time
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Trace runs from trigger to completion — with logs, timing, output, and
          retry history in one view.
        </p>
      </div>
      <div className="px-8 pb-8">
        <div className="rounded-lg border overflow-hidden">
          <Image
            src="/dashboard.png"
            alt="Pingback dashboard showing execution history, structured logs, trace timeline, and JSON output for a cron job run"
            width={2560}
            height={1440}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>
    </GridSection>
  );
}
