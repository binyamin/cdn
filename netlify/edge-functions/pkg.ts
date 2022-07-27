import * as path from 'https://deno.land/std@0.149.0/path/mod.ts';
import { compareEtag } from 'https://deno.land/std@0.149.0/http/util.ts';

import type { EdgeFunction } from 'netlify:edge';

import { ApiError, type Module } from './lib/common.ts';
import { contentType } from './lib/http.ts';
import { getFile } from './lib/api/gitlab.ts';

const pattern = new URLPattern({
	pathname:
		'/x/:name([a-zA-Z_\\-0-9]+){@:version([a-zA-Z_\\-0-9\\.]+)}?/:path+',
});

const handler: EdgeFunction = async (request, context) => {
	const matches = pattern.exec(request.url);

	if (!matches) return context.next();

	const module: Module = {
		name: matches.pathname.groups.name,
		ref: matches.pathname.groups.version,
		path: matches.pathname.groups.path,
	};

	if (!module.ref) {
		// TODO replace with latest tag or default branch
		// TODO Redirect to correct URL
		module.ref = 'latest';
	}

	try {
		const file = await getFile(module);
		const headers = new Headers();

		const cType = contentType(path.basename(file.file.path));

		if (cType) {
			headers.set('content-type', cType);
			headers.set('Cache-control', 'public, max-age=31536000, immutable');
		}

		if (file.headers.has('etag')) {
			headers.set('ETag', file.headers.get('etag')!);
		}


		if (module.path.endsWith('.js')) {
			try {
				await getFile({
					name: module.name,
					ref: module.ref,
					path: module.path.replace(/\.js$/, '.d.ts'),
				});

				headers.set(
					'X-TypeScript-Types',
					'./' + path.basename(module.path, '.js') + '.d.ts',
				);
			} catch (error) {
				// Don't throw on 404 - That just means there's no type-definition file
				if (error instanceof ApiError) {
					if (error.status !== 404) {
						throw error;
					}
				}

				throw error;
			}
		}

		// Caching
		if (request.headers.has('if-none-match') && headers.has('etag')) {
			const etag = headers.get('etag')!;
			const prevETag = request.headers.get('if-none-match')!;

			if (compareEtag(etag, prevETag)) {
				return new Response(null, {
					status: 304,
					statusText: 'Not Modified',
					headers,
				});
			}
		}

		return new Response(file.file.content, {
			headers: headers,
			status: 200,
		});
	} catch (error) {
		if (error instanceof ApiError) {
			const { pathname } = new URL(request.url);

			if (error.status === 404) {
				return context.next();
			}

			context.log(`Received bad HTTP status-code while fetching ${pathname}.`, {
				message: error.message,
				status: error.status,
			});

			return new Response(undefined, {
				status: 500,
				statusText: 'Internal Server Error',
			});
		}

		throw error;
	}
};

export default handler;
