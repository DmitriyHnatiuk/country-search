import { createElement } from '../../../helpers/createElement.js';

export const header = () => {
	const container = createElement({ tag: 'header' });
	const title = createElement({ tag: 'h1', className: 'title', textContent: 'Country Search' });
	container.appendChild(title);
	return container;
};
