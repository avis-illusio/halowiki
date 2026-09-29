import wiki from './wiki.config.json';
import { defineWikiConfig } from '@supersuit/docusaurus-preset-wiki';

export default defineWikiConfig(wiki, {
    baseUrl: '/halowiki/',
    themeConfig: {
        navbar: {
            title: 'HaloWiki',
            logo: {
                alt: 'HaloWiki',
                src: 'img/logo.svg',
                href: '/halowiki/intro/',
            },
        },
    },
});
