import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		globals: true,
		clearMocks: true,
		restoreMocks: true,

		include: ['**/*.{test,spec}.ts'],

		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['**/*.test.ts', '**/*.spec.ts', '**/*.d.ts', 'vitest.config.ts'],
		},
	},
});
