import { decode } from 'https://deno.land/std@0.158.0/encoding/base64.ts';
export const base64 = { decode };

import { configSync } from 'https://deno.land/std@0.158.0/dotenv/mod.ts';

let env: {
	GITHUB_TOKEN: string;
	GITLAB_TOKEN: string;
};

try {
	env = configSync() as {
		GITHUB_TOKEN: string;
		GITLAB_TOKEN: string;
	};
} catch {
	// There's no file, or we can't access it
	env = {
		GITHUB_TOKEN: Deno.env.get('GITHUB_TOKEN')!,
		GITLAB_TOKEN: Deno.env.get('GITLAB_TOKEN')!,
	};
}

export { env };
