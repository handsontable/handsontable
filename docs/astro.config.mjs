import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeRapide from 'starlight-theme-rapide';
import starlightPageActions from 'starlight-page-actions';
import starlightDocSearch from '@astrojs/starlight-docsearch';
import sitemap from '@astrojs/sitemap';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections';
import { vuepressPreprocessor } from './src/plugins/vuepress-preprocessor.mjs';
import { rehypeTableWrapper } from './src/plugins/rehype-table-wrapper.mjs';
import { rehypeMigrationSteps } from './src/plugins/rehype-migration-steps.mjs';
import { buildAllSidebars, buildAllValidUrls } from './src/sidebar.mjs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, symlinkSync } from 'fs';
import { relative, join } from 'path';
import { createRequire } from 'module';
import { transformWithEsbuild } from 'vite';
import vue from '@vitejs/plugin-vue';

// TypeScript is used to transpile Angular example .ts files because it
// correctly strips type-only imports (e.g. ApplicationConfig, HotGlobalConfig)
// that have no runtime value. esbuild's transform mode keeps all named imports
// unconditionally, causing runtime errors in the browser.
const _require = createRequire(import.meta.url);
const ts = _require('typescript');

import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Symlink for starlight-page-actions ───────────────────────────────────────
// The plugin hardcodes `src/content/docs/**/*.{md,mdx}` as the static-copy
// source path, but this project stores content at `docs/content/`. Create a
// symlink so the plugin can find the files on both local dev and CI.
const symlinkTarget = resolve(__dirname, 'src', 'content', 'docs');

if (!existsSync(symlinkTarget)) {
  mkdirSync(resolve(__dirname, 'src', 'content'), { recursive: true });
  symlinkSync(resolve(__dirname, 'content'), symlinkTarget);
}

// ── Build mode detection ─────────────────────────────────────────────────────
// BUILD_MODE env var is set by the deployment pipeline. When set to
// 'production', production-only 3rd-party scripts (GTM, HotJar) are injected
// and the "dev" badge next to the logo is hidden.
const buildMode = process.env.BUILD_MODE;
const isProduction = buildMode === 'production';

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

/**
 * Astro integration that generates /data/common.json during the build.
 *
 * The file is consumed by version-switcher dropdowns in all deployed doc
 * versions (current and previous). It lists every published release and all
 * live page URLs so that older builds can redirect removed pages to the
 * correct replacement.
 *
 * Shape:
 *   {
 *     versions: string[],                      // minor versions, newest first
 *     versionsWithPatches: [string, string[]][], // [[minor, [patch, ...]], ...]
 *     latestVersion: string,                   // e.g. "17.0"
 *     urls: [string, string][]                 // [url-path, max-version]
 *   }
 *
 * Version data is fetched from the GitHub Releases API at build time and
 * supplemented with the local handsontable package.json. Network failures
 * are tolerated -- the file is written with only the local version.
 *
 * The file is written to:
 *   - public/data/common.json  (dev server)
 *   - dist/data/common.json    (build output)
 */
