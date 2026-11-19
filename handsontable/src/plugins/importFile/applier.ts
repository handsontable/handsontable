import { warn } from '../../helpers/console';
import { isPlainObject } from '../../helpers/object';
import type { HotInstance } from '../../core/types';
import type { ImportResult } from './importFile';
import type { HyperFormulaEngine } from '../formulas/engine/types';
import { DROPPED_FEATURES } from '../../utils/xlsxEngine/capabilities';

/**
 * What the applier needs to know about how the result was produced.
 */
export interface ApplyOptions {
  /**
   * Whether the result describes the sheet's layout. When it does, a layout the previous import
   * left on the grid and this result does not carry is cleared.
   */
  importLayout: boolean;
  /**
   * Applies one settings payload of the result. Defaults to the grid's `updateSettings()`; the plugin
   * passes its own, so it can tell its payloads from a listener's.
   */
  updateSettings?: (settings: Record<string, unknown>) => void;
  /**
   * Called with the style rules right after they are installed, before any later step can throw.
   */
  onStylesInstalled?: (styles: Record<string, string>) => void;
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
 * A six-digit lower-case hex color, the only color shape `styles.ts#argbToCssHex` writes.
 */
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/;

/**
 * Answers whether a declaration value is allowed for the property it is keyed under.
 */
type ValueCheck = (value: string) => boolean;

/**
 * The declarations the generated stylesheet accepts, keyed by property: exactly what
 * `styles.ts#fontFillRule` emits, and nothing else. A value is a hex color or one fixed keyword, so
 * it can carry no parenthesis (`url()`, `expression()`, `attr()`), no `}` and no second property.
 * A `Map`, because the property name comes from the declaration string.
 */
const IMPORTED_DECLARATIONS: Map<string, ValueCheck> = new Map([
  ['font-weight', value => value === 'bold'],
  ['font-style', value => value === 'italic'],
  ['text-decoration', value => value === 'underline'],
  ['color', value => HEX_COLOR_PATTERN.test(value)],
  ['background-color', value => HEX_COLOR_PATTERN.test(value)],
]);

/**
 * Checks a declaration block against `IMPORTED_DECLARATIONS`: one or more `property:value` pairs
 * separated by single `;`, every one of them allow-listed.
 */
function isAllowedDeclarationBlock(declarations: string): boolean {
  if (declarations === '') {
    return false;
  }

  return declarations.split(';').every((declaration) => {
    const separator = declaration.indexOf(':');
    const accepts = separator === -1 ? undefined : IMPORTED_DECLARATIONS.get(declaration.slice(0, separator));

    return accepts !== undefined && accepts(declaration.slice(separator + 1));
  });
}

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

