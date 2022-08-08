import {
	assert,
	assertEquals,
	assertExists,
	assertFalse,
} from 'https://deno.land/std@0.151.0/testing/asserts.ts';

Deno.test('Fetching Packages', async (t) => {
	const baseUrl = 'http://localhost:8080';

	let etag: string;

	await t.step('Can fetch package', async () => {
		const response = await fetch(
			new URL('/x/tiny-html-events@v0.1.0/index.js', baseUrl),
		);

		assertEquals(response.status, 200);
		assertExists(response.body);
		await response.text(); // Don't leak resources

		assert(response.headers.has('ETag'));
		etag = response.headers.get('ETag')!;

		// Only for JS
		assert(response.headers.has('X-TypeScript-Types'));
	});

	await t.step('Accepts conditional requests', async () => {
		const response = await fetch(
			new URL('/x/tiny-html-events@v0.1.0/index.js', baseUrl),
			{
				headers: {
					'if-none-match': etag,
				},
			},
		);

		assertEquals(response.status, 304);
		assertFalse(response.body);
	});
});
