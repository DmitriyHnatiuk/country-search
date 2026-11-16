import { createElement } from '../../helpers/createElement.js';
import { injectStyles } from '../../helpers/injectStyles.js';

export const createModal = () => {
	injectStyles('src/ui/modals/style.css');

	const contentWrap = createElement({
		tag: 'div',
		className: 'modal-content',
	});

	const closeBtn = createElement({
		tag: 'button',
		className: 'modal-close',
		textContent: '✕',
		type: 'button',
	});

	const container = createElement({
		tag: 'div',
		className: 'modal-container',
		role: 'dialog',
		appendElements: [closeBtn, contentWrap],
	});

	const overlay = createElement({
		tag: 'div',
		className: 'modal-overlay',
		appendElements: [container],
	});

	let isOpen = false;
	let lastFocused: HTMLElement | null = null;

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') close();
	};

	const onOverlayClick = (e: MouseEvent) => {
		if (e.target === overlay) close();
	};

	const trapFocus = () => {
		closeBtn.focus();
	};

	const open = () => {
		if (isOpen) return;
		isOpen = true;
		lastFocused = document.activeElement as HTMLElement;

		document.body.append(overlay);
		document.body.style.overflow = 'hidden';
		document.addEventListener('keydown', onKeyDown);
		overlay.addEventListener('click', onOverlayClick);
		closeBtn.onclick = close;

		trapFocus();
	};

	const close = () => {
		if (!isOpen) return;
		isOpen = false;

		overlay.remove();
		document.body.style.overflow = '';
		document.removeEventListener('keydown', onKeyDown);
		overlay.removeEventListener('click', onOverlayClick);

		lastFocused?.focus();
	};

	const setContent = (node: Node) => {
		contentWrap.replaceChildren(node);
	};

	return { open, close, setContent, element: overlay };
};
