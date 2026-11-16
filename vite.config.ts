import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' → der dist-Ordner läuft unter jedem Pfad (Cloudflare Pages, interner Webserver, Unterordner).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  test: { environment: 'node' },
});
