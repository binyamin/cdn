import type { EdgeFunction } from 'netlify:edge';
import type { CompletionList } from './lib/deno-types.ts';
import { listPaths } from './lib/api/gitlab.ts';
import {
	etag,
	isHttpError,
	isServerErrorStatus,
	Status,
	STATUS_TEXT,
} from './lib/http.ts';

const pattern = new URLPattern({
	pathname:
		'/api/x/:package([a-zA-Z0-9_-]+)/:version([a-zA-Z0-9\\.+-]+)/paths/:path*{/}?',
});

const handler: EdgeFunction = async (request, context) => {
	const matches = pattern.exec(request.url);

	if (!matches) return context.next();

	const groups = matches.pathname.groups;

	try {
		const result = await listPaths(
			groups.package,
			groups.version,
		);

		const list: CompletionList = {
			items: result.paths.sort(),
			isIncomplete: true,
		};

		// If search-term is provided, fill the `preselect` field
		if (groups.path) {
			list.items = list.items.filter((p) => p.startsWith(groups.path)).sort();
			list.preselect = list.items[0];
		}

		const nextETag = await etag.calculate(JSON.stringify(list));

		if (request.headers.has('if-none-match')) {
			const prevEtag = request.headers.get('if-none-match')!;

			if (etag.compare(nextETag, prevEtag)) {
				return new Response(null, {
					status: 304,
				});
			}
		}

		return context.json(list, {
			status: 200,
			headers: {
				'ETag': nextETag,
			},
		});
	} catch (error) {
		if (isHttpError(error)) {
			const url = (new URL(request.url)).pathname;

			if (isServerErrorStatus(error.status)) {
				context.log(url);
				context.log(error);
			} else {
				context.log(`${error.message} (${error.status}) - ${url}`);
			}

			if (error.expose) {
				return context.json({
					message: error.message,
					code: error.status,
				});
			} else {
				return context.json({
					message: STATUS_TEXT[Status.InternalServerError],
					code: Status.InternalServerError,
				});
			}
		}

		throw error;
	}
};

export default handler;
