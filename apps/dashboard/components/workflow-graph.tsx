"use client";

import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import dagre from "dagre";
import "@xyflow/react/dist/style.css";
import WorkflowNodeComponent, { type WorkflowNodeData } from "./workflow-node";
import { type WorkflowNode } from "@/lib/hooks/use-executions";
import { apiClient } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 90;

const statusEdgeColor: Record<string, string> = {
  success: "#a8b545",
  failed: "#d4734a",
  running: "#e8b44a",
  pending: "#8a8a80",
};

const nodeTypes = { workflowNode: WorkflowNodeComponent };

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 40, ranksep: 60 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

interface WorkflowGraphProps {
  workflowNodes: WorkflowNode[];
  currentExecutionId: string;
  projectId: string;
}

export function WorkflowGraph({
  workflowNodes,
  currentExecutionId,
  projectId,
}: WorkflowGraphProps) {
  const queryClient = useQueryClient();

  const handleRetry = useCallback(
    async (jobId: string, payload?: any) => {
      await apiClient.post(
        `/api/v1/projects/${projectId}/jobs/${jobId}/run`,
        payload !== undefined ? { payload } : undefined,
      );
      queryClient.invalidateQueries({ queryKey: ["workflow"] });
      queryClient.invalidateQueries({ queryKey: ["executions"] });
    },
    [projectId, queryClient],
  );

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const rfNodes: Node[] = workflowNodes.map((node) => ({
      id: node.id,
      type: "workflowNode",
      position: { x: 0, y: 0 },
      data: {
        ...node,
        isCurrent: node.id === currentExecutionId,
        onRetry: handleRetry,
      } as WorkflowNodeData,
    }));

    const rfEdges: Edge[] = workflowNodes
      .filter((n) => n.parentId)
      .map((node) => ({
        id: `${node.parentId}-${node.id}`,
        source: node.parentId!,
        target: node.id,
        style: {
          stroke: statusEdgeColor[node.status] || "#8a8a80",
          strokeDasharray: "6 3",
        },
        animated: node.status === "running",
      }));

    return getLayoutedElements(rfNodes, rfEdges);
  }, [workflowNodes, currentExecutionId, handleRetry]);

  return (
    <div style={{ height: 450 }} className="w-full workflow-graph-dark">
      <style>{`
        .workflow-graph-dark .react-flow__controls {
          background: #1e1e1a;
          border: 1px solid #3a3a35;
          border-radius: 6px;
          box-shadow: none;
        }
        .workflow-graph-dark .react-flow__controls button {
          background: #1e1e1a;
          border-color: #3a3a35;
          fill: #8a8a80;
        }
        .workflow-graph-dark .react-flow__controls button:hover {
          background: #2a2a25;
          fill: #f5f5f0;
        }
        .workflow-graph-dark .react-flow__controls button svg {
          fill: inherit;
        }
      `}</style>
      <ReactFlow
        nodes={layoutedNodes}
        edges={layoutedEdges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Controls
          showInteractive={false}
          position="bottom-right"
        />
      </ReactFlow>
    </div>
  );
}
