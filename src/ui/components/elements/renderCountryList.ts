import type { CountryCardType } from '../../../type/type.js';
import { renderEmptyCard } from './card.js';

export const renderCountryList = (
	container: HTMLElement,
	countries: readonly CountryCardType[],
	createCard: (c: CountryCardType) => HTMLElement,
	query: string
): void => {
	const existing = Array.from(container.children).reduce((map, el) => {
		const name = (el as HTMLElement).dataset.countryName;
		return name ? map.set(name, el as HTMLElement) : map;
	}, new Map<string, HTMLElement>());

	const newNodes = countries.map((country) => {
		const cached = existing.get(country.name);
		return cached ?? createCard(country);
	});

	const newKeys = new Set(countries.map((c) => c.name));

	Array.from(existing.entries())
		.filter(([key]) => !newKeys.has(key))
		.forEach(([, node]) => node.remove());

	container.replaceChildren(...newNodes);

	const emptyCard = container.querySelector('.country__card--empty');
	if (emptyCard) emptyCard.remove();

	if (countries.length === 0 && query) {
		container.appendChild(renderEmptyCard(query));
	}
};
