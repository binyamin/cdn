import {
	assert,
	assertEquals,
	assertExists,
	assertFalse,
	assertMatch,
	type CompletionList,
} from '../deps.ts';

Deno.test('Listing versions', async (t) => {
	const baseUrl = 'http://localhost:8080';

	let etag: string;
	let list: CompletionList;

	await t.step('Can list versions', async () => {
		const response = await fetch(
			new URL('/api/x/lume-sass/versions/', baseUrl),
		);

		assertEquals(response.status, 200);
		assertExists(response.body);

		assert(response.headers.has('ETag'));
		etag = response.headers.get('ETag')!;

		list = await response.json();
	});

	await t.step('List matches the spec', () => {
		assertExists<CompletionList>(list);
		assertExists(list.items);
		assert(Array.isArray(list.items), 'Expected "list.items" to be Array');
	});

	await t.step('Accepts conditional requests', async () => {
		const response = await fetch(
			new URL('/api/x/lume-sass/versions/', baseUrl),
			{
				headers: {
					'if-none-match': etag,
				},
			},
		);

		assertEquals(response.status, 304);
		assertFalse(response.body);
	});

	await t.step('Accepts a search term', async () => {
		const response = await fetch(
			new URL('/api/x/lume-sass/versions/v0', baseUrl),
		);

		assertEquals(response.status, 200);
		assert(response.body);
		const body: CompletionList = await response.json();

		for (const str of body.items) {
			assertMatch(str, /^v?0/);
		}
	});
});
