import { padRowsToWidestRow } from '../formulas/utils';

/**
 * The part of a HyperFormula instance the sheets bar reads to build tabs from its sheets.
 */
export interface EngineSheetsSource {
  getSheetNames: () => string[];
  getSheetId: (name: string) => number | undefined;
  getSheetSerialized: (sheetId: number) => unknown[][];
}

/**
 * A tab built from an engine sheet, or from the grid's `data` bound to an engine sheet.
 */
export interface EngineSheetEntry {
  name: string;
  data: unknown[] | undefined;
  settings: { formulas: Record<string, unknown> };
}

/**
 * What the build makes of an engine: the tabs in the engine's order, the position of the opening tab, the
 * `sheetName` the grid-level `formulas` asks for when the engine has no such sheet and no `data` was given,
 * and the `sheetName` it asks for when that sheet is bound to another grid (each `null` otherwise).
 */
export interface EngineWorkbookPlan {
  entries: EngineSheetEntry[];
  openingIndex: number;
  missingSheetName: string | null;
  boundElsewhereSheetName: string | null;
}

/**
 * The inputs of `planEngineWorkbook()`.
 */
export interface EngineWorkbookInput {
  engine: EngineSheetsSource;
  formulas: Record<string, unknown>;
  data: unknown;
  activeSheet: unknown;
  defaultName: string;
  excludedNames?: string[];
}

/**
 * Whether two sheet names name one sheet to the engine, which compares them without regard to case
 * through a plain `toLowerCase()`. A locale-aware lower case follows the host: on a Turkish host `ITEMS`
 * becomes `ıtems`, so a rename of the engine sheet `items` left `=ITEMS!A1` behind in the host's data.
 *
 * @param {string} first A sheet name.
 * @param {string} second A sheet name.
 * @returns {boolean}
 */
export function isSameSheetName(first: string, second: string): boolean {
  return first.toLowerCase() === second.toLowerCase();
}

/**
 * Returns `requested`, or `requested (n)` with the lowest `n` from 2 up, whichever `isTaken` answers
 * `false` for.
 *
 * @param {string} requested The name asked for.
 * @param {Function} isTaken Whether a name is taken.
 * @returns {string}
 */
export function freeNumberedSheetName(requested: string, isTaken: (name: string) => boolean): string {
  let candidate = requested;
  let counter = 2;

  while (isTaken(candidate)) {
    candidate = `${requested} (${counter})`;
    counter += 1;
  }

  return candidate;
}

/**
 * Returns the tab settings that bind a tab to the engine sheet `sheetName`, on top of the grid-level
 * `formulas` object.
 *
 * @param {object} formulas The grid-level `formulas` setting.
 * @param {string} sheetName The engine sheet name.
 * @returns {object}
 */
function boundSettings(formulas: Record<string, unknown>, sheetName: string) {
  return { formulas: { ...formulas, sheetName } };
}

/**
 * Returns the content of an engine sheet as tab data: every row as long as the widest one, and
 * `undefined` for an empty sheet, so the tab gets the blank data a new sheet gets.
 *
 * @param {object} engine The engine.
 * @param {string} name The engine sheet name.
 * @returns {Array|undefined}
 */
function readSheetData(engine: EngineSheetsSource, name: string): unknown[] | undefined {
  const sheetId = engine.getSheetId(name);
  const rows = typeof sheetId === 'number' ? engine.getSheetSerialized(sheetId) : [];

  return rows.length > 0 ? padRowsToWidestRow(rows.map(row => row.slice())) : undefined;
}

/**
 * Returns the sheet name the grid-level `formulas` object names, or `null` without one.
 *
 * @param {object} formulas The grid-level `formulas` setting.
 * @returns {string|null}
 */
function requestedSheetName(formulas: Record<string, unknown>): string | null {
  return typeof formulas.sheetName === 'string' && formulas.sheetName !== '' ? formulas.sheetName : null;
}

