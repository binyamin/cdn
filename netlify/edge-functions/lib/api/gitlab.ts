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

/**
 *
 * @param search You can use `^term` and `term$` to find
 * tags that begin and end with `term` respectively.
 */
export async function listTags(repository: string, search?: string): Promise<{
	tags: {
		name: string,
		date: Date,
		url: string
	}[],
	headers: Headers,
}> {
	const id = encodeURIComponent('binyamin/' + repository);

	const response = await apiRequest<{
		commit: {
			id: string,
			short_id: string,
			title: string,
			created_at: string,
			parent_ids: string[],
			message: string,
			author_name: string,
			author_email: string,
			authored_date: string,
			committer_name: string,
			committer_email: string,
			committed_date: string,
			trailers: unknown,
			web_url: string
		},
		release?: {
			tag_name: string,
			description: string
		},
		name: string,
		target: string,
		message?: string,
		protected: boolean
	}[]>(
		`/projects/${id}/repository/tags${
			search ? '?search=' + encodeURIComponent(search) : ""
		}`
	);

	return {
		headers: response.headers,
		tags: response.data.map(tag => ({
			name: tag.name,
			date: new Date(tag.commit.authored_date),
			url: tag.commit.web_url
		}))
	}
}

/**
 *
 * @see {@link https://docs.gitlab.com/ee/api/repositories.html#list-repository-tree GitLab API Docs}
 */
export async function listPaths(repository: string, tag: string): Promise<{
	paths: string[],
	headers: Headers
}> {
	const id = encodeURIComponent('binyamin/' + repository);

	const response = await apiRequest<{
		id: string,
		name: string,
		type: 'tree' | 'blob',
		path: string,
		mode: string,
	}[]>(
		`/projects/${id}/repository/tree?recursive=true&ref=${tag}`
	);

	return {
		headers: response.headers,
		paths: response.data.filter(item => item.type === 'blob').map(item => item.path),
	}
}

/**
 *
 * @see {@link https://docs.gitlab.com/ee/api/projects.html#get-single-project GitLab API Docs}
 */
 export async function getDetails(repository: string): Promise<{
	name: string,
	url: string,
	description?: string,
	headers: Headers
}> {
	const id = encodeURIComponent('binyamin/' + repository);

	const response = await apiRequest<{
		name: string,
		web_url: string,
		description?: string,
		topics: string[],
		// There's more data in the response
		[x: string]: unknown,
	}>(`/projects/${id}`);

	return {
		headers: response.headers,
		name: response.data.name,
		url: response.data.web_url,
		description: response.data.description,
	}
}
