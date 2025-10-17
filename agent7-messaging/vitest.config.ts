import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		coverage: { reporter: ['text', 'lcov'] },
		include: ['test/**/*.test.ts'],
		exclude: ['**/*.test.js', '**/node_modules/**', '**/dist/**'],
	},
});

