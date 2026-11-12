export class HttpError extends Error {
	public readonly status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = 'HttpError';
		this.status = status;
		Object.setPrototypeOf(this, HttpError.prototype);
	}

	static fromResponse(res: Response): HttpError {
		return new HttpError(`${res.status} ${res.statusText}`, res.status);
	}
}
