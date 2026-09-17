/**
 * Cloudflare Pages Worker for Handsontable docs preview site.
 *
 * When a _worker.js is present in Cloudflare Pages, it intercepts ALL requests
 * and _redirects is ignored. This worker is the sole, hand-maintained authority
 * for every redirect rule below - there is no generator.
 *
 * Legacy hostnames (see LEGACY_DOCS_HOSTS) collapse onto handsontable.com.
 * That is rule 12a, and its placement is load-bearing - read its comment
 * before moving it. `abs()` also swaps in the canonical origin for a legacy
 * host, so every rule above 12a redirects cross-host in a single hop with the
 * path's meaning resolved; rule 18 sits below the cut and so takes two.
 *
 * A rule that SERVES content rather than redirecting must stay below 12a, or
 * it answers 200 on a legacy host and keeps that host indexable.
 *
 * Redirect priority order (first match wins). Keep these numbers in step with
 * the `// -- N.` markers in route() - this list is the documented authority
 * (docs/cloudflare/README.md), and a stale entry here has already produced a
 * wrong code-review finding:
 *   1. /docs/next/:splat                   → /docs/:splat
 *  1a. /docs/sitemap.xml                   → /docs/sitemap-index.xml
 *  1b. /docs/{LATEST_VERSION}/:splat       → /docs/:splat
 *   2. /{/}                                → /docs
 *  2a. /0.8.0/*                            → /docs/javascript-data-grid/changelog
 *  2b. /docs/redirect?pageId=*             → /docs/javascript-data-grid/changelog
 *  2c. Blog article redirects              → /blog/... or /blog
 *  2d. /demo/*                             → /demo
 *  2e. /customers/*                        → /customers/
 *   3. Legacy versioned angular-data-grid  → /docs/angular-data-grid/ or /docs/javascript-data-grid/
 *   4. /docs/hyperformula[/*]              → external hyperformula site
 *   5. Exact versioned HTML redirects      → framework-specific pages
 *   6. Cross-framework page fixes (angular/react wrong-prefix pages)
 *   7. /docs/(javascript|angular|react)-data-grid/(row-sorting|column-sorting|release-notes)
 *  7a. Vue 3 legacy page redirects         → /docs/vue-data-grid/*
 *  7b. Versioned Vue 3 legacy pages        → /docs/:ver/vue-data-grid/*
 *   8. Recipe cell-type slug mismatches
 *   9. Flat /docs/react-data-grid/row-sorting etc.
 *  10. Flat /docs/react-*                  → /docs/react-data-grid/*
 *  11. Tutorial flat redirects             → /docs/javascript-data-grid/*
 *  12. Framework shorthand redirects       → framework homes
 * 12a. Legacy hostname (GET/HEAD)          → same path on handsontable.com (301)
 *  13. /docs/:ver/:page.html               → versioned framework pages (cookie, 302)
 *  14. /docs/:ver{/}                       → version root or framework home (cookie, 302)
 *  15. /docs/(page).html                   → flat framework page (cookie, 302)
 *  16. /docs/(page){/}                     → flat framework page (cookie, 302)
 *  17. /docs{/}                            → /docs/(framework)/ (cookie, 302)
 *  18. Versioned /docs/:ver/react-*        → /docs/:ver/react-data-grid/*
 * 18a. POST /docs/scripts/json/save.json   → mock 200 JSON (saving-data demo)
 * 18b. /docs/_md/**.md, /docs/llms*.txt   → served from assets as text/plain
 * 18c. GET /docs/api/design-system-updated.json → Figma last-update date (JSON)
 *  19. Static asset fallback (env.ASSETS)
 */

// ---------------------------------------------------------------------------
// Cookie helper
// ---------------------------------------------------------------------------

/**
 * Returns the framework slug based on the docs_fw cookie value.
 *
 * @param {string|null} cookieValue
 * @returns {string}
 */
function getFrameworkFromCookie(cookieValue) {
  if (cookieValue === 'react') return 'react-data-grid';
  if (cookieValue === 'angular') return 'angular-data-grid';

  return 'javascript-data-grid';
}

/**
 * Parses the Cookie header and returns the value for the given cookie name.
 *
 * @param {Request} request
 * @param {string} name
 * @returns {string|null}
 */
