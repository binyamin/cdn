import { configSync } from 'https://deno.land/std@0.149.0/dotenv/mod.ts';
export const env = configSync() as {
	GITHUB_TOKEN: string;
	GITLAB_TOKEN: string;
};

import { decode } from 'https://deno.land/std@0.149.0/encoding/base64.ts';
export const base64 = { decode };
