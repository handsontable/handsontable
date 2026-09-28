import { warn } from '../../helpers/console';
import { isPlainObject } from '../../helpers/object';
import type { HotInstance } from '../../core/types';
import type { ImportResult } from './importFile';

/**
 * What the applier needs to know about how the result was produced.
 */
export interface ApplyOptions {
  /**
   * Whether the result describes the sheet's layout. When it does, a layout the previous import
   * left on the grid and this result does not carry is cleared.
   */
  importLayout: boolean;
}

/**
 * The layout keys a result may omit. Each is reset when `importLayout` is on, the result does not
 * carry it, and the grid currently has one - so a plain sheet imported after a merged, frozen one
 * does not keep the first file's merges and freeze on the second file's data. Widths and heights
 * reset to an own `undefined`: `updateSettings` writes every own property it is handed, so an
 * explicit `undefined` restores the default where an absent key would leave the old value.
 */
type ResettableLayoutKey = 'mergeCells' | 'hiddenRows' | 'hiddenColumns' | 'fixedRowsTop'
  | 'fixedColumnsStart' | 'customBorders' | 'colWidths' | 'rowHeights';

const RESETTABLE_LAYOUT_KEYS: ResettableLayoutKey[] = [
  'mergeCells', 'hiddenRows', 'hiddenColumns', 'fixedRowsTop', 'fixedColumnsStart', 'customBorders',
  'colWidths', 'rowHeights',
];

/**
 * Builds the value of `mergeCells`, which takes either a bare list or an options object carrying
 * the list under `cells`. The object's other options are kept: `{ virtualized: true }` used to be
 * replaced by the imported list.
 */
function mergeCellsSetting(current: unknown, cells: unknown[]): unknown {
  return isPlainObject(current) ? { ...current, cells } : cells;
}

/**
 * Builds the value of `hiddenRows` or `hiddenColumns`, which take an options object carrying the
 * list under `listKey`. The object's other options are kept: `{ indicators: true,
 * copyPasteEnabled: false }` used to be replaced by `{ rows }`.
 */
