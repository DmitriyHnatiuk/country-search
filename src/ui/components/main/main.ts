import { createElement } from '../../../helpers/createElement.js';

export const renderMain = () => {
	const main = createElement({ tag: 'main' });

	const input = createElement({ tag: 'input', type: 'text', className: 'search', name: 'search', id: 'search' });

	const list = createElement({ tag: 'ul', className: 'cards__list', id: 'country-list' });

	main.append(input, list);
	return main;
};
