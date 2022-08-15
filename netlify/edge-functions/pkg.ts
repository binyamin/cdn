import * as path from 'https://deno.land/std@0.152.0/path/mod.ts';
import { compareEtag } from 'https://deno.land/std@0.152.0/http/util.ts';

import type { EdgeFunction } from 'netlify:edge';

import { type Module } from './lib/common.ts';
import * as http from './lib/http.ts';
import { getFile } from './lib/api/gitlab.ts';

const pattern = new URLPattern({
	pathname: '/x/:name([a-zA-Z0-9_-]+){@:version([a-zA-Z0-9\\.+-]+)}?/:path+',
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

	function logRequest(status: number) {
		context.log(`${status} - ${module.name}@${module.ref}/${module.path}`);
	}

	try {
		const file = await getFile(module);
		const headers = new Headers();

		const cType = http.contentType(path.basename(file.file.path));

		if (cType) {
			headers.set('content-type', cType);
			headers.set('Cache-control', 'public, max-age=31536000, immutable');
		}

		if (file.headers.has('etag')) {
			headers.set('ETag', file.headers.get('etag')!);
		}

		// If possible, supply `X-TypeScript-Types` HTTP header
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
				if (http.isHttpError(error)) {
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
				logRequest(304);
				return new Response(null, {
					status: 304,
					headers,
				});
			}
		}

		logRequest(200);
		return new Response(file.file.content, {
			headers: headers,
			status: 200,
		});
	} catch (error) {
		if (http.isHttpError(error)) {
			const { pathname } = new URL(request.url);

			if (error.status === 404) {
				return context.next();
			}

			context.log(`Received bad HTTP Status while fetching file`, {
				message: error.message,
				status: error.status,
				path: pathname,
			});

			return new Response(undefined, {
				status: error.status,
				statusText: error.message,
			});
		}

		throw error;
	}
};

export default handler;
