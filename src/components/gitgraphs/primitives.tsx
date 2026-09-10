export interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
  highlight?: boolean;
}

export interface GraphEdgeSpec {
  from: string;
  to: string;
}

export interface RefLabel {
  nodeId: string;
  text: string;
  dy?: number;
}

interface CommitGraphProps {
  nodes: GraphNode[];
  edges: GraphEdgeSpec[];
  refs?: RefLabel[];
}

export function CommitGraph({ nodes, edges, refs = [] }: CommitGraphProps) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return (
    <svg viewBox="0 0 320 160" className="w-full max-w-sm mx-auto" role="img" aria-label="Git commit graph">
      {edges.map((e) => {
        const from = byId[e.from];
        const to = byId[e.to];
        return (
          <line
            key={`${e.from}-${e.to}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            className="stroke-muted-foreground"
            strokeWidth={2}
          />
        );
      })}
      {nodes.map((n) => (
        <g key={n.id}>
          <circle
            cx={n.x}
            cy={n.y}
            r={14}
            className={n.highlight ? "fill-primary" : "fill-muted-foreground/40"}
          />
          <text x={n.x} y={n.y + 28} textAnchor="middle" className="fill-foreground text-[10px]">
            {n.label}
          </text>
        </g>
      ))}
      {refs.map((r) => {
        const node = byId[r.nodeId];
        return (
          <text
            key={r.text}
            x={node.x}
            y={node.y - 20 + (r.dy ?? 0)}
            textAnchor="middle"
            className="fill-primary text-[10px] font-semibold"
          >
            {r.text}
          </text>
        );
      })}
    </svg>
  );
}

export interface FlowBox {
  label: string;
  caption?: string;
}

export function BoxFlow({ boxes }: { boxes: FlowBox[] }) {
  const width = 320;
  const boxWidth = 90;
  const gap = (width - boxes.length * boxWidth) / (boxes.length + 1);
  return (
    <svg viewBox={`0 0 ${width} 120`} className="w-full max-w-sm mx-auto" role="img" aria-label="Git flow diagram">
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" className="fill-primary" />
        </marker>
      </defs>
      {boxes.map((box, i) => {
        const x = gap + i * (boxWidth + gap);
        return (
          <g key={box.label}>
            <rect x={x} y={30} width={boxWidth} height={50} rx={8} className="fill-muted stroke-primary" strokeWidth={2} />
            <text x={x + boxWidth / 2} y={60} textAnchor="middle" className="fill-foreground text-[11px] font-medium">
              {box.label}
            </text>
            {box.caption && (
              <text x={x + boxWidth / 2} y={95} textAnchor="middle" className="fill-muted-foreground text-[9px]">
                {box.caption}
              </text>
            )}
            {i < boxes.length - 1 && (
              <line
                x1={x + boxWidth}
                y1={55}
                x2={x + boxWidth + gap}
                y2={55}
                className="stroke-primary"
                strokeWidth={2}
                markerEnd="url(#arrow)"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