function commonJsonIntegration() {
  const matter = _require('gray-matter');
  const semver = _require('semver');
  const contentDir = resolve(__dirname, 'content');
  const PREFIXES = ['javascript-data-grid', 'react-data-grid', 'angular-data-grid'];
  const MIN_DOCS_VERSION = '9.0';

  // ── Version helpers ──────────────────────────────────────────────────────

  function toMinor(patchVersion) {
    const parsed = semver.parse(patchVersion);

    return parsed ? `${parsed.major}.${parsed.minor}` : null;
  }

  function getLocalVersion() {
    try {
      const pkg = _require(join(__dirname, '..', 'handsontable', 'package.json'));

      return pkg.version ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Fetches release tags from GitHub and returns version data.
   * Returns null on network error so callers can fall back gracefully.
   */
  async function fetchGitHubVersions() {
    const url =
      'https://api.github.com/repos/handsontable/handsontable/releases?per_page=100';

    const res = await fetch(url, {
      headers: { 'User-Agent': 'handsontable-docs-build' },
    });

    if (!res.ok) return null;

    const releases = await res.json();

    // Collect all stable patch tags, sort newest-first.
    const patchTags = releases
      .map((r) => r.tag_name)
      .filter((tag) => !semver.prerelease(tag) && semver.valid(tag))
      .sort((a, b) => semver.rcompare(a, b));

    // Group by minor version.
    const minorMap = new Map(); // minor -> [patch, ...]

    for (const tag of patchTags) {
      const minor = toMinor(tag);

      if (!minor) continue;

      if (!minorMap.has(minor)) minorMap.set(minor, []);

      minorMap.get(minor).push(tag);
    }

    // Build list of minor versions, newest-first, capped at MIN_DOCS_VERSION.
    const minors = [...minorMap.keys()].sort((a, b) => semver.rcompare(`${a}.0`, `${b}.0`));
    const minIdx = minors.indexOf(MIN_DOCS_VERSION);
    const cappedMinors = minIdx === -1 ? minors : minors.slice(0, minIdx + 1);

    return { minors: cappedMinors, minorMap };
  }

  // ── URL collection ────────────────────────────────────────────────────────

  /**
   * Scans all .md files in content/ and collects their permalink values.
   * Returns an array of `[url-path, ""]` tuples (empty string = still live).
   *
   * When `distDir` is provided the function first tries to derive URLs from
   * the built HTML files (which include auto-generated API pages that are
   * not committed to the content/ directory). The content/ scan is used as
   * a fallback when `distDir` is omitted (e.g. dev-server startup).
   *
   * @param {string|null} distDir - Optional path to the Astro dist output.
   */
  function collectUrls(distDir = null) {
    const seen = new Set();
    const urls = [];

    if (distDir) {
      // Build mode: derive URLs from the generated HTML files in dist/.
      // Each HTML page lives at dist/{path}/index.html → URL path is {path}.
      function scanDist(dir, base) {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, entry.name);

          if (entry.isDirectory()) {
            scanDist(full, base);
            continue;
          }

          if (entry.name !== 'index.html') continue;

          // Derive the relative URL path from the directory path.
          const relDir = dir.slice(base.length).replace(/^\//, '');

          if (!relDir) continue;

          // Only include framework-prefixed paths.
          const matchedPrefix = PREFIXES.find((p) => relDir === p || relDir.startsWith(`${p}/`));

          if (!matchedPrefix) continue;

          if (!seen.has(relDir)) {
            seen.add(relDir);
            urls.push([relDir, '']);
          }
        }
      }

      scanDist(distDir, distDir);
    } else {
      // Dev mode: scan .md files in content/ for their permalink values.
      function scanContent(dir) {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, entry.name);

          if (entry.isDirectory()) {
            scanContent(full);
            continue;
          }

          if (!entry.name.endsWith('.md')) continue;

          let raw;

          try {
            raw = readFileSync(full, 'utf-8');
          } catch {
            continue;
          }

          const { data } = matter(raw);

          if (!data.permalink) continue;

          const slug = data.permalink.replace(/^\//, '').replace(/\/$/, '');

          for (const prefix of PREFIXES) {
            const urlPath = slug ? `${prefix}/${slug}` : prefix;

            if (!seen.has(urlPath)) {
              seen.add(urlPath);
              urls.push([urlPath, '']);
            }
          }
        }
      }

      // Add bare prefix entries (e.g. "javascript-data-grid") for root pages.
      for (const prefix of PREFIXES) {
        if (!seen.has(prefix)) {
          seen.add(prefix);
          urls.push([prefix, '']);
        }
      }

      scanContent(contentDir);
    }

    return urls;
  }

  // ── Main build function ───────────────────────────────────────────────────

  async function buildAndWrite(outDir, distDir = null) {
    const localPatch = getLocalVersion(); // e.g. "17.0.1"
    const localMinor = localPatch ? toMinor(localPatch) : null;

    let minors = localMinor ? [localMinor] : [];
    let minorMap = new Map();

    if (localMinor && localPatch) {
      minorMap.set(localMinor, [localPatch]);
    }

    // Attempt to augment with the full release history from GitHub.
    try {
      const gh = await fetchGitHubVersions();

      if (gh) {
        // GitHub has the complete list of patches per minor version.
        // Prefer GitHub data for any minor that already appears there.
        // Keep the local version as fallback for brand-new minors not yet
        // in GitHub (e.g. a pre-release build on the dev site).
        for (const [minor, patches] of gh.minorMap) {
          minorMap.set(minor, patches);
        }

        // Build merged minor list, newest-first, deduped.
        const allMinors = new Set([
          ...(localMinor ? [localMinor] : []),
          ...gh.minors,
        ]);

        minors = [...allMinors].sort((a, b) => semver.rcompare(`${a}.0`, `${b}.0`));
      }
    } catch {
      // Network failure -- continue with local version only.
    }

    const latestVersion = minors[0] ?? localMinor ?? 'next';
    const versionsWithPatches = minors.map((m) => [m, minorMap.get(m) ?? []]);
    const urls = collectUrls(distDir);

    const payload = {
      versions: minors,
      versionsWithPatches,
      latestVersion,
      urls,
    };

    mkdirSync(resolve(outDir, 'data'), { recursive: true });
    writeFileSync(
      resolve(outDir, 'data', 'common.json'),
      JSON.stringify(payload),
      'utf-8'
    );
  }

  // Write to public/data/ at startup so the dev server can serve it.
  buildAndWrite(resolve(__dirname, 'public')).catch(() => {});

  return {
    name: 'common-json',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const outDir = fileURLToPath(dir);

        // Pass distDir so collectUrls() can scan built HTML files, which
        // includes auto-generated API pages not present in content/.
        await buildAndWrite(outDir, outDir);
      },
    },
  };
}

