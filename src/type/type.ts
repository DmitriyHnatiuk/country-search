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
	error: string | undefined;
	isLoading: boolean;
};

export type SearchControllerType = {
	getState: () => SearchStateType;
	subscribe: (fn: (state: SearchStateType) => void) => () => void;
	setQuery: (q: string) => void;
	retry: () => void;
	clearCache: () => void;
};
