import { debounce } from '../core/debounce.js';
import { HttpError } from '../core/errors/HttpError.js';
import { mapCountryResponse } from '../core/mapCountryResponse.js';
import { searchCountries } from '../core/searchCountries.js';
import { DEBOUNCE_MS, TIMEOUT_MS } from '../helpers/variables.js';
import type { CountryCardType, SearchControllerType, SearchStateType } from '../type/type.js';
import { apiCache } from './apiCache.js';
import { createSearchSignal } from './createSearchSignal.js';

type ListenerType = (state: SearchStateType) => void;
export const createSearchController = (initialCacheJson?: string): SearchControllerType => {
	let cache = apiCache.createCache<string, CountryCardType[]>();

	if (initialCacheJson) {
		const result = apiCache.deserialize<string, CountryCardType[]>(initialCacheJson);
		if (result.ok) cache = result.value;
	}

	let state: SearchStateType = {
		query: '',
		results: [],
		error: null,
		isLoading: false,
	};

	let controller: AbortController | null = null;
	let lastQuery = '';
	const listeners = new Set<ListenerType>();

	const notify = () => listeners.forEach((fn) => fn(state));

	const updateState = (patch: Partial<SearchStateType>) => {
		state = { ...state, ...patch };
		notify();
	};

	const abortActiveRequest = () => {
		controller?.abort();
		controller = null;
	};

	const executeSearch = async (query: string) => {
		const key = query.toLowerCase();
		const hit = apiCache.getCache(cache, key);

		if (hit) {
			cache = hit.cache;
			updateState({ results: hit.value, error: null, isLoading: false });
			return;
		}

		abortActiveRequest();
		const abortController = new AbortController();
		controller = abortController;
		lastQuery = query;

		const signal = createSearchSignal(abortController.signal, TIMEOUT_MS);

		try {
			const raw = await searchCountries(query, signal);
			if (abortController.signal.aborted) return;
			const cards = raw.map(mapCountryResponse);
			cache = apiCache.setCache(cache, key, cards);
			updateState({ results: cards, error: null, isLoading: false });
		} catch (error) {
			if (abortController.signal.aborted) return;
			if (error instanceof DOMException && error.name === 'AbortError') return;
			if (error instanceof DOMException && error.name === 'TimeoutError') return updateState({ error: 'timeout' });
			if (error instanceof HttpError) return updateState({ error: `server:${error.status}` });
			if (error instanceof TypeError) return updateState({ error: 'network' });
			throw error;
		} finally {
			if (controller === abortController) {
				controller = null;
				updateState({ isLoading: false });
			}
		}
	};

	const debouncedSearch = debounce((query: string) => {
		updateState({ query, isLoading: true, error: null, results: [] });
		executeSearch(query);
	}, DEBOUNCE_MS);

	const getCacheSnapshot = (): string => apiCache.serialize(cache);

	return {
		getState: () => state,
		subscribe: (fn) => {
			listeners.add(fn);
			fn(state);
			return () => listeners.delete(fn);
		},

		setQuery: (query) => {
			const trimmed = query.trim();

			debouncedSearch.cancel();
			abortActiveRequest();

			if (!trimmed) {
				updateState({ query: '', results: [], error: null, isLoading: false });
				return;
			}
			debouncedSearch(trimmed);
		},

		retry: () => {
			if (lastQuery) {
				debouncedSearch.cancel();
				abortActiveRequest();
				updateState({ isLoading: true, error: null });
				executeSearch(lastQuery);
			}
		},

		clearCache: () => {
			cache = apiCache.clearCache();
		},
		getCacheSnapshot,
	};
};