function hiddenSetting(current: unknown, listKey: 'rows' | 'columns', list: number[]): Record<string, unknown> {
  return { ...(isPlainObject(current) ? current : {}), [listKey]: list };
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
function toSettings(hot: HotInstance, result: ImportResult, options: ApplyOptions): Record<string, unknown> {
  const settings: Record<string, unknown> = {};
  const current = hot.getSettings() as Record<string, unknown>;
  const direct: Array<keyof ImportResult> = [
    'colHeaders', 'nestedHeaders', 'rowHeaders', 'columns', 'fixedRowsTop', 'fixedColumnsStart',
    'colWidths', 'rowHeights',
  ];

  direct.forEach((key) => {
    if (result[key] !== undefined) {
      settings[key] = result[key];
    }
  });

  if (result.colHeaders !== undefined && result.nestedHeaders === undefined && current.nestedHeaders) {
    settings.nestedHeaders = false;
  }

  if (result.mergeCells !== undefined) {
    settings.mergeCells = mergeCellsSetting(current.mergeCells, result.mergeCells);
  }

  if (result.hiddenRows !== undefined) {
    settings.hiddenRows = hiddenSetting(current.hiddenRows, 'rows', result.hiddenRows);
  }

  if (result.hiddenColumns !== undefined) {
    settings.hiddenColumns = hiddenSetting(current.hiddenColumns, 'columns', result.hiddenColumns);
  }

  if (result.customBorders !== undefined) {
    settings.customBorders = result.customBorders;
  }

  if (options.importLayout) {
    resetOmittedLayout(result, current, settings);
  }

  // `columns` follows the same "an import describes the whole sheet" rule as the layout, and it is
  // not layout, so it resets regardless of `importLayout`: the previous file's types, locks and
  // classes, and the column count its array pinned, must not survive onto a workbook that has
  // nothing to say at the column level. An own `undefined` would not do it: `updateSettings` writes
  // the value but runs its column side effects (the column-meta cache reset, `initIndexMappers`)
  // only for a defined `columns`, and `loadData` has already sized the grid from the old array. An
  // explicit array of empty column settings, one per imported column, takes both paths.
  if (result.columns === undefined && current.columns !== undefined) {
    const width = importedWidth(result);

    // A width of zero (nothing imported at all) must not become `columns: []`, which pins the grid at
    // zero columns; the previous setting is left alone in that case.
    if (width > 0) {
      settings.columns = Array.from({ length: width }, () => ({}));
    }
  }

  return settings;
}

/**
 * How many columns the result describes: the widest data row, or, for a sheet with no data cells
 * (a header-only sheet, a `headerRows` that consumed every row, a `range` over headers only), the
 * width its headers or column widths describe. The empty column settings that reset a previous
 * import's `columns` are sized from it, so a header-only import does not pin the grid at zero
 * columns and lose the headers it carries.
 */
function importedWidth(result: ImportResult): number {
  const dataWidth = result.data.reduce((max, row) => Math.max(max, row.length), 0);
  const nestedWidth = (result.nestedHeaders?.[0] ?? [])
    .reduce((sum, header) => sum + (typeof header === 'string' ? 1 : header.colspan ?? 1), 0);

  return Math.max(dataWidth, result.colHeaders?.length ?? 0, result.colWidths?.length ?? 0, nestedWidth);
}

/**
 * Clears every resettable layout key the result omits and the grid currently carries. A list
 * setting keeps its options object and empties the list; a count goes to `0`.
 */
function resetOmittedLayout(
  result: ImportResult, current: Record<string, unknown>, settings: Record<string, unknown>
): void {
  RESETTABLE_LAYOUT_KEYS.forEach((key) => {
    if (result[key] !== undefined || !current[key]) {
      return;
    }

    switch (key) {
      case 'mergeCells':
        settings.mergeCells = mergeCellsSetting(current.mergeCells, []);
        break;
      case 'hiddenRows':
        settings.hiddenRows = hiddenSetting(current.hiddenRows, 'rows', []);
        break;
      case 'hiddenColumns':
        settings.hiddenColumns = hiddenSetting(current.hiddenColumns, 'columns', []);
        break;
      case 'customBorders':
        settings.customBorders = [];
        break;
      case 'colWidths':
      case 'rowHeights':
        settings[key] = undefined;
        break;
      default:
        settings[key] = 0;
    }
  });
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
  const mount = hot.rootWrapperElement;
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

  // Mounted inside the instance's own wrapper, where the theme engine keeps its per-instance
  // `<style>` too: a rule in the outer document's `<head>` never reaches a grid rendered inside a
  // shadow root, so `importStyles` was a silent no-op there and left an inert element behind.
  let styleEl = mount.querySelector<HTMLStyleElement>(`style[${STYLE_ATTRIBUTE}="${hot.guid}"]`);

  if (!styleEl) {
    styleEl = doc.createElement('style');
    styleEl.setAttribute(STYLE_ATTRIBUTE, hot.guid);
    mount.prepend(styleEl);
  }

  styleEl.textContent = rules.join('\n');
}

/**
 * Removes the instance-owned stylesheet, if any.
 */
export function removeImportedStyles(hot: HotInstance): void {
  hot.rootWrapperElement?.querySelector(`style[${STYLE_ATTRIBUTE}="${hot.guid}"]`)?.remove();
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
export function applyImportResult(
  hot: HotInstance, result: ImportResult, options: ApplyOptions = { importLayout: true }
): void {
  hot.batch(() => {
    const settings = toSettings(hot, result, options);

    hot.loadData(result.data);

    installImportedStyles(hot, result.styles ?? {});

    if (Object.keys(settings).length > 0) {
      hot.updateSettings(settings);
    }

    // The result is in sheet (physical) coordinates; `setCellMetaObject` and `setCommentAtCell`
    // take visual ones. They agree unless something reordered the rows during `loadData` - a
    // `manualRowMove` array does, in its `afterLoadData` - so every coordinate goes through the
    // index mappers first.
    // A trimmed index (`trimRows`, `trimColumns`) has no visual counterpart and comes back `null`;
    // there is no cell to write to, so the entry is skipped instead of throwing mid-batch.
    const visual = (row: number, col: number): [number, number] | null => {
      const visualRow: number | null = hot.toVisualRow(row);
      const visualCol: number | null = hot.toVisualColumn(col);

      return visualRow === null || visualCol === null ? null : [visualRow, visualCol];
    };

    result.cellsMeta?.forEach(({ row, col, meta }) => {
      const target = visual(row, col);

      if (target) {
        hot.setCellMetaObject(target[0], target[1], meta);
      }
    });

    const comments = hot.getPlugin('comments');

    if (result.comments && comments?.isEnabled()) {
      result.comments.forEach(({ row, col, value }) => {
        const target = visual(row, col);

        if (target) {
          comments.setCommentAtCell(target[0], target[1], value);
        }
      });
    }
  });
}
