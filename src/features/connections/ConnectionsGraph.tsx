"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  getBezierPath,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { useRouter, useSearchParams } from "next/navigation";
import { connections, type Connection, type RecurringLaw } from "./data";
import type { GraphConcept } from "./queries";

const PHASE_COLORS: Record<
  number,
  { fill: string; stroke: string; text: string; dot: string }
> = {
  1: { fill: "#fef3c7", stroke: "#d97706", text: "#78350f", dot: "#d97706" },
  2: { fill: "#dbeafe", stroke: "#2563eb", text: "#1e3a8a", dot: "#2563eb" },
  3: { fill: "#dcfce7", stroke: "#16a34a", text: "#14532d", dot: "#16a34a" },
  4: { fill: "#fce7f3", stroke: "#db2777", text: "#831843", dot: "#db2777" },
  5: { fill: "#e9d5ff", stroke: "#9333ea", text: "#581c87", dot: "#9333ea" },
  6: { fill: "#fee2e2", stroke: "#dc2626", text: "#7f1d1d", dot: "#dc2626" },
  7: { fill: "#ccfbf1", stroke: "#0d9488", text: "#134e4a", dot: "#0d9488" },
};

const LAW_LABELS: Record<RecurringLaw, string> = {
  idempotency: "Idempotency",
  time: "Time",
  "log-abstraction": "The log abstraction",
  immutability: "Immutability",
  "cost-as-bytes": "Cost = bytes touched",
  "stateless-vs-stateful": "Stateless vs stateful",
  "backward-compat": "Backward compatibility",
};

const TYPE_LABEL: Record<Connection["type"], string> = {
  applies: "applies",
  implements: "implements",
  scales: "scales up",
  foundation: "foundation",
  "shares-mechanism": "shares mechanism",
  "warns-about": "warns about",
  "creates-problem": "creates problem",
};

type Layout = "hierarchical" | "force";

type Props = {
  concepts: GraphConcept[];
};

export function ConnectionsGraph({ concepts }: Props) {
  return (
    <ReactFlowProvider>
      <ConnectionsGraphInner concepts={concepts} />
    </ReactFlowProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Custom edge with hover-revealed label
// ─────────────────────────────────────────────────────────────────────
function HoverEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    data,
  } = props;
  const [hovered, setHovered] = useState(false);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const label = (data as { label?: string } | undefined)?.label;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} />
      {/* Invisible wider stroke to make hover easier to land */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ pointerEvents: "stroke" }}
      />
      {hovered && label ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              maxWidth: 280,
              pointerEvents: "none",
              zIndex: 10,
            }}
            className="rounded-md border border-foreground/20 bg-background px-2.5 py-1.5 text-xs shadow-md"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

const edgeTypes = { hover: HoverEdge };

