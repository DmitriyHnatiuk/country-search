import { mapCountryResponse } from '../core/mapCountryResponse.js';
import type { DataType } from '../type/type.js';

const RAW_COUNTRY: DataType = {
	name: 'Italy',
	flag: '🇮🇹',
	capital: 'Rome',
	region: 'Europe',
	population: 59554023,
	languages: [{ name: 'Italian', iso639_1: 'it', iso639_2: 'ita', nativeName: 'Italiano' }],
	flags: { png: 'https://flagcdn.com/w320/it.png', svg: 'https://flagcdn.com/it.svg' },
};

describe('mapCountryResponse', () => {
	it('maps required fields for UI card', () => {
		const result = mapCountryResponse(RAW_COUNTRY);

		expect(result).toEqual({
			name: 'Italy',
			flag: '🇮🇹',
			capital: 'Rome',
			region: 'Europe',
			population: 59554023,
			languages: ['Italian'],
			flagUrl: 'https://flagcdn.com/it.svg',
		});
	});

	it('handles missing optional fields gracefully', () => {
		const { capital, languages, ...rest } = RAW_COUNTRY;
		const result = mapCountryResponse(rest);

		expect(result.capital).toBe('');
		expect(result.languages).toEqual([]);
	});

	it('falls back to png if svg missing', () => {
		const raw = { ...RAW_COUNTRY, flags: { png: 'https://flagcdn.com/w320/ua.png' } };
		const result = mapCountryResponse(raw);

		expect(result.flagUrl).toBe('https://flagcdn.com/w320/ua.png');
	});

	it('returns empty string for flag if both missing', () => {
		const raw = { ...RAW_COUNTRY, flags: {} };
		const result = mapCountryResponse(raw);

		expect(result.flagUrl).toBe('');
	});

	it('joins multiple languages', () => {
		const raw = {
			...RAW_COUNTRY,
			languages: [{ name: 'Italian' }, { name: 'English' }, { name: 'French' }],
		};
		expect(mapCountryResponse(raw).languages).toEqual(['Italian', 'English', 'French']);
	});
});
