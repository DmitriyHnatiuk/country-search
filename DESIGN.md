# DESIGN.md

## Request Cancellation

**Mechanism:** `AbortController` + `AbortSignal.any([userSignal, timeoutSignal])` passed to `searchCountries`.

**Why not a boolean flag?**

- **Flag** only prevents _rendering_ a stale response. The request still consumes bandwidth, CPU (JSON parsing), and server resources. Race condition window remains open.
- **AbortController** cancels at the **network layer** (`fetch` rejects immediately). Zero wasted bandwidth, zero parsing, server can cancel work early. It is the standard Web Platform primitive for this.

## Debounce Delay (800 ms)

**Chosen:** 800 ms — standard UX sweet spot for "type-ahead".

| Scenario                 | Consequence                                                                                   |
| :----------------------- | :-------------------------------------------------------------------------------------------- |
| **Removed (0 ms)**       | Request on every keystroke → DDoS own backend, rate limits hit, UI flicker, wasted resources. |
| **Too low (< 300 ms)**   | False triggers during normal typing, same as above but slightly less.                         |
| **Too high (> 1000 ms)** | Perceived lag. User waits visibly for suggestions after stopping typing.                      |
| **800 ms**               | Balances server load vs perceived instant feedback.                                           |

## Cache Strategy (FIFO, max 5 entries)

**Implementation:** `apiCache.ts` — immutable `Map` wrapper. `setCache` creates a new `Map`, appends entry, if `size > 5` deletes the **oldest** key (`map.keys().next().value`).

**What is stored:** **Raw API response** (`RawCountry[]`) per query key.

- Allows instant list render on cache hit (map to `CountryCardType` on read).
- Provides full data for Modal (`officialName`, `currencies`, `area`, etc.) without extra fields in UI model.
- `countryByName` Map (name → RawCountry) rebuilt on init from cache and updated on every network response.

**Eviction:** FIFO (First In, First Out) — simple, predictable memory bound (≤ 5 queries × ~200 countries).

## Error Handling & Retry Strategy

| HTTP Status           | Classification                  | State Flag                                         | Toast                                              | Action                                                                                         |
| :-------------------- | :------------------------------ | :------------------------------------------------- | :------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **200**               | Success                         | `results`, `error: null`, `notFound: false`        | —                                                  | —                                                                                              |
| **404**               | **Not an error** — "no matches" | `results: []`, `error: null`, `notFound: true`     | 🟦 **Info**: "Nothing found for «q»"               | ( Ok button, restore last success)                                                             |
| **5xx**               | Server error                    | `error: 'server:500'`, `notFound: false`           | 🟥 **Error**: "Server error (500)" + **Retry**     | `restoreLastSuccess()` → loads **last successful query** (200 OK), updates input, shows loader |
| **Network / Timeout** | Transport error                 | `error: 'network' \| 'timeout'`, `notFound: false` | 🟥 **Error**: "No internet connection" + **Retry** | `restoreLastSuccess()` → loads **last successful query** (200 OK)                              |

**Retry Button Behavior:** Always calls `restoreLastSuccess()`.

- If `lastSuccessfulQuery` exists → loads it, updates input.
- If **none** (first request failed) → clears input, hides loader/toasts.

**Toast Deduplication:** Single `stateKey` (`error:...` | `notfound:...` | `idle`) prevents flicker/duplicates. Priority: Error > NotFound > Idle.

## Complexity (Big O)

| Function / Feature        | Time     | Space    | Notes                                                                    |
| :------------------------ | :------- | :------- | :----------------------------------------------------------------------- |
| `mapCountryResponse`      | **O(1)** | **O(1)** | Fixed field access, `Object.values(languages)` bounded by max ~10 langs. |
| `apiCache.get/set`        | **O(1)** | **O(1)** | `Map` lookup/insert. Max 5 entries → constant upper bound.               |
| `countryByName.get/set`   | **O(1)** | **O(N)** | N = unique countries seen across cached queries (≤ 1000).                |
| `debounce`                | **O(1)** | **O(1)** | Single timer reference.                                                  |
| Request deduplication     | **O(1)** | **O(1)** | Single `AbortController` reference per controller instance.              |
| `restoreLastSuccess` init | **O(C)** | **O(1)** | C = cache entries (≤ 5), runs once on startup.                           |

