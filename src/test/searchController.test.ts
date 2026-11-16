import type { Mock } from 'vitest';
import { createSearchController } from '../api/searchController.js';
import { HttpError } from '../core/errors/HttpError.js';
import { searchCountries, type SearchResponseType } from '../core/searchCountries.js';
import type { DataType } from '../type/type.js';

const RAW_COUNTRY: Partial<DataType> = {
	name: 'Italy',
	flag: '🇮🇹',
	capital: 'Rome',
	region: 'Europe',
	population: 59554023,
	languages: [{ name: 'Italian', iso639_1: 'it', iso639_2: 'ita', nativeName: 'Italiano' }],
	flags: { png: 'https://flagcdn.com/w320/it.png', svg: 'https://flagcdn.com/it.svg' },
};

vi.mock('../core/debounce', () => ({
	debounce: vi.fn((fn) => {
		const debouncedFn = vi.fn(fn);
		debouncedFn.cancel = vi.fn();
		return debouncedFn;
	}),
}));
vi.mock('../core/searchCountries');
const mockSearchCountries = vi.mocked(searchCountries) as Mock<
	(query: string, signal?: AbortSignal) => Promise<SearchResponseType>
>;

describe('searchController', () => {
	let ctrl: ReturnType<typeof createSearchController>;
	beforeEach(() => {
		mockSearchCountries.mockReset();
		ctrl = createSearchController();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	const state = () => ctrl.getState();

	const mockSuccess = (data: DataType[] = [RAW_COUNTRY as DataType]): SearchResponseType => ({
		data,
		status: 200,
	});

	it('aborts previous request immediately on new input', async () => {
		let resolveFirst!: (v: SearchResponseType) => void;
		const firstPromise = new Promise<SearchResponseType>((resolve) => (resolveFirst = resolve));

		mockSearchCountries
			.mockImplementationOnce(() => firstPromise)
			.mockResolvedValueOnce(mockSuccess([RAW_COUNTRY as DataType]));

		ctrl.setQuery('ita');
		expect(mockSearchCountries).toHaveBeenCalledTimes(1);

		ctrl.setQuery('italy');
		expect(mockSearchCountries).toHaveBeenCalledTimes(2);

		await vi.waitFor(() => expect(state()?.results[0]?.name).toBe('Italy'));
		expect(state().error).toBeNull();
		resolveFirst(mockSuccess());
	});

	it('silently ignores AbortError', async () => {
		mockSearchCountries.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

		ctrl.setQuery('ita');

		await vi.waitFor(() => expect(state().error).toBeNull());
		expect(state().results).toEqual([]);
	});

	it('sets error="timeout" on TimeoutError', async () => {
		mockSearchCountries.mockRejectedValueOnce(new DOMException('Timeout', 'TimeoutError'));

		ctrl.setQuery('ita');

		await vi.waitFor(() => expect(state().error).toBe('timeout'));
	});
	//  HTTP ERROR (4xx/5xx)
	it('sets error="server:STATUS" on HttpError', async () => {
		mockSearchCountries.mockRejectedValueOnce(new HttpError('Server Error', 500));

		ctrl.setQuery('ita');

		await vi.waitFor(() => expect(state().error).toBe('server:500'));
	});

	it('sets error="network" on TypeError', async () => {
		mockSearchCountries.mockRejectedValueOnce(new TypeError('Failed to fetch'));

		ctrl.setQuery('ita');

		await vi.waitFor(() => expect(state().error).toBe('network'));
	});

	it('maps raw response to CountryCardType on success', async () => {
		mockSearchCountries.mockResolvedValueOnce(mockSuccess([RAW_COUNTRY as DataType]));

		ctrl.setQuery('ita');

		await vi.waitFor(() => expect(state().results.length).toBe(1));
		expect(state().results[0]).toMatchObject({ name: 'Italy' });
	});

	it('retries last query on retry()', async () => {
		mockSearchCountries.mockResolvedValueOnce(mockSuccess([RAW_COUNTRY as DataType]));

		ctrl.setQuery('ita');
		await vi.waitFor(() => expect(state().results.length).toBe(1));
		mockSearchCountries.mockRejectedValueOnce(new TypeError('Failed'));
		ctrl.setQuery('italy');
		await vi.waitFor(() => expect(state().error).toBe('network'));

		mockSearchCountries.mockResolvedValueOnce(mockSuccess([RAW_COUNTRY as DataType]));
		ctrl.retry();

		await vi.waitFor(() => expect(state().results.length).toBe(1));
		expect(state().error).toBeNull();
	});
});