function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';

  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');

    if (key.trim() === name) {
      return rest.join('=').trim();
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Data: canonical host and the legacy hosts that collapse onto it
// ---------------------------------------------------------------------------

// The canonical origin for every documentation page. Astro already emits a
// matching `<link rel="canonical">`, but a canonical tag is only a hint: a
// duplicate host that answers 200 stays crawlable, so both URLs can sit in the
// index and each copy burns crawl budget. The rules below turn the hint into a
// permanent redirect.
const CANONICAL_DOCS_ORIGIN = 'https://handsontable.com';

// Hosts whose every URL must end up on CANONICAL_DOCS_ORIGIN.
//
// This is an exact-match allowlist, and deliberately NOT "any host that is not
// handsontable.com". The same worker serves staging and every PR preview from
// `handsontable-docs-staging.pages.dev` and its per-branch subdomains, so a
// negative match would 301 all of them into production and break docs review
// with no visible error. The production Pages apex
// (`handsontable-docs.pages.dev`) is left out too - it is the documented way
// to verify a production deploy directly (see `docs/README-DEPLOYMENT.md`).
const LEGACY_DOCS_HOSTS = new Set([
  // The pre-Astro documentation home, still bound to the production Pages
  // project as a custom domain. Without the rules below it answers 200 for the
  // whole `/docs` tree - a byte-identical duplicate of handsontable.com/docs.
  'docs.handsontable.com',
]);

/**
 * Returns true when the request arrived on a legacy host that must be
 * collapsed onto the canonical one.
 *
 * @param {URL} url
 * @returns {boolean}
 */
function isLegacyDocsHost(url) {
  // The URL parser lowercases a hostname but keeps a fully-qualified trailing
  // dot, so `docs.handsontable.com.` would miss an exact-match Set and serve
  // 200 - the classic allowlist bypass on a CDN-fronted host.
  return LEGACY_DOCS_HOSTS.has(url.hostname.replace(/\.$/, ''));
}

// ---------------------------------------------------------------------------
// Redirect helpers
// ---------------------------------------------------------------------------

/**
 * Returns a 301 redirect Response to the given absolute destination URL.
 *
 * @param {string} destination
 * @returns {Response}
 */
function redirect301(destination) {
  return Response.redirect(destination, 301);
}

/**
 * Returns a 302 redirect Response to the given absolute destination URL.
 *
 * @param {string} destination
 * @returns {Response}
 */
function redirect302(destination) {
  return Response.redirect(destination, 302);
}

/**
 * Builds an absolute URL string from a path, relative to the request origin.
 *
 * Staging and preview hosts keep their own origin, so a redirect matched there
 * stays inside the deployment under review. A legacy host instead gets the
 * canonical origin, which is what lets every path rule below double as a
 * one-hop cross-host redirect: the rule resolves what the path MEANS, and the
 * reader lands on that page's real URL on handsontable.com rather than being
 * bounced to the same stale path twice.
 *
 * @param {string} path  – must begin with /
 * @param {URL} base
 * @returns {string}
 */
function abs(path, base) {
  const origin = isLegacyDocsHost(base) ? CANONICAL_DOCS_ORIGIN : base.origin;

  return `${origin}${path}`;
}

// ---------------------------------------------------------------------------
// Data: latest documentation version
// ---------------------------------------------------------------------------

// The MAJOR.MINOR version whose docs are also served at the unversioned
// `/docs/...` root. The `__LATEST_DOCS_VERSION__` placeholder is replaced at
// deploy time with the value computed by deploy/getListOrPreviousVersions.mjs
// (the same source the docs build uses). When the placeholder is left
// unreplaced (for example, on staging previews that have no versioned docs),
// the `\d+\.\d+` guard in rule 1b makes the latest-version redirect a no-op.
const LATEST_VERSION = '__LATEST_DOCS_VERSION__';

// ---------------------------------------------------------------------------
// Data: versioned HTML redirect map (used by /docs/{ver}/{page}.html)
// ---------------------------------------------------------------------------

// Entries used for versions < 12 (old slugs map to old flat slugs or framework-specific ones).
const VERSIONED_HTML_MAP_PRE12 = {
  'tutorial-introduction': '',
  'tutorial-compatibility': 'supported-browsers',
  'tutorial-licensing': 'software-license',
  'tutorial-license-key': 'license-key',
  'tutorial-quick-start': 'installation',
  'tutorial-data-binding': 'binding-to-data',
  'tutorial-data-sources': 'binding-to-data',
  'tutorial-load-and-save': 'saving-data',
  'tutorial-setting-options': 'setting-options',
  'tutorial-grid-sizing': 'grid-size',
  'tutorial-using-callbacks': 'events-and-hooks',
  'tutorial-keyboard-navigation': 'keyboard-navigation',
  'tutorial-internationalization': 'internationalization-i18n',
  'tutorial-modules': 'modules',
  'tutorial-custom-build': 'building',
  'tutorial-custom-plugin': 'plugins',
  'tutorial-cell-types': 'cell-type',
  'tutorial-cell-editor': 'cell-editor',
  'tutorial-cell-function': 'cell-function',
  'tutorial-suspend-rendering': 'batch-operations',
  'tutorial-testing': 'testing',
  'tutorial-performance-tips': 'performance',
  'tutorial-release-notes': 'release-notes',
  'tutorial-migration-guide': 'migration-from-7.4-to-8.0',
  'tutorial-changelog': '/changelog/',
  'tutorial-known-limitations': '/third-party-licenses/',
  'demo-using-callbacks': '/events-and-hooks/',
  'demo-react-simple-examples': '/react-simple-example/',
  'demo-scrolling': 'row-virtualization',
  'demo-fixing': 'column-freezing',
  'demo-resizing': 'column-width',
  'demo-moving': 'column-moving',
  'demo-pre-populating': 'row-prepopulating',
  'demo-stretching': 'column-width',
  'demo-freezing': 'column-freezing',
  'demo-fixing-bottom': 'row-freezing',
  'demo-hiding-rows': 'row-hiding',
  'demo-hiding-columns': 'column-hiding',
  'demo-trimming-rows': 'row-trimming',
  'demo-bind-rows-headers': 'row-header',
  'demo-collapsing-columns': 'column-groups',
  'demo-nested-headers': 'column-groups',
  'demo-nested-rows': 'row-parent-child',
  'demo-dropdown-menu': 'column-menu',
  'demo-sorting': 'row-sorting',
  'demo-multicolumn-sorting': 'row-sorting',
  'demo-searching': 'searching-values',
  'demo-filtering': 'column-filter',
  'demo-summary-calculations': 'column-summary',
  'demo-data-validation': 'cell-validator',
  'demo-auto-fill': 'autofill-values',
  'demo-merged-cells': 'merge-cells',
  'demo-alignment': 'text-alignment',
  'demo-read-only': 'disabled-cells',
  'demo-disabled-editing': 'disabled-cells',
  'demo-custom-renderers': 'cell-renderer',
  'demo-numeric': 'numeric-cell-type',
  'demo-date': 'date-cell-type',
  'demo-time': 'time-cell-type',
  'demo-checkbox': 'checkbox-cell-type',
  'demo-select': 'select-cell-type',
  'demo-dropdown': 'dropdown-cell-type',
  'demo-autocomplete': 'autocomplete-cell-type',
  'demo-password': 'password-cell-type',
  'demo-handsontable': 'handsontable-cell-type',
  'demo-context-menu': 'context-menu',
  'demo-spreadsheet-icons': 'icon-pack',
  'demo-comments_': 'comments',
  'demo-copy-paste': 'basic-clipboard',
  'demo-export-file': 'export-to-csv',
  'demo-conditional-formatting': 'conditional-formatting',
  'demo-customizing-borders': 'formatting-cells',
  'demo-selecting-ranges': 'selection',
  'demo-formula-support': 'formula-calculation',
  'frameworks-wrapper-for-react-installation': 'react-installation',
  'frameworks-wrapper-for-react-simple-examples': 'react-simple-example',
  'frameworks-wrapper-for-react-hot-column': 'react-hot-column',
  'frameworks-wrapper-for-react-setting-up-a-locale': 'react-setting-up-a-locale',
  'frameworks-wrapper-for-react-custom-context-menu-example': 'react-custom-context-menu-example',
  'frameworks-wrapper-for-react-custom-editor-example': 'react-custom-editor-example',
  'frameworks-wrapper-for-react-custom-renderer-example': 'react-custom-renderer-example',
  'frameworks-wrapper-for-react-language-change-example': 'react-language-change-example',
  'frameworks-wrapper-for-react-redux-example': 'react-redux-example',
  'frameworks-wrapper-for-react-hot-reference': 'react-hot-reference',
  'frameworks-wrapper-for-vue-installation': 'vue3-installation',
  'frameworks-wrapper-for-vue-simple-example': 'vue3-simple-example',
  'frameworks-wrapper-for-vue-hot-column': 'vue3-hot-column',
  'frameworks-wrapper-for-vue-setting-up-a-locale': 'vue3-setting-up-a-language',
  'frameworks-wrapper-for-vue-custom-id-class-style': 'vue3-custom-id-class-style',
  'frameworks-wrapper-for-vue-custom-context-menu-example': 'vue3-custom-context-menu-example',
  'frameworks-wrapper-for-vue-custom-editor-example': 'vue3-custom-editor-example',
  'frameworks-wrapper-for-vue-custom-renderer-example': 'vue3-custom-renderer-example',
  'frameworks-wrapper-for-vue-language-change-example': 'vue3-language-change-example',
  'frameworks-wrapper-for-vue-vuex-example': 'vue3-vuex-example',
  'frameworks-wrapper-for-vue-hot-reference': 'vue3-hot-reference',
  'frameworks-wrapper-for-angular-installation': 'angular-installation',
  'frameworks-wrapper-for-angular-simple-example': 'angular-simple-example',
  'frameworks-wrapper-for-angular-custom-id': 'angular-custom-id',
  'frameworks-wrapper-for-angular-setting-up-a-locale': 'angular-setting-up-a-locale',
  'frameworks-wrapper-for-angular-custom-context-menu-example': 'angular-custom-context-menu-example',
  'frameworks-wrapper-for-angular-custom-editor-example': 'angular-custom-editor-example',
  'frameworks-wrapper-for-angular-custom-renderer-example': 'angular-custom-renderer-example',
  'frameworks-wrapper-for-angular-language-change-example': 'angular-language-change-example',
  'frameworks-wrapper-for-angular-hot-reference': 'angular-hot-reference',
  Core: 'api/core',
  Hooks: 'api/hooks',
  Options: 'api/options',
  AutoColumnSize: 'api/auto-column-size',
  AutoRowSize: 'api/auto-row-size',
  Autofill: 'api/autofill',
  BindRowsWithHeaders: 'api/bind-rows-with-headers',
  CollapsibleColumns: 'api/collapsible-columns',
  ColumnSorting: 'api/column-sorting',
  ColumnSummary: 'api/column-summary',
  Comments: 'api/comments',
  ContextMenu: 'api/context-menu',
  CopyPaste: 'api/copy-paste',
  CustomBorders: 'api/custom-borders',
  DragToScroll: 'api/drag-to-scroll',
  DropdownMenu: 'api/dropdown-menu',
  ExportFile: 'api/export-file',
  Filters: 'api/filters',
  Formulas: 'api/formulas',
  HiddenColumns: 'api/hidden-columns',
  HiddenRows: 'api/hidden-rows',
  ManualColumnFreeze: 'api/manual-column-freeze',
  ManualColumnMove: 'api/manual-column-move',
  ManualColumnResize: 'api/manual-column-resize',
  ManualRowMove: 'api/manual-row-move',
  ManualRowResize: 'api/manual-row-resize',
  MergeCells: 'api/merge-cells',
  MultiColumnSorting: 'api/multi-column-sorting',
  NestedHeaders: 'api/nested-headers',
  NestedRows: 'api/nested-rows',
  Search: 'api/search',
  TrimRows: 'api/trim-rows',
  UndoRedo: 'api/undo-redo',
};

// Additional overrides for versions >= 12.
const VERSIONED_HTML_MAP_12UP = {
  'frameworks-wrapper-for-react-installation': 'installation',
  'frameworks-wrapper-for-react-simple-examples': 'binding-to-data',
  'frameworks-wrapper-for-react-hot-column': 'hot-column',
  'frameworks-wrapper-for-react-setting-up-a-locale': 'locale',
  'frameworks-wrapper-for-react-custom-context-menu-example': 'context-menu',
  'frameworks-wrapper-for-react-custom-editor-example': 'cell-editor',
  'frameworks-wrapper-for-react-custom-renderer-example': 'cell-renderer',
  'frameworks-wrapper-for-react-language-change-example': 'language',
  'frameworks-wrapper-for-react-redux-example': 'redux',
  'frameworks-wrapper-for-react-hot-reference': 'instance-methods',
  'frameworks-wrapper-for-vue-installation': 'vue3-installation',
  'frameworks-wrapper-for-vue-simple-example': 'vue3-simple-example',
  'frameworks-wrapper-for-vue-hot-column': 'vue3-hot-column',
  'frameworks-wrapper-for-vue-setting-up-a-locale': 'vue3-setting-up-a-language',
  'frameworks-wrapper-for-vue-custom-id-class-style': 'vue3-custom-id-class-style',
  'frameworks-wrapper-for-vue-custom-context-menu-example': 'vue3-custom-context-menu-example',
  'frameworks-wrapper-for-vue-custom-editor-example': 'vue3-custom-editor-example',
  'frameworks-wrapper-for-vue-custom-renderer-example': 'vue3-custom-renderer-example',
  'frameworks-wrapper-for-vue-language-change-example': 'vue3-language-change-example',
  'frameworks-wrapper-for-vue-vuex-example': 'vue3-vuex-example',
  'frameworks-wrapper-for-vue-hot-reference': 'vue3-hot-reference',
  'frameworks-wrapper-for-angular-installation': 'angular-installation',
  'frameworks-wrapper-for-angular-simple-example': 'angular-basic-example',
  'frameworks-wrapper-for-angular-custom-id': 'angular-custom-id',
  'frameworks-wrapper-for-angular-setting-up-a-locale': 'angular-setting-up-a-translation',
  'frameworks-wrapper-for-angular-custom-context-menu-example': 'angular-custom-context-menu-example',
  'frameworks-wrapper-for-angular-custom-editor-example': 'angular-custom-editor-example',
  'frameworks-wrapper-for-angular-custom-renderer-example': 'angular-custom-renderer-example',
  'frameworks-wrapper-for-angular-language-change-example': 'angular-language-change-example',
  'frameworks-wrapper-for-angular-hot-reference': 'angular-hot-reference',
  'tutorial-setting-options': 'configuration-options',
  'tutorial-keyboard-navigation': 'keyboard-shortcuts',
  'tutorial-internationalization': 'language',
  'tutorial-custom-build': 'modules',
  'tutorial-custom-plugin': 'custom-plugins',
};

// ---------------------------------------------------------------------------
// Data: flat /docs/{page}.html map (no version prefix)
// ---------------------------------------------------------------------------

// This comes from redirect_cookie_docs_html.mts.
const FLAT_HTML_MAP = {
  'tutorial-introduction': '',
  'tutorial-compatibility': 'supported-browsers',
  'tutorial-licensing': 'software-license',
  'tutorial-license-key': 'license-key',
  'tutorial-quick-start': 'installation',
  'tutorial-data-binding': 'binding-to-data',
  'tutorial-data-sources': 'binding-to-data',
  'tutorial-load-and-save': 'saving-data',
  'tutorial-setting-options': 'configuration-options',
  'tutorial-grid-sizing': 'grid-size',
  'tutorial-using-callbacks': 'events-and-hooks',
  'tutorial-keyboard-navigation': 'keyboard-shortcuts',
  'tutorial-internationalization': 'language',
  'tutorial-modules': 'modules',
  'tutorial-custom-build': 'modules',
  'tutorial-custom-plugin': 'custom-plugins',
  'tutorial-cell-types': 'cell-type',
  'tutorial-cell-editor': 'cell-editor',
  'tutorial-cell-function': 'cell-function',
  'tutorial-suspend-rendering': 'batch-operations',
  'tutorial-testing': 'testing',
  'tutorial-performance-tips': 'performance',
  'tutorial-release-notes': 'release-notes',
  'tutorial-migration-guide': 'migration-from-7.4-to-8.0',
  'tutorial-known-limitations': '/third-party-licenses/',
  'demo-scrolling': 'row-virtualization',
  'demo-fixing': 'column-freezing',
  'demo-resizing': 'column-width',
  'demo-moving': 'column-moving',
  'demo-pre-populating': 'row-prepopulating',
  'demo-stretching': 'column-width',
  'demo-freezing': 'column-freezing',
  'demo-fixing-bottom': 'row-freezing',
  'demo-hiding-rows': 'row-hiding',
  'demo-hiding-columns': 'column-hiding',
  'demo-trimming-rows': 'row-trimming',
  'demo-bind-rows-headers': 'row-header',
  'demo-collapsing-columns': 'column-groups',
  'demo-nested-headers': 'column-groups',
  'demo-nested-rows': 'row-parent-child',
  'demo-dropdown-menu': 'column-menu',
  'demo-sorting': 'rows-sorting',
  'demo-multicolumn-sorting': 'rows-sorting',
  'demo-searching': 'searching-values',
  'demo-filtering': 'column-filter',
  'demo-summary-calculations': 'column-summary',
  'demo-data-validation': 'cell-validator',
  'demo-auto-fill': 'autofill-values',
  'demo-merged-cells': 'merge-cells',
  'demo-alignment': 'text-alignment',
  'demo-read-only': 'read-only-cells',
  'demo-disabled-editing': 'read-only-cells',
  'demo-custom-renderers': 'cell-renderer',
  'demo-numeric': 'numeric-cell-type',
  'demo-date': 'date-cell-type',
  'demo-time': 'time-cell-type',
  'demo-checkbox': 'checkbox-cell-type',
  'demo-select': 'select-cell-type',
  'demo-dropdown': 'dropdown-cell-type',
  'demo-autocomplete': 'autocomplete-cell-type',
  'demo-password': 'password-cell-type',
  'demo-handsontable': 'handsontable-cell-type',
  'demo-context-menu': 'context-menu',
  'demo-spreadsheet-icons': 'icon-pack',
  'demo-comments_': 'comments',
  'demo-copy-paste': 'basic-clipboard',
  'demo-export-file': 'export-to-csv',
  'demo-conditional-formatting': 'conditional-formatting',
  'demo-customizing-borders': 'formatting-cells',
  'demo-selecting-ranges': 'selection',
  'demo-formula-support': 'formula-calculation',
  'frameworks-wrapper-for-react-installation': 'installation',
  'frameworks-wrapper-for-react-simple-examples': 'binding-to-data',
  'frameworks-wrapper-for-react-hot-column': 'hot-column',
  'frameworks-wrapper-for-react-setting-up-a-locale': 'locale',
  'frameworks-wrapper-for-react-custom-context-menu-example': 'context-menu',
  'frameworks-wrapper-for-react-custom-editor-example': 'cell-editor',
  'frameworks-wrapper-for-react-custom-renderer-example': 'cell-renderer',
  'frameworks-wrapper-for-react-language-change-example': 'language',
  'frameworks-wrapper-for-react-redux-example': 'redux',
  'frameworks-wrapper-for-react-hot-reference': 'instance-methods',
  'frameworks-wrapper-for-vue-installation': 'vue3-installation',
  'frameworks-wrapper-for-vue-simple-example': 'vue3-simple-example',
  'frameworks-wrapper-for-vue-hot-column': 'vue3-hot-column',
  'frameworks-wrapper-for-vue-setting-up-a-locale': 'vue3-setting-up-a-language',
  'frameworks-wrapper-for-vue-custom-id-class-style': 'vue3-custom-id-class-style',
  'frameworks-wrapper-for-vue-custom-context-menu-example': 'vue3-custom-context-menu-example',
  'frameworks-wrapper-for-vue-custom-editor-example': 'vue3-custom-editor-example',
  'frameworks-wrapper-for-vue-custom-renderer-example': 'vue3-custom-renderer-example',
  'frameworks-wrapper-for-vue-language-change-example': 'vue3-language-change-example',
  'frameworks-wrapper-for-vue-vuex-example': 'vue3-vuex-example',
  'frameworks-wrapper-for-vue-hot-reference': 'vue3-hot-reference',
  'frameworks-wrapper-for-angular-installation': 'angular-installation',
  'frameworks-wrapper-for-angular-simple-example': 'angular-basic-example',
  'frameworks-wrapper-for-angular-custom-id': 'angular-custom-id',
  'frameworks-wrapper-for-angular-setting-up-a-locale': 'angular-setting-up-a-translation',
  'frameworks-wrapper-for-angular-custom-context-menu-example': 'angular-custom-context-menu-example',
  'frameworks-wrapper-for-angular-custom-editor-example': 'angular-custom-editor-example',
  'frameworks-wrapper-for-angular-custom-renderer-example': 'angular-custom-renderer-example',
  'frameworks-wrapper-for-angular-language-change-example': 'angular-language-change-example',
  'frameworks-wrapper-for-angular-hot-reference': 'angular-hot-reference',
  Core: 'api/core',
  Hooks: 'api/hooks',
  Options: 'api/options',
  AutoColumnSize: 'api/auto-column-size',
  AutoRowSize: 'api/auto-row-size',
  Autofill: 'api/autofill',
  BindRowsWithHeaders: 'api/bind-rows-with-headers',
  CollapsibleColumns: 'api/collapsible-columns',
  ColumnSorting: 'api/column-sorting',
  ColumnSummary: 'api/column-summary',
  Comments: 'api/comments',
  ContextMenu: 'api/context-menu',
  CopyPaste: 'api/copy-paste',
  CustomBorders: 'api/custom-borders',
  DragToScroll: 'api/drag-to-scroll',
  DropdownMenu: 'api/dropdown-menu',
  ExportFile: 'api/export-file',
  Filters: 'api/filters',
  Formulas: 'api/formulas',
  HiddenColumns: 'api/hidden-columns',
  HiddenRows: 'api/hidden-rows',
  ManualColumnFreeze: 'api/manual-column-freeze',
  ManualColumnMove: 'api/manual-column-move',
  ManualColumnResize: 'api/manual-column-resize',
  ManualRowMove: 'api/manual-row-move',
  ManualRowResize: 'api/manual-row-resize',
  MergeCells: 'api/merge-cells',
  MultiColumnSorting: 'api/multi-column-sorting',
  NestedHeaders: 'api/nested-headers',
  NestedRows: 'api/nested-rows',
  Search: 'api/search',
  TrimRows: 'api/trim-rows',
  UndoRedo: 'api/undo-redo',
  latest: '/',
  'hello-world': '/demo/',
  building: '/custom-builds/',
  plugins: '/custom-plugins/',
  examples: '/',
  'setting-options': '/configuration-options/',
  'row-sorting': '/rows-sorting/',
  'column-sorting': '/rows-sorting/',
};

// ---------------------------------------------------------------------------
// Data: flat /docs/{page}[/] redirect map (from redirect_cookie_docs_pages.mts)
// ---------------------------------------------------------------------------

// Slugs that have a special remapping (not a passthrough).
const FLAT_PAGES_REMAP = {
  'row-sorting': '/rows-sorting/',
  'column-sorting': '/rows-sorting/',
  'release-notes': '/changelog/',
  examples: '/',
  'hello-world': '/demo/',
  'setting-options': '/configuration-options/',
  'i18n/missing-language-code': '/language/#loading-the-prepared-language-files',
  'angular-simple-example': '/angular-basic-example/',
  'angular-setting-up-a-language': '/angular-setting-up-a-translation/',
  'vue-simple-example': '/vue-basic-example/',
  'vue-setting-up-a-language': '/vue-setting-up-a-translation/',
  'vue3-simple-example': '/vue3-basic-example/',
  'vue3-setting-up-a-language': '/vue3-setting-up-a-translation/',
  latest: '/',
  'internationalization-i18n': '/language/',
  'keyboard-navigation': '/keyboard-shortcuts/',
  'disabled-cells': '/read-only-cells/',
  building: '/custom-builds/',
  plugins: '/custom-plugins/',
  'file-structure': '/folder-structure/',
};

// Sitemap-derived slugs that pass through as-is (slug → same slug under framework).
const SITEMAP_PASSTHROUGH_SLUGS = new Set([
  'api/auto-row-size',
  'api/base-editor',
  'api/autofill',
  'api/auto-column-size',
  'api/bind-rows-with-headers',
  'api/cell-coords',
  'api/cell-range',
  'api/changes-observer',
  'api/column-sorting',
  'api/base-plugin',
  'api/collapsible-columns',
  'api/context-menu',
  'api/custom-borders',
  'api/data-map',
  'api/comments',
  'api/dropdown-menu',
  'api/column-summary',
  'api/core',
  'api/create-shortcut-manager',
  'api/filters',
  'api/copy-paste',
  'api/export-file',
  'api/ghost-table',
  'api/formulas',
  'api/hiding-map',
  'api/event-manager',
  'api/hooks',
  'api/index-map',
  'api/hidden-rows',
  'api/index-mapper',
  'api/indexes-sequence',
  'api/drag-to-scroll',
  'api/manual-column-freeze',
  'api',
  'api/hidden-columns',
  'api/manual-column-move',
  'api/manual-row-resize',
  'api/merge-cells',
  'api/linked-physical-index-to-value-map',
  'api/manual-row-move',
  'api/nested-headers',
  'api/multi-column-sorting',
  'api/pagination',
  'api/manual-column-resize',
  'api/plugins',
  'api/samples-generator',
  'api/physical-index-to-value-map',
  'api/stretch-columns',
  'api/options',
  'api/nested-rows',
  'api/trimming-map',
  'api/search',
  'api/shortcut-context',
  'api/trim-rows',
  'export-to-csv',
  'accessibility',
  'icon-pack',
  'api/shortcut-manager',
  'context-menu',
  'autofill-values',
  'undo-redo',
  'conditional-formatting',
  'comments',
  'formatting-cells',
  'merge-cells',
  'selection',
  'read-only-cells',
  'text-alignment',
  'cell-function',
  'basic-clipboard',
  'cell-validator',
  'cell-renderer',
  'autocomplete-cell-type',
  'cell-editor',
  'cell-type',
  'checkbox-cell-type',
  'date-cell-type',
  'numeric-cell-type',
  'dropdown-cell-type',
  'api/undo-redo',
  'select-cell-type',
  'time-cell-type',
  'password-cell-type',
  'column-freezing',
  'column-filter',
  'handsontable-cell-type',
  'column-groups',
  'column-hiding',
  'column-header',
  'column-moving',
  'column-menu',
  'column-virtualization',
  'column-summary',
  'column-width',
  'demo',
  'formula-calculation',
  'binding-to-data',
  'installation',
  'configuration-options',
  'grid-size',
  'events-and-hooks',
  'saving-data',
  'license-key',
  '',
  'vue3-custom-editor-example',
  'vue3-hot-column',
  'vue3-custom-renderer-example',
  'vue3-custom-id-class-style',
  'vue3-hot-reference',
  'vue3-installation',
  'vue3-modules',
  'vue3-language-change-example',
  'vue3-basic-example',
  'vue3-setting-up-a-translation',
  'vue3-vuex-example',
  'ime-support',
  'layout-direction',
  'locale',
  'searching-values',
  'custom-shortcuts',
  'batch-operations',
  'performance',
  'bundle-size',
  'row-height',
  'language',
  'keyboard-shortcuts',
  'row-header',
  'row-moving',
  'row-hiding',
  'row-freezing',
  'row-parent-child',
  'row-prepopulating',
  'row-virtualization',
  'handsontable-design-system',
  'row-trimming',
  'rows-sorting',
  'security',
  'documentation-license',
  'software-license',
  'supported-browsers',
  'third-party-licenses',
  'theme-customization',
  'modules',
  'testing',
  'custom-builds',
  'themes',
  'changelog',
  'migration-from-10.0-to-11.0',
  'migration-from-13.1-to-14.0',
  'vue3-custom-context-menu-example',
  'custom-plugins',
  'migration-from-14.6-to-15.0',
  'migration-from-9.0-to-10.0',
  'versioning-policy',
  'migration-from-8.4-to-9.0',
  'migration-from-11.1-to-12.0',
  'migration-from-15.3-to-16.0',
  'migration-from-12.4-to-13.0',
  'migration-from-7.4-to-8.0',
]);

// ---------------------------------------------------------------------------
// Legacy angular-docs version sets
// Versions 12.1+ had a real Angular wrapper and redirect to /docs/angular-data-grid/.
// Versions ≤12.0 pre-date the Angular wrapper and redirect to /docs/javascript-data-grid/.
// ---------------------------------------------------------------------------

// 12.1 and above → /docs/angular-data-grid/
const LEGACY_ANGULAR_TO_ANGULAR_SET = new Set([
  '15.3', '15.2', '15.1', '15.0',
  '14.6', '14.5', '14.4', '14.3', '14.2', '14.1', '14.0',
  '13.1', '13.0',
  '12.4', '12.3', '12.2', '12.1',
]);

// 12.0 and below → /docs/javascript-data-grid/
const LEGACY_ANGULAR_TO_JS_SET = new Set([
  '12.0', '11.1', '11.0', '10.0', '9.0',
]);

// ---------------------------------------------------------------------------
// Versioned /docs/:ver/react-* → /docs/:ver/react-data-grid/*
// ---------------------------------------------------------------------------

const VERSIONED_REACT_PAGES = {
  'react-installation': 'installation',
  'react-simple-example': 'binding-to-data',
  'react-simple-examples': 'binding-to-data',
  'react-modules': 'modules',
  'react-hot-column': 'hot-column',
  'react-setting-up-a-language': 'language',
  'react-setting-up-a-locale': 'language',
  'react-custom-context-menu-example': 'context-menu',
  'react-custom-editor-example': 'cell-editor',
  'react-custom-renderer-example': 'cell-renderer',
  'react-language-change-example': 'language',
  'react-redux-example': 'redux',
  'react-hot-reference': 'instance-methods',
};

// Flat /docs/react-* → /docs/react-data-grid/* (no version prefix).
const FLAT_REACT_PAGES = {
  'react-installation': '/docs/react-data-grid/installation/',
  'react-simple-example': '/docs/react-data-grid/binding-to-data/',
  'react-simple-examples': '/docs/react-data-grid/binding-to-data/',
  'react-modules': '/docs/react-data-grid/modules/',
  'react-hot-column': '/docs/react-data-grid/hot-column/',
  'react-setting-up-a-language': '/docs/react-data-grid/language/',
  'react-setting-up-a-locale': '/docs/react-data-grid/language/',
  'react-custom-context-menu-example': '/docs/react-data-grid/context-menu/',
  'react-custom-editor-example': '/docs/react-data-grid/cell-editor/',
  'react-custom-renderer-example': '/docs/react-data-grid/cell-renderer/',
  'react-language-change-example': '/docs/react-data-grid/language/',
  'react-redux-example': '/docs/react-data-grid/redux/',
  'react-hot-reference': '/docs/react-data-grid/instance-methods/',
};

// Old integrate-with-vue3 slugs redirect to the current Vue data grid pages.
// Used as-is by the versioned rule below (7b): frozen historical doc versions
// never got the 'custom-id-class-style' unification from rule 6, so
// 'vue3-custom-id-class-style' still belongs here for that case. Rule 7a
// (unversioned, framework-prefixed) never reaches this entry for that one
// page - the crossFramework map (rule 6) matches it first, since that page's
// *current* docs were unified into an all-framework 'custom-id-class-style'
// page.
const VUE3_LEGACY_PAGES = {
  'vue3-installation': '/docs/vue-data-grid/installation/',
  'vue3-basic-example': '/docs/vue-data-grid/installation/',
  'vue3-modules': '/docs/vue-data-grid/modules/',
  'vue3-hot-column': '/docs/vue-data-grid/vue-hot-column/',
  'vue3-hot-reference': '/docs/vue-data-grid/vue-instance-reference/',
  'vue3-custom-renderer-example': '/docs/vue-data-grid/cell-renderer/',
  'vue3-custom-editor-example': '/docs/vue-data-grid/cell-editor/',
  'vue3-custom-context-menu-example': '/docs/vue-data-grid/context-menu/',
  'vue3-custom-id-class-style': '/docs/vue-data-grid/vue-custom-id-class-style/',
  'vue3-formulas-example': '/docs/vue-data-grid/formula-calculation/',
  'vue3-language-change-example': '/docs/vue-data-grid/language/',
  'vue3-setting-up-a-translation': '/docs/vue-data-grid/language/',
  'vue3-vuex-example': '/docs/vue-data-grid/vue-vuex/',
};

// ---------------------------------------------------------------------------
// Main worker
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
//  Security headers
// ---------------------------------------------------------------------------
// This docs site owns its own Content-Security-Policy so the policy reaches the
// browser directly from Cloudflare Pages. The handsontable.com marketing Worker
// reverse-proxies /docs and must NOT overwrite this CSP.
//
// It is the proven handsontable.com baseline policy plus the docs-only hosts
// the marketing policy lacks: Algolia DocSearch (https://*.algolia.net and
// https://*.algolianet.com). The baseline already covers the docs AI assistant
// (hot-docs-assistant.netlify.app), CodeSandbox embeds, GTM/GA/Hotjar/Sentry/
// Cookiebot, api.github.com, and *.handsontable.com (which covers
// status.handsontable.com and the version-switcher data on handsontable.com).
//
// The docs-assistant backend is migrating from Netlify to a Cloudflare Worker
// (SU-633). The dev Worker host is added to connect-src alongside the Netlify
// host so the dev soak can reach it; the Netlify host stays because production
// still uses it until its own separate cutover.
//
// Set here rather than in a Pages `_headers` file because the policy exceeds the
// 2000-character-per-line `_headers` limit and a CSP cannot be split across
// multiple Content-Security-Policy lines.
const CONTENT_SECURITY_POLICY = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://google.com https://js-eu1.hsforms.net https://static.reo.dev/ https://static.hsappstatic.net https://js-eu1.hs-analytics.net https://js-eu1.hsadspixel.net https://js-eu1.hscollectedforms.net https://js-eu1.hs-banner.com https://js-eu1.hs-scripts.com https://www.redditstatic.com https://bat.bing.com https://bat.bing.net https://dev.visualwebsiteoptimizer.com https://analytics.ahrefs.com https://*.cloudflareinsights.com https://sbl.onfastspring.com https://plausible.io https://*.typeform.com https://*.zendesk.com https://*.zdassets.com https://*.hotjar.com https://snap.licdn.com https://static.ads-twitter.com https://analytics.twitter.com https://consentcdn.cookiebot.com https://consent.cookiebot.com https://handsontable.piwik.pro https://handsontable.containers.piwik.pro https://*.list-manage.com https://s3.amazonaws.com https://unpkg.com https://cdn.jsdelivr.net https://buttons.github.io https://code.jquery.com https://cdn.headwayapp.co https://www.google.com https://www.gstatic.com https://www.googleadservices.com https://www.googletagmanager.com https://*.google-analytics.com https://tagmanager.google.com https://script.crazyegg.com https://*.cloudfront.net https://*.cloudflare.com https://*.s3.amazonaws.com https://*.doubleclick.net https://connect.facebook.net https://*.sentry-cdn.com; img-src * 'self' data: https:; style-src 'self' 'unsafe-inline' https://sbl.onfastspring.com https://plausible.io https://*.typeform.com https://*.zendesk.com https://*.zdassets.com https://www.googletagmanager.com https://*.hotjar.com https://*.cloudflare.com https://fonts.googleapis.com https://tagmanager.google.com https://cdn.jsdelivr.net; font-src 'self' data: https://*.zendesk.com https://*.zdassets.com https://*.hotjar.com https://fonts.gstatic.com; frame-src 'self' 'unsafe-inline' https://google.com https://js-eu1.hsforms.net https://handsontablestore.onfastspring.com https://handsontablestore.test.onfastspring.com https://*.doubleclick.net https://plausible.io https://*.typeform.com https://*.zendesk.com https://*.zdassets.com https://examples.handsontable.com https://demos.handsontable.com https://handsontable.github.io https://*.hotjar.com https://consentcdn.cookiebot.com https://www.google.com https://headway-widget.net https://www.youtube.com https://player.vimeo.com https://codesandbox.io https://www.youtube-nocookie.com https://www.facebook.com https://www.googletagmanager.com/ https://embed.figma.com; object-src 'self'; connect-src 'self' https://hot-docs-assistant.netlify.app https://hot-docs-assistant-dev.handsontable-sandbox.workers.dev https://hot-docs-assistant.handsontable-sandbox.workers.dev https://*.algolia.net https://*.algolianet.com https://browser.sentry-cdn.com https://api.reo.dev https://api-eu1.hubapi.com https://static.hsappstatic.net https://forms-eu1.hscollectedforms.net https://ads.reddit.com https://www.redditstatic.com https://pixel-config.reddit.com https://www.googleadservices.com https://bat.bing.net https://bat.bing.com https://dev.visualwebsiteoptimizer.com https://api.github.com https://analytics.ahrefs.com https://ingesteer.services-prod.nsvcs.net https://plausible.io https://*.linkedin.com https://*.zendesk.com https://adservice.google.com https://*.zdassets.com https://*.hotjar.com https://*.hotjar.io wss://*.hotjar.com https://consentcdn.cookiebot.com https://cdn.linkedin.oribi.io https://www.google.com https://google.com https://stats.g.doubleclick.net https://googleads.g.doubleclick.net https://*.doubleclick.net https://www.google.pl https://*.google-analytics.com https://*.analytics.google.com https://*.googlesyndication.com https://*.handsontable.com https://www.googletagmanager.com https://handsontable.com https://handsontablestore.test.onfastspring.com https://handsontablestore.onfastspring.com https://snap.licdn.com https://www.facebook.com https://*.sentry.io https://jsonplaceholder.typicode.com https://graphqlzero.almansi.me; worker-src 'self' blob:; frame-ancestors 'self';";

const SECURITY_HEADERS = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

// Apply the security headers to served documents/assets.
//
// A redirect carries no body, so the document-scoped headers (CSP, framing,
// sniffing, referrer) have nothing to act on and are skipped. HSTS is the one
// exception, because it is a promise about the HOST rather than about this
// response: since rule 12a every GET/HEAD on a legacy host is a redirect, so
// leaving redirects bare would stop that host from refreshing its own pin and
// let a year-long promise age out with no renewal. The apex does send
// `includeSubDomains`, which covers the subdomain, but relying on it would
// make the legacy host's transport security depend on apex configuration.
function withSecurityHeaders(response) {
  const decorated = new Response(response.body, response);
  const isRedirect = response.status >= 300 && response.status < 400;

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!isRedirect || name === 'Strict-Transport-Security') {
      decorated.headers.set(name, value);
    }
  }

  return decorated;
}