## Clean Code Principles Applied

| Principle                         | Location                | Details                                                                                                                               |
| :-------------------------------- | :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| **Single Responsibility (SRP)**   | `searchCountries.ts`    | Only HTTP + status mapping. No UI, no debounce, no cache.                                                                             |
|                                   | `mapCountryResponse.ts` | Pure data transformation. No side effects.                                                                                            |
|                                   | `searchController.ts`   | Orchestration only (debounce, abort, cache, state, name index, retry/restore).                                                        |
|                                   | `apiCache.ts`           | Cache mechanics (immutable Map, serialization, FIFO limit).                                                                           |
| **Pure Functions / Immutability** | `mapCountryResponse.ts` | Input → Output, no mutation.                                                                                                          |
|                                   | `apiCache.ts`           | `getCache/setCache/clearCache` return new objects.                                                                                    |
|                                   | `searchController.ts`   | State updates via `state = { ...state, ...patch }`.                                                                                   |
| **Dependency Inversion (DIP)**    | `searchController.ts`   | Depends on _abstractions_ (`searchCountries`, `debounce`, `apiCache`), not concrete globals. Easy to mock/test.                       |
| **Separation of Concerns**        | `createSearchSignal.ts` | Signal composition logic isolated.                                                                                                    |
|                                   | `errors/HttpError.ts`   | Domain error class, decoupled from transport.                                                                                         |
| **Fail Fast / Explicit Errors**   | `searchCountries.ts`    | Throws typed errors (`HttpError`, `TypeError`, `DOMException`) instead of returning error tuples.                                     |
|                                   | `searchController.ts`   | `catch` block maps _only_ known errors to UI strings; unknown re-thrown.                                                              |
| **DRY**                           | `apiCache.ts`           | Single `Cache` object encapsulates Map logic, serialization, limit.                                                                   |
|                                   | `searchController.ts`   | `startSearch` helper deduplicates `setQuery`/`retry`/`restoreLastSuccess` logic.                                                      |
| **Meaningful Names**              | Everywhere              | `AbortError` vs `TimeoutError`, `executeSearch`, `debouncedSearch`, `countryByName`, `RawCountry`, `lastSuccessfulQuery`, `notFound`. |

## Data Flow Summary

1. **User types** → `setQuery` → debounce (800ms) → `executeSearch`.
2. **Cache hit** → `raw[]` from `apiCache` → `mapCountryResponse` → `state.results` + `countryByName` updated. If `raw.length === 0` → `notFound: true`.
3. **Cache miss** → `fetch` (with `AbortSignal` + timeout) → `SearchResponse { data, status }`.
   - `status === 404` → cache `[]`, `state = { results: [], notFound: true, error: null }`.
   - `status === 200` → cache `raw[]`, `lastSuccessfulQuery = query`, `countryByName` updated, `state = { results: mapped, notFound: false }`.
   - `status >= 500` / network error → `state = { error: 'server:500' \| 'network', notFound: false }`.
4. **Click card** → `controller.getCountry(name)` → `countryByName.get` → `Modal.open(raw)`.
5. **Error Toast + Retry** → `controller.restoreLastSuccess()` → loads `lastSuccessfulQuery` (last 200 OK), updates input, shows loader. If none → clears UI.
6. **404 Toast** → Info "Nothing found for «q»", auto-close 3s, no action.
7. **Persist** → debounced `localStorage.setItem(JSON.stringify(apiCache.serialize()))`.
