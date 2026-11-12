import { API_BASE_URL } from '../helpers/variables.js';
import type { DataType } from '../type/type.js';
import { HttpError } from './errors/HttpError.js';

export async function searchCountries(query: string, signal?: AbortSignal): Promise<DataType[]> {
	const url = `${API_BASE_URL}${encodeURIComponent(query)}`;

	try {
		const res = await fetch(url, { ...(signal && { signal }) });

		if (res.ok) return res.json() as Promise<DataType[]>;

		if (res.status === 404) return [];

		throw HttpError.fromResponse(res);
	} catch (error) {
		if (error instanceof HttpError || error instanceof TypeError || error instanceof DOMException) {
			throw error;
		}
		if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
			throw error;
		}
		throw new Error('Unknown fetch error', { cause: error });
	}
}
