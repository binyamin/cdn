import * as media from 'https://deno.land/std@0.149.0/media_types/mod.ts';

export function contentType(fileName: string) {
	if (/\.[mc]?js$/i.test(fileName)) {
		return 'application/javascript; charset=utf-8';
	} else if (/\.[mc]?ts$/.test(fileName)) {
		return 'application/typescript; charset=utf-8';
	} else if (/\.css$/.test(fileName)) {
		return 'text/css; charset=utf-8';
	} else if (/\.(map|json)$/.test(fileName)) {
		return 'application/json; charset=utf-8';
	} else {
		const type = media.contentType(fileName);
		if (type) return type;
	}
}