// ---------------------------------------------------------------------------
// Design System last-update date (rule 18c)
// ---------------------------------------------------------------------------

const FIGMA_API_ORIGIN = 'https://api.figma.com';
const DESIGN_SYSTEM_DATE_PATH = '/docs/api/design-system-updated.json';

// Returned by `readJson()` instead of throwing, so a body that is not JSON is
// reported as itself rather than as the route's catch-all "unreachable".
const BAD_JSON = Symbol('bad-json');

// Figma's maximum. The default is 30, and version history is mostly unnamed
// autosaves - one per 30 minutes of editing - so a long gap between publishes
// can bury the newest named version below the first page.
const FIGMA_VERSIONS_PAGE_SIZE = 50;

// Up to 200 versions. Enough to cross a long autosave run, bounded so a file
// that genuinely has no named version cannot walk its whole history on every
// cache miss.
const FIGMA_VERSIONS_MAX_PAGES = 4;

/**
 * Returns a pagination cursor only when it points at Figma itself.
 *
 * The cursor comes from a response body, so it is data from elsewhere, and the
 * worker holds a credential. Matching the parsed origin rather than a string
 * prefix is what makes `https://api.figma.com.example.com/` fail this check.
 *
 * @param {unknown} candidate
 * @returns {string|null}
 */
