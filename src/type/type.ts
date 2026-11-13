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
