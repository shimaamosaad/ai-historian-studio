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
  center?: {
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

const nodeWidth = 240;
const nodeHeight = 90;
const defaultEdgeOptions = {
  markerEnd: {
    type: MarkerType.ArrowClosed,
  },
};
const cache = new Map<string, GraphResponse>();

function applyLayout(
  nodes: Node[],
  edges: Edge[],
  preservePositions = false
) {
  const graph = new dagre.graphlib.Graph();

  graph.setDefaultEdgeLabel(() => ({}));

  graph.setGraph({
    rankdir: "LR",
    ranksep: 140,
    nodesep: 60,
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

  return nodes.map((node) => {
    const position = graph.node(node.id);

    return {
      ...node,
      position: {
        x: position.x - nodeWidth / 2,
        y: position.y - nodeHeight / 2,
      },
    };
  });
}

function getNodeIcon(type: string): string {
  switch (type) {
    case "person":
      return "👤";

    case "place":
      return "📍";

    case "event":
      return "📅";

    case "organization":
      return "🏛️";

    case "document":
      return "📄";

    default:
      return "🔹";
  }
}

function convertNodes(nodes: GraphNode[]): Node[] {
  return nodes.map((node) => ({
    id: node.id,
    data: {
      slug: node.slug,
      type: node.type,
      label: `${getNodeIcon(node.type)} ${node.label}`,
      summary: node.summary,
    },
    position: {
      x: 0,
      y: 0,
    },
    style: {
      width: nodeWidth,
      minHeight: nodeHeight,
      transition: "all 300ms ease",
  cursor: "pointer",
      borderRadius: 14,
      padding: 12,
      border: node.center
        ? "2px solid #2563eb"
        : "1px solid #d1d5db",
      background: node.center
        ? "#dbeafe"
        : "#ffffff",
    },
  }));
}

function convertEdges(edges: GraphEdge[]): Edge[] {
  return edges.map((edge) => {
    const relation = (edge.label ?? "").toLowerCase();

    let stroke = "#6b7280";

    if (
      relation.includes("ولد") ||
      relation.includes("birth")
    ) {
      stroke = "#16a34a";
    } else if (
      relation.includes("توفي") ||
      relation.includes("death")
    ) {
      stroke = "#dc2626";
    } else if (
      relation.includes("قاد") ||
      relation.includes("شارك") ||
      relation.includes("معركة")
    ) {
      stroke = "#2563eb";
    } else if (
      relation.includes("حكم") ||
      relation.includes("ملك")
    ) {
      stroke = "#7c3aed";
    }

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label ?? "",

      style: {
        stroke,
        strokeWidth: 2,
      },

      labelStyle: {
        fill: stroke,
        fontWeight: 600,
      },
    };
  });
}

function mergeNodes(
  current: Node[],
  incoming: Node[]
) {
  const map = new Map<string, Node>();

  [...current, ...incoming].forEach((node) => {
    map.set(node.id, node);
  });

  return Array.from(map.values());
}

function mergeEdges(
  current: Edge[],
  incoming: Edge[]
) {
  const map = new Map<string, Edge>();

  [...current, ...incoming].forEach((edge) => {
    map.set(edge.id, edge);
  });

  return Array.from(map.values());
}

export default function KnowledgeGraph({
  slug,
}: Props) {
  const router = useRouter();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const searchResults = nodes.filter((node) =>
  String(node.data?.label ?? "")
    .toLowerCase()
    .includes(search.trim().toLowerCase())
);

    const fetchGraph = useCallback(
  async (targetSlug: string, isExpand = false) => {
    try {
      let graph: GraphResponse;

if (cache.has(targetSlug)) {
  graph = cache.get(targetSlug)!;
} else {
  const res = await fetch(`/api/graph/${targetSlug}`);

  if (!res.ok) {
    throw new Error("Failed to load graph");
  }

  graph = await res.json();
        cache.set(targetSlug, graph);
      }
        let graphNodes = [...graph.nodes];

        if (graph.center) {
          const exists = graphNodes.some(
            (node) => node.id === graph.center?.id
          );

          if (!exists) {
            graphNodes.unshift({
              id: graph.center.id,
              slug: graph.center.slug,
              label: graph.center.name,
              type: graph.center.type,
              center: true,
            });
          }
        }

        const newNodes = convertNodes(graphNodes);
        const newEdges = convertEdges(graph.edges);

        if (isExpand) {
  setEdges((currentEdges) => {
    const mergedEdges = mergeEdges(
      currentEdges,
      newEdges
    );

    setNodes((currentNodes) => {
      const mergedNodes = mergeNodes(
        currentNodes,
        newNodes
      );

      return applyLayout(
  mergedNodes,
  mergedEdges,
  true
);
    });

    return mergedEdges;
  });
} else {
  setNodes(
    applyLayout(newNodes, newEdges)
  );

  setEdges(newEdges);
}
      } catch (error) {
        console.error(
          "Graph loading error:",
          error
        );
      }
    },
[]);

  useEffect(() => {
    setLoading(true);

    fetchGraph(slug).finally(() =>
      setLoading(false)
    );
  }, [slug, fetchGraph]);

  useEffect(() => {
  const value = search.trim().toLowerCase();

  if (!value) {
  setSelectedNodeId(null);
  return;
}

  const found = nodes.find((node) =>
    String(node.data?.label ?? "")
      .toLowerCase()
      .includes(value)
  );

  if (found) {
    setSelectedNodeId(found.id);
  }
}, [search, nodes]);

  const onNodeClick: NodeMouseHandler = async (
    _event,
    node
  ) => {
    const nodeSlug = node.data?.slug;
    const nodeType = node.data?.type;

    if (!nodeSlug || !nodeType) {
      return;
    }

    if (expanded.has(nodeSlug)) {
  return;
}

setExpanded((prev) => {
  const next = new Set(prev);
  next.add(nodeSlug);
  return next;
});

await fetchGraph(nodeSlug, true);
  };


  const openEntity = (
    node: Node
  ) => {
    const nodeSlug = node.data?.slug;
    const nodeType = node.data?.type;

    if (!nodeSlug || !nodeType) {
      return;
    }

    router.push(
      `/entities/${nodeType}/${nodeSlug}`
    );
  };


  if (loading) {
    return (
      <div className="flex h-[700px] items-center justify-center rounded-xl border">
        Loading knowledge graph...
      </div>
    );
  }

    return (
  <div className="h-[700px] w-full rounded-xl border flex flex-col">

    <div className="border-b p-3">
      <input
        type="text"
        placeholder="Search nodes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
      />
    </div>

<div className="flex items-center gap-2 border-b px-3 py-2">

<span className="ml-auto text-sm text-gray-500">
  {search.trim()
    ? `${searchResults.length} result${
        searchResults.length === 1 ? "" : "s"
      }`
    : `${nodes.length} nodes`}
</span>

  <button
    onClick={() => setSearch("")}
    className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
  >
    Clear Search
  </button>

  <button
    onClick={() => {
      setSelectedNodeId(null);
    }}
    className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
  >
    Clear Selection
  </button>
<button
  onClick={() => {
    setSearch("");
    setSelectedNodeId(null);

    fetchGraph(slug);
  }}
  className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
>
  Reset Graph
</button>
<span className="text-sm text-gray-500">
  {nodes.length} Nodes | {expanded.size} Expanded
</span>

</div>

<div className="flex-1">
      
      <ReactFlow
nodes={nodes.map((node) => {
  const matchesSearch =
    search.trim().length > 0 &&
    String(node.data?.label ?? "")
      .toLowerCase()
      .includes(search.trim().toLowerCase());

  return {
    ...node,
    style: {
      ...node.style,
      border:
        node.id === selectedNodeId
          ? "3px solid #2563eb"
          : matchesSearch
          ? "3px solid #22c55e"
          : node.style?.border,
      boxShadow:
        node.id === selectedNodeId
          ? "0 0 0 4px rgba(37,99,235,.25)"
          : matchesSearch
          ? "0 0 0 4px rgba(34,197,94,.20)"
          : undefined,
    },
  };
})}
  edges={edges}
  defaultEdgeOptions={defaultEdgeOptions}
  nodesDraggable
  fitView
  onNodeClick={onNodeClick}
  onNodeDoubleClick={(_event, node) =>
    openEntity(node)
  }
>

        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>

    </div>
  </div>
);
}