/**
 * Astro integration that generates clean Markdown files for the
 * starlight-page-actions "View in Markdown" / "Copy Markdown" features.
 *
 * Scans docs/content/ for .md files, reads their `permalink` frontmatter,
 * and writes cleaned Markdown to public/ (dev) and dist/ (build) for all
 * three framework prefixes.
 *
 * Generated files live under public/_md/ and are gitignored.
 */
function markdownRoutesIntegration() {
  const matter = _require('gray-matter');
  const contentDir = resolve(__dirname, 'content');
  const publicMdDir = resolve(__dirname, 'public', '_md');
  const PREFIXES = ['javascript-data-grid', 'react-data-grid', 'angular-data-grid'];

  function buildRouteMap() {
    const routeMap = new Map();

    function scanDir(dir) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);

        if (entry.isDirectory()) {
          scanDir(full);
          continue;
        }

        if (!entry.name.endsWith('.md')) continue;

        let raw;

        try {
          raw = readFileSync(full, 'utf-8');
        } catch {
          continue;
        }

        const { data, content } = matter(raw);

        if (!data.title) continue;

        const rel = relative(contentDir, full);

        if (rel === 'index.md') {
          routeMap.set('index.md', `# ${data.title}\n\n${content.trim()}`);
          continue;
        }

        if (!data.permalink) continue;

        const slug = data.permalink.replace(/^\//, '').replace(/\/$/, '') || 'index';
        const md = `# ${data.title}\n\n${content.trim()}`;

        for (const prefix of PREFIXES) {
          routeMap.set(`${prefix}/${slug}.md`, md);
        }
      }
    }

    scanDir(contentDir);

    return routeMap;
  }

  function writeFiles(outDir) {
    const routeMap = buildRouteMap();

    for (const [filePath, md] of routeMap) {
      const dest = resolve(outDir, filePath);
      const destDir = dirname(dest);

      mkdirSync(destDir, { recursive: true });
      writeFileSync(dest, md, 'utf-8');
    }

    return routeMap.size;
  }

  // Write to public/_md/ at startup so dev server can serve them.
  // Files in public/ are served at the site root by Vite's static server.
  writeFiles(publicMdDir);

  return {
    name: 'markdown-routes',
    hooks: {
      // Build mode: also write .md files into the dist directory.
      'astro:build:done': ({ dir }) => {
        const outDir = fileURLToPath(dir);

        writeFiles(resolve(outDir, '_md'));
      },
    },
  };
}

