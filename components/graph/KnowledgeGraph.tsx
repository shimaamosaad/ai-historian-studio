"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  NodeMouseHandler,
} from "reactflow";

import dagre from "@dagrejs/dagre";
import "reactflow/dist/style.css";

type GraphNode = {
  id: string;
  slug: string;
  label: string;
  type: string;
  summary?: string | null;
  description?: string | null;
  center?: boolean;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label?: string | null;
};

type GraphResponse = {
  center: {
    id: string;
    slug: string;
    name: string;
    type: string;
  };
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type Props = {
  slug: string;
};

const nodeWidth = 220;
const nodeHeight = 70;

function layout(nodes: Node[], edges: Edge[]) {
  const graph = new dagre.graphlib.Graph();

  graph.setDefaultEdgeLabel(() => ({}));

  graph.setGraph({
    rankdir: "LR",
    ranksep: 120,
    nodesep: 40,
  });

  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  return {
    nodes: nodes.map((node) => {
      const p = graph.node(node.id);

      return {
        ...node,
        position: {
          x: p.x - nodeWidth / 2,
          y: p.y - nodeHeight / 2,
        },
      };
    }),
    edges,
  };
}

export default function KnowledgeGraph({ slug }: Props) {
  const router = useRouter();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGraph = useCallback(async () => {
  try {
    setLoading(true);

    const res = await fetch(`/api/graph/${slug}`);

    if (!res.ok) {
      throw new Error("Failed to load graph");
    }

    const graph: GraphResponse = await res.json();

    const flowNodes: Node[] = graph.nodes.map((node) => ({
      id: node.id,
      data: {
        slug: node.slug,
        type: node.type,
        label: node.label,
      },
      position: { x: 0, y: 0 },
      style: {
        borderRadius: 12,
        padding: 10,
        border: node.center
          ? "2px solid #2563eb"
          : "1px solid #d1d5db",
        background: node.center ? "#dbeafe" : "#ffffff",
      },
    }));

    const flowEdges: Edge[] = graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label ?? "",
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    }));

    const layouted = layout(flowNodes, flowEdges);

    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}, [slug]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const onNodeClick: NodeMouseHandler = (_, node) => {
    router.push(`/entities/${node.data.type}/${node.data.slug}`);
  };

  if (loading) {
  return (
    <div className="flex h-[700px] items-center justify-center rounded-xl border">
      Loading graph...
    </div>
  );
}
  return (
    <div className="h-[700px] w-full rounded-xl border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        onNodeClick={onNodeClick}
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}