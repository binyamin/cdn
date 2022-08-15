import type { EdgeFunction } from 'netlify:edge';
import { semver } from './lib/deps.ts';
import type { CompletionList } from './lib/deno-types.ts';
import { listTags } from './lib/api/gitlab.ts';
import { etag } from './lib/http.ts';

const pattern = new URLPattern({
	pathname:
		'/api/x/:package([a-zA-Z0-9_-]+)/versions/:version([a-zA-Z0-9\\.+-]*)',
});

const handler: EdgeFunction = async (request, context) => {
	const matches = pattern.exec(request.url);

	if (!matches) return context.next();

	const groups = matches.pathname.groups;

	const response = await listTags(
		groups.package,
		typeof groups.version !== 'undefined' ? '^' + groups.version : undefined,
	);

	const tags = response.tags.filter((v) => {
		return semver.valid(v.name);
	}).sort((a, b) => {
		// The `semver.compareBuild` function sorts in
		// ascending order (lowest to highest). We want
		// descending order, so we swap `a` and `b`.
		return semver.compareBuild(b.name, a.name);
	});

	const list: CompletionList = {
		items: tags.map((v) => v.name),
		isIncomplete: true,
	};

	if (tags.length > 0) {
		// Only preselect an item when possible
		list.preselect = tags[0].name;
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
};

export default handler;
