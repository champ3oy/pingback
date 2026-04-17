"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Play, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { useExecutions, type Execution } from "@/lib/hooks/use-executions";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
      Copy
    </Button>
  );
}

function RunDetail({ exec }: { exec: Execution }) {
  const formattedOutput = (() => {
    if (!exec.responseBody) return null;
    try { return JSON.stringify(JSON.parse(exec.responseBody), null, 2); }
    catch { return exec.responseBody; }
  })();

  return (
    <div className="border-t border-border">
      {/* Top metadata bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-border">
        <div className="bg-secondary/50 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Run ID</p>
          <p className="text-xs font-mono mt-0.5 truncate">{exec.id.slice(0, 20)}...</p>
        </div>
        <div className="bg-secondary/50 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Function</p>
          <p className="text-xs font-medium text-primary mt-0.5">{exec.job?.name || exec.jobId.slice(0, 8)}</p>
        </div>
        <div className="bg-secondary/50 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Duration</p>
          <p className="text-xs font-medium mt-0.5">{exec.durationMs != null ? `${(exec.durationMs / 1000).toFixed(2)}s` : "—"}</p>
        </div>
        <div className="bg-secondary/50 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Started at</p>
          <p className="text-xs mt-0.5">{exec.startedAt ? new Date(exec.startedAt).toLocaleString() : "—"}</p>
        </div>
        <div className="bg-secondary/50 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Completed at</p>
          <p className="text-xs mt-0.5">{exec.completedAt ? new Date(exec.completedAt).toLocaleString() : "—"}</p>
        </div>
        <div className="bg-secondary/50 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">HTTP Status</p>
          <p className="text-xs font-medium mt-0.5">{exec.httpStatus || "—"}</p>
        </div>
      </div>

      {/* Two-panel layout: Trace/Logs left, Output right */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-border min-h-[200px]">
        {/* Left panel — Trace / Logs */}
        <div className="p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Trace</p>

          {exec.errorMessage && (
            <div className="rounded border border-destructive/30 bg-destructive/5 px-3 py-2 mb-3">
              <p className="text-xs font-medium text-destructive">{exec.errorMessage}</p>
            </div>
          )}

          {exec.logs && exec.logs.length > 0 ? (
            <div className="space-y-0.5 font-mono text-xs">
              {exec.logs.map((log, i) => (
                <div key={i} className="flex gap-2 py-0.5">
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 } as any)}
                  </span>
                  <span className="text-foreground">{log.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No log entries</p>
          )}
        </div>

        {/* Right panel — Output */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Output</p>
            {formattedOutput && <CopyButton text={formattedOutput} />}
          </div>

          {formattedOutput ? (
            <div className="rounded border bg-black p-3 overflow-auto max-h-[300px]">
              <pre className="text-xs font-mono">
                {formattedOutput.split('\n').map((line, i) => (
                  <div key={i} className="flex">
                    <span className="text-muted-foreground select-none w-8 shrink-0 text-right mr-3">{i + 1}</span>
                    <span className="text-foreground">{colorizeJson(line)}</span>
                  </div>
                ))}
              </pre>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No output</p>
          )}
        </div>
      </div>
    </div>
  );
}

function colorizeJson(line: string): React.ReactNode {
  // Simple JSON syntax coloring
  return line.replace(
    /("(?:[^"\\]|\\.)*")\s*:/g,
    '___KEY___$1___ENDKEY___:'
  ).split(/(___KEY___|___ENDKEY___)/).map((part, i) => {
    if (part === '___KEY___') return null;
    if (part === '___ENDKEY___') return null;
    // Check if this part is a key (follows ___KEY___)
    return <span key={i}>{part}</span>;
  });
}

export default function RunsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading } = useExecutions(projectId, { page, limit: 20 });

  function toggleRow(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Runs</h1>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !data?.items?.length ? (
        <EmptyState
          icon={Play}
          title="No runs yet"
          description="Execution history will appear here once your crons start running."
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Run</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Attempt</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((exec, index) => (
                  <>
                    <TableRow
                      key={exec.id}
                      className={`cursor-pointer hover:bg-secondary/50 ${expandedId === exec.id ? "bg-secondary/30" : ""}`}
                      onClick={() => toggleRow(exec.id)}
                    >
                      <TableCell className="w-8 px-3">
                        {expandedId === exec.id ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-primary font-mono text-sm">
                        {data.total - ((page - 1) * 20) - index}
                      </TableCell>
                      <TableCell className="font-medium">
                        {exec.job?.name || exec.jobId.slice(0, 8)}
                      </TableCell>
                      <TableCell><StatusBadge status={exec.status} /></TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {exec.startedAt ? new Date(exec.startedAt).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {exec.durationMs != null ? `${(exec.durationMs / 1000).toFixed(1)}s` : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{exec.attempt}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(exec.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                    {expandedId === exec.id && (
                      <TableRow key={`${exec.id}-detail`}>
                        <TableCell colSpan={8} className="p-0">
                          <RunDetail exec={exec} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              {data.total} total runs
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * 20 >= data.total}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
