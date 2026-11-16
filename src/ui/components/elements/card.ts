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
const createContent = (country: CountryCardType) => {
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
	return content;
};
const createFlag = (flagUrl: string, name: string) => {
	return createElement({
		tag: 'img',
		className: 'country__card--flag',
		src: flagUrl,
		alt: `flag of ${name}`,
		width: 72,
		height: 48,
	});
};
export const countryCard = (country: CountryCardType) => {
	const li = createElement({ tag: 'li', className: 'country__card' });
	li.dataset.countryName = country.name;

	const flag = createFlag(country.flagUrl, country.name);
	const content = createContent(country);

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

export const createMoreInfo = (minInfo: CountryCardType | null, country: DataType) => {
	const flag = createFlag(country.flags?.svg || country.flags?.png || '', country.name!);
	const content = minInfo ? createContent(minInfo) : createElement({ tag: 'div' });
	content.append(
		createParam('Area', country.area.toLocaleString()),
		createParam('Subregion', country.subregion),
		country.timezones[0] ? createParam('Timezones', country.timezones[0]) : '',
		createParam('Code', country.numericCode.toLocaleString())
	);
	content.prepend(flag);

	return content;
};
