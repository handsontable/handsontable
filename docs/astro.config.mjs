import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeRapide from 'starlight-theme-rapide';
import starlightPageActions from 'starlight-page-actions';
import sitemap from '@astrojs/sitemap';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections';
import { vuepressPreprocessor } from './src/plugins/vuepress-preprocessor.mjs';
import { rehypeTableWrapper } from './src/plugins/rehype-table-wrapper.mjs';
import { rehypeMigrationSteps } from './src/plugins/rehype-migration-steps.mjs';
import { buildAllSidebars } from './src/sidebar.mjs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, symlinkSync } from 'fs';
import { relative, join } from 'path';
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
        // VWO (Visual Website Optimizer) A/B testing
        {
          tag: 'script',
          attrs: { id: 'vwoCode' },
          content: `window._vwo_code||function(){var account_id=1134117,version=2.1,settings_tolerance=2e3,hide_element="body",hide_element_style="opacity:0 !important;filter:alpha(opacity=0) !important;background:none !important;transition:none !important;",f=!1,w=window,d=document,v=d.querySelector("#vwoCode"),cK="_vwo_"+account_id+"_settings",cc={};try{var c=JSON.parse(localStorage.getItem("_vwo_"+account_id+"_config"));cc=c&&"object"==typeof c?c:{}}catch(e){}var stT="session"===cc.stT?w.sessionStorage:w.localStorage;code={nonce:v&&v.nonce,library_tolerance:function(){return"undefined"!=typeof library_tolerance?library_tolerance:void 0},settings_tolerance:function(){return cc.sT||settings_tolerance},hide_element_style:function(){return"{"+(cc.hES||hide_element_style)+"}"},hide_element:function(){return performance.getEntriesByName("first-contentful-paint")[0]?"":"string"==typeof cc.hE?cc.hE:hide_element},getVersion:function(){return version},finish:function(e){if(!f){f=!0;var t=d.getElementById("_vis_opt_path_hides");t&&t.parentNode.removeChild(t),e&&new Image().src="https://dev.visualwebsiteoptimizer.com/ee.gif?a="+account_id+e}},finished:function(){return f},addScript:function(e){var t=d.createElement("script");t.type="text/javascript",e.src?t.src=e.src:t.text=e.text,v&&t.setAttribute("nonce",v.nonce),d.getElementsByTagName("head")[0].appendChild(t)},load:function(e,t){var n=this.getSettings(),i=d.createElement("script"),r=this;if(t=t||{},n)i.textContent=n,d.getElementsByTagName("head")[0].appendChild(i),w.VWO&&!VWO.caE||(stT.removeItem(cK),r.load(e));else{var o=new XMLHttpRequest;o.open("GET",e,!0),o.withCredentials=!t.dSC,o.responseType=t.responseType||"text",o.onload=function(){t.onloadCb?t.onloadCb(o,e):200===o.status||304===o.status?_vwo_code.addScript({text:o.responseText}):_vwo_code.finish("&e=loading_failure:"+e)},o.onerror=function(){t.onerrorCb?t.onerrorCb(e):_vwo_code.finish("&e=loading_failure:"+e)},o.send()}},getSettings:function(){try{var e=stT.getItem(cK);if(!e)return;if(e=JSON.parse(e),Date.now()>e.e)return void stT.removeItem(cK);return e.s}catch(e){return}},init:function(){if(!(d.URL.indexOf("__vwo_disable__")>-1)){var e=this.settings_tolerance();w._vwo_settings_timer=setTimeout(function(){_vwo_code.finish(),stT.removeItem(cK)},e);var t;if("body"!==this.hide_element()){t=d.createElement("style");var n=this.hide_element(),i=n?n+this.hide_element_style():"",r=d.getElementsByTagName("head")[0];t.setAttribute("id","_vis_opt_path_hides"),v&&t.setAttribute("nonce",v.nonce),t.setAttribute("type","text/css"),t.styleSheet?t.styleSheet.cssText=i:t.appendChild(d.createTextNode(i)),r.appendChild(t)}else{t=d.getElementsByTagName("head")[0];var a=d.createElement("div");a.style.cssText="z-index:2147483647 !important;position:fixed !important;left:0 !important;top:0 !important;width:100% !important;height:100% !important;background:white !important;display:block !important;",a.setAttribute("id","_vis_opt_path_hides"),a.classList.add("_vis_hide_layer"),t.parentNode.insertBefore(a,t.nextSibling)}var s=w._vis_opt_url||d.URL,l="https://dev.visualwebsiteoptimizer.com/j.php?a="+account_id+"&u="+encodeURIComponent(s)+"&vn="+version;-1!==w.location.search.indexOf("_vwo_xhr")?this.addScript({src:l}):this.load(l+"&x=true")}}},w._vwo_code=code,code.init()}();`,
        },
        // VWO + Cookiebot consent integration
        {
          tag: 'script',
          content: `window.VWO=window.VWO||[];window.VWO.init=window.VWO.init||function(state){window.VWO.consentState=state};var category="marketing";function updateConsent(){var cb=window.Cookiebot;var consents=cb&&cb.consent;if(!consents||!consents.stamp)return window.VWO.init(2);return window.VWO.init(consents[category]?1:3)}["CookiebotOnConsentReady","CookiebotOnAccept","CookiebotOnDecline"].forEach(function(event){window.addEventListener(event,updateConsent)});`,
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
        { label: 'JavaScript', collapsed: true, items: allSidebars.javascript },
        { label: 'React', collapsed: true, items: allSidebars.react },
        { label: 'Angular', collapsed: true, items: allSidebars.angular },
        { label: 'JavaScript Recipes', collapsed: true, items: allSidebars.javascriptRecipes },
        { label: 'React Recipes', collapsed: true, items: allSidebars.reactRecipes },
        { label: 'Angular Recipes', collapsed: true, items: allSidebars.angularRecipes },
        { label: 'JavaScript Changelog', collapsed: true, items: allSidebars.javascriptChangelog },
        { label: 'React Changelog', collapsed: true, items: allSidebars.reactChangelog },
        { label: 'Angular Changelog', collapsed: true, items: allSidebars.angularChangelog },
      ],

      components: {
        Head: './src/components/Head.astro',
        Header: './src/components/Header.astro',
        Footer: './src/components/Footer.astro',
        PageTitle: './src/components/PageTitle.astro',
        Sidebar: './src/components/Sidebar.astro',
        PageSidebar: './src/components/PageSidebar.astro',
        SiteTitle: './src/components/SiteTitle.astro',
      },

      plugins: [
        starlightThemeRapide(),
        starlightPageActions(),
      ],

      // ── Algolia DocSearch ──────────────────────────────────────────────────
      // To enable: install @astrojs/starlight-docsearch, then set env vars:
      //   ALGOLIA_APP_ID, ALGOLIA_API_KEY
      //
      // Index name logic (mirrors the VuePress AlgoliaSearch.vue behaviour):
      //   - Latest released version → index 'handsontable'
      //   - Older / dev versions    → index 'handsontable-with-versions'
      //
      // Pagefind is used as default local search until Algolia is wired up.
      // Search is hidden entirely in non-production builds (see Header.astro).
    }),

    // Serves clean Markdown at *.md URLs for the "View in Markdown" button
    // added by starlight-page-actions.
    markdownRoutesIntegration(),

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
    // Expose BUILD_MODE to Astro components via import.meta.env.PUBLIC_BUILD_MODE.
    // The deployment pipeline sets BUILD_MODE; this bridges it into the Vite/Astro
    // env namespace so .astro components can read it at build time.
    define: {
      'import.meta.env.PUBLIC_BUILD_MODE': JSON.stringify(buildMode || ''),
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
