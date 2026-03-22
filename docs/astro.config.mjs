import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { vuepressPreprocessor } from './src/plugins/vuepress-preprocessor.mjs';
import { rehypeTableWrapper } from './src/plugins/rehype-table-wrapper.mjs';
import { buildAllSidebars } from './src/sidebar.mjs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';
import { createRequire } from 'module';
import { transformWithEsbuild } from 'vite';

// TypeScript is used to transpile Angular example .ts files because it
// correctly strips type-only imports (e.g. ApplicationConfig, HotGlobalConfig)
// that have no runtime value. esbuild's transform mode keeps all named imports
// unconditionally, causing runtime errors in the browser.
const _require = createRequire(import.meta.url);
const ts = _require('typescript');

import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Absolute path to the handsontable package root (used to resolve styles and
// other non-tmp/ files like `handsontable/styles/ht-theme-main.css`).
const HOT_DIR = resolve(__dirname, '../handsontable');

// Absolute path to the local Handsontable ESM build (handsontable/tmp/).
// Used to resolve `handsontable` and `handsontable/*` imports in example files
// without installing the package inside docs/node_modules/.
const HOT_TMP = resolve(HOT_DIR, 'tmp');

// React wrapper built ESM. React and ReactDOM are installed in docs/node_modules
// so Vite can pre-bundle them normally (CJS → ESM conversion).
const REACT_WRAPPER_DIR = resolve(__dirname, '../wrappers/react-wrapper');

// Vue 3 wrapper and its bundled Vue (from the wrapper's own node_modules).
const VUE3_WRAPPER_DIR = resolve(__dirname, '../wrappers/vue3');
const VUE3_MODULES = resolve(VUE3_WRAPPER_DIR, 'node_modules');

// Angular wrapper dist + all Angular packages and Zone.js from the wrapper's
// own node_modules. The Angular packages are pre-compiled Ivy ESM (fesm2022).
const NG_WRAPPER_DIST = resolve(__dirname, '../wrappers/angular-wrapper/dist/hot-table');
const NG_MODULES = resolve(__dirname, '../wrappers/angular-wrapper/node_modules');

// ── Angular example preprocessing ────────────────────────────────────────────
// Shared by the Vite transform hook (browser serving) and the esbuild plugin
// injected via optimizeDeps.esbuildOptions.plugins (dep-scan).

const ANGULAR_TS_OPTIONS = {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022,
  experimentalDecorators: true,
  emitDecoratorMetadata: false,
  useDefineForClassFields: false,
};

// Used in the esbuildOptions.plugins path which needs a raw JSON tsconfig.
const ANGULAR_TSCONFIG = {
  compilerOptions: {
    experimentalDecorators: true,
    emitDecoratorMetadata: false,
    useDefineForClassFields: false,
  },
};

/**
 * Strips multi-file section markers, skip-in-compilation blocks, and then
 * compiles the result with TypeScript's transpileModule so that type-only
 * imports (e.g. ApplicationConfig, HotGlobalConfig) are correctly removed.
 * esbuild's transform mode keeps all named imports unconditionally, causing
 * runtime errors when the browser finds no matching export in the ESM module.
 *
 * @param {string} code - Raw file contents.
 * @returns {string} Compiled JavaScript (ESNext module).
 */
function preprocessAngularTs(code) {
  // Remove /* file: ... */ and /* end-file */ section markers
  let out = code.replace(/\/\*\s*file:[^*]*\*\//g, '');

  out = out.replace(/\/\*\s*end-file\s*\*\//g, '');

  // Remove /* start:skip-in-compilation */ ... /* end:skip-in-compilation */
  // These blocks re-import classes already declared in the same flattened scope.
  out = out.replace(
    /\/\*\s*start:skip-in-compilation\s*\*\/[\s\S]*?\/\*\s*end:skip-in-compilation\s*\*\//g,
    ''
  );

  // Compile with TypeScript (not esbuild) so type-only imports are dropped.
  const result = ts.transpileModule(out, { compilerOptions: ANGULAR_TS_OPTIONS });

  return result.outputText;
}

/**
 * Vite plugin that resolves monorepo package imports that are not installed
 * inside docs/node_modules/:
 *
 * - `handsontable` / `handsontable/*`       → handsontable/tmp/
 * - `@handsontable/react-wrapper`            → wrappers/react-wrapper/es/
 * - `@handsontable/angular-wrapper`          → wrappers/angular-wrapper/dist/hot-table/
 * - `@handsontable/vue3`                     → wrappers/vue3/es/
 * - `vue`                                    → wrappers/vue3/node_modules/
 * - `@angular/*` / `zone.js` / `rxjs`        → wrappers/angular-wrapper/node_modules/
 *
 * react and react-dom are installed in docs/node_modules and resolved by Vite.
 *
 * Also applies framework-specific transforms to example files under docs/content/:
 * - `.jsx` files: React automatic JSX transform (jsxImportSource: react)
 * - `.ts` Angular example files: flatten multi-file sections, strip
 *   skip-in-compilation blocks, then esbuild with experimentalDecorators
 *
 * @returns {import('vite').Plugin}
 */
function resolveMonorepoPackages() {
  return {
    name: 'resolve-monorepo-packages',
    enforce: 'pre',

    // Transform example files under docs/content/ during normal dev serving.
    // (The dep-scan preprocessing is handled separately via
    //  optimizeDeps.esbuildOptions.plugins below.)
    //
    // .jsx  → React automatic JSX runtime (no explicit React import needed).
    // .ts   → Angular multi-file sections flattened, skip-in-compilation blocks
    //         stripped, then compiled with experimentalDecorators so Angular
    //         Ivy JIT decorators are preserved for runtime compilation.
    async transform(code, id) {
      if (!id.includes('/content/')) return null;

      if (id.endsWith('.jsx')) {
        return transformWithEsbuild(code, id, {
          jsx: 'automatic',
          jsxImportSource: 'react',
          loader: 'jsx',
        });
      }

      if (id.endsWith('.ts')) {
        // preprocessAngularTs strips markers and compiles via ts.transpileModule,
        // which correctly removes type-only imports. Return as JavaScript.
        return { code: preprocessAngularTs(code), map: null };
      }

      return null;
    },

    resolveId(id) {
      // ── Handsontable core ──────────────────────────────────────────────
      if (id === 'handsontable') {
        return resolve(HOT_TMP, 'index.mjs');
      }

      if (id.startsWith('handsontable/')) {
        const sub = id.slice('handsontable/'.length);
        const mjsPath = resolve(HOT_TMP, `${sub}.mjs`);

        if (existsSync(mjsPath)) return mjsPath;

        const jsPath = resolve(HOT_TMP, `${sub}.js`);

        if (existsSync(jsPath)) return jsPath;

        const indexMjsPath = resolve(HOT_TMP, sub, 'index.mjs');

        if (existsSync(indexMjsPath)) return indexMjsPath;

        const indexJsPath = resolve(HOT_TMP, sub, 'index.js');

        if (existsSync(indexJsPath)) return indexJsPath;

        const pkgRootPath = resolve(HOT_DIR, sub);

        if (existsSync(pkgRootPath)) return pkgRootPath;
      }

      // ── React wrapper ──────────────────────────────────────────────────
      if (id === '@handsontable/react-wrapper') {
        return resolve(REACT_WRAPPER_DIR, 'es/react-handsontable.mjs');
      }

      // react and react-dom are installed in docs/node_modules — Vite
      // resolves and pre-bundles them automatically (CJS → ESM).

      // ── Vue 3 wrapper ──────────────────────────────────────────────────
      if (id === '@handsontable/vue3') {
        return resolve(VUE3_WRAPPER_DIR, 'es/vue-handsontable.mjs');
      }

      // ── Vue (from the wrapper's own node_modules, ESM bundler build) ──
      // Must use vue.esm-bundler.js (not index.js which is CJS). The CJS entry
      // cannot be natively imported as an ES module in the browser, causing
      // "does not provide an export named 'createElementBlock'" errors.
      if (id === 'vue') return resolve(VUE3_MODULES, 'vue/dist/vue.esm-bundler.js');

      // ── Angular wrapper ────────────────────────────────────────────────
      if (id === '@handsontable/angular-wrapper') {
        return resolve(NG_WRAPPER_DIST, 'fesm2022/handsontable-angular-wrapper.mjs');
      }

      // ── Angular packages (fesm2022 ESM builds) ─────────────────────────
      if (id.startsWith('@angular/')) {
        const pkg = id.slice('@angular/'.length); // e.g. "core", "common/http"
        const [name, ...rest] = pkg.split('/');
        const pkgDir = resolve(NG_MODULES, `@angular/${name}`);
        const subPath = rest.length > 0 ? rest.join('/') : null;

        if (subPath) {
          // Sub-entry like @angular/common/http → fesm2022/http.mjs
          const mjsPath = resolve(pkgDir, `fesm2022/${subPath}.mjs`);

          if (existsSync(mjsPath)) return mjsPath;
        } else {
          const mjsPath = resolve(pkgDir, `fesm2022/${name}.mjs`);

          if (existsSync(mjsPath)) return mjsPath;
        }
      }

      // ── Zone.js ────────────────────────────────────────────────────────
      if (id === 'zone.js') {
        return resolve(NG_MODULES, 'zone.js/fesm2015/zone.js');
      }

      // ── RxJS (used by @handsontable/angular-wrapper internally) ────────
      if (id === 'rxjs') {
        return resolve(NG_MODULES, 'rxjs/dist/esm/index.js');
      }

      if (id.startsWith('rxjs/')) {
        const sub = id.slice('rxjs/'.length);
        const mjsPath = resolve(NG_MODULES, `rxjs/dist/esm/${sub}/index.js`);

        if (existsSync(mjsPath)) return mjsPath;
      }
    },

  };
}

const allSidebars = buildAllSidebars();

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

      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/handsontable/handsontable' },
      ],

      editLink: {
        baseUrl:
          'https://github.com/handsontable/handsontable/edit/develop/docs/content/',
      },

      customCss: [
        './src/styles/custom.css',
        './src/styles/interactive-example.css',
        // Handsontable base styles (imported via CSS @import bridge to keep
        // astro.config.mjs free of absolute out-of-project paths).
        './src/styles/handsontable-import.css',
      ],

      head: [
        {
          tag: 'script',
          attrs: { src: '/docs/example-tabs.js', defer: true },
        },
      ],

      sidebar: [
        { label: 'JavaScript', collapsed: false, items: allSidebars.javascript },
        { label: 'React', collapsed: false, items: allSidebars.react },
        { label: 'Angular', collapsed: false, items: allSidebars.angular },
        { label: 'JavaScript Recipes', collapsed: false, items: allSidebars.javascriptRecipes },
        { label: 'React Recipes', collapsed: false, items: allSidebars.reactRecipes },
        { label: 'Angular Recipes', collapsed: false, items: allSidebars.angularRecipes },
      ],

      components: {
        Head: './src/components/Head.astro',
        Header: './src/components/Header.astro',
        Footer: './src/components/Footer.astro',
        PageTitle: './src/components/PageTitle.astro',
        Sidebar: './src/components/Sidebar.astro',
        SiteTitle: './src/components/SiteTitle.astro',
      },

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
    // Exclude all packages resolved by resolveMonorepoPackages from Vite's
    // dep pre-bundling step. They are served directly via our custom resolveId
    // hooks at request time so pre-bundling is neither needed nor beneficial.
    // Without this, the dep-scan traces into the out-of-project-root packages
    // and produces a non-fatal "Expected ';' but found 'lazily'" parse warning.
    optimizeDeps: {
      exclude: [
        'handsontable',
        '@handsontable/react-wrapper',
        '@handsontable/angular-wrapper',
        '@handsontable/vue3',
        'vue',
        // Angular ecosystem — resolved from wrappers/angular-wrapper/node_modules
        '@angular/core',
        '@angular/common',
        '@angular/compiler',
        '@angular/platform-browser',
        '@angular/platform-browser-dynamic',
        '@angular/forms',
        '@angular/animations',
        '@angular/router',
        'zone.js',
        'rxjs',
        'rxjs/operators',
      ],

      // Inject an esbuild plugin into the dep-scan phase.
      // Vite's dep-scan uses esbuild directly and does NOT call Vite plugin
      // transform hooks. We preprocess Angular content .ts files here so
      // esbuild never sees the raw multi-section files with duplicate class names.
      esbuildOptions: {
        plugins: [
          {
            name: 'preprocess-angular-examples',
            setup(build) {
              build.onLoad({ filter: /\/content\/.*\.ts$/ }, (args) => {
                let code;

                try {
                  code = readFileSync(args.path, 'utf-8');
                } catch {
                  return undefined;
                }

                // preprocessAngularTs returns compiled JS (via ts.transpileModule),
                // so use loader 'js' — esbuild does not need to re-parse TypeScript.
                return {
                  contents: preprocessAngularTs(code),
                  loader: 'js',
                };
              });
            },
          },
        ],
      },
    },

    plugins: [
      // Runs BEFORE Astro's markdown processor.
      // Converts VuePress-specific syntax to Astro/CommonMark-compatible syntax.
      // Note: the only-for filtering in this plugin is redundant for content
      // collection entries (handled by framework-loader), but is kept for any
      // markdown files processed outside the content layer.
      vuepressPreprocessor({ framework: 'javascript' }),

      // Resolves handsontable, @handsontable/react-wrapper, react, and react-dom
      // to local monorepo builds. Required because docs/ does not install these
      // packages in its own node_modules.
      resolveMonorepoPackages(),
    ],

    // resolve.alias entries are honoured by both the Vite dev server and the
    // Rollup production build. The resolveId plugin hook above handles dev
    // serving; these aliases ensure the same resolution happens during `build`.
    resolve: {
      // Force a single copy of react/react-dom across all chunks.
      // Without this, Rollup may resolve react for out-of-root packages like
      // wrappers/react-wrapper/ from their own node_modules, producing two
      // React instances and causing "Cannot read properties of null (reading
      // 'useId')" / hook dispatcher errors at runtime.
      dedupe: ['react', 'react-dom', 'react-dom/client'],

      alias: [
        // ── Handsontable sub-paths (e.g. handsontable/editors/textEditor) ──
        // Must come before the bare 'handsontable' entry.
        {
          find: /^handsontable\/(.+)$/,
          replacement: '$1',
          customResolver(sub) {
            const mjsPath = resolve(HOT_TMP, `${sub}.mjs`);

            if (existsSync(mjsPath)) return mjsPath;

            const jsPath = resolve(HOT_TMP, `${sub}.js`);

            if (existsSync(jsPath)) return jsPath;

            // Also try as a directory with an index file (e.g. handsontable/i18n → i18n/index.mjs).
            const indexMjsPath = resolve(HOT_TMP, sub, 'index.mjs');

            if (existsSync(indexMjsPath)) return indexMjsPath;

            const indexJsPath = resolve(HOT_TMP, sub, 'index.js');

            if (existsSync(indexJsPath)) return indexJsPath;

            // Fall back to the package root for non-tmp/ assets (e.g. styles/).
            const pkgRootPath = resolve(HOT_DIR, sub);

            if (existsSync(pkgRootPath)) return pkgRootPath;

            return null;
          },
        },

        // ── Handsontable core ──────────────────────────────────────────────
        { find: 'handsontable', replacement: resolve(HOT_TMP, 'index.mjs') },

        // ── React wrapper ──────────────────────────────────────────────────
        {
          find: '@handsontable/react-wrapper',
          replacement: resolve(REACT_WRAPPER_DIR, 'es/react-handsontable.mjs'),
        },

        // ── Vue 3 wrapper ──────────────────────────────────────────────────
        {
          find: '@handsontable/vue3',
          replacement: resolve(VUE3_WRAPPER_DIR, 'es/vue-handsontable.mjs'),
        },

        // ── Vue (ESM bundler build — must not use index.js which is CJS) ──
        { find: 'vue', replacement: resolve(VUE3_MODULES, 'vue/dist/vue.esm-bundler.js') },

        // ── Angular wrapper ────────────────────────────────────────────────
        {
          find: '@handsontable/angular-wrapper',
          replacement: resolve(NG_WRAPPER_DIST, 'fesm2022/handsontable-angular-wrapper.mjs'),
        },

        // ── Angular packages (fesm2022 ESM builds) ─────────────────────────
        // replacement '$1' captures the part after @angular/, e.g. "core" or
        // "common/http". The customResolver maps it to the fesm2022 bundle.
        {
          find: /^@angular\/(.+)$/,
          replacement: '$1',
          customResolver(sub) {
            const [name, ...rest] = sub.split('/');
            const pkgDir = resolve(NG_MODULES, `@angular/${name}`);
            const subPath = rest.length > 0 ? rest.join('/') : null;

            if (subPath) {
              const mjsPath = resolve(pkgDir, `fesm2022/${subPath}.mjs`);

              if (existsSync(mjsPath)) return mjsPath;
            } else {
              const mjsPath = resolve(pkgDir, `fesm2022/${name}.mjs`);

              if (existsSync(mjsPath)) return mjsPath;
            }

            return null;
          },
        },

        // ── Zone.js ────────────────────────────────────────────────────────
        { find: 'zone.js', replacement: resolve(NG_MODULES, 'zone.js/fesm2015/zone.js') },

        // ── RxJS sub-paths (e.g. rxjs/operators) ──────────────────────────
        // Must come before bare 'rxjs' entry.
        {
          find: /^rxjs\/(.+)$/,
          replacement: '$1',
          customResolver(sub) {
            const indexPath = resolve(NG_MODULES, `rxjs/dist/esm/${sub}/index.js`);

            if (existsSync(indexPath)) return indexPath;

            return null;
          },
        },

        // ── RxJS core ──────────────────────────────────────────────────────
        { find: 'rxjs', replacement: resolve(NG_MODULES, 'rxjs/dist/esm/index.js') },
      ],
    },
  },
});
