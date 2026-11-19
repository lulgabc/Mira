import type { ComponentChildren } from 'preact';
import { useId } from 'preact/hooks';

interface IconProps {
  size?: number;
  class?: string;
  strokeWidth?: number;
}

function Svg({
  size = 22,
  class: className,
  strokeWidth = 1.7,
  children,
}: IconProps & { children: ComponentChildren }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      class={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function LogoMark({ size = 30, class: className }: IconProps) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" class={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`ring-${id}`} x1="10" y1="54" x2="54" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#9683d5" />
          <stop offset=".5" stop-color="#7ed3c6" />
          <stop offset="1" stop-color="#dba679" />
        </linearGradient>
      </defs>
      <circle
        cx="32"
        cy="32"
        r="21"
        fill="none"
        stroke={`url(#ring-${id})`}
        stroke-width="4.4"
        stroke-linecap="round"
        stroke-dasharray="121 11"
        transform="rotate(90 32 32)"
      />
      <circle cx="32" cy="32" r="3.8" fill="currentColor" />
    </svg>
  );
}

export function IconToday(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-8.5Z" />
      <path d="M9.5 20.5v-6h5v6" />
    </Svg>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
      <path d="M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 17h.01M12 17h.01" />
    </Svg>
  );
}

export function IconInsights(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 19.5V15M9.3 19.5V10M14.7 19.5V6.5M20 19.5v-3" />
      <path d="M3.5 20.5h17" opacity=".35" />
    </Svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h6.5M14.5 7H20M4 12h10M18 12h2M4 17h3M11 17h9" />
      <circle cx="12.5" cy="7" r="2.1" />
      <circle cx="16" cy="12" r="2.1" />
      <circle cx="9" cy="17" r="2.1" />
    </Svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </Svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </Svg>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.5 8.5 0 1 0 10.2 10.2Z" />
      <path d="M17.5 4.5v3M16 6h3" opacity=".55" />
    </Svg>
  );
}

export function IconMedicine(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 3.5h6v3.2l1.4 1.5c.7.7 1.1 1.7 1.1 2.7V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 5.5 19v-8.1c0-1 .4-2 1.1-2.7L8 6.7V3.5Z" />
      <path d="M8.5 11.5h7M9 3.5h6" opacity=".55" />
    </Svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 7h15M9 7V4.8A.8.8 0 0 1 9.8 4h4.4a.8.8 0 0 1 .8.8V7M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12" />
      <path d="M10 11v6M14 11v6" opacity=".5" />
    </Svg>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
      <path d="M5 19.5h14" />
    </Svg>
  );
}

export function IconUpload(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
      <path d="M5 19.5h14" />
    </Svg>
  );
}

export function IconSparkles(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6Z" />
      <path d="M18.5 15.5c.3 1.7 1.2 2.6 3 3-1.8.3-2.7 1.2-3 3-.3-1.8-1.2-2.7-3-3 1.8-.4 2.7-1.3 3-3Z" opacity=".7" />
      <path d="M5.5 15.5c.2 1.3 1 2.1 2.3 2.3-1.3.3-2.1 1-2.3 2.4-.2-1.4-1-2.1-2.3-2.4 1.3-.2 2.1-1 2.3-2.3Z" opacity=".5" />
    </Svg>
  );
}

export function IconEdit(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m14.7 5.6 1.5-1.5a1.7 1.7 0 0 1 2.4 0l1.3 1.3a1.7 1.7 0 0 1 0 2.4l-1.5 1.5" />
      <path d="m14.7 5.6-9 9L4.5 19.5l4.9-1.2 9-9M13 7.3l3.7 3.7" />
    </Svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12.5 4.5 4.5L19 6.5" />
    </Svg>
  );
}

export function IconGlobe(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.2 2.3 3.3 5.1 3.3 8.5s-1.1 6.2-3.3 8.5c-2.2-2.3-3.3-5.1-3.3-8.5S9.8 5.8 12 3.5Z" />
    </Svg>
  );
}

export function IconDatabase(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="5.8" rx="7" ry="2.8" />
      <path d="M5 5.8v6.2c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V5.8" />
      <path d="M5 12v6.2c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V12" />
    </Svg>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8h.01" />
    </Svg>
  );
}

export function IconSun(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3.8" />
      <path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4" />
    </Svg>
  );
}

export function IconPulse(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 12h3.2l2.1-5.2 3.3 10.4 2.3-6.4 1.4 2.2H21" />
    </Svg>
  );
}
