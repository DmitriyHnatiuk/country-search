import { createElement } from './createElement.js';

export function injectStyles(href: string): void {
	if (document.querySelector<HTMLLinkElement>(`link[rel="stylesheet"][href="${href}"]`)) {
		return;
	}

	const link = createElement({ tag: 'link', rel: 'stylesheet', href });
	link.dataset.loaderStyles = 'true';
	document.head.appendChild(link);
}
