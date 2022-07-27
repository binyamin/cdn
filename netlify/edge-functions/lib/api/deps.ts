import { config } from 'https://deno.land/std@0.149.0/dotenv/mod.ts';

const env = await config() as {
	GITHUB_TOKEN: string;
	GITLAB_TOKEN: string;
};

env.GITHUB_TOKEN ??= Deno.env.get('GITHUB_TOKEN')!;
env.GITLAB_TOKEN ??= Deno.env.get('GITLAB_TOKEN')!;

export { env };

import { decode } from 'https://deno.land/std@0.149.0/encoding/base64.ts';
export const base64 = { decode };
