import { severityBucket } from '../lib/stats';

export interface TrendBucket {
  startKey: string;
  endKey: string;
  attackDays: number;
  episodes: number;
  avgSeverity: number | null;
}

interface TrendChartProps {
  buckets: TrendBucket[];
  mode: 'severity' | 'days';
  ariaLabel: string;
  formatTick: (key: string) => string;
}

/** A compact chart rendered as plain SVG — no chart library. */
export function TrendChart({ buckets, mode, ariaLabel, formatTick }: TrendChartProps) {
  const width = 320;
  const height = 150;
  const top = 14;
  const base = 118;
  const gap = buckets.length > 20 ? 2 : buckets.length > 12 ? 4 : 7;
  const barWidth = Math.max(2, (width - gap * Math.max(0, buckets.length - 1)) / Math.max(1, buckets.length));
  const values = buckets.map((bucket) =>
    mode === 'severity' ? (bucket.avgSeverity ?? 0) : bucket.attackDays,
  );
  const max = mode === 'severity' ? 10 : Math.max(1, ...values);
  const labelStep = buckets.length > 20 ? 7 : buckets.length > 12 ? 3 : 2;

  return (
    <svg class="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
      <title>{ariaLabel}</title>
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <line
          key={ratio}
          class="grid-line"
          x1="0"
          x2={width}
          y1={base - (base - top) * ratio}
          y2={base - (base - top) * ratio}
        />
      ))}
      {buckets.map((bucket, index) => {
        const value = values[index] ?? 0;
        const x = index * (barWidth + gap);
        const rawHeight = ((base - top) * value) / max;
        const h = value === 0 ? 2 : Math.max(5, rawHeight);
        const level = mode === 'severity' && value > 0 ? severityBucket(value) : null;
        return (
          <g key={bucket.startKey}>
            <rect
              class={
                value === 0 ? 'bar-empty' : level ? `bar sev-${level}` : 'bar'
              }
              x={x}
              y={base - h}
              width={barWidth}
              height={h}
              rx={Math.min(3, barWidth / 2)}
            >
              <title>
                {formatTick(bucket.startKey)} · {value}
              </title>
            </rect>
            {index % labelStep === 0 && (
              <text class="tick" x={x + barWidth / 2} y={height - 8} text-anchor="middle">
                {formatTick(bucket.startKey)}
              </text>
            )}
          </g>
        );
      })}
      <line class="grid-line" x1="0" x2={width} y1={base} y2={base} />
    </svg>
  );
}