function figmaCursor(candidate) {
  if (typeof candidate !== 'string') {
    return null;
  }

  try {
    return new URL(candidate).origin === FIGMA_API_ORIGIN ? candidate : null;
  } catch {
    return null;
  }
}

/**
 * Parses a response body as JSON, or returns `BAD_JSON`.
 *
 * A 2xx carrying HTML - a proxy error page, a maintenance notice, a
 * challenge - is a reachable Figma answering with something unusable, and
 * saying "unreachable" sends an operator to check connectivity that is fine.
 *
 * @param {Response} response
 * @returns {Promise<object|symbol>}
 */
async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return BAD_JSON;
  }
}

// One day. The design system changes a few times a year at most, so a longer
// window would be defensible - a day just keeps the page from ever looking
// stale by more than one, at a cost of one Figma call per edge location.
const DESIGN_SYSTEM_DATE_MAX_AGE = 86400;

// An unsettled answer - a failure, or a date from a history the walk could not
// finish - is held for minutes, not a day. Whatever caused it (an unset secret,
// an expired token, a rate limit, an outage) the fix must not take 24 hours to
// show: on staging the `null` cached before the secrets were set outlived them,
// so the endpoint answered the real date to a cache-busted request while the
// page still read a stale `null`.
//
// These ARE written to the edge cache, at this TTL. Skipping the write instead
// would mean every request during a Figma outage re-runs the whole read - an
// OAuth refresh plus the history walk - and under a 429 that pattern feeds
// itself.
const DESIGN_SYSTEM_DATE_ERROR_MAX_AGE = 300;

