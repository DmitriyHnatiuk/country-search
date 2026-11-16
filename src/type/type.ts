type LanguagesType = {
	name: string;
	iso639_1?: string;
	iso639_2?: string;
	nativeName?: string;
};

type FlagsType = {
	png?: string;
	svg?: string;
};

export type DataType = {
	name?: string;
	flag?: string;
	capital?: string;
	region?: string;
	population?: number;
	languages?: LanguagesType[];
	flags?: FlagsType;
	gini?: number;
	area: number;
	cioc: string;
	latlng: number[];
	borders: string[];
	demonym: string;
	subregion: string;
	timezones: string[];
	alpha2Code: string;
	alpha3Code: string;
	currencies: [
		{
			code: string;
			name: string;
			symbol: string;
		},
	];
	nativeName: string;
	independent: boolean;
	numericCode: string;
	callingCodes: string[];
	topLevelDomain: string[];
	populationDensity: number;
};

export type CountryCardType = {
	name: string;
	flag: string;
	capital: string;
	region: string;
	population: number;
	languages: string[];
	flagUrl: string;
};

export type SearchStateType = {
	query: string;
	results: CountryCardType[];
	error: string | null;
	notFound: boolean;
	isLoading: boolean;
};

export type SearchControllerType = {
	getState: () => SearchStateType;
	subscribe: (fn: (state: SearchStateType) => void) => () => void;
	setQuery: (q: string) => void;
	retry: () => void;
	clearCache: () => void;
	getCacheSnapshot: () => string;
	getCountry: (name: string) => DataType | null;
	restoreLastSuccess: () => void;
};
