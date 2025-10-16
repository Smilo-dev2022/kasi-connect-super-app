import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    // Keep default excludes and add workspace-specific ones
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.git/**',
      'iKasiLinkMobileApp/**',
      'agent7-messaging/test/**/*.js',
    ],
    include: [
      'src/test/**/*.test.ts?(x)',
      'agent7-messaging/test/**/*.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});