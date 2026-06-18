import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'TrailAuth',
      fileName: 'bundle',
      formats: ['iife'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: true,
    rollupOptions: {
      external: ['@lit/localize', '@/features/localization'],
      output: {
        globals: {
          '@lit/localize': '__litLocalize',
          '@/features/localization': '__argiagoLocalization',
        },
      },
    },
  },
});
