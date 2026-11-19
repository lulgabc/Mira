import { useId, useRef } from 'preact/hooks';
import { severityKey, type Translate } from '../i18n';
import { severityBucket } from '../lib/stats';

interface SeverityDialProps {
  value: number;
  onChange: (value: number) => void;
  t: Translate;
}

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 88;
const START = 135;
const SWEEP = 270;

function polar(angle: number, radius = RADIUS): { x: number; y: number } {
  const rad = (angle * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) };
}

function arcPath(from: number, to: number): string {
  const start = polar(from);
  const end = polar(to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function angleForValue(value: number): number {
  return START + ((value - 1) / 9) * SWEEP;
}

function severityColor(value: number): string {
  const bucket = severityBucket(value);
  return bucket === 'mild'
    ? 'var(--sev-mild)'
    : bucket === 'moderate'
      ? 'var(--sev-moderate)'
      : bucket === 'severe'
        ? 'var(--sev-severe)'
        : 'var(--sev-extreme)';
}

export function SeverityDial({ value, onChange, t }: SeverityDialProps) {
  const gradientId = `mira-dial-gradient-${useId().replace(/:/g, '')}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const setFromPointer = (event: PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    const x = ((event.clientX - rect.left) / rect.width) * SIZE;
    const y = ((event.clientY - rect.top) / rect.height) * SIZE;
    const degrees = (Math.atan2(y - CENTER, x - CENTER) * 180) / Math.PI;
    const normalized = (degrees + 360) % 360;
    const relative = (normalized - START + 360) % 360;
    let fraction: number;
    if (relative <= SWEEP) fraction = relative / SWEEP;
    else fraction = relative > 315 ? 1 : 0;
    const next = Math.max(1, Math.min(10, Math.round(1 + fraction * 9)));
    onChange(next);
  };

  const onPointerDown = (event: PointerEvent) => {
    event.preventDefault();
    dragging.current = true;
    (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
    setFromPointer(event);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging.current) return;
    setFromPointer(event);
  };

  const endDrag = () => {
    dragging.current = false;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const key = event.key;
    if (key === 'ArrowRight' || key === 'ArrowUp') {
      event.preventDefault();
      onChange(Math.min(10, value + 1));
    } else if (key === 'ArrowLeft' || key === 'ArrowDown') {
      event.preventDefault();
      onChange(Math.max(1, value - 1));
    } else if (key === 'Home') {
      event.preventDefault();
      onChange(1);
    } else if (key === 'End') {
      event.preventDefault();
      onChange(10);
    }
  };

  const description = t(severityKey(value));
  const knob = polar(angleForValue(value));

  return (
    <div class="dial-box">
      <svg
        ref={svgRef}
        class="dial"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="slider"
        tabindex={0}
        aria-label={t('severity.label')}
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={value}
        aria-valuetext={`${value} — ${description}`}
        style={`--sev-current:${severityColor(value)}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" style="stop-color:var(--sev-mild)" />
            <stop offset=".55" style="stop-color:var(--sev-moderate)" />
            <stop offset=".8" style="stop-color:var(--sev-severe)" />
            <stop offset="1" style="stop-color:var(--sev-extreme)" />
          </linearGradient>
        </defs>
        <path class="dial-track" d={arcPath(START, START + SWEEP)} />
        <path
          class="dial-progress"
          stroke={`url(#${gradientId})`}
          d={arcPath(START, Math.max(START + 0.01, angleForValue(value)))}
        />
        <circle class="dial-knob" cx={knob.x} cy={knob.y} r={9} />
      </svg>
      <div class="dial-center" aria-hidden="true">
        <span class="dial-value">{value}</span>
        <span class="dial-desc">{description}</span>
      </div>
    </div>
  );
}
