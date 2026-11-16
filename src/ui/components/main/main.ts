import { createElement } from '../../../helpers/createElement.js';

export const renderMain = () => {
	const main = createElement({ tag: 'main' });

	const input = createElement({ tag: 'input', type: 'text', className: 'search', name: 'search', id: 'search' });

	const clearButton = createElement({
		tag: 'button',
		className: 'clear-cache-btn',
		id: 'clear-cache-btn',
		type: 'button',
		title: 'Clear cache',
		ariaLabel: 'Clear cache',
		textContent: ' Clear cache 🗑️',
	});
	const list = createElement({ tag: 'ul', className: 'cards__list', id: 'country-list' });

	main.append(clearButton, input, list);
	return main;
};
