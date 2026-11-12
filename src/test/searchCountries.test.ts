import { HttpError } from '../core/errors/HttpError.js';
import { searchCountries } from '../core/searchCountries.js';
import { API_BASE_URL } from '../helpers/variables.js';

const mockFetch = vi.fn<typeof fetch>();
globalThis.fetch = mockFetch;

const QUERY = 'it';

describe('searchCountries', () => {
	beforeEach(() => mockFetch.mockReset());
	afterEach(() => vi.resetAllMocks());

	it('returns countries array on 200 OK', async () => {
		const data = [{ name: 'Italy', code: 'It' }];
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => data,
		} as Response);

		const result = await searchCountries(QUERY);

		expect(result).toEqual(data);
		expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}${QUERY}`, expect.objectContaining({}));
	});

	it('returns empty array on 404 Not Found - not error', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 404,
			statusText: 'Not Found',
		} as Response);

		const result = await searchCountries('no-match-xyz');

		expect(result).toEqual([]);
	});

	it('passes AbortSignal to fetch', async () => {
		const controller = new AbortController();
		mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] } as Response);

		await searchCountries(QUERY, controller.signal);

		expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal: controller.signal }));
	});

	it('throws HttpError on 500 Internal Server Error', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
			statusText: 'Internal Server Error',
		} as Response);

		await expect(searchCountries(QUERY)).rejects.toMatchObject({
			name: 'HttpError',
			status: 500,
		});
	});

	it('throws HttpError on 400 Bad Request', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 400,
			statusText: 'Bad Request',
		} as Response);

		await expect(searchCountries(QUERY)).rejects.toThrow(HttpError);
	});

	it('throws HttpError on 503 Service Unavailable', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 503,
			statusText: 'Service Unavailable',
		} as Response);

		await expect(searchCountries(QUERY)).rejects.toThrow(HttpError);
	});

	it('propagates AbortError when request is cancelled', async () => {
		const abortError = new Error('Aborted');
		abortError.name = 'AbortError';
		Object.defineProperty(abortError, 'code', { value: 20 });

		mockFetch.mockRejectedValueOnce(abortError);

		await expect(searchCountries(QUERY)).rejects.toMatchObject({
			name: 'AbortError',
			code: 20,
		});
	});

	it('propagates TypeError on network failure (offline/DNS/timeout)', async () => {
		mockFetch
			.mockRejectedValueOnce(new TypeError('Failed to fetch'))
			.mockRejectedValueOnce(new TypeError('Failed to fetch'));

		await expect(searchCountries(QUERY)).rejects.toThrow(TypeError);
		await expect(searchCountries(QUERY)).rejects.toThrow(/fetch|network/i);
	});
});
