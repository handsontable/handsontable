import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.resolve(__dirname, '../../content');

/**
 * Maps a generated API page (the file name in `content/api/`) to the one guide that explains the
 * feature. The renderer adds a "See the guide" line to the top of that API page (DEV-2809).
 *
 * Rules for an entry:
 * - Plugins, plus the `hooks.md` and `baseEditor.md` pages. `Options` already links its guides from the
 *   text of each option, and `Core` is skipped.
 * - A page can point at one guide (a string) or at several (an array). Use an array only when the
 *   feature really has two guides, as `exportFile.md` has for CSV and Excel.
 * - The guide must exist, have a `permalink` (the loader skips pages without one, so the link would
 *   404), and not be framework-gated, because one API page serves every framework.
 *   `scripts/validate-api-guide-links.mjs` enforces all three for every guide.
 * - A plugin with no guide of its own has no entry and is listed in `unmappedPlugins` instead.
 *
 * Values are a path or an array of paths, relative to `docs/content/`.
 */
export const apiGuideLinks = {
  'autoColumnSize.md': 'guides/columns/column-width/column-width.md',
  'autoLink.md': 'guides/cell-features/clickable-links/clickable-links.md',
  'autoRowHeaderSize.md': 'guides/rows/row-header/row-header.md',
  'autoRowSize.md': 'guides/rows/row-height/row-height.md',
  'autofill.md': 'guides/cell-features/autofill-values/autofill-values.md',
  'baseEditor.md': 'guides/cell-functions/cell-editor/cell-editor.md',
  'bindRowsWithHeaders.md': 'guides/rows/row-header/row-header.md',
  'checkboxHeader.md': 'guides/cell-types/checkbox-cell-type/checkbox-cell-type.md',
  'collapsibleColumns.md': 'guides/columns/column-groups/column-groups.md',
  'columnSorting.md': 'guides/rows/rows-sorting/rows-sorting.md',
  'columnSummary.md': 'guides/columns/column-summary/column-summary.md',
  'comments.md': 'guides/cell-features/comments/comments.md',
  'contextMenu.md': 'guides/accessories-and-menus/context-menu/context-menu.md',
  'copyPaste.md': 'guides/cell-features/clipboard/clipboard.md',
  'customBorders.md': 'guides/cell-features/formatting-cells/formatting-cells.md',
  'dataProvider.md': 'guides/getting-started/server-side-data/server-side-data.md',
  'dialog.md': 'guides/dialog/dialog/dialog.md',
  'dragToScroll.md': 'guides/accessories-and-menus/drag-to-scroll/drag-to-scroll.md',
  'dropdownMenu.md': 'guides/accessories-and-menus/column-menu/column-menu.md',
  'emptyDataState.md': 'guides/accessories-and-menus/empty-data-state/empty-data-state.md',
  'exportFile.md': [
    'guides/accessories-and-menus/export-to-csv/export-to-csv.md',
    'guides/accessories-and-menus/export-to-excel/export-to-excel.md',
  ],
  'filters.md': 'guides/columns/column-filter/column-filter.md',
  'formulas.md': 'guides/formulas/formula-calculation/formula-calculation.md',
  'freezeBar.md': 'guides/columns/column-freezing/column-freezing.md',
  'hiddenColumns.md': 'guides/columns/column-hiding/column-hiding.md',
  'hiddenRows.md': 'guides/rows/row-hiding/row-hiding.md',
  'hooks.md': 'guides/getting-started/events-and-hooks/events-and-hooks.md',
  'importFile.md': 'guides/accessories-and-menus/import-from-excel/import-from-excel.md',
  'loading.md': 'guides/dialog/loading/loading.md',
  'manualColumnFreeze.md': 'guides/columns/column-freezing/column-freezing.md',
  'manualColumnMove.md': 'guides/columns/column-moving/column-moving.md',
  'manualColumnResize.md': 'guides/columns/column-width/column-width.md',
  'manualRowMove.md': 'guides/rows/row-moving/row-moving.md',
  'manualRowResize.md': 'guides/rows/row-height/row-height.md',
  'mergeCells.md': 'guides/cell-features/merge-cells/merge-cells.md',
  'moveCells.md': 'guides/cell-features/move-cells/move-cells.md',
  'multiColumnSorting.md': 'guides/rows/rows-sorting/rows-sorting.md',
  'nestedHeaders.md': 'guides/columns/column-groups/column-groups.md',
  'nestedRows.md': 'guides/rows/row-parent-child/row-parent-child.md',
  'notification.md': 'guides/dialog/notification/notification.md',
  'pagination.md': 'guides/rows/rows-pagination/rows-pagination.md',
  'rowSelection.md': 'guides/rows/row-selection/row-selection.md',
  'search.md': 'guides/navigation/searching-values/searching-values.md',
  'selectionHandles.md': 'guides/cell-features/selection/selection.md',
  'sheetsBar.md': 'guides/accessories-and-menus/sheets-bar/sheets-bar.md',
  'stretchColumns.md': 'guides/columns/column-width/column-width.md',
  'trimRows.md': 'guides/rows/row-trimming/row-trimming.md',
  'undoRedo.md': 'guides/accessories-and-menus/undo-redo/undo-redo.md',
  'viewState.md': 'guides/getting-started/view-state/view-state.md',
};