/**
 * Binds the grid's `data` to a tab and opens it: the listed engine sheet at `namedIndex` (its content is
 * replaced on load, and it keeps its place), or else a new tab added last, where the engine adds its sheet.
 *
 * @param {object} input The plan inputs.
 * @param {Array} entries The engine sheet tabs.
 * @param {number} namedIndex The position of the `sheetName` sheet in `entries`, or -1.
 * @returns {object}
 */
function planDataTab(input: EngineWorkbookInput, entries: EngineSheetEntry[], namedIndex: number): EngineWorkbookPlan {
  const { engine, formulas, data, defaultName } = input;

  if (namedIndex !== -1) {
    const { name } = entries[namedIndex];

    entries[namedIndex] = { name, data: data as unknown[], settings: boundSettings(formulas, name) };

    return { entries, openingIndex: namedIndex, missingSheetName: null, boundElsewhereSheetName: null };
  }

  const engineNames = engine.getSheetNames();
  const name = requestedSheetName(formulas)
    ?? freeNumberedSheetName(defaultName, candidate => engineNames.some(taken => isSameSheetName(taken, candidate)));

  entries.push({ name, data: data as unknown[], settings: boundSettings(formulas, name) });

  return { entries, openingIndex: entries.length - 1, missingSheetName: null, boundElsewhereSheetName: null };
}

/**
 * Plans the tabs of a `sheetsBar: true` workbook whose grid-level `formulas.engine` is a HyperFormula
 * instance holding sheets: one tab per engine sheet, in the engine's order, named and bound after it. The
 * `excludedNames` sheets (bound to other grids) are left out. Tabs are never reordered.
 *
 * With the grid's `data` an array, it becomes one more tab (the data tab), bound to `formulas.sheetName`
 * (an existing engine sheet is then not listed again, its content is replaced by the data on load) or,
 * without one, to a new engine sheet named after the tab (`defaultName`, made free), added last; the data tab
 * opens. Without `data`, the opening tab is the `sheetName` sheet when the engine has it, else the
 * `activeSheet` position, else the first one. A `sheetName` that names an excluded sheet gets no tab, with or
 * without `data`: the first tab opens and the name is reported as bound elsewhere.
 *
 * @param {object} input The engine, the grid-level `formulas` object, `data`, `activeSheet`, the default tab
 * name, and the engine sheet names to leave out.
 * @returns {object}
 */
export function planEngineWorkbook(input: EngineWorkbookInput): EngineWorkbookPlan {
  const { engine, formulas, data, activeSheet, excludedNames = [] } = input;
  const names = engine.getSheetNames()
    .filter(name => !excludedNames.some(excluded => isSameSheetName(excluded, name)));
  const entries: EngineSheetEntry[] = names.map(name => ({
    name,
    data: readSheetData(engine, name),
    settings: boundSettings(formulas, name),
  }));
  const sheetName = requestedSheetName(formulas);

  if (sheetName !== null && excludedNames.some(excluded => isSameSheetName(excluded, sheetName))) {
    return { entries, openingIndex: 0, missingSheetName: null, boundElsewhereSheetName: sheetName };
  }

  const namedIndex = sheetName === null ? -1 : names.findIndex(name => isSameSheetName(name, sheetName));

  if (Array.isArray(data)) {
    return planDataTab(input, entries, namedIndex);
  }

  if (sheetName !== null) {
    return {
      entries,
      openingIndex: namedIndex === -1 ? 0 : namedIndex,
      missingSheetName: namedIndex === -1 ? sheetName : null,
      boundElsewhereSheetName: null,
    };
  }

  const openingIndex = Number.isInteger(activeSheet) && (activeSheet as number) >= 0 &&
    (activeSheet as number) < entries.length ? activeSheet as number : 0;

  return { entries, openingIndex, missingSheetName: null, boundElsewhereSheetName: null };
}
