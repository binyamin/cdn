import { compareEtag } from 'https://deno.land/std@0.151.0/http/util.ts';
import { calculate as getETag } from 'https://deno.land/x/oak@v10.6.0/etag.ts';

import type { EdgeFunction } from 'netlify:edge';
import type { CompletionList } from './api/types.ts';

const pattern = new URLPattern({
	pathname: '/api/x/:package([a-zA-Z_\\-0-9]*)',
});

const handler: EdgeFunction = async (request, context) => {
	const matches = pattern.exec(request.url);

	if (!matches) return context.next();

	const list: CompletionList = {
		isIncomplete: true,
		items: [
			// GitLab
			'deno-sass',
			'lume-parcel-css',
			'lume-sass',
			'tiny-html-events',
		]
	}

	const { package: pkgName } = matches.pathname.groups;

	if (pkgName) {
		list.items = list.items.filter(value => value.startsWith(pkgName));
		list.preselect = list.items[0];
	}

	list.items = list.items.sort();

	const etag = await getETag(JSON.stringify(list));

	if (request.headers.has('if-none-match')) {
		const prevEtag = request.headers.get('if-none-match')!;

		if (compareEtag(etag, prevEtag)) {
			return new Response(null, {
				status: 304,
			})
		}
	}

	return context.json(list, {
		status: 200,
		headers: {
			'ETag': etag,
		}
	})
}

export default handler;
