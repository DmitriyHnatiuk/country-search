import { debounce } from '../core/debounce.js';
import { HttpError } from '../core/errors/HttpError.js';
import { mapCountryResponse } from '../core/mapCountryResponse.js';
import { searchCountries } from '../core/searchCountries.js';
import type { CountryCardType, SearchControllerType, SearchStateType } from '../type/type.js';
import { apiCache } from './apiCache.js';
import { createSearchSignal } from './createSearchSignal.js';

export const createSearchController = (): SearchControllerType => {
	let state: SearchStateType = {
		query: '',
		results: [],
		error: undefined,
		isLoading: false,
	};
	let cache = apiCache.createCache<string, CountryCardType[]>();
	let controller: AbortController | null = null;
	let lastQuery = '';
	const listeners = new Set<() => void>();

	const notify = () => listeners.forEach((fn) => fn());
	const updateState = (patch: Partial<typeof state>) => {
		state = { ...state, ...patch };
		notify();
	};

	const executeSearch = async (query: string) => {
		const key = query.toLowerCase();

		const hit = apiCache.getCache(cache, key);
		if (hit) {
			cache = hit.cache;
			updateState({ results: hit.value, error: undefined, isLoading: false });
			return;
		}

		controller?.abort();
		const abortController = new AbortController();
		controller = abortController;
		lastQuery = query;

		const signal = createSearchSignal(abortController.signal, 5000);
		updateState({ isLoading: true, error: undefined });

		try {
			const raw = await searchCountries(query, signal);
			const cards = raw.map(mapCountryResponse);
			cache = apiCache.setCache(cache, key, cards);
			updateState({ results: cards });
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			if (error instanceof DOMException && error.name === 'TimeoutError') return updateState({ error: 'timeout' });
			if (error instanceof HttpError) return updateState({ error: `server:${error.status}` });
			if (error instanceof TypeError) return updateState({ error: 'network' });
			throw error;
		} finally {
			updateState({ isLoading: false });
		}
	};

	const debouncedSearch = debounce(executeSearch, 300);

	return {
		getState: () => state,
		subscribe: (fn) => {
			listeners.add(fn);
			return () => listeners.delete(fn);
		},

		setQuery: (query) => {
			state.query = query;
			controller?.abort();
			debouncedSearch(query);
		},

		retry: () => {
			if (lastQuery) executeSearch(lastQuery);
		},

		clearCache: () => {
			cache = apiCache.clearCache();
		},
	};
};
