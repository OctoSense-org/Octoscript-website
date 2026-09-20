import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import docLinks from './scripts/doc-links.mjs';

export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4325',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  markdown: {
    processor: unified({
      remarkPlugins: [docLinks],
    }),
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
