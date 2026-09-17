import { warn } from '../../helpers/console';
import type { HotInstance } from '../../core/types';
import type { ImportResult } from './importFile';

/**
 * A plugin the applier may hand data to.
 */
interface CommentsLike {
  isEnabled(): boolean;
  setCommentAtCell(row: number, column: number, value: string): void;
}

const STYLE_ATTRIBUTE = 'data-hot-imported-styles';

/**
 * Class names the generated stylesheet accepts: the mapper's own `htImported-<hash>` shape, plus the
 * `-2`, `-3`, ... suffix its hash-collision guard appends. Nothing else may become a selector.
 */
const IMPORTED_CLASS_PATTERN = /^htImported-[0-9a-z]+(-[0-9]+)?$/;

/**
 * Declarations the generated stylesheet accepts: `property:value` pairs separated by single `;`,
 * where a value is limited to letters, digits, `#`, space, comma, dot, parentheses and hyphen. No
 * `{`, `}`, `<`, `/`, quote or backslash can pass, so no value can close the rule it sits in.
 */
const IMPORTED_DECLARATIONS_PATTERN = /^[a-z-]+:[#0-9a-z ,.()-]+(;[a-z-]+:[#0-9a-z ,.()-]+)*$/;

/**
 * Builds the `updateSettings` payload from the result, including only the keys the workbook set.
 *
 * `nestedHeaders` is a carried key like `mergeCells`: `NestedHeaders#isEnabled()` is
 * `!!settings.nestedHeaders`, and `BasePlugin#onUpdateSettings` enables a plugin whose `isEnabled()`
 * turned true, so passing the array both configures and switches the plugin on. `layoutDirection`
 * is deliberately NOT here - the grid resolves it at construction and ignores it afterwards.
 *
 * A result that promotes a single header row (`colHeaders` present, `nestedHeaders` absent) adds an
 * explicit `nestedHeaders: false` when the target grid currently has one configured. Without it, a
 * grid carrying `nestedHeaders` from an earlier import with `headerRows` above `1` keeps that setting
 * after a later import promotes a plain single row: `NestedHeaders` still owns the header band and the
 * new `colHeaders` never renders. A result carrying no `colHeaders` at all (e.g. the `colHeaders: false`
 * import option) is left untouched - the header band is not this import's concern.
 */
function toSettings(hot: HotInstance, result: ImportResult): Record<string, unknown> {
  const settings: Record<string, unknown> = {};
  const direct: Array<keyof ImportResult> = [
    'colHeaders', 'nestedHeaders', 'rowHeaders', 'columns', 'mergeCells', 'fixedRowsTop', 'fixedColumnsStart',
    'colWidths', 'rowHeights',
  ];

  direct.forEach((key) => {
    if (result[key] !== undefined) {
      settings[key] = result[key];
    }
  });

  if (result.colHeaders !== undefined && result.nestedHeaders === undefined && hot.getSettings().nestedHeaders) {
    settings.nestedHeaders = false;
  }

  if (result.hiddenRows !== undefined) {
    settings.hiddenRows = { rows: result.hiddenRows };
  }

  if (result.hiddenColumns !== undefined) {
    settings.hiddenColumns = { columns: result.hiddenColumns };
  }

  if (result.customBorders !== undefined) {
    settings.customBorders = result.customBorders;
  }

  return settings;
}

/**
 * Installs (or replaces) the instance-owned stylesheet carrying the generated cell classes.
 *
 * Nothing the workbook carries reaches the stylesheet unchecked. Every class name has to match the
 * mapper's own `htImported-<hash>` shape and every declaration block has to be `property:value`
 * pairs built from letters, digits, `#`, space, comma, dot, parentheses and hyphen, so no value can
 * carry a `}` and close the rule it sits in. A rule that fails either test is dropped and the
 * rejected class names are named in one `warn()`. That is the second layer: `argbToCssHex` in
 * `styles.ts` already refuses a color that is not plain hex, and this is what keeps a future
 * declaration source honest too.
 *
 * An empty (or fully rejected) rule set REMOVES the element rather than leaving an empty one, which
 * is also what clears the previous import's rules when the next workbook carries no styles at all.
 *
 * Rules use the `.handsontable tbody > tr > td.<class>` selector, not the shorter
 * `.handsontable td.<class>`, so the generated rule beats the theme's own row-banding CSS
 * (`.handsontable :where(table.htCore > tbody, …) > tr.ht__row_even/odd > td`, main/horizon/classic
 * alike): both selectors carry two classes (`.handsontable` plus one more), which is a specificity
 * tie, and the extra `tbody`/`tr` type selectors here push the generated rule to three elements
 * against the theme rule's two - `(0,2,3)` beats `(0,2,2)`. Never reach for `table.htCore` instead:
 * the export's own class probe (`detectExplicitBackgroundColor`/`getCssStyleFromProbe` in
 * `../exportFile/types/xlsx/cell-style.ts`) builds `div.handsontable > table > tbody > tr > td` with
 * no class on the `<table>`, so a `table.htCore` qualifier would never match it and a re-export
 * would silently stop seeing the fill. Never reach for `!important` either - the shorter, portable
 * selector shape is what a real grid and the probe both share; raising priority through
 * `!important` would also outrank a user's own CSS with no way back.
 */
export function installImportedStyles(hot: HotInstance, styles: Record<string, string>): void {
  const doc = hot.rootDocument;
  const rules: string[] = [];
  const rejected: string[] = [];

  Object.entries(styles).forEach(([className, declarations]) => {
    if (!IMPORTED_CLASS_PATTERN.test(className) || !IMPORTED_DECLARATIONS_PATTERN.test(declarations)) {
      rejected.push(className);

      return;
    }

    rules.push(`.handsontable tbody > tr > td.${className}{${declarations}}`);
  });

  if (rejected.length > 0) {
    warn(`Imported cell styles were skipped as unsafe to install: ${rejected.join(', ')}.`);
  }

  if (rules.length === 0) {
    removeImportedStyles(hot);

    return;
  }

  let styleEl = doc.head.querySelector<HTMLStyleElement>(`style[${STYLE_ATTRIBUTE}="${hot.guid}"]`);

  if (!styleEl) {
    styleEl = doc.createElement('style');
    styleEl.setAttribute(STYLE_ATTRIBUTE, hot.guid);
    doc.head.appendChild(styleEl);
  }

  styleEl.textContent = rules.join('\n');
}

/**
 * Removes the instance-owned stylesheet, if any.
 */
export function removeImportedStyles(hot: HotInstance): void {
  hot.rootDocument.head.querySelector(`style[${STYLE_ATTRIBUTE}="${hot.guid}"]`)?.remove();
}

/**
 * Applies an import result to a Handsontable instance: data, then the generated stylesheet, then
 * settings (including `customBorders`), then per-cell meta and comments, all inside one render batch.
 *
 * The data goes in FIRST, and the order is load-bearing. Every layout setting the result carries is
 * validated against the table that exists when it is applied: `mergeCells` rejects (and warns about)
 * a merge that reaches past the last row, and `fixedRowsTop`/`hiddenRows` are equally bounded. A
 * target grid usually starts with a single empty row, so applying the settings first silently dropped
 * every merge the workbook declared. `loadData` is what resets the cell states the result then
 * rewrites, so the pair stays `loadData` + `updateSettings` rather than one `updateSettings` carrying
 * a `data` key - which would route through `updateData` and keep the previous import's cell meta. The
 * stylesheet is installed right after `loadData` so the generated classes already resolve on the
 * first render `updateSettings` triggers. The surrounding `batch` suspends rendering, so all the calls
 * still paint once.
 */
export function applyImportResult(hot: HotInstance, result: ImportResult): void {
  hot.batch(() => {
    const settings = toSettings(hot, result);

    hot.loadData(result.data);

    installImportedStyles(hot, result.styles ?? {});

    if (Object.keys(settings).length > 0) {
      hot.updateSettings(settings);
    }

    result.cellsMeta?.forEach(({ row, col, meta }) => hot.setCellMetaObject(row, col, meta));

    const comments = hot.getPlugin('comments') as unknown as CommentsLike | undefined;

    if (result.comments && comments?.isEnabled()) {
      result.comments.forEach(({ row, col, value }) => comments.setCommentAtCell(row, col, value));
    }
  });
}
