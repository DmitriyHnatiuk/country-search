export type ApiCacheType<K, V> = {
	readonly map: ReadonlyMap<K, V>;
};

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

const createCache = <K, V>(): ApiCacheType<K, V> => ({ map: new Map() });

const getCache = <K, V>(cache: ApiCacheType<K, V>, key: K): { value: V; cache: ApiCacheType<K, V> } | undefined => {
	const value = cache.map.get(key);
	if (value === undefined) return undefined;

	return { value, cache };
};

const setCache = <K, V>(cache: ApiCacheType<K, V>, key: K, value: V): ApiCacheType<K, V> => {
	return {
		map: new Map(cache.map).set(key, value),
	};
};

const clearCache = <K, V>(): ApiCacheType<K, V> => {
	return createCache();
};

const serialize = <K, V>(cache: ApiCacheType<K, V>): string => {
	return JSON.stringify([...cache.map.entries()]);
};

const deserialize = <K, V>(json: string): Result<ApiCacheType<K, V>> => {
	try {
		const entries: [K, V][] = JSON.parse(json);
		const cache = entries.reduce((acc, [key, value]) => setCache(acc, key, value), createCache<K, V>());

		return { ok: true, value: cache };
	} catch (e) {
		return { ok: false, error: e as Error };
	}
};

export const apiCache = {
	createCache,
	getCache,
	setCache,
	clearCache,
	serialize,
	deserialize,
};