// ─────────────────────────────────────────────────────────────────────
// Main graph
// ─────────────────────────────────────────────────────────────────────
function ConnectionsGraphInner({ concepts }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusParam = searchParams.get("focus");

  const [layout, setLayout] = useState<Layout>("hierarchical");
  const [strongOnly, setStrongOnly] = useState(true);
  const [activeLaw, setActiveLaw] = useState<RecurringLaw | "all">("all");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // If the URL has ?focus=slug, pre-select that node.
  useEffect(() => {
    if (focusParam && concepts.some((c) => c.slug === focusParam)) {
      setSelectedSlug(focusParam);
    }
  }, [focusParam, concepts]);

  const filteredConnections = useMemo(() => {
    return connections.filter((c) => {
      if (strongOnly && c.strength !== "strong") return false;
      if (activeLaw !== "all" && c.law !== activeLaw) return false;
      return true;
    });
  }, [strongOnly, activeLaw]);

  const slugsInEdges = useMemo(() => {
    const s = new Set<string>();
    for (const c of filteredConnections) {
      s.add(c.from);
      s.add(c.to);
    }
    return s;
  }, [filteredConnections]);

  const neighbourSlugs = useMemo(() => {
    if (!selectedSlug) return null;
    const ns = new Set<string>([selectedSlug]);
    for (const c of filteredConnections) {
      if (c.from === selectedSlug) ns.add(c.to);
      if (c.to === selectedSlug) ns.add(c.from);
    }
    return ns;
  }, [selectedSlug, filteredConnections]);

  const positions = useMemo(() => {
    if (layout === "hierarchical") return computeHierarchical(concepts);
    return computeForce(concepts, filteredConnections);
  }, [layout, concepts, filteredConnections]);

  const nodes: Node[] = useMemo(() => {
    return concepts.map((concept) => {
      const pos = positions[concept.slug] ?? { x: 0, y: 0 };
      const color = PHASE_COLORS[concept.phase_number];
      const dim =
        neighbourSlugs !== null && !neighbourSlugs.has(concept.slug);
      const inGraph = slugsInEdges.has(concept.slug);
      const isSelected = selectedSlug === concept.slug;

      return {
        id: concept.slug,
        position: pos,
        data: { label: concept.title, conceptSlug: concept.slug },
        type: "default",
        draggable: layout === "force",
        style: {
          background: color.fill,
          borderColor: isSelected ? "#000" : color.stroke,
          color: color.text,
          borderWidth: isSelected ? 3 : 2,
          borderStyle: "solid",
          borderRadius: 8,
          padding: "6px 10px",
          fontSize: 11,
          fontWeight: 600,
          width: 160,
          opacity: dim ? 0.2 : inGraph ? 1 : 0.5,
          cursor: "pointer",
          boxShadow: isSelected
            ? "0 0 0 3px rgba(0,0,0,0.08)"
            : undefined,
        },
      } as Node;
    });
  }, [concepts, positions, layout, neighbourSlugs, slugsInEdges, selectedSlug]);

  const edges: Edge[] = useMemo(() => {
    return filteredConnections.map((c, i) => {
      const dim =
        neighbourSlugs !== null &&
        !(neighbourSlugs.has(c.from) && neighbourSlugs.has(c.to));
      return {
        id: `e-${i}-${c.from}-${c.to}`,
        source: c.from,
        target: c.to,
        type: "hover",
        data: { label: c.label },
        style: {
          stroke: dim ? "rgba(120,120,120,0.15)" : "rgba(120,120,120,0.65)",
          strokeWidth: c.strength === "strong" ? 1.6 : 1.0,
          strokeDasharray: c.type === "implements" ? "4 3" : undefined,
        },
      } as Edge;
    });
  }, [filteredConnections, neighbourSlugs]);

  const handleNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedSlug(node.id);
  }, []);

  const clearSelection = useCallback(() => setSelectedSlug(null), []);

  const selectedConcept = useMemo(
    () => concepts.find((c) => c.slug === selectedSlug) ?? null,
    [concepts, selectedSlug],
  );

  // Outgoing / incoming for the sidebar (against the *full* connection list,
  // not the filtered one — the sidebar shows the canonical relations).
  const sidebarConnections = useMemo(() => {
    if (!selectedSlug) return { outgoing: [], incoming: [] };
    return {
      outgoing: connections.filter((c) => c.from === selectedSlug),
      incoming: connections.filter((c) => c.to === selectedSlug),
    };
  }, [selectedSlug]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-foreground/10 px-6 py-3 text-sm">
        <div className="flex items-center gap-1 rounded-md border border-foreground/15 p-0.5">
          <button
            onClick={() => setLayout("hierarchical")}
            className={`rounded px-3 py-1 text-xs font-medium ${
              layout === "hierarchical"
                ? "bg-foreground/10"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            A · Hierarchical
          </button>
          <button
            onClick={() => setLayout("force")}
            className={`rounded px-3 py-1 text-xs font-medium ${
              layout === "force"
                ? "bg-foreground/10"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            B · Force-directed
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs text-foreground/70">
          <input
            type="checkbox"
            checked={strongOnly}
            onChange={(e) => setStrongOnly(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          Strong connections only
        </label>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-foreground/50">Theme:</span>
          <select
            value={activeLaw}
            onChange={(e) => setActiveLaw(e.target.value as RecurringLaw | "all")}
            className="rounded border border-foreground/15 bg-transparent px-2 py-0.5 text-xs"
          >
            <option value="all">All</option>
            {(Object.keys(LAW_LABELS) as RecurringLaw[]).map((law) => (
              <option key={law} value={law}>
                {LAW_LABELS[law]}
              </option>
            ))}
          </select>
        </div>

        {selectedSlug ? (
          <button
            onClick={clearSelection}
            className="text-xs text-foreground/60 underline hover:text-foreground"
          >
            Clear selection
          </button>
        ) : null}

        <div className="ml-auto text-xs text-foreground/50">
          Click a node to inspect · hover an edge to read the relationship
        </div>
      </div>

      {/* Graph area + sidebar */}
      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          edgeTypes={edgeTypes}
          onNodeClick={handleNodeClick}
          onPaneClick={clearSelection}
          fitView
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} />
          <Controls showInteractive={false} />
          {selectedConcept ? (
            <Panel position="top-right" className="!m-3">
              <SelectedNodePanel
                concept={selectedConcept}
                outgoing={sidebarConnections.outgoing}
                incoming={sidebarConnections.incoming}
                concepts={concepts}
                onClose={clearSelection}
                onNavigate={(slug) => router.push(`/concept/${slug}`)}
                onJumpTo={(slug) => setSelectedSlug(slug)}
              />
            </Panel>
          ) : null}
        </ReactFlow>
      </div>

      <PhaseLegend concepts={concepts} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Selected-node sidebar panel
// ─────────────────────────────────────────────────────────────────────
type SidebarProps = {
  concept: GraphConcept;
  outgoing: Connection[];
  incoming: Connection[];
  concepts: GraphConcept[];
  onClose: () => void;
  onNavigate: (slug: string) => void;
  onJumpTo: (slug: string) => void;
};

function SelectedNodePanel({
  concept,
  outgoing,
  incoming,
  concepts,
  onClose,
  onNavigate,
  onJumpTo,
}: SidebarProps) {
  const titleBySlug = useMemo(() => {
    const m = new Map<string, { title: string; phase: number }>();
    for (const c of concepts) {
      m.set(c.slug, { title: c.title, phase: c.phase_number });
    }
    return m;
  }, [concepts]);

  const phaseColor = PHASE_COLORS[concept.phase_number];

  return (
    <div className="flex max-h-[calc(100vh-9rem)] w-80 flex-col overflow-hidden rounded-lg border border-foreground/15 bg-background shadow-lg">
      <div className="flex items-start justify-between gap-3 border-b border-foreground/10 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-foreground/50">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: phaseColor.dot }}
            />
            Phase {concept.phase_number} · {concept.phase_title}
          </div>
          <div className="mt-1 text-sm font-semibold">{concept.title}</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="-mr-1 -mt-1 rounded p-1 text-foreground/40 hover:text-foreground"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 text-xs">
        {outgoing.length > 0 ? (
          <ConnectionGroup
            heading="Builds on / leads to"
            direction="out"
            conns={outgoing}
            titleBySlug={titleBySlug}
            onJumpTo={onJumpTo}
          />
        ) : null}

        {incoming.length > 0 ? (
          <ConnectionGroup
            heading="Referenced by"
            direction="in"
            conns={incoming}
            titleBySlug={titleBySlug}
            onJumpTo={onJumpTo}
          />
        ) : null}

        {outgoing.length === 0 && incoming.length === 0 ? (
          <p className="text-foreground/50">No connections yet.</p>
        ) : null}
      </div>

      <div className="border-t border-foreground/10 p-3">
        <button
          onClick={() => onNavigate(concept.slug)}
          className="block w-full rounded-md bg-foreground py-2 text-xs font-medium text-background hover:bg-foreground/90"
        >
          Open concept →
        </button>
      </div>
    </div>
  );
}

function ConnectionGroup({
  heading,
  direction,
  conns,
  titleBySlug,
  onJumpTo,
}: {
  heading: string;
  direction: "in" | "out";
  conns: Connection[];
  titleBySlug: Map<string, { title: string; phase: number }>;
  onJumpTo: (slug: string) => void;
}) {
  return (
    <div className="mt-1 first:mt-0 [&+&]:mt-4">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
        {heading}
      </h3>
      <ul className="mt-2 space-y-2">
        {conns.map((c, i) => {
          const otherSlug = direction === "out" ? c.to : c.from;
          const other = titleBySlug.get(otherSlug);
          if (!other) return null;
          const otherColor = PHASE_COLORS[other.phase];
          return (
            <li
              key={`${direction}-${i}-${otherSlug}`}
              className="rounded border border-foreground/10 p-2 transition hover:border-foreground/30 hover:bg-foreground/[0.02]"
            >
              <button
                onClick={() => onJumpTo(otherSlug)}
                className="block w-full text-left"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: otherColor.dot }}
                  />
                  <span className="font-medium">{other.title}</span>
                  <span className="ml-auto text-[10px] text-foreground/40">
                    {TYPE_LABEL[c.type]}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-foreground/60">
                  {c.label}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PhaseLegend({ concepts }: { concepts: GraphConcept[] }) {
  const phases = useMemo(() => {
    const seen = new Map<number, { title: string; slug: string }>();
    for (const c of concepts) {
      if (!seen.has(c.phase_number)) {
        seen.set(c.phase_number, { title: c.phase_title, slug: c.phase_slug });
      }
    }
    return Array.from(seen.entries()).sort(([a], [b]) => a - b);
  }, [concepts]);

  return (
    <div className="flex flex-wrap gap-3 border-t border-foreground/10 px-6 py-2 text-xs text-foreground/60">
      {phases.map(([n, { title }]) => {
        const c = PHASE_COLORS[n];
        return (
          <div key={n} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm border"
              style={{ background: c.fill, borderColor: c.stroke }}
            />
            <span>
              <span className="font-medium">P{n}</span> {title}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Layouts (unchanged: hierarchical columns + d3-force simulation)
// ─────────────────────────────────────────────────────────────────────
function computeHierarchical(
  concepts: GraphConcept[],
): Record<string, { x: number; y: number }> {
  const COL_WIDTH = 220;
  const ROW_HEIGHT = 80;
  const X_OFFSET = 40;
  const Y_OFFSET = 40;

  const byPhase = new Map<number, GraphConcept[]>();
  for (const c of concepts) {
    if (!byPhase.has(c.phase_number)) byPhase.set(c.phase_number, []);
    byPhase.get(c.phase_number)!.push(c);
  }
  for (const list of byPhase.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order);
  }

  const positions: Record<string, { x: number; y: number }> = {};
  for (const [phase, list] of byPhase.entries()) {
    list.forEach((concept, i) => {
      positions[concept.slug] = {
        x: X_OFFSET + (phase - 1) * COL_WIDTH,
        y: Y_OFFSET + i * ROW_HEIGHT,
      };
    });
  }
  return positions;
}

type ForceNode = SimulationNodeDatum & { id: string };
type ForceLink = SimulationLinkDatum<ForceNode>;

function computeForce(
  concepts: GraphConcept[],
  conns: typeof connections,
): Record<string, { x: number; y: number }> {
  const WIDTH = 1400;
  const HEIGHT = 800;

  const nodes: ForceNode[] = concepts.map((c) => ({
    id: c.slug,
    x: ((c.phase_number - 1) / 6) * WIDTH * 0.8 + WIDTH * 0.1,
    y: ((c.sort_order * 137) % HEIGHT) + 50,
  }));

  const links: ForceLink[] = conns.map((c) => ({
    source: c.from,
    target: c.to,
  }));

  const sim = forceSimulation(nodes)
    .force(
      "link",
      forceLink<ForceNode, ForceLink>(links)
        .id((d) => d.id)
        .distance(120)
        .strength(0.4),
    )
    .force("charge", forceManyBody().strength(-450))
    .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
    .force("collide", forceCollide(75))
    .stop();

  for (let i = 0; i < 350; i++) sim.tick();

  const positions: Record<string, { x: number; y: number }> = {};
  for (const n of nodes) {
    positions[n.id] = { x: n.x ?? 0, y: n.y ?? 0 };
  }
  return positions;
}