// Bump to orphan every previously cached entry.
//
// The Cache API survives deployments, and `*.pages.dev` cannot be purged from
// the dashboard or the API - zone purge needs a zone you own, and this
// hostname is Cloudflare's. `cache.delete()` only clears the one data center
// that ran it. So a version in the cache key is the only lever that drops a
// bad entry everywhere without waiting out its TTL.
//
// 3: staging moved from a personal access token to the OAuth credentials, and
// the cached date would otherwise have kept answering from the old read, which
// would have looked identical whether or not the refresh worked.
// 4: `reason` added to failure responses - the cached ones predate the field.
// 5: the versions walk can now find a named version where the single-page read
//    saw only autosaves, so an entry cached before it holds a last-touched date
//    where this build would return a published one.
// 6: failures and provisional dates are now cached at the short TTL rather than
//    skipped, so entries written under the old rule carry the wrong lifetime.
//
// Bump it whenever the date is *selected* differently, not only when the
// response shape changes: a cached body outlives the deploy that would have
// replaced it.
const DESIGN_SYSTEM_CACHE_VERSION = 6;

/**
 * Wraps a `{ date, source }` pair in the endpoint's only response shape.
 *
 * Every failure path returns this too, with `date: null`, so the page has one
 * shape to read and never has to branch on a status code. See
 * `readDesignSystemDate()` for why failures are not surfaced as errors.
 *
 * A failure also carries `reason`, naming the step that failed - the page
 * ignores it, but without it a hidden field is indistinguishable from a
 * missing secret, a revoked token and a Figma outage, none of which leave a
 * trace anywhere else. It names a step and an HTTP status only, never a
 * credential or any part of one.
 *
 * @param {{date: string|null, source: string|null, reason?: string|null}} body
 * @param {boolean} settled Whether the answer is a date read from a history
 *   the walk finished. Anything else is held for minutes, not a day.
 * @returns {Response}
 */
function designSystemDateResponse(body, settled) {
  const maxAge = settled ? DESIGN_SYSTEM_DATE_MAX_AGE : DESIGN_SYSTEM_DATE_ERROR_MAX_AGE;

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${maxAge}`,
    },
  });
}

/**
 * Resolves the authorization header for the Figma calls, preferring OAuth.
 *
 * Figma caps a personal access token at **90 days**, and a plan access token
 * (1 year) needs an Organization or Enterprise plan, which this account is not
 * on. Either would make the date silently disappear on a timer. An OAuth
 * refresh token has no such cap and can be exchanged for a fresh access token
 * as often as needed, so it is the only credential here that keeps working
 * without someone diarizing a rotation.
 *
 * The personal-token path is kept because it is one secret instead of three,
 * which makes it the quick way to prove the endpoint works before setting the
 * OAuth app up. It is a stopgap, not the intended production credential.
 *
 * Costs one extra request per cache miss - about one a day per edge location -
 * which is cheaper than storing the access token and tracking its expiry.
 *
 * @param {object} env The worker environment.
 * @param {Function} fetchImpl
 * @returns {Promise<{headers: object|null, reason: string|null}>} Headers to
 *   send, or a reason naming the step that failed.
 */
async function figmaAuthHeaders(env, fetchImpl) {
  const clientId = env.FIGMA_CLIENT_ID;
  const clientSecret = env.FIGMA_CLIENT_SECRET;
  const refreshToken = env.FIGMA_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    const response = await fetchImpl(`${FIGMA_API_ORIGIN}/v1/oauth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Figma authenticates the refresh with HTTP Basic, not body params.
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: `refresh_token=${encodeURIComponent(refreshToken)}`,
    });

    if (!response.ok) {
      // A revoked or mistyped refresh token, or a client id/secret that do not
      // match it. The status is the only detail worth surfacing - the body can
      // quote the credential back.
      return { headers: null, reason: `oauth-refresh-http-${response.status}` };
    }

    const payload = await readJson(response);

    if (payload === BAD_JSON) {
      return { headers: null, reason: 'oauth-refresh-bad-json' };
    }

    // The refresh response carries no new refresh token - the same one is
    // reused - so there is nothing to persist here.
    return payload?.access_token
      ? { headers: { Authorization: `Bearer ${payload.access_token}` }, reason: null }
      : { headers: null, reason: 'oauth-refresh-no-access-token' };
  }

  if (env.FIGMA_TOKEN) {
    return { headers: { 'X-Figma-Token': env.FIGMA_TOKEN }, reason: null };
  }

  // Name which half is missing: a half-configured OAuth setup and no
  // credentials at all look identical from outside otherwise.
  const partialOAuth = Boolean(clientId || clientSecret || refreshToken);

  return { headers: null, reason: partialOAuth ? 'oauth-incomplete' : 'no-credentials' };
}

/**
 * Reads the date the Design System Figma file was last updated.
 *
 * Prefers the newest *named* version over the file's raw last-touched time.
 * Figma's version history interleaves autosave checkpoints (`label: null`)
 * with versions a designer deliberately named, and `last_touched_at` moves on
 * any edit at all - so both would report "updated today" because someone
 * nudged a frame.
 *
 * For this file the named versions are not just "some milestone": the design
 * team labels one `Published to Community hub` on every publish. That matters
 * because the Community listing the docs link to has **no** REST API of its
 * own - searching Figma's whole OpenAPI spec for "community" returns only
 * payment endpoints - so its publish date is otherwise unreadable. The team's
 * labelling convention is what makes it readable at all.
 *
 * Measured 2026-09-16, and the gap is not academic: the newest named version
 * was 2026-08-20 while `last_touched_at` was 2026-09-11. Reporting the latter
 * would have claimed an update three weeks newer than anything a reader could
 * actually download.
 *
 * The match is deliberately on "has a label", not on the label text - a
 * reworded convention should degrade to the next named version, not to a
 * wrong date.
 *
 * The response is ordered newest-first in practice, but the API does not
 * promise it, so the newest labelled entry is picked by date rather than by
 * position.
 *
 * Returns `date: null` rather than throwing on every failure - an unset token,
 * a revoked token, a rate limit, or Figma being down must never do anything
 * more visible than hide one line on one page.
 *
 * @param {object} env The worker environment.
 * @returns {Promise<{date: string|null, source: string|null, reason?: string|null}>}
 */
async function readDesignSystemDate(env) {
  const fileKey = env.FIGMA_FILE_KEY;

  if (!fileKey) {
    return { date: null, source: null, reason: 'no-file-key' };
  }

  // Injectable so the tests can exercise every branch without a network call
  // or a global stub; production passes nothing and gets the runtime's fetch.
  const fetchImpl = env.FIGMA_FETCH ?? globalThis.fetch;
  const auth = await figmaAuthHeaders(env, fetchImpl);

  if (auth.headers === null) {
    return { date: null, source: null, reason: auth.reason };
  }

  const headers = auth.headers;
  const file = encodeURIComponent(fileKey);

  // Walk the version history newest-first until a named version turns up.
  // One page is not the history: Figma paginates it, and the pages between two
  // publishes are all autosaves, so reading only the first page reports "no
  // named version" for any file with a busy stretch since its last publish.
  let nextUrl = `${FIGMA_API_ORIGIN}/v1/files/${file}/versions?page_size=${FIGMA_VERSIONS_PAGE_SIZE}`;
  let newestNamed = null;
  let pagesRead = 0;
  // Set when the walk stopped on an error rather than on an answer. The
  // metadata fallback below is then a guess about a history we did not finish
  // reading, so its date must not be treated as settled.
  let walkBroke = false;

  while (nextUrl && pagesRead < FIGMA_VERSIONS_MAX_PAGES) {
    const versionsResponse = await fetchImpl(nextUrl, { headers });

    if (!versionsResponse.ok) {
      // A rejected FIRST page must NOT fall through to the metadata endpoint.
      // The two carry different scopes, so a credential granted only
      // `file_metadata:read` would answer 403 here, 200 there, and the page
      // would quietly show the last-touched date under the "last published"
      // wording - the substitution this function exists to avoid, with no
      // trace that the versions call was ever refused. A later page failing
      // is different: the history read simply stops where it got to.
      if (pagesRead === 0) {
        return { date: null, source: null, reason: `figma-http-${versionsResponse.status}` };
      }

      walkBroke = true;
      break;
    }

    const payload = await readJson(versionsResponse);

    if (payload === BAD_JSON) {
      if (pagesRead === 0) {
        return { date: null, source: null, reason: 'figma-bad-json' };
      }

      walkBroke = true;
      break;
    }

    pagesRead += 1;
    newestNamed = (payload?.versions ?? [])
      // `Number.isFinite` is not decoration: an entry with a missing or
      // malformed `created_at` makes the comparator return NaN, which leaves
      // the whole sort order unspecified - one bad entry from Figma is enough
      // to publish the oldest named version as the newest.
      .filter(version => typeof version?.label === 'string'
        && version.label !== ''
        && Number.isFinite(Date.parse(version.created_at)))
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];

    // Pages run newest-first, so the first page holding a named version holds
    // the newest one. Nothing older can beat it.
    if (newestNamed) {
      break;
    }

    // Follow Figma's own cursor rather than building one: the `before`/`after`
    // parameters leave which direction is "older" to interpretation, and this
    // URL does not. Only ever follow it back to Figma - and compare the parsed
    // origin, because a prefix test also accepts `api.figma.com.example.com`.
    nextUrl = figmaCursor(payload?.pagination?.next_page);
  }

  if (newestNamed) {
    return { date: newestNamed.created_at, source: 'named-version' };
  }

  // The versions call succeeded and simply held no named version - the one
  // case the metadata fallback is for.
  const metaResponse = await fetchImpl(`${FIGMA_API_ORIGIN}/v1/files/${file}/meta`, { headers });

  if (!metaResponse.ok) {
    return { date: null, source: null, reason: `figma-http-${metaResponse.status}` };
  }

  const meta = await readJson(metaResponse);

  if (meta === BAD_JSON) {
    return { date: null, source: null, reason: 'figma-bad-json' };
  }

  if (meta?.file?.last_touched_at) {
    // `provisional` when the walk broke: the history was not read to the end,
    // so "no named version" is unproven and this date may be standing in for a
    // publish we simply did not reach. The caller keeps it out of the day-long
    // cache, which would otherwise pin the wrong one of the two dates - three
    // weeks apart on the real file - for 24 hours after a single 429.
    return { date: meta.file.last_touched_at, source: 'last-touched', provisional: walkBroke };
  }

  // Both calls answered, neither carried a date.
  return { date: null, source: null, reason: 'figma-no-date' };
}

