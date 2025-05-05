/* eslint-disable no-unused-vars */
import { Config, Context } from '@netlify/edge-functions';
import { getFrameworkFromCookie } from '../cookieHelper.mts';

// Key-value record for redirects (without the trailing slash)
const redirectsMap = {
// Tutorials
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

  // Demos
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

  // Framework wrappers - Vue
  'frameworks-wrapper-for-vue-installation': 'vue-installation',
  'frameworks-wrapper-for-vue-simple-example': 'vue-basic-example',
  'frameworks-wrapper-for-vue-hot-column': 'vue-hot-column',
  'frameworks-wrapper-for-vue-setting-up-a-locale':
    'vue-setting-up-a-translation',
  'frameworks-wrapper-for-vue-custom-id-class-style':
    'vue-custom-id-class-style',
  'frameworks-wrapper-for-vue-custom-context-menu-example':
    'vue-custom-context-menu-example',
  'frameworks-wrapper-for-vue-custom-editor-example':
    'vue-custom-editor-example',
  'frameworks-wrapper-for-vue-custom-renderer-example':
    'vue-custom-renderer-example',
  'frameworks-wrapper-for-vue-language-change-example':
    'vue-language-change-example',
  'frameworks-wrapper-for-vue-vuex-example': 'vue-vuex-example',
  'frameworks-wrapper-for-vue-hot-reference': 'vue-hot-reference',

  // Framework wrappers - Angular
  'frameworks-wrapper-for-angular-installation': 'angular-installation',
  'frameworks-wrapper-for-angular-simple-example': 'angular-basic-example',
  'frameworks-wrapper-for-angular-custom-id': 'angular-custom-id',
  'frameworks-wrapper-for-angular-setting-up-a-locale':
    'angular-setting-up-a-translation',
  'frameworks-wrapper-for-angular-custom-context-menu-example':
    'angular-custom-context-menu-example',
  'frameworks-wrapper-for-angular-custom-editor-example':
    'angular-custom-editor-example',
  'frameworks-wrapper-for-angular-custom-renderer-example':
    'angular-custom-renderer-example',
  'frameworks-wrapper-for-angular-language-change-example':
    'angular-language-change-example',
  'frameworks-wrapper-for-angular-hot-reference': 'angular-hot-reference',

  // API Documentation
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
  PersistentState: 'api/persistent-state',
  Search: 'api/search',
  TrimRows: 'api/trim-rows',
  UndoRedo: 'api/undo-redo'
};

export default async(req: Request, context: Context) => {

  // This function implements nginx dynamic redirect declarations into netlify edge functions.
  // https://github.com/handsontable/handsontable/blob/develop/docs/docker/redirects.conf#L27-L29

  let framework = getFrameworkFromCookie(context.cookies.get('docs_fw'));
  const page = context.params[0];
  const redirectPath = redirectsMap[page];

  if (page.startsWith('frameworks-wrapper-for-react')) {
    framework = 'react-data-grid';
  }
  if (page.startsWith('frameworks-wrapper-for-vue') || page.startsWith('frameworks-wrapper-for-angular')) {
    framework = 'javascript-data-grid';
  }

  const url = new URL(`/docs/${framework}/${redirectPath}`, req.url);

  return Response.redirect(url);
};

export const config: Config = {
  // eslint-disable-next-line max-len
  path: '/docs/(tutorial-introduction|tutorial-compatibility|tutorial-licensing|tutorial-license-key|tutorial-quick-start|tutorial-data-binding|tutorial-data-sources|tutorial-load-and-save|tutorial-setting-options|tutorial-grid-sizing|tutorial-using-callbacks|tutorial-keyboard-navigation|tutorial-internationalization|tutorial-modules|tutorial-custom-build|tutorial-custom-plugin|tutorial-cell-types|tutorial-cell-editor|tutorial-cell-function|tutorial-suspend-rendering|tutorial-testing|tutorial-performance-tips|tutorial-release-notes|tutorial-migration-guide|demo-scrolling|demo-fixing|demo-resizing|demo-moving|demo-pre-populating|demo-stretching|demo-freezing|demo-fixing-bottom|demo-hiding-rows|demo-hiding-columns|demo-trimming-rows|demo-bind-rows-headers|demo-collapsing-columns|demo-nested-headers|demo-nested-rows|demo-dropdown-menu|demo-sorting|demo-multicolumn-sorting|demo-searching|demo-filtering|demo-summary-calculations|demo-data-validation|demo-auto-fill|demo-merged-cells|demo-alignment|demo-read-only|demo-disabled-editing|demo-custom-renderers|demo-numeric|demo-date|demo-time|demo-checkbox|demo-select|demo-dropdown|demo-autocomplete|demo-password|demo-handsontable|demo-context-menu|demo-spreadsheet-icons|demo-comments_|demo-copy-paste|demo-export-file|demo-conditional-formatting|demo-customizing-borders|demo-selecting-ranges|demo-formula-support|frameworks-wrapper-for-react-installation|frameworks-wrapper-for-react-simple-examples|frameworks-wrapper-for-react-hot-column|frameworks-wrapper-for-react-setting-up-a-locale|frameworks-wrapper-for-react-custom-context-menu-example|frameworks-wrapper-for-react-custom-editor-example|frameworks-wrapper-for-react-custom-renderer-example|frameworks-wrapper-for-react-language-change-example|frameworks-wrapper-for-react-redux-example|frameworks-wrapper-for-react-hot-reference|frameworks-wrapper-for-vue-installation|frameworks-wrapper-for-vue-simple-example|frameworks-wrapper-for-vue-hot-column|frameworks-wrapper-for-vue-setting-up-a-locale|frameworks-wrapper-for-vue-custom-id-class-style|frameworks-wrapper-for-vue-custom-context-menu-example|frameworks-wrapper-for-vue-custom-editor-example|frameworks-wrapper-for-vue-custom-renderer-example|frameworks-wrapper-for-vue-language-change-example|frameworks-wrapper-for-vue-vuex-example|frameworks-wrapper-for-vue-hot-reference|frameworks-wrapper-for-angular-installation|frameworks-wrapper-for-angular-simple-example|frameworks-wrapper-for-angular-custom-id|frameworks-wrapper-for-angular-setting-up-a-locale|frameworks-wrapper-for-angular-custom-context-menu-example|frameworks-wrapper-for-angular-custom-editor-example|frameworks-wrapper-for-angular-custom-renderer-example|frameworks-wrapper-for-angular-language-change-example|frameworks-wrapper-for-angular-hot-reference|Core|Hooks|Options|AutoColumnSize|AutoRowSize|Autofill|BindRowsWithHeaders|CollapsibleColumns|ColumnSorting|ColumnSummary|Comments|ContextMenu|CopyPaste|CustomBorders|DragToScroll|DropdownMenu|ExportFile|Filters|Formulas|HiddenColumns|HiddenRows|ManualColumnFreeze|ManualColumnMove|ManualColumnResize|ManualRowMove|ManualRowResize|MergeCells|MultiColumnSorting|NestedHeaders|NestedRows|PersistentState|Search|TrimRows|UndoRedo).html'
};
