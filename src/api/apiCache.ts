export type ApiCacheType<K, V> = {
	readonly map: ReadonlyMap<K, V>;
};

export const apiCache = {
	createCache<K, V>(): ApiCacheType<K, V> {
		return { map: new Map() };
	},

	getCache<K, V>(cache: ApiCacheType<K, V>, key: K): { value: V; cache: ApiCacheType<K, V> } | undefined {
		const value = cache.map.get(key);
		if (value === undefined) return undefined;
		return { value, cache };
	},

	setCache<K, V>(cache: ApiCacheType<K, V>, key: K, value: V): ApiCacheType<K, V> {
		return {
			map: new Map(cache.map).set(key, value),
		};
	},

	clearCache<K, V>(): ApiCacheType<K, V> {
		return this.createCache();
	},
};
