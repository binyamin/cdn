import type { EdgeFunction } from 'netlify:edge';

const handler: EdgeFunction = async (request, context) => {
	return Response.json({
		title: "hello",
	});
}

export default handler;
