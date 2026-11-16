export class HttpError extends Error {
	public readonly status: number;
	public readonly response: Response | null;

	constructor(message: string, status: number, response?: Response) {
		super(message);
		this.name = 'HttpError';
		this.status = status;
		this.response = response ?? null;
		Object.setPrototypeOf(this, HttpError.prototype);
	}

	static async fromResponse(res: Response): Promise<HttpError> {
		let message = `${res.status} ${res.statusText}`;
		try {
			const data = await res.clone().json();
			if (data?.message || data?.error) {
				message = data.message || data.error;
			}
		} catch (e) {
			void e;
		}
		return new HttpError(message, res.status, res);
	}
}
