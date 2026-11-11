import { debounce } from '../core/debounce.js';

describe('debounce', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('calls function after delay', () => {
		const fn = vi.fn();
		const debouncedFn = debounce(fn, 100);

		debouncedFn('it');
		expect(fn).not.toHaveBeenCalled();

		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith('it');
	});

	it('resets timer on subsequent calls', () => {
		const fn = vi.fn();
		const debouncedFn = debounce(fn, 500);

		debouncedFn('sp');
		vi.advanceTimersByTime(250);

		debouncedFn('italy');
		vi.advanceTimersByTime(250);
		expect(fn).not.toHaveBeenCalled();

		vi.advanceTimersByTime(250);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith('italy');
	});

	it('coalesces multiple rapid calls into one', () => {
		const fn = vi.fn();
		const debouncedFn = debounce(fn, 200);

		debouncedFn(1);
		debouncedFn(2);
		debouncedFn(3);

		vi.advanceTimersByTime(199);
		expect(fn).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith(3);
	});

	it('forwards multiple arguments correctly', () => {
		const fn = vi.fn();
		const debouncedFn = debounce(fn, 250);

		debouncedFn('a', 'b', { c: 1 });
		vi.advanceTimersByTime(250);

		expect(fn).toHaveBeenCalledWith('a', 'b', { c: 1 });
	});

	it('should not invoke the function if cancel is called before delay expires', () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 500);

		debounced('Ukraine');
		vi.advanceTimersByTime(300);

		debounced.cancel();

		vi.advanceTimersByTime(500);

		expect(fn).not.toHaveBeenCalled();
	});
});