async function route(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // -- 1. /docs/next/:splat → /docs/:splat ----------------------------------
    if (path.startsWith('/docs/next/') || path === '/docs/next') {
      const splat = path.slice('/docs/next'.length) || '/';
      const dest = `/docs${splat}${url.search}`;

      return redirect301(abs(dest, url));
    }

    // -- 1a. /docs/sitemap.xml → /docs/sitemap-index.xml ---------------------
    // Redirect the legacy single-file sitemap URL to Astro's sitemap index.
    if (path === '/docs/sitemap.xml') {
      return redirect301(abs('/docs/sitemap-index.xml', url));
    }

    // -- 1b. /docs/{LATEST_VERSION}/:splat → /docs/:splat ---------------------
    // The latest version's docs are also served at the unversioned `/docs/...`
    // root, so the versioned URLs are duplicates. Redirect them to the
    // canonical unversioned path. The `\d+\.\d+` guard makes this a no-op
    // when the deploy-time placeholder was not substituted.
    if (/^\d+\.\d+$/.test(LATEST_VERSION) &&
        (path === `/docs/${LATEST_VERSION}` || path.startsWith(`/docs/${LATEST_VERSION}/`))) {
      const splat = path.slice(`/docs/${LATEST_VERSION}`.length) || '/';
      const dest = `/docs${splat}${url.search}`;

      return redirect301(abs(dest, url));
    }

    // -- 2. Root / → /docs ---------------------------------------------------
    if (path === '/' || path === '') {
      return redirect301(abs('/docs', url));
    }

    // -- 2a. /0.8.0/* → changelog (legacy version pages) --------------------
    if (path === '/0.8.0' || path.startsWith('/0.8.0/')) {
      return redirect301(abs('/docs/javascript-data-grid/changelog', url));
    }

    // -- 2b. /docs/redirect?pageId=* and /docs/:ver/redirect?pageId=* --------
    // Destination changed from /docs/:version to /docs/javascript-data-grid/changelog.
    if (url.searchParams.has('pageId')) {
      if (path === '/docs/redirect' || /^\/docs\/\d+\.\d+\/redirect$/.test(path)) {
        return redirect301(abs('/docs/javascript-data-grid/changelog', url));
      }
    }

    // -- 2c. Blog redirects --------------------------------------------------
    // Specific articles must be checked before the wildcard fallback.
    {
      const blogExact = {
        '/blog/articles/4-ways-to-handle-read-only-cells': '/blog/4-ways-to-handle-read-only-cells',
        '/blog/articles/2019/09/introducing-ckeditor-4-spreadsheets': '/blog/introducing-ckeditor-4-spreadsheets',
        '/blog/articles/2016/2/what-to-expect-when-switching-from-open-source-to-commercial': '/blog/what-to-expect-when-switching-from-open-source-to-commercial',
        '/blog/handsontable-14.4.0-enhanced-navigation-and-bug-fixes': '/blog',
      };

      if (Object.prototype.hasOwnProperty.call(blogExact, path)) {
        return redirect301(abs(blogExact[path], url));
      }
    }

    if (path.startsWith('/blog/articles/')) {
      return redirect301(abs('/blog', url));
    }

    // -- 2d. /demo/* → /demo (removed demo pages) ----------------------------
    if (path.startsWith('/demo/')) {
      return redirect301(abs('/demo', url));
    }

    // -- 2e. /customers/* → /customers/ (deprecated customer pages) ----------
    if (path.startsWith('/customers/') && path !== '/customers/') {
      return redirect301(abs('/customers/', url));
    }

    // -- 3. Legacy versioned angular-data-grid redirects ---------------------
    // Pattern: /docs/{version}/angular-data-grid[/*]
    {
      const m = path.match(/^\/docs\/(\d+\.\d+)\/angular-data-grid(\/.*)?$/);

      if (m) {
        const version = m[1];

        if (LEGACY_ANGULAR_TO_ANGULAR_SET.has(version)) {
          return redirect301(abs('/docs/angular-data-grid/', url));
        }

        if (LEGACY_ANGULAR_TO_JS_SET.has(version)) {
          return redirect301(abs('/docs/javascript-data-grid/', url));
        }
      }
    }

    // -- 4. /docs/hyperformula[/*] → external --------------------------------
    if (path === '/docs/hyperformula' || path.startsWith('/docs/hyperformula/')) {
      const splat = path.slice('/docs/hyperformula'.length);
      const dest = splat ? `https://hyperformula.handsontable.com${splat}` : 'https://hyperformula.handsontable.com/';

      return redirect301(dest);
    }

    // -- 5. Exact versioned HTML redirects (hardcoded) -----------------------
    {
      const exactHtml = {
        '/docs/7.1.0/frameworks-wrapper-for-angular-installation.html': '/docs/javascript-data-grid/angular-installation/',
        '/docs/7.1.0/frameworks-wrapper-for-vue-hot-column.html': '/docs/javascript-data-grid/vue-hot-column/',
        '/docs/7.1.0/tutorial-introduction.html': '/docs/javascript-data-grid/',
        '/docs/7.2.2/frameworks-wrapper-for-react-hot-column.html': '/docs/react-data-grid/hot-column/',
        '/docs/8.0.0/tutorial-migration-guide.html': '/docs/javascript-data-grid/changelog/',
        '/docs/8.2.0/tutorial-introduction.html': '/docs/javascript-data-grid/',
        '/docs/8.3.0/tutorial-modules.html': '/docs/javascript-data-grid/modules/',
        '/docs/8.3.0/tutorial-suspend-rendering.html': '/docs/javascript-data-grid/batch-operations/',
      };

      if (Object.prototype.hasOwnProperty.call(exactHtml, path)) {
        return redirect301(abs(exactHtml[path], url));
      }
    }

    // -- 6. Cross-framework page fixes (react-data-grid wrongly containing angular pages, etc.) --
    {
      const crossFramework = {
        '/docs/react-data-grid/angular-installation/': '/docs/angular-data-grid/installation/',
        '/docs/react-data-grid/angular-basic-example/': '/docs/angular-data-grid/demo/',
        '/docs/react-data-grid/angular-modules/': '/docs/angular-data-grid/modules/',
        '/docs/react-data-grid/angular-custom-id/': '/docs/angular-data-grid/api/options/',
        '/docs/react-data-grid/angular-setting-up-a-translation/': '/docs/react-data-grid/locale/',
        '/docs/react-data-grid/angular-custom-context-menu-example/': '/docs/react-data-grid/context-menu/',
        '/docs/react-data-grid/angular-custom-editor-example/': '/docs/angular-data-grid/cell-editor/',
        '/docs/react-data-grid/angular-custom-renderer-example/': '/docs/angular-data-grid/cell-renderer/',
        '/docs/react-data-grid/angular-language-change-example/': '/docs/angular-data-grid/language/',
        '/docs/react-data-grid/angular-hot-reference/': '/docs/angular-data-grid/api/core/',
        '/docs/javascript-data-grid/angular-installation/': '/docs/angular-data-grid/installation/',
        '/docs/javascript-data-grid/angular-basic-example/': '/docs/angular-data-grid/demo/',
        '/docs/javascript-data-grid/angular-modules/': '/docs/angular-data-grid/modules/',
        '/docs/javascript-data-grid/angular-custom-id/': '/docs/angular-data-grid/api/options/',
        '/docs/javascript-data-grid/angular-setting-up-a-translation/': '/docs/javascript-data-grid/locale/',
        '/docs/javascript-data-grid/angular-custom-context-menu-example/': '/docs/javascript-data-grid/context-menu/',
        '/docs/javascript-data-grid/angular-custom-editor-example/': '/docs/angular-data-grid/cell-editor/',
        '/docs/javascript-data-grid/angular-custom-renderer-example/': '/docs/angular-data-grid/cell-renderer/',
        '/docs/javascript-data-grid/angular-language-change-example/': '/docs/angular-data-grid/language/',
        '/docs/javascript-data-grid/angular-hot-reference/': '/docs/angular-data-grid/api/core/',
        // Custom ID, class, and style: Vue-only page unified into an all-framework
        // page (permalink renamed vue-custom-id-class-style → custom-id-class-style).
        '/docs/javascript-data-grid/vue-custom-id-class-style/': '/docs/javascript-data-grid/custom-id-class-style/',
        '/docs/react-data-grid/vue-custom-id-class-style/': '/docs/react-data-grid/custom-id-class-style/',
        '/docs/angular-data-grid/vue-custom-id-class-style/': '/docs/angular-data-grid/custom-id-class-style/',
        '/docs/vue-data-grid/vue-custom-id-class-style/': '/docs/vue-data-grid/custom-id-class-style/',
        '/docs/javascript-data-grid/vue3-custom-id-class-style/': '/docs/javascript-data-grid/custom-id-class-style/',
        '/docs/react-data-grid/vue3-custom-id-class-style/': '/docs/react-data-grid/custom-id-class-style/',
        '/docs/angular-data-grid/vue3-custom-id-class-style/': '/docs/angular-data-grid/custom-id-class-style/',
        '/docs/vue-data-grid/vue3-custom-id-class-style/': '/docs/vue-data-grid/custom-id-class-style/',
        '/docs/javascript-data-grid/disabled-cells/': '/docs/javascript-data-grid/read-only-cells/',
        '/docs/react-data-grid/disabled-cells/': '/docs/react-data-grid/read-only-cells/',
        '/docs/angular-data-grid/disabled-cells/': '/docs/angular-data-grid/read-only-cells/',
        '/docs/vue-data-grid/disabled-cells/': '/docs/vue-data-grid/read-only-cells/',
      };
      // Also normalise without trailing slash.
      const normalised = path.endsWith('/') ? path : `${path}/`;

      if (Object.prototype.hasOwnProperty.call(crossFramework, normalised)) {
        return redirect301(abs(crossFramework[normalised], url));
      }
    }

    // -- 7. /docs/(javascript|angular|react)-data-grid/(row-sorting|column-sorting|release-notes) --
    {
      const m = path.match(/^\/docs\/(javascript|angular|react)-data-grid\/(row-sorting|column-sorting|release-notes)\/?$/);

      if (m) {
        const framework = `${m[1]}-data-grid`;
        const pageRemap = { 'row-sorting': '/rows-sorting/', 'column-sorting': '/rows-sorting/', 'release-notes': '/changelog/' };
        const dest = `/docs/${framework}${pageRemap[m[2]]}`;

        return redirect301(abs(dest, url));
      }
    }

    // -- 7a. Vue 3 legacy pages ---------------------------------------------
    {
      const m = path.match(/^\/docs\/(javascript|react|angular|vue)-data-grid\/(vue3-[^/]+)\/?$/);

      if (m) {
        const page = m[2];

        if (Object.prototype.hasOwnProperty.call(VUE3_LEGACY_PAGES, page)) {
          return redirect301(abs(VUE3_LEGACY_PAGES[page], url));
        }
      }
    }

    // -- 7b. Versioned Vue 3 legacy pages -----------------------------------
    {
      const m = path.match(/^\/docs\/(\d+\.\d+)\/(vue3-[^/]+)\/?$/);

      if (m) {
        const version = m[1];
        const page = m[2];

        if (Object.prototype.hasOwnProperty.call(VUE3_LEGACY_PAGES, page)) {
          const dest = `/docs/${version}${VUE3_LEGACY_PAGES[page].slice('/docs'.length)}`;

          return redirect301(abs(dest, url));
        }
      }
    }

    // -- 8. Recipe cell-type slug mismatches (Angular/React/JS) --------------
    {
      const forced301 = {
        '/docs/angular-data-grid/recipes/color-picker-angular/': '/docs/angular-data-grid/recipes/cell-types/color-picker/',
        '/docs/angular-data-grid/recipes/feedback-angular/': '/docs/angular-data-grid/recipes/cell-types/feedback/',
        '/docs/angular-data-grid/recipes/stars-rating-angular/': '/docs/angular-data-grid/recipes/cell-types/rating/',
        '/docs/angular-data-grid/recipes/datepicker-angular/': '/docs/angular-data-grid/recipes/cell-types/datepicker/',
        '/docs/angular-data-grid/recipes/cell-types/color-picker-angular/': '/docs/angular-data-grid/recipes/cell-types/color-picker/',
        '/docs/javascript-data-grid/recipes/cell-types/color-picker-angular/': '/docs/javascript-data-grid/recipes/cell-types/color-picker/',
        '/docs/react-data-grid/recipes/cell-types/color-picker-angular/': '/docs/react-data-grid/recipes/cell-types/colorful-picker/',
        '/docs/angular-data-grid/recipes/cell-types/feedback-angular/': '/docs/angular-data-grid/recipes/cell-types/feedback/',
        '/docs/javascript-data-grid/recipes/cell-types/feedback-angular/': '/docs/javascript-data-grid/recipes/cell-types/feedback/',
        '/docs/react-data-grid/recipes/cell-types/feedback-angular/': '/docs/react-data-grid/recipes/cell-types/feedback-react/',
        '/docs/angular-data-grid/recipes/cell-types/rating-angular/': '/docs/angular-data-grid/recipes/cell-types/rating/',
        '/docs/javascript-data-grid/recipes/cell-types/rating-angular/': '/docs/javascript-data-grid/recipes/cell-types/rating/',
        '/docs/react-data-grid/recipes/cell-types/rating-angular/': '/docs/react-data-grid/recipes/cell-types/react-rating/',
        '/docs/angular-data-grid/recipes/cell-types/datepicker-angular/': '/docs/angular-data-grid/recipes/cell-types/datepicker/',
        '/docs/react-data-grid/recipes/cell-types/color-picker/': '/docs/react-data-grid/recipes/cell-types/colorful-picker/',
        '/docs/react-data-grid/recipes/cell-types/feedback/': '/docs/react-data-grid/recipes/cell-types/feedback-react/',
        '/docs/react-data-grid/recipes/cell-types/rating/': '/docs/react-data-grid/recipes/cell-types/react-rating/',
        '/docs/javascript-data-grid/recipes/cell-types/colorful-picker/': '/docs/javascript-data-grid/recipes/cell-types/color-picker/',
        '/docs/javascript-data-grid/recipes/cell-types/feedback-react/': '/docs/javascript-data-grid/recipes/cell-types/feedback/',
        '/docs/javascript-data-grid/recipes/cell-types/react-rating/': '/docs/javascript-data-grid/recipes/cell-types/rating/',
        '/docs/angular-data-grid/recipes/cell-types/colorful-picker/': '/docs/angular-data-grid/recipes/cell-types/color-picker/',
        '/docs/angular-data-grid/recipes/cell-types/feedback-react/': '/docs/angular-data-grid/recipes/cell-types/feedback/',
        '/docs/angular-data-grid/recipes/cell-types/react-rating/': '/docs/angular-data-grid/recipes/cell-types/rating/',
        '/docs/javascript-data-grid/recipes/cell-types/datepicker/': '/docs/javascript-data-grid/recipes/cell-types/',
        '/docs/react-data-grid/recipes/cell-types/datepicker/': '/docs/react-data-grid/recipes/cell-types/',
      };
      const normalised = path.endsWith('/') ? path : `${path}/`;

      if (Object.prototype.hasOwnProperty.call(forced301, normalised)) {
        return redirect301(abs(forced301[normalised], url));
      }
    }

    // -- 9. Flat /docs/react-data-grid/row-sorting etc. ----------------------
    // (already handled above by step 7)

    // -- 10. Flat /docs/react-* → /docs/react-data-grid/* (no trailing slash) -
    {
      // Strip optional trailing slash.
      const stripped = path.replace(/\/$/, '');
      const m = stripped.match(/^\/docs\/(react-[^/]+)$/);

      if (m) {
        const page = m[1];

        if (Object.prototype.hasOwnProperty.call(FLAT_REACT_PAGES, page)) {
          return redirect301(abs(FLAT_REACT_PAGES[page], url));
        }
      }
    }

    // -- 11. Tutorial flat redirects /docs/tutorial-*/ → /docs/javascript-data-grid/* --
    {
      const tutorialRedirects = {
        '/docs/tutorial-introduction/': '/docs/javascript-data-grid/',
        '/docs/tutorial-compatibility/': '/docs/javascript-data-grid/supported-browsers/',
        '/docs/tutorial-licensing/': '/docs/javascript-data-grid/software-license/',
        '/docs/tutorial-license-key/': '/docs/javascript-data-grid/license-key/',
        '/docs/tutorial-quick-start/': '/docs/javascript-data-grid/installation/',
        '/docs/tutorial-data-binding/': '/docs/javascript-data-grid/binding-to-data/',
        '/docs/tutorial-data-sources/': '/docs/javascript-data-grid/binding-to-data/',
        '/docs/tutorial-load-and-save/': '/docs/javascript-data-grid/saving-data/',
        '/docs/tutorial-setting-options/': '/docs/javascript-data-grid/setting-options/',
        '/docs/tutorial-grid-sizing/': '/docs/javascript-data-grid/grid-size/',
        '/docs/tutorial-using-callbacks/': '/docs/javascript-data-grid/events-and-hooks/',
        '/docs/tutorial-keyboard-navigation/': '/docs/javascript-data-grid/keyboard-navigation/',
        '/docs/tutorial-internationalization/': '/docs/javascript-data-grid/internationalization-i18n/',
        '/docs/tutorial-modules/': '/docs/javascript-data-grid/modules/',
        '/docs/tutorial-custom-build/': '/docs/javascript-data-grid/building/',
        '/docs/tutorial-custom-plugin/': '/docs/javascript-data-grid/plugins/',
        '/docs/tutorial-cell-types/': '/docs/javascript-data-grid/cell-type/',
        '/docs/tutorial-cell-editor/': '/docs/javascript-data-grid/cell-editor/',
        '/docs/tutorial-cell-function/': '/docs/javascript-data-grid/cell-function/',
        '/docs/tutorial-suspend-rendering/': '/docs/javascript-data-grid/batch-operations/',
        '/docs/tutorial-testing/': '/docs/javascript-data-grid/testing/',
        '/docs/tutorial-performance-tips/': '/docs/javascript-data-grid/performance/',
        '/docs/tutorial-release-notes/': '/docs/javascript-data-grid/release-notes/',
        '/docs/tutorial-migration-guide/': '/docs/javascript-data-grid/migration-from-7.4-to-8.0/',
        '/docs/tutorial-known-limitations/': '/docs/javascript-data-grid/third-party-licenses/',
      };
      const normalised = path.endsWith('/') ? path : `${path}/`;

      if (Object.prototype.hasOwnProperty.call(tutorialRedirects, normalised)) {
        return redirect301(abs(tutorialRedirects[normalised], url));
      }
    }

    // -- 12. Framework shorthand redirects -----------------------------------
    {
      const shortcuts = {
        '/docs/react': '/docs/react-data-grid/installation/',
        '/docs/angular': '/docs/javascript-data-grid/angular-installation/',
        '/docs/vue': VUE3_LEGACY_PAGES['vue3-installation'],
        '/docs/vue3': VUE3_LEGACY_PAGES['vue3-installation'],
      };

      if (Object.prototype.hasOwnProperty.call(shortcuts, path)) {
        return redirect301(abs(shortcuts[path], url));
      }
    }

    // -- 12a. Legacy hostname → canonical hostname (GET/HEAD) ---------------
    // The cut lands here, immediately before the first cookie-reading rule,
    // for two reasons.
    //
    // Rules 13-17 answer with a 302, because their destination depends on the
    // `docs_fw` cookie and must not be cached as permanent. A 302 is not a
    // canonicalisation signal, so a legacy URL answered by one would never
    // leave the search index - which is the entire point of this collapse.
    // Before this rule existed, `/docs`, `/docs/`, `/docs/{ver}` and every
    // flat slug took that path and stayed indexed on the legacy host.
    //
    // And cookies are host-scoped, so the reader's saved framework preference
    // lives on handsontable.com, not here. Deciding the framework from this
    // host's cookie jar would silently default a React reader to the
    // JavaScript page. Handing the bare path to the canonical host fixes both
    // at once: this hop is a 301, and the origin that owns the cookie makes
    // the framework decision.
    //
    // Everything above this line runs first on purpose - those rules resolve
    // a path whose meaning differs from what it says, and `abs()` has already
    // pointed them at the canonical origin, so they cross hosts in one hop
    // with the destination resolved. Collapsing the host before them would
    // send `/` to the marketing homepage and `/0.8.0/` to a 404, because only
    // `/docs/*` reaches this worker on handsontable.com.
    //
    // GET/HEAD only, so the rule 18a POST mock still answers on this host: a
    // 301 is downgraded to GET by every client and loses the body, and a POST
    // is never indexed, so there is nothing to canonicalise.
    if (isLegacyDocsHost(url) && (request.method === 'GET' || request.method === 'HEAD')) {
      return redirect301(abs(`${path}${url.search}`, url));
    }

    // -- 13. /docs/{ver}/{page}.html → versioned framework page (cookie) -----
    {
      const m = path.match(/^\/docs\/(\d+)\.(\d+)\/([^/]+)\.html$/);

      if (m) {
        const major = parseInt(m[1], 10);
        const minor = parseInt(m[2], 10);
        const page = m[3];
        const version = `${m[1]}.${m[2]}`;
        const isFrameworkVersion = (major === 12 && minor >= 1) || major >= 13;
        const cookieValue = getCookie(request, 'docs_fw');
        let framework = getFrameworkFromCookie(cookieValue);

        let redirectPath = major >= 12
          ? (VERSIONED_HTML_MAP_12UP[page] || VERSIONED_HTML_MAP_PRE12[page])
          : VERSIONED_HTML_MAP_PRE12[page];

        if (redirectPath === undefined) {
          // No match — fall through to static assets.
        } else {
          // Framework override based on page prefix.
          if (page.startsWith('frameworks-wrapper-for-react')) {
            framework = 'react-data-grid';
          } else if (page.startsWith('frameworks-wrapper-for-vue') || page.startsWith('frameworks-wrapper-for-angular')) {
            framework = 'javascript-data-grid';
          }

          let dest;

          if (isFrameworkVersion) {
            dest = `/docs/${version}/${framework}/${redirectPath}`;
          } else {
            dest = `/docs/${version}/${redirectPath}`;
          }

          return redirect302(abs(dest, url));
        }
      }
    }

    // -- 14. /docs/{ver}[/] → version root or framework home (cookie) --------
    {
      const m = path.match(/^\/docs\/(\d+)\.(\d+)\/?$/);

      if (m) {
        const major = parseInt(m[1], 10);
        const minor = parseInt(m[2], 10);
        const version = `${m[1]}.${m[2]}`;
        const isFrameworkVersion = (major === 12 && minor >= 1) || major >= 13;

        if (major < 12 || (major === 12 && minor < 1)) {
          // Rewrite: serve the page content from assets as-is.
          return env.ASSETS.fetch(request);
        }

        const cookieValue = getCookie(request, 'docs_fw');
        let framework = getFrameworkFromCookie(cookieValue);

        // Angular has no dedicated per-version docs before 16.0 (see the
        // LEGACY_ANGULAR_TO_ANGULAR_SET/_TO_JS_SET rule above). Sending the
        // angular-cookie framework here would manufacture a
        // /docs/{version}/angular-data-grid URL that rule 3 then collapses to
        // the unversioned latest docs, dropping the version requested here.
        if (framework === 'angular-data-grid' && major < 16) {
          framework = 'javascript-data-grid';
        }

        const dest = isFrameworkVersion ? `/docs/${version}/${framework}` : `/docs/${version}`;

        return redirect302(abs(dest, url));
      }
    }

    // -- 15. /docs/{page}.html → flat framework page (cookie) ----------------
    {
      const m = path.match(/^\/docs\/([^/]+)\.html$/);

      if (m) {
        const page = m[1];

        if (Object.prototype.hasOwnProperty.call(FLAT_HTML_MAP, page)) {
          const cookieValue = getCookie(request, 'docs_fw');
          let framework = getFrameworkFromCookie(cookieValue);
          let redirectPath = FLAT_HTML_MAP[page];

          // Framework override based on page prefix.
          if (page.startsWith('frameworks-wrapper-for-react')) {
            framework = 'react-data-grid';
          } else if (page.startsWith('frameworks-wrapper-for-vue') || page.startsWith('frameworks-wrapper-for-angular')) {
            framework = 'javascript-data-grid';
          }

          // redirectPath may be an absolute path (starts with /) or a relative slug.
          // An empty redirectPath (e.g. FLAT_HTML_MAP['tutorial-introduction'] === '')
          // must not produce a double-slash like `/docs/javascript-data-grid//`.
          const dest = redirectPath.startsWith('/')
            ? `/docs/${framework}${redirectPath}`
            : redirectPath
              ? `/docs/${framework}/${redirectPath}/`
              : `/docs/${framework}/`;

          return redirect302(abs(dest, url));
        }
      }
    }

    // -- 16. /docs/{page}[/] → flat framework page (cookie) ------------------
    // This handles both the special remap keys and the sitemap passthrough slugs.
    {
      // Strip optional trailing slash for matching.
      const stripped = path.replace(/\/$/, '');
      const m = stripped.match(/^\/docs\/(.+)$/);

      if (m) {
        const page = m[1];

        // Check special remaps first.
        if (Object.prototype.hasOwnProperty.call(FLAT_PAGES_REMAP, page)) {
          const cookieValue = getCookie(request, 'docs_fw');
          const framework = getFrameworkFromCookie(cookieValue);
          let redirectPath = FLAT_PAGES_REMAP[page];

          // Do not append a trailing slash when the path contains a fragment
          // (#anchor), as that would place the slash inside the fragment identifier
          // and break anchor navigation.
          const hasFragment = redirectPath.includes('#');

          redirectPath = hasFragment || redirectPath.endsWith('/') ? redirectPath : `${redirectPath}/`;
          redirectPath = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
          const dest = `/docs/${framework}${redirectPath}`;

          return redirect302(abs(dest, url));
        }

        // Check sitemap passthrough slugs.
        if (SITEMAP_PASSTHROUGH_SLUGS.has(page)) {
          const cookieValue = getCookie(request, 'docs_fw');
          const framework = getFrameworkFromCookie(cookieValue);
          const dest = `/docs/${framework}/${page}/`;

          return redirect302(abs(dest, url));
        }
      }
    }

    // -- 17. /docs or /docs/ → /docs/(framework)/ (cookie) ------------------
    if (path === '/docs' || path === '/docs/') {
      const cookieValue = getCookie(request, 'docs_fw');
      const framework = getFrameworkFromCookie(cookieValue);

      return redirect302(abs(`/docs/${framework}/`, url));
    }

    // -- 18. Versioned react-* pages /docs/:ver/react-* → /docs/:ver/react-data-grid/* --
    {
      const m = path.match(/^\/docs\/(\d+\.\d+)\/(react-[^/]+)\/?$/);

      if (m) {
        const version = m[1];
        const page = m[2].replace(/\/$/, '');

        if (Object.prototype.hasOwnProperty.call(VERSIONED_REACT_PAGES, page)) {
          const slug = VERSIONED_REACT_PAGES[page];
          const dest = `/docs/${version}/react-data-grid/${slug}/`;

          return redirect301(abs(dest, url));
        }
      }
    }

    // -- 18a. POST to the saving-data demo's mock save endpoint --------------
    // Cloudflare Pages' static-asset handler only serves GET/HEAD; a POST to
    // a static file returns 405. The saving-data guide's demo intentionally
    // POSTs here to illustrate a save request (see saving-data.md's "just a
    // mockup" note), so answer it directly instead of falling through to
    // env.ASSETS, which would 405.
    if (path === '/docs/scripts/json/save.json' && request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(JSON.stringify({ result: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // -- 18b. Agent-facing text files: force text/plain -----------------------
    // The Markdown twins under /docs/_md/ and the llms.txt indexes exist for
    // AI agents, but Pages serves .md as `text/markdown` — a content type
    // OpenAI's web-search fetch tool refuses to parse (verified 2026-09-08:
    // the tool fetched a twin, reported "unsupported content type", and fell
    // back to the HTML page). `text/plain` is what raw.githubusercontent.com
    // and hyperformula.handsontable.com/llms.txt serve, and every major agent
    // stack consumes it. Serving content, so this must stay below rule 12a.
    if (/^\/docs\/(?:_md\/.+\.md|llms(?:-full)?\.txt)$/.test(path)) {
      const assetResponse = await env.ASSETS.fetch(request);

      if (assetResponse.status !== 200) return assetResponse;

      const decorated = new Response(assetResponse.body, assetResponse);

      decorated.headers.set('Content-Type', 'text/plain; charset=utf-8');

      return decorated;
    }

    // -- 18c. Design System last-update date (JSON) ---------------------------
    // The design system page shows when the Figma file was last updated. The
    // read happens here, not in the browser: a Figma token in client JS is
    // public, and the site's own CSP has no `api.figma.com` in `connect-src`
    // anyway. Same-origin keeps it under `connect-src 'self'`, so serving it
    // from this worker needs no CSP change.
    //
    // Answers GET and HEAD. HEAD matters because link checkers, uptime probes
    // and CDN preflights all default to it, and answering 404 there while GET
    // answers 200 reports a working endpoint as dead. The runtime drops the
    // body for a HEAD. Anything else falls through to env.ASSETS, which 404s
    // the path - there is no asset behind it.
    //
    // Serving content, so this must stay below rule 12a.
    if (path === DESIGN_SYSTEM_DATE_PATH && (request.method === 'GET' || request.method === 'HEAD')) {
      const cache = typeof caches !== 'undefined' ? caches.default : null;
      // A key of our own rather than the incoming request: it carries the
      // version above, and it ignores any query string a caller adds, so a
      // cache-busting `?x=1` cannot fill the cache with duplicate entries.
      const cacheKey = cache
        ? new Request(`${url.origin}${DESIGN_SYSTEM_DATE_PATH}?v=${DESIGN_SYSTEM_CACHE_VERSION}`)
        : null;
      const cached = cacheKey ? await cache.match(cacheKey) : null;

      if (cached) {
        return cached;
      }

      let result;

      // One catch for the whole read. Figma being unreachable, rate-limiting
      // us, or rejecting an expired token are all the same event here: the
      // page hides one line and everything else keeps working.
      try {
        result = await readDesignSystemDate(env);
      } catch {
        result = { date: null, source: null, reason: 'figma-unreachable' };
      }

      // `provisional` stays internal - the page has one shape to read.
      const { provisional = false, ...body } = result;
      // A settled answer holds for a day. Anything else - a failure, or a date
      // read from a history the walk could not finish - holds for minutes, so
      // it cannot outlive the fix by more than that. Storing the short ones
      // rather than skipping them keeps a Figma outage from turning every
      // single request into a fresh OAuth refresh plus history read.
      const settled = body.date !== null && !provisional;
      const response = designSystemDateResponse(body, settled);

      if (cacheKey) {
        const write = cache.put(cacheKey, response.clone());

        // Hand the write to the runtime where possible: on a cache miss the
        // reader has already waited for two Figma round trips, and the edge
        // write adds nothing they need. `ctx` is absent in the tests, which
        // call the worker with two arguments.
        if (ctx?.waitUntil) {
          ctx.waitUntil(write);
        } else {
          await write;
        }
      }

      return response;
    }

    // -- 19. Fallback: serve static assets via env.ASSETS --------------------
    return env.ASSETS.fetch(request);
}

export default {
  // `ctx` is only used by rule 18c, to hand its edge-cache write to
  // `ctx.waitUntil` instead of making the reader wait for it.
  async fetch(request, env, ctx) {
    return withSecurityHeaders(await route(request, env, ctx));
  },
};