/**
 * Plugins that have no guide of their own, so they have no entry in `apiGuideLinks`. The validator
 * fails on a plugin directory that is in neither place, so a new plugin forces a decision: add a
 * guide link, or list the plugin here.
 */
export const unmappedPlugins = [
  'touchScroll',
  'multipleSelectionHandles',
];

/**
 * Reads the frontmatter of a guide.
 *
 * @param {string} guidePath Path relative to `docs/content/`.
 * @param {string} [baseDir] Content directory, overridable for tests.
 * @returns {Record<string, unknown>} The parsed frontmatter.
 */
export const readGuideFrontmatter = (guidePath, baseDir = contentDir) => {
  return matter(fs.readFileSync(path.join(baseDir, guidePath), 'utf8')).data;
};

/**
 * Reads the `title` of a guide from its frontmatter.
 *
 * @param {string} guidePath Path relative to `docs/content/`.
 * @param {string} [baseDir] Content directory, overridable for tests.
 * @returns {string} The guide title.
 */
export const readGuideTitle = (guidePath, baseDir = contentDir) => {
  const data = readGuideFrontmatter(guidePath, baseDir);

  if (typeof data.title !== 'string' || !data.title) {
    throw new Error(`The guide "${guidePath}" has no title in its frontmatter.`);
  }

  return data.title;
};

/**
 * Builds the line that points an API page at its guide. The link uses the `@/guides/...` form,
 * which the docs build resolves per framework. A page with several guides gets one sentence per
 * guide, so each sentence reads the same as the single-guide one.
 *
 * @param {string} apiFile The API page file name, for example `columnSorting.md`. A leading capital
 *   (`ColumnSorting.md`, the form the renderer receives) is lowercased, as `paths.mjs` does for the output.
 * @param {{ links?: Record<string, string | string[]>, baseDir?: string }} [options] Overrides for tests.
 * @returns {string} The line, or an empty string when the page has no mapped guide.
 */
export const buildGuideLinkLine = (apiFile, { links = apiGuideLinks, baseDir = contentDir } = {}) => {
  const key = apiFile.replace(/^[A-Z]/, upper => upper.toLowerCase());
  const guidePaths = Object.hasOwn(links, key) ? [].concat(links[key]).filter(Boolean) : [];

  return guidePaths
    .map(guidePath => `See the [${readGuideTitle(guidePath, baseDir)}](@/${guidePath}) guide for examples and configuration details.`)
    .join(' ');
};
