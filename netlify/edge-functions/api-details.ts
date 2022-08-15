import type { EdgeFunction } from 'netlify:edge';
import type { Documentation } from './lib/deno-types.ts';
import { getDetails } from './lib/api/gitlab.ts';
import { etag } from './lib/http.ts';

const pattern = new URLPattern({
	pathname: '/api/x/details/:package([a-zA-Z0-9_-]+){/:version}?',
});

const handler: EdgeFunction = async (request, context) => {
	const matches = pattern.exec(request.url);

	if (!matches) return context.next();

	const groups = matches.pathname.groups;

	const details = await getDetails(groups.package);

	const result: Documentation = {
		kind: 'markdown',
		value: `**${details.name}**${
			groups.version ? groups.version.replace(/^v?(.+)/, ' (v$1)') : ''
		}\n\n${
			details.description ? details.description + '\n\n' : ''
		}[code](${details.url})`,
	};

	const nextETag = await etag.calculate(JSON.stringify(result));

	if (request.headers.has('if-none-match')) {
		const prevEtag = request.headers.get('if-none-match')!;

		if (etag.compare(nextETag, prevEtag)) {
			return new Response(null, {
				status: 304,
			});
		}
	}

	return context.json(result, {
		status: 200,
		headers: {
			'ETag': nextETag,
		},
	});
};

export default handler;
