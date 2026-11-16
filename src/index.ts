import { createSearchController } from './api/searchController.js';
import { debounce } from './core/debounce.js';
import { formatError } from './helpers/formatError.js';
import { CACHE_KEY, DEBOUNCE_MS } from './helpers/variables.js';
import { countryCard } from './ui/components/elements/card.js';
import { header } from './ui/components/header/header.js';
import { renderMain } from './ui/components/main/main.js';
import { createLoader } from './ui/loader/loader.js';
import { createToast } from './ui/modals/toast.js';

document.body.append(header(), renderMain());

const loader = createLoader();
const toast = createToast();

const initialJson = localStorage.getItem(CACHE_KEY) ?? '[]';
const controller = createSearchController(initialJson);

const search = document.getElementById('search') as HTMLInputElement;
const countryList = document.getElementById('country-list');

const debouncedSetQuery = debounce((query: string) => {
	controller.setQuery(query);
}, DEBOUNCE_MS);
search?.addEventListener('input', (e) => {
	const query = (e.target as HTMLInputElement).value;
	debouncedSetQuery.cancel();
	debouncedSetQuery(query);
});

let saveTimer: ReturnType<typeof setTimeout>;
controller.subscribe((state) => {
	const isLoading = state.isLoading;
	loader.classList.toggle('is-hidden', !isLoading);
	loader.setAttribute('aria-hidden', String(!isLoading));

	if (countryList) {
		countryList.replaceChildren();

		if (state.results.length > 0) {
			const cards = state.results.map((country) => countryCard(country));
			countryList.append(...cards);
		}
	}

	if (state.error) {
		const isRetryable = state.error === 'network' || state.error.startsWith('server:');
		toast.show({
			message: formatError(state.error),
			actionLabel: isRetryable ? 'Retry' : 'X',
			onAction: () => (isRetryable ? controller.retry() : null),
			duration: isRetryable ? 0 : 5000,
		});
	} else {
		toast.hide();
	}

	clearTimeout(saveTimer);
	saveTimer = setTimeout(() => {
		try {
			const snapshot = controller.getCacheSnapshot();
			localStorage.setItem(CACHE_KEY, snapshot);
		} catch {
			toast.show({
				message: 'Failed to save search cache',
				actionLabel: 'OK',
				duration: 3000,
			});
		}
	}, DEBOUNCE_MS);
});
