import { createElement } from '../../helpers/createElement.js';
import { injectStyles } from '../../helpers/injectStyles.js';

export type ToastOptionsType = {
	message: string;
	actionLabel?: string;
	onAction?: () => void;
	duration?: number;
};

type QueuedToastType = ToastOptionsType & {
	resolve: () => void;
};

export function createToast() {
	injectStyles('src/ui/modals/style.css');

	const container = createElement({
		tag: 'div',
		className: 'toast-container',
	});
	document.body.appendChild(container);

	let queue: QueuedToastType[] = [];

	function showSingle(item: QueuedToastType): Promise<void> {
		return new Promise((resolve) => {
			const messageElement = createElement({
				tag: 'p',
				className: 'toast__message',
				textContent: item.message,
			});

			const actionButton = createElement({
				tag: 'button',
				type: 'button',
				className: 'toast__action',
				hidden: !item.actionLabel,
				textContent: item.actionLabel || '',
			});

			const toastEl = createElement({
				tag: 'div',
				className: 'toast',
				appendElements: [messageElement, actionButton],
			});
			toastEl.setAttribute('role', 'alert');
			toastEl.setAttribute('aria-live', 'assertive');

			let timer: ReturnType<typeof setTimeout> | null = null;

			const remove = () => {
				if (timer) {
					clearTimeout(timer);
					timer = null;
				}

				toastEl.remove();
				resolve();
			};

			if (actionButton && item.onAction) {
				actionButton.onclick = () => {
					item.onAction!();
					remove();
				};
			}

			const duration = item.duration ?? 5000;
			if (duration > 0) {
				timer = setTimeout(remove, duration);
			}

			container.hidden = false;
			container.appendChild(toastEl);
		});
	}
	function processQueue() {
		if (queue.length === 0) return;

		const [item, ...rest] = queue as [QueuedToastType, ...QueuedToastType[]];
		queue = rest;

		showSingle(item).then(() => {
			item.resolve();
			processQueue();
		});
	}

	function show(options: ToastOptionsType): Promise<void> {
		return new Promise((resolve) => {
			queue.push({ ...options, resolve });
			processQueue();
		});
	}

	function hide() {
		queue.length = 0;
		container.replaceChildren();
		container.hidden = true;
	}

	return { show, hide };
}
