import { createSearchSignal } from '../api/createSearchSignal.js';

describe('createSearchSignal', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('creates an AbortSignal from external signal and timeout', () => {
		const external = new AbortController().signal;
		const signal = createSearchSignal(external, 1000);

		expect(signal).toBeInstanceOf(AbortSignal);
	});

	it('fires TimeoutError when timeout elapses', async () => {
		const signal = createSearchSignal(undefined, 50);
		const abortPromise = new Promise((_, reject) => {
			signal.addEventListener('abort', () => reject(signal.reason));
		});

		vi.advanceTimersByTime(50);

		await expect(abortPromise).rejects.toMatchObject({
			name: 'TimeoutError',
		});
	});

	it('fires AbortError when external signal aborts', async () => {
		const controller = new AbortController();
		const signal = createSearchSignal(controller.signal, 5000);
		const abortPromise = new Promise((_, reject) => {
			signal.addEventListener('abort', () => reject(signal.reason));
		});

		controller.abort();

		await expect(abortPromise).rejects.toMatchObject({
			name: 'AbortError',
		});
	});

	it('prefers external abort over timeout', async () => {
		const controller = new AbortController();
		const signal = createSearchSignal(controller.signal, 50);
		const abortPromise = new Promise((_, reject) => {
			signal.addEventListener('abort', () => reject(signal.reason));
		});

		controller.abort();
		vi.advanceTimersByTime(100);

		await expect(abortPromise).rejects.toMatchObject({
			name: 'AbortError',
		});
	});
});
