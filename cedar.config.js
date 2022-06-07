import path from 'node:path';

import preset from '@binyamin/cedar-preset';

export default preset({
	src: 'src',
	dest: 'out',
	nunjucks: {
		data: 'src/data',
		templates: "templates",
		filters: {
			/**
			 * @param {string} content
			 */
			trim_lines(content) {
				const lines = content.split('\n');

				// Get each line's indentation
				const indentSizes = lines.map(line => {
					return line.match(/^([\s\n]*)(.+)$/)?.[1].length ?? 0;
				});

				// How many characters should we trim from every line?
				const lowestSize = indentSizes.filter(l => l !== 0).sort((a, b) => b > a)[0];

				if (lowestSize) {
					return lines.map(l => l.slice(lowestSize)).join('\n').trim();
				} else {
					return content;
				}
			}
		}
	},
	esbuild: {
		minify: true,
	},
	plugins: [
		{
			name: 'ignore',
			extensions: ['.json','.yaml','.yml','.js','.mjs','.cjs'],
			init() {},
			onFile({ file, global }) {
				const dataDir = path.join(global.src, 'data');
				const isDataFile = file.history[0].startsWith(dataDir);

				if (isDataFile) {
					file.data.write = false;
				}
			}
		}
	]
});
