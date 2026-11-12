import type { DataType } from '../type/type.js';

export const searchCountries = (query: string, signal?: AbortSignal): DataType[] => {
	throw new Error('Not implemented', { cause: { query, signal } });
};
