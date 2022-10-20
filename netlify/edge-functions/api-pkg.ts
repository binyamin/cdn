import type { EdgeFunction } from 'netlify:edge';
import type { CompletionList } from './lib/deno-types.ts';
import { etag } from './lib/http.ts';

const pattern = new URLPattern({
	pathname: '/api/x/:package([a-zA-Z0-9_-]*)',
});

const handler: EdgeFunction = async (request, context) => {
	const matches = pattern.exec(request.url);

	if (!matches) return context.next();

	const list: CompletionList = {
		isIncomplete: true,
		items: [
			// GitLab
			'deno-sass',
			'deno-logger',
			'deno-watcher',
			'lume-parcel-css',
			'lume-sass',
			'oak-nano-views',
			'tiny-html-events',
		],
	};

	const { package: pkgName } = matches.pathname.groups;

	if (pkgName) {
		list.items = list.items.filter((value) => value.startsWith(pkgName));
		list.preselect = list.items[0];
	}

	list.items = list.items.sort();

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
};

export default handler;
