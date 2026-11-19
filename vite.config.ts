import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig(({ command }) => ({
  // Relative assets keep the same build working on GitHub Pages project sites
  // (/Mira/), custom domains and Capacitor's local web view.
  base: command === 'build' ? './' : '/',
  plugins: [preact()],
  build: {
    target: 'es2022',
  },
}));
