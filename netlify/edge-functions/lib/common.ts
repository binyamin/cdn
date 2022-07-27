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
