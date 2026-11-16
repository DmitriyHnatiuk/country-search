export const formatError = (code: string): string => {
	switch (code) {
		case 'network':
			return 'Network error or CORS blocked (check API URL)';
		case 'timeout':
			return 'Request timed out. Please try again.';
		case 'abort':
			return 'Request was cancelled.';
		default:
			if (code.startsWith('server:')) {
				const status = code.split(':')[1];
				return `Server error (${status}). Please try again later.`;
			}
			return 'An unknown error occurred.';
	}
};
