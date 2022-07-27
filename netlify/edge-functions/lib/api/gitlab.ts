import { base64, env } from './deps.ts';
import type { File, Module } from '../common.ts';
import { createHttpError } from '../http.ts';

function apiUrl(raw: TemplateStringsArray, ...args: unknown[]) {
	const path = String.raw(raw, ...args);
	return `https://gitlab.com/api/v4${path}`;
}

// deno-lint-ignore no-explicit-any
interface ApiResponse<Data = any> {
	headers: Headers;
	data: Data;
	status: number;
	statusText: string;
}

async function apiRequest<ResponseData>(
	path: string,
): Promise<ApiResponse<ResponseData>> {
	const url = apiUrl`${path}`;

	const response = await fetch(url, {
		headers: new Headers({
			Authorization: `Bearer ${env.GITLAB_TOKEN}`,
		}),
	});

	if (response.ok) {
		const data = await response.json();

		return {
			headers: response.headers,
			data,
			status: response.status,
			statusText: response.statusText,
		};
	}

	throw createHttpError(response.status, response.statusText);
}

export async function getFile(module: Module): Promise<{
	file: File;
	headers: Headers;
}> {
	const id = encodeURIComponent('binyamin/' + module.name);
	const filePath = encodeURIComponent(module.path);

	const response = await apiRequest<{
		file_name: string;
		file_path: string;
		size: number;
		encoding: 'base64';
		content: string;
		content_sha256: string;
		ref: string;
		blob_id: string;
		commit_id: string;
		last_commit_id: string;
		execute_filemode: boolean;
	}>(
		`/projects/${id}/repository/files/${filePath}?ref=${module.ref}`,
	);

	return {
		headers: response.headers,
		file: {
			path: module.path,
			content: base64.decode(response.data.content),
		},
	};
}

// async function getTags(repo: string, owner = 'binyamin') {
// 	const id = encodeURIComponent(owner + '/' + repo);
// 	const response = await apiRequest(`/projects/${id}/repository/tags`);

// 	return response;
// }