  if (result.rowHeights !== undefined) {
    // A workbook's row heights go to `minRowHeights`, not to `rowHeights`: the reader keeps every row's
    // `ht`, also the height the producing app measured (LibreOffice and Google Sheets write one on every
    // row, 20 px for the default 15 pt), and exact `rowHeights` would clip those rows below the theme's
    // row height. The import describes the whole sheet, so it also drops the exact heights the grid held,
    // which would otherwise win over the imported ones row by row.
    settings.minRowHeights = result.rowHeights;
    settings.rowHeights = undefined;
  }

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
 * Whether the grid holds a value for a resettable layout key. The row heights live in two settings,
 * because an import writes `minRowHeights` and the app may have set either.
 *
 * @param {object} current The grid's settings.
 * @param {string} key A resettable layout key.
 * @returns {boolean}
 */
function hasLayoutSetting(current: Record<string, unknown>, key: ResettableLayoutKey): boolean {
  return Boolean(current[key]) || (key === 'rowHeights' && Boolean(current.minRowHeights));
}

/**
 * Clears every resettable layout key the result omits and the grid currently carries. A list
 * setting keeps its options object and empties the list; a count goes to `0`.
 */
function resetOmittedLayout(
  result: ImportResult, current: Record<string, unknown>, settings: Record<string, unknown>
): void {
  RESETTABLE_LAYOUT_KEYS.forEach((key) => {
    if (result[key] !== undefined || !hasLayoutSetting(current, key)) {
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
        settings.colWidths = undefined;
        break;
      case 'rowHeights':
        settings.rowHeights = undefined;
        settings.minRowHeights = undefined;
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
 * pairs separated by `;`, each property listed in `IMPORTED_DECLARATIONS` and each value passing
 * that property's check (a six-digit hex color or one fixed keyword). So no value can carry a `}`
 * that closes the rule it sits in, a parenthesis that opens `url()` or `expression()`, or a second
 * property. A rule that fails either test is dropped and the
 * rejected class names are named in one `warn()`. That is the second layer: `argbToCssHex` in
 * `styles.ts` already refuses a color that is not plain hex, and this is what keeps a future
 * declaration source honest too.
 *
 * An empty (or fully rejected) rule set REMOVES the element rather than leaving an empty one, which
 * is also what clears the previous import's rules when the next workbook carries no styles at all.
 *
 * Returns the rules it installed, by class name, without the rejected ones, so installing what it
 * returned again warns about nothing.
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
export function installImportedStyles(
  hot: HotInstance, styles: Record<string, string>
): Record<string, string> {
  const doc = hot.rootDocument;
  const mount = hot.rootWrapperElement;
  const rules: string[] = [];
  const rejected: string[] = [];
  const installed: Record<string, string> = {};

  Object.entries(styles).forEach(([className, declarations]) => {
    if (!IMPORTED_CLASS_PATTERN.test(className) || !isAllowedDeclarationBlock(declarations)) {
      rejected.push(className);

      return;
    }

    rules.push(`.handsontable tbody > tr > td.${className}{${declarations}}`);
    installed[className] = declarations;
  });

  if (rejected.length > 0) {
    warn(`Imported cell styles were skipped as unsafe to install: ${rejected.join(', ')}.`);
  }

  if (rules.length === 0) {
    removeImportedStyles(hot);

    return installed;
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

  return installed;
}

/**
 * Removes the instance-owned stylesheet, if any.
 */
export function removeImportedStyles(hot: HotInstance): void {
  hot.rootWrapperElement?.querySelector(`style[${STYLE_ATTRIBUTE}="${hot.guid}"]`)?.remove();
}

/**
 * A definition that is one string literal (`="a""b"`, `""` escaping a quote). The two alternatives
 * never match the same text, so the match is linear.
 */
const STRING_LITERAL_DEFINITION = /^="(?:[^"]|"")*"$/;

/**
 * The input HyperFormula takes for a defined name's definition (`=` included). HyperFormula's
 * parser refuses an escaped quote inside a string (`validateFormula('="a""b"')` is `false`), so a
 * definition that is one such string literal is handed over as the text it spells, behind an
 * apostrophe (`'a"b`), which HyperFormula reads as a string constant whatever follows it (an
 * unescaped `=1` or `12` would otherwise read as a formula or a number). Every other definition is
 * returned as it is.
 *
 * @param {string} expression The definition, `=` included.
 * @returns {string}
 */
export function toNamedExpressionInput(expression: string): string {
  const text = expression.slice(2, -1);

  if (!STRING_LITERAL_DEFINITION.test(expression) || !text.includes('""')) {
    return expression;
  }

  return `'${text.replace(/""/g, '"')}`;
}

/**
 * Adds the result's named expressions to the Formulas plugin's engine, at workbook scope, skipping
 * one the engine refuses by now (a name defined since the mapper asked). Nothing is added when the
 * plugin is off. Adding a name is not undoable: the `loadData` that follows resets the
 * grid's history anyway.
 *
 * The names go in between `suspendEvaluation()` and `resumeEvaluation()`. Each `addNamedExpression`
 * on a running engine recalculates it and fires `valuesUpdated`, so a workbook with hundreds of
 * names over volatile formulas (`RAND()`) took seconds; suspended, the engine recalculates once,
 * when it resumes. Not `engine.batch()`: in HyperFormula 3.3 every add inside a batch walks the
 * undo entry the batch has built so far (`clearRedoStack`), which made 54,650 names take 18-25 s
 * where suspending takes about a second, and the import resets the grid's history anyway. The check
 * between the adds still sees the names added before it. The engine evaluates the names when it
 * resumes, and a throw there leaves `resumeEvaluation()`: every name this call added is removed
 * again and `definedNames:unsupported` is reported, and the import goes on. Nothing is suspended
 * when the engine refuses every name. A name the engine refuses here is reported as
 * `definedNames:unsupported` too, the same as one whose add throws: the mapper kept the formulas
 * over it live, so they show `#NAME?` or read the engine's other definition.
 *
 * An engine the caller suspended (`suspendEvaluation()` before the import) gets the names without a
 * suspension of its own, whose end would resume the caller's too; the engine evaluates them when the
 * caller resumes. `Formulas` skips its own batch the same way.
 */
function addNamedExpressions(hot: HotInstance, result: ImportResult): void {
  const formulas = hot.getPlugin('formulas');

  if (!result.namedExpressions?.length || formulas?.enabled !== true || !formulas.engine) {
    return;
  }

  const { engine } = formulas;
  // The mapper asked the engine already, but a `beforeImport` handler, or another grid sharing the
  // engine, may have defined the name since; `addNamedExpression` would then throw mid-batch.
  const canAdd = (name: string, expression: string) =>
    engine.isItPossibleToAddNamedExpression?.(name, expression) === true;
  const namedExpressions = result.namedExpressions
    .map(({ name, formula }) => ({ name, expression: toNamedExpressionInput(`=${formula}`) }));
  const first = namedExpressions.findIndex(({ name, expression }) => canAdd(name, expression));

  if (first !== 0) {
    reportUnsupported(result);
  }

  if (first === -1) {
    return;
  }

  const added: string[] = [];
  const addAll = () => {
    namedExpressions.slice(first).forEach(({ name, expression }, index) => {
      // The first name passed the check above; the rest are checked here, where the check sees the
      // names added before them.
      if (index > 0 && !canAdd(name, expression)) {
        reportUnsupported(result);
      } else if (addOrReport(engine, name, expression, result)) {
        added.push(name);
      }
    });
  };

  if (engine.isEvaluationSuspended?.() === true) {
    addAll();

    return;
  }

  try {
    engine.suspendEvaluation();

    try {
      addAll();
    } finally {
      engine.resumeEvaluation();
    }
  } catch {
    // The engine evaluates the names only when it resumes, and HyperFormula can throw there
    // (`RangeError: Invalid array length` over a huge range). Which name threw is not
    // known, so every name this call added goes, each on its own: a removal recalculates, and may
    // throw again while a name it has not reached yet stays.
    if (engine.isEvaluationSuspended?.() === true) {
      ignoreThrow(() => engine.resumeEvaluation());
    }

    added.forEach(name => ignoreThrow(() => removeListed(engine, name)));
    reportUnsupported(result);
  }
}

/**
 * Runs `operation`, swallowing what it throws: the import goes on whatever the engine does.
 */
function ignoreThrow(operation: () => unknown): void {
  try {
    operation();
  } catch {
    // The engine keeps what it could not undo; the caller reports the name anyway.
  }
}

/**
 * Removes a workbook-scoped name when the engine lists it.
 */
function removeListed(engine: HyperFormulaEngine, name: string): void {
  const lowered = name.toLowerCase();

  if (engine.listNamedExpressions().some(listed => listed.toLowerCase() === lowered)) {
    engine.removeNamedExpression(name);
  }
}

/**
 * Records `definedNames:unsupported` once on the result being applied.
 */
function reportUnsupported(result: ImportResult): void {
  if (Array.isArray(result.dropped) && !result.dropped.includes(DROPPED_FEATURES.definedNamesUnsupported)) {
    result.dropped.push(DROPPED_FEATURES.definedNamesUnsupported);
  }
}

/**
 * Adds one named expression the engine said it takes. On a running engine
 * `addNamedExpression` evaluates the definition at once; on a suspended one (the only way the applier
 * calls it) evaluation waits for the resume, which `addNamedExpressions` guards. The add itself can still throw on an
 * engine that evaluates eagerly or refuses the name late, which failed the whole import with an
 * internal error and left the name half-added. A throw removes the name again when the engine lists
 * it (it did not before: the check passed) and reports `definedNames:unsupported` on the result;
 * the import goes on.
 *
 * @param {object} engine The Formulas plugin's engine.
 * @param {string} name The name.
 * @param {string} expression The definition, `=` included.
 * @param {ImportResult} result The result being applied, whose `dropped` list takes the report.
 * @returns {boolean} Whether the name was added.
 */
function addOrReport(
  engine: HyperFormulaEngine,
  name: string,
  expression: string,
  result: ImportResult,
): boolean {
  try {
    engine.addNamedExpression(name, expression, undefined, undefined);

    return true;
  } catch {
    // An engine that cannot list or remove the name keeps it; the report below still names it.
    ignoreThrow(() => removeListed(engine, name));
    reportUnsupported(result);

    return false;
  }
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
  const update = options.updateSettings ?? ((settings: Record<string, unknown>) => hot.updateSettings(settings));

  hot.batch(() => {
    // First, ahead of every grid change: a name the engine refuses is skipped rather than thrown
    // mid-batch, and the imported formulas over the names are evaluated as `loadData` writes them,
    // so a name the engine lacks at that moment makes them `#NAME?`.
    addNamedExpressions(hot, result);

    const settings = toSettings(hot, result, options);

    // The column types go in BEFORE the data, unlike the layout below: `loadData` runs the source-data
    // validators against whatever `columns` apply at that moment, so the previous grid's types used to
    // judge the imported values and log a false "Source data warning". `columns` is validated against
    // nothing (no row bound), so moving it ahead loses nothing the layout order protects.
    if (settings.columns !== undefined) {
      const columnTypes: Record<string, unknown> = { columns: settings.columns };

      update(columnTypes);
      // Applied once: `loadData` keeps the `columns` option, so passing it again below rebuilt every
      // column's meta a second time on each import (review round 12).
      delete settings.columns;
    }

    hot.loadData(result.data);

    const installed = installImportedStyles(hot, result.styles ?? {});

    options.onStylesInstalled?.(installed);

    if (Object.keys(settings).length > 0) {
      update(settings);
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

    if (result.comments && comments?.enabled) {
      result.comments.forEach(({ row, col, value }) => {
        const target = visual(row, col);

        if (target) {
          comments.setCommentAtCell(target[0], target[1], value);
        }
      });
    }
  });
}
