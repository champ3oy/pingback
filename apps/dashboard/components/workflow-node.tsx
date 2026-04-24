"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { StatusBadge } from "@/components/status-badge";
import { formatDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";

const statusDotColor: Record<string, string> = {
  success: "#a8b545",
  failed: "#d4734a",
  running: "#e8b44a",
  pending: "#e8b44a",
};

export interface WorkflowNodeData {
  id: string;
  functionName: string;
  type: string;
  status: "pending" | "running" | "success" | "failed";
  durationMs: number | null;
  attempt: number;
  maxRetries: number;
  parentId: string | null;
  jobId: string;
  isCurrent: boolean;
  onRetry?: (jobId: string, payload?: any) => void;
  payload?: any;
  [key: string]: unknown;
}

function WorkflowNodeComponent({ data }: NodeProps) {
  const d = data as unknown as WorkflowNodeData;
  const maxAttempts = d.maxRetries + 1;

  return (
    <div
      className="rounded-lg px-3 py-2.5 min-w-[200px] max-w-[240px]"
      style={{
        backgroundColor: "#1e1e1a",
        border: d.isCurrent
          ? "1.5px solid #d4a574"
          : "1px solid #3a3a35",
        boxShadow: d.isCurrent
          ? "0 0 8px rgba(212, 165, 116, 0.2)"
          : "none",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: "#3a3a35", border: "none", width: 6, height: 6 }} />

      {/* Header: status dot + function name */}
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: statusDotColor[d.status] || "#8a8a80" }}
        />
        <span className="text-xs font-medium text-foreground truncate">
          {d.functionName}
        </span>
      </div>

      {/* Status + duration */}
      <div className="flex items-center justify-between mb-1">
        <StatusBadge status={d.status} />
        <span className="text-[10px] text-muted-foreground">
          {formatDuration(d.durationMs)}
        </span>
      </div>

      {/* Attempt */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          Attempt {d.attempt}/{maxAttempts}
        </span>

        {/* Retry button — only on failed nodes */}
        {d.status === "failed" && d.onRetry && (
          <Button
            variant="outline"
            size="xs"
            className="h-5 text-[10px] px-1.5"
            onClick={(e) => {
              e.stopPropagation();
              d.onRetry!(d.jobId, d.payload);
            }}
          >
            Retry
          </Button>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={{ background: "#3a3a35", border: "none", width: 6, height: 6 }} />
    </div>
  );
}

export default memo(WorkflowNodeComponent);
