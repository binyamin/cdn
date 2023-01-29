import lume from 'lume/mod.ts';
import attributes from 'lume/plugins/attributes.ts';
import date from 'lume/plugins/date.ts';
import prism from 'lume/plugins/prism.ts';
import sass from 'lume/plugins/sass.ts';
import source_maps from 'lume/plugins/source_maps.ts';
import lightning_css from 'lume/plugins/lightningcss.ts';

import extras, { getTargets } from './helpers/extras.ts';

const site = lume({
	src: 'src',
	server: {
		page404: '/404/index.html',
	},
}, {
	nunjucks: {
		includes: 'templates',
	},
});

site.copy('static', '.');
site.copy('static/.well-known', '.well-known');

site.use(extras);
site.use(attributes());
site.use(date());
site.use(sass({
	format: 'expanded',
	options: {
		sourceMapIncludeSources: true,
	},
}));
site.use(lightning_css({
	options: {
		targets: getTargets('defaults'),
	}
}));
site.use(source_maps({
	sourceContent: true,
}));
site.use(prism());

export default site;
