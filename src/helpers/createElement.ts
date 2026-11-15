type DOMEventHandlers = {
	[K in keyof GlobalEventHandlersEventMap as `on${Capitalize<K>}`]?: (ev: GlobalEventHandlersEventMap[K]) => void;
};

type ElementProps<T extends keyof HTMLElementTagNameMap> = Partial<HTMLElementTagNameMap[T]> &
	DOMEventHandlers & { style?: Partial<CSSStyleDeclaration> } & { [key: `data-${string}`]: string } & {
		[key: `aria-${string}`]: string;
	};

type CreateElementType<T extends keyof HTMLElementTagNameMap = 'div'> = {
	tag: T;
	className?: string | string[];
	textContent?: string;
	appendElements?: Array<Node | string>;
} & ElementProps<T>;

export const createElement = <T extends keyof HTMLElementTagNameMap>({
	tag,
	className,
	textContent,
	appendElements,
	...rest
}: CreateElementType<T>): HTMLElementTagNameMap[T] => {
	const element = document.createElement(tag);

	if (className) {
		const classes = Array.isArray(className) ? className : className.split(' ');
		element.classList.add(...classes.filter(Boolean));
	}

	if (textContent !== undefined) {
		element.textContent = textContent;
	}
	if (appendElements) {
		element.append(...appendElements);
	}

	return Object.assign(element, rest);
};
