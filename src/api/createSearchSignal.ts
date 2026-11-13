export function createSearchSignal(externalSignal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
	throw new Error('Not implemented', { cause: { externalSignal, timeoutMs } });
}
