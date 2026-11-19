#!/usr/bin/env node
/**
 * Generates Mira's app icons with no image dependencies.
 * A quiet aurora ring around a warm centre — an eye, a breath, a day.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const clamp = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];

function gradientAt(angle) {
  // angle in degrees, 0 = right, 90 = down (screen space)
  const teal = [126, 211, 198];
  const iris = [150, 131, 213];
  const amber = [219, 166, 121];
  const a = ((angle % 360) + 360) % 360;
  if (a < 130) return mix(teal, amber, a / 130);
  if (a < 250) return mix(amber, iris, (a - 130) / 120);
  return mix(iris, teal, (a - 250) / 110);
}

function roundedRectAlpha(x, y, size, radius) {
  const cx = Math.max(radius, Math.min(size - radius, x));
  const cy = Math.max(radius, Math.min(size - radius, y));
  const d = Math.hypot(x - cx, y - cy);
  return clamp((radius - d) / 1.4);
}

function render(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const center = size / 2;
  const ringR = size * (maskable ? 0.265 : 0.292);
  const thickness = size * (maskable ? 0.058 : 0.064);
  const dotR = size * (maskable ? 0.05 : 0.056);
  const corner = size * 0.235;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const px = x + 0.5;
      const py = y + 0.5;

      // Background: deep ink with a faint vertical lift.
      const t = y / size;
      let r = 11 + 5 * (1 - t);
      let g = 13 + 7 * (1 - t);
      let b = 16 + 9 * (1 - t);
      let alpha = maskable ? 1 : roundedRectAlpha(px, py, size, corner);

      // Aurora washes.
      const d1 = Math.hypot(px - size * 0.72, py - size * 0.2) / (size * 0.62);
      const glow1 = Math.max(0, 1 - d1) ** 2 * 0.3;
      r = r * (1 - glow1) + 70 * glow1;
      g = g * (1 - glow1) + 160 * glow1;
      b = b * (1 - glow1) + 148 * glow1;

      const d2 = Math.hypot(px - size * 0.2, py - size * 0.84) / (size * 0.7);
      const glow2 = Math.max(0, 1 - d2) ** 2 * 0.24;
      r = r * (1 - glow2) + 126 * glow2;
      g = g * (1 - glow2) + 104 * glow2;
      b = b * (1 - glow2) + 188 * glow2;

      const dx = px - center;
      const dy = py - center;
      const dist = Math.hypot(dx, dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      // Ring with a small opening at the bottom.
      const inRing = Math.abs(dist - ringR) <= thickness / 2;
      const gap = angle > 80 && angle < 100;
      if (inRing && !gap) {
        const col = gradientAt(angle);
        const edge = 1 - clamp((Math.abs(dist - ringR) - thickness / 2) / 1.2);
        const a = clamp(edge);
        r = r * (1 - a) + col[0] * a;
        g = g * (1 - a) + col[1] * a;
        b = b * (1 - a) + col[2] * a;
      }

      // Warm centre.
      const dotEdge = clamp(dotR - dist);
      if (dotEdge > 0) {
        const a = clamp(dotEdge / 1.2);
        r = r * (1 - a) + 244 * a;
        g = g * (1 - a) + 231 * a;
        b = b * (1 - a) + 213 * a;
      }

      buf[i] = Math.round(r);
      buf[i + 1] = Math.round(g);
      buf[i + 2] = Math.round(b);
      buf[i + 3] = Math.round(alpha * 255);
    }
  }
  return encodePng(size, buf);
}

const files = [
  ['icon-180.png', 180, {}],
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-maskable-512.png', 512, { maskable: true }],
];

for (const [name, size, options] of files) {
  writeFileSync(join(outDir, name), render(size, options));
  console.log(`wrote icons/${name}`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Mira">
  <defs>
    <linearGradient id="ring" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#9683d5"/>
      <stop offset=".45" stop-color="#7ed3c6"/>
      <stop offset="1" stop-color="#dba679"/>
    </linearGradient>
    <radialGradient id="glow" cx=".72" cy=".2" r=".7">
      <stop offset="0" stop-color="#46a094" stop-opacity=".55"/>
      <stop offset="1" stop-color="#46a094" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="120" fill="#0d0f12"/>
  <rect width="512" height="512" rx="120" fill="url(#glow)"/>
  <circle cx="256" cy="256" r="160" fill="none" stroke="url(#ring)" stroke-width="33"
    stroke-linecap="round" stroke-dasharray="925 80" transform="rotate(90 256 256)"/>
  <circle cx="256" cy="256" r="29" fill="#f4e7d5"/>
</svg>
`;
writeFileSync(join(outDir, 'icon.svg'), svg);
console.log('wrote icons/icon.svg');
