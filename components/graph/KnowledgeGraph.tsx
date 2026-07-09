"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
} from "reactflow";

type Props = {
  entity: any;
};

export default function KnowledgeGraph({ entity }: Props) {
  const router = useRouter();

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // الكيان الرئيسي
    nodes.push({
      id: entity.slug,
      position: { x: 300, y: 180 },
      data: {
        label: entity.name,
      },
      style: {
        background: "#0f766e",
        color: "#ffffff",
        border: "2px solid #22d3ee",
        borderRadius: 12,
        padding: 10,
        fontWeight: "bold",
      },
    });

    // العلاقات الصادرة
    entity.outgoingRelations.forEach((item: any, index: number) => {
      const x = 650;
      const y = 70 + index * 160;

      nodes.push({
        id: item.target.slug,
        position: { x, y },
        data: {
          label: item.target.name,
        },
        style: {
          background:
            item.target.type === "person"
              ? "#166534"
              : item.target.type === "place"
              ? "#1d4ed8"
              : "#b45309",
          color: "#ffffff",
          borderRadius: 12,
          padding: 10,
          fontWeight: "bold",
        },
      });

      edges.push({
        id: `${entity.slug}-${item.target.slug}`,
        source: entity.slug,
        target: item.target.slug,
        label: item.relation,
        animated: true,
        type: "smoothstep",
      });
    });

    // العلاقات الواردة
    entity.incomingRelations.forEach((item: any, index: number) => {
      const x = -50;
      const y = 70 + index * 160;

      nodes.push({
        id: item.source.slug,
        position: { x, y },
        data: {
          label: item.source.name,
        },
        style: {
          background:
            item.source.type === "person"
              ? "#166534"
              : item.source.type === "place"
              ? "#1d4ed8"
              : "#b45309",
          color: "#ffffff",
          borderRadius: 12,
          padding: 10,
          fontWeight: "bold",
        },
      });

      edges.push({
        id: `${item.source.slug}-${entity.slug}`,
        source: item.source.slug,
        target: entity.slug,
        label: item.relation,
        animated: true,
        type: "smoothstep",
      });
    });

    return { nodes, edges };
  }, [entity]);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-700"
      style={{ width: "100%", height: 600 }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        onNodeClick={(_, node) => {
          if (node.id === entity.slug) return;

          const target =
            entity.outgoingRelations.find(
              (r: any) => r.target.slug === node.id
            )?.target ||
            entity.incomingRelations.find(
              (r: any) => r.source.slug === node.id
            )?.source;

          if (target) {
            router.push(`/entities/${target.type}/${target.slug}`);
          }
        }}
      >
        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={3}
          maskColor="rgba(15,23,42,0.25)"
          style={{
            background: "#020617",
            border: "1px solid #334155",
            borderRadius: 12,
          }}
        />

        <Controls />

        <Background gap={24} size={1} />
      </ReactFlow>
    </div>
  );
}