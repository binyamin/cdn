import { Plugin } from 'lume/core.ts';

const plugin: Plugin = (site) => {
	site.filter('log', console.debug);
	site.filter('trim_lines', function (content: string) {
		const lines = content.replaceAll(' '.repeat(4), '\t').split('\n');

		// Get each line's indentation
		const indentSizes = lines.map((line) => {
			return line.match(/^([\t\n]*)(.+)$/)?.[0].length ?? 0;
		});

		// How many characters should we trim from every line?
		const lowestSize =
			indentSizes.filter((l) => l !== 0).sort((a, b) => a - b)[0];

		if (lowestSize) {
			return lines.map((l) => l.slice(lowestSize)).join('\n').trim();
		}

		return content;
	});
}

export default plugin;
