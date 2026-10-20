import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import * as sass from 'sass';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');
const CORE_STYLES_ID = '\0nl-view-handsontable-styles';

/**
 * `StylesHandler` imports a generated CSS string (`src/styles/handsontableStyles`)
 * that the core styles build writes and gitignore hides. Compile the same SCSS
 * here so this page does not need that generated file.
 */
function coreStylesPlugin() {
  let css = null;

  return {
    name: 'nl-view-core-styles',
    enforce: 'pre',
    resolveId(id) {
      if (id.endsWith('styles/handsontableStyles')) {
        return CORE_STYLES_ID;
      }

      return null;
    },
    load(id) {
      if (id !== CORE_STYLES_ID) {
        return null;
      }

      if (css == null) {
        css = sass.compile(
          path.join(repoRoot, 'handsontable/src/styles/handsontable.scss'),
          { silenceDeprecations: ['legacy-js-api', 'import'] },
        ).css;
      }

      return `export default ${JSON.stringify(css)};`;
    },
  };
}

export default defineConfig({
  plugins: [coreStylesPlugin()],
  root: path.join(here, 'demo'),
  base: './',
  publicDir: false,
  build: {
    outDir: path.join(here, 'dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@hot': path.join(repoRoot, 'handsontable/src'),
    },
  },
  define: {
    'process.env.HOT_VERSION': JSON.stringify('poc'),
    'process.env.HOT_RELEASE_DATE': JSON.stringify(''),
    'process.env.HOT_BUILD_DATE': JSON.stringify(''),
  },
  server: {
    host: '127.0.0.1',
    port: 5199,
    strictPort: true,
    fs: { allow: [repoRoot] },
  },
  preview: {
    host: '127.0.0.1',
    port: 5199,
    strictPort: true,
  },
});
