export function createSearchSignal(externalSignal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
	const timeoutSignal = AbortSignal.timeout(timeoutMs);
	const signals = [externalSignal, timeoutSignal].filter((s): s is AbortSignal => s !== undefined);
	return AbortSignal.any(signals);
}
