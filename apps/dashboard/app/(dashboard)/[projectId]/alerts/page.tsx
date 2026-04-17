import { Bell } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function AlertsPage() {
  return (
    <div>
      <PageHeader title="Alerts" />
      <div className="p-6">
        <EmptyState icon={Bell} title="No alerts configured" description="Set up alert rules to get notified of failures." />
      </div>
    </div>
  );
}
