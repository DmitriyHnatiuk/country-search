import { createSearchController } from './api/searchController.js';
import { formatError } from './helpers/formatError.js';
import { CACHE_KEY, DEBOUNCE_MS } from './helpers/variables.js';
import { countryCard, createMoreInfo } from './ui/components/elements/card.js';
import { renderCountryList } from './ui/components/elements/renderCountryList.js';
import { header } from './ui/components/header/header.js';
import { renderMain } from './ui/components/main/main.js';
import { createLoader } from './ui/loader/loader.js';
import { createModal } from './ui/modals/createModal.js';
import { createToast } from './ui/modals/toast.js';

document.body.append(header(), renderMain());

const loader = createLoader();
const toast = createToast();
const modal = createModal();

const initialJson = localStorage.getItem(CACHE_KEY) ?? '[]';
const controller = createSearchController(initialJson);

const clearCacheBtn = document.getElementById('clear-cache-btn');
const search = document.getElementById('search') as HTMLInputElement;
const countryList = document.getElementById('country-list');

search?.addEventListener('input', (e) => {
	const query = (e.target as HTMLInputElement).value;
	controller.setQuery(query);
});

countryList?.addEventListener('click', (e) => {
	const target = e?.target as HTMLElement;
	const card = target.closest('[data-country-name]') as HTMLLIElement;

	if (!card) return;

	const country = controller.getCountry(card.dataset.countryName!);
	if (country) {
		const [minInfo] = controller.getState().results.filter((e) => e.name === card.dataset.countryName);
		modal.setContent(createMoreInfo(minInfo || null, country));
		modal.open();
	}
});

search?.addEventListener('keydown', (e) => {
	if (e.key === 'Enter') {
		controller.setQuery(search.value);
	}
});

clearCacheBtn?.addEventListener('click', () => {
	localStorage.removeItem(CACHE_KEY);
	controller.clearCache();
	controller.setQuery('');
	search.value = '';
});

let saveTimer: ReturnType<typeof setTimeout>;
controller.subscribe((state) => {
	const isLoading = state.isLoading;
	loader.classList.toggle('is-hidden', !isLoading);
	loader.setAttribute('aria-hidden', String(!isLoading));

	if (countryList) {
		if (isLoading) {
			countryList.replaceChildren();
		} else if (state.query) {
			renderCountryList(countryList, state.results, countryCard, state.query);
		} else {
			countryList.replaceChildren();
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