const allSidebars = buildAllSidebars();

// Pre-compute valid URL sets at config-evaluation time (plain Node.js context,
// where import.meta.url correctly points to the source file and require() works).
// The result is serialized into a virtual Vite module so that Astro components
// can import it as static data without pulling sidebar.mjs — which uses
// createRequire(import.meta.url) — into the prerender bundle. When bundled by
// Vite, import.meta.url in sidebar.mjs would point to the chunk output path,
// making require('../content/sidebars.js') fail to resolve.
const _validUrlArrays = (() => {
  const urls = buildAllValidUrls();
  const out = {};

  for (const [fw, set] of Object.entries(urls)) {
    out[fw] = [...set];
  }

  return JSON.stringify(out);
})();

export default defineConfig({
  site: 'https://handsontable.com',
  base: '/docs',


  integrations: [
    starlight({
      title: 'Handsontable',
      description:
        'Handsontable is a JavaScript/TypeScript data grid component for React, Angular, and Vue 3.',

      logo: {
        light: './src/assets/logo.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: true,
      },

      favicon: '/img/favicon.png',

      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/handsontable/handsontable' },
      ],

      editLink: {
        baseUrl:
          'https://github.com/handsontable/handsontable/edit/develop/docs/content/',
      },

      expressiveCode: {
        plugins: [pluginLineNumbers(), pluginCollapsibleSections()],
        themes: ['github-dark', 'github-light'],
        defaultProps: {
          showLineNumbers: true,
        },
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
        // Prevent HOT from injecting a duplicate <style id="handsontable-core-styles"> at runtime.
        // StylesHandler.#injectCoreStyles() skips injection when it finds an element with this ID.
        // The actual HOT CSS is already loaded by handsontable-import.css via customCss above.
        {
          tag: 'style',
          attrs: { id: 'handsontable-core-styles' },
          content: '/* HOT base styles loaded via handsontable-import.css */',
        },
        // ── All-environment 3rd-party scripts ──────────────────────────────
        // Sentry error monitoring
        {
          tag: 'script',
          attrs: {
            id: 'Sentry.io',
            src: 'https://js.sentry-cdn.com/611b4dbe630c4a434fe1367b98ba3644.min.js',
            crossorigin: 'anonymous',
            defer: true,
          },
        },
        // Cookiebot — cookie consent popup
        {
          tag: 'script',
          attrs: {
            id: 'Cookiebot',
            src: 'https://consent.cookiebot.com/uc.js',
            'data-cbid': 'ef171f1d-a288-433f-b680-3cdbdebd5646',
            defer: true,
          },
        },
        // Headway changelog widget
        {
          tag: 'script',
          attrs: {
            id: 'Headwayapp',
            src: 'https://cdn.headwayapp.co/widget.js',
            defer: true,
          },
        },
        // ── Production-only 3rd-party scripts ──────────────────────────────
        // Google Tag Manager
        ...(isProduction
          ? [
              {
                tag: 'script',
                content: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-55L5D3');`,
              },
              // HotJar
              {
                tag: 'script',
                content: `(function(h,o,t,j,a,r){window.addEventListener('DOMContentLoaded',function(){if(h.innerWidth>600){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:329042,hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);}});})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`,
              },
            ]
          : []),
      ],

      sidebar: [
        { label: 'JavaScript',           collapsed: true, items: allSidebars.javascript },
        { label: 'React',                collapsed: true, items: allSidebars.react },
        { label: 'Angular',              collapsed: true, items: allSidebars.angular },
        { label: 'Vue 3',                collapsed: true, items: allSidebars.vue },
        { label: 'JavaScript Recipes',   collapsed: true, items: allSidebars.javascriptRecipes },
        { label: 'React Recipes',        collapsed: true, items: allSidebars.reactRecipes },
        { label: 'Angular Recipes',      collapsed: true, items: allSidebars.angularRecipes },
        { label: 'Vue 3 Recipes',        collapsed: true, items: allSidebars.vueRecipes },
        { label: 'JavaScript Changelog', collapsed: true, items: allSidebars.javascriptChangelog },
        { label: 'React Changelog',      collapsed: true, items: allSidebars.reactChangelog },
        { label: 'Angular Changelog',    collapsed: true, items: allSidebars.angularChangelog },
        { label: 'Vue 3 Changelog',      collapsed: true, items: allSidebars.vueChangelog },
      ],

      components: {
        Head: './src/components/Head.astro',
        Header: './src/components/Header.astro',
        Footer: './src/components/Footer.astro',
        MarkdownContent: './src/components/MarkdownContent.astro',
        PageTitle: './src/components/PageTitle.astro',
        Sidebar: './src/components/Sidebar.astro',
        PageSidebar: './src/components/PageSidebar.astro',
        SiteTitle: './src/components/SiteTitle.astro',
      },

      plugins: [
        starlightThemeRapide(),
        starlightPageActions(),
        ...(isProduction
          ? [
              starlightDocSearch({
                clientOptionsModule: './src/config/docsearch.ts',
              }),
            ]
          : []),
      ],

      // Algolia DocSearch powers search in production and RC builds.
      // Pagefind disabled -- the index is built by the Algolia crawler after each deploy.
      // Search is hidden in non-production builds via shouldRenderSearch in Header.astro.
      // RC builds use the production Algolia index; results link to handsontable.com/docs.
      pagefind: false,
    }),

    // Serves clean Markdown at *.md URLs for the "View in Markdown" button
    // added by starlight-page-actions.
    markdownRoutesIntegration(),

    // Generates /docs/data/common.json consumed by the version dropdown in
    // all deployed doc versions (current and previous).
    commonJsonIntegration(),

    // Generate sitemap.xml during build.
    sitemap(),
  ],

  markdown: {
    remarkPlugins: [
      // No extra remark plugins needed — preprocessing is handled by the Vite
      // plugin above which runs on the raw source before remark-parse.
    ],
    rehypePlugins: [
      // Wraps <table> in a scrollable div (mirrors markdown-it-table-wrapper).
      rehypeTableWrapper,
      // Styles numbered h2 headings (e.g., "1. Title") as step indicators.
      rehypeMigrationSteps,
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
    server: {
      allowedHosts: ['.trycloudflare.com'],
    },
    // Use the React automatic JSX runtime for .tsx source files under src/,
    // so components don't need an explicit `import React from 'react'`.
    // (Content-tree .jsx examples are handled separately by the custom
    // resolveMonorepoPackages transform hook above.)
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
    },
    // Expose BUILD_MODE to Astro components via import.meta.env.PUBLIC_BUILD_MODE.
    // The deployment pipeline sets BUILD_MODE; this bridges it into the Vite/Astro
    // env namespace so .astro components can read it at build time.
    define: {
      'import.meta.env.PUBLIC_BUILD_MODE': JSON.stringify(buildMode || ''),
      'import.meta.env.PUBLIC_CHAT_API_URL': JSON.stringify(
        process.env.PUBLIC_CHAT_API_URL || 'https://hot-docs-assistant.netlify.app'
      ),
    },

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
      // Exposes pre-computed valid sidebar URL sets as static data. Astro
      // components import from 'virtual:valid-urls' so that sidebar.mjs
      // (which uses createRequire) is never pulled into the prerender bundle.
      {
        name: 'virtual:valid-urls',
        resolveId(id) {
          if (id === 'virtual:valid-urls') return '\0virtual:valid-urls';
        },
        load(id) {
          if (id === '\0virtual:valid-urls') {
            return `export const validUrlArrays = ${_validUrlArrays};`;
          }
        },
      },

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

      // Enables Vite to process .vue SFC files used by Vue 3 doc examples.
      vue(),
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
