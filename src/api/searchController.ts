import { debounce } from '../core/debounce.js';
import { HttpError } from '../core/errors/HttpError.js';
import { mapCountryResponse } from '../core/mapCountryResponse.js';
import { searchCountries } from '../core/searchCountries.js';
import { DEBOUNCE_MS, TIMEOUT_MS } from '../helpers/variables.js';
import type { DataType, SearchControllerType, SearchStateType } from '../type/type.js';
import { apiCache } from './apiCache.js';
import { createSearchSignal } from './createSearchSignal.js';

type ListenerType = (state: SearchStateType) => void;
export const createSearchController = (initialCacheJson?: string): SearchControllerType => {
	let cache = apiCache.createCache<string, DataType[]>();
	let countryByName = new Map<string, DataType>();
	if (initialCacheJson) {
		const result = apiCache.deserialize<string, DataType[]>(initialCacheJson);
		if (result.ok) {
			cache = result.value;
			countryByName = new Map(
				Array.from(cache.map.values())
					.flat()
					.reduce((map, raw) => {
						const key = raw.name?.toLowerCase();
						if (key) map.set(key, raw);
						return map;
					}, new Map<string, DataType>())
			);
		}
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
			updateState({ results: hit.value.map(mapCountryResponse), error: null, isLoading: false });
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
			raw.map((c: DataType) => (c.name ? countryByName.set(c.name.toLowerCase(), c) : ''));
			cache = apiCache.setCache(cache, key, raw);

			const cards = raw.map(mapCountryResponse);
			for (const r of raw) {
				const k = r.name?.toLowerCase();
				if (k) countryByName.set(k, r);
			}

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
			countryByName.clear();
		},
		getCacheSnapshot,
		getCountry: (name: string) => countryByName.get(name.toLowerCase()) || null,
	};
};
