import lume from 'lume/mod.ts';
import attributes from 'lume/plugins/attributes.ts';
import date from 'lume/plugins/date.ts';
import prism from 'lume/plugins/prism.ts';
import sass from 'lume/plugins/sass.ts';
import parcel_css from 'https://denopkg.dev/gl/binyamin/lume-parcel-css@v0.1.2/mod.ts';

import extras from './helpers/extras.ts';

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
	sourceMap: true,
	sourceMapIncludeSources: true,
}));
site.use(parcel_css({
	sourceMap: true,
}));
site.use(prism());

export default site;
