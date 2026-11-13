import type { CountryCardType, DataType } from '../type/type.js';

export const mapCountryResponse = (raw: DataType): CountryCardType => {
	const languages: string[] = raw.languages?.map((l) => l?.name).filter(Boolean) ?? [];
	const { name = '', flag = '', capital = '', region = '', population = 0, flags } = raw;
	const flagUrl = flags?.svg ?? flags?.png ?? '';
	return { name, flag, region, population, capital, languages, flagUrl };
};
