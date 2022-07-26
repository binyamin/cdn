export interface Module {
	name: string;
	/** branch, tag, or commit */
	ref: string;
	path: string;
}

export interface File {
	path: string;
	content: Uint8Array | string;
}

interface ApiErrorOptions extends ErrorOptions {
	status?: number;
}

export class ApiError extends Error {
	#status?: number;

	constructor(message?: string, options?: ApiErrorOptions) {
		super(message, options);
		this.name = 'ApiError';
		if (options?.status) this.#status = options.status;
	}

	get status() {
		return this.#status;
	}
}
