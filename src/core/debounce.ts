type Debounced<Args extends unknown[]> = {
	(...args: Args): void;
	cancel(): void;
};

export const debounce = <Args extends unknown[]>(fn: (...args: Args) => void, delay: number): Debounced<Args> => {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	const debounced = (...args: Args): void => {
		if (timeoutId !== null) clearTimeout(timeoutId);

		timeoutId = setTimeout(() => {
			timeoutId = null;
			fn(...args);
		}, delay);
	};

	debounced.cancel = (): void => {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	};

	return debounced;
};
