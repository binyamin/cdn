import * as path from 'https://deno.land/std@0.147.0/path/mod.ts';
import type { EdgeFunction } from 'netlify:edge';

interface Module {
	name: string;
	version: string;
	tag?: string;
	path: string;
}

const pattern = new URLPattern({
	pathname: '/pkg/:name([a-zA-Z_\\-0-9]+){@:version([a-zA-Z_\\-0-9\\.]+)}?/:path+',
});

const handler: EdgeFunction = (request, context) => {
	const matches = pattern.exec(request.url);

	if (!matches) return;

	const module: Module = {
		name: matches.pathname.groups.name,
		version: matches.pathname.groups.version || 'latest',
		path: matches.pathname.groups.path,
	}

	if (/^v?\d+\.\d+\.\d+$/.test(module.version) === false) {
		module.tag = module.version;
		module.version = '[replace me]';
	}

	return Response.json(module);
}

export default handler;
