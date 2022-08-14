import { compareEtag } from 'https://deno.land/std@0.151.0/http/util.ts';
import { calculate as getETag } from 'https://deno.land/x/oak@v10.6.0/etag.ts';
import * as semver from 'https://deno.land/std@0.151.0/semver/mod.ts';

import type { EdgeFunction } from 'netlify:edge';
import type { CompletionList } from './api/types.ts';
import { listTags } from './lib/api/gitlab.ts';

const pattern = new URLPattern({
	pathname: '/api/x/:package([a-zA-Z0-9_-]+)/versions/:version([a-zA-Z0-9\\.+-]*)',
});

const handler: EdgeFunction = async (request, context) => {
	const matches = pattern.exec(request.url);

	if (!matches) return context.next();

	const groups = matches.pathname.groups;

	const response = await listTags(
		groups.package,
		typeof groups.version !== 'undefined' ? '^' + groups.version : undefined
	);

	const tags = response.tags.filter(v => {
		return semver.valid(v.name);
	}).sort((a, b) => {
		// The `semver.compareBuild` function sorts in
		// ascending order (lowest to highest). We want
		// descending order, so we swap `a` and `b`.
		return semver.compareBuild(b.name, a.name);
	});

	const list: CompletionList = {
		items: tags.map(v => v.name),
		isIncomplete: true,
	};

	if (tags.length > 0) {
		// Only preselect an item when possible
		list.preselect = tags[0].name;
	}

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
