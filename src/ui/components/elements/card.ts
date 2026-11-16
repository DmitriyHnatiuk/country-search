import { mapCountryResponse } from '../../../core/mapCountryResponse.js';
import { createElement } from '../../../helpers/createElement.js';
import type { CountryCardType, DataType } from '../../../type/type.js';

const createParam = (label: string, value: string) => {
	const p = createElement({
		tag: 'p',
		className: 'country__card--param',
		appendElements: [
			createElement({ tag: 'strong', textContent: `${label}: ` }),
			createElement({ tag: 'span', textContent: value }),
		],
	});
	return p;
};

export const countryCard = (country: CountryCardType) => {
	const li = createElement({ tag: 'li', className: 'country__card' });
	li.dataset.countryName = country.name;

	const flag = createElement({
		tag: 'img',
		className: 'country__card--flag',
		src: country.flagUrl,
		alt: `flag of ${country.name}`,
		width: 72,
		height: 48,
	});
	const title = createElement({ tag: 'h2', className: 'country__card--title', textContent: country.name });

	const capital = createParam('Capital', country.capital);
	const region = createParam('Region', country.region);
	const population = createParam('Population', country.population.toLocaleString());
	const languages = createParam('Languages', country.languages.join(', '));

	const content = createElement({
		tag: 'div',
		className: 'country__card--content',
		appendElements: [title, capital, region, population, languages],
	});

	li.append(flag, content);
	return li;
};

export const renderEmptyCard = (query: string) => {
	return createElement({
		tag: 'li',
		className: 'country__card--empty',
		textContent: `No results for «${query}»`,
	});
};

export const createMoreInfo = (country: DataType) => {
	const minInfo = mapCountryResponse(country);
	return countryCard(minInfo);
};
