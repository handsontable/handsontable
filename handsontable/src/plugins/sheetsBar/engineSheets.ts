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
 * What the build makes of an engine: the tabs in tab order (the opening tab first), and the
 * `sheetName` the grid-level `formulas` asks for when the engine has no such sheet and no `data`
 * was given (`null` otherwise).
 */
export interface EngineWorkbookPlan {
  entries: EngineSheetEntry[];
  missingSheetName: string | null;
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
}

/**
 * Whether two sheet names name one sheet to the engine, which compares them with a plain
 * `toLowerCase()`.
 *
 * @param {string} first A sheet name.
 * @param {string} second A sheet name.
 * @returns {boolean}
 */
function isSameEngineName(first: string, second: string): boolean {
  return first.toLowerCase() === second.toLowerCase();
}

/**
 * Returns `requested`, or `requested (n)` with the lowest `n` from 2 up, whichever no name in `names`
 * takes.
 *
 * @param {string[]} names The names already taken.
 * @param {string} requested The name asked for.
 * @returns {string}
 */
function freeName(names: string[], requested: string): string {
  const isTaken = (name: string) => names.some(taken => isSameEngineName(taken, name));
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
 * Moves the entry at `index` to the front, keeping the order of the others.
 *
 * @param {Array} entries The entries.
 * @param {number} index The index of the entry to move.
 * @returns {Array}
 */
function openingFirst<T>(entries: T[], index: number): T[] {
  return [entries[index], ...entries.slice(0, index), ...entries.slice(index + 1)];
}

/**
 * Plans the tabs of a `sheetsBar: true` workbook whose grid-level `formulas.engine` is a HyperFormula
 * instance holding sheets: one tab per engine sheet, in the engine's order, named and bound after it.
 *
 * With the grid's `data` an array, it becomes one more tab (the data tab), bound to `formulas.sheetName`
 * (an existing engine sheet is then not listed again, its content is replaced by the data on load) or,
 * without one, to a new engine sheet named after the tab (`defaultName`, made free). Without `data`, the
 * opening tab is the `sheetName` sheet when the engine has it, else the `activeSheet` index in engine order,
 * else the first one. The opening tab is always the first tab.
 *
 * @param {object} input The engine, the grid-level `formulas` object, `data`, `activeSheet`, and the
 * default tab name.
 * @returns {object}
 */
export function planEngineWorkbook(input: EngineWorkbookInput): EngineWorkbookPlan {
  const { engine, formulas, data, activeSheet, defaultName } = input;
  const names = engine.getSheetNames();
  const entries: EngineSheetEntry[] = names.map(name => ({
    name,
    data: readSheetData(engine, name),
    settings: boundSettings(formulas, name),
  }));
  const sheetName = typeof formulas.sheetName === 'string' && formulas.sheetName !== ''
    ? formulas.sheetName
    : null;
  const namedIndex = sheetName === null ? -1 : names.findIndex(name => isSameEngineName(name, sheetName));

  if (Array.isArray(data)) {
    let dataTabName = sheetName ?? freeName(names, defaultName);

    if (namedIndex !== -1) {
      dataTabName = names[namedIndex];
      entries.splice(namedIndex, 1);
    }

    return {
      entries: [{ name: dataTabName, data, settings: boundSettings(formulas, dataTabName) }, ...entries],
      missingSheetName: null,
    };
  }

  if (sheetName !== null) {
    return namedIndex === -1
      ? { entries, missingSheetName: sheetName }
      : { entries: openingFirst(entries, namedIndex), missingSheetName: null };
  }

  const activeIndex = Number.isInteger(activeSheet) && (activeSheet as number) >= 0 &&
    (activeSheet as number) < entries.length ? activeSheet as number : 0;

  return { entries: openingFirst(entries, activeIndex), missingSheetName: null };
}
