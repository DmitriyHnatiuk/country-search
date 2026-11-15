import { createElement } from '../../helpers/createElement.js';
import { injectStyles } from '../../helpers/injectStyles.js';

export const createLoader = () => {
	injectStyles('src/ui/loader/style.css');

	const loader = createElement({ tag: 'span', className: 'loader' });
	loader.setAttribute('role', 'status');
	loader.setAttribute('aria-label', 'Loading countries…');
	const container = createElement({ tag: 'div', className: 'loader-overlay is-hidden', appendElements: [loader] });
	document.body.appendChild(container);
	return container;
};
