import {
	assert,
	assertEquals,
	assertExists,
	assertFalse,
	assertMatch,
} from 'https://deno.land/std@0.151.0/testing/asserts.ts';
import type { CompletionList } from '../../netlify/edge-functions/api/types.ts';

Deno.test('Listing packages', async (t) => {
	const baseUrl = 'http://localhost:8080';

	let etag: string;
	let list: CompletionList;

	await t.step('Can list packages', async () => {
		const response = await fetch(
			new URL('/api/x/', baseUrl),
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
			new URL('/api/x/', baseUrl),
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
			new URL('/api/x/lume-', baseUrl),
		);

		assertEquals(response.status, 200);
		assert(response.body);
		const body: CompletionList = await response.json();

		for (const str of body.items) {
			assertMatch(str, /^lume-/i);
		}
	});
});
