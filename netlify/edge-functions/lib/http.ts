export {
	createHttpError,
	isHttpError,
} from 'https://deno.land/std@0.175.0/http/http_errors.ts';

export {
	isServerErrorStatus,
	Status,
	STATUS_TEXT,
} from 'https://deno.land/std@0.175.0/http/http_status.ts';

import { compareEtag } from 'https://deno.land/std@0.175.0/http/util.ts';
import { calculate as getETag } from 'https://deno.land/x/oak@v11.1.0/etag.ts';

export const etag = {
	compare: compareEtag,
	calculate: getETag,
};

import * as media from 'https://deno.land/std@0.175.0/media_types/mod.ts';

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
