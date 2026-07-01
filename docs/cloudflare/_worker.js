/**
 * Cloudflare Pages Worker for Handsontable docs preview site.
 *
 * When a _worker.js is present in Cloudflare Pages, it intercepts ALL requests
 * and _redirects is ignored. This worker re-implements all redirect logic that
 * lives in the Netlify _redirects file and the Netlify edge functions.
 *
 * Redirect priority order (first match wins):
 *   1. /docs/next/:splat                   → /docs/:splat
 *  1a. /docs/sitemap.xml                   → /docs/sitemap-index.xml
 *   2. / → /docs
 *  2a. /0.8.0/*                            → /docs/javascript-data-grid/changelog
 *  2b. /docs/redirect?pageId=*             → /docs/javascript-data-grid/changelog
 *  2c. Blog article redirects              → /blog/... or /blog
 *  2d. /demo/*                             → /demo
 *  2e. /customers/*                        → /customers/
 *   3. Legacy versioned angular-data-grid  → /docs/angular-data-grid/ or /docs/javascript-data-grid/
 *   3. /docs/hyperformula[/*]              → external hyperformula site
 *   4. Exact versioned HTML redirects      → framework-specific pages
 *   5. /docs/:ver/:page.html               → versioned framework pages (cookie)
 *   6. /docs/(javascript|angular|react)-data-grid/(row-sorting|column-sorting|release-notes)
 *   7. Cross-framework page fixes (angular/react wrong-prefix pages)
 *   8. Recipe cell-type slug mismatches
 *   9. Angular-only recipe redirects for React/JS
 *  10. JS/React-only recipe redirects for Angular/React
 *  11. Flat /docs/react-* redirects        → /docs/react-data-grid/*
 *  12. Tutorial flat redirects             → /docs/javascript-data-grid/*
 *  13. Versioned /docs/:ver/react-*        → /docs/:ver/react-data-grid/*
 *  14. /docs/:ver{/}                       → version root or framework home
 *  15. /docs/(page).html                   → framework page (cookie)
 *  16. /docs/(page){/}                     → framework page (cookie)
 *  17. /docs/react, /docs/angular, etc.    → framework homes
 *  18. /{/}                               → /docs
 *  19. /docs{/}                           → /docs/(framework)/ (cookie)
 *  20. Static asset fallback (env.ASSETS)
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
 * Builds an absolute URL string from a path relative to the original request
 * origin.
 *
 * @param {string} path  – must begin with /
 * @param {URL} base
 * @returns {string}
 */
function abs(path, base) {
  return `${base.origin}${path}`;
}

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
  'api/persistent-state',
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
  'disabled-cells',
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

// ---------------------------------------------------------------------------
// Main worker
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env) {
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
        '/docs/react-data-grid/recipes/cell-types/flatpickr/': '/docs/react-data-grid/recipes/cell-types/',
        '/docs/angular-data-grid/recipes/cell-types/flatpickr/': '/docs/angular-data-grid/recipes/cell-types/',
        '/docs/react-data-grid/recipes/cell-types/pikaday/': '/docs/react-data-grid/recipes/cell-types/',
        '/docs/angular-data-grid/recipes/cell-types/pikaday/': '/docs/angular-data-grid/recipes/cell-types/',
        '/docs/react-data-grid/recipes/cell-types/numbro/': '/docs/react-data-grid/recipes/cell-types/',
        '/docs/angular-data-grid/recipes/cell-types/numbro/': '/docs/angular-data-grid/recipes/cell-types/',
        '/docs/react-data-grid/recipes/cell-types/moment-date/': '/docs/react-data-grid/recipes/cell-types/',
        '/docs/angular-data-grid/recipes/cell-types/moment-date/': '/docs/angular-data-grid/recipes/cell-types/',
        '/docs/react-data-grid/recipes/cell-types/moment-time/': '/docs/react-data-grid/recipes/cell-types/',
        '/docs/angular-data-grid/recipes/cell-types/moment-time/': '/docs/angular-data-grid/recipes/cell-types/',
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
        '/docs/vue': '/docs/javascript-data-grid/vue3-installation/',
        '/docs/vue3': '/docs/javascript-data-grid/vue3-installation/',
      };

      if (Object.prototype.hasOwnProperty.call(shortcuts, path)) {
        return redirect301(abs(shortcuts[path], url));
      }
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

    // -- 19. Fallback: serve static assets via env.ASSETS --------------------
    return env.ASSETS.fetch(request);
  },
};
