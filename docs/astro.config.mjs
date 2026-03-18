import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { vuepressPreprocessor } from './src/plugins/vuepress-preprocessor.mjs';
import { rehypeTableWrapper } from './src/plugins/rehype-table-wrapper.mjs';
import { buildSidebar } from './src/sidebar.mjs';

import 'dotenv/config';

/**
 * Which framework variant to build.
 * Set DOCS_FRAMEWORK=react|angular|vue3 in .env or environment to build that
 * variant. Defaults to 'javascript'.
 *
 * Phase 3 will replace this with dynamic [framework] route segments so all
 * variants are served from a single build.
 */
const framework = process.env.DOCS_FRAMEWORK ?? 'javascript';

export default defineConfig({
  site: 'https://handsontable.com',
  base: '/docs',

  integrations: [
    starlight({
      title: 'Handsontable',
      description:
        'Handsontable is a JavaScript/TypeScript data grid component for React, Angular, and Vue 3.',

      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: false,
      },

      favicon: '/img/favicon.png',

      social: {
        github: 'https://github.com/handsontable/handsontable',
      },

      editLink: {
        baseUrl:
          'https://github.com/handsontable/handsontable/edit/develop/docs/content/',
      },

      customCss: ['./src/styles/custom.css'],

      sidebar: buildSidebar(framework),

      // Algolia DocSearch — install @astrojs/starlight-docsearch and add the
      // ALGOLIA_APP_ID / ALGOLIA_API_KEY / ALGOLIA_INDEX_NAME env vars.
      // https://starlight.astro.build/guides/site-search/#algolia-docsearch
      // plugins: [starlightDocSearch({ appId: '...', apiKey: '...', indexName: '...' })],

      // Pagefind is used as default local search until Algolia is wired up.
    }),
  ],

  markdown: {
    remarkPlugins: [
      // No extra remark plugins needed — preprocessing is handled by the Vite
      // plugin above which runs on the raw source before remark-parse.
    ],
    rehypePlugins: [
      // Wraps <table> in a scrollable div (mirrors markdown-it-table-wrapper).
      rehypeTableWrapper,
    ],
    shikiConfig: {
      // Mirrors the VuePress highlight.js colour scheme.
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: false,
    },
  },

  vite: {
    plugins: [
      // Runs BEFORE Astro's markdown processor.
      // Converts VuePress-specific syntax to Astro/CommonMark-compatible syntax.
      vuepressPreprocessor({ framework }),
    ],
  },
});
