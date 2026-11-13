import { BasePlugin, type PluginRestoreContext } from '../base';
import { staticRegister } from '../../utils/staticRegister';
import { deprecatedWarnOnce, error, warn, warnOnce } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { isNumeric } from '../../helpers/number';
import { hasOwnProperty, isObject, isPlainObject } from '../../helpers/object';
import { isDefined, isUndefined } from '../../helpers/mixed';
import {
  getRegisteredHotInstanceList,
  getRegisteredHotInstances,
  setupEngine,
  setupSheet,
  unregisterEngine,
} from './engine/register';
import {
  areSheetContentsEqual,
  coalesceIndexesToSpans,
  escapeTextValue,
  getDateFromExcelDate,
  getDateInHfFormat,
  getDateInHotFormat,
  getTimeFromHfTimeFraction,
  hasContentPast,
  insertEmptyRows,
  isDate,
  isDateValid,
  isEngineEscapedValue,
  isFormula,
  isPreservedText,
  normalizeValueForFormulaEngine,
  padRowsToWidestRow,
  setSheetSnapshotCell,
  trimTrailingEmptyCells,
  unescapeEngineBoundValue,
  unescapeFormulaExpression,
  widestRowLength,
} from './utils';
import {
  LINK_CLASS_NAME,
  LINK_SCHEMES,
  LINK_SCHEME_CLASS_NAME,
  createLinkElement,
  normalizeSchemesWithFallback,
  resolveLinkUrl,
  unwrapLinks,
  wrapCellContent,
  type LinkScheme,
  type LinkTarget,
} from '../../utils/cellLinks';
import { fastInnerText } from '../../helpers/dom/element';
import { getEngineSettingsWithOverrides, haveEngineSettingsChanged } from './engine/settings';
import {
  beginHeldEngineWrite,
  beginHeldSheetWrite,
  collectHeldDependents,
  flushEvaluationHold,
  flushEvaluationHoldNow,
  isEvaluationHeld,
  isEvaluationHolder,
  joinEvaluationHold,
  leaveEvaluationHold,
  leaveResumedHolders,
  recordHeldWrite,
  runAfterEvaluationFlush,
  runEngineBatch,
  settleEvaluationHold,
  takeHeldRecalculations,
  type HeldRecalculation,
} from './engine/evaluationHold';
import { isArrayOfArrays } from '../../helpers/data';
import { toUpperCaseFirst } from '../../helpers/string';
import { getValueGetterValue } from '../../utils/valueAccessors';
import { quoteUnreadableSheetNames, canReadSheetNameUnquoted } from '../../utils/formulaReferences';
import { Hooks } from '../../core/hooks';
import IndexSyncer from './indexSyncer';
import {
  deferPaintToPluginEngineWrite,
  holdPluginEngineWritePaints,
  isPluginEngineProbe,
  withPluginEngineProbe,
  withPluginEngineWrite,
} from './indexSyncer/pluginEngineWrite';
import { listEngineElements } from './indexSyncer/engineElements';
import type AxisSyncer from './indexSyncer/axisSyncer';
import type { IndexMapper } from '../../translations';
import type { EngineOrder } from './indexSyncer/axisSyncer';
import type { HyperFormulaEngine, FormulasCellAddress, FormulasCellRange } from './engine/types';
import type { CellChange, CellValue } from '../../settings';
import type { RangeType } from '../../core/types';
import type CellRange from '../../3rdparty/walkontable/src/cell/range';
import { isCellRangeLike } from '../../3rdparty/walkontable/src/cell/range';
import type CellCoords from '../../3rdparty/walkontable/src/cell/coords';
import { LICENSE } from './feature.generated';

/**
 * Represents a cell change from the HyperFormula engine.
 */
interface HFCellChange {
  address?: {
    sheet?: number;
    row?: number;
    col?: number;
  };
  newValue?: unknown;
}

/**
 * Narrow an arbitrary value to a HyperFormula cell change shape.
 *
 * @param {unknown} value Value to check.
 * @returns {boolean} `true` if the value matches the cell change shape.
 */
function isHFCellChange(value: unknown): value is HFCellChange {
  return typeof value === 'object' && value !== null;
}

/**
 * @param {Array} changes The engine's change list.
 * @param {number} sheetId The engine id of a sheet.
 * @returns {boolean} `true` when a change in the list is a cell of that sheet.
 */
function changesNameSheet(changes: unknown[], sheetId: number): boolean {
  return changes.some(change => isHFCellChange(change) && change.address?.sheet === sheetId);
}

/**
 * Counts every descendant of a NestedRows data object.
 *
 * @param {object} row NestedRows data object.
 * @returns {number} Number of descendants in the flattened subtree.
 */
function countNestedRowsDescendants(row: Record<string, unknown>): number {
  const children = row.__children;

  if (!Array.isArray(children)) {
    return 0;
  }

  let descendants = 0;

  for (const child of children) {
    if (isPlainObject(child)) {
      descendants += 1 + countNestedRowsDescendants(child);
    }
  }

  return descendants;
}

/**
 * The visual-coordinate rectangle of a `moveCells` operation, captured in `beforeMoveCells`.
 *
 * The `afterMoveCells` listener works off this instead of its hook arguments: `Hooks.run` threads a
 * listener's non-`undefined` return value into the next listener's first argument, so a global
 * listener returning a truthy non-range would otherwise replace `sourceRange` for the plugin.
 */
interface MoveCellsRect {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  targetRow: number;
  targetCol: number;
  isCopy: boolean;
}

/**
 * A `setDataAtCell()` / `setDataAtRowProp()` change set the Core has not applied to the source data
 * yet (see `Formulas#changesAwaitingApply`). `writeCount` and `sheetId` are taken in
 * `afterSetDataAtCell`, when the changes the Core cannot reject are written into the engine.
 */
interface ChangeSetAwaitingApply {
  writeCount: number;
  /**
   * `#refusedSheetWriteCount` when the set was recorded.
   */
  refusedWriteCount: number;
  /**
   * The number of loads the plugin did not make itself (`#foreignLoadCount`) when the set was written.
   */
  foreignLoadCount: number;
  sheetId: number | null;
  /**
   * The changes `afterSetDataAtCell` did not write: the ones the Core can reject (a validator and
   * `allowInvalid: false`), and the ones past the last row or column. `beforeChangeRender` writes those
   * still in the set's array once the Core applies it, so a change a validator rejected never reaches the
   * engine.
   */
  deferredChanges: Set<CellChange>;
  /**
   * `true` when the set holds a change the Core can reject: only then are the dependents validated at the
   * apply outside the undo step (`#validateDependentCellsUnrecorded()`).
   */
  hasRejectableChange: boolean;
  /**
   * The cells the early write recalculated that a deferred change recalculates too, validated at the apply
   * (see `#splitDependentsOfDeferred()`).
   */
  heldDependents: unknown[];
  /**
   * The changes of the set the Core can reject. The Core splices a rejected one out of the set's array, so
   * the apply tells a rejection by a change missing from it.
   */
  rejectableChanges: CellChange[];
  /**
   * The cells of the set written at once that read a deferred cell of the set (`#findReadersOfDeferred()`)
   * and got the validation probe's result (`#probeValidationValues()`). The Core validated them by that
   * result, with the deferred cells' new values, so the apply leaves them out of the dependent validation,
   * unless a deferred change was rejected: they then hold a value computed from the old content, and the
   * apply validates them again. A reader without a probe result is not here: it stays a held dependent.
   */
  readersOfDeferred: { address: FormulasCellAddress; answer: ReaderAnswer }[];
  /**
   * The cells the first write really reached, with the value each held before it. A sheet switch
   * before the Core applies the set drops it and restores exactly these (`#restoreSwitchedAwaySheet`): by then the
   * grid maps its indexes onto the switched-to sheet's data, so mapping the changes again names
   * other cells.
   */
  writtenCells: WrittenCell[];
}

/**
 * The value `beforeValidate` hands a validator for a change still waiting for it (see
 * `Formulas#validationValues`): the formula result the validation probe read, or the change's own value
 * when `hasResult` is `false`.
 */
interface ValidationValue {
  source: string | undefined;
  /**
   * The change's own value, which tells two changes of one set to the same cell apart.
   */
  changeValue: unknown;
  hasResult: boolean;
  result: unknown;
  /**
   * Set for the entry of a reader of a deferred cell (`ProbeReader`): how the Core's validation of the
   * change answered.
   */
  readerAnswer?: ReaderAnswer;
}

/**
 * How the validator of a reader of a deferred cell (`Formulas#findReadersOfDeferred`) answered the Core's
 * validation of its change: `answered` once `afterValidate` fired for it, and `isSyncChecked` /
 * `wasAnsweredAtCheck` once a check queued behind the validator's own microtask ran. The Core runs every
 * validator in a microtask, so a validator that answers in its call has answered by then. `value` and
 * `source` are what `beforeValidate` handed the validator, which `afterValidate` receives too.
 */
interface ReaderAnswer {
  value: unknown;
  source: string | undefined;
  answered: boolean;
  isSyncChecked: boolean;
  wasAnsweredAtCheck: boolean;
}

/**
 * One cell of the validation probe (`Formulas#probeValidationValues`): the change, the value a write puts
 * into the engine, the engine address, and the `beforeValidate` entry it fills.
 */
interface ProbeWrite {
  rejectable: RejectableChange;
  value: unknown;
  address: FormulasCellAddress;
  entry: ValidationValue;
}

/**
 * A cell of the set written at once that reads a deferred cell of the set (`Formulas#findReadersOfDeferred`):
 * the probe does not write it (the engine holds it already), it reads its result into `entry`.
 */
interface ProbeReader {
  visualRow: number;
  visualColumn: number;
  address: FormulasCellAddress;
  entry: ValidationValue;
}

/**
 * Builds the key that names an engine cell.
 *
 * @param {object} address The engine address.
 * @returns {string}
 */
function toCellKey({ sheet, row, col }: { sheet?: number | null; row?: number; col?: number }) {
  return `${sheet}:${row}x${col}`;
}

/**
 * Drops the repeated cells of an engine change list, keeping the first of each.
 *
 * @param {object[]} changes The engine change list.
 * @returns {object[]}
 */
function uniqueCellChanges(changes: unknown[]) {
  const seen = new Set<string>();

  return changes.filter((change) => {
    const address = isHFCellChange(change) ? change.address : undefined;

    if (!address) {
      return true;
    }

    const key = toCellKey(address);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

/**
 * Answers whether an engine cell is a precedent `getCellPrecedents()` reported, or inside one.
 *
 * @param {object} address The engine address.
 * @param {object} precedent A precedent cell or range.
 * @returns {boolean}
 */
function isAddressInPrecedent(address: FormulasCellAddress, precedent: FormulasCellAddress | FormulasCellRange) {
  if ('start' in precedent) {
    return precedent.start.sheet === address.sheet &&
      address.row >= precedent.start.row && address.row <= precedent.end.row &&
      address.col >= precedent.start.col && address.col <= precedent.end.col;
  }

  return precedent.sheet === address.sheet && precedent.row === address.row && precedent.col === address.col;
}

/**
 * A change the Core can reject (its cell has a validator and `allowInvalid: false`), with the grid
 * coordinates `afterSetDataAtCell` resolved for it.
 */
interface RejectableChange {
  change: CellChange;
  visualRow: number;
  visualColumn: number;
  physicalRow: number;
  physicalColumn: number;
}

/**
 * One cell a change set's first engine write reached: its engine address (sheet included) and the
 * grid coordinates and value it had then.
 */
interface WrittenCell {
  address: { row: number; col: number; sheet: number | null };
  physicalRow: number;
  physicalColumn: number;
  visualRow: number;
  visualColumn: number;
  oldValue: unknown;
  /**
   * What the engine held in the cell right after the first write (`getCellSerialized()`), or `undefined`
   * when it could not be read. A restore skips a cell that holds anything else by then: a newer write
   * reached it.
   */
  writtenContent: unknown;
}

/**
 * The object form of the `formulas.hyperlinks` setting.
 */
export interface FormulasHyperlinkSettings {
  target?: LinkTarget;
  schemes?: LinkScheme[];
}

/**
 * The order an engine holds one of its sheets in, as `exportEngineOrder()` reports it while the sheet
 * is bound, for `runWithEngineOrderHeld()` to take over when the sheet is bound again. `content` is the
 * engine sheet's content in that order, for a sheet the next binding does not find in the engine (an
 * engine built from the `HyperFormula` class is destroyed when the plugin is disabled).
 */
export interface FormulasEngineSheetOrder {
  readonly engine: HyperFormulaEngine;
  readonly sheetId: number;
  readonly rowOrder: EngineOrder;
  readonly columnOrder: EngineOrder;
  readonly content?: unknown[][];
}

/**
 * What `disablePlugin()` keeps of a grid built from an engine sheet, for the next enable (see
 * `Formulas#sheetBuiltBindingAtDisable`).
 */
interface SheetBuiltBinding {
  readonly engine: HyperFormulaEngine;
  readonly sheetId: number;
  readonly rowCount: number;
  readonly columnCount: number;
  readonly order: FormulasEngineSheetOrder | null;
  readonly snapshot: unknown[][] | null;
  readonly foreignSheetChange: boolean;
}

/**
 * The expected shape of the `formulas` plugin settings object (the non-boolean form).
 */
interface FormulasPluginSettings {
  sheetName?: string;
  engine: unknown;
  hyperlinks?: boolean | FormulasHyperlinkSettings;
  batchEvaluation?: boolean;
}

/**
 * Narrow the raw `formulas` setting value to the object form.
 *
 * @param {unknown} value Raw setting value.
 * @returns {boolean} `true` when the value is a settings object.
 */
function isFormulasSettingsObject(value: unknown): value is FormulasPluginSettings {
  return typeof value === 'object' && value !== null;
}

/**
 * Tells whether an `engine` setting hands over the engine class (`HyperFormula` or `{ hyperformula }`),
 * from which the plugin builds an engine of its own, rather than an engine instance.
 *
 * @param {unknown} engine The `engine` setting.
 * @returns {boolean}
 */
function isEngineClassSetting(engine: unknown): boolean {
  return typeof engine === 'function'
    || (isObject(engine) && typeof (engine as { hyperformula?: unknown }).hyperformula === 'function');
}

/**
 * Narrow a value to an object with a `value` property.
 *
 * @param {unknown} candidate Value to check.
 * @returns {boolean} `true` when the value is an object exposing a `value` property.
 */
function hasValueProperty(candidate: unknown): candidate is { value: unknown } {
  return typeof candidate === 'object' && candidate !== null && 'value' in candidate;
}

/**
 * Reconstructs the visual `(row, column)` pairs `CopyPaste#getRangedData` walks to build the `data`
 * array `beforeCopy`/`beforeCut` receive, from the same `coords` argument those hooks receive:
 * `data[i][j]` corresponds to `rows[i]`/`columns[j]`. A distinct-rows array and a distinct-columns
 * array, each built by visiting every range in order and keeping only the first occurrence of each
 * index - the same shape `normalizeRanges()` in `../copyPaste/copyableRanges.ts` produces, kept as a
 * local copy rather than an import to avoid a cross-plugin dependency on that plugin's internal
 * module. Keep the two in sync if that algorithm changes.
 *
 * @param {RangeType[]} coords The ranges passed to `beforeCopy`/`beforeCut`.
 * @returns {{rows: number[], columns: number[]}} The distinct rows and columns, in `data` order.
 */
function copiedRowsAndColumns(coords: RangeType[]): { rows: number[]; columns: number[] } {
  const rows: number[] = [];
  const columns: number[] = [];
  const seenRows = new Set<number>();
  const seenColumns = new Set<number>();

  coords.forEach(({ startRow, endRow, startCol, endCol }) => {
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);

    for (let row = minRow; row <= maxRow; row++) {
      if (!seenRows.has(row)) {
        seenRows.add(row);
        rows.push(row);
      }
    }

    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    for (let col = minCol; col <= maxCol; col++) {
      if (!seenColumns.has(col)) {
        seenColumns.add(col);
        columns.push(col);
      }
    }
  });

  return { rows, columns };
}

export const PLUGIN_KEY = 'formulas';
// `maxRows` and `maxColumns` no longer reach the engine at all (GH #10672), but they stay here:
// `updatePlugin` also creates or switches the sheet, and dropping them would skip that.
export const SETTING_KEYS = ['maxRows', 'maxColumns', 'language'];
export const PLUGIN_PRIORITY = 260;
const SHORTCUTS_GROUP = PLUGIN_KEY;

Hooks.getSingleton().register('afterNamedExpressionAdded');
Hooks.getSingleton().register('afterNamedExpressionRemoved');
Hooks.getSingleton().register('afterSheetAdded');
Hooks.getSingleton().register('afterSheetRemoved');
Hooks.getSingleton().register('afterSheetRenamed');
Hooks.getSingleton().register('afterFormulasValuesUpdate');

// Handsontable's own `auto` writes (spare rows, padding) never reach the engine.
const isBlockedSource = (source: unknown) => source === 'auto';

// Undo and redo put back a recorded grid state. The row and column changes they replay are not
// followed one by one: the engine would shift formula references a second time, and a `#REF!` it
// wrote cannot be turned back into the reference it replaced. Once the restore is done, the plugin
// writes the restored cells into the engine or, when the rows or columns changed, reloads its sheet
// from the restored source data – see `Formulas#restoreState()`.
const isRestoreSource = (source: unknown) => source === 'UndoRedo.undo' || source === 'UndoRedo.redo';

/**
 * The engine's sheet as it was, for a state the source data cannot rebuild: once rows or columns are
 * moved or sorted, the engine rewrites formula references in its own order and the source data keeps
 * the text written in the physical one.
 */
/**
 * How a write of this grid to the engine keeps the snapshot of the bound sheet in step (see
 * `Formulas#trackOwnEngineWrite()`): `'cells'` refreshes the cells it changed, `'structural'` reads the sheet again,
 * `'resets'` drops the snapshot, so the next reload loads the sheet and takes a new one.
 */
type OwnEngineWriteKind = 'cells' | 'structural' | 'resets';

/**
 * The cells of the cell writes of this grid made while a `batchEvaluation` hold kept the engine suspended (see
 * `Formulas#holdTrackedCells()`).
 */
interface HeldSnapshotCells {
  /**
   * The engine the writes went to.
   */
  engine: HyperFormulaEngine;
  /**
   * The sheet the grid was bound to.
   */
  sheetId: number;
  /**
   * The snapshot the writes were made against.
   */
  snapshot: unknown[][];
  /**
   * The engine addresses the writes set themselves (`row,col`).
   */
  setCells: Set<string>;
  /**
   * The engine addresses the engine reported changed, during the writes or by the resume that ends them.
   */
  changedCells: Array<{ row: number; col: number }>;
}

/**
 * How a reload that keeps the grid's order reads one axis of the sheet back (see `Formulas#planReloadAxis()`).
 */
interface ReloadAxis {
  /**
   * The engine order the reload takes over.
   */
  order: EngineOrder;
  /**
   * The physical index of each engine line, to read the sheet back in physical order with, or `null` to read
   * the axis as the engine holds it.
   */
  elements: number[] | null;
  /**
   * The grid's order to put back after the load; empty for the identity.
   */
  previousSequence: number[];
  /**
   * Whether the recorded order no longer describes the engine sheet, so the axis is read as the engine holds
   * it and the grid shows it in that order.
   */
  stale: boolean;
}

interface EngineSheetSnapshot {
  readonly content: unknown[][];
  readonly rowOrder: EngineOrder;
  readonly columnOrder: EngineOrder;
}

/**
 * What UndoRedo records for this plugin: a version that changes whenever the engine's rows or columns
 * are added, removed or reordered, a version that changes whenever a cell write reaches it, and – while
 * the engine's order is not the physical one or the source data holds stale formulas – the engine's
 * sheet itself.
 */
interface FormulasUndoState {
  readonly structureVersion: number;
  readonly dataVersion: number;
  readonly engineSheet: EngineSheetSnapshot | null;
  /**
   * `true` when the source data held formula text the engine had rewritten (`#sourceHasStaleFormulas`)
   * at capture. Only a state that carries `engineSheet` can be stale, because the source data cannot
   * rebuild its sheet.
   */
  readonly sourceHasStaleFormulas: boolean;
  /**
   * The formulas outside this grid's sheet that the step's engine calls rewrote.
   */
  readonly peerRewrites: readonly PeerRewrite[];
}

/**
 * A formula outside this grid's sheet – a cell of another sheet on the same engine, or a named
 * expression – that the engine rewrote because this grid's rows, columns or cells moved. Restoring
 * this grid's sheet never touches it, so the step records its text before and after the change.
 */
type PeerRewrite = {
  readonly kind: 'cell';
  readonly sheet: number;
  readonly row: number;
  readonly col: number;
  readonly before: string;
  after: string | undefined;
} | {
  readonly kind: 'name';
  readonly name: string;
  readonly scope: number | undefined;
  readonly before: string;
  after: string | undefined;
};

/**
 * Tells whether a value is a state `Formulas#captureState()` returned.
 *
 * @param {*} value The value to test.
 * @returns {boolean}
 */
function isFormulasUndoState(value: unknown): value is FormulasUndoState {
  return typeof value === 'object' && value !== null &&
    'structureVersion' in value && typeof value.structureVersion === 'number' &&
    'dataVersion' in value && typeof value.dataVersion === 'number';
}

// Maximum number of `[startIndex, amount]` spans passed to a single variadic engine
// `removeRows`/`removeColumns` call. An unbounded argument spread could overflow the call stack.
const REMOVAL_SPANS_CHUNK_SIZE = 1000;

/**
 * The cell meta keys that decide the value the engine reads for a cell: the ones the built-in value getters
 * read (directly, or through the cell type that sets the getter), and `preserveTextValue`, which the
 * engine-bound escaping reads. A `cell` option entry setting one of them can change that value.
 */
const VALUE_GETTER_META_KEYS = ['type', 'valueGetter', 'source', 'sourceLabel', 'preserveTextValue'];

// A formula whose reference the engine could not keep. Only operations that remove or relocate
// cells may put one into the source data - see `#syncFormulasToSourceData`.
const REF_ERROR_PATTERN = /#REF!/;

// Class name of the anchor that wraps the content of a HYPERLINK cell, next to the shared ht-link.
// It is also the marker that keeps the wrapping idempotent when a renderer leaves the previous DOM in place.
const HYPERLINK_CLASS_NAME = 'ht-hyperlink';

// `warnOnce` key for a `HYPERLINK` URL refused by the protocol allowlist. Warning per cell would
// flood the console on every render pass.
const HYPERLINK_WARN_KEY = 'formulas-hyperlink-refused';

// `warnOnce` key for an invalid `formulas.hyperlinks` object-form setting (an unrecognized `target`
// or `schemes` entry). One warning per `#refreshHyperlinksSetting()` call, not per cell.
const HYPERLINK_SETTINGS_WARN_KEY = 'formulas-hyperlinks-settings';

/**
 * The column space of the source data array the engine was fed (see `Formulas#readSyncedColumnSpace`):
 * physical columns, visual columns, or, for array rows a `columns` list projects, the array index of each
 * visual column (`null` for one bound to no source index).
 */
type SyncedColumnSpace = 'physical' | 'visual' | Array<number | null>;

/**
 * Tells whether a value is a `Date`, also one from another window.
 *
 * @param {*} value The value.
 * @returns {boolean}
 */
function isDateObject(value: unknown): value is Date {
  return Object.prototype.toString.call(value) === '[object Date]';
}

/**
 * Returns the value a record of what the engine was fed keeps for a cell. A `Date` is copied: the host can change
 * the one it holds in place (`setFullYear()`), and a record that kept the same object would change with it.
 *
 * @param {*} value The value the engine got.
 * @returns {*}
 */
function toSyncedValue(value: unknown): unknown {
  return isDateObject(value) ? new Date(value.getTime()) : value;
}

/**
 * Tells whether a recorded cell holds the value read now. A missing cell reads as `null`, the way the engine
 * reads it. `NaN` equals itself (`Object.is()`), a `Date` equals one of the same time, and any other object
 * counts as changed, because the host can change it in place.
 *
 * @param {*} recorded The recorded value.
 * @param {*} value The value read now.
 * @returns {boolean}
 */
function areSyncedValuesEqual(recorded: unknown, value: unknown): boolean {
  if (typeof value === 'object' && value !== null) {
    return isDateObject(recorded) && isDateObject(value) && Object.is(recorded.getTime(), value.getTime());
  }

  // The strict check first: it answers for almost every cell, and reading a type tag per cell made the comparison
  // of a 10,000 x 50 sheet take 44 ms instead of 3 ms.
  return recorded === value || Object.is(recorded ?? null, value ?? null);
}

/**
 * Tells whether two rows of a source data array hold the same values. A missing cell reads as `null`, the way
 * the engine reads it, so a row the grid created (`[]`) equals a row of `null` values.
 *
 * @param {Array} recorded The recorded row.
 * @param {Array} row The row read now.
 * @returns {boolean}
 */
function areSyncedRowsEqual(recorded: unknown[] | undefined, row: unknown[]): boolean {
  const recordedRow = recorded ?? [];
  const length = Math.max(recordedRow.length, row.length);

  for (let column = 0; column < length; column += 1) {
    if (!areSyncedValuesEqual(recordedRow[column], row[column])) {
      return false;
    }
  }

  return true;
}

/**
 * Copies every `Date` of a source data array the engine was fed in place (`toSyncedValue()`), so the array can
 * be kept as the record of what the engine holds.
 *
 * @param {Array<Array<*>>} rows The array.
 * @returns {Array<Array<*>>}
 */
function toSyncedRows(rows: unknown[][]): unknown[][] {
  rows.forEach((row) => {
    for (let column = 0; column < row.length; column += 1) {
      if (typeof row[column] === 'object' && row[column] !== null) {
        row[column] = toSyncedValue(row[column]);
      }
    }
  });

  return rows;
}

/**
 * This plugin allows you to perform Excel-like calculations in your business applications. It does it by an
 * integration with our other product, [HyperFormula](https://github.com/handsontable/hyperformula/), which is a
 * powerful calculation engine with an extensive number of features.
 *
 * To test out HyperFormula, see [this guide](@/guides/formulas/formula-calculation/formula-calculation.md#available-functions).
 *
 * With the `batchEvaluation` setting of the [`formulas`](@/api/options.md#formulas) option set to `true`, the
 * writes the grid makes while its execution is suspended are recalculated by HyperFormula once, when the
 * execution resumes, instead of once per write. {@link Core#batch} is the way to get that saving, because it
 * suspends rendering too.
 *
 * A read of a formula cell through the grid recalculates first, so reads stay fresh, and so does every
 * render. For that reason {@link Core#batchExecution}, or a {@link Core#suspendExecution} and
 * {@link Core#resumeExecution} pair, saves nothing when each write renders.
 *
 * After a write and until the next grid read or the resume, a direct HyperFormula read
 * (`engine.getCellValue()`) throws "Computations are suspended". That includes a grid that shares the engine
 * and did not opt in.
 *
 * @plugin Formulas
 * @class Formulas
 */
export class Formulas extends BasePlugin {
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Returns the license token of the plugin, its display name, where it is checked, and the tokens it
   * requires.
   */
  static get LICENSE() {
    return LICENSE;
  }

  /**
   * Returns the list of settings keys observed by the plugin for configuration changes.
   */
  static get SETTING_KEYS() {
    return [
      PLUGIN_KEY,
      ...SETTING_KEYS
    ];
  }

  /**
   * Flag used to bypass hooks in internal operations.
   *
   * @private
   * @type {boolean}
   */
  #internalOperationPending = false;

  /**
   * Whether `HYPERLINK` cells are rendered as links. Mirrors the `hyperlinks` plugin setting, cached
   * because it is read once per rendered cell.
   */
  #hyperlinksEnabled = false;

  /**
   * Where a `HYPERLINK` anchor opens. Read from the `hyperlinks` object form, `_blank` otherwise.
   */
  #hyperlinkTarget: LinkTarget = '_blank';
  /**
   * The schemes a `HYPERLINK` cell may link to. A subset of the fixed allowlist, never wider.
   */
  #hyperlinkSchemes: readonly LinkScheme[] = normalizeSchemesWithFallback(undefined, LINK_SCHEMES);

  /**
   * The cells rendered as hyperlinks, by physical coordinates (`row,column`). A `HYPERLINK` whose
   * URL argument lives in another cell keeps its label, so the engine reports no value change for
   * it; these cells are marked changed on every engine update instead, so a `renderMode: 'onChange'`
   * cell rebuilds its `href`. The set is emptied whenever the physical indexes can shift or the
   * rendered cells are all repainted anyway (data load, structural change, plugin disable); the next
   * render fills it again.
   */
  #hyperlinkCells = new Set<string>();

  /**
   * Whether formula cells display their formula text (`showFormulas()`) instead of their
   * calculated value. Deliberately NOT read by `#onModifyData`: this is display-only, matching
   * Excel/Sheets, so `getDataAtCell()` and everything reading through it - sorting, filtering,
   * validation - stay on the calculated value. Read instead by `#onAfterRenderer` (paints the
   * formula text over the rendered value, and stops a `HYPERLINK` cell from rendering as a link
   * while its formula text is shown) and `#onBeforeCopyOrCut` (rewrites what's copied/cut to match).
   * The source-data read path (`#onModifySourceData`) already reports the formula text regardless of
   * this flag, which is what lets the cell editor show it whether or not this mode is on.
   */
  #showFormulasFlag = false;

  /**
   * How many `runWithEngineOrderHeld()` calls are running. While it is above zero the axis syncers keep
   * the grid's order changes from the engine, an index syncer created by an enable in between included.
   *
   * @type {number}
   */
  #engineOrderHolds = 0;

  /**
   * The engine sheet the load inside the running `runWithEngineOrderHeld()` call takes over instead of
   * writing the loaded data into it, and whether a load did. `null` outside such a call.
   */
  #pendingAdoption: { order: FormulasEngineSheetOrder; adopted: boolean } | null = null;

  /**
   * The engine order of both axes the running load takes over, while `#reloadKeepingOrder()` reloads the
   * sheet the order syncers are synced with; `null` outside such a load. The plugin's own `afterLoadData`
   * takes it over, so the moves the move plugins re-apply in the same hook are held and not sent.
   */
  #reloadEngineOrder: { row: EngineOrder; column: EngineOrder } | null = null;

  /**
   * What `disablePlugin()` keeps of a grid built from an engine sheet without `data`, for the next `enablePlugin()`
   * to bind the sheet again as the grid left it (`#setupSyncEndpointForSheetBuiltGrid()`), or `null` for a grid built
   * with `data` or bound to no sheet: the engine sheet; the grid's row and column counts; the order the engine held
   * the sheet in (`exportEngineOrder()`, `null` while both axes are physical); and the reload snapshot
   * (`#loadedSheetContent`, the same array the grid held, not a copy) with `#foreignSheetChange`. One copy of the
   * sheet is kept while the plugin is off: the snapshot, from which the enable rebuilds the content of a sheet it adds
   * back (`#sheetBuiltContent()`). The disable reads the live sheet once when an order is stored, and only when it
   * differs from the snapshot does the order carry it as its content (`#keepSheetBuiltBinding()`). Cleared by the next enable and
   * by `destroy()`.
   */
  #sheetBuiltBindingAtDisable: SheetBuiltBinding | null = null;

  /**
   * The engine order each sheet this grid left with `switchSheet()` (or a reload that bound another sheet) was in,
   * by sheet id, while it was not physical on an axis, with the engine and the sheet's dimensions then. A later
   * load of that sheet reads it back in physical order through the order and takes the order over
   * (`#takeLeftSheetOrder()`), so the move plugins' arrays, re-applied on `afterLoadData`, land on the order the
   * engine already holds. Cleared on enable, on disable and by `destroy()`.
   */
  #leftSheetOrders = new Map<number, {
    engine: HyperFormulaEngine;
    row: EngineOrder;
    column: EngineOrder;
    height: number;
    width: number;
  }>();

  /**
   * The `formulas.sheetName` setting the binding last followed (see `#requestedSheetName()`), or
   * `undefined` before the first one.
   *
   * @type {string|undefined}
   */
  #followedSheetNameSetting: string | undefined = undefined;
  /**
   * Whether the engine was built from an engine class the settings handed over, rather than passed as an
   * instance (see `#followEngineChange()`).
   *
   * @type {boolean}
   */
  #engineBuiltFromClass = false;

  /**
   * Whether the engine reads a sheet name without quotes, per name (`#canReadUnquoted`). Cleared on
   * enable, when the engine can change.
   *
   * @type {Map<string, boolean>}
   */
  #unquotedSheetNames = new Map<string, boolean>();

  /**
   * Flag needed to mark if Handsontable was initialized with no data.
   * (Required to work around the fact, that Handsontable auto-generates sample data, when no data is provided).
   *
   * @type {boolean}
   */
  #hotWasInitializedWithEmptyData = false;

  /**
   * How many source rows the grid held the last time the sheet was written or reloaded - a scan,
   * a rejected-write clear, an `afterLoadData` write, or the empty-data reload - or `null` before
   * the first one. Recorded by `#recordSyncedLayout()`.
   *
   * Compared against the count the settings update ends on, which is what tells a row count that
   * moved after the last write apart from one the write already saw.
   *
   * @type {number|null}
   */
  #sourceRowCountAtLastSync: number | null = null;

  /**
   * Which engine sheet the count above describes, or `null` before the first resync.
   *
   * Compared alongside the count so that a sheet switch performed by this plugin during the same
   * `updateSettings()` is not mistaken for another plugin reshaping the grid.
   *
   * @type {number|null}
   */
  #sheetIdAtLastSync: number | null = null;

  /**
   * Whether `afterCellMetaReset` fired during a settings update and left the sheet resync for
   * later, instead of scanning the source data mid-update.
   *
   * The Core fires `afterCellMetaReset` before the plugins update, so a scan there describes a
   * layout a plugin may be about to replace. The owed resync runs once, from whichever comes
   * first: the late `afterUpdateSettings` listener (`#onAfterUpdateSettingsRowCount`), the next
   * draw (`#onBeforeRender`), or the first engine read a default-order listener makes
   * (`#onModifyData`, `#onModifySourceData`). Binding another sheet cancels it
   * (`#updateSheetNameAndSheetId`), because the engine is then authoritative for the grid. A
   * throw from the scan clears it without retry - see `#resyncSheet` (DEV-3006).
   *
   * @type {boolean}
   */
  #sheetResyncPending = false;

  /**
   * Counts the full sheet writes from the source data (`#writeSheet`). A change set compares it
   * across its validation window to learn whether a full write replaced the sheet in between. The
   * emptying write of `#clearRejectedSheet` is not counted: writing a change back into a sheet the
   * engine could not hold would leave it holding that one cell.
   *
   * @type {number}
   */
  #sheetWriteCount = 0;

  /**
   * Counts the full sheet writes the engine refused (`#clearRejectedSheet`), and `#sheetWriteCountAtRefusal`
   * holds `#sheetWriteCount` at the last one. A change set that waited for its validators across such a
   * write, with no full write since, is not written when the Core applies it: the sheet the engine could
   * not hold was emptied, and writing the set's cells would leave it holding just those.
   *
   * @type {number}
   */
  #refusedSheetWriteCount = 0;

  /**
   * The value `#sheetWriteCount` had at the last full sheet write the engine refused.
   *
   * @type {number}
   */
  #sheetWriteCountAtRefusal = 0;

  /**
   * Counts the `loadData()` / `updateData()` calls the plugin did not make itself (`switchSheet()` loads
   * the grid from the sheet with its own source). A change set records it when it is written, and
   * `#onChangesDropped` puts the grid data back only while it has not moved: any other load replaced
   * the grid's data with data that never held the dropped value, also a load the engine refused, which
   * leaves `#sheetWriteCount` where it was.
   *
   * @type {number}
   */
  #foreignLoadCount = 0;

  /**
   * The `setDataAtCell()` / `setDataAtRowProp()` change sets the Core has not applied to the source
   * data yet, keyed by the change array itself (the Core hands the same array to `afterSetDataAtCell`
   * and to `beforeChangeRender`). Each one records the sheet write count and the sheet id at the
   * moment `afterSetDataAtCell` ran, and the changes it left to `beforeChangeRender`.
   *
   * The plugin writes a change the Core cannot reject into the engine from `afterSetDataAtCell`,
   * while the Core applies a set with a validated change to the source data only after its validators
   * resolve, in a microtask. A full sheet write in between - an `updateSettings()` in the same task -
   * scans source data that does not hold the change yet and drops it from the engine;
   * `#onBeforeChangeRender` writes it back. A sheet switch in between is a `loadData()`, so the Core
   * drops the set instead of applying it, and `#onChangesDropped` takes the first write back. A
   * `WeakMap`, so a change set that never reaches either holds nothing alive.
   *
   * @type {WeakMap<CellChange[], ChangeSetAwaitingApply>}
   */
  #changesAwaitingApply = new WeakMap<CellChange[], ChangeSetAwaitingApply>();

  /**
   * The values `beforeValidate` hands the validators of the change set `afterSetDataAtCell` just
   * recorded, keyed by `#validationValueKey()`, one entry per change to the cell. The Core validates a set
   * synchronously right after `afterSetDataAtCell`, so the entries are cleared in a microtask. See
   * `#probeValidationValues()`.
   *
   * @type {Map<string, ValidationValue[]>}
   */
  #validationValues = new Map<string, ValidationValue[]>();

  /**
   * `true` while `#validateDependentCellsUnrecorded()` runs: `validateDependentCells()` then validates each
   * dependent with the grid's operation scope suppressed.
   *
   * @type {boolean}
   */
  #dependentValidationUnrecorded = false;

  /**
   * The answer records of the readers of deferred cells whose change the Core is validating, keyed by
   * `#validationValueKey()`, oldest first (see `#trackReaderAnswer()`).
   *
   * @type {Map<string, ReaderAnswer[]>}
   */
  #readerAnswers = new Map<string, ReaderAnswer[]>();

  /**
   * Stores the HyperFormula source range and destination address prepared in `beforeMoveCells` so that
   * `commitPendingMoveCells` can execute the corresponding HF operation without recomputing
   * visual-to-HF coordinates. `rect` carries the same operation in visual coordinates for the
   * post-commit data sync.
   *
   * Set to `null` when no move is in flight.
   *
   * @private
   * @type {{ source: object, dest: object, isCopy: boolean, rect: object }|null}
   */
  #pendingMoveCells: { source: object; dest: object; isCopy: boolean; rect: MoveCellsRect } | null = null;

  /**
   * The visual rectangle of the operation `commitPendingMoveCells` committed to the engine.
   * Consumed by the `afterMoveCells` listener,
   * which runs the HOT-data sync only for committed operations and only off this value — never
   * off its own hook arguments, which a preceding listener's return value can replace.
   *
   * Set to `null` when no committed move is awaiting its sync.
   *
   * @private
   * @type {object|null}
   */
  #committedMoveCells: MoveCellsRect | null = null;

  /**
   * The dependent-cell changes returned by the engine operation in `commitPendingMoveCells`,
   * consumed by the `afterMoveCells` listener to re-render dependent sheets. `null` while no
   * committed move is awaiting its sync.
   *
   * @private
   * @type {unknown[]|null}
   */
  #moveCellsChanges: unknown[] | null = null;

  /**
   * Guard flag set while writing synced values back to HOT after a `moveCells` operation.
   * Prevents the `afterSetDataAtCell` / `afterSetSourceDataAtCell` hooks from re-writing
   * the same values into HyperFormula a second time.
   *
   * @private
   * @type {boolean}
   */
  #moveCellsSyncPending = false;

  /**
   * Guard flag set while `#syncFormulasToSourceData` writes engine-rewritten formulas back to
   * Handsontable.
   * Prevents the `afterSetSourceDataAtCell` hook from pushing the very same formulas into
   * HyperFormula again.
   *
   * @private
   * @type {boolean}
   */
  #sourceDataSyncPending = false;

  /**
   * Guard flag set while `#getProcessedSourceDataArray` reads the source data on the engine's
   * behalf. Read by `#onModifySourceData` alone, so the read reports what Handsontable stores
   * without also suspending the value projection every other hook depends on.
   *
   * `#syncFormulasToSourceData` reads the source data with the same intent but deliberately keeps
   * the broader `#internalOperationPending`: there the flag doubles as the re-entry guard its own
   * early return checks, which this narrow flag does not provide.
   *
   * @private
   * @type {boolean}
   */
  #sourceDataProjectionSuspended = false;

  /**
   * Guard flag set for the whole span of a Nested Rows detach – from `beforeDetachChild` until
   * `#onAfterDetachChild` has finished rewriting the moved rows in the engine.
   * Keeps `#syncFormulasToSourceData` out of that span: the detach MOVES rows inside the source data
   * and expresses the move as a row removal followed by a row creation, so between the two legs the
   * engine holds references the source data's own reference frame never had.
   *
   * @private
   * @type {boolean}
   */
  #nestedRowsDetachPending = false;

  /**
   * The counter the structure and data versions are drawn from, so a version is never reused.
   */
  #versionSeed = 0;

  /**
   * Changes whenever rows or columns are added, removed or moved in the engine's sheet.
   */
  #structureVersion = 0;

  /**
   * Changes whenever a cell write reaches the engine.
   */
  #dataVersion = 0;

  /**
   * The source data may hold formula text the engine has rewritten: a structural change made out of
   * physical order writes nothing back, and the order returning to physical does not. A state captured
   * while it is set carries the engine's sheet, because the source data cannot rebuild it. Set in
   * `#syncFormulasToSourceData()`, cleared there and in `#writeSheet()`, set from the state in
   * `restoreState()`.
   */
  #sourceHasStaleFormulas = false;

  /**
   * The bound sheet as `getSheetSerialized()` returned it at the end of the last load of it into the grid
   * (`#loadSheet()`), or of the last write of this grid to the engine after it (`#trackOwnEngineWrite()`), or
   * `null` before a load. A reload that finds the engine sheet still holding exactly this knows nothing but this
   * grid changed it (`#canReloadInPlace()`). Kept up to date after writes only for a grid built from the sheet,
   * the one that reloads on every settings update.
   */
  #loadedSheetContent: unknown[][] | null = null;

  /**
   * Set when a write of this grid finds the engine sheet changed since the snapshot (`#loadedSheetContent`): a host
   * change, or another grid's, came before it, and the snapshot taken after the write would hide it. Cleared by
   * the next load.
   */
  #foreignSheetChange = false;

  /**
   * How many writes of this grid to the engine are on the stack (`#trackOwnEngineWrite()`).
   */
  #trackedOwnWriteDepth = 0;

  /**
   * Whether the tracked write on the stack changes the sheet's structure or order, so the snapshot is read again
   * in full when it ends, rather than cell by cell (`#trackOwnEngineWrite()`).
   */
  #trackedWriteIsStructural = false;

  /**
   * The engine addresses on the bound sheet the engine reported changed (`valuesUpdated`) during the tracked
   * cell write on the stack, refreshed in the snapshot one by one when it ends.
   */
  #trackedChangedCells: Array<{ row: number; col: number }> = [];

  /**
   * The engine addresses on the bound sheet the tracked cell write on the stack set itself (`row,col`), as against
   * the ones the engine only recalculated (`#refreshTrackedCells()`).
   */
  #trackedSetCells = new Set<string>();

  /**
   * Whether a write in the tracked write on the stack drops the snapshot when it ends (`'resets'`).
   */
  #trackedWriteResets = false;

  /**
   * The cells of the tracked cell writes made while a `batchEvaluation` hold kept the engine suspended, read into
   * the snapshot once the engine resumes (`#holdTrackedCells()`), or `null` when no such write waits.
   */
  #heldSnapshotCells: HeldSnapshotCells | null = null;

  /**
   * The content the last full write from the source data (`#writeSheet()`) fed the engine sheet, escaped,
   * in physical row order, kept in step with the grid's own cell writes and row inserts and removals: what
   * the sheet would hold had every later change been written in physical order. A resync whose source data
   * reads the same skips the write and the order replay (`#isSyncedContent()`), because the engine already
   * holds that content, in the grid's order, with the references the user's own moves left. `null` when no
   * such record is kept: a write it cannot follow drops it, and the next resync writes the sheet in full.
   */
  #syncedContent: {
    engine: HyperFormulaEngine;
    sheetId: number | null;
    rows: unknown[][];
    columnSpace: SyncedColumnSpace;
  } | null = null;

  /**
   * The cell writes an undo or a redo made, in the `afterSetSourceDataAtCell` format (physical rows),
   * held until the restore is done – see `restoreState()`.
   */
  #restoredWrites: CellChange[] = [];

  /**
   * The formulas outside this grid's sheet that the recording step's engine calls rewrote so far,
   * keyed by cell or name. The step's closing capture takes them – see `#trackPeerRewrites()`.
   */
  #pendingPeerRewrites = new Map<string, PeerRewrite>();

  /**
   * The other sheets of the engine that the last peer scan found with no formula naming this grid's
   * sheet. `#collectPeerFormulas()` skips them – in a workbook of large sheets reading their formulas
   * is the whole cost of the scan – until the engine reports a change in one of them. Setting a cell's
   * content always reports that cell, even when its value does not change.
   */
  #sheetsNotNamingOwnSheet = new Set<number>();

  /**
   * How many of this grid's own engine writes are on the stack. The grid is not painted for the events
   * they cause: the Core (or the write's caller) paints it – see `#writeOwnSheet()`.
   */
  #ownWriteDepth = 0;

  /**
   * Whether this grid is drawing (`beforeRender` to `afterRender`) and the draw started while the engine held
   * writes (`batchEvaluation`). The recalculation a read inside the draw makes does not repaint this grid at
   * once: a render inside the draw would draw again from within it (see `#deferPaintToDraw()`). A draw that
   * starts with nothing held paints as before.
   */
  #isDrawingHeldEngine = false;

  /**
   * Whether `beforeRender` is preparing this grid's draw (a flush, a resync). A paint asked for then is left to
   * the draw (see `#deferPaintToDraw()`).
   */
  #isPreparingDraw = false;

  /**
   * Whether the draw that started last is a fast one (a selection, a scroll step): it repaints only the cells it
   * adds, so a recalculation it waited on is painted by a render once it ends.
   */
  #isFastDraw = false;

  /**
   * Whether a recalculation during the current fast draw asks for a render once the draw ends.
   */
  #repaintAfterDraw = false;

  /**
   * Whether the check for a draw that threw before `afterRender` is queued (see `#onDrawEndCheck`).
   */
  #drawEndCheckQueued = false;

  /**
   * The cells an undo or a redo recalculated when it reloaded the sheet, validated once the restore is
   * done – see `#validateRestoredDependents`.
   */
  #restoredDependentCells: unknown[] = [];

  /**
   * The size the engine's sheet had when each recorded state was last captured: the floor of the trim an
   * undo or a redo of a row or column change makes (`AxisSyncer#trimUnusedTail()`). It lives beside the
   * state, not in it, because the sheet grows without any change to the grid (a formula in another grid
   * reading a far cell), and a state that carried the size would then stop being reused, which makes
   * UndoRedo record an empty step and drop the redo stack.
   */
  #sheetSizeFloors = new WeakMap<FormulasUndoState, { width: number; height: number }>();

  /**
   * The engine addresses of the cells an undo or a redo wrote, as its `afterChange` reported them. The
   * UndoRedo plugin validates those itself, so they are left out of `#restoredDependentCells`.
   */
  #restoredChangedCells: unknown[] = [];

  /**
   * The listeners told that the engine is about to be detached from this grid – see
   * `addEngineDetachListener()`. Kept across enable cycles: the plugin instance is the grid's.
   */
  readonly #engineDetachListeners = new Set<() => void>();

  /**
   * Maps a HyperFormula `ExportedCellChange` to the same change with `newValue` translated to a
   * Handsontable-formatted string when the target cell is of type `date` or `time`. For other cells
   * (or non-numeric values, or named expressions, or trimmed cells, or cells on other sheets), the
   * original change is returned unchanged.
   *
   * @param {object} change The HyperFormula exported change.
   * @returns {object}
   */
  #exportChangeValue(
    change: { address?: { sheet: number; row: number; col: number }; newValue: unknown }
  ): { address?: { sheet: number; row: number; col: number }; newValue: unknown } {
    if (!change.address || change.address.sheet !== this.sheetId || typeof change.newValue !== 'number') {
      return change;
    }

    const visualRow = this.rowAxisSyncer!.getVisualIndexFromHfIndex(change.address.row);
    const visualColumn = this.columnAxisSyncer!.getVisualIndexFromHfIndex(change.address.col);

    if (visualRow < 0 || visualColumn < 0) {
      return change;
    }

    // The uncached read keeps the same no-extension semantics as the previous
    // `skipMetaExtension` read, without permanently materializing the cell meta.
    const cellMeta = this.hot._getMetaManager().getCellMetaUncached(
      this.hot.toPhysicalRow(visualRow) ?? visualRow, this.hot.toPhysicalColumn(visualColumn) ?? visualColumn,
      { visualRow, visualColumn },
    );
    let newValue: unknown;

    if (cellMeta.type === 'date') {
      newValue = getDateFromExcelDate(change.newValue);
    } else if (cellMeta.type === 'time') {
      newValue = getTimeFromHfTimeFraction(change.newValue);
    } else {
      return change;
    }

    type ExportedChange = { address?: { sheet: number; row: number; col: number }; newValue: unknown };
    const clone = Object.assign(Object.create(Object.getPrototypeOf(change)), change) as ExportedChange;

    clone.newValue = newValue;

    return clone;
  }

  /**
   * Called when a value is updated in the engine.
   *
   * @fires Hooks#afterFormulasValuesUpdate
   * @param {Array} changes The values and location of applied changes.
   */
  #onEngineValuesUpdated = (changes: unknown[]) => {
    // A validation probe on this engine, by any grid, takes its own write back before anything reads it
    // (see `#probeValidationValues()`), so the round trip changes nothing a listener could act on.
    if (isPluginEngineProbe(this.engine)) {
      return;
    }

    if (this.#trackedOwnWriteDepth > 0) {
      this.#collectTrackedChanges(changes);
    }

    if (this.#heldSnapshotCells !== null) {
      this.#collectHeldSnapshotChanges(this.#heldSnapshotCells, changes);
    }

    const exportedChanges = changes.map(change => this.#exportChangeValue(
      change as { address?: { sheet: number; row: number; col: number }; newValue: unknown }
    ));

    if (this.#sheetsNotNamingOwnSheet.size > 0) {
      changes.forEach((change) => {
        const address = (change as { address?: { sheet: number } }).address;

        if (address) {
          this.#sheetsNotNamingOwnSheet.delete(address.sheet);
        }
      });
    }

    this.#invalidateHyperlinkCells();
    this.#markCellsThatBecameHyperlinks(changes);
    this.hot.runHooks('afterFormulasValuesUpdate', exportedChanges);
    this.#paintGridFromEngineChange(changes);
  };

  /**
   * Paints this grid when the engine changed a cell on its sheet.
   *
   * An external write paints at once, once per event. During a plugin write the paint is handed to it
   * and runs once, when the outermost write on this engine ends (see `withPluginEngineWrite()`). The
   * grid whose own write it is does not paint: the Core, or the caller of that write, does.
   *
   * @param {Array} changes The engine's change list.
   */
  #paintGridFromEngineChange(changes: unknown[]) {
    if (this.#ownWriteDepth > 0 || this.sheetId === null || this.hot.isDestroyed || !this.hot.view) {
      return;
    }

    const sheetId = this.sheetId;

    if (!changesNameSheet(changes, sheetId)) {
      return;
    }

    if (deferPaintToPluginEngineWrite(this.engine, this.#paintGrid)) {
      return;
    }

    // The paint runs inside the engine's emit. A throwing user hook must not fail the host's engine call.
    try {
      this.#paintGrid();
    } catch (e) {
      warn(`Formulas: the grid failed to repaint after an engine change: ${e instanceof Error ? e.message : e}`);
    }
  }

  /**
   * Paints this grid, unless it went away since the engine named it. While its draw is being prepared or draws
   * a held engine, the paint is left to that draw (`#deferPaintToDraw()`).
   */
  #paintGrid = () => {
    if (this.hot.isDestroyed || !this.hot.view) {
      return;
    }

    if (this.#isPreparingDraw || this.#isDrawingHeldEngine) {
      this.#deferPaintToDraw();

      return;
    }

    this.hot.render();
  };

  /**
   * Leaves a paint to the draw that is being prepared or runs. A full draw reads every cell after the
   * recalculation, so it paints what the paint would. A fast draw repaints only the cells it adds, so the grid
   * renders once more when it ends (`#onAfterRender`). A draw that throws never reaches `afterRender`, so a
   * microtask checks for it (`#onDrawEndCheck`).
   */
  #deferPaintToDraw() {
    if (this.#isFastDraw) {
      this.#repaintAfterDraw = true;
    }

    if (!this.#drawEndCheckQueued) {
      this.#drawEndCheckQueued = true;
      this.hot._registerMicrotask(this.#onDrawEndCheck);
    }
  }

  /**
   * Microtask callback queued by `#deferPaintToDraw()`. No draw runs across a microtask, so a draw state still
   * set means the draw threw before `afterRender`: the state is reset and the grid painted.
   */
  #onDrawEndCheck = () => {
    this.#drawEndCheckQueued = false;

    if (!this.#isPreparingDraw && !this.#isDrawingHeldEngine && !this.#repaintAfterDraw) {
      return;
    }

    this.#isPreparingDraw = false;
    this.#isDrawingHeldEngine = false;
    this.#repaintAfterDraw = false;

    if (this.hot.isDestroyed || !this.hot.view) {
      return;
    }

    try {
      this.hot.render();
    } catch (e) {
      warn(`Formulas: the grid failed to repaint after an engine change: ${e instanceof Error ? e.message : e}`);
    }
  };

  /**
   * Marks the updated cells that resolve to a hyperlink now. A cell that became a `HYPERLINK` while
   * keeping the label it already showed changes nothing a `renderMode: 'onChange'` paint compares -
   * not its formatted value, meta, renderer, or the render epoch - and it is not yet in
   * `#hyperlinkCells`, so the engine update is the only signal that it needs an anchor.
   *
   * @param {Array} changes The engine's change list.
   */
  #markCellsThatBecameHyperlinks(changes: unknown[]) {
    if (!this.#hyperlinksEnabled || !this.rowAxisSyncer || !this.columnAxisSyncer) {
      return;
    }

    changes.forEach((change) => {
      const address = (change as { address?: { sheet: number; row: number; col: number } }).address;

      if (!address || address.sheet !== this.sheetId) {
        return;
      }

      const visualRow = this.rowAxisSyncer!.getVisualIndexFromHfIndex(address.row);
      const visualColumn = this.columnAxisSyncer!.getVisualIndexFromHfIndex(address.col);

      if (visualRow >= 0 && visualColumn >= 0 && this.#getHyperlinkHref(visualRow, visualColumn) !== null) {
        this.hot.markCellChanged(visualRow, visualColumn);
      }
    });
  }

  /**
   * Marks every cell rendered as a hyperlink as changed, so its `href` is rebuilt on the next render.
   */
  #invalidateHyperlinkCells() {
    this.#hyperlinkCells.forEach((key) => {
      const [physicalRow, physicalColumn] = key.split(',').map(Number);
      const visualRow = this.hot.toVisualRow(physicalRow);
      const visualColumn = this.hot.toVisualColumn(physicalColumn);

      if (visualRow !== null && visualColumn !== null) {
        this.hot.markCellChanged(visualRow, visualColumn);
      }
    });
  }

  /**
   * Called when a named expression is added to the engine instance.
   *
   * @fires Hooks#afterNamedExpressionAdded
   * @param {string} namedExpressionName The name of the added expression.
   * @param {Array} changes The values and location of applied changes.
   */
  #onEngineNamedExpressionsAdded = (namedExpressionName: string, changes: unknown[][]) => {
    this.hot.runHooks('afterNamedExpressionAdded', namedExpressionName, changes);
  };

  /**
   * Called when a named expression is removed from the engine instance.
   *
   * @fires Hooks#afterNamedExpressionRemoved
   * @param {string} namedExpressionName The name of the removed expression.
   * @param {Array} changes The values and location of applied changes.
   */
  #onEngineNamedExpressionsRemoved = (namedExpressionName: string, changes: unknown[][]) => {
    this.hot.runHooks('afterNamedExpressionRemoved', namedExpressionName, changes);
  };

  /**
   * Called when a new sheet is added to the engine instance.
   *
   * @fires Hooks#afterSheetAdded
   * @param {string} addedSheetDisplayName The name of the added sheet.
   */
  #onEngineSheetAdded = (addedSheetDisplayName: string) => {
    this.#ownSheetExists = null;
    this.hot.runHooks('afterSheetAdded', addedSheetDisplayName);
  };

  /**
   * Called when a sheet in the engine instance is renamed.
   *
   * @fires Hooks#afterSheetRenamed
   * @param {string} oldDisplayName The old name of the sheet.
   * @param {string} newDisplayName The new name of the sheet.
   */
  #onEngineSheetRenamed = (oldDisplayName: string, newDisplayName: string) => {
    this.#ownSheetExists = null;
    this.#sheetsNotNamingOwnSheet.clear();

    // The event is engine-wide, so it also reaches instances that do not own the renamed sheet.
    // Repointing those would make them operate on a sheet belonging to another instance.
    // Sheet ids are compared rather than names: the engine matches names without looking at the
    // case but keeps the casing it was given, so `sheetName` may differ in case from the event's
    // display names. The rename is already applied here, so the new name resolves to the same id.
    if (this.engine?.getSheetId(newDisplayName) === this.sheetId) {
      this.#updateSheetNameAndSheetId(newDisplayName);
    }

    this.hot.runHooks('afterSheetRenamed', oldDisplayName, newDisplayName);
  };

  /**
   * Called when a sheet is removed from the engine instance.
   *
   * @fires Hooks#afterSheetRemoved
   * @param {string} removedSheetDisplayName The removed sheet name.
   * @param {Array} changes The values and location of applied changes.
   */
  #onEngineSheetRemoved = (removedSheetDisplayName: string, changes: unknown[][]) => {
    this.#ownSheetExists = null;
    this.#sheetsNotNamingOwnSheet.clear();
    this.hot.runHooks('afterSheetRemoved', removedSheetDisplayName, changes);
  };

  /**
   * The list of the HyperFormula listeners.
   *
   * @type {Array}
   */
  #engineListeners: [string, Function][] | null = [
    ['valuesUpdated', this.#onEngineValuesUpdated],
    ['namedExpressionAdded', this.#onEngineNamedExpressionsAdded],
    ['namedExpressionRemoved', this.#onEngineNamedExpressionsRemoved],
    ['sheetAdded', this.#onEngineSheetAdded],
    ['sheetRenamed', this.#onEngineSheetRenamed],
    ['sheetRemoved', this.#onEngineSheetRemoved],
  ];

  /**
   * Static register used to set up one global HyperFormula instance.
   * TODO: currently used in tests, might be removed later.
   *
   * @private
   * @type {object}
   */
  staticRegister = staticRegister('formulas');

  /**
   * The engine instance that will be used for this instance of Handsontable.
   *
   * @type {HyperFormula|null}
   */
  engine: HyperFormulaEngine | null = null;

  /**
   * HyperFormula's sheet id.
   *
   * @type {number|null}
   */
  sheetId: number | null = null;
  /**
   * HyperFormula's sheet name.
   *
   * @type {string|null}
   */
  sheetName: string | null = null;
  /**
   * Whether the engine currently holds the sheet this instance is bound to, or `null` when the
   * engine has to be asked again. The `modifyData` and `modifySourceData` hooks read it once per
   * cell read, so the engine lookup is cached and dropped only when a sheet is added, renamed, or
   * removed in the engine, or when this instance's binding or engine changes.
   */
  #ownSheetExists: boolean | null = null;

  /**
   * Index synchronizer responsible for manipulating with some general options related to indexes synchronization.
   *
   * @type {IndexSyncer|null}
   */
  indexSyncer: IndexSyncer | null = null;
  /**
   * Index synchronizer responsible for syncing the order of HOT and HF's data for the axis of the rows.
   *
   * @type {AxisSyncer|null}
   */
  rowAxisSyncer: AxisSyncer | null = null;
  /**
   * Index synchronizer responsible for syncing the order of HOT and HF's data for the axis of the columns.
   *
   * @type {AxisSyncer|null}
   */
  columnAxisSyncer: AxisSyncer | null = null;
  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link Formulas#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    /* eslint-disable no-unneeded-ternary */
    return this.hot.getSettings()[PLUGIN_KEY] ? true : false;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    // Both guard flags are cleared here, not only initialized at declaration. A throw inside the
    // span either of them opens leaves it set, and neither has a second closing path – see
    // `#onBeforeDetachChild` for the one `#onAfterDetachChild`'s `finally` cannot cover. Clearing
    // them on enable bounds that to the current enable rather than to the whole session, and it
    // also covers a `disablePlugin()` that lands mid-span.
    this.#internalOperationPending = false;
    this.#nestedRowsDetachPending = false;
    this.#sheetResyncPending = false;
    this.#showFormulasFlag = false;
    // A draw the plugin was turned off in never reached the listener that ends it.
    this.#isPreparingDraw = false;
    this.#isDrawingHeldEngine = false;

    this.engine = setupEngine(this.hot) ?? this.engine;
    this.#engineBuiltFromClass = isEngineClassSetting(this.#readEngineSetting());
    this.#ownSheetExists = null;
    this.#unquotedSheetNames.clear();
    this.#sheetsNotNamingOwnSheet.clear();
    this.#leftSheetOrders.clear();

    if (!this.engine) {
      warn('Missing the required `engine` key in the Formulas settings. Please fill it with either an' +
        ' engine class or an engine instance.');

      return;
    }

    let sheetPaintErrors: unknown[] = [];
    // Set when this enable fills a new sheet from the grid's data; the sync endpoint is set up once the syncers exist.
    let filledSheet = false;
    // Set when this enable binds again the sheet a grid built from it was turned off on, or adds that sheet back from
    // the content the engine held at the disable. The endpoint is set up once the syncers exist, taking over the
    // order the engine holds the sheet in (`#setupSyncEndpointForSheetBuiltGrid()`).
    let reboundSheetBuiltGrid = false;
    // Set when this enable added that sheet back from the stored content, which is in the stored order.
    let addedSheetBuiltContent = false;
    // Set when the sheet bound again cannot take the stored binding over; it is loaded into the grid once the plugin
    // is enabled (`#setupSyncEndpointForSheetBuiltGrid()`).
    let loadsSheetBuiltGrid = false;
    const sheetBuiltBinding = this.#sheetBuiltBindingAtDisable;

    this.#sheetBuiltBindingAtDisable = null;
    // Set when this enable binds a sheet the engine still holds and owes it a resync; the endpoint is set up once
    // the syncers exist, without an order, which the resync's `#writeSheet()` sends.
    let boundHeldSheet = false;

    // Useful for disabling -> enabling the plugin using `updateSettings` or the API.
    if (this.sheetName !== null && !this.engine.doesSheetExist(this.sheetName) && this.isDataLoadPending()) {
      this.sheetName = null;
      this.sheetId = null;

    } else if (this.sheetName !== null && !this.engine.doesSheetExist(this.sheetName)) {
      // A grid built from an engine sheet gets the sheet back as the engine held it, in that engine order: the
      // grid's source data holds the formula text of that order (`#sourceHasStaleFormulas`), so the sheet filled
      // from it in physical order and then sorted read other cells (an engine class builds a new engine).
      const sheetBuiltContent = this.#hotWasInitializedWithEmptyData && this.hot.view
        ? this.#sheetBuiltContent(sheetBuiltBinding) : undefined;
      let sourceDataArray = sheetBuiltContent;

      if (sourceDataArray === undefined) {
        sourceDataArray = this.#getProcessedSourceDataArray();
        this.#escapeSourceDataArray(sourceDataArray);
      }

      const { addedSheetName, paintErrors } = this.#addSheet(this.sheetName, sourceDataArray);

      if (typeof addedSheetName === 'string') {
        this.#updateSheetNameAndSheetId(addedSheetName);
        filledSheet = sheetBuiltContent === undefined;
        reboundSheetBuiltGrid = sheetBuiltContent !== undefined;
        addedSheetBuiltContent = reboundSheetBuiltGrid;
      }

      sheetPaintErrors = paintErrors;

    } else if (this.sheetName !== null && this.hot.view && this.#hotWasInitializedWithEmptyData
      && !this.isDataLoadPending()) {
      // A grid built from an engine sheet reads the sheet as its data, so nothing is written to it: the engine
      // holds it as the grid left it, in the order the grid had at the disable.
      this.#updateSheetNameAndSheetId(this.sheetName);
      reboundSheetBuiltGrid = true;

    } else if (this.sheetName !== null && this.hot.view && !this.#hotWasInitializedWithEmptyData
      && !this.isDataLoadPending()) {
      this.#updateSheetNameAndSheetId(this.sheetName);
      this.#sheetResyncPending = true;
      boundHeldSheet = true;
    }

    this.addHook('beforeLoadData', this.#onBeforeLoadData);
    // Ahead of every default-order `afterLoadData` listener: the engine has to hold the new data
    // before another plugin reads cells through `modifyData`. AutoColumnSize sweeps every column
    // in its own `afterLoadData` listener, and registered behind it (this plugin's priority is
    // higher) the sweep measured formula columns against the previous dataset's results, after
    // which the engine's `valuesUpdated` batch queued every changed cell for a second synchronous
    // full rescan on the resume render. Moving this listener, rather than that one, keeps the sweep
    // where AutoRowSize and host callbacks expect it. The one listener this overtakes with an effect
    // is the `manualColumnMove` / `manualRowMove` re-apply of a configured order, and the effect is a
    // fix: the order used to reach the engine twice on a `loadData()` (see the plugin's AGENTS.md).
    this.addHook('afterLoadData', this.#onAfterLoadData, -1);

    // The `updateData` hooks utilize the same logic as the `loadData` hooks.
    this.addHook('beforeUpdateData', this.#onBeforeLoadData);
    this.addHook('afterUpdateData', this.#onAfterLoadData, -1);

    this.addHook('modifyData', this.#onModifyData);
    this.addHook('modifySourceData', this.#onModifySourceData);
    this.addHook('beforeValidate', this.#onBeforeValidate);
    this.addHook('afterValidate', this.#onAfterValidate);

    this.addHook('afterSetSourceDataAtCell', this.#onAfterSetSourceDataAtCell);
    this.addHook('afterSetDataAtCell', this.#onAfterSetDataAtCell);
    this.addHook('afterSetDataAtRowProp', this.#onAfterSetDataAtCell);
    this.addHook('beforeChangeRender', this.#onBeforeChangeRender);
    this.hot._addDroppedChangesListener(this.#onChangesDropped);

    this.addHook('beforeCreateRow', this.#onBeforeCreateRow);
    this.addHook('beforeCreateCol', this.#onBeforeCreateCol);

    this.addHook('afterCreateRow', this.#onAfterCreateRow);
    this.addHook('afterCreateCol', this.#onAfterCreateCol);

    this.addHook('beforeRemoveRow', this.#onBeforeRemoveRow);
    this.addHook('beforeRemoveCol', this.#onBeforeRemoveCol);

    this.addHook('afterRemoveRow', this.#onAfterRemoveRow);
    this.addHook('afterRemoveCol', this.#onAfterRemoveCol);

    this.indexSyncer = new IndexSyncer(
      this.hot.rowIndexMapper, this.hot.columnIndexMapper, () => {
        // Nothing is postponed: the axis syncers postpone the initial order only while no sheet is bound, and
        // the plugin sets the sync endpoint up with a bound sheet only. Each setup sends the order itself.
      }, <T>(engine: HyperFormulaEngine, fn: () => T) => this.#writeOwnSheet(engine, fn),
      () => this.#isRowOrderSorted(),
      // The engine's references then depend on the order (DEV-917), and only a write of the data repairs them
      // once the order is gone: a cleared sort is itself an order sent, so the next resync writes. A reset of
      // the grid's order (`onOrderReset()`) reaches no engine call, so only that write brings the engine to it.
      () => {
        this.#syncedContent = null;
      });

    this.rowAxisSyncer = this.indexSyncer.getForAxis('row');
    this.columnAxisSyncer = this.indexSyncer.getForAxis('column');

    if (this.#engineOrderHolds > 0) {
      this.indexSyncer.setOrderHeld(true);
    }

    if (filledSheet) {
      this.#setupSyncEndpointForFilledSheet();

    } else if (reboundSheetBuiltGrid) {
      loadsSheetBuiltGrid = !this.#setupSyncEndpointForSheetBuiltGrid(sheetBuiltBinding, addedSheetBuiltContent);

    } else if (boundHeldSheet && this.sheetId !== null) {
      // An order change before the resync drains (a sort or a move with rendering suspended, or right after a
      // direct `enablePlugin()`) reaches this sheet instead of no engine. The resync rewrites the sheet from the
      // source data and sends the grid's order then, so no order is sent here.
      this.indexSyncer.setupSyncEndpoint(this.engine, this.sheetId, false);
    }

    this.addHook('afterRowSequenceChange', this.rowAxisSyncer!.getIndexesChangeSyncMethod());
    this.addHook('afterColumnSequenceChange', this.columnAxisSyncer!.getIndexesChangeSyncMethod());
    // Any reorder rewrites formula references inside the engine, a sort included.
    this.addHook('afterRowSequenceChange', this.#onAfterSequenceChange);
    this.addHook('afterColumnSequenceChange', this.#onAfterSequenceChange);
    this.addHook('afterColumnSequenceChange', this.#onAfterColumnSequenceChange);

    this.addHook('beforeRowMove',
      (movedRows: number[], finalIndex: number, _dropIndex: number | undefined, movePossible: boolean) => {
        this.rowAxisSyncer!.storeMovesInformation(movedRows, finalIndex, movePossible);
      });

    this.addHook('beforeColumnMove',
      (movedColumns: number[], finalIndex: number, _dropIndex: number | undefined, movePossible: boolean) => {
        this.columnAxisSyncer!.storeMovesInformation(movedColumns, finalIndex, movePossible);
      });

    this.addHook('afterRowMove',
      (_movedRows: number[], _finalIndex: number, _dropIndex: number | undefined,
       movePossible: boolean, orderChanged: boolean) => {
        this.#trackPeerRewrites(() => this.rowAxisSyncer!.calculateAndSyncMoves(movePossible, orderChanged));
        this.#markStructureChanged();
      });

    this.addHook('afterColumnMove',
      (_movedColumns: number[], _finalIndex: number, _dropIndex: number | undefined,
       movePossible: boolean, orderChanged: boolean) => {
        this.#trackPeerRewrites(() => this.columnAxisSyncer!.calculateAndSyncMoves(movePossible, orderChanged));
        this.#markStructureChanged();
      });

    this.addHook('beforeColumnFreeze', (column: number, freezePerformed: boolean) => {
      const fixedColumnsStart = this.hot.getSettings().fixedColumnsStart;

      this.columnAxisSyncer!.storeMovesInformation(
        [column], fixedColumnsStart!, freezePerformed);
    });

    this.addHook('afterColumnFreeze', (_column: number, freezePerformed: boolean) => {
      this.#trackPeerRewrites(() => this.columnAxisSyncer!.calculateAndSyncMoves(freezePerformed, freezePerformed));
    });

    // The target comes from the hook: ManualColumnFreeze resolves it before the move, and with
    // `restoreColumnPosition` it is not the freeze line.
    this.addHook('beforeColumnUnfreeze', (column: number, unfreezePerformed: boolean, finalIndex: number) => {
      this.columnAxisSyncer!.storeMovesInformation([column], finalIndex, unfreezePerformed);
    });

    this.addHook('afterColumnUnfreeze', (_column: number, unfreezePerformed: boolean) => {
      this.#trackPeerRewrites(
        () => this.columnAxisSyncer!.calculateAndSyncMoves(unfreezePerformed, unfreezePerformed));
    });

    // Date and preserved-text escaping runs both here (for `updateSettings`-driven
    // initialization, where `afterLoadData` returns early) and in `afterLoadData` /
    // `afterUpdateData`, where the transient meta read provides composed cell properties.
    this.addHook('afterCellMetaReset', this.#onAfterCellMetaReset);
    this.addHook('beforeRender', this.#onBeforeRenderStart, -1);
    this.addHook('beforeRender', this.#onBeforeRender);
    this.addHook('afterRender', this.#onAfterRender);

    // `batchEvaluation`: the grid holds the engine's recalculation while its execution is suspended. The
    // release runs ahead of every default-order listener, so one that reads the engine or throws runs after
    // the engine is resumed.
    this.addHook('afterSuspendExecution', this.#onAfterSuspendExecution);
    this.addHook('afterResumeExecution', this.#onAfterResumeExecution, -1);
    // A structure change moves the cells the held writes' dependents are named by, so they are validated
    // before it (the insert and removal hooks do it in their own callbacks).
    this.addHook('beforeRowMove', this.#onBeforeStructureChange);
    this.addHook('beforeColumnMove', this.#onBeforeStructureChange);
    this.addHook('beforeColumnSort', this.#onBeforeStructureChange);
    this.addHook('beforeLoadData', this.#onBeforeLoadHeldData);
    this.addHook('beforeUpdateData', this.#onBeforeLoadHeldData);

    // `orderIndex: 1` puts this after every default-order listener, and the plugins' own
    // `onUpdateSettings` is one of them - which is the whole point: the row count is only final once
    // they have run. See `#onAfterUpdateSettingsRowCount`.
    this.addHook('afterUpdateSettings', this.#onAfterUpdateSettingsRowCount, 1);

    // A restore that never reached `restoreState()` – an action registered through `done()` – still
    // gets its cell writes into the engine.
    this.addHook('afterUndo', this.#flushRestoredWrites);
    this.addHook('afterRedo', this.#flushRestoredWrites);
    this.addHook('afterChange', this.#onAfterRestoredChange);
    this.addHook('afterUndo', this.#validateRestoredDependents);
    this.addHook('afterRedo', this.#validateRestoredDependents);

    this.addHook('beforeDetachChild', this.#onBeforeDetachChild);
    this.addHook('afterDetachChild', this.#onAfterDetachChild);
    this.addHook('beforeAutofill', this.#onBeforeAutofill);

    this.addHook('beforeMoveCells', this.#onBeforeMoveCells);
    this.addHook('afterMoveCells', this.#onAfterMoveCells);

    this.addHook('afterRenderer', this.#onAfterRenderer);
    // Positive `orderIndex`: must run after every default-order `afterRenderer` listener (this
    // plugin's own above, and AutoLink's) - see `#onPaintFormulaText`'s own doc for why.
    this.addHook('afterRenderer', this.#onPaintFormulaText, 1);
    this.addHook('beforeCopy', this.#onBeforeCopyOrCut);
    this.addHook('beforeCut', this.#onBeforeCopyOrCut);

    this.#registerToggleFormulasShortcut();

    this.#engineListeners?.forEach(([eventName, listener]) => this.engine!.on(eventName, listener));

    this.#refreshHyperlinksSetting();

    // The `HYPERLINK` anchors are written by `#onAfterRenderer`, so a bare enable paints nothing on
    // its own. Under `renderMode: 'onChange'` a render right after this call would skip every cell
    // unless the epoch advances here too - mirrors the same call in `AutoLink.enablePlugin()`. Gated
    // on `#hyperlinksEnabled`: with `hyperlinks` off (the common `formulas: { engine }` setup) there
    // are no anchors to repaint, so the call would only force a full, no-op repaint.
    if (this.#hyperlinksEnabled) {
      this.hot.markAllCellsChanged();
    }

    super.enablePlugin();

    // Once the plugin is whole: the load runs this plugin's own `afterLoadData` and `modifyData` listeners.
    if (loadsSheetBuiltGrid && this.sheetName !== null) {
      this.#loadSheet(this.sheetName);
    }

    if (sheetPaintErrors.length > 0) {
      throw sheetPaintErrors[0];
    }
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    // A grid that leaves a held recalculation must not leave a shared engine suspended for the other grids.
    // First, so everything below reads a resumed engine. A resync the settings update owes is dropped below
    // anyway, so for a holder it is dropped before the release validates (and reads) this grid's cells.
    if (this.engine && isEvaluationHolder(this.engine, this.hot)) {
      this.#sheetResyncPending = false;
      this.#releaseEvaluationHold();
    }

    // First, while the plugin is still whole: a listener may close an open edit (the FormulaBuilder
    // plugin does), and that edit's render runs this plugin's `afterRenderer`, which would wrap the
    // `HYPERLINK` anchors again after the cleanup below. The engine is still set here too.
    this.#notifyEngineDetach();
    this.#syncedContent = null;
    this.hot._removeDroppedChangesListener(this.#onChangesDropped);
    this.#readerAnswers.clear();
    this.#unregisterToggleFormulasShortcut();
    this.#showFormulasFlag = false;
    this.#unwrapRenderedHyperlinks();
    this.#hyperlinkCells.clear();

    // The recorded layout belongs to the engine session being torn down. Nothing reads it before
    // `#onAfterCellMetaReset` refreshes it - the Core fires `afterCellMetaReset` before
    // `afterUpdateSettings`, and a listener registered mid-run does not fire that run - so this is
    // consistency with the two guard flags `enablePlugin()` clears, not a live defect.
    this.#sourceRowCountAtLastSync = null;
    this.#sheetIdAtLastSync = null;
    this.#sheetResyncPending = false;
    // A grid built from an engine sheet leaves the sheet in the grid's order, which only these syncers know, and the
    // snapshot its next reload compares against: the next enable takes both over, and the snapshot is the one copy
    // of the sheet kept while the plugin is off (see `#sheetBuiltBindingAtDisable`). Read after
    // `#notifyEngineDetach()`, whose listeners can still write the sheet.
    this.#sheetBuiltBindingAtDisable = this.#hotWasInitializedWithEmptyData && this.engine && this.sheetId !== null
      && this.#hasOwnSheet() ? this.#keepSheetBuiltBinding(this.engine, this.sheetId) : null;
    this.#leftSheetOrders.clear();
    // Any other grid's next load of a sheet starts the comparison over; a sheet-built grid's binding above holds the
    // snapshot for its next enable.
    this.#loadedSheetContent = null;
    this.#foreignSheetChange = false;
    this.#engineListeners?.forEach(([eventName, listener]) => this.engine?.off(eventName, listener));

    if (this.engine) {
      unregisterEngine(this.engine, this.hot);
    }

    this.engine = null;
    this.#ownSheetExists = null;

    // `#unwrapRenderedHyperlinks()` above already removed this plugin's own anchors from the
    // currently-rendered DOM, eagerly - but a cell that HELD one is now plain URL text, which a
    // second plugin (`AutoLink`) can only claim on its own next paint of that cell. Under
    // `renderMode: 'onChange'` a `render()` right after this call would skip every cell unless the
    // epoch advances here too, so a HYPERLINK label AutoLink should now link stays unlinked until
    // something else repaints it.
    if (this.#hyperlinksEnabled) {
      this.hot.markAllCellsChanged();
    }

    super.disablePlugin();
  }

  /**
   * Deprecated. The `Alt`+`Enter` shortcut that opens a cell's link is a core grid shortcut now,
   * registered for every grid, so the plugin has nothing to register. This method is a no-op.
   *
   * @deprecated Since 19.0.0. The `Alt`+`Enter` shortcut that opens a cell's link is a core grid
   * shortcut now, registered for every grid, so the plugin has nothing to register. The method does
   * nothing and will be removed in 19.0.0.
   */
  registerShortcuts(): void {
    deprecatedWarnOnce('Formulas.registerShortcuts', toSingleLine`The "registerShortcuts" method of\x20
      the Formulas plugin does nothing: the Alt+Enter link shortcut is a core grid shortcut since\x20
      19.0.0. It will be removed in 20.0.0. Remove the call.`);
  }

  /**
   * Deprecated. The `Alt`+`Enter` shortcut that opens a cell's link is a core grid shortcut now,
   * registered for every grid, so the plugin has nothing to unregister. This method is a no-op.
   *
   * @deprecated Since 19.0.0. The `Alt`+`Enter` shortcut that opens a cell's link is a core grid
   * shortcut now, registered for every grid, so the plugin has nothing to unregister. The method does
   * nothing and will be removed in 19.0.0.
   */
  unregisterShortcuts(): void {
    deprecatedWarnOnce('Formulas.unregisterShortcuts', toSingleLine`The "unregisterShortcuts" method\x20
      of the Formulas plugin does nothing: the Alt+Enter link shortcut is a core grid shortcut since\x20
      19.0.0. It will be removed in 20.0.0. Remove the call.`);
  }

  /**
   * Triggered on `updateSettings`.
   *
   * @private
   * @param {object} newSettings New set of settings passed to the `updateSettings` method.
   */
  updatePlugin(newSettings: Record<string, unknown>) {
    let sheetPaintErrors: unknown[] = [];

    this.#followEngineChange(newSettings);

    const newEngineSettings = getEngineSettingsWithOverrides(this.hot.getSettings());

    if (this.engine && haveEngineSettingsChanged(this.engine.getConfig(), newEngineSettings)) {
      this.engine.updateConfig(newEngineSettings);
    }

    const requestedSheetName = this.#requestedSheetName();
    // A call that passes `data` to a grid bound to no sheet yet keeps that data, as construction does: core loaded
    // it before the plugins updated, so the sheet the call names takes the grid's data (the unbound branch below).
    // Loaded from the sheet here, it replaced the data of the call.
    const keepsDataOfCall = this.sheetName === null && hasOwnProperty(newSettings, 'data') && !this.isDataLoadPending();

    if (
      requestedSheetName !== undefined && !keepsDataOfCall &&
      // Sheet ids are compared rather than names, because `sheetName` holds the engine's casing
      // while the setting keeps the one it was written with. An unknown name has no id, which
      // still differs from the current one and lets `switchSheet` report it.
      this.engine?.getSheetId(requestedSheetName) !== this.sheetId
    ) {
      const sheetExists = this.engine?.doesSheetExist(requestedSheetName) === true;

      if (this.isDataLoadPending()) {
        if (sheetExists) {
          this.#updateSheetNameAndSheetId(requestedSheetName);
          this.#followedSheetNameSetting = requestedSheetName;
        }

      } else if (sheetExists || this.sheetName !== null) {
        this.#loadSheet(requestedSheetName);
      }
    }

    if (!this.isDataLoadPending()) {
      this.#followSheetNameSettingWhenBound();
    }

    // No sheet is connected to the instance -> create a new sheet using the currently used data. A load still to
    // come in this call binds one itself (`afterLoadData`). A `data` passed in the same call does not: core loads
    // it before the plugins update, so a plugin that this call enables never saw that load, and the grid showed
    // its formulas as text.
    if (!this.isDataLoadPending() && this.sheetName === null) {
      const formulasSettings = this.hot.getSettings()[PLUGIN_KEY];
      const sheetName = isFormulasSettingsObject(formulasSettings) ? formulasSettings.sheetName : undefined;

      if (sheetName && this.engine?.doesSheetExist(sheetName) && !keepsDataOfCall) {
        this.#loadSheet(sheetName);

      } else if (sheetName && this.engine?.doesSheetExist(sheetName)) {
        const engine = this.engine;

        // One write, as `#onAfterLoadData` binds and fills: the grids that read the sheet paint once the data is
        // in. `#writeSheet()` sets the sync endpoint up and sends the grid's order.
        this.#writeOwnSheet(engine, () => {
          this.#updateSheetNameAndSheetId(sheetName);
          this.#followSheetNameSettingWhenBound();
          this.#loadSourceDataIntoSheet();
        });

      } else {
        const sourceDataArray = this.#getProcessedSourceDataArray();

        this.#escapeSourceDataArray(sourceDataArray);

        const { addedSheetName, paintErrors } = this.#addSheet(sheetName ?? undefined, sourceDataArray);

        if (typeof addedSheetName === 'string') {
          this.#updateSheetNameAndSheetId(addedSheetName);
          this.#setupSyncEndpointForFilledSheet();
        }

        sheetPaintErrors = paintErrors;
      }
    }

    this.#refreshHyperlinksSetting();

    super.updatePlugin(newSettings);

    if (sheetPaintErrors.length > 0) {
      throw sheetPaintErrors[0];
    }
  }

  /**
   * Returns the `formulas.sheetName` setting when it asks for a sheet: it names one, and it changed since
   * the binding last followed it (`#followedSheetNameSetting`). The binding is kept by sheet id and
   * follows an engine rename of the sheet (`#onEngineSheetRenamed`), while the setting keeps the name it
   * was written with, so an unchanged setting is not a request. Read as one, it found the old name after
   * the sheets bar renamed the shown sheet: a `language` or `maxRows` update logged that the sheet does
   * not exist and bound the grid to any sheet that took the old name since, and a `loadData()` added a
   * new sheet under the old name.
   *
   * @returns {string|undefined}
   */
  #requestedSheetName(): string | undefined {
    const sheetName = this.#readSheetNameSetting();

    return sheetName !== this.#followedSheetNameSetting ? sheetName : undefined;
  }

  /**
   * Records the `sheetName` setting as followed once the binding matches it. A request the plugin could
   * not carry out (a name the engine did not hold yet) stays a request, so the same setting sent again
   * after the host added that sheet binds it; recorded right away, the retry did nothing and logged
   * nothing. A binding that only followed an engine rename keeps the setting it followed before.
   */
  #followSheetNameSettingWhenBound() {
    const sheetName = this.#readSheetNameSetting();

    if (sheetName === undefined || (this.sheetId !== null && this.engine?.getSheetId(sheetName) === this.sheetId)) {
      this.#followedSheetNameSetting = sheetName;
    }
  }

  /**
   * Tells whether the engine reads a sheet name without quotes, asking the engine's own parser once per
   * name.
   *
   * @param {string} name The sheet name.
   * @returns {boolean}
   */
  #canReadUnquoted = (name: string): boolean => {
    let readable = this.#unquotedSheetNames.get(name);

    if (readable === undefined) {
      readable = canReadSheetNameUnquoted(this.engine, name);
      this.#unquotedSheetNames.set(name, readable);
    }

    return readable;
  };

  /**
   * Returns formula text read from the engine in a form the engine can parse again. HyperFormula writes a
   * sheet name that starts with a digit (`2026`, `1Q`) without the quotes it needs, even when the formula
   * was written with them, and then fails to parse its own text: an editor opened on `='2026'!A1` and
   * committed unchanged turned the cell into `#ERROR!`. Every formula text that leaves the engine (the
   * source data reads, the copy, a fill, a move, the reload of a sheet, the text written back into the
   * data, and the text undo keeps) goes through here. A value that is not a formula, or a formula with no
   * sheet reference, comes back as it was.
   *
   * @param {*} value A value read from the engine.
   * @returns {*}
   */
  #readableFormula<T>(value: T): T {
    if (typeof value !== 'string' || !value.startsWith('=')) {
      return value;
    }

    return quoteUnreadableSheetNames(value, this.#canReadUnquoted) as T;
  }

  /**
   * Applies `#readableFormula()` to every cell of a sheet read from the engine. A row with nothing to
   * change is kept as the same array.
   *
   * @param {Array[]} rows The rows.
   * @returns {Array[]}
   */
  #readableSheet<T extends unknown[][]>(rows: T): T {
    return rows.map((row) => {
      if (!Array.isArray(row)) {
        return row;
      }

      let readable: unknown[] | null = null;

      row.forEach((cell: unknown, index: number) => {
        const text = this.#readableFormula(cell);

        if (text !== cell) {
          readable ??= row.slice();
          readable[index] = text;
        }
      });

      return readable ?? row;
    }) as T;
  }

  /**
   * Returns the `formulas.engine` setting, or `undefined` when there is none.
   *
   * @returns {*}
   */
  #readEngineSetting(): unknown {
    const pluginSettings = this.hot.getSettings()[PLUGIN_KEY];

    return isFormulasSettingsObject(pluginSettings) ? pluginSettings.engine : undefined;
  }

  /**
   * Returns the `formulas.sheetName` setting, or `undefined` when there is none.
   *
   * @returns {string|undefined}
   */
  #readSheetNameSetting(): string | undefined {
    const pluginSettings = this.hot.getSettings()[PLUGIN_KEY];

    return isFormulasSettingsObject(pluginSettings) ? pluginSettings.sheetName : undefined;
  }

  /**
   * Moves the plugin to another engine instance when a sheets bar switch sets one. The engine is set up
   * on enable only, so the plugin kept the first sheet's engine while every later sheet named another:
   * the sheets bar switched between sheets bound to two engines, the edits of the second landed in a
   * copy of its sheet inside the first engine, and the formulas of the second engine never saw them.
   * The old engine's sheet is left where it is, and the plugin binds the sheet the settings name in the
   * new engine.
   *
   * Only a call that loads the sheet's data next (`isDataLoadPending()`, a sheets bar switch) follows a
   * change, so a plain `updateSettings()` keeps the engine the grid was built with, as before. An instance
   * counts only when it already holds the sheet `sheetName` names, as every engine the sheets bar binds
   * does. An engine class (or `{ hyperformula }`) builds an engine of the plugin's own, so it counts only
   * when the current engine is an instance the host passed: kept on that instance, a sheet that passes the
   * class wrote itself into another sheet's engine.
   *
   * @param {object} newSettings The settings update.
   */
  #followEngineChange(newSettings: Record<string, unknown>) {
    const engine = this.#readEngineSetting();
    const sheetName = this.#readSheetNameSetting();
    const holdsSheet = sheetName !== undefined && isObject(engine)
      && (engine as { doesSheetExist?: (name: string) => boolean }).doesSheetExist?.(sheetName) === true;
    const changed = this.isDataLoadPending() && (isEngineClassSetting(engine)
      ? !this.#engineBuiltFromClass
      : isObject(engine) && engine !== this.engine && holdsSheet);

    if (!this.enabled || !hasOwnProperty(newSettings, PLUGIN_KEY) || !changed) {
      return;
    }

    this.disablePlugin();
    this.sheetName = null;
    this.sheetId = null;
    this.#followedSheetNameSetting = undefined;
    this.enablePlugin();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#notifyEngineDetach();
    this.#engineDetachListeners.clear();
    this.hot._removeDroppedChangesListener(this.#onChangesDropped);
    this.#readerAnswers.clear();
    this.#engineListeners?.forEach(([eventName, listener]) => this.engine?.off(eventName, listener));
    this.#engineListeners = null;
    // The core has torn the view, the data and the index mappers down by now, and the execution hooks are
    // silent, so the hold is released here, after this grid stopped listening to the engine and before the
    // engine goes: the other grids on it paint and read a resumed engine.
    this.#releaseEvaluationHold(true);

    if (this.engine) {
      unregisterEngine(this.engine, this.hot);
    }

    this.engine = null;
    this.#ownSheetExists = null;
    this.#sheetBuiltBindingAtDisable = null;
    this.#leftSheetOrders.clear();
    this.#loadedSheetContent = null;

    super.destroy();
  }

  /**
   * Update sheetName and sheetId properties.
   *
   * @param {string} [sheetName] The new sheet name.
   */
  #updateSheetNameAndSheetId(sheetName: string) {
    const sheetId = this.engine?.getSheetId(sheetName) ?? null;

    // The snapshot describes the sheet bound until now; the next load of the new one takes its own.
    if (sheetId !== this.sheetId) {
      this.#loadedSheetContent = null;
    }

    // Store the name the engine itself reports. The engine matches names without regard to case
    // but keeps the casing it was given, so the name passed here may differ from the engine's own.
    // Keeping them in step makes every exact-string reader of `sheetName` safe by construction.
    this.sheetName = (sheetId === null ? null : this.engine?.getSheetName(sheetId)) ?? sheetName;
    this.sheetId = sheetId;
    this.#ownSheetExists = null;
    this.#sheetsNotNamingOwnSheet.clear();

    // Every caller has just made the engine authoritative for the grid - `switchSheet()` is about
    // to load the grid FROM the sheet, `addSheet()` callers filled it from the grid - so a resync
    // owed from earlier in the same settings update has nothing left to carry. Drained later, it
    // would write this grid's visible-column projection over the sheet just bound.
    this.#sheetResyncPending = false;
  }

  /**
   * Returns `true` when the engine holds the sheet this instance is bound to. The engine is asked
   * once per invalidation (see `#ownSheetExists`); the hot read paths get the cached answer.
   *
   * @returns {boolean}
   */
  #hasOwnSheet(): boolean {
    if (this.#ownSheetExists === null) {
      this.#ownSheetExists = this.sheetName !== null && this.engine?.doesSheetExist(this.sheetName) === true;
    }

    return this.#ownSheetExists;
  }

  /**
   * Translates visual coordinates once into everything a per-cell read needs: the engine address of
   * the bound sheet and the physical coordinates the cell meta is keyed by. Returns `null` when the
   * cell has no physical counterpart (out of bounds) or no sheet is bound.
   *
   * @param {number} visualRow Visual row index.
   * @param {number} visualColumn Visual column index.
   * @returns {{ address: { sheet: number, row: number, col: number }, physicalRow: number, physicalColumn: number } | null}
   */
  #toEngineAddress(visualRow: number, visualColumn: number): {
    address: { sheet: number; row: number; col: number };
    physicalRow: number;
    physicalColumn: number;
  } | null {
    const physicalRow = this.hot.toPhysicalRow(visualRow);
    const physicalColumn = this.hot.toPhysicalColumn(visualColumn);

    if (this.sheetId === null || physicalRow === null || physicalColumn === null) {
      return null;
    }

    return {
      address: {
        sheet: this.sheetId,
        row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow),
        col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn),
      },
      physicalRow,
      physicalColumn,
    };
  }

  /**
   * Add a sheet to the shared HyperFormula instance.
   *
   * @param {string|null} [sheetName] The new sheet name. If not provided (or a null is passed), will be
   * auto-generated by HyperFormula.
   * @param {Array} [sheetData] Data passed to the shared HyperFormula instance. Has to be declared as an array of
   * arrays - array of objects is not supported in this scenario.
   * @returns {boolean|string} `false` if the data format is unusable or it is impossible to add a new sheet to the
   * engine, the created sheet name otherwise. When a grid that repaints because of the new sheet throws, the
   * sheet is already added and the error is rethrown once every grid has repainted.
   */
  addSheet(sheetName?: string | null, sheetData?: unknown[][]): string | boolean {
    const { addedSheetName, paintErrors } = this.#addSheet(sheetName, sheetData);

    if (paintErrors.length > 0) {
      throw paintErrors[0];
    }

    return addedSheetName;
  }

  /**
   * Whether the `batchEvaluation` setting is on. Read when the execution is suspended, so a change applies
   * from the next suspension without restarting the plugin.
   *
   * @returns {boolean}
   */
  #isBatchEvaluationEnabled(): boolean {
    const pluginSettings = this.hot.getSettings()[PLUGIN_KEY];

    return isFormulasSettingsObject(pluginSettings) && pluginSettings.batchEvaluation === true;
  }

  /**
   * `afterSuspendExecution` hook callback. With `batchEvaluation` on, the grid holds the engine's
   * recalculation: the engine is suspended at the first engine write the plugin makes from now on, not here,
   * so a suspension that writes only index maps (every render's autosizing, a filter, a hidden row) never
   * touches the engine.
   */
  #onAfterSuspendExecution = () => {
    if (this.engine && this.#isBatchEvaluationEnabled()) {
      joinEvaluationHold(this.engine, this.hot);
    }
  };

  /**
   * `afterResumeExecution` hook callback. Releases the hold this grid has on the engine.
   */
  #onAfterResumeExecution = () => {
    this.#releaseEvaluationHold();
  };

  /**
   * Takes this grid out of the hold on its engine. When it was the last grid holding it, the held writes are
   * recalculated, once, and their dependents are validated, once each. Both run in one plugin write scope, so
   * the grids paint after the validation, and a paint that suspends a grid's execution again (its render's
   * autosizing) starts a hold of its own. When the host holds the engine suspended itself, the hold ends and
   * the dependents are validated when the host resumes it.
   *
   * @param {boolean} [leaving=false] `true` when the grid is being destroyed: its own cells are not validated,
   *   and another grid on the engine validates the rest.
   */
  #releaseEvaluationHold(leaving = false) {
    const engine = this.engine;

    if (!engine) {
      return;
    }

    const wasHolder = isEvaluationHolder(engine, this.hot);

    if (!leaveEvaluationHold(engine, this.hot)) {
      // Another grid on the engine is still suspended, so the hold goes on. This grid's execution is over,
      // though: its writes take effect and its dependents are validated now, as without the setting. Left to
      // the last grid's release, they would wait for a resume that may never come.
      if (wasHolder && !leaving) {
        this.#recalculateAndValidateHeldWrites(engine);
      }

      return;
    }

    this.#endEvaluationHold(engine, leaving ? this.sheetId : null);
  }

  /**
   * Recalculates the writes held on the engine and validates their dependents, while the hold stays open for
   * the grids still suspended. Both run in one plugin write scope, so the grids paint after the validation.
   *
   * @param {object} engine The engine.
   */
  #recalculateAndValidateHeldWrites(engine: HyperFormulaEngine) {
    withPluginEngineWrite(engine, () => {
      flushEvaluationHold(engine);

      const recalculations = takeHeldRecalculations(engine);

      if (recalculations.length > 0) {
        this.#validateHeldDependents(engine, recalculations, null);
      }
    });
  }

  /**
   * Releases the hold of the grids whose execution resumed without a release: an `afterResumeExecution`
   * listener that runs before the plugin's threw (a global one runs before every grid's own). Called before
   * each draw of any grid on the engine, so the later writes of the other grids are not held for them.
   */
  #releaseResumedHolders() {
    const engine = this.engine;

    if (engine && leaveResumedHolders(engine)) {
      this.#endEvaluationHold(engine, null);
    }
  }

  /**
   * Recalculates the writes a hold no grid holds anymore and settles it (`#releaseEvaluationHold()`).
   *
   * @param {object} engine The engine.
   * @param {number|null} leavingSheetId The sheet of a grid that is being destroyed, or `null`.
   */
  #endEvaluationHold(engine: HyperFormulaEngine, leavingSheetId: number | null) {
    withPluginEngineWrite(engine, () => {
      // Settled also when a listener of the recalculation throws, so the next hold starts empty.
      try {
        flushEvaluationHold(engine);
      } finally {
        settleEvaluationHold(engine, (recalculations: HeldRecalculation[]) => {
          this.#validateHeldDependents(engine, recalculations, leavingSheetId);
        });
      }
    });
  }

  /**
   * Validates the dependents a hold's recalculations owe a validation (`collectHeldDependents()`). Each one is
   * validated by the grid bound to its sheet, whichever grid ends the hold, because `validateDependentCells()`
   * checks the addresses against the size of the grid it runs on. The cells of a destroyed grid's sheet are
   * left out.
   *
   * @param {object} engine The engine.
   * @param {Array} recalculations The recalculations of the hold.
   * @param {number|null} leavingSheetId The sheet of a grid that is being destroyed, or `null`.
   */
  #validateHeldDependents(engine: HyperFormulaEngine, recalculations: HeldRecalculation[],
                          leavingSheetId: number | null) {
    const dependentsBySheet = new Map<number, unknown[]>();

    collectHeldDependents(recalculations).forEach((change) => {
      const sheet = isHFCellChange(change) ? change.address?.sheet : undefined;

      if (sheet === undefined || sheet === leavingSheetId) {
        return;
      }

      const dependents = dependentsBySheet.get(sheet);

      if (dependents === undefined) {
        dependentsBySheet.set(sheet, [change]);
      } else {
        dependents.push(change);
      }
    });

    // Most holds end with nothing to validate (every render's autosizing), so the registry is not read for them.
    if (dependentsBySheet.size === 0) {
      return;
    }

    const boundGrids = getRegisteredHotInstances(engine);

    dependentsBySheet.forEach((dependents, sheet) => {
      const plugin = boundGrids.get(sheet)?.getPlugin('formulas');

      if (plugin?.enabled && plugin.engine === engine) {
        plugin.validateDependentCells(dependents);
      }
    });
  }

  /**
   * Recalculates the writes held on the engine, so it can be read (see `flushEngineEvaluation()`).
   */
  #flushEvaluation() {
    flushEvaluationHold(this.engine);
  }

  /**
   * Validates the dependents of the writes held so far, before a structure change (an insert, a removal, a
   * move, a load) moves the cells the engine named them by, as they were validated without a hold.
   * The writes are recalculated first, without painting this grid: the change paints it.
   *
   * @param {boolean} [skipOwnSheet=false] `true` for a load: it replaces this grid's cells, and its data map is
   *   already gone, so only the other sheets' dependents are validated, by the grids bound to them.
   */
  #validateHeldWritesNow(skipOwnSheet = false) {
    const engine = this.engine;

    if (!engine) {
      return;
    }

    if (isEvaluationHeld(engine)) {
      this.#writeOwnSheet(engine, () => flushEvaluationHold(engine));
    }

    const recalculations = takeHeldRecalculations(engine);

    if (recalculations.length > 0) {
      this.#validateHeldDependents(engine, recalculations, skipOwnSheet ? this.sheetId : null);
    }
  }

  /**
   * The callback of the structure change hooks that carry no source (the row and column moves, a sort). See
   * `#validateHeldWritesNow()`.
   */
  #onBeforeStructureChange = () => {
    this.#validateHeldWritesNow();
  };

  /**
   * `beforeLoadData` and `beforeUpdateData` hook callback. See `#validateHeldWritesNow()`. The Core runs these
   * hooks with the data map already gone, so a recalculation listener that throws is reported, not rethrown:
   * the load must go on, or the grid is left with no data map.
   */
  #onBeforeLoadHeldData = () => {
    try {
      this.#validateHeldWritesNow(true);
    } catch (e) {
      warn(`Formulas: the recalculation before a data load failed: ${e instanceof Error ? e.message : e}`);
    }
  };

  /**
   * `#validateHeldWritesNow()` for a row or column insert or removal. The rows and columns `auto` adds or
   * gives back (`minSpareRows` and the like) sit at the end, so they move no cell a held write named.
   *
   * @param {string} [source] The source of the change.
   */
  #validateHeldWritesBeforeAlter(source?: string) {
    if (!isBlockedSource(source)) {
      this.#validateHeldWritesNow();
    }
  }

  /**
   * Validates the dependents of a cell write, or, when the write was held, records the cells it set, so
   * the release validates the dependents once, against the recalculated values.
   *
   * @param {Array} dependentCells The engine's change list of the write.
   * @param {Array} changedCells The cells the write set (`{ address }`).
   */
  #validateWriteDependents(dependentCells: unknown[], changedCells: unknown[]) {
    if (!recordHeldWrite(this.engine, changedCells)) {
      this.validateDependentCells(dependentCells, changedCells);
    }
  }

  /**
   * Runs an undo or redo write that needs its change list right away. When the write was held, the engine
   * is recalculated now and the recalculation is taken out of the hold: the restore validates its
   * dependents itself, so a restored cell is not validated twice (DEV-2036).
   *
   * @param {object} engine The engine.
   * @param {Function} write The write, returning the engine's change list.
   * @returns {object} The dependents, and the cells the held writes before it set (to leave out of them).
   */
  #runRestoreWrite(engine: HyperFormulaEngine, write: () => unknown[]): HeldRecalculation {
    const dependents = write();

    return flushEvaluationHoldNow(engine) ?? { dependents, changed: [] };
  }

  /**
   * Adds the sheet to the engine and tells what the engine did, apart from what the grids that repaint did.
   * A repaint that throws once the sheet is in the engine does not make the registration fail: the caller
   * binds the sheet first and then reports the error, so the grid is never left unbound to a sheet that
   * exists.
   *
   * @param {string|null} [sheetName] The name of the sheet.
   * @param {Array} [sheetData] Data passed to the engine, as an array of arrays.
   * @returns {{ addedSheetName: string|false, paintErrors: unknown[] }} The created sheet's name, or `false`
   * when the engine did not take it, and the errors the grids' repaints threw.
   */
  #addSheet(sheetName?: string | null, sheetData?: unknown[][]) {
    const paintErrors: unknown[] = [];

    if (isDefined(sheetData) && !isArrayOfArrays(sheetData)) {
      warn('The provided data should be an array of arrays.');

      return { addedSheetName: false as const, paintErrors };
    }

    if (sheetName !== undefined && sheetName !== null && this.engine?.doesSheetExist(sheetName)) {
      warn('Sheet with the provided name already exists.');

      return { addedSheetName: false as const, paintErrors };
    }

    const engine = this.engine!;
    let registered: string | undefined;

    try {
      withPluginEngineWrite(engine, () => this.#trackOwnEngineWrite(() => {
        const actualSheetName = engine.addSheet(sheetName ?? undefined);

        if (sheetData) {
          engine.setSheetContent(engine.getSheetId(actualSheetName), this.#readableSheet(sheetData));
        }

        registered = actualSheetName;
      }));
    } catch (e) {
      if (registered === undefined) {
        warn(e instanceof Error ? e.message : String(e));

        return { addedSheetName: false as const, paintErrors };
      }

      paintErrors.push(e);
    }

    return { addedSheetName: registered ?? (false as const), paintErrors };
  }

  /**
   * Switch the sheet used as data in the Handsontable instance (it loads the data from the shared HyperFormula
   * instance).
   *
   * The engine's serialized content keeps the escape apostrophe that dates and preserved text values
   * were written with, so it is unescaped before the load – otherwise the apostrophe becomes part of
   * the grid's data.
   *
   * The unescaping has to run BEFORE `loadData`, because afterwards the apostrophe is already part
   * of the grid's data, past every reader that could tell it apart from a user's own leading
   * apostrophe.
   *
   * The two cases are unescaped differently. A RELOAD of the sheet this grid is already synced to
   * (what `#onAfterCellMetaReset` performs on the empty-data branch) is confirmed against the
   * grid's own source data – see `#unescapeAgainstSourceData` – so it survives the escaping
   * configuration being turned off between the write and the reload.
   *
   * A switch to a genuinely DIFFERENT sheet has no such reference: the grid's data belongs to the
   * sheet being left. It is confirmed against the cell meta instead, with an accepted limitation –
   * that sheet's layout has no relation to this grid's index maps, so a physically-keyed meta layer
   * (the `cell` array, or a column-level one under a non-identity column map) can be matched
   * against the wrong cell. Only the global settings layer is layout-independent and always matches.
   *
   * @param {string} sheetName Sheet name used in the shared HyperFormula instance.
   */
  switchSheet(sheetName: string): void {
    this.#followedSheetNameSetting = undefined;
    this.#loadSheet(sheetName);
  }

  /**
   * Binds the grid to an engine sheet and loads its content into the grid: `switchSheet()`, and the
   * reloads the plugin makes itself. Only `switchSheet()` moves the binding away from the `sheetName`
   * setting, so only it drops the setting the binding followed (`#requestedSheetName()`): the next
   * settings update that names a sheet then binds it again, even when the value did not change.
   *
   * @param {string} sheetName Sheet name used in the shared HyperFormula instance.
   */
  #loadSheet(sheetName: string): void {
    this.#syncedContent = null;

    if (!this.engine?.doesSheetExist(sheetName)) {
      error(`The sheet named \`${sheetName}\` does not exist, switch aborted.`);

      return;
    }

    // Captured BEFORE the id is updated. A reload of the sheet this grid is already synced to - what
    // `#onAfterCellMetaReset` performs on the empty-data branch - can confirm the unescaping against
    // the grid's own source data, which a switch to a genuinely different sheet cannot.
    const isSameSheetReload = this.engine.getSheetId(sheetName) === this.sheetId;
    // A reload of the sheet the order syncers are synced with keeps the grid's order (`#reloadKeepingOrder()`).
    const keepsOrder = isSameSheetReload && this.#engineOrderHolds === 0
      && this.indexSyncer!.getEngine() === this.engine && this.indexSyncer!.getSheetId() === this.sheetId;

    if (!isSameSheetReload && this.#engineOrderHolds === 0) {
      this.#rememberLeftSheetOrder();
    }

    // The writes held before the switch are recalculated with the sheet they were made in still bound, and
    // their dependents validated while the grid still shows it (the load drops the data map first).
    this.#validateHeldWritesNow();
    this.#updateSheetNameAndSheetId(sheetName);

    const sheetContent = this.engine.getSheetSerialized(this.sheetId);
    const previousContent = this.#loadedSheetContent;
    const unescaped = this.#unescapeEngineSheetArray(this.#readableSheet(sheetContent), isSameSheetReload);
    // The engine holds the sheet in its own order; a reload that keeps the grid's order reads it back in
    // physical order.
    // An engine sheet that still holds what this grid left in it cannot have lost a line the grid holds content in,
    // so the plan reads no source row then.
    const isSheetAsLeft = keepsOrder && this.#isSheetAsLeft(sheetContent, previousContent);
    // A sheet this grid left in a non-physical engine order is read back in physical order through that order, as a
    // reload that keeps the order is.
    const revisit = !isSameSheetReload && this.#engineOrderHolds === 0 ? this.#takeLeftSheetOrder(unescaped) : null;
    const reload = keepsOrder ? this.#planReload(unescaped, isSheetAsLeft) : revisit;
    const physical = reload === null ? unescaped : this.#toPhysicalOrder(unescaped, reload);
    // The engine trims each row's trailing empty cells, and the core reads the column count off the
    // first row, so a first row that ends in an emptied cell would load a grid one column short.
    const padded = padRowsToWidestRow(physical);
    // A grid whose settings cap the column count below the padded width is left as it was: padding the
    // source rows past that count would make `#areSourceColumnsSkipped()` true, and the next resync would
    // write only the visible columns back into the sheet.
    const serialized = this.#isColumnCountCappedBySettings(padded[0]?.length ?? 0)
      ? trimTrailingEmptyCells(physical) : padded;
    const loadsData = serialized.length > 0;

    if (revisit !== null && loadsData) {
      this.#recordLoadedSheet(sheetContent);
      // The grid's order is the one the load's listeners apply: the move plugins re-apply their arrays onto the rows
      // in physical order. The engine holds the order the grid left the sheet in, which is that order only when
      // nothing moved the lines after the arrays; otherwise the hold's release sends the difference, as moves when
      // the left order was reached by moves alone (a drag), as one order when a sort or a sequence set reached it.
      this.#reloadKeepingOrder(serialized, revisit, false);

      return;
    }

    if (reload !== null && loadsData) {
      // Only a sheet nothing but this grid changed since the grid loaded it is reloaded in place. Any other change
      // can have moved or replaced the records under the grid's physical indexes, so it takes `loadData()`, which
      // drops the state keyed by them.
      const inPlace = this.#canReloadInPlace(reload, isSheetAsLeft);

      this.#recordLoadedSheet(sheetContent);

      if (inPlace) {
        this.#reloadInPlace(serialized);
      } else {
        this.#reloadKeepingOrder(serialized, reload);
      }

      return;
    }

    if (loadsData) {
      this.#recordLoadedSheet(sheetContent);
    }

    // The order syncers are pointed at the bound sheet BEFORE the load: the load's `afterLoadData` re-applies
    // a configured `manualRowMove`/`manualColumnMove`, and that move has to reach this sheet, not the one
    // bound before (a grid built without `data` had no endpoint at all, so its first sort threw). The grid's
    // order is not sent when a load follows: the load resets it, and the order it takes afterwards reaches
    // the engine once, through the sequence and move hooks. Sending the order the grid held before the load
    // as well reordered the sheet twice.
    this.indexSyncer!.setupSyncEndpoint(this.engine, this.sheetId, !loadsData);

    if (loadsData) {
      this.hot.loadData(serialized, `${toUpperCaseFirst(PLUGIN_KEY)}.switchSheet`);
    }
  }

  /**
   * Records the engine order of the bound sheet a load is about to leave (`#leftSheetOrders`), while the syncers
   * are synced with it and the order is not physical; a physical order drops the record.
   */
  #rememberLeftSheetOrder(): void {
    if (this.engine === null || this.sheetId === null || this.indexSyncer?.getEngine() !== this.engine
      || this.indexSyncer.getSheetId() !== this.sheetId) {
      return;
    }

    const order = this.exportEngineOrder();

    if (order === null) {
      this.#leftSheetOrders.delete(this.sheetId);

      return;
    }

    const { height, width } = this.engine.getSheetDimensions(this.sheetId);

    this.#leftSheetOrders.set(this.sheetId, {
      engine: this.engine, row: order.rowOrder, column: order.columnOrder, height, width,
    });
  }

  /**
   * Takes the record of the bound sheet out of `#leftSheetOrders` and plans its load through it: each axis is read
   * back in physical order through the recorded order, which the load then takes over. A record of another engine,
   * or of a sheet whose dimensions changed since the grid left it (a host that inserted or removed lines), describes
   * nothing the engine holds now, and the sheet is loaded as the engine holds it. A host move that keeps the
   * dimensions is not told apart: the grid then shows that sheet's records in another order, grid and engine equal.
   *
   * Before DEV-3760 the sheet loaded in the engine's order, and the move plugins' arrays, re-applied on
   * `afterLoadData`, moved it again on every visit (`manualRowMove: [2, 0, 1]` rotated the sheet per visit).
   *
   * @param {Array<Array<*>>} rows The sheet content, in engine order.
   * @returns {object|null}
   */
  #takeLeftSheetOrder(rows: unknown[][]): { row: ReloadAxis; column: ReloadAxis } | null {
    const record = this.sheetId === null ? undefined : this.#leftSheetOrders.get(this.sheetId);

    if (record === undefined) {
      return null;
    }

    this.#leftSheetOrders.delete(this.sheetId!);

    const { height, width } = this.engine!.getSheetDimensions(this.sheetId!);

    if (record.engine !== this.engine || record.height !== height || record.width !== width) {
      return null;
    }

    const planAxis = (order: EngineOrder, engineLength: number): ReloadAxis => ({
      order,
      elements: listEngineElements(order.sequence, order.fillSequence, Math.max(engineLength, order.sequence.length)),
      previousSequence: [],
      stale: false,
    });

    return {
      row: planAxis(record.row, rows.length),
      column: planAxis(record.column, widestRowLength(rows)),
    };
  }

  /**
   * Points the order syncers at the bound sheet, which a live grid has just filled from its source data, and
   * sends the grid's current order to it as every other load does (`AxisSyncer#init()`): an order no sort set goes
   * as moves, so each reference stays on its record, and a sorted order goes as one order. The new syncers have no
   * record of the order's history, so moves made under a sort go in that one order too. Every path that fills or binds
   * a sheet on a live grid has to come through here or through `#loadSheet()`: an enable left without an
   * endpoint sent no order to the engine at all, so a sort reordered the grid and left the formula results
   * where they were.
   */
  #setupSyncEndpointForFilledSheet(): void {
    if (this.engine === null || this.sheetId === null) {
      return;
    }

    this.indexSyncer!.setupSyncEndpoint(this.engine, this.sheetId);
  }

  /**
   * Builds what `disablePlugin()` keeps of a grid built from an engine sheet (`#sheetBuiltBindingAtDisable`). With an
   * order stored, the live sheet is read once: a sheet that equals the snapshot is kept as the snapshot alone (one
   * copy), and the enable rebuilds the content from it; any other sheet (a host change made after the grid's last
   * write, a value change or a move that changes no value, which no comparison has found yet) is kept as the order's
   * content, the snapshot is dropped so only that one copy is kept, and the change is marked foreign, so the next reload
   * of the same sheet takes `loadData()` (a missing snapshot forces it). Rebuilt from
   * the snapshot instead, the host change was lost when the enable added the sheet back. With no order (both axes
   * physical) nothing is read: the enable fills an added-back sheet from the source data, and a sheet the engine
   * still holds is compared against the snapshot by the next write or reload.
   *
   * @param {object} engine The engine.
   * @param {number} sheetId The bound sheet.
   * @returns {object}
   */
  #keepSheetBuiltBinding(engine: HyperFormulaEngine, sheetId: number): SheetBuiltBinding {
    let snapshot = this.#loadedSheetContent;
    let foreignSheetChange = this.#foreignSheetChange;
    let order = this.exportEngineOrder();

    if (order !== null) {
      flushEvaluationHold(engine);

      const live = engine.getSheetSerialized(sheetId);
      const snapshotHoldsSheet = snapshot !== null && !foreignSheetChange && areSheetContentsEqual(live, snapshot);

      if (!snapshotHoldsSheet) {
        order = { ...order, content: this.#readableSheet(live) };
        foreignSheetChange = snapshot !== null;
        // The order carries the content now, so only one copy is kept; a missing snapshot forces a full reload.
        snapshot = null;
      }
    }

    return {
      engine,
      sheetId,
      rowCount: this.hot.rowIndexMapper.getNumberOfIndexes(),
      columnCount: this.hot.columnIndexMapper.getNumberOfIndexes(),
      order,
      snapshot,
      foreignSheetChange,
    };
  }

  /**
   * Returns the content a re-enable adds back the sheet of a grid built from an engine sheet with, in the stored
   * engine order (`#sheetBuiltBindingAtDisable`), or `undefined` when no order was stored (the source data then
   * fills the sheet in physical order). The order carries the content when the disable found no snapshot holding the
   * sheet; otherwise it is rebuilt from the snapshot, which the disable found equal to the live sheet
   * (`#keepSheetBuiltBinding()`, `getSheetSerialized()` form).
   *
   * @param {object|null} binding What the disable kept.
   * @returns {Array<Array<*>>|undefined}
   */
  #sheetBuiltContent(binding: SheetBuiltBinding | null): unknown[][] | undefined {
    if (binding === null || binding.order === null) {
      return undefined;
    }

    if (binding.order.content !== undefined) {
      return binding.order.content;
    }

    return binding.snapshot === null ? undefined : this.#readableSheet(binding.snapshot);
  }

  /**
   * Binds again the sheet of a grid built from an engine sheet on a re-enable, as the grid left it at the disable
   * (`#sheetBuiltBindingAtDisable`): the engine holds it in the grid's order of then, or the enable has just added it
   * back from the content the engine held then (an engine class builds a new engine). The new syncers take that
   * order over, so the engine follows the grid's current order from it: a sort or a move made while the plugin was
   * off reaches the engine as one order, and a grid that kept its order sends nothing. With no stored order (the
   * engine held the physical order on both axes) the setup sends the grid's order as
   * `#setupSyncEndpointForFilledSheet()` does: as moves unless a sort set it. The reload snapshot is put back too
   * (taken anew for a sheet added back), so the next settings update reloads in place and keeps the sort state and the
   * cell meta; a change someone else made to the sheet while the plugin was off is told by the next write or reload,
   * as on a grid never turned off.
   *
   * The binding is not taken over when it describes no sheet the engine holds now: another engine sheet (another
   * engine instance holding a sheet of the same name), or a grid whose row or column count changed while the plugin
   * was off (the engine never got the insert or the removal). The caller then loads the engine sheet into the grid
   * (`#loadSheet()`), as switching to it would: the grid shows what the engine holds, in the engine's order, and the
   * change made while off is dropped. Mapped through the stored order or the identity, the grid showed the results of
   * other records, or a formula's text.
   *
   * Before DEV-3760 no path set the endpoint up here: a sorted grid's next sort reordered the grid and left the
   * engine's rows where they were, so the formula column showed the wrong records' results.
   *
   * @param {object|null} binding What the disable kept.
   * @param {boolean} addedFromContent Whether the enable has just added the sheet from the stored content
   *   (`#sheetBuiltContent()`).
   * @returns {boolean} `false` when the caller has to load the sheet into the grid instead.
   */
  #setupSyncEndpointForSheetBuiltGrid(
    binding: SheetBuiltBinding | null,
    addedFromContent: boolean,
  ): boolean {
    if (this.engine === null || this.sheetId === null) {
      return true;
    }

    const countsKept = binding !== null
      && binding.rowCount === this.hot.rowIndexMapper.getNumberOfIndexes()
      && binding.columnCount === this.hot.columnIndexMapper.getNumberOfIndexes();
    const sameSheet = binding !== null && binding.engine === this.engine && binding.sheetId === this.sheetId;

    // A foreign change found by the disable (or before it) means the stored order may not describe the content the
    // enable added back (a host move), so that sheet is loaded as it is.
    if (binding === null || !countsKept || (addedFromContent ? binding.foreignSheetChange : !sameSheet)) {
      return false;
    }

    if (addedFromContent) {
      // The enable wrote the sheet itself, so it holds exactly what the grid left.
      this.#flushEvaluation();
      this.#recordLoadedSheet(this.engine.getSheetSerialized(this.sheetId));
    } else {
      this.#loadedSheetContent = binding.snapshot;
      this.#foreignSheetChange = binding.foreignSheetChange;
    }

    const { order } = binding;

    this.indexSyncer!.setupSyncEndpoint(this.engine, this.sheetId, order === null);

    if (order !== null) {
      this.rowAxisSyncer!.adoptEngineOrder(order.rowOrder);
      this.columnAxisSyncer!.adoptEngineOrder(order.columnOrder);
    }

    return true;
  }

  /**
   * Records what a load of the bound sheet read, for the next reload to compare against.
   *
   * @param {Array<Array<*>>} sheetContent The sheet as `getSheetSerialized()` returned it.
   */
  #recordLoadedSheet(sheetContent: unknown[][]): void {
    this.#foreignSheetChange = false;

    // Only a grid built from the sheet keeps the snapshot in step with its own writes (`#trackOwnEngineWrite()`). A
    // grid built with `data` that switched sheets held a full copy that went stale with its first edit, after which
    // every `switchSheet()` to that sheet compared against it only to take `loadData()`; it takes it at once now.
    if (!this.#hotWasInitializedWithEmptyData) {
      this.#loadedSheetContent = null;

      return;
    }

    // A copy: the rows the grid loads can be the very arrays the engine returned, and the grid writes into them.
    this.#loadedSheetContent = sheetContent.map(row => row.slice());
  }

  /**
   * Tells whether the engine sheet holds exactly what this grid left in it: the snapshot of the last load or of
   * this grid's last write after it (`#loadedSheetContent`), with no change of someone else's found in between
   * (`#foreignSheetChange`).
   *
   * @param {Array<Array<*>>} sheetContent The sheet as `getSheetSerialized()` returns it now.
   * @param {Array<Array<*>>|null} previousContent The snapshot, or `null` before a load.
   * @returns {boolean}
   */
  #isSheetAsLeft(sheetContent: unknown[][], previousContent: unknown[][] | null): boolean {
    return previousContent !== null && !this.#foreignSheetChange
      && areSheetContentsEqual(sheetContent, previousContent);
  }

  /**
   * Tells whether a reload of the sheet the syncers are synced with can keep the grid's state (`#reloadInPlace()`):
   * nothing but this grid changed the engine sheet since the grid last loaded it. The engine reports no event for
   * a host's `addRows()`, `removeRows()` or `moveRows()` that changes no value, so the content is compared, exactly
   * (`areSheetContentsEqual()`: formula text, a number against its text, an empty cell), against the snapshot
   * this grid keeps of the sheet after its load and after each of its own writes (`#trackOwnEngineWrite()`).
   * Every write of this grid runs in such a scope, so any difference is a change of someone else's: the host, or
   * another grid on the sheet. An axis whose record no longer describes the sheet (`stale`) never reloads in place.
   *
   * @param {object} reload The plan of both axes (`#planReload()`).
   * @param {boolean} isSheetAsLeft What `#isSheetAsLeft()` answered for the sheet the reload read.
   * @returns {boolean}
   */
  #canReloadInPlace(reload: { row: ReloadAxis; column: ReloadAxis }, isSheetAsLeft: boolean): boolean {
    return !reload.row.stale && !reload.column.stale && isSheetAsLeft;
  }

  /**
   * Runs a write of this grid to the engine and keeps the snapshot of the bound sheet (`#loadedSheetContent`) in
   * step with it, for a grid built from the sheet. Three kinds, so a write costs no more than it did before the
   * snapshot existed, except an order or a move:
   *
   * - **`'cells'`** (an edit, a paste, a validator's correction, the early write, the write on apply, a restore of
   *   written cells): each cell of the bound sheet the engine reports changed while it runs (`valuesUpdated`) is
   *   read again into the snapshot when it ends (`#refreshTrackedCells()`): a cell it set itself as the engine
   *   holds it, a recalculated one only while neither side is a formula (spilled values). A host change made before
   *   it stays visible: the cells it touched are not read again, unless this write set them too, and then the
   *   snapshot holds what the engine and the grid both hold.
   * - **`'structural'`** (the default: an order or a move from the axis syncer, MoveCells, an undo or redo restore
   *   of the sheet, a NestedRows detach, the sheets bar's writes): the snapshot is read again in full when it ends.
   *   Read in full, it would take in a host change made before the write, so the write first compares the sheet
   *   with the snapshot, and a difference sets `#foreignSheetChange` until the next load.
   * - **`'resets'`** (an insert or a removal of rows or columns): the snapshot is dropped, so the next reload loads
   *   the sheet with `loadData()`, as every reload did before this path existed, and takes a new one. Nothing is
   *   read, so the insert or removal costs what it did.
   *
   * Nested writes join the outermost one (`#joinTrackedWrite()`). A write that throws counts as a foreign change. A
   * validation probe takes its own write back before it ends, so it is not tracked.
   *
   * While a `batchEvaluation` hold keeps the engine suspended, the engine refuses the reads the snapshot takes. A
   * `'cells'` write made then keeps the snapshot and reads its cells once the engine resumes
   * (`#holdTrackedCells()`). Any other write made then drops the snapshot, as an insert does.
   *
   * @param {Function} fn The write.
   * @param {string} [kind] How the write keeps the snapshot in step.
   * @returns {*} What `fn` returns.
   */
  #trackOwnEngineWrite<T>(fn: () => T, kind: OwnEngineWriteKind = 'structural'): T {
    if (this.#trackedOwnWriteDepth > 0) {
      this.#joinTrackedWrite(kind);

      return fn();
    }

    const sheetId = this.sheetId;

    if (!this.#hotWasInitializedWithEmptyData || this.#loadedSheetContent === null || sheetId === null
      || !this.engine || isPluginEngineProbe(this.engine) || !this.#hasOwnSheet()) {
      return fn();
    }

    const engine = this.engine;

    // A suspended engine (a `batchEvaluation` hold) refuses the reads the snapshot takes, so a write made then
    // drops it, as an insert does, unless it is a cell write, whose cells are read once the engine resumes.
    this.#trackedWriteIsStructural = kind === 'structural';
    this.#trackedWriteResets = kind === 'resets' || (kind !== 'cells' && engine.isEvaluationSuspended());
    this.#trackedChangedCells = [];
    this.#trackedSetCells.clear();

    if (this.#trackedWriteIsStructural && !this.#trackedWriteResets) {
      this.#checkSheetAsLeft();
    }

    this.#trackedOwnWriteDepth += 1;

    let result: T;

    try {
      result = fn();
    } catch (e) {
      this.#foreignSheetChange = true;

      throw e;
    } finally {
      this.#trackedOwnWriteDepth -= 1;
    }

    if (this.#trackedWriteResets || this.engine !== engine || this.sheetId !== sheetId || !this.#hasOwnSheet()) {
      this.#loadedSheetContent = null;
    } else if (engine.isEvaluationSuspended()) {
      if (this.#trackedWriteIsStructural || !this.#holdTrackedCells(engine, sheetId)) {
        this.#loadedSheetContent = null;
      }
    } else if (this.#trackedWriteIsStructural) {
      this.#loadedSheetContent = engine.getSheetSerialized(sheetId);
    } else {
      this.#refreshTrackedCells();
    }

    this.#trackedChangedCells = [];
    this.#trackedSetCells.clear();

    return result;
  }

  /**
   * Joins a write nested in the tracked write on the stack. A write that drops the snapshot makes the whole write
   * drop it. A structural write nested in a cell write turns the whole write structural: the cells collected so far
   * are refreshed first, then the sheet is checked (`#checkSheetAsLeft()`), as the outermost write would have.
   *
   * @param {string} kind The nested write's kind.
   */
  #joinTrackedWrite(kind: OwnEngineWriteKind): void {
    if (kind === 'resets' || (kind !== 'cells' && this.engine?.isEvaluationSuspended())) {
      this.#trackedWriteResets = true;
    } else if (kind === 'structural' && !this.#trackedWriteIsStructural && !this.#trackedWriteResets) {
      this.#refreshTrackedCells();
      this.#checkSheetAsLeft();
      this.#trackedWriteIsStructural = true;
    }
  }

  /**
   * Notes an engine cell of the bound sheet a tracked cell write sets itself (`#refreshTrackedCells()`).
   *
   * @param {object} address The engine address.
   */
  #noteOwnCellWrite(address: { sheet: number | null; row: number; col: number }): void {
    if (this.#trackedOwnWriteDepth > 0 && address.sheet === this.sheetId) {
      this.#trackedSetCells.add(`${address.row},${address.col}`);
    }
  }

  /**
   * Sets `#foreignSheetChange` when the engine sheet no longer holds the snapshot (`#loadedSheetContent`).
   */
  #checkSheetAsLeft(): void {
    if (!this.#foreignSheetChange && this.#loadedSheetContent !== null
      && !areSheetContentsEqual(this.engine!.getSheetSerialized(this.sheetId!), this.#loadedSheetContent)) {
      this.#foreignSheetChange = true;
    }
  }

  /**
   * Keeps the engine addresses on the bound sheet from a `valuesUpdated` change list, for the tracked write on the
   * stack.
   *
   * @param {Array} changes The engine's change list.
   */
  #collectTrackedChanges(changes: unknown[]): void {
    changes.forEach((change) => {
      const address = (change as { address?: { sheet: number; row: number; col: number } }).address;

      if (address && address.sheet === this.sheetId) {
        this.#trackedChangedCells.push({ row: address.row, col: address.col });
      }
    });
  }

  /**
   * Reads the cells the tracked write changed into the snapshot (`setSheetSnapshotCell()`). A cell the write set
   * itself takes whatever the engine holds. A cell the engine only recalculated changes its value, never its
   * content, except a spilled value, which the engine serializes as plain data: so a recalculated cell takes the
   * engine's content only when neither side is a formula. A formula there that differs from the snapshot, or a
   * formula where the snapshot holds none, is a change of someone else's (a host's row move of formulas that read
   * the edited cell), and `#foreignSheetChange` is set instead of taking it in.
   */
  #refreshTrackedCells(): void {
    this.#refreshSnapshotCells(this.#trackedChangedCells, this.#trackedSetCells);
    this.#trackedChangedCells = [];
  }

  /**
   * Reads cells into the snapshot, by the rule of `#refreshTrackedCells()`.
   *
   * @param {Array} changedCells The engine addresses on the bound sheet to read.
   * @param {Set<string>} setCells The ones a write of this grid set itself (`row,col`).
   */
  #refreshSnapshotCells(changedCells: Array<{ row: number; col: number }>, setCells: Set<string>): void {
    const snapshot = this.#loadedSheetContent;

    if (snapshot === null) {
      return;
    }

    changedCells.forEach(({ row, col }) => {
      const content: unknown = this.engine!.getCellSerialized({ sheet: this.sheetId!, row, col });

      if (!setCells.has(`${row},${col}`)) {
        const previous = snapshot[row]?.[col];

        if ((isFormula(previous) || isFormula(content)) && previous !== content) {
          this.#foreignSheetChange = true;

          return;
        }
      }

      setSheetSnapshotCell(snapshot, row, col, content);
    });
  }

  /**
   * Keeps the cells of the tracked cell write that just ended while a `batchEvaluation` hold kept the engine
   * suspended, to read them into the snapshot once the engine resumes (`#refreshHeldSnapshotCells()`), together
   * with the cells that resume recalculates. Reading them now would recalculate once per write. Every held write
   * up to that resume shares one record and one deferred read.
   *
   * @param {object} engine The engine the write went to.
   * @param {number} sheetId The bound sheet.
   * @returns {boolean} `false` when the plugin does not own the suspension (a host's `suspendEvaluation()`), so
   *   nothing tells when the engine can be read, and the caller drops the snapshot.
   */
  #holdTrackedCells(engine: HyperFormulaEngine, sheetId: number): boolean {
    const snapshot = this.#loadedSheetContent!;
    let held = this.#heldSnapshotCells;

    if (held === null || held.engine !== engine || held.sheetId !== sheetId || held.snapshot !== snapshot) {
      const record: HeldSnapshotCells = {
        engine, sheetId, snapshot, setCells: new Set(), changedCells: [],
      };

      if (!runAfterEvaluationFlush(engine, () => this.#refreshHeldSnapshotCells(record))) {
        return false;
      }

      this.#heldSnapshotCells = record;
      held = record;
    }

    const record = held;

    this.#trackedSetCells.forEach(key => record.setCells.add(key));
    this.#trackedChangedCells.forEach(cell => record.changedCells.push(cell));

    return true;
  }

  /**
   * Keeps the engine addresses on the bound sheet from the `valuesUpdated` change list of the resume that ends
   * held cell writes (`#holdTrackedCells()`).
   *
   * @param {object} held The record of the held writes.
   * @param {Array} changes The engine's change list.
   */
  #collectHeldSnapshotChanges(held: HeldSnapshotCells, changes: unknown[]): void {
    changes.forEach((change) => {
      const address = (change as { address?: { sheet: number; row: number; col: number } }).address;

      if (address && address.sheet === held.sheetId) {
        held.changedCells.push({ row: address.row, col: address.col });
      }
    });
  }

  /**
   * Reads the cells of held cell writes into the snapshot, now that the engine resumed: every cell the writes
   * set, and the cells the resume recalculated, by the rule of `#refreshTrackedCells()`. Nothing is read when the
   * snapshot the writes were made against is gone: a later write of the hold dropped it, or the grid left the
   * sheet or the engine.
   *
   * @param {object} held The record of the held writes.
   */
  #refreshHeldSnapshotCells(held: HeldSnapshotCells): void {
    if (this.#heldSnapshotCells === held) {
      this.#heldSnapshotCells = null;
    }

    if (this.#loadedSheetContent !== held.snapshot || this.engine !== held.engine
      || this.sheetId !== held.sheetId || !this.#hasOwnSheet()) {
      return;
    }

    const cells = new Map<string, { row: number; col: number }>();

    held.changedCells.forEach(cell => cells.set(`${cell.row},${cell.col}`, cell));
    held.setCells.forEach((key) => {
      const [row, col] = key.split(',').map(Number) as [number, number];

      cells.set(key, { row, col });
    });

    this.#refreshSnapshotCells(Array.from(cells.values()), held.setCells);
  }

  /**
   * Reloads the sheet the order syncers are synced with through `updateData()`, which keeps the grid's state:
   * the index maps (row and column order, a sort, moves, hidden lines, manual sizes; `fitToLength()` drops only
   * blank lines past the sheet, since a sheet anything but this grid changed takes `#reloadKeepingOrder()`),
   * the sort plugins' state, the cell meta, and every change still waiting for
   * its validator, which the Core then writes at its coordinates of the reloaded rows. The rows come in physical
   * order (`#toPhysicalOrder()`, done by the caller) and the grid keeps its order, so the syncers' engine order
   * still describes the engine sheet and nothing is sent to the engine. ManualRowMove and ManualColumnMove
   * re-apply their arrays on `afterLoadData` only, so they do not move the rows again. A `loadData()` here
   * dropped a waiting edit and reset the sort state while the order put back kept the rows sorted.
   *
   * The engine's formula text is in the engine's order, so with the order not physical the loaded source data
   * holds text the engine would write differently in physical order: `#sourceHasStaleFormulas` records it.
   *
   * @param {Array<Array<*>>} data The sheet content, in physical order.
   */
  #reloadInPlace(data: unknown[][]): void {
    this.hot.updateData(data, `${toUpperCaseFirst(PLUGIN_KEY)}.switchSheet`);

    // A listener can have destroyed the grid or turned the plugin off during the update.
    if (!this.enabled || this.hot.isDestroyed) {
      return;
    }

    if (!this.rowAxisSyncer!.isEngineOrderPhysical() || !this.columnAxisSyncer!.isEngineOrderPhysical()) {
      this.#sourceHasStaleFormulas = this.#sourceHasStaleFormulas || this.#engineHoldsFormula();
    }
  }

  /**
   * Reloads the sheet the order syncers are synced with, keeping the grid's row and column order, when anything
   * but this grid changed the engine sheet since the grid loaded it (`#canReloadInPlace()`), or the recorded order
   * of an axis no longer describes it (`#planReloadAxis()`): the load drops the state keyed by physical indexes,
   * which may no longer name the same records. A grid
   * built from an engine sheet without `data` reloads it on every `updateSettings()`. The engine holds the
   * sheet in the grid's order, and the load resets the grid's order, after which ManualRowMove and
   * ManualColumnMove re-apply their arrays in `afterLoadData`. Read as the engine holds it and taken as
   * physical, the re-applied move moved the rows once more per reload, and was sent to the engine again. So
   * the sheet is read back in physical order (`#toPhysicalOrder()`, done by the caller), which keeps the
   * physical indexes and with them the syncers' engine order valid, and the load runs with the order held:
   * the plugin's own `afterLoadData` takes the engine order over (`#reloadEngineOrder`), the re-applied moves
   * are not sent, and the grid's order is put back to the one it had before the load. The release finds the
   * engine holding that order and sends nothing. So a user's drag survives the reload too, as it does on a
   * grid built with `data`, where `updateSettings()` loads nothing.
   *
   * The engine's formula text is in the engine's order, so with the order not physical the loaded source data
   * holds text the engine would write differently in physical order: `#sourceHasStaleFormulas` records it.
   *
   * An axis whose recorded order no longer describes the engine sheet (`#planReloadAxis()`) is read as the
   * engine holds it instead, and the grid shows it in that order.
   *
   * A switch back to a sheet the grid left (`#takeLeftSheetOrder()`) loads it the same way, but keeps the order the
   * load's listeners applied (`putBackOrder` `false`): the grid's order before the load belongs to the sheet it left.
   * That order can differ from the one the engine kept (a drag on the visit before), and the release sends the
   * difference: as moves when the kept order was reached by moves alone (`releaseAdoptedOrderAsMoves()`), otherwise
   * as one order.
   *
   * @param {Array<Array<*>>} data The sheet content, in physical order.
   * @param {object} reload The plan of both axes (`#planReload()`).
   * @param {boolean} [putBackOrder=true] Whether to put the grid's order before the load back.
   */
  #reloadKeepingOrder(
    data: unknown[][], reload: { row: ReloadAxis; column: ReloadAxis }, putBackOrder: boolean = true,
  ): void {
    this.runWithEngineOrderHeld(() => {
      this.indexSyncer!.setupSyncEndpoint(this.engine, this.sheetId, false);
      this.#reloadEngineOrder = { row: reload.row.order, column: reload.column.order };

      try {
        this.hot.loadData(data, `${toUpperCaseFirst(PLUGIN_KEY)}.switchSheet`);
      } finally {
        this.#reloadEngineOrder = null;
      }

      // A listener can have destroyed the grid or turned the plugin off during the load.
      if (!this.enabled || this.hot.isDestroyed) {
        return;
      }

      // The order the load's listeners applied is dropped: the rows already stood in the grid's order. A
      // line the sheet gained since takes its place as the engine reads it (`listEngineElements()`); an axis
      // read as the engine holds it is shown in that order (the identity).
      const putBack = (mapper: IndexMapper, previousSequence: number[]) => {
        const sequence = listEngineElements(previousSequence, null, mapper.getNumberOfIndexes());
        const current = mapper.getIndexesSequence();

        if (sequence.some((physicalIndex, position) => physicalIndex !== current[position])) {
          mapper.setIndexesSequence(sequence);
        }
      };

      if (putBackOrder) {
        putBack(this.hot.rowIndexMapper, reload.row.previousSequence);
        putBack(this.hot.columnIndexMapper, reload.column.previousSequence);
      } else {
        // The engine kept the sheet in the order the grid left it in, reached by moves when no sort or sequence set
        // reached it; the arrays applied again reach the grid's order from it by moves too, so the release sends
        // them as moves (one order would shift the references across the moved lines).
        this.rowAxisSyncer!.releaseAdoptedOrderAsMoves();
        this.columnAxisSyncer!.releaseAdoptedOrderAsMoves();
      }

      if (!this.rowAxisSyncer!.isEngineOrderPhysical() || !this.columnAxisSyncer!.isEngineOrderPhysical()) {
        this.#sourceHasStaleFormulas = this.#sourceHasStaleFormulas || this.#engineHoldsFormula();
      }
    });
  }

  /**
   * Tells whether the engine holds a formula in the bound sheet.
   *
   * @returns {boolean}
   */
  #engineHoldsFormula(): boolean {
    return this.engine!.getSheetFormulas(this.sheetId!).some(row => row.some(isDefined));
  }

  /**
   * Plans a reload that keeps the grid's order (`#reloadKeepingOrder()`), per axis (`#planReloadAxis()`). It
   * runs before the sync endpoint is set up again, while the syncers still hold the recorded engine order. The
   * grid's source rows are read once, and only when an axis needs them.
   *
   * @param {Array<Array<*>>} rows The sheet content, in engine order.
   * @returns {object}
   */
  #planReload(rows: unknown[][], isSheetAsLeft: boolean): { row: ReloadAxis; column: ReloadAxis } {
    // Read only when an axis asks: that takes an axis out of physical order with lines the engine left out, and a
    // sheet someone else changed, so a reload of a sheet only this grid changed (every React or Vue re-render of
    // one) reads nothing.
    let sourceRows: unknown[][] | null = null;
    const readSourceRows = () => {
      sourceRows ??= this.#readOwnSourceRows();

      return sourceRows;
    };
    const hasContent = (value: unknown) => value !== null && value !== undefined && value !== '';

    return {
      row: this.#planReloadAxis(
        this.rowAxisSyncer!, this.hot.rowIndexMapper, rows.length,
        physicalRow => !isSheetAsLeft && this.#readOwnSourceRow(physicalRow).some(hasContent),
      ),
      column: this.#planReloadAxis(
        this.columnAxisSyncer!, this.hot.columnIndexMapper, widestRowLength(rows),
        physicalColumn => !isSheetAsLeft && readSourceRows().some(row => hasContent(row?.[physicalColumn])),
      ),
    };
  }

  /**
   * Plans how a reload that keeps the grid's order reads one axis of the sheet back. An axis the engine holds
   * in physical order is read as it is. An axis it holds in another order is read back in physical order
   * through the recorded order (`elements`), and covers the whole axis: the engine leaves out its trailing
   * lines that hold nothing, and a blank line the order put last is one of them. The engine sheet can have
   * changed since the record, though: a host that removed lines or replaced the sheet with a smaller one
   * through the engine API. That shows as a line the engine left out while the grid holds content in it, so
   * then the record no longer describes the sheet, and the axis is read as the engine holds it and taken as
   * physical (`elements` `null`, the order physical, the grid shown in that order), the way a grid without a
   * move reads it. Lines the engine gained are read through the record too (`listEngineElements()` names
   * them after the recorded ones), so the grid shows them where the engine has them.
   *
   * @param {AxisSyncer} syncer The axis syncer.
   * @param {IndexMapper} indexMapper The axis' index mapper.
   * @param {number} engineLength How many lines of the axis the engine wrote out.
   * @param {Function} hasContent Tells whether the grid holds content in a line, by its physical index.
   * @returns {object}
   */
  #planReloadAxis(
    syncer: AxisSyncer,
    indexMapper: IndexMapper,
    engineLength: number,
    hasContent: (physicalIndex: number) => boolean,
  ): ReloadAxis {
    const order = syncer.getEngineOrder();
    const previousSequence = indexMapper.getIndexesSequence();

    if (syncer.isEngineOrderPhysical()) {
      return { order, elements: null, previousSequence, stale: false };
    }

    const gridLength = indexMapper.getNumberOfIndexes();

    const elements = listEngineElements(order.sequence, order.fillSequence, Math.max(engineLength, gridLength));

    if (hasContentPast(engineLength, gridLength, engineIndex => hasContent(elements[engineIndex]))) {
      return {
        order: { sequence: [], fillSequence: null, paddedElements: [], orderShifts: [] },
        elements: null,
        previousSequence: [],
        stale: true,
      };
    }

    return { order, elements, previousSequence, stale: false };
  }

  /**
   * Reads one of the grid's source rows as the grid stores it, by physical row, without the engine's projection.
   *
   * @param {number} physicalRow The physical row.
   * @returns {Array<*>}
   */
  #readOwnSourceRow(physicalRow: number): unknown[] {
    const wasProjectionSuspended = this.#sourceDataProjectionSuspended;

    this.#sourceDataProjectionSuspended = true;

    try {
      const row: unknown = this.hot.getSourceDataAtRow(physicalRow);

      return Array.isArray(row) ? row as unknown[] : [];
    } finally {
      this.#sourceDataProjectionSuspended = wasProjectionSuspended;
    }
  }

  /**
   * Reads the grid's source rows as the grid stores them, by physical row, without the engine's projection.
   *
   * @returns {Array<Array<*>>}
   */
  #readOwnSourceRows(): unknown[][] {
    return Array.from(
      { length: this.hot.rowIndexMapper.getNumberOfIndexes() }, (_, physicalRow) => this.#readOwnSourceRow(physicalRow)
    );
  }

  /**
   * Puts the rows and columns of a sheet read from the engine back in physical order, through the elements
   * `#planReloadAxis()` planned for each axis. An axis with no elements is left as read.
   *
   * @param {Array<Array<*>>} rows The sheet content, in engine order.
   * @param {object} reload The plan of both axes.
   * @returns {Array<Array<*>>}
   */
  #toPhysicalOrder(rows: unknown[][], reload: { row: ReloadAxis; column: ReloadAxis }): unknown[][] {
    const rowElements = reload.row.elements;
    const columnElements = reload.column.elements;

    if (rowElements === null && columnElements === null) {
      return rows;
    }

    const height = rowElements?.length ?? rows.length;
    const width = columnElements?.length ?? rows.reduce((widest, row) => Math.max(widest, row.length), 0);
    const physical = Array.from({ length: height }, () => new Array<unknown>(width).fill(null));

    rows.forEach((row, engineRow) => {
      row.forEach((value, engineColumn) => {
        physical[rowElements?.[engineRow] ?? engineRow][columnElements?.[engineColumn] ?? engineColumn] = value;
      });
    });

    return physical;
  }

  /**
   * Returns the order the engine holds the bound sheet in, when it is not the physical order on either
   * axis (a sort or a move reached the engine), or `null`. A caller that loads the sheet's data again
   * later and puts the same row and column order back on the grid passes it to
   * {@link Formulas#runWithEngineOrderHeld}, which then takes the engine sheet over instead of writing
   * the data into it. With `withContent`, the order also carries the engine sheet's content, which a
   * later binding to another engine sheet writes before it takes the order over.
   *
   * @private
   * @param {boolean} [withContent] Whether to include the engine sheet's content.
   * @returns {object|null}
   */
  exportEngineOrder(withContent = false): FormulasEngineSheetOrder | null {
    if (!this.enabled || !this.engine || this.sheetId === null || !this.#hasOwnSheet()
      || (this.rowAxisSyncer!.isEngineOrderPhysical() && this.columnAxisSyncer!.isEngineOrderPhysical())) {
      return null;
    }

    if (withContent) {
      this.#flushEvaluation();
    }

    return {
      engine: this.engine,
      sheetId: this.sheetId,
      rowOrder: this.rowAxisSyncer!.getEngineOrder(),
      columnOrder: this.columnAxisSyncer!.getEngineOrder(),
      ...(withContent ? { content: this.#readableSheet(this.engine.getSheetSerialized(this.sheetId)) } : {}),
    };
  }

  /**
   * Runs an operation that replaces the grid's data and puts a row and column order back on it: the
   * SheetsBar plugin, on a sheet switch. While it runs, the grid's order changes do not reach the engine,
   * so the sheet the grid leaves keeps the order the user left it in, and the order changes on the way to
   * the arriving sheet's order (a sort cleared and applied again) leave no mark in the engine. When it
   * ends, the grid's order is sent once.
   *
   * The engine moves formula cells on every order it is handed, so the sheet's formula text in the
   * engine depends on how the order was reached, and loading the sheet's data and sorting it again gives
   * other formulas than the ones the user saw. With `adopt` given (what {@link Formulas#exportEngineOrder}
   * reported when the sheet was left), a load that binds that sheet takes the engine sheet over instead:
   * it writes nothing, and the order the engine holds becomes the stored one, which the grid's order
   * ends on. Only the first such load takes it over: a later load in the same operation brings other data.
   * When `adopt` carries the engine sheet's content, the first load takes it over whatever engine sheet it
   * binds: it writes that content instead of the loaded data, so a sheet whose engine was destroyed or
   * whose engine sheet was replaced comes back with the formulas the user left.
   *
   * A move made in the operation is held like a sort. Rows or columns inserted or removed in it are not
   * supported: the engine changes positionally through the held order, which the stored order then no
   * longer describes.
   *
   * @private
   * @param {Function} run The operation.
   * @param {object|null} [adopt] The engine order of the sheet a load in the operation takes over.
   */
  runWithEngineOrderHeld(run: () => void, adopt: FormulasEngineSheetOrder | null = null): void {
    this.#engineOrderHolds += 1;

    const outermost = this.#engineOrderHolds === 1;

    if (outermost) {
      this.#pendingAdoption = adopt === null ? null : { order: adopt, adopted: false };
    }

    this.indexSyncer?.setOrderHeld(true);

    try {
      run();

    } finally {
      this.#engineOrderHolds -= 1;

      if (outermost) {
        this.#pendingAdoption = null;
        this.indexSyncer?.setOrderHeld(false, this.enabled && this.engine !== null);
      }
    }
  }

  /**
   * Get the cell type under specified visual coordinates.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {number} [sheet] The target sheet id, defaults to the current sheet.
   * @returns {string} Possible values: 'FORMULA' | 'VALUE' | 'ARRAYFORMULA' | 'EMPTY'.
   */
  getCellType(row: number, column: number, sheet: number | null = this.sheetId): unknown {
    const physicalRow = this.hot.toPhysicalRow(row);
    const physicalColumn = this.hot.toPhysicalColumn(column);

    if (physicalRow !== null && physicalColumn !== null) {
      return this.engine!.getCellType({
        sheet,
        row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(row),
        col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(column),
      });

    } else {
      // Should return `EMPTY` when out of bounds (according to the test cases).
      return 'EMPTY';
    }
  }

  /**
   * Returns `true` if under specified visual coordinates is formula.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {number} [sheet] The target sheet id, defaults to the current sheet.
   * @returns {boolean}
   */
  isFormulaCellType(row: number, column: number, sheet: number | null = this.sheetId): boolean {
    return this.engine!.doesCellHaveFormula({
      sheet,
      row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(row),
      col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(column),
    });
  }

  /**
   * Makes every formula cell display its formula text (for example `=SUM(A1:A2)`) instead of its
   * calculated value, until {@link Formulas#hideFormulas} is called. Copying a formula cell in this
   * mode copies its formula text, matching what is on screen. Toggled by default with
   * `Ctrl`+`` ` ``. Does nothing while the plugin is disabled.
   */
  showFormulas(): void {
    if (!this.enabled || this.#showFormulasFlag) {
      return;
    }

    this.#showFormulasFlag = true;
    this.hot.markAllCellsChanged();
    this.hot.render();
  }

  /**
   * Reverts {@link Formulas#showFormulas}: formula cells display their calculated value again. Does
   * nothing while the plugin is disabled.
   */
  hideFormulas(): void {
    if (!this.enabled || !this.#showFormulasFlag) {
      return;
    }

    this.#showFormulasFlag = false;
    this.hot.markAllCellsChanged();
    this.hot.render();
  }

  /**
   * Returns `true` when formula cells are currently displaying their formula text instead of their
   * calculated value (see {@link Formulas#showFormulas}).
   *
   * @returns {boolean}
   */
  isShowingFormulas(): boolean {
    return this.#showFormulasFlag;
  }

  /**
   * Returns the cells and cell ranges that depend on the provided cell or range (its out-neighbors in
   * HyperFormula's dependency graph). These are the cells whose formulas reference the given address.
   *
   * The `address` argument and the returned coordinates are in HyperFormula's index space, the same space
   * as `hot.getPlugin('formulas').engine`. HyperFormula indexes match Handsontable visual indexes only
   * when no rows or columns are trimmed, hidden, moved, or sorted. Named-expression references are returned
   * with a `sheet` id of `-1`. The result may include ranges that contain the given address, not only
   * single cells.
   *
   * @param {object} address The cell address `{ sheet, row, col }` or range `{ start, end }`, in HyperFormula's index space.
   * @returns {Array} An array of cell addresses and/or ranges in HyperFormula's index space.
   * @throws {Error} When `address` is neither an address nor a range, names a sheet id that does not exist, or is a range whose `start` and `end` are on different sheets.
   */
  getCellDependents(address: FormulasCellAddress | FormulasCellRange): (FormulasCellAddress | FormulasCellRange)[] {
    return this.engine!.getCellDependents(address);
  }

  /**
   * Returns the cells and cell ranges that the provided cell or range depends on (its in-neighbors in
   * HyperFormula's dependency graph). These are the cells and ranges the given cell's formula reads.
   *
   * The `address` argument and the returned coordinates are in HyperFormula's index space, the same space
   * as `hot.getPlugin('formulas').engine`. HyperFormula indexes match Handsontable visual indexes only
   * when no rows or columns are trimmed, hidden, moved, or sorted. Named-expression references are returned
   * with a `sheet` id of `-1`. The result may include ranges contained in the given cell or range, not
   * only single cells.
   *
   * @param {object} address The cell address `{ sheet, row, col }` or range `{ start, end }`, in HyperFormula's index space.
   * @returns {Array} An array of cell addresses and/or ranges in HyperFormula's index space.
   * @throws {Error} When `address` is neither an address nor a range, names a sheet id that does not exist, or is a range whose `start` and `end` are on different sheets.
   */
  getCellPrecedents(address: FormulasCellAddress | FormulasCellRange): (FormulasCellAddress | FormulasCellRange)[] {
    return this.engine!.getCellPrecedents(address);
  }

  /**
   * Registers the `Ctrl`+`` ` `` shortcut that toggles {@link Formulas#showFormulas} /
   * {@link Formulas#hideFormulas}. The plugin's own `registerShortcuts()` is a deprecated no-op kept
   * for backward compatibility, so this uses its own group name instead of that method.
   *
   * The key name is `'backquote'`, not the literal `` ` `` character: `normalizeEventKey()`
   * (`shortcuts/utils.ts`) maps a real backquote keypress (`keyCode`/`which` 192) through its
   * `specialCharactersSet` to the string `'backquote'`, never to the character itself.
   *
   * `Control`, not `Control/Meta`: on macOS, `Cmd`+`` ` `` is the system "move focus to the next
   * window" shortcut, so Chrome consumes it before the page ever sees the keydown - the same reason
   * `MergeCells` binds `['Control', 'm']` instead of `Control/Meta`. Excel for Mac and Google Sheets
   * both use `Ctrl`+`` ` `` on macOS too, so this matches the real product convention, not just the
   * OS-conflict workaround.
   */
  #registerToggleFormulasShortcut() {
    this.hot.getShortcutManager()
      .getContext('grid')
      ?.addShortcut({
        keys: [['Control', 'backquote']],
        callback: () => {
          if (this.isShowingFormulas()) {
            this.hideFormulas();
          } else {
            this.showFormulas();
          }
        },
        group: SHORTCUTS_GROUP,
      });
  }

  /**
   * Removes the shortcut registered by `#registerToggleFormulasShortcut`.
   */
  #unregisterToggleFormulasShortcut() {
    this.hot.getShortcutManager()
      .getContext('grid')
      ?.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Reads the `hyperlinks` plugin setting into the cached flag, target, and scheme list.
   */
  #refreshHyperlinksSetting() {
    const pluginSettings = this.hot.getSettings()[PLUGIN_KEY];
    const wasEnabled = this.#hyperlinksEnabled;
    const hyperlinks = isFormulasSettingsObject(pluginSettings) ? pluginSettings.hyperlinks : undefined;
    // A plain object (including `{}`) enables hyperlinks with defaults; an array or a built-in such as
    // `Date` is not the object form and does not enable it.
    const isObjectForm = isPlainObject(hyperlinks);

    if (isObjectForm) {
      this.#warnOnInvalidHyperlinksSettings(hyperlinks);
    }

    this.#hyperlinksEnabled = hyperlinks === true || isObjectForm;
    this.#hyperlinkTarget = isObjectForm && hyperlinks.target === '_self' ? '_self' : '_blank';
    this.#hyperlinkSchemes = normalizeSchemesWithFallback(
      isObjectForm ? hyperlinks.schemes : undefined, LINK_SCHEMES
    );

    // Turning the option off removes nothing by itself: the hook stays registered, but a renderer that
    // leaves its previous DOM in place would keep an anchor that no later render pass rewrites.
    if (wasEnabled && !this.#hyperlinksEnabled) {
      this.#unwrapRenderedHyperlinks();

      // As in `disablePlugin()`: the anchors are gone from the DOM eagerly, but the freed URL text is
      // only linkable by `AutoLink` on that cell's NEXT paint, and under `renderMode: 'onChange'` that
      // paint is skipped unless the epoch advances here.
      this.hot.markAllCellsChanged();
    }
  }

  /**
   * Warns once when the object form of the `hyperlinks` setting carries an unrecognized `target` or
   * `schemes` entry. The setting still applies a fallback either way - an invalid `target` falls back
   * to `'_blank'`, and `schemes` is resolved through `normalizeSchemesWithFallback` (dropped entries
   * are ignored when at least one entry is recognized; the full allowlist is used instead when none
   * are, or when `schemes` is not an array at all) - so this only makes the silent fallback visible.
   * An EXPLICIT empty `schemes` array is not a problem: it is the author's own request for no
   * hyperlinks, and it does not warn.
   *
   * @param {FormulasHyperlinkSettings} hyperlinks The object form of the `hyperlinks` setting.
   */
  #warnOnInvalidHyperlinksSettings(hyperlinks: FormulasHyperlinkSettings) {
    const problems: string[] = [];

    if (hyperlinks.target !== undefined && hyperlinks.target !== '_blank' && hyperlinks.target !== '_self') {
      problems.push(`"target": ${JSON.stringify(hyperlinks.target)}`);
    }

    // Whether the invalid, non-empty `schemes` still narrows to at least one recognized entry - if it
    // does, the fallback is "unknown entries are ignored" rather than "the default is used instead".
    let schemesNarrowed = false;

    if (hyperlinks.schemes !== undefined) {
      const isSchemesArray = Array.isArray(hyperlinks.schemes);
      const recognizedCount = isSchemesArray
        ? hyperlinks.schemes.filter(scheme => (LINK_SCHEMES as readonly string[]).includes(scheme)).length
        : 0;
      const isInvalid = !isSchemesArray ||
        (hyperlinks.schemes.length > 0 && recognizedCount !== hyperlinks.schemes.length);

      if (isInvalid) {
        problems.push(`"schemes": ${JSON.stringify(hyperlinks.schemes)}`);
        schemesNarrowed = isSchemesArray && recognizedCount > 0;
      }
    }

    if (problems.length === 0) {
      return;
    }

    const fallbackNote = schemesNarrowed
      ? 'Unknown "schemes" entries are ignored.'
      : 'The default is used instead.';

    warnOnce(this, HYPERLINK_SETTINGS_WARN_KEY,
      `The "formulas.hyperlinks" option received an invalid setting: ${problems.join(', ')}. ` +
      '"target" accepts "_blank" or "_self"; "schemes" accepts a subset of "http", "https", "mailto" ' +
      `and "tel". ${fallbackNote}`);
  }

  /**
   * Unwraps every `HYPERLINK` anchor currently in the grid, including the overlay clones.
   *
   * Disabling the plugin removes the `afterRenderer` hook, so a renderer that leaves its previous
   * DOM in place would keep its cells clickable with nothing left to clean them up. The anchors are
   * matched by the plugin's own class, so another feature's cell links are left alone.
   */
  #unwrapRenderedHyperlinks() {
    if (this.hot.rootElement) {
      unwrapLinks(this.hot.rootElement, `a.${HYPERLINK_CLASS_NAME}`);
    }
  }

  /**
   * Returns the URL that a cell should link to, or `null` when the cell must not become a link.
   *
   * The engine reports a hyperlink only for a cell whose root expression is `HYPERLINK()`, so a
   * nested call such as `=CONCATENATE("see ", HYPERLINK(...))` resolves to `null` here.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {string|null} The resolved absolute URL, or `null`.
   */
  #getHyperlinkHref(row: number, column: number): string | null {
    if (
      this.sheetName === null ||
      !this.engine?.doesSheetExist(this.sheetName) ||
      !this.rowAxisSyncer ||
      !this.columnAxisSyncer ||
      !this.isFormulaCellType(row, column)
    ) {
      return null;
    }

    this.#flushEvaluation();

    const url = this.engine.getCellHyperlink({
      sheet: this.sheetId,
      row: this.rowAxisSyncer.getHfIndexFromVisualIndex(row),
      col: this.columnAxisSyncer.getHfIndexFromVisualIndex(column),
    });

    if (url === undefined) {
      return null;
    }

    const href = resolveLinkUrl(url, this.hot.rootDocument.baseURI, this.#hyperlinkSchemes);

    // A narrowed `#hyperlinkSchemes` refuses URLs the caller deliberately excluded, which is not a
    // refusal worth warning about. Only warn when the URL is refused against the FULL allowlist too -
    // that is the "Handsontable can never link to this" case the message describes. This extra call
    // only runs on the refusal path, so the common (linked) path still costs a single call.
    if (href === null && resolveLinkUrl(url, this.hot.rootDocument.baseURI) === null) {
      warnOnce(this, HYPERLINK_WARN_KEY,
        `A "HYPERLINK" formula points at a URL that Handsontable refuses to link to ("${url}"). ` +
        'Only the "http", "https", "mailto" and "tel" schemes can be linked.');
    }

    return href;
  }

  /**
   * Runs `fn` as a plugin write to `engine`: every grid on the engine whose sheet the engine's events
   * name is painted once, when the outermost write ends.
   *
   * The engine is an argument because a caller can write it before this instance is bound to it.
   *
   * @private
   * @param {object} engine The engine `fn` writes.
   * @param {Function} fn The mutation.
   * @returns {*} What `fn` returns.
   */
  runEngineWrite<T>(engine: object, fn: () => T): T {
    return withPluginEngineWrite(engine, () => this.#trackOwnEngineWrite(fn));
  }

  /**
   * Recalculates the writes a grid holds on `engine` (the `batchEvaluation` setting), so the engine can be
   * read. Another plugin that reads the engine directly calls it first: HyperFormula refuses value reads
   * while its evaluation is suspended. Does nothing when nothing is held.
   *
   * The engine is an argument because a caller can read an engine this instance is not bound to.
   *
   * @private
   * @param {object|null} [engine] The engine to read, this instance's engine by default.
   */
  flushEngineEvaluation(engine: HyperFormulaEngine | null = this.engine): void {
    flushEvaluationHold(engine);
  }

  /**
   * Tells whether this instance's engine holds writes that are not recalculated yet (the `batchEvaluation`
   * setting), so a read of a formula cell would recalculate them. Another plugin that wants to avoid that read
   * until the writes end asks first.
   *
   * @private
   * @returns {boolean}
   */
  isEngineHeld(): boolean {
    return isEvaluationHeld(this.engine);
  }

  /**
   * Returns the names of the sheets of `engine` that Handsontable instances other than this one are bound to.
   *
   * The engine is an argument because a caller can ask before this instance is bound to it.
   *
   * @private
   * @param {object} engine The engine.
   * @returns {string[]}
   */
  getSheetNamesBoundElsewhere(engine: HyperFormulaEngine): string[] {
    const names: string[] = [];

    getRegisteredHotInstanceList(engine).forEach((hot) => {
      const { sheetId } = hot.getPlugin('formulas');
      const name = hot !== this.hot && typeof sheetId === 'number' ? engine.getSheetName(sheetId) : undefined;

      if (typeof name === 'string') {
        names.push(name);
      }
    });

    return names;
  }

  /**
   * Runs `fn` as a write to this grid's own sheet. Like `runEngineWrite()`, but this grid is left out
   * of the paint: the Core paints it after the operation that made the write.
   *
   * @param {object|null|undefined} engine The engine `fn` writes.
   * @param {Function} fn The mutation.
   * @param {string} [kind] How the write keeps the sheet snapshot in step (`#trackOwnEngineWrite()`).
   * @returns {*} What `fn` returns.
   */
  #writeOwnSheet<T>(engine: object | null | undefined, fn: () => T, kind: OwnEngineWriteKind = 'structural'): T {
    this.#ownWriteDepth += 1;

    try {
      return withPluginEngineWrite(engine, () => this.#trackOwnEngineWrite(fn, kind));
    } finally {
      this.#ownWriteDepth -= 1;
    }
  }

  /**
   * Validates dependent cells based on the cells that are modified by the change. Called inside the
   * operation of the change, so `validateCell()` holds that undo step until the validators answer, and
   * what a dependent's validator or `afterValidate` listener writes joins it. The deferred apply calls
   * `#validateDependentCellsUnrecorded()` instead.
   *
   * @private
   * @param {object[]} dependentCells The values and location of applied changes within HF engine.
   * @param {object[]} [changedCells] The values and location of applied changes by developer (through API or UI).
   */
  validateDependentCells(dependentCells: unknown[], changedCells: unknown[] = []) {
    const stringifyAddress = (change: unknown) => {
      const address = isHFCellChange(change) ? change.address : undefined;

      return address && isDefined(address.sheet) ? toCellKey(address) : '';
    };
    const changedCellsSet = new Set(changedCells.map((change: unknown) => stringifyAddress(change)));

    dependentCells.forEach((change: unknown) => {
      const address = isHFCellChange(change) ? change.address : undefined;
      const { row, col, sheet: sheetId } = address ?? {};

      if (row === undefined || col === undefined) {
        return;
      }

      const addressId = stringifyAddress(change);

      // Validate the cells that depend on the calculated formulas. Skip that cells
      // where the user directly changes the values - the Core triggers those validators.
      if (sheetId !== undefined && !changedCellsSet.has(addressId) && this.engine) {
        const boundHot = getRegisteredHotInstances(this.engine).get(sheetId);

        // if `sheetId` is not bound to any Handsontable instance, skip the validation process
        if (!boundHot) {
          return;
        }

        // The engine holds the trimmed rows and columns too, so its address is a visual one only through the
        // syncers of the grid bound to that sheet (not this plugin's own, which describe another sheet).
        const boundPlugin = boundHot.getPlugin('formulas');

        if (!boundPlugin?.enabled || boundPlugin.engine !== this.engine) {
          return;
        }

        const visualRow = boundPlugin.rowAxisSyncer?.getVisualIndexFromHfIndex(row) ?? -1;
        const visualColumn = boundPlugin.columnAxisSyncer?.getVisualIndexFromHfIndex(col) ?? -1;

        // Don't try to validate cells outside of the visual part of the table (a trimmed one included). The
        // syncer answers `undefined` for a physical index the table does not cover, so the check is negated.
        if (!(visualRow >= 0 && visualRow < boundHot.countRows()) ||
          !(visualColumn >= 0 && visualColumn < boundHot.countCols())) {
          return;
        }

        const validate = () => boundHot.validateCell(
          boundHot.getDataAtCell(visualRow, visualColumn),
          boundHot.getCellMeta(visualRow, visualColumn),
          () => {}
        );

        // It will just re-render certain cell when necessary.
        if (this.#dependentValidationUnrecorded) {
          boundHot._getOperationScope().suppress(validate);
        } else {
          validate();
        }
      }
    });
  }

  /**
   * Validates the dependents of a deferred change's apply (see `#onBeforeChangeRender`) outside every undo
   * step. Inside the edit's step, `validateCell()` held it until a dependent's async validator answered, so
   * the edit could not be undone right after `afterChange`. The cost: what a dependent's validator or
   * `afterValidate` listener writes there is recorded in no step, so an undo of the edit leaves it.
   *
   * @param {object[]} dependentCells The cells the write recalculated.
   * @param {object[]} changedCells The cells the write changed.
   */
  #validateDependentCellsUnrecorded(dependentCells: unknown[], changedCells: unknown[]) {
    this.#dependentValidationUnrecorded = true;

    try {
      this.validateDependentCells(dependentCells, changedCells);
    } finally {
      this.#dependentValidationUnrecorded = false;
    }
  }

  /**
   * Registers a listener called right before the engine is detached from this grid: when the plugin is
   * disabled (a settings update that turns it off or replaces the engine) and when the grid is
   * destroyed. The engine is still usable inside the listener. When this grid was the last user of an
   * engine the plugin built itself, the engine is destroyed right after, so anything subscribed to its
   * events must unsubscribe here. The FormulaBuilder plugin tears its builder down this way.
   *
   * @private
   * @param {Function} listener The listener.
   * @returns {Function} Removes the listener.
   */
  addEngineDetachListener(listener: () => void): () => void {
    this.#engineDetachListeners.add(listener);

    return () => {
      this.#engineDetachListeners.delete(listener);
    };
  }

  /**
   * Tells the engine-detach listeners that the engine is about to be detached, while it is still usable.
   */
  #notifyEngineDetach(): void {
    if (!this.engine) {
      return;
    }

    [...this.#engineDetachListeners].forEach(listener => listener());
  }

  /**
   * Returns the state UndoRedo records for this plugin. When it did not change since the previous
   * capture, the previous state itself is returned.
   *
   * @private
   * @param {*} previous The value the previous capture returned.
   * @returns {object|undefined}
   */
  captureState(previous: unknown): unknown {
    if (!this.engine) {
      return undefined;
    }

    const sheetSize = this.#hasOwnSheet() ? this.engine.getSheetDimensions(this.sheetId!) : null;

    if (
      isFormulasUndoState(previous) &&
      previous.structureVersion === this.#structureVersion &&
      previous.dataVersion === this.#dataVersion &&
      this.#pendingPeerRewrites.size === 0
    ) {
      if (sheetSize !== null) {
        this.#sheetSizeFloors.set(previous, sheetSize);
      }

      return previous;
    }

    const peerRewrites = Array.from(this.#pendingPeerRewrites.values())
      .filter(rewrite => rewrite.after !== rewrite.before);

    this.#pendingPeerRewrites.clear();

    const engineSheet = this.#captureEngineSheet(isFormulasUndoState(previous) ? previous.engineSheet : null);
    const state: FormulasUndoState = {
      structureVersion: this.#structureVersion,
      dataVersion: this.#dataVersion,
      engineSheet,
      sourceHasStaleFormulas: engineSheet !== null && this.#sourceHasStaleFormulas,
      peerRewrites,
    };

    if (sheetSize !== null) {
      this.#sheetSizeFloors.set(state, sheetSize);
    }

    return state;
  }

  /**
   * Brings the engine in line with the grid an undo or a redo restored. The source data is already
   * restored by then. When the rows or columns differ from the ones the engine holds, the sheet is
   * reloaded from the source data; otherwise the cells the restore wrote are written into the engine.
   *
   * The formulas the step's engine calls rewrote in other sheets and named expressions are then put
   * back (`#restorePeerRewrites()`): reloading this grid's own sheet never adjusts them.
   *
   * @private
   * @param {*} state The recorded state.
   * @param {object} [context] The step being restored.
   */
  restoreState(state: unknown, context?: PluginRestoreContext): void {
    if (!isFormulasUndoState(state)) {
      return;
    }

    // The host removed this grid's sheet from the engine, so there is no sheet to bring in line. The
    // versions still follow the restored state, so a later capture compares against it.
    if (!this.#hasOwnSheet()) {
      this.#syncedContent = null;
      this.#restoredWrites = [];
      this.#structureVersion = state.structureVersion;
      this.#dataVersion = state.dataVersion;

      return;
    }

    // A step that cleared the stale flag wrote the engine's formula text into the source data. Its undo
    // puts the stale text back with the held writes, and only the recorded sheet holds the right one.
    // The step's own two sides decide it, not the grid's current versions: a `columns` update rewrites
    // the whole sheet outside any step, and a recorded sheet would bring back the previous column layout.
    const otherSide = context?.other;
    const { structureVersion, sourceHasStaleFormulas } = isFormulasUndoState(otherSide) ? otherSide : {
      structureVersion: this.#structureVersion,
      sourceHasStaleFormulas: this.#sourceHasStaleFormulas,
    };
    const reloadsSheet = state.structureVersion !== structureVersion ||
      (state.sourceHasStaleFormulas && !sourceHasStaleFormulas);

    this.#sourceHasStaleFormulas = state.sourceHasStaleFormulas;

    if (reloadsSheet) {
      // The sheet is loaded from the recorded state, not written cell by cell, so the record cannot follow it.
      this.#syncedContent = null;
      this.#restoredWrites = [];
      this.#structureVersion = state.structureVersion;
      this.#dataVersion = state.dataVersion;
      this.#restoreStructure(state, context);

      return;
    }

    // Only cells are written back, and each one goes into the record (`#writeSourceChangesToEngine()`), so a
    // re-render after an edit and its undo still finds the data the engine holds and skips the write.
    this.#dataVersion = state.dataVersion;
    this.#flushRestoredWrites();
    this.#syncPeerSources(this.#restorePeerRewrites(state, context, true));
  }

  /**
   * Reloads the sheet for a restored state whose rows or columns differ from the engine's, puts back the
   * peers' formulas, and gives back the rows and columns the step added (`AxisSyncer#trimUnusedTail()`).
   * It is one engine batch: a volatile formula recalculates on every engine call, and each call would
   * emit `valuesUpdated` and repaint the other grids on the engine once more.
   *
   * @param {object} state The recorded state.
   * @param {object} [context] The step being restored.
   */
  #restoreStructure(state: FormulasUndoState, context?: PluginRestoreContext) {
    const engine = this.engine!;
    const floor = this.#sheetSizeFloors.get(state);

    // Reading the source data reads engine values, which a suspended engine refuses, so the writes held
    // before the restore are recalculated first.
    this.#flushEvaluation();

    const sourceDataArray = state.engineSheet === null ? this.#getProcessedSourceDataArray() : undefined;
    let dependentCells: unknown[];
    let peerRewrites: readonly PeerRewrite[] = [];

    // Passive for the hooks that read the engine: a suspended engine refuses those reads.
    this.#internalOperationPending = true;

    try {
      const reload = () => {
        if (sourceDataArray !== undefined) {
          this.#loadSourceDataIntoSheet(sourceDataArray);
        } else {
          this.#loadEngineSheet(state.engineSheet!);
        }

        peerRewrites = this.#restorePeerRewrites(state, context);

        if (floor !== undefined) {
          this.rowAxisSyncer!.trimUnusedTail(floor.height);
          this.columnAxisSyncer!.trimUnusedTail(floor.width);
        }
      };
      const restored = this.#writeOwnSheet(engine, () => (
        this.#runRestoreWrite(engine, () => runEngineBatch(engine, reload))
      ));

      dependentCells = restored.dependents;
      restored.changed.forEach((cell) => {
        this.#restoredChangedCells.push(cell);
      });
    } finally {
      this.#internalOperationPending = false;
    }

    this.#syncPeerSources(peerRewrites);

    dependentCells.forEach((cell) => {
      this.#restoredDependentCells.push(cell);
    });
  }

  /**
   * A step whose two sides share the structure version and the stale flag restores the cells it wrote
   * by prop and never reads a recorded sheet, so it names no column, whatever order the grid is in.
   * A step that reloads the sheet, or restores a serialized one, restores a column layout, so it cannot
   * be kept across a `columns` settings update.
   *
   * @private
   * @param {*} state The state on one side of a step.
   * @param {*} other The state on the other side.
   * @returns {number[]|null}
   */
  getStateColumns(state: unknown, other: unknown): readonly number[] | null {
    if (
      isFormulasUndoState(state) && isFormulasUndoState(other) &&
      state.structureVersion === other.structureVersion &&
      state.sourceHasStaleFormulas === other.sourceHasStaleFormulas
    ) {
      return [];
    }

    return null;
  }

  /**
   * Runs an engine call that can rewrite formulas outside this grid's sheet – adding, removing or
   * moving rows, columns or cells – and records what it rewrote for the recording undo step. The
   * references this grid's own sheet holds are restored with the sheet; the ones other sheets and
   * named expressions hold are not, and a removal can leave them `#REF!` for good. Costs nothing
   * unless the engine holds another sheet or a named expression, and a step is recording.
   *
   * @param {Function} engineCall The engine call.
   * @returns {*} What the engine call returns.
   */
  #trackPeerRewrites<T>(engineCall: () => T): T {
    const candidates = this.#collectPeerFormulas();
    const result = engineCall();

    if (candidates.length > 0) {
      this.#recordPeerRewrites(candidates);
    }

    return result;
  }

  /**
   * Lists the formulas an engine call on this grid's sheet can rewrite: every cell of another sheet
   * whose formula names this sheet, and every named expression. Empty unless a step records.
   *
   * @returns {PeerRewrite[]} The candidates, with `before` set to their current text.
   */
  #collectPeerFormulas(): PeerRewrite[] {
    const engine = this.engine;
    const candidates: PeerRewrite[] = [];

    if (!engine || this.sheetId === null || this.hot._getOperationScope().getRecordingTransaction() === null) {
      return candidates;
    }

    const ownName = engine.getSheetName(this.sheetId);

    if (ownName === undefined) {
      return candidates;
    }

    // The engine matches sheet names without regard to case, and it writes a quote inside a quoted
    // sheet name twice (`'O''Brien'!A1`).
    const ownNameInFormula = ownName.toLowerCase();
    const quotedNameInFormula = ownNameInFormula.replace(/'/g, '\'\'');
    const namesThisSheet = (formula: string) => {
      const text = formula.toLowerCase();

      return text.includes(ownNameInFormula) || text.includes(quotedNameInFormula);
    };
    const sheetIds: number[] = engine.getSheetNames().map((name: string) => engine.getSheetId(name));
    // While evaluation is suspended the engine holds its change events back, so the list of sheets
    // with no such formula cannot be trusted.
    const useKnownSheets = !engine.isEvaluationSuspended();

    sheetIds.forEach((sheet) => {
      if (sheet === this.sheetId || (useKnownSheets && this.#sheetsNotNamingOwnSheet.has(sheet))) {
        return;
      }

      const count = candidates.length;

      engine.getSheetFormulas(sheet).forEach((formulasRow, row) => {
        formulasRow.forEach((engineFormula, col) => {
          const formula = this.#readableFormula(engineFormula);

          if (formula !== undefined && namesThisSheet(formula)) {
            candidates.push({ kind: 'cell', sheet, row, col, before: formula, after: formula });
          }
        });
      });

      if (useKnownSheets && candidates.length === count) {
        this.#sheetsNotNamingOwnSheet.add(sheet);
      }
    });

    // A named expression can reach this sheet with or without naming it, so each one is a candidate.
    [undefined, ...sheetIds].forEach((scope) => {
      engine.listNamedExpressions(scope).forEach((name: string) => {
        const formula: string | undefined = this.#readableFormula(engine.getNamedExpressionFormula(name, scope));

        if (formula !== undefined) {
          candidates.push({ kind: 'name', name, scope, before: formula, after: formula });
        }
      });
    });

    return candidates;
  }

  /**
   * Records the candidates the engine call rewrote, merged per cell or name within the step (the first
   * text before, the last text after), and brings the other grids' source data in line with them.
   *
   * @param {PeerRewrite[]} candidates The candidates `#collectPeerFormulas()` listed before the call.
   */
  #recordPeerRewrites(candidates: PeerRewrite[]) {
    const engine = this.engine!;
    const rewritten: PeerRewrite[] = [];

    candidates.forEach((candidate) => {
      const after: string | undefined = this.#readableFormula(candidate.kind === 'cell' ?
        engine.getCellFormula({ sheet: candidate.sheet, row: candidate.row, col: candidate.col }) :
        engine.getNamedExpressionFormula(candidate.name, candidate.scope));

      if (after === candidate.before) {
        return;
      }

      const key = candidate.kind === 'cell' ?
        `cell:${candidate.sheet}:${candidate.row}:${candidate.col}` : `name:${candidate.scope}:${candidate.name}`;
      const recorded = this.#pendingPeerRewrites.get(key);

      if (recorded === undefined) {
        this.#pendingPeerRewrites.set(key, { ...candidate, after });
      } else {
        recorded.after = after;
      }

      rewritten.push(candidate);
    });

    this.#syncPeerSources(rewritten);
  }

  /**
   * Puts back the formulas the restored step rewrote outside this grid's sheet: their text before the
   * step for an undo, after it for a redo. A formula edited since the step is left alone.
   *
   * @param {object} state The state being restored.
   * @param {object} [context] The step being restored.
   * @param {boolean} [flushesHeldWrites=false] `true` outside the batch of a structural restore: a held write
   *   is recalculated right away, so the restore validates its dependents (see `#runRestoreWrite()`).
   * @returns {PeerRewrite[]} The rewrites the other grids' source data still has to follow
   *   (`#syncPeerSources()`), which reads values and so cannot run while the engine is suspended.
   */
  #restorePeerRewrites(
    state: FormulasUndoState, context?: PluginRestoreContext, flushesHeldWrites = false,
  ): readonly PeerRewrite[] {
    // The step's rewrites are recorded in the state it ended in.
    const stepEnd = context?.direction === 'undo' ? context.other : state;

    if (context?.direction === undefined || !isFormulasUndoState(stepEnd) || stepEnd.peerRewrites.length === 0) {
      return [];
    }

    const engine = this.engine!;
    const isUndo = context.direction === 'undo';
    let keptEdited = false;
    const rewritePeers = () => {
      stepEnd.peerRewrites.forEach((rewrite) => {
        const expected = isUndo ? rewrite.after : rewrite.before;
        const text = isUndo ? rewrite.before : rewrite.after;

        if (rewrite.kind === 'cell') {
          const address = { sheet: rewrite.sheet, row: rewrite.row, col: rewrite.col };

          if (engine.getSheetName(rewrite.sheet) === undefined) {
            return;
          }

          if (this.#readableFormula(engine.getCellFormula(address)) !== expected) {
            keptEdited = true;
          } else if (engine.isItPossibleToSetCellContents(address)) {
            engine.setCellContents(address, text ?? null);
          }

          return;
        }

        // A name scoped to a sheet went with the sheet, and the engine throws when asked about it.
        if (rewrite.scope !== undefined && engine.getSheetName(rewrite.scope) === undefined) {
          return;
        }

        if (this.#readableFormula(engine.getNamedExpressionFormula(rewrite.name, rewrite.scope)) !== expected) {
          keptEdited = true;
        } else if (text !== undefined &&
            engine.isItPossibleToChangeNamedExpression(rewrite.name, text, rewrite.scope)) {
          engine.changeNamedExpression(rewrite.name, text, rewrite.scope,
            engine.getNamedExpression(rewrite.name, rewrite.scope)?.options);
        }
      });
    };
    // A restore of a structural step runs this inside its own batch, which a nested `batch()` would end.
    const changes = this.#writeOwnSheet(engine, () => {
      const write = () => runEngineBatch(engine, rewritePeers, { joinsAnySuspension: true });

      if (!flushesHeldWrites) {
        return write();
      }

      const restored = this.#runRestoreWrite(engine, write);

      restored.changed.forEach((cell) => {
        this.#restoredChangedCells.push(cell);
      });

      return restored.dependents;
    });

    if (keptEdited) {
      warnOnce(this.hot, 'formulas.undoKeptEditedPeerFormula', toSingleLine`Formulas: an undo or a redo left\x20
        a formula in another sheet or a named expression as it was, because it was edited after the step.`);
    }

    changes.forEach((cell) => {
      this.#restoredDependentCells.push(cell);
    });

    return stepEnd.peerRewrites;
  }

  /**
   * Writes the rewritten formulas back into the source data of the other grids whose sheets hold them,
   * the way each grid does it after its own row and column changes – but only at the rewritten cells,
   * so a `#REF!` the step did not cause is not written into that grid's data. Suppressed there, so the
   * other grid records no undo step for it.
   *
   * @param {PeerRewrite[]} rewrites The rewrites.
   */
  #syncPeerSources(rewrites: readonly PeerRewrite[]) {
    const cellsBySheet = new Map<number, Array<{ row: number, col: number }>>();

    rewrites.forEach((rewrite) => {
      if (rewrite.kind === 'cell') {
        const cells = cellsBySheet.get(rewrite.sheet) ?? [];

        cells.push({ row: rewrite.row, col: rewrite.col });
        cellsBySheet.set(rewrite.sheet, cells);
      }
    });

    if (cellsBySheet.size === 0) {
      return;
    }

    const peers = getRegisteredHotInstances(this.engine!);

    cellsBySheet.forEach((cells, sheet) => {
      const peerHot = peers.get(sheet);
      const peer = peerHot?.getPlugin('formulas');

      // A grid of another Handsontable bundle is another class, whose private members this one
      // cannot reach.
      if (peerHot === undefined || peerHot === this.hot || !(peer instanceof Formulas) || !peer.enabled) {
        return;
      }

      // The peer grid writes its source data and renders, which reads the engine.
      this.#flushEvaluation();
      peerHot._getOperationScope().suppress(() => peer.#syncFormulasToSourceData(true, cells));
    });
  }

  /**
   * Returns the engine's sheet while its order is not the physical one or the source data holds stale
   * formulas (`#sourceHasStaleFormulas`), and `null` otherwise – the source data rebuilds a sheet in
   * physical order. A row that reads the same as in the previous
   * capture is that capture's row array, so consecutive steps share what they did not change: each
   * step keeps the rows it changed, not a copy of the whole sheet.
   *
   * @param {object|null} previous The sheet the previous capture returned.
   * @returns {object|null}
   */
  #captureEngineSheet(previous: EngineSheetSnapshot | null): EngineSheetSnapshot | null {
    if (
      !this.engine || this.sheetId === null ||
      (!this.#sourceHasStaleFormulas && this.rowAxisSyncer!.isHfOrderPhysical() &&
        this.columnAxisSyncer!.isHfOrderPhysical())
    ) {
      return null;
    }

    this.#flushEvaluation();

    const content: unknown[][] = this.#readableSheet(this.engine.getSheetSerialized(this.sheetId));

    if (previous !== null) {
      content.forEach((row, index) => {
        const previousRow = previous.content[index];

        if (
          previousRow !== undefined && previousRow.length === row.length &&
          row.every((value, column) => value === previousRow[column])
        ) {
          content[index] = previousRow;
        }
      });
    }

    return {
      content,
      rowOrder: this.rowAxisSyncer!.getEngineOrder(),
      columnOrder: this.columnAxisSyncer!.getEngineOrder(),
    };
  }

  /**
   * Loads a recorded engine sheet back, ending in the grid's current order, and returns the cells whose
   * values changed.
   *
   * @param {object} snapshot The recorded sheet.
   * @returns {Array}
   */
  #loadEngineSheet(snapshot: EngineSheetSnapshot): unknown[] {
    this.#syncedContent = null;
    this.#internalOperationPending = true;

    try {
      return this.#writeOwnSheet(this.engine!, () => {
        const dependentCells = this.engine!.setSheetContent(this.sheetId, snapshot.content);

        this.rowAxisSyncer!.adoptEngineOrder(snapshot.rowOrder);
        this.columnAxisSyncer!.adoptEngineOrder(snapshot.columnOrder);

        return dependentCells;
      });
    } finally {
      this.#internalOperationPending = false;
    }
  }

  /**
   * Draws a new structure version: the rows or columns the engine holds changed.
   */
  #markStructureChanged() {
    this.#versionSeed += 1;
    this.#structureVersion = this.#versionSeed;
  }

  /**
   * Draws a new data version: a cell write reached the engine.
   */
  #markDataChanged() {
    this.#versionSeed += 1;
    this.#dataVersion = this.#versionSeed;
  }

  /**
   * Writes the held cell writes of an undo or a redo into the engine.
   */
  #flushRestoredWrites = () => {
    const changes = this.#restoredWrites;

    this.#restoredWrites = [];

    if (changes.length > 0 && this.engine) {
      this.#writeSourceChangesToEngine(changes, true);
    }
  };

  /**
   * Draws a new structure version when the row or column order changes.
   */
  #onAfterSequenceChange = () => {
    this.#markStructureChanged();
  };

  /**
   * `afterColumnSequenceChange` hook callback. Object rows, and array rows a `columns` list projects, are
   * read in visual column order, so a column move moves their cells in the source data array and the record
   * of what the engine was fed (`#syncedContent`) no longer lines up with it.
   */
  #onAfterColumnSequenceChange = () => {
    if (this.#syncedContent !== null && this.#syncedContent.columnSpace !== 'physical') {
      this.#syncedContent = null;
    }
  };

  /**
   * Collects the engine addresses of the cells an undo or a redo wrote, from the `afterChange` it
   * fires once the restore is done.
   *
   * @param {Array[]} changes The changes, in the `afterChange` format.
   * @param {string} source The source of the change.
   */
  #onAfterRestoredChange = (changes: CellChange[] | null, source: string) => {
    if (!isRestoreSource(source) || changes === null) {
      return;
    }

    changes.forEach(([visualRow, prop]) => {
      const visualColumn = typeof prop === 'function' ? null : this.hot.propToCol(prop);

      if (typeof visualColumn !== 'number' || !Number.isInteger(visualColumn)) {
        return;
      }

      const hfRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow);
      const hfColumn = this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn);

      // `-1` marks an index that is out of range or trimmed. Such an address matches no real engine
      // address, so keeping it would only risk colliding with a genuine dependent cell.
      if (hfRow === -1 || hfColumn === -1) {
        return;
      }

      this.#restoredChangedCells.push({
        address: { row: hfRow, col: hfColumn, sheet: this.sheetId },
      });
    });
  };

  /**
   * Validates the cells a sheet reload recalculated during an undo or a redo, leaving out the ones the
   * restore wrote – the UndoRedo plugin validates those itself. A restore that wrote no cell (a sort, a
   * move) validates nothing, as the forward operation did not either.
   */
  #validateRestoredDependents = () => {
    const dependentCells = this.#restoredDependentCells;
    const changedCells = this.#restoredChangedCells;

    this.#restoredDependentCells = [];
    this.#restoredChangedCells = [];

    if (dependentCells.length > 0 && changedCells.length > 0) {
      this.validateDependentCells(dependentCells, changedCells);
    }
  };

  /**
   * Sync a change from the change-related hooks with the engine.
   *
   * @private
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {Handsontable.CellValue} newValue New value.
   * @returns {Array} Array of changes exported from the engine.
   */
  syncChangeWithEngine(row: number, column: number, newValue: unknown) {
    const address = {
      row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(row),
      col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(column),
      sheet: this.sheetId
    };

    if (!this.engine?.isItPossibleToSetCellContents(address)) {
      warn(`Not possible to set cell data at ${JSON.stringify(address)}`);

      return;
    }

    // Values the escaping can never change skip the meta read: both `isDate()` and
    // `isPreservedText()` require a string. That read runs the user-provided `cells` function,
    // which is the expensive part of a bulk write.
    if (typeof newValue === 'string') {
      newValue = this.#escapeEngineBoundValue(newValue, this.hot.getCellMetaTransient(row, column));
    }

    this.#noteOwnCellWrite(address);

    const changes = this.engine?.setCellContents(address, newValue);

    this.#recordSyncedCell(this.hot.toPhysicalRow(row), column, newValue);

    return changes;
  }

  /**
   * Get the value to be passed to the formula engine.
   * If the value is an object, utilize the valueGetter for that cell, otherwise return the value as is.
   *
   * Both coordinates are PHYSICAL, and the meta is read by them directly, with the visual pair
   * passed only as the hook context – the way `#escapeSourceDataArray` and `#onBeforeAutofill` read
   * it. Resolving the meta through the visual axis instead breaks on a trimmed row: Nested Rows
   * installs a trimming map when it collapses, so `toVisualRow()` answers `null` there.
   * `getCellMetaTransient()` does not reject that the way `getCellMeta()` rejects a negative index –
   * it silently resolves a DIFFERENT physical row, so the cell's `valueGetter` is read from a
   * neighbor and the value written to the engine is the neighbor's projection of it.
   *
   * @param {number} physicalRow The physical row index.
   * @param {number} physicalColumn The physical column index.
   * @param {*} value The value to be passed to the formula engine.
   * @returns {*} The value to be displayed in the cell.
   */
  #getValueGetterValue(physicalRow: number, physicalColumn: number, value: unknown) {
    if (isObject(value) && value !== null) {
      const visualRow = this.hot.toVisualRow(physicalRow) ?? physicalRow;
      const visualColumn = this.hot.toVisualColumn(physicalColumn) ?? physicalColumn;
      const cellMeta = this.hot._getMetaManager().getCellMetaTransient(
        physicalRow, physicalColumn,
        { visualRow, visualColumn },
      );

      value = getValueGetterValue(value, cellMeta);

      if (value !== null && value !== undefined) {
        value = Object(value).toString();
      }
    }

    return normalizeValueForFormulaEngine(value);
  }

  /**
   * Tells whether the source data is a plain array-of-arrays dataset. The shape is read from the
   * first source row, because `getSourceData()` shallow-clones the whole dataset on every call.
   *
   * This is the only implementation of that check. Together with `#areSourceColumnsSkipped()` it
   * answers both column-space questions the plugin asks – whether `#getProcessedSourceDataArray`
   * has to project a row down to the visible columns, and, through
   * `#doesEngineHoldPhysicalColumns()`, which column space the resulting array is in. Never inline
   * either check, or hardening one copy would make those two answers disagree.
   *
   * @returns {boolean}
   */
  #isSourceDataArrayOfArrays(): boolean {
    return Array.isArray(this.hot.getSourceDataAtRow(0));
  }

  /**
   * Tells whether the settings, rather than the width of the loaded rows, decide how many columns the
   * grid has. That is the case for a finite `maxCols` below `width`, for an array `columns`, for a
   * `dataSchema`, and for a `columns` function that returns a falsy value for any of the first `width`
   * columns. The core counts the columns of an
   * array-of-arrays dataset under a function by keeping those it returns a truthy value for, so a
   * function that accepts every one of them leaves the count to the data.
   *
   * @param {number} width The number of columns the loaded rows would have.
   * @returns {boolean}
   */
  #isColumnCountCappedBySettings(width: number): boolean {
    const { columns, dataSchema, maxCols } = this.hot.getSettings();

    if (typeof maxCols === 'number' && maxCols < width) {
      return true;
    }

    if (typeof columns === 'function') {
      for (let columnIndex = 0; columnIndex < width; columnIndex++) {
        if (!columns(columnIndex)) {
          return true;
        }
      }

      return false;
    }

    return Array.isArray(columns) || isDefined(dataSchema);
  }

  /**
   * Tells whether the visible columns are a strict subset of the source columns – a `columns` list
   * that skips physical indexes rather than merely reordering them.
   *
   * @returns {boolean}
   */
  #areSourceColumnsSkipped(): boolean {
    return this.hot.countCols() < this.hot.countSourceCols();
  }

  /**
   * Get the source data array to be passed to the formula engine.
   * If the value is an object, utilize the valueGetter for that cell, otherwise return the value as is.
   *
   * @param {number} [row] The starting physical row index.
   * @param {number} [column] The starting physical column index (or visual, for array-of-objects data).
   * @param {number} [row2] The ending physical row index.
   * @param {number} [column2] The ending physical column index (or visual, for array-of-objects data).
   * @returns {Array} The source data array to be passed to the formula engine.
   */
  #getProcessedSourceDataArray(row?: number, column?: number, row2?: number, column2?: number) {
    // Every caller feeds the result to the engine, so this read has to report what Handsontable
    // actually stores – not what it reports. Left unguarded, `#onModifySourceData` answers every
    // formula cell with the formula the engine already holds, so a `loadData()`/`updateData()` call
    // that changes a formula's text reads the engine's PREVIOUS formula back and writes it straight
    // into the engine again, silently discarding the newly loaded one.
    //
    // The projection is suspended through a dedicated flag rather than `#internalOperationPending`,
    // which also gates `#onModifyData` and `#onAfterRenderer`. This read runs the `modifyRowData`
    // and `modifySourceData` hooks for every row and cell, so third-party handlers execute inside
    // the guarded window - and one that calls `getDataAtCell()` on a formula cell has to keep
    // receiving the calculated value, not the raw formula.
    //
    // No other site sets the flag, so the previous value is saved and restored rather than cleared
    // for one reason only: those same third-party handlers run inside the window, and one that
    // reaches this method again - synchronously, through `updateSettings()` or `loadData()` - would
    // otherwise leave the rest of the outer read unguarded, which is the very defect above.
    const wasProjectionSuspended = this.#sourceDataProjectionSuspended;

    this.#sourceDataProjectionSuspended = true;

    let dataArray;

    try {
      dataArray = this.hot.getSourceDataArray(row, column, row2, column2);
    } finally {
      this.#sourceDataProjectionSuspended = wasProjectionSuspended;
    }

    const visibleColumnCount = this.hot.countCols();
    // Asked through the named checks rather than inlined: `#doesEngineHoldPhysicalColumns()` asks
    // the same two questions below, and a second copy here is what lets the two answers drift.
    const isAoAWithSkippedColumns = this.#areSourceColumnsSkipped() && this.#isSourceDataArrayOfArrays();
    // `dataArray` is indexed from the requested start row, while `#getValueGetterValue` reads the
    // meta by a PHYSICAL row index. A partial read - the Nested Rows detach is the one caller that
    // makes one - would otherwise resolve every row's `valueGetter` from `rowOffset` rows too high
    // up the table.
    const rowOffset = row ?? 0;

    if (!isAoAWithSkippedColumns) {
      // The array's own column space, read from the one place that answers it. Array-of-objects
      // data is built in VISUAL order by `dataSource.getAtRow`, plain array-of-arrays data keeps
      // the physical order – and `#getValueGetterValue` reads its meta by physical coordinates.
      const columnsInVisualOrder = !this.#doesEngineHoldPhysicalColumns();
      const columnStart = column ?? 0;

      return dataArray.map((rowObject, rowIndex) => {
        const rowArray = Array.isArray(rowObject) ? rowObject : [];

        return rowArray.map((value: unknown, arrayColumnIndex: number) => {
          const columnIndex = columnStart + arrayColumnIndex;
          const physicalColumn = columnsInVisualOrder
            ? (this.hot.toPhysicalColumn(columnIndex) ?? columnIndex)
            : columnIndex;

          return this.#getValueGetterValue(rowOffset + rowIndex, physicalColumn, value);
        });
      });
    }

    // Array-of-objects data is already projected to visible columns by
    // `dataSource.getAtRow`. Array-of-arrays data returns the full source row,
    // so when `columns` skips physical indexes the data fed to HF misaligns
    // with the axis-syncer's visual->HF mapping (issue #10021). Build a row
    // containing only visible columns so HF cell coordinates stay in sync.
    const columnOffset = column ?? 0;

    return dataArray.map((row, rowIndex) => {
      // `getSourceDataArray` hands back a falsy row as-is for a hole or a `null` entry, and the
      // shape check above only reads row 0, so such a row can reach this branch. Treated as empty,
      // exactly as the pass-through branch above treats it.
      const rowArray = Array.isArray(row) ? row : [];
      const projected = [];

      for (let visualCol = 0; visualCol < visibleColumnCount; visualCol++) {
        const physicalCol = this.hot.colToProp(visualCol);

        if (typeof physicalCol !== 'number') {
          continue;
        }

        const arrayIndex = physicalCol - columnOffset;

        if (arrayIndex < 0 || arrayIndex >= rowArray.length) {
          continue;
        }

        projected.push(this.#getValueGetterValue(rowOffset + rowIndex, physicalCol, rowArray[arrayIndex]));
      }

      return projected;
    });
  }

  /**
   * Translates an index of the ENGINE's own sequence into the physical index it stands for.
   *
   * An engine index outside the dataset has no physical counterpart – the engine extends its own
   * sheet dimensions to calculate values – so it falls back to being read as a physical index.
   *
   * @param {AxisSyncer|null} syncer The axis syncer for the axis being translated.
   * @param {number} hfIndex Index in the engine's own sequence.
   * @returns {number} The physical index, or `hfIndex` itself when it has no physical counterpart.
   */
  #toPhysicalFromHf(syncer: AxisSyncer | null, hfIndex: number): number {
    const physicalIndex = syncer?.getPhysicalIndexFromHfIndex(hfIndex) ?? -1;

    return physicalIndex === -1 ? hfIndex : physicalIndex;
  }

  /**
   * Escapes a single engine-bound value according to the cell meta: dates in Handsontable
   * format are rewritten to the engine format, while invalid dates and preserved text values
   * are escaped with the "'" sign (the engine's string-escape mechanism).
   *
   * This is the one escape rule, shared by every path that writes into the engine –
   * `syncChangeWithEngine`, `#onAfterSetSourceDataAtCell` and `#escapeSourceDataArray`. Keeping it
   * in one place is what stops those three from disagreeing about a value, which is how the
   * `setSourceDataAtCell` path came to send an invalid date to the engine unescaped while the other
   * two escaped it.
   *
   * A formula gets the quotes the engine needs around a sheet name it cannot read unquoted
   * (`#readableFormula()`), the same rule as the text read back out of the engine, so a cell's text and
   * the formula the engine calculates are the same.
   *
   * The `date` branch RETURNS rather than falling through to the preserved text check, so a cell
   * declaring both `type: 'date'` and `preserveTextValue: true` is treated as a date. The
   * combination is contradictory - `isPreservedText()` requires `type: 'text'` - and the only way
   * the fall-through could ever fire was on a value the date branch had already rewritten.
   *
   * Callers gate this on `typeof value === 'string'`: both `isDate()` and `isPreservedText()`
   * require a string, so a non-string skips the cell meta read entirely, and that read is the
   * expensive part - it runs the user-provided `cells` function.
   *
   * @param {*} value Value to process.
   * @param {object} cellMeta The cell meta object of the value's cell.
   * @returns {*} The escaped value, or the original value when no escaping applies.
   */
  #escapeEngineBoundValue(value: unknown, cellMeta: { type?: string; preserveTextValue?: boolean }): unknown {
    if (isFormula(value)) {
      return this.#readableFormula(value);
    }

    if (isDate(value, cellMeta.type)) {
      if (isDateValid(value)) {
        // Rewriting the date from the Handsontable format to the engine format.
        return getDateInHfFormat(value);
      }

      if (!isFormula(value)) {
        // Escaping the value from date parsing using the "'" sign (the engine's string-escape mechanism).
        return escapeTextValue(value);
      }

      return value;
    }

    if (isPreservedText(value, cellMeta)) {
      // Escaping the value from the engine's value parsing using the "'" sign (the engine's
      // string-escape mechanism).
      return escapeTextValue(value);
    }

    return value;
  }

  /**
   * Unescapes a single value read back out of the engine, reading the cell meta the unescaping needs
   * from the given VISUAL coordinates.
   *
   * Values the unescaping can never change – non-strings, and strings without the leading escape
   * apostrophe – skip the meta read altogether, the same way `#escapeSourceDataArray` skips it on the
   * write side. That read is the expensive part of a per-cell scan, because it runs the user-provided
   * `cells` function.
   *
   * @param {*} value Value read from the engine.
   * @param {number} visualRow Visual row index of the cell whose meta the escape was applied from.
   * @param {number} visualColumn Visual column index of the cell whose meta the escape was applied from.
   * @returns {*} The unescaped value, or the original value when no unescaping applies.
   */
  #unescapeEngineBoundValueAt(value: unknown, visualRow: number, visualColumn: number): unknown {
    if (!isEngineEscapedValue(value)) {
      return value;
    }

    return unescapeEngineBoundValue(value, this.hot.getCellMetaTransient(visualRow, visualColumn));
  }

  /**
   * Reverses the engine-bound escaping on a whole sheet read out of the engine.
   *
   * A RELOAD of the sheet this grid is already synced to is delegated to
   * `#unescapeAgainstSourceData`, which confirms every strip against the grid's own copy of the
   * value. Everything below describes the other case – a switch to a genuinely DIFFERENT sheet,
   * whose content this grid's data says nothing about.
   *
   * The array is indexed the way the ENGINE is on both axes – by position in the index sequence –
   * which is not the visual coordinate. HyperFormula is fed trimmed rows as well, so a `trimRows` or
   * Filters map alone makes the engine's row index and the visual row index disagree. The escaping
   * was applied per PHYSICAL cell (`#escapeSourceDataArray`), so its inverse has to resolve the same
   * physical cell, and the engine index translates to it through the axis syncers.
   *
   * The whole scan is skipped when `#needsEngineBoundEscaping()` reports that no configuration
   * layer can mark a cell for escaping, so a sheet switch in the default configuration pays no
   * per-cell meta read (the escape scan skips its meta reads on the same gate). Within the scan, values the unescaping can
   * never change skip the meta read for the same reason.
   *
   * Accepted residual, on this cross-sheet path only: both the gate and the per-value confirmation
   * read THIS grid's meta, while the sheet may have been escaped by a DIFFERENT grid sharing the
   * same engine instance. If grid A declares `preserveTextValue` and writes `0123456`, the engine
   * holds `'0123456`; grid B, declaring neither `date` nor `preserveTextValue`, loads the
   * apostrophe as data. Dropping the gate would not close this: `unescapeEngineBoundValue()` still
   * confirms the strip against grid B's meta and finds nothing to confirm it with. Nor would the
   * source-data comparison used for a reload – grid B's data belongs to the sheet it is leaving.
   * Closing it needs the escape to be self-describing, or a per-sheet record of what was escaped –
   * neither of which the engine's serialized content carries. The apostrophe is the engine's own
   * documented string-escape, so the value is not corrupted, only un-stripped.
   *
   * @param {Array<Array<*>>} sheetArray Sheet content read out of the engine, in engine index order.
   * @param {boolean} [isSameSheetReload=false] Whether the sheet being read is the one this grid is
   *   already synced to, rather than a different sheet being switched to.
   * @returns {Array<Array<*>>} The unescaped content, or `sheetArray` itself when nothing can apply.
   */
  #unescapeEngineSheetArray(sheetArray: unknown[][], isSameSheetReload = false): unknown[][] {
    if (isSameSheetReload) {
      return this.#unescapeAgainstSourceData(sheetArray);
    }

    if (!this.#needsEngineBoundEscaping()) {
      return sheetArray;
    }

    const metaManager = this.hot._getMetaManager();

    return sheetArray.map((rowData: unknown[], hfRow: number) => {
      const physicalRow = this.#toPhysicalFromHf(this.rowAxisSyncer, hfRow);
      const visualRow = this.hot.toVisualRow(physicalRow) ?? physicalRow;

      return rowData.map((value: unknown, hfColumn: number) => {
        if (!isEngineEscapedValue(value)) {
          return value;
        }

        const physicalColumn = this.#toPhysicalFromHf(this.columnAxisSyncer, hfColumn);
        const visualColumn = this.hot.toVisualColumn(physicalColumn) ?? physicalColumn;
        // The transient read applies the `cells` function and the meta hooks without permanently
        // materializing one meta object per scanned cell.
        const cellMeta = metaManager.getCellMetaTransient(
          physicalRow, physicalColumn,
          { visualRow, visualColumn },
        );

        return unescapeEngineBoundValue(value, cellMeta);
      });
    });
  }

  /**
   * Reverses the engine-bound escaping on a RELOAD of the sheet this grid is already synced to,
   * by confirming every strip against the grid's own source data rather than against the cell meta.
   *
   * The meta-confirmed path cannot serve this case. It asks whether the CURRENT configuration would
   * escape the value, so the moment that configuration changes - `preserveTextValue` turned off, or
   * a column moved off `type: 'text'` - it stops recognizing an escape it applied itself, and the
   * apostrophe is loaded into the grid as data. That is reachable without a second sheet: a grid
   * built without `data` records `#hotWasInitializedWithEmptyData`, so every later
   * `#onAfterCellMetaReset` reloads through `switchSheet()`.
   *
   * The comparison is not on its own sufficient, because it has TWO callers and only one of them
   * holds a grid whose data corresponds to the engine's. `#onAfterLoadData` carries the same
   * empty-data branch, and there - on the initial load of a grid pointed at a sheet that already
   * has content - the grid holds only its auto-generated dataset while the engine holds the content
   * being adopted. Nothing matches, and a strip the cell meta could have confirmed would be lost.
   * The same shape appears for an engine sheet larger than the dataset, where the out-of-dataset
   * cell has no stored value at all.
   *
   * So the two references are used in order, and the handover between them is what makes the rule
   * exact. Where the grid stores a STRING for the cell, that string decides on its own: it matches
   * only when this plugin escaped the value, and a mismatch means the apostrophe is the user's own.
   * The cell meta is consulted only where the grid stores no string at all, which is precisely the
   * out-of-dataset cell and the initial load described above.
   *
   * The distinction matters because the meta answers a different question - whether the CURRENT
   * configuration WOULD escape this value, not whether it WAS escaped. Consulting it on a mismatch
   * would strip a literal `'0777` the moment `preserveTextValue` is switched on, contradicting the
   * table below.
   *
   * Stripping unconditionally instead would corrupt the opposite case. A leading apostrophe in the
   * engine is not proof this plugin put it there - the engine uses the same character as its own
   * string escape, so a user's literal `'0777` typed into a cell this plugin does not escape is
   * stored with exactly one apostrophe and round-trips through it.
   *
   * The source data separates the two without needing either the old configuration or a record of
   * what was escaped: the grid's copy is never escaped, so the engine's value is this plugin's
   * escape of it precisely when it equals that copy with one apostrophe prepended.
   *
   * | grid holds     | engine holds    | verdict                                  |
   * |----------------|-----------------|------------------------------------------|
   * | `0123456`      | `'0123456`      | escaped here, strip                      |
   * | `'0777`        | `''0777`        | escaped here, strip                      |
   * | `'0777`        | `'0777`         | the user's own, keep - whatever the meta says |
   * | `'=SUM(1,2)`   | `'=SUM(1,2)`    | the user's own, keep                     |
   * | nothing stored | `'0123456`      | ask the cell meta                        |
   *
   * @param {Array<Array<*>>} sheetArray Sheet content read out of the engine, in engine index order.
   * @returns {Array<Array<*>>} The unescaped content.
   */
  #unescapeAgainstSourceData(sheetArray: unknown[][]): unknown[][] {
    const metaManager = this.hot._getMetaManager();
    // The read has to report what Handsontable STORES: left unguarded, `#onModifySourceData`
    // answers every formula cell with the engine's own content, which is the very thing being
    // compared against. Suspended through the narrow flag for the reason `#getProcessedSourceDataArray`
    // gives - this read also runs third-party `modifySourceData` handlers, and one that calls
    // `getDataAtCell()` has to keep receiving the calculated value.
    const wasProjectionSuspended = this.#sourceDataProjectionSuspended;

    this.#sourceDataProjectionSuspended = true;

    try {
      return sheetArray.map((rowData: unknown[], hfRow: number) => {
        // Values without the leading escape apostrophe can never change, so a row holding none of
        // them skips the source-data reads entirely.
        if (!rowData.some(isEngineEscapedValue)) {
          return rowData;
        }

        const physicalRow = this.#toPhysicalFromHf(this.rowAxisSyncer, hfRow);

        return rowData.map((value: unknown, hfColumn: number) => {
          if (!isEngineEscapedValue(value)) {
            return value;
          }

          const physicalColumn = this.#toPhysicalFromHf(this.columnAxisSyncer, hfColumn);
          const visualColumn = this.hot.toVisualColumn(physicalColumn) ?? physicalColumn;
          const storedValue = this.hot.getSourceDataAtCell(physicalRow, visualColumn);

          // A stored STRING is a decisive answer either way. It matches only when this plugin
          // escaped it, and when it does not match, the apostrophe is the user's own – negative
          // evidence, not absence of evidence. Falling through to the meta here would strip a
          // literal `'0777` the moment `preserveTextValue` is switched on, because the meta only
          // knows what the CURRENT configuration would escape, not what was escaped.
          if (typeof storedValue === 'string') {
            return `'${storedValue}` === value ? storedValue : value;
          }

          // No stored string, so the grid has nothing to say about this cell: it is out of the
          // dataset, or the grid is still holding its auto-generated one while adopting the
          // engine's content on an initial load. The cell meta is the only reference left, and it
          // is the one this path used before the comparison existed.
          const visualRow = this.hot.toVisualRow(physicalRow) ?? physicalRow;

          return unescapeEngineBoundValue(value, metaManager.getCellMetaTransient(
            physicalRow, physicalColumn,
            { visualRow, visualColumn },
          ));
        });
      });
    } finally {
      this.#sourceDataProjectionSuspended = wasProjectionSuspended;
    }
  }

  /**
   * Tells whether any configuration layer can mark a cell as a `date`-typed cell or as a preserved
   * text cell. Only those two markings make the escape scan change a value, so when no layer can
   * carry them the whole full-dataset scan is skipped – in the default configuration it would
   * translate indexes and read meta for every cell only to change nothing.
   *
   * The layers checked here are exactly the ones a cell meta can be composed from: the global
   * settings layer, the `columns` setting, the `cell` array, the already stored cell metas (which is
   * where `setCellMeta` and the applied `cell` array land), and the `beforeGetCellMeta` hook.
   *
   * Two things are opaque and therefore always count as "can mark a cell": a `columns` **function**
   * (its per-column result only exists at meta-build time) and a `cells` **function**. The latter is
   * part of the per-layer predicate, not a table-layer-only check, because `#runMetaExtension`
   * (`dataMap/metaManager/mods/dynamicCellMeta.ts`) reads `cellMeta.cells` off the cell meta object
   * and so resolves it through the prototype chain – a `cells` function declared on a `columns`
   * entry (`columns: [{ cells: () => ({ type: 'date' }) }]`) is honored just like a global one.
   *
   * The `columns` setting is probed by index rather than through `Array.isArray`, because
   * `core.ts` reads it as `columnSetting[j]`, which accepts an array-LIKE object too.
   *
   * Accepted residual: `afterGetCellMeta` is deliberately NOT part of the gate, because
   * `mergeCells`, `hiddenRows`, and `hiddenColumns` register it unconditionally – including it
   * would make the gate always true for any grid using merged cells or hidden rows/columns. As a
   * consequence, an `afterGetCellMeta` listener that injects `type: 'date'` or
   * `preserveTextValue` into a grid whose settings declare neither is not honored on the bulk load
   * path. Setting a cell type from a meta hook is not a documented pattern.
   *
   * @returns {boolean}
   */
  #needsEngineBoundEscaping(): boolean {
    const layerDeclaresEscaping = (layer: unknown): boolean => {
      const meta = layer as {
        type?: unknown, preserveTextValue?: unknown, cells?: unknown
      } | null | undefined;

      return !!meta && (
        meta.type === 'date' ||
        meta.preserveTextValue === true ||
        typeof meta.cells === 'function'
      );
    };
    const tableMeta = this.hot.getSettings();
    const columnsSetting = tableMeta.columns as
      { length?: number, [index: number]: unknown } | ((column: number) => unknown) | undefined;
    const columnsDeclareEscaping = (): boolean => {
      if (typeof columnsSetting === 'function') {
        return true;
      }

      if (typeof columnsSetting !== 'object' || columnsSetting === null) {
        return false;
      }

      const columnCount = Math.max(this.hot.countCols(), columnsSetting.length ?? 0);

      for (let column = 0; column < columnCount; column++) {
        if (layerDeclaresEscaping(columnsSetting[column])) {
          return true;
        }
      }

      return false;
    };

    if (
      layerDeclaresEscaping(tableMeta) ||
      columnsDeclareEscaping() ||
      (Array.isArray(tableMeta.cell) && tableMeta.cell.some(layerDeclaresEscaping)) ||
      this.hot.hasHook('beforeGetCellMeta')
    ) {
      return true;
    }

    // Checked last: unlike the settings layers above, this one allocates an array of every cell
    // meta materialized so far.
    return this.hot._getMetaManager().getCellsMeta().some(layerDeclaresEscaping);
  }

  /**
   * Escapes, in place, the source-data-array values that must reach the engine in a protected
   * form. The array rows always come in physical order (`getSourceDataArray` iterates the
   * underlying dataset). The column order depends on the data shape: plain array-of-arrays data
   * keeps the physical order, while array-of-objects data and the skipped-columns projection are
   * built in visual order. That distinction is read from `#doesEngineHoldPhysicalColumns()`, the one
   * place that answers it – see its note.
   *
   * The meta reads are skipped when `#needsEngineBoundEscaping()` reports that no configuration
   * layer can mark a cell for escaping; the scan itself still runs for the formulas (see below).
   *
   * Observable side effect, on every path that runs this scan: the per-cell meta read is a
   * TRANSIENT one, so the user's `cells` function and the `beforeGetCellMeta`/`afterGetCellMeta`
   * listeners are invoked once per non-formula string cell. That is not limited to `loadData()`
   * and `updateData()` – `#onAfterCellMetaReset` runs the same scan, and it fires on every
   * `updateSettings()` call. The read it replaces (`getCellMetaUncached`) invoked none of them, so
   * a listener that itself calls `setDataAtCell()` or `updateSettings()` now has a re-entrancy
   * path it did not have before. Invoking `cells()` is the feature here – it is what lets a type
   * declared only through that function mark a cell for escaping – so the reads cannot simply be
   * dropped; the gate above is what keeps a grid that declares no such type from paying for them
   * at all.
   *
   * Formulas are not escaped, only given the quotes a sheet name needs (`#readableFormula()`), which
   * needs no meta read, so every cell is visited even when the gate is closed. Non-strings and
   * formulas never reach the meta read.
   *
   * @param {Array<Array<*>>} sourceDataArray Source data array to process.
   * @param {number} [rowOffset=0] Physical row index of the array's first row (non-zero for partial arrays).
   * @param {number} [columnOffset=0] Index of the array's first column, in the array's own column space.
   */
  #escapeSourceDataArray(sourceDataArray: unknown[][], rowOffset = 0, columnOffset = 0) {
    const escapesText = this.#needsEngineBoundEscaping();
    const columnsInVisualOrder = !this.#doesEngineHoldPhysicalColumns();
    const metaManager = this.hot._getMetaManager();

    sourceDataArray.forEach((rowData: unknown[], arrayRowIndex: number) => {
      const physicalRow = rowOffset + arrayRowIndex;
      const visualRow = escapesText ? (this.hot.toVisualRow(physicalRow) ?? physicalRow) : physicalRow;

      rowData.forEach((cellValue: unknown, arrayColumnIndex: number) => {
        if (typeof cellValue !== 'string') {
          return;
        }

        if (isFormula(cellValue)) {
          if (cellValue.includes('!')) {
            sourceDataArray[arrayRowIndex][arrayColumnIndex] = this.#readableFormula(cellValue);
          }

          return;
        }

        if (!escapesText) {
          return;
        }

        const columnIndex = columnOffset + arrayColumnIndex;
        const visualColumn = columnsInVisualOrder
          ? columnIndex
          : (this.hot.toVisualColumn(columnIndex) ?? columnIndex);
        const physicalColumn = columnsInVisualOrder
          ? (this.hot.toPhysicalColumn(columnIndex) ?? columnIndex)
          : columnIndex;

        // The transient read applies the `cells` function and the meta hooks without permanently
        // materializing one meta object per scanned cell.
        const cellMeta = metaManager.getCellMetaTransient(
          physicalRow, physicalColumn,
          { visualRow, visualColumn },
        );

        sourceDataArray[arrayRowIndex][arrayColumnIndex] = this.#escapeEngineBoundValue(cellValue, cellMeta);
      });
    });
  }

  /**
   * The hook allows to translate the formula value to calculated value before it goes to the
   * validator function.
   *
   * A change the Core can reject is not in the engine yet (see `#splitChangesByValidation()`), so
   * its value comes from `#validationValues`, which `afterSetDataAtCell` filled for the set the Core is
   * validating: the result of a formula, or the change's own value. Every other validation (a dependent
   * cell, `validateCells()`) reads the engine.
   *
   * @param {*} value The cell value to validate.
   * @param {number} visualRow The visual row index.
   * @param {number|string} prop The visual column index or property name of the column.
   * @param {string} [source] The source of the validation.
   * @returns {*} Returns value to validate.
   */
  #onBeforeValidate = (value: unknown, visualRow: number, prop: number | string, source?: string) => {
    const visualColumn = this.hot.propToCol(prop);

    // A prop that names no existing column has no engine address to validate against.
    if (visualColumn === null) {
      return value;
    }

    const entries = this.#validationValues.get(this.#validationValueKey(visualRow, visualColumn)) ?? [];
    // A cell can be written more than once before the Core validates (twice in one set, or by two sets in one
    // task). The Core validates the changes in the order they were written, so each validation takes the
    // first entry with its value and removes it: the next change to the cell gets its own entry, also when
    // it writes the same value against other precedents.
    let index = entries.findIndex(entry => entry.source === source && Object.is(entry.changeValue, value));

    for (let last = entries.length - 1; index === -1 && last >= 0; last--) {
      if (entries[last].source === source) {
        index = last;
      }
    }

    if (index !== -1) {
      const [pending] = entries.splice(index, 1);

      if (pending.readerAnswer) {
        this.#trackReaderAnswer(visualRow, visualColumn, pending.readerAnswer);
      }

      return pending.hasResult ? pending.result : value;
    }

    if (this.isFormulaCellType(visualRow, visualColumn)) {
      return this.#readValidationValue(visualRow, visualColumn);
    }

    return value;
  };

  /**
   * Starts watching how the validator of a reader of a deferred cell answers the Core's validation of its
   * change (see `ReaderAnswer`). `beforeValidate` fires in the `validateCell()` call, before the call queues
   * the validator's microtask, so a check queued from a microtask queued now runs after the validator's.
   * The check ends the watch: the record leaves `#readerAnswers` then, so a validator that throws or never
   * answers leaves nothing that a later validation of the cell would mark.
   *
   * @param {number} visualRow The visual row index.
   * @param {number} visualColumn The visual column index.
   * @param {object} answer The answer record of the reader.
   */
  #trackReaderAnswer(visualRow: number, visualColumn: number, answer: ReaderAnswer) {
    const key = this.#validationValueKey(visualRow, visualColumn);

    this.#readerAnswers.set(key, [...(this.#readerAnswers.get(key) ?? []), answer]);
    this.hot._registerMicrotask(() => this.hot._registerMicrotask(() => {
      answer.isSyncChecked = true;
      answer.wasAnsweredAtCheck = answer.answered;
      this.#forgetReaderAnswer(key, answer);
    }));
  }

  /**
   * Takes a record out of `#readerAnswers`.
   *
   * @param {string} key The cell key (`#validationValueKey()`).
   * @param {object} answer The record.
   */
  #forgetReaderAnswer(key: string, answer: ReaderAnswer) {
    const answers = this.#readerAnswers.get(key) ?? [];
    const index = answers.indexOf(answer);

    if (index !== -1) {
      answers.splice(index, 1);
    }

    if (answers.length === 0) {
      this.#readerAnswers.delete(key);
    }
  }

  /**
   * `afterValidate` hook callback. Marks the answer of a reader of a deferred cell the Core is validating
   * (see `#trackReaderAnswer()`): the oldest record of the cell with the same value and source. **Known
   * limit:** another validation of the cell with the same value and source that answers inside the watch
   * (a `validateCells()` in the same task, while the engine already holds that value) marks the record, so
   * an async reader is taken for a sync one and its re-validation after a rejection holds the edit's step.
   *
   * @param {boolean} isValid The validation result.
   * @param {*} value The validated value.
   * @param {number} visualRow The visual row index.
   * @param {number|string} prop The visual column index or property name of the column.
   * @param {string} [source] The source of the validation.
   */
  #onAfterValidate = (
    isValid: boolean, value: unknown, visualRow: number, prop: number | string, source?: string,
  ) => {
    if (this.#readerAnswers.size === 0) {
      return;
    }

    const visualColumn = this.hot.propToCol(prop);
    const key = visualColumn === null ? null : this.#validationValueKey(visualRow, visualColumn);
    const answers = key === null ? undefined : this.#readerAnswers.get(key);

    const answer = answers?.find(record => !record.answered && record.source === source &&
      Object.is(record.value, value));

    if (answer) {
      answer.answered = true;
    }
  };

  /**
   * Reads the value a validator gets for a formula cell: its result in the engine, a date or a time
   * column's serial number turned into the grid's format, and an error as its text.
   *
   * @param {number} visualRow The visual row index.
   * @param {number} visualColumn The visual column index.
   * @returns {*}
   */
  #readValidationValue(visualRow: number, visualColumn: number) {
    const address = {
      row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow),
      col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn),
      sheet: this.sheetId,
    };

    // Only a formula cell reads the engine, so a validated plain write keeps a held recalculation.
    this.#flushEvaluation();

    // Date as an integer (Excel-like date).
    return this.#toValidationValue(visualRow, visualColumn, this.engine!.getCellValue(address));
  }

  /**
   * Turns an engine value into what a validator gets: a date or a time column's serial number in the
   * grid's format, and an error as its text.
   *
   * @param {number} visualRow The visual row index.
   * @param {number} visualColumn The visual column index.
   * @param {*} engineValue The engine value.
   * @returns {*}
   */
  #toValidationValue(visualRow: number, visualColumn: number, engineValue: unknown) {
    const cellMeta = this.hot.getCellMetaTransient(visualRow, visualColumn);
    let cellValue = engineValue;

    if (cellMeta.type === 'date' && isNumeric(cellValue)) {
      cellValue = getDateFromExcelDate(cellValue);
    } else if (cellMeta.type === 'time' && isNumeric(cellValue)) {
      cellValue = getTimeFromHfTimeFraction(cellValue as number);
    }

    // If `cellValue` is an object it is expected to be an error
    return hasValueProperty(cellValue) ? cellValue.value : cellValue;
  }

  /**
   * `onBeforeAutofill` hook callback.
   *
   * @param {Array[]} fillData The data that was used to fill the `targetRange`. If `beforeAutofill` was used
   * and returned `[[]]`, this will be the same object that was returned from `beforeAutofill`.
   * @param {CellRange} sourceRange The range values will be filled from.
   * @param {CellRange} targetRange The range new values will be filled into.
   * @returns {boolean|*}
   */
  #onBeforeAutofill = (
    fillData: unknown[][][][], sourceRange: CellRange, targetRange: CellRange
  ) => {
    const { row: sourceTopStartRow, col: sourceTopStartColumn } = sourceRange.getTopStartCorner();
    const { row: sourceBottomEndRow, col: sourceBottomEndColumn } = sourceRange.getBottomEndCorner();
    const { row: targetTopStartRow, col: targetTopStartColumn } = targetRange.getTopStartCorner();
    const { row: targetBottomEndRow, col: targetBottomEndColumn } = targetRange.getBottomEndCorner();

    if (
      sourceTopStartRow === null || sourceTopStartColumn === null ||
      sourceBottomEndRow === null || sourceBottomEndColumn === null ||
      targetTopStartRow === null || targetTopStartColumn === null ||
      targetBottomEndRow === null || targetBottomEndColumn === null
    ) {
      return;
    }

    const hfSourceStartRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(sourceTopStartRow);
    const hfSourceStartCol = this.columnAxisSyncer!.getHfIndexFromVisualIndex(sourceTopStartColumn);
    const hfSourceEndRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(sourceBottomEndRow);
    const hfSourceEndCol = this.columnAxisSyncer!.getHfIndexFromVisualIndex(sourceBottomEndColumn);
    const hfTargetStartRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(targetTopStartRow);
    const hfTargetStartCol = this.columnAxisSyncer!.getHfIndexFromVisualIndex(targetTopStartColumn);
    const hfTargetEndRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(targetBottomEndRow);
    const hfTargetEndCol = this.columnAxisSyncer!.getHfIndexFromVisualIndex(targetBottomEndColumn);

    if (
      hfSourceStartRow === null || hfSourceStartCol === null ||
      hfSourceEndRow === null || hfSourceEndCol === null ||
      hfTargetStartRow === null || hfTargetStartCol === null ||
      hfTargetEndRow === null || hfTargetEndCol === null
    ) {
      return;
    }

    const engineSourceRange = {
      start: {
        row: hfSourceStartRow,
        col: hfSourceStartCol,
        sheet: this.sheetId,
      },
      end: {
        row: hfSourceEndRow,
        col: hfSourceEndCol,
        sheet: this.sheetId,
      },
    };

    const engineTargetRange = {
      start: {
        row: hfTargetStartRow,
        col: hfTargetStartCol,
        sheet: this.sheetId,
      },
      end: {
        row: hfTargetEndRow,
        col: hfTargetEndCol,
        sheet: this.sheetId,
      },
    };

    // Blocks the autofill operation if HyperFormula says that at least one of
    // the underlying cell's contents cannot be set.
    if (this.engine!.isItPossibleToSetCellContents(engineTargetRange) === false) {
      return false;
    }

    this.#flushEvaluation();

    const fillRangeData = this.#readableSheet(this.engine!.getFillRangeData(engineSourceRange, engineTargetRange));
    const {
      row: sourceStartRow,
      col: sourceStartColumn,
    } = engineSourceRange.start;
    const {
      row: sourceEndRow,
      col: sourceEndColumn,
    } = engineSourceRange.end;
    const populationRowLength = sourceEndRow - sourceStartRow + 1;
    const populationColumnLength = sourceEndColumn - sourceStartColumn + 1;
    const metaManager = this.hot._getMetaManager();

    for (let populatedRowIndex = 0; populatedRowIndex < fillRangeData.length; populatedRowIndex += 1) {
      for (let populatedColumnIndex = 0; populatedColumnIndex < fillRangeData[populatedRowIndex].length;
        populatedColumnIndex += 1) {
        const populatedValue = fillRangeData[populatedRowIndex][populatedColumnIndex];
        // HyperFormula indexes – trimmed rows/columns (`trimRows`, Filters) still occupy an HF
        // index but no visual one, so these can diverge from the visual coordinates below. Plain
        // moves do not diverge them: a move resyncs HF's own row/column order to match visual order.
        const sourceRow = sourceStartRow + (populatedRowIndex % populationRowLength);
        const sourceColumn = sourceStartColumn + (populatedColumnIndex % populationColumnLength);
        // The meta is read by PHYSICAL coordinates, the way `#escapeSourceDataArray` and
        // `#onAfterSetSourceDataAtCell` read it, with the visual pair passed only as the hook
        // context. The two endpoints of the range are always selected cells and so always visible,
        // but the loop walks every HF index BETWEEN them – and a trimmed row keeps its HF index
        // while having no visual one. Reading such a source through the visual axis yields -1,
        // which `getCellMeta()` rejects outright ("Expecting an unsigned number"), aborting the
        // whole autofill.
        const physicalSourceRow = this.#toPhysicalFromHf(this.rowAxisSyncer, sourceRow);
        const physicalSourceColumn = this.#toPhysicalFromHf(this.columnAxisSyncer, sourceColumn);
        const visualSourceRow = this.hot.toVisualRow(physicalSourceRow) ?? physicalSourceRow;
        const visualSourceColumn = this.hot.toVisualColumn(physicalSourceColumn) ?? physicalSourceColumn;
        const sourceCellMeta = metaManager.getCellMetaTransient(
          physicalSourceRow, physicalSourceColumn,
          { visualRow: visualSourceRow, visualColumn: visualSourceColumn },
        );

        if (isDate(populatedValue, sourceCellMeta.type)) {
          if (populatedValue.startsWith('\'')) {
            // Populating values on HOT side without apostrophe.
            fillRangeData[populatedRowIndex][populatedColumnIndex] = populatedValue.slice(1);

            // Asked of the engine directly with the HF pair already in hand. `isFormulaCellType()`
            // would translate a visual pair back into this same one, which a trimmed source cannot
            // round-trip through.
          } else if (this.engine!.doesCellHaveFormula({
            sheet: this.sheetId, row: sourceRow, col: sourceColumn
          }) === false) {
            // Populating date in proper format, coming from the source cell.
            fillRangeData[populatedRowIndex][populatedColumnIndex] =
              getDateInHotFormat(populatedValue);
          }
        } else if (isPreservedText(populatedValue, sourceCellMeta) && populatedValue.startsWith('\'')) {
          // Populating values on the Handsontable side without the escape apostrophe.
          fillRangeData[populatedRowIndex][populatedColumnIndex] = populatedValue.slice(1);
        }
      }
    }

    return fillRangeData;
  };

  /**
   * `beforeLoadData` hook callback. A grid counts as built without data when no `data` setting exists,
   * except for the load core's `_applySettingsAndData()` makes: that load carries the data of the call,
   * before the setting is stored (the sheets bar loads its opening sheet that way), and treating that grid
   * as empty made every later settings update reload it from the engine sheet. The exception is scoped to
   * that call on purpose: a grid built with a `dataProvider` and no `data` loads a `[]` placeholder first,
   * and must keep reading the engine sheet as its data.
   *
   * @param {Array} sourceData Array of arrays or array of objects containing data.
   * @param {boolean} initialLoad Flag that determines whether the data has been loaded during the initialization.
   * @param {string} [source] Source of the call.
   */
  #onBeforeLoadData = (sourceData: unknown[], initialLoad: boolean, source = '') => {
    if (source.includes(toUpperCaseFirst(PLUGIN_KEY))) {
      return;
    }

    // This flag needs to be defined, because not passing data to HOT results in HOT auto-generating a `null`-filled
    // initial dataset.
    this.#hotWasInitializedWithEmptyData = isUndefined(this.hot.getSettings().data) &&
      !(this.isDataWorkDeferred() && Array.isArray(sourceData));
  };

  /**
   * Whether the meta phase core runs after the load of `_applySettingsAndData()` can change a value the
   * engine reads: it applies the `cell` option and the `columns` function form, and a cell type either
   * sets (a key/value dropdown resolves an object to its label) decides that value. The load wrote the
   * sheet before either was applied. Core resets the column meta before that load for `columns: null`,
   * so the load already reads the values that call describes. Only a `cell` entry that sets a key the
   * built-in value getters read counts (`VALUE_GETTER_META_KEYS`): the sheets bar restates a grid-level
   * `cell` on every switch, and an entry that only sets `readOnly` or a class made every switch pay a
   * full engine write. A custom `valueGetter` that reads another key of a `cell` entry is not seen.
   *
   * @returns {boolean}
   */
  #metaPhaseMayChangeEngineValues(): boolean {
    const { cell, columns } = this.hot.getSettings();

    return typeof columns === 'function' || (Array.isArray(cell) && cell.some(
      entry => isObject(entry) && VALUE_GETTER_META_KEYS.some(key => hasOwnProperty(entry, key))
    ));
  }

  /**
   * Callback to `afterCellMetaReset` hook which is triggered after setting cell meta.
   *
   * The Core fires it in the middle of `updateSettings()`, before `afterUpdateSettings` and so
   * before any plugin has applied the new settings. A scan run here describes the layout the
   * plugins are about to replace, so outside of construction the scan is only recorded as owed
   * and `#resyncSheet` runs it later, once per cycle - see `#sheetResyncPending`. Construction
   * has no `afterUpdateSettings` pass (the Core skips the hook on its first run), so the scan
   * stays eager there; `hot.view` is what the Core creates right after that first run.
   *
   * The reset core's `_applySettingsAndData()` fires from the meta phase it held back for its own load
   * (`_isHeldMetaPhaseRunning()`, never the reset of a full settings update an `afterLoadData` listener makes
   * in that call, whose `columns` the load never saw) needs no resync when the call
   * declares no `cell` entries and no `columns` function: that load already wrote the sheet through
   * `#onAfterLoadData`, with the column configuration of the call in force, and a second scan cost a full
   * engine write and an AutoColumnSize sweep per sheet switch. `cell` entries and a `columns` function reach
   * the cell meta only after that load, and a cell type they set can change the value the engine reads (a
   * key/value dropdown resolves an object to its label), so such a call resyncs as any settings update does.
   */
  #onAfterCellMetaReset = () => {
    this.#closeLeakedGuards();

    if (this.hot._isHeldMetaPhaseRunning()
      && (this.#pendingAdoption?.adopted || !this.#metaPhaseMayChangeEngineValues())) {
      return;
    }

    // The reload below and the scan in `#resyncSheet` both run a full-dataset read whose per-cell
    // meta read fires `cells()` and the `beforeGetCellMeta`/`afterGetCellMeta` listeners – see
    // `#escapeSourceDataArray` for what that changes for a listener with side effects.
    if (this.#hotWasInitializedWithEmptyData) {
      if (this.sheetName !== null) {
        this.#loadSheet(this.sheetName);
      }

      this.#recordSyncedLayout();

      return;
    }

    if (this.hot.view) {
      this.#sheetResyncPending = true;
      this.#sheetIdAtLastSync = this.sheetId;

      return;
    }

    if (this.sheetId !== null && this.#sheetIdAtLastSync === this.sheetId
      && this.#sourceRowCountAtLastSync === this.hot.countSourceRows() && !this.#metaPhaseMayChangeEngineValues()) {
      return;
    }

    this.#resyncSheet();
  };

  /**
   * Rebuilds the engine sheet from the source data: one full scan, one `setSheetContent`.
   *
   * `#sheetResyncPending` is cleared FIRST. The scan reads the source data through the read hooks
   * that drain the flag - `#getProcessedSourceDataArray` suspends the projection for its bulk
   * read but not for the `getSourceDataAtRow` probe that follows it - so a flag still set here
   * would re-enter this method from inside its own scan.
   *
   * A throw from the scan leaves the flag CLEARED and the layout unrecorded. It is not re-armed: a
   * throw that repeats on every scan - a `cells()` handler that throws for one cell, a dependent
   * grid whose `afterRender` throws - would otherwise turn every later read and render into a
   * full scan that throws again, where before this plugin the throw surfaced once, from
   * `updateSettings()`. The next `updateSettings()` marks the flag again and retries there. The
   * one throw the engine itself raises deterministically, a sheet over its `maxRows` /
   * `maxColumns`, is not thrown at all: the layout is checked first and the sheet is emptied with
   * a warning, as `#onAfterLoadData` does. `#internalOperationPending` is released on every path,
   * because the read hooks return early while it is set and would otherwise serve raw formula
   * text until the next settings update.
   */
  #resyncSheet() {
    this.#sheetResyncPending = false;

    this.#writeOwnSheet(this.engine!, () => {
      const sourceDataArray = this.#getProcessedSourceDataArray();

      if (!this.engine!.isItPossibleToReplaceSheetContent(this.sheetId, sourceDataArray)) {
        this.#clearRejectedSheet();

        return;
      }

      this.#writeSheet(sourceDataArray, true);
    });
  }

  /**
   * Prepares a write that replaces this grid's sheet inside a hold (`beginHeldSheetWrite()`), before the read
   * hooks go passive: held cell writes are recalculated first, without painting this grid. With nothing held it
   * opens no write scope, so the paints a registration parked (`holdPluginEngineWritePaints()`) stay parked.
   */
  #beginHeldSheetWrite() {
    if (isEvaluationHeld(this.engine)) {
      this.#writeOwnSheet(this.engine, () => beginHeldSheetWrite(this.engine));
    }
  }

  /**
   * Writes a processed source data array into the grid's sheet: escapes it, replaces the sheet
   * content, re-syncs the index endpoint, redraws the dependent grids, and records the layout.
   * The one place `#internalOperationPending` is opened across a full write, and it is released
   * in a `finally`: the read hooks return early while it is set, so a throw from the write or
   * from a dependent grid's render would otherwise leave every formula cell reading raw text until
   * the next settings update. Shared by `#resyncSheet()` and the `#onAfterLoadData` write branch,
   * so the two cannot drift.
   *
   * With `skipWhenSynced` (the resync of a settings update, every React or Vue re-render), a source data array
   * that reads the same as the content the engine was last fed, with the grid's own changes since
   * (`#syncedContent`), is not written: the engine already holds it in the grid's order, with every reference
   * the user's moves left, in this sheet, in other sheets and in named expressions. Writing it again in
   * physical order and replaying the order could only move those references a second time (DEV-3972).
   *
   * @param {Array<Array<*>>} sourceDataArray The array `#getProcessedSourceDataArray()` produced.
   * @param {boolean} [skipWhenSynced=false] Whether an unchanged array is left unwritten.
   */
  #writeSheet(sourceDataArray: unknown[][], skipWhenSynced = false): unknown[] {
    this.#escapeSourceDataArray(sourceDataArray);
    this.#beginHeldSheetWrite();

    if (skipWhenSynced && this.#isSyncedContent(sourceDataArray)) {
      this.#recordSyncedLayout();

      return [];
    }

    // Read before the write, while the data hooks answer as they did for the escape above: the write's own
    // guard makes them return early, and inside an engine batch a read through them would throw.
    const columnSpace = this.#readSyncedColumnSpace();

    this.#syncedContent = null;
    this.#internalOperationPending = true;

    let dependentCells: unknown[] = [];

    try {
      this.#sheetWriteCount += 1;
      this.#sourceHasStaleFormulas = false;

      dependentCells = this.#writeOwnSheet(this.engine!, () => {
        const changes = this.engine!.setSheetContent(this.sheetId, sourceDataArray);

        this.indexSyncer!.setupSyncEndpoint(this.engine!, this.sheetId);

        return changes;
      });
    } finally {
      this.#internalOperationPending = false;
    }

    this.#syncedContent = {
      engine: this.engine!,
      sheetId: this.sheetId,
      rows: toSyncedRows(sourceDataArray),
      columnSpace,
    };
    this.#recordSyncedLayout();

    return dependentCells;
  }

  /**
   * Tells whether the engine holds what a write of `sourceDataArray` would give it: the array reads the same
   * as `#syncedContent`, the engine and the sheet are the ones it was recorded for, and the engine holds both
   * axes in the grid's order (a data load can reset the grid's order, and an order held for the sheets bar
   * is not the grid's). A value written in place into the host's data reads differently, so it is written.
   *
   * @param {Array<Array<*>>} sourceDataArray The escaped array a write would feed the engine.
   * @returns {boolean}
   */
  #isSyncedContent(sourceDataArray: unknown[][]): boolean {
    const synced = this.#syncedContent;

    if (synced === null || synced.engine !== this.engine || synced.sheetId !== this.sheetId
      || synced.rows.length !== sourceDataArray.length || !this.#hasOwnSheet()
      || !this.rowAxisSyncer!.holdsGridOrder() || !this.columnAxisSyncer!.holdsGridOrder()) {
      return false;
    }

    return sourceDataArray.every((row, index) => areSyncedRowsEqual(synced.rows[index], row));
  }

  /**
   * Records a value the grid wrote into one engine cell in `#syncedContent`, at the cell's place in the
   * source data array, so a later resync does not take the grid's own write for a change of the data. A cell
   * the array has no place for drops the record.
   *
   * @param {number|null} physicalRow The physical row.
   * @param {number} visualColumn The visual column.
   * @param {*} value The value the engine got.
   */
  #recordSyncedCell(physicalRow: number | null, visualColumn: number, value: unknown) {
    const synced = this.#syncedContent;

    if (synced === null) {
      return;
    }

    const column = this.#syncedColumnIndex(synced.columnSpace, visualColumn);

    if (physicalRow === null || physicalRow < 0 || column === null || column < 0) {
      this.#syncedContent = null;

      return;
    }

    while (synced.rows.length <= physicalRow) {
      synced.rows.push([]);
    }

    synced.rows[physicalRow][column] = toSyncedValue(value);
  }

  /**
   * Reads the column space of the source data array `#getProcessedSourceDataArray()` builds: physical columns
   * for plain array rows, visual columns for object rows (built in visual order), and for array rows a
   * `columns` list projects, the place of each visual column among the visible columns bound to a source
   * index, built once here so a recorded cell is a lookup. Read when the array is written, because the read
   * goes through the data hooks, which a write inside an engine batch must not run.
   *
   * @returns {string|Array}
   */
  #readSyncedColumnSpace(): SyncedColumnSpace {
    if (this.#doesEngineHoldPhysicalColumns()) {
      return 'physical';
    }

    if (!this.#isSourceDataArrayOfArrays()) {
      return 'visual';
    }

    const projectedIndexes: Array<number | null> = [];
    let index = 0;

    for (let column = 0; column < this.hot.countCols(); column += 1) {
      if (typeof this.hot.colToProp(column) === 'number') {
        projectedIndexes.push(index);
        index += 1;
      } else {
        projectedIndexes.push(null);
      }
    }

    return projectedIndexes;
  }

  /**
   * Returns the index of a visual column in the source data array, in the column space it was recorded in.
   *
   * @param {string|Array} columnSpace The column space (`#readSyncedColumnSpace()`).
   * @param {number} visualColumn The visual column.
   * @returns {number|null}
   */
  #syncedColumnIndex(columnSpace: SyncedColumnSpace, visualColumn: number): number | null {
    if (columnSpace === 'physical') {
      return this.hot.toPhysicalColumn(visualColumn);
    }

    if (columnSpace === 'visual') {
      return visualColumn;
    }

    return columnSpace[visualColumn] ?? null;
  }

  /**
   * Follows a row insert or removal in `#syncedContent`, by physical index: the engine got an empty row, or
   * lost one, at the same place. NestedRows moves rows inside the source data itself, so under it the record
   * is dropped instead.
   *
   * @param {Function} update Changes the recorded rows.
   */
  #followSyncedRows(update: (rows: unknown[][]) => boolean) {
    const synced = this.#syncedContent;

    if (synced === null) {
      return;
    }

    if (this.hot.getPlugin('nestedRows')?.enabled || !update(synced.rows)) {
      this.#syncedContent = null;
    }
  }

  /**
   * Empties the sheet when the engine cannot hold the grid's layout - it exceeds the engine's
   * `maxRows` or `maxColumns` - and warns. Leaving the sheet untouched would keep the previous
   * data in the engine while the grid already shows the new one, so stale values would be served;
   * emptying it changes what every grid reading it computes, hence the dependent redraw. The
   * layout is recorded so the late `afterUpdateSettings` listener does not take the emptied sheet
   * for a row-count change and scan a layout the engine just rejected. The order syncers are pointed at
   * the emptied sheet, as a write points them at the sheet it fills: left on the sheet bound before,
   * a sort of the rejected sheet reordered that other sheet's formulas.
   */
  #clearRejectedSheet(): unknown[] {
    this.#syncedContent = null;
    this.#internalOperationPending = true;
    this.#refusedSheetWriteCount += 1;
    this.#sheetWriteCountAtRefusal = this.#sheetWriteCount;

    let dependentCells: unknown[] = [];

    try {
      dependentCells = this.#writeOwnSheet(this.engine!, () => {
        const changes = this.engine!.setSheetContent(this.sheetId, [[]]);

        this.indexSyncer!.setupSyncEndpoint(this.engine!, this.sheetId);

        return changes;
      });
    } finally {
      this.#internalOperationPending = false;
    }

    this.#recordSyncedLayout();

    warn('The loaded data could not be passed to the formula engine, so the formulas were ' +
      'cleared. It most likely exceeds the engine\'s `maxRows` or `maxColumns` limit.');

    return dependentCells;
  }

  /**
   * `beforeRender` hook callback.
   *
   * Drains a resync the settings update in flight still owes, before the draw starts. Without it
   * the first cell's paint gate would drain it through `#onModifyData`, and the full scan plus the
   * dependent grids' redraw would run from inside a cell paint of this grid's own draw. A plugin
   * that renders from its own `onUpdateSettings` - NestedRows does - reaches this before the late
   * `afterUpdateSettings` listener.
   *
   * The draw is prepared from `#onBeforeRenderStart` on, so a recalculation another listener's read makes
   * before this one (AutoColumnSize samples the cells) is left to the draw too (`#deferPaintToDraw()`).
   */
  #onBeforeRender = () => {
    try {
      this.#releaseResumedHolders();

      if (this.engine && this.#sheetResyncPending) {
        this.#resyncSheet();
      }

      // A grid that holds the engine recalculates before it draws, so the draw does not end the hold from
      // inside a cell paint. A grid that does not hold it draws first: a draw with no formula cell keeps the
      // hold, and the first formula cell recalculates (see `#isDrawingHeldEngine`).
      if (this.engine && isEvaluationHolder(this.engine, this.hot)) {
        this.#flushEvaluation();
      }
    } finally {
      this.#isPreparingDraw = false;
    }

    this.#isDrawingHeldEngine = isEvaluationHeld(this.engine);
  };

  /**
   * `beforeRender` hook callback registered ahead of every default-order listener. Starts preparing the draw
   * (see `#onBeforeRender`).
   *
   * @param {boolean} isFullRender `false` for a fast draw (see `#isFastDraw`).
   */
  #onBeforeRenderStart = (isFullRender: boolean) => {
    this.#isFastDraw = !isFullRender;
    // Only a held engine recalculates while the draw is prepared. With nothing held, a paint asked for here
    // renders at once, as it always did.
    this.#isPreparingDraw = isEvaluationHeld(this.engine);
  };

  /**
   * `afterRender` hook callback. Ends the draw `#onBeforeRender` started, and renders once more when a
   * recalculation during a fast draw asked for it (`#deferPaintToDraw()`).
   */
  #onAfterRender = () => {
    const repaint = this.#repaintAfterDraw;

    this.#isDrawingHeldEngine = false;
    this.#repaintAfterDraw = false;

    if (repaint) {
      this.#paintGrid();
    }
  };

  /**
   * Records which sheet the engine was last brought in line with, and how many source rows the
   * grid held at that moment. `#onAfterUpdateSettingsRowCount` compares the count the settings
   * update ends on against it.
   *
   * Called at the END of every write - `#resyncSheet()`, `#clearRejectedSheet()`, the
   * `#onAfterLoadData` write branch - and at the end of the empty-data reload, never at its start:
   * that branch's own `switchSheet()` runs `loadData()`, which moves the row count itself, so a
   * count taken beforehand describes a layout that no longer exists and makes the late listener
   * re-enter for a change the handler had just made. A throw inside a write leaves the previous
   * values in place; the flag, not this record, is what carries a retry (see `#sheetResyncPending`).
   */
  #recordSyncedLayout() {
    this.#sourceRowCountAtLastSync = this.hot.countSourceRows();
    this.#sheetIdAtLastSync = this.sheetId;
  }

  /**
   * `afterUpdateSettings` hook callback, registered to run after every other listener.
   *
   * The Core fires `afterCellMetaReset` in the middle of `updateSettings()` - before the plugins
   * update - so `#onAfterCellMetaReset` only records that a resync is owed, and this listener
   * performs it once the plugins have finished shaping the layout: turning `nestedRows` on flattens
   * the tree into twice as many rows, and a scan run before that described a layout the engine
   * then held while the grid showed another, so a formula the flatten moved rendered as raw text
   * and its value landed on another row (DEV-2978). This is the one scan an ordinary
   * `updateSettings()` call - the one a React re-render sends - pays (DEV-3006).
   *
   * The owed resync may already have been drained earlier in the same update: by `beforeRender`,
   * when a plugin renders from its own `onUpdateSettings`, or by a read hook, when a listener reads
   * a cell. Then only a row count that moved since that scan calls for another, which is what the
   * comparison against `#recordSyncedLayout()` decides. Nothing here knows which plugin moved it.
   * `minRows`/`minSpareRows` are NOT in that class: the Core creates those rows in
   * `adjustRowsAndCols()`, after this hook, and they reach the engine through `afterCreateRow`.
   *
   * The sheet id is compared as well as the count, because a count change this plugin caused ITSELF
   * is not a foreign layout change. `updatePlugin()` switches the sheet from a default-order
   * `afterUpdateSettings` listener, and `switchSheet()` loads the new sheet's rows into the grid -
   * so on a switch between sheets of different heights the count differs for a reason that needs no
   * resync. Re-entering there wrote the grid BACK into the sheet just switched to, through this
   * grid's visible-column projection: a grid showing one column of a three-column sheet truncated
   * that sheet to one column, destroying the rest for every grid sharing the engine.
   */
  #onAfterUpdateSettingsRowCount = () => {
    if (!this.engine) {
      return;
    }

    if (this.sheetId !== this.#sheetIdAtLastSync) {
      return;
    }

    // The resync `afterCellMetaReset` left for this pass. This is the one scan an ordinary
    // settings update pays, and it runs against the layout the plugins have finished shaping.
    if (this.#sheetResyncPending) {
      this.#resyncSheet();

      return;
    }

    // The resync already ran - construction, the empty-data reload, or a default-order listener
    // that read the engine and drained it before the plugins updated - so only a row count that
    // moved since then calls for another.
    if (this.#sourceRowCountAtLastSync === null || this.hot.countSourceRows() === this.#sourceRowCountAtLastSync) {
      return;
    }

    if (this.#hotWasInitializedWithEmptyData) {
      this.#onAfterCellMetaReset();

      return;
    }

    this.#closeLeakedGuards();
    this.#resyncSheet();
  };

  /**
   * `afterLoadData` hook callback.
   *
   * @param {Array} sourceData Array of arrays or array of objects containing data.
   * @param {boolean} initialLoad Flag that determines whether the data has been loaded during the initialization.
   * @param {string} [source] Source of the call.
   */
  #onAfterLoadData = (sourceData: unknown[], initialLoad: boolean, source = '') => {
    this.#hyperlinkCells.clear();
    // A load drops every waiting set, so no watch of a reader's answer is needed any more.
    this.#readerAnswers.clear();

    if (source.includes(toUpperCaseFirst(PLUGIN_KEY))) {
      // The engine already holds the reloaded sheet in this order (see `#reloadKeepingOrder()`). Taken over
      // here, after the load reset the grid's order and before the move plugins re-apply their arrays, so
      // their moves are held (`AxisSyncer#calculateAndSyncMoves`).
      if (this.#reloadEngineOrder !== null) {
        this.rowAxisSyncer!.adoptEngineOrder(this.#reloadEngineOrder.row);
        this.columnAxisSyncer!.adoptEngineOrder(this.#reloadEngineOrder.column);
      }

      return;
    }

    this.#foreignLoadCount += 1;

    if (!this.engine) {
      return;
    }

    this.#closeLeakedGuards();

    const engine = this.engine;

    // Fall back to the sheet this instance already owns. Without it every `loadData`/`updateData`
    // call adds a sheet and abandons the previous one - with its whole dependency graph - inside
    // the engine, which the engine then recalculates on every subsequent call.
    const bindSheet = () => setupSheet(
      engine, this.#requestedSheetName() ?? this.sheetName ?? this.#readSheetNameSetting(),
    );
    const bindAndLoad = () => {
      this.#updateSheetNameAndSheetId(bindSheet());
      this.#followSheetNameSettingWhenBound();

      if (source === 'updateSettings') {
        // For performance reasons, the initialization will be done in afterCellMetaReset hook. The grids
        // that read the new sheet paint when that fill ends.
        holdPluginEngineWritePaints(engine);

        return;
      }

      if (!this.#hotWasInitializedWithEmptyData && this.#pendingAdoption?.adopted === false
        && (this.#isBoundTo(this.#pendingAdoption.order) || this.#pendingAdoption.order.content !== undefined)) {
        this.#adoptEngineSheet(this.#pendingAdoption.order);
        this.#pendingAdoption.adopted = true;

        return;
      }

      if (!this.#hotWasInitializedWithEmptyData) {
        // Records the layout too, so a settings update this load ran inside of has no row-count change
        // left to carry.
        this.#loadSourceDataIntoSheet();

      } else if (this.sheetName !== null) {
        this.#loadSheet(this.sheetName);
      }
    };

    // Adding the sheet and filling it are one write: adding it makes the engine re-resolve a formula in
    // another grid that named it first (`#REF!` becomes the cell's value, or empty), and that cell is
    // in the first change list alone when the fill leaves it empty. One scope paints those grids once,
    // after the data is in, or when the fill throws. A grid built from the sheet writes nothing, so the
    // event of adding the sheet is its only paint.
    if (this.#hotWasInitializedWithEmptyData) {
      bindAndLoad();
    } else {
      this.#writeOwnSheet(engine, bindAndLoad);
    }
  };

  /**
   * Binds the sheet a load brought back without writing the loaded data into it: the engine already holds
   * the sheet as the grid left it, in the order `order` describes, and its formula text there is what the
   * user saw (see {@link Formulas#runWithEngineOrderHeld}). The order is taken over without being sent,
   * and the grid's order ends on it. An order that carries the engine sheet's content writes it first: the
   * engine sheet bound now is a new one, or one another sheet's data was loaded into meanwhile.
   *
   * @param {object} order The engine order the sheet was left in.
   */
  #adoptEngineSheet(order: FormulasEngineSheetOrder) {
    this.#sheetResyncPending = false;
    this.#syncedContent = null;

    if (order.content !== undefined) {
      this.engine!.setSheetContent(this.sheetId, order.content);
    }

    this.indexSyncer!.setupSyncEndpoint(this.engine!, this.sheetId);
    this.rowAxisSyncer!.adoptEngineOrder(order.rowOrder);
    this.columnAxisSyncer!.adoptEngineOrder(order.columnOrder);
    this.#recordSyncedLayout();
  }

  /**
   * Whether the plugin is bound to the engine sheet `order` describes.
   *
   * @param {object} order The engine order.
   * @returns {boolean}
   */
  #isBoundTo(order: FormulasEngineSheetOrder): boolean {
    return order.engine === this.engine && order.sheetId === this.sheetId;
  }

  /**
   * Tells whether the grid's row order is a sort's (ColumnSorting or MultiColumnSorting). A sort reaches the
   * engine as one order, so a reload sends it as one again, also from a syncer that has no record of it.
   *
   * @returns {boolean}
   */
  #isRowOrderSorted(): boolean {
    const columnSorting = this.hot.getPlugin('columnSorting');
    const multiColumnSorting = this.hot.getPlugin('multiColumnSorting');

    return (columnSorting?.enabled === true && columnSorting.isSorted())
      || (multiColumnSorting?.enabled === true && multiColumnSorting.isSorted());
  }

  /**
   * Fills the sheet with the source data, renders the grids that read it, and returns the cells
   * whose values changed. When the data does not fit the engine, the sheet is emptied instead.
   *
   * @param {Array<Array<*>>} [readSourceData] The source data read ahead, when the engine is about to be
   *   suspended and cannot answer the read.
   * @returns {Array} The engine's changes.
   */
  #loadSourceDataIntoSheet(readSourceData?: unknown[][]): unknown[] {
    // Whatever this writes supersedes a resync still owed from a settings update it interrupted.
    this.#sheetResyncPending = false;

    const sourceDataArray = readSourceData ?? this.#getProcessedSourceDataArray();

    // The guard only range-checks the sheet against the array dimensions, so escaping can run
    // after it – and then it is skipped altogether when the content is not replaced. Observable
    // side effect of that ordering: on the rejected branch the user's `cells` function and the
    // `beforeGetCellMeta`/`afterGetCellMeta` listeners are no longer invoked once per cell, where
    // the pre-guard scan used to invoke them before discarding the result.
    if (this.engine!.isItPossibleToReplaceSheetContent(this.sheetId, sourceDataArray)) {
      return this.#writeSheet(sourceDataArray);
    }

    return this.#clearRejectedSheet();
  }

  /**
   * `modifyData` hook callback.
   *
   * @param {number} visualRow Visual row index.
   * @param {number} visualColumn Visual column index.
   * @param {object} valueHolder Object which contains original value which can be modified by overwriting `.value`
   *   property.
   * @param {string} ioMode String which indicates for what operation hook is fired (`get` or `set`).
   */
  #onModifyData = (visualRow: number, visualColumn: number, valueHolder: Record<string, unknown>, ioMode: string) => {
    if (ioMode !== 'get' || this.#internalOperationPending || !this.#hasOwnSheet()) {
      return;
    }

    if (visualRow === null || visualColumn === null) {
      return;
    }

    // A read made while a settings update is still in flight - by a plugin's `onUpdateSettings`
    // or a default-order `afterUpdateSettings` listener - gets the sheet the update produced,
    // not the one it started from. Reached after the `#internalOperationPending` check above, so
    // the scan's own re-entrant reads never drain it again.
    if (this.#sheetResyncPending) {
      this.#resyncSheet();
    }

    // One translation serves the type lookup, the value read, and the meta read; this hook runs once
    // per cell of every bulk read (AutoColumnSize sampling, the filters column scan), so the per-cell
    // work is what is paid.
    const engineCell = this.#toEngineAddress(visualRow, visualColumn);

    // Out of bounds reads as `EMPTY`, like `getCellType()` reports it.
    if (engineCell === null) {
      valueHolder.value = unescapeFormulaExpression(valueHolder.value);

      return;
    }

    const { address, physicalRow, physicalColumn } = engineCell;
    const cellType = this.engine!.getCellType(address);

    if (cellType === 'VALUE' || cellType === 'EMPTY') {
      valueHolder.value = unescapeFormulaExpression(valueHolder.value);

      return;
    }

    // Past the type check, so a plain cell never ends a held recalculation.
    this.#flushEvaluation();

    let cellValue = this.engine!.getCellValue(address); // Date as an integer (Excel like date).

    // The uncached read matters here: this hook fires inside bulk data reads (for example, the
    // filters column scan), so an eager read would materialize one meta per scanned cell.
    const cellMeta = this.hot._getMetaManager().getCellMetaUncached(
      physicalRow, physicalColumn, { visualRow, visualColumn },
    );

    if (cellMeta.type === 'date' && isNumeric(cellValue)) {
      cellValue = getDateFromExcelDate(cellValue);
    } else if (cellMeta.type === 'time' && isNumeric(cellValue)) {
      cellValue = getTimeFromHfTimeFraction(cellValue as number);
    }

    // If `cellValue` is an object it is expected to be an error
    valueHolder.value = hasValueProperty(cellValue) ? cellValue.value : cellValue;
  };

  /**
   * `afterRenderer` hook callback. Wraps the already rendered content of a `HYPERLINK` cell in an
   * anchor. The cell keeps its own renderer and its cell meta is left untouched, so disabling the
   * plugin or clearing the formula needs no cleanup.
   *
   * @param {HTMLTableCellElement} TD The rendered cell element.
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   */
  #onAfterRenderer = (TD: HTMLTableCellElement, row: number, column: number) => {
    if (!this.#hyperlinksEnabled || this.#internalOperationPending) {
      return;
    }

    // Walkontable recycles TD elements, and a renderer is free to leave its previous DOM in place.
    // Unwrapping this plugin's own anchor first keeps the pass idempotent and rebuilds the `href`
    // from the current formula instead of inheriting whatever the previous pass resolved.
    unwrapLinks(TD, `a.${HYPERLINK_CLASS_NAME}`);

    const hyperlinkKey = `${this.hot.toPhysicalRow(row)},${this.hot.toPhysicalColumn(column)}`;

    // While formulas are shown as raw text, the rendered content is the formula itself, not the
    // HYPERLINK's label, so wrapping it in a link would misrepresent what is on screen -
    // `#onPaintFormulaText` (registered to run after this hook) overwrites it either way.
    if (this.#showFormulasFlag) {
      this.#hyperlinkCells.delete(hyperlinkKey);

      return;
    }

    const href = this.#getHyperlinkHref(row, column);

    if (href === null) {
      this.#hyperlinkCells.delete(hyperlinkKey);

      return;
    }

    // A HYPERLINK cell is the formula's link and nothing else: any other grid-made anchor in it (an
    // `autoLink` anchor around a URL-shaped label, for instance) is unwrapped so the two features
    // converge on one anchor regardless of which `afterRenderer` callback ran first. The scheme span
    // AutoLink hid must be unwrapped first, while it is still inside its own anchor - unwrapping the
    // anchor alone would carry it, still hidden, into the HYPERLINK anchor built below, so a HYPERLINK
    // label renders exactly as the formula returns it whichever `afterRenderer` ran first.
    unwrapLinks(TD, `a.${LINK_CLASS_NAME} .${LINK_SCHEME_CLASS_NAME}`);
    unwrapLinks(TD, `a.${LINK_CLASS_NAME}`);

    this.#hyperlinkCells.add(hyperlinkKey);

    const link = createLinkElement(this.hot.rootDocument, {
      href,
      target: this.#hyperlinkTarget,
      classNames: [HYPERLINK_CLASS_NAME],
    });

    // Wraps the cell's content root, not `TD` itself: an exact-height row keeps its content inside
    // the engine's `.htCellClip` wrapper, and appending the anchor to `TD` directly would rebuild
    // that wrapper on every render pass. The nodes are moved, never re-serialized, so a label
    // containing markup stays text.
    wrapCellContent(TD, link);
  };

  /**
   * `afterRenderer` hook callback, registered with a positive `orderIndex` so it always runs after
   * every default-order `afterRenderer` listener - this plugin's own `#onAfterRenderer` above, and
   * AutoLink's, which reads the TD's live text and would otherwise linkify a URL substring inside
   * the painted formula text (the URL argument of a `=HYPERLINK(url, label)` formula, for instance),
   * since it detects URLs in whatever the cell currently displays, not in the hook's `value`
   * argument. Running last makes this the final write for the cell regardless of which plugin
   * enabled first, or whether AutoLink is even registered at all.
   *
   * An `ARRAY` cell (a non-origin spill cell) has no formula text of its own - `getCellSerialized()`
   * would return its raw, unformatted value for it, skipping the date/time conversion and error
   * unwrapping the normal value path applies - so it is left showing its calculated value, same as
   * `VALUE`/`EMPTY`.
   *
   * @param {HTMLTableCellElement} TD The rendered cell element.
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   */
  #onPaintFormulaText = (TD: HTMLTableCellElement, row: number, column: number) => {
    if (this.#internalOperationPending || !this.#showFormulasFlag) {
      return;
    }

    const cellType = this.getCellType(row, column);

    if (cellType !== 'FORMULA' && cellType !== 'ARRAYFORMULA') {
      return;
    }

    const address = {
      row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(row),
      col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(column),
      sheet: this.sheetId,
    };

    this.#flushEvaluation();
    fastInnerText(TD, String(this.#readableFormula(this.engine!.getCellSerialized(address))));
  };

  /**
   * `beforeCopy`/`beforeCut` hook callback. While formulas are shown, rewrites each copied/cut
   * FORMULA/ARRAYFORMULA cell's value to its formula text, matching what is on screen - mutating
   * `data` in place, which is how both hooks let a listener reshape what actually reaches the
   * clipboard (`CopyPaste` copies from this same array afterward). This never touches the data
   * model, so `getDataAtCell()` and everything reading through it (sorting, filtering, validation)
   * are unaffected.
   *
   * @param {Array[]} data An array of arrays with the copied/cut data.
   * @param {RangeType[]} coords The ranges being copied/cut.
   */
  #onBeforeCopyOrCut = (data: CellValue[][], coords: RangeType[]) => {
    if (!this.#showFormulasFlag) {
      return;
    }

    const { rows, columns } = copiedRowsAndColumns(coords);

    rows.forEach((row, rowIndex) => {
      // A copied column header is a negative-indexed row (`CopyPaste#getRangedData`), never a
      // formula cell.
      if (row < 0) {
        return;
      }

      columns.forEach((column, columnIndex) => {
        const cellType = this.getCellType(row, column);

        if (cellType !== 'FORMULA' && cellType !== 'ARRAYFORMULA') {
          return;
        }

        const address = {
          row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(row),
          col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(column),
          sheet: this.sheetId,
        };

        this.#flushEvaluation();
        data[rowIndex][columnIndex] = this.#readableFormula(this.engine!.getCellSerialized(address));
      });
    });
  };

  /**
   * `modifySourceData` hook callback.
   *
   * @param {number} row Physical row index.
   * @param {number|string} columnOrProp Physical column index or prop.
   * @param {object} valueHolder Object which contains original value which can be modified by overwriting `.value`
   *   property.
   * @param {string} ioMode String which indicates for what operation hook is fired (`get` or `set`).
   */
  #onModifySourceData = (
    row: number, columnOrProp: number | string, valueHolder: Record<string, unknown>, ioMode: string
  ) => {
    if (
      ioMode !== 'get' ||
      this.#internalOperationPending ||
      // While the write-back runs, reads must report what is really stored. Core reads the previous
      // value to build the `afterSetSourceDataAtCell` payload, and projecting the engine's formula
      // onto it would hand listeners an old value equal to the new one.
      this.#sourceDataSyncPending ||
      // Same reason, for the read that feeds the engine: see `#getProcessedSourceDataArray`.
      this.#sourceDataProjectionSuspended ||
      !this.#hasOwnSheet()
    ) {
      return;
    }

    const visualRow = this.hot.toVisualRow(row);
    const visualColumn = this.hot.propToCol(columnOrProp);

    if (visualRow === null || visualColumn === null) {
      return;
    }

    // Same drain as in `#onModifyData`: the projection has to describe the sheet the in-flight
    // settings update produced. Reached after the `#sourceDataProjectionSuspended` check above,
    // so the scan's own source read never drains it again.
    if (this.#sheetResyncPending) {
      this.#resyncSheet();
    }

    // One translation for the type lookup, the dimensions check, and the serialized read.
    const engineCell = this.#toEngineAddress(visualRow, visualColumn);

    if (engineCell === null) {
      return;
    }

    const { address } = engineCell;
    const cellType = this.engine!.getCellType(address);

    if (cellType === 'VALUE' || cellType === 'EMPTY') {
      return;
    }

    const dimensions = this.engine!.getSheetDimensions(address.sheet);

    // Don't actually change the source data if HyperFormula is not
    // initialized yet. This is done to allow the `afterLoadData` hook to
    // load the existing source data with `Handsontable#getSourceDataArray`
    // properly.
    if (dimensions.width === 0 && dimensions.height === 0) {
      return;
    }

    // The formula text needs no recalculation, so it is read without ending a held one: the Core reads the
    // old value of every cell it writes here. `getCellSerialized()` answers the same text for a formula.
    const formula = this.engine!.getCellFormula(address);

    if (formula !== undefined) {
      valueHolder.value = this.#readableFormula(formula);

      return;
    }

    // A cell with no formula of its own (a value an array formula spilled) serializes to its value.
    this.#flushEvaluation();

    valueHolder.value = this.#readableFormula(this.engine!.getCellSerialized(address));
  };

  /**
   * `onAfterSetDataAtCell` hook callback.
   *
   * @param {Array[]} changes An array of changes in format [[row, prop, oldValue, value], ...].
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   */
  #onAfterSetDataAtCell = (changes: CellChange[], source: string) => {
    if (isBlockedSource(source)) {
      return;
    }

    if (isRestoreSource(source)) {
      changes.forEach(([visualRow, prop, oldValue, newValue]) => {
        this.#restoredWrites.push([this.hot.toPhysicalRow(visualRow) ?? visualRow, prop, oldValue, newValue]);
      });

      return;
    }

    // Skip HF re-sync when we are writing back to HOT after a moveCells HF operation.
    if (this.#moveCellsSyncPending) {
      return;
    }

    // Skip engine sync when there are no changes (e.g. populateFromArray on readOnly cells).
    // Otherwise engine.batch() would push an empty undo step and undo would revert the wrong action (#dev-2136).
    if (!changes?.length) {
      return;
    }

    const { immediateChanges, deferredChanges, rejectableChanges } = this.#splitChangesByValidation(changes);
    const { dependentCells, changedCells, writtenCells } = immediateChanges.length > 0
      ? this.#writeChangesToEngine(immediateChanges)
      : { dependentCells: [], changedCells: [] as unknown[], writtenCells: [] };

    // The Core validates the deferred cells as changes of the set, so the dependent validation skips them:
    // read from the engine, they would be validated again by the formula they are about to replace.
    rejectableChanges.forEach(({ visualRow, visualColumn }) => {
      changedCells.push({ address: this.#toEngineCellAddress(visualRow, visualColumn) });
    });

    // One walk of the engine's dependency graph from the deferred cells serves both splits below.
    const isWalkNeeded = rejectableChanges.length > 0 && (dependentCells.length > 0 || immediateChanges.length > 0);
    const reachedFromDeferred = isWalkNeeded
      ? this.#collectDependentKeys(rejectableChanges
        .map(({ visualRow, visualColumn }) => this.#toEngineCellAddress(visualRow, visualColumn)))
      : new Set<string>();
    const { earlyDependents, heldDependents } = this.#splitDependentsOfDeferred(dependentCells, reachedFromDeferred);
    const readersOfDeferred = this.#findReadersOfDeferred(immediateChanges, reachedFromDeferred);

    this.#changesAwaitingApply.set(changes, {
      writeCount: this.#sheetWriteCount,
      refusedWriteCount: this.#refusedSheetWriteCount,
      foreignLoadCount: this.#foreignLoadCount,
      sheetId: this.sheetId,
      deferredChanges,
      hasRejectableChange: rejectableChanges.length > 0,
      heldDependents,
      rejectableChanges: rejectableChanges.map(({ change }) => change),
      readersOfDeferred: [],
      writtenCells,
    });

    // The probe can end a `batchEvaluation` hold, so a held write is recorded before it: the recalculation
    // the probe causes then names the written cells, and the release validates their dependents.
    const isWriteHeld = recordHeldWrite(this.engine, changedCells);

    this.#changesAwaitingApply.get(changes)!.readersOfDeferred =
      this.#probeValidationValues(rejectableChanges, source, readersOfDeferred);

    if (!isWriteHeld) {
      this.validateDependentCells(earlyDependents, changedCells);
    }
  };

  /**
   * Splits a change set into the changes `afterSetDataAtCell` writes into the engine at once and the
   * ones left to `beforeChangeRender`. A change the Core can reject waits: written now, the engine and
   * every formula that reads the cell showed the rejected value while the validator worked, and kept it
   * after a rejection. The Core rejects a change only when the cell has a validator (`getCellValidator()`
   * of the cell meta) AND `allowInvalid` is `false` (`queueValidators()` drops a change whose validator
   * answered `false` under that condition), so that is the test here too. A validated cell that accepts
   * invalid values (`allowInvalid` defaults to `true`: a `numeric`, `date` or `dropdown` column) is written
   * at once, as before. A change past the last row or column waits too, because the Core creates its row
   * or column only when it applies the set. A change whose property names no column has no engine address
   * and is left out.
   *
   * @param {Array[]} changes An array of changes in format [[row, prop, oldValue, value], ...].
   * @returns {{ immediateChanges: Array[], deferredChanges: Set<Array>, rejectableChanges: object[] }}
   */
  #splitChangesByValidation(changes: CellChange[]) {
    const immediateChanges: CellChange[] = [];
    const deferredChanges = new Set<CellChange>();
    const rejectableChanges: RejectableChange[] = [];

    changes.forEach((change) => {
      const [visualRow, prop] = change;

      if (typeof prop !== 'string' && typeof prop !== 'number') {
        return;
      }

      // This hook runs before the change is applied, so a write past the last column on array data
      // addresses a column that does not exist yet. Its index is kept, as in `dataChange.ts`.
      const visualColumn = this.hot.propToCol(prop) ?? (typeof prop === 'number' ? prop : null);

      if (visualColumn === null) {
        return;
      }

      const physicalRow = this.hot.toPhysicalRow(visualRow);
      const physicalColumn = this.hot.toPhysicalColumn(visualColumn);

      if (physicalRow === null || physicalColumn === null) {
        deferredChanges.add(change);

      } else if (this.#canCoreRejectChange(visualRow, visualColumn)) {
        deferredChanges.add(change);
        rejectableChanges.push({ change, visualRow, visualColumn, physicalRow, physicalColumn });

      } else {
        immediateChanges.push(change);
      }
    });

    return { immediateChanges, deferredChanges, rejectableChanges };
  }

  /**
   * Splits the cells the early write recalculated into the ones validated now and the ones a deferred
   * change of the set also recalculates (directly or through other formulas, `getCellDependents()` walked
   * from the deferred cells). Those hold a value computed from the deferred cell's old content until the
   * apply, so validating them now ran their validator and `afterValidate` for a value the cell never ends
   * with, and an out-of-order answer of that stale validation overwrote the mark of the right one.
   * `#onBeforeChangeRender` validates them with the final values.
   *
   * @param {object[]} dependentCells The cells the early write recalculated.
   * @param {Set<string>} reached The keys of the cells the deferred changes of the set recalculate
   *   (`#collectDependentKeys()`).
   * @returns {{ earlyDependents: object[], heldDependents: object[] }}
   */
  #splitDependentsOfDeferred(dependentCells: unknown[], reached: Set<string>) {
    if (reached.size === 0 || dependentCells.length === 0) {
      return { earlyDependents: dependentCells, heldDependents: [] };
    }

    const earlyDependents: unknown[] = [];
    const heldDependents: unknown[] = [];

    dependentCells.forEach((change) => {
      const address = isHFCellChange(change) ? change.address : undefined;

      (address && reached.has(toCellKey(address)) ? heldDependents : earlyDependents).push(change);
    });

    return { earlyDependents, heldDependents };
  }

  /**
   * Finds the changes of the set written at once (`afterSetDataAtCell`) whose cell reads a deferred cell
   * of the same set, directly or through other formulas: a formula the early write put into the engine
   * that the deferred cell's new value recalculates. The engine computed it from the deferred cell's old
   * content, so the Core validated it by a value it never ends with (`#VALUE!` read from an old text),
   * marked it invalid for the whole wait, and the apply validated it a second time outside the edit's
   * undo step. The validation probe reads its result with the deferred cells' new values instead
   * (`#probeValidationValues()`). A cell the set changes more than once is left out, and so is a cell
   * without a validator: the probe result is for the Core's validation of the change.
   *
   * @param {Array[]} immediateChanges The changes written at once.
   * @param {Set<string>} reached The keys of the cells the deferred changes of the set recalculate.
   * @returns {object[]} The changes with their coordinates and engine address.
   */
  #findReadersOfDeferred(immediateChanges: CellChange[], reached: Set<string>) {
    const readers = new Map<string, RejectableChange & { address: FormulasCellAddress }>();
    const changedKeys = new Set<string>();

    if (reached.size === 0) {
      return [];
    }

    immediateChanges.forEach((change) => {
      const [visualRow, prop] = change;
      const visualColumn = this.hot.propToCol(prop as string | number);

      if (visualColumn === null) {
        return;
      }

      const physicalRow = this.hot.toPhysicalRow(visualRow);
      const physicalColumn = this.hot.toPhysicalColumn(visualColumn);

      if (physicalRow === null || physicalColumn === null) {
        return;
      }

      const address = this.#toEngineCellAddress(visualRow, visualColumn);
      const key = toCellKey(address);

      // A cell the set changes more than once is not a reader: the Core validates each change, and
      // `#onBeforeValidate` hands an entry to a change of the cell whose value does not match it, so the
      // earlier change took the last one's result. It stays a held dependent, validated at the apply.
      if (changedKeys.has(key)) {
        readers.delete(key);

        return;
      }

      changedKeys.add(key);

      if (reached.has(key) && this.hot.getCellValidator(this.hot.getCellMetaTransient(visualRow, visualColumn))) {
        readers.set(key, { change, visualRow, visualColumn, physicalRow, physicalColumn, address });
      }
    });

    return [...readers.values()];
  }

  /**
   * Collects the keys (`toCellKey()`) of every cell that depends on the given cells, directly or through
   * other formulas and ranges, from the engine's dependency graph.
   *
   * @param {object[]} addresses The engine addresses to start from.
   * @returns {Set<string>}
   */
  #collectDependentKeys(addresses: FormulasCellAddress[]) {
    const engine = this.engine!;
    const reached = new Set<string>();
    const visitedRanges = new Set<string>();
    const queue: (FormulasCellAddress | FormulasCellRange)[] = [...addresses];

    while (queue.length > 0) {
      engine.getCellDependents(queue.pop()!).forEach((dependent) => {
        const key = 'start' in dependent
          ? `${toCellKey(dependent.start)}:${toCellKey(dependent.end)}`
          : toCellKey(dependent);
        const visited = 'start' in dependent ? visitedRanges : reached;

        if (!visited.has(key)) {
          visited.add(key);
          queue.push(dependent);
        }
      });
    }

    return reached;
  }

  /**
   * Answers whether the Core can reject a change to the cell: it has a validator and does not accept
   * invalid values. The condition `queueValidators()` drops a change under, read from the same cell meta.
   *
   * @param {number} visualRow The visual row index.
   * @param {number} visualColumn The visual column index.
   * @returns {boolean}
   */
  #canCoreRejectChange(visualRow: number, visualColumn: number) {
    const cellMeta = this.hot.getCellMetaTransient(visualRow, visualColumn);

    return cellMeta.allowInvalid === false && !!this.hot.getCellValidator(cellMeta);
  }

  /**
   * Builds the engine address of a grid cell on the bound sheet.
   *
   * @param {number} visualRow The visual row index.
   * @param {number} visualColumn The visual column index.
   * @returns {object}
   */
  #toEngineCellAddress(visualRow: number, visualColumn: number) {
    return {
      row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow),
      col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn),
      sheet: this.sheetId as number,
    };
  }

  /**
   * Reads, for each change of a set the Core can reject, the value `beforeValidate` hands its validator.
   * The plugin validates a formula by its result, so such a formula has to be calculated while the engine
   * does not hold it yet. The set's rejectable changes are written into the engine in one batch, the
   * results of its formulas are read, and the batch is taken back with `engine.undo()` and
   * `clearRedoStack()`, all in this task, so nothing paints the probe and the engine ends as it was.
   * Writing all of them, plain values included, keeps what the validator saw when the plugin wrote every
   * change before validation: a formula that reads another deferred cell of the set reads its new value,
   * and one that reads itself through a dependent is a cycle. A set without a formula skips the round
   * trip. Its changes still get an entry, so a value written over a formula cell is validated as the
   * value, not as the result the engine still holds. The other grids on the engine paint once, when the
   * write scope ends, and this grid fires no `afterFormulasValuesUpdate` for the probe's write; the
   * volatile values the round trip changed are announced to every grid (`#announceProbeChangesKept()`).
   *
   * An engine that keeps fewer than two undo entries (`undoLimit` below 2) cannot take a two-batch probe back
   * without risking an array formula's spill, so each formula is calculated on its own there (`#calculateDetached()`).
   *
   * A formula of the set written at once that reads a deferred cell of the set (`#findReadersOfDeferred()`)
   * gets an entry too, so its validator sees the result the cell holds once the deferred cells are written:
   * the probe runs for it even without a deferred formula, writes the deferred cells it reads, and reads its
   * result. Without a probe (an engine keeping fewer than two undo entries, evaluation suspended) it has no
   * entry and is validated by what the engine holds, from the deferred cells' old content.
   *
   * @param {object[]} rejectableChanges The changes the Core can reject.
   * @param {string} [source] The change source, which the Core hands `beforeValidate`.
   * @param {object[]} [readersOfDeferred] The changes written at once that read a deferred cell of the set.
   * @returns {object[]} The readers that got the probe's result: their address and answer record.
   */
  #probeValidationValues(
    rejectableChanges: RejectableChange[],
    source: string | undefined,
    readersOfDeferred: (RejectableChange & { address: FormulasCellAddress })[] = [],
  ): ChangeSetAwaitingApply['readersOfDeferred'] {
    if (rejectableChanges.length === 0) {
      return [];
    }

    if (this.#validationValues.size === 0) {
      this.hot._registerMicrotask(() => this.#validationValues.clear());
    }

    // A set the probe skips (no formula, no reader) needs no engine-bound value: building one runs the
    // column's `valueGetter` and reads the cell meta for the escape, which the apply does again. Only an
    // object can turn into a formula through the `valueGetter`, and the escape never makes one.
    const needsEngineValues = readersOfDeferred.length > 0 ||
      rejectableChanges.some(({ change: [, , , value] }) => isFormula(value) || (isObject(value) && value !== null));
    const writes: ProbeWrite[] = rejectableChanges.map(rejectable => ({
      rejectable,
      value: needsEngineValues ? this.#toEngineBoundChangeValue(rejectable) : rejectable.change[3],
      address: this.#toEngineCellAddress(rejectable.visualRow, rejectable.visualColumn),
      entry: { source, changeValue: rejectable.change[3], hasResult: false, result: undefined } as ValidationValue,
    }));
    const lastWriteByCell = new Map<string, ProbeWrite>();

    writes.forEach((write) => {
      lastWriteByCell.set(this.#validationValueKey(write.rejectable.visualRow, write.rejectable.visualColumn), write);
    });

    writes.forEach((write) => {
      const key = this.#validationValueKey(write.rejectable.visualRow, write.rejectable.visualColumn);
      const lastWrite = lastWriteByCell.get(key)!;
      const entries = this.#validationValues.get(key) ?? [];

      // An earlier change that writes the same value as the cell's last change of the set reads what the
      // last one reads (the probe's result), not a value calculated on its own.
      if (lastWrite !== write && Object.is(lastWrite.entry.changeValue, write.entry.changeValue)) {
        write.entry = lastWrite.entry;
      }

      entries.push(write.entry);
      this.#validationValues.set(key, entries);
    });

    // The probe reads the engine, so a recalculation held by `batchEvaluation` ends first; a set with nothing
    // to probe keeps it.
    if (readersOfDeferred.length > 0 || writes.some(({ value }) => isFormula(value))) {
      this.#flushEvaluation();
    }

    const engine = this.engine;
    const canProbe = !!engine && this.sheetId !== null && !engine.isEvaluationSuspended();
    const { undoLimit } = canProbe ? engine.getConfig() : { undoLimit: undefined };
    // The detached calculation below cannot read the deferred cells' new values, so a reader gets an entry
    // only with a probe.
    const readers: ProbeReader[] = canProbe && !(typeof undoLimit === 'number' && undoLimit < 2)
      ? readersOfDeferred.map(({ change, visualRow, visualColumn, address }) => ({
        visualRow,
        visualColumn,
        address,
        entry: { source, changeValue: change[3], hasResult: false, result: undefined },
      }))
      : [];

    readers.forEach(({ visualRow, visualColumn, entry }) => {
      const key = this.#validationValueKey(visualRow, visualColumn);

      this.#validationValues.set(key, [...(this.#validationValues.get(key) ?? []), entry]);
    });

    if (!canProbe || (readers.length === 0 && !writes.some(({ value }) => isFormula(value)))) {
      return [];
    }

    // A probe pushes up to two batches and undoes each. An engine that keeps fewer undo entries would drop
    // the first one, and the second `undo()` would throw with the probe still in the engine.
    if (typeof undoLimit === 'number' && undoLimit < 2) {
      writes.forEach(({ rejectable: { visualRow, visualColumn }, value, entry }) => {
        if (isFormula(value)) {
          entry.hasResult = true;
          entry.result = this.#calculateDetached(visualRow, visualColumn, value as string);
        }
      });

      return [];
    }

    // A cell the set writes twice holds its last value in the engine, as after the apply; an earlier formula
    // for it is calculated on its own.
    const lastWrites = [...lastWriteByCell.values()];
    // Sets, so a paste of thousands of formulas stays linear.
    const lastWriteSet = new Set(lastWrites);
    const lastEntries = new Set(lastWrites.map(lastWrite => lastWrite.entry));

    writes.forEach(({ rejectable: { visualRow, visualColumn }, value, entry }, index) => {
      if (isFormula(value) && !lastWriteSet.has(writes[index]) && !lastEntries.has(entry)) {
        entry.hasResult = true;
        entry.result = this.#calculateDetached(visualRow, visualColumn, value as string);
      }
    });

    const changesKept = withPluginEngineProbe(engine!, () => this.#writeOwnSheet(
      engine, () => this.#runProbe(lastWrites, readers),
    ));

    if (changesKept.length > 0) {
      // A write of its own, so every grid that reads the cells paints once when it ends, this one included:
      // the Core renders nothing for a set its validators reject.
      withPluginEngineWrite(engine, () => this.#trackOwnEngineWrite(
        () => this.#announceProbeChangesKept(changesKept), 'cells',
      ));
    }

    // A reader the probe read no result for is validated by the engine's value, as a cell of the set written at
    // once: its entry would hand the validator the formula text.
    return readers.flatMap(({ visualRow, visualColumn, address, entry }) => {
      if (!entry.hasResult) {
        const entries = this.#validationValues.get(this.#validationValueKey(visualRow, visualColumn)) ?? [];
        const index = entries.indexOf(entry);

        if (index !== -1) {
          entries.splice(index, 1);
        }

        return [];
      }

      entry.readerAnswer = {
        value: entry.result, source, answered: false, isSyncChecked: false, wasAnsweredAtCheck: false,
      };

      return [{ address, answer: entry.readerAnswer }];
    });
  }

  /**
   * Writes the probe (see `#probeValidationValues()`), reads the formula results into their entries, and
   * takes every batch it wrote back. The formulas go in first. A plain value of the set goes in, in a
   * second batch, only when one of those formulas reads its cell (`getCellPrecedents()`, a range
   * included): a formula of the set reads every other formula of the set from the first batch, so this
   * covers a chain through them, and a paste of many plain values with one formula writes one cell, not
   * the whole paste. A reader of the set (a formula written at once that reads a deferred cell) is in the
   * engine already, so it is not written; with one, every plain value of the set goes into the second batch,
   * and its result is read too. Without a deferred formula, the first batch is not written.
   *
   * The undo puts every cell back except a volatile formula (`RAND()`, `NOW()`), which the probe's write and
   * each undo recalculated. Every grid ignored those events, so the cells whose last change the undo made
   * and that the probe's cells do not reach are returned, for `#announceProbeChangesKept()`.
   *
   * @param {object[]} writes The probe writes: the change, its engine-bound value, address and entry.
   * @param {object[]} [readers] The cells written at once whose result the probe reads.
   * @returns {object[]} The engine changes the undo made that the probe did not take back.
   */
  #runProbe(writes: ProbeWrite[], readers: ProbeReader[] = []): unknown[] {
    const engine = this.engine!;
    const formulaWrites = writes.filter(({ value }) => isFormula(value));
    const writtenAddresses: FormulasCellAddress[] = [];
    const undoneChanges = new Map<string, unknown>();
    let batches = 0;

    try {
      if (formulaWrites.length > 0) {
        batches += 1;
        this.#writeProbeBatch(formulaWrites);
        writtenAddresses.push(...formulaWrites.map(({ address }) => address));
      }

      const precedents = formulaWrites.flatMap(({ address }) => engine.getCellPrecedents(address));
      // A named expression is reported with sheet -1 and hides the cells it reads, so any plain value of
      // the set may be one of them.
      const readsNamedExpression = precedents
        .some(precedent => ('start' in precedent ? precedent.start : precedent).sheet < 0);
      // A reader can read a deferred cell through a formula written at once that is not a reader itself (one
      // without a validator), so with a reader every plain value of the set goes in.
      const readValueWrites = writes.filter(({ value, address }) => !isFormula(value) &&
        (readsNamedExpression || readers.length > 0 ||
          precedents.some(precedent => isAddressInPrecedent(address, precedent))));

      if (readValueWrites.length > 0) {
        batches += 1;
        this.#writeProbeBatch(readValueWrites);
        writtenAddresses.push(...readValueWrites.map(({ address }) => address));
      }

      [...formulaWrites.map(({ rejectable, entry }) => ({ ...rejectable, entry })), ...readers]
        .forEach(({ visualRow, visualColumn, entry }) => {
          if (this.isFormulaCellType(visualRow, visualColumn)) {
            entry.hasResult = true;
            entry.result = this.#readValidationValue(visualRow, visualColumn);
          }
        });
    } finally {
      // An empty batch still pushes an undo entry, so this never takes back an earlier operation.
      for (let batch = 0; batch < batches; batch++) {
        const undone = engine.undo();

        (Array.isArray(undone) ? undone : []).forEach((change) => {
          const address = isHFCellChange(change) ? change.address : undefined;

          // A later undo's value of a cell replaces an earlier one's.
          if (address) {
            undoneChanges.delete(toCellKey(address));
            undoneChanges.set(toCellKey(address), change);
          }
        });
      }

      engine.clearRedoStack?.();
    }

    return this.#findChangesKeptByProbe(writtenAddresses, [...undoneChanges.values()]);
  }

  /**
   * Picks, from the changes the probe's undo made, the cells whose value the round trip did not put back:
   * neither a cell the probe wrote nor one that reads it, directly or through other formulas
   * (`#collectDependentKeys()`), so a volatile formula recalculated by the write and the undo. The walk runs
   * only when the undo changed a cell the probe did not write. **Known limit:** a volatile formula that
   * also reads a probed cell (`=RAND()+A1`) is taken for a dependent the undo put back, and is not
   * announced.
   *
   * @param {object[]} writtenAddresses The engine addresses the probe wrote.
   * @param {object[]} undoneChanges The undo's changes, one per cell.
   * @returns {object[]}
   */
  #findChangesKeptByProbe(writtenAddresses: FormulasCellAddress[], undoneChanges: unknown[]) {
    const written = new Set(writtenAddresses.map(address => toCellKey(address)));
    const others = undoneChanges.filter((change) => {
      const address = isHFCellChange(change) ? change.address : undefined;

      return address !== undefined && !written.has(toCellKey(address));
    });

    if (others.length === 0) {
      return [];
    }

    const reached = this.#collectDependentKeys(writtenAddresses);

    return others.filter(change => isHFCellChange(change) && !reached.has(toCellKey(change.address!)));
  }

  /**
   * Hands the changes the validation probe did not take back (`#runProbe()`) to every grid on the engine,
   * as an engine event would have: each one fires `afterFormulasValuesUpdate` and paints, once, when the
   * plugin write the caller runs it in ends. A host's own `valuesUpdated` listener heard the probe's events
   * already.
   *
   * @param {object[]} changes The changes.
   */
  #announceProbeChangesKept(changes: unknown[]) {
    if (!this.engine) {
      return;
    }

    getRegisteredHotInstances(this.engine).forEach((boundHot) => {
      const plugin = boundHot.getPlugin(PLUGIN_KEY as 'formulas') as unknown as Formulas | undefined;

      if (plugin instanceof Formulas && plugin.engine === this.engine) {
        plugin.#onEngineValuesUpdated(changes);
      }
    });
  }

  /**
   * Writes probe values into the engine in one batch, skipping a cell the engine cannot hold.
   *
   * @param {object[]} writes The probe writes.
   */
  #writeProbeBatch(writes: ProbeWrite[]) {
    const engine = this.engine!;

    engine.batch(() => {
      writes.forEach(({ address, value }) => {
        if (engine.isItPossibleToSetCellContents(address)) {
          engine.setCellContents(address, value);
        }
      });
    });
  }

  /**
   * Calculates a formula for its validator without writing it (`calculateFormula()`), for an engine that
   * keeps fewer than two undo entries (`undoLimit` below 2). The engine evaluates it on its own, as if it were in the first cell, so a cycle
   * through the cell itself, a reference to another deferred cell of the set, `ROW()` and a spill are not
   * what the cell would hold; a parse error reads as the formula text. An engine without the method hands
   * the formula text to the validator.
   *
   * @param {number} visualRow The visual row index.
   * @param {number} visualColumn The visual column index.
   * @param {string} formula The engine-bound formula.
   * @returns {*}
   */
  #calculateDetached(visualRow: number, visualColumn: number, formula: string) {
    const engine = this.engine!;

    if (typeof engine.calculateFormula !== 'function' || !engine.validateFormula(formula)) {
      return formula;
    }

    let result = engine.calculateFormula(formula, this.sheetId as number);

    if (Array.isArray(result)) {
      result = result[0]?.[0];
    }

    return this.#toValidationValue(visualRow, visualColumn, result);
  }

  /**
   * Builds the key of a cell in `#validationValues`.
   *
   * @param {number} visualRow The visual row index.
   * @param {number} visualColumn The visual column index.
   * @returns {string}
   */
  #validationValueKey(visualRow: number, visualColumn: number) {
    return `${visualRow}:${visualColumn}`;
  }

  /**
   * Turns a change into the value a write puts into the engine, the way `syncChangeWithEngine()` does:
   * the column's `valueGetter` resolves an object, and a text value is escaped
   * (`#escapeEngineBoundValue`).
   *
   * @param {object} validated The change with its coordinates.
   * @returns {*} The engine-bound value.
   */
  #toEngineBoundChangeValue({ change, visualRow, visualColumn, physicalRow, physicalColumn }: RejectableChange) {
    const value = this.#getValueGetterValue(physicalRow, physicalColumn, change[3]);

    if (typeof value !== 'string') {
      return value;
    }

    return this.#escapeEngineBoundValue(value, this.hot.getCellMetaTransient(visualRow, visualColumn));
  }

  /**
   * Writes a `setDataAtCell()` / `setDataAtRowProp()` change set into the engine, in one batch. The
   * caller passes only changes whose row and column exist; a change whose property names no column is
   * skipped.
   *
   * @param {Array[]} changes An array of changes in format [[row, prop, oldValue, value], ...].
   * @returns {{ dependentCells: unknown[], changedCells: unknown[], writtenCells: object[] }}
   */
  #writeChangesToEngine(changes: CellChange[]) {
    const changedCells: unknown[] = [];
    const writtenCells: WrittenCell[] = [];

    this.#markDataChanged();

    const engine = this.engine!;
    const dependentCells = this.#writeOwnSheet(engine, () => runEngineBatch(engine, () => {
      changes.forEach(([visualRow, prop, oldValue, newValue]) => {
        if (typeof prop !== 'string' && typeof prop !== 'number') {
          return;
        }

        const visualColumn = this.hot.propToCol(prop) ?? (typeof prop === 'number' ? prop : null);

        // A property that names no column has no engine address to sync.
        if (visualColumn === null) {
          return;
        }

        const physicalRow = this.hot.toPhysicalRow(visualRow);
        const physicalColumn = this.hot.toPhysicalColumn(visualColumn);

        // A row or column the Core could not create (`maxRows`, `allowInsertRow: false`).
        if (physicalRow === null || physicalColumn === null) {
          return;
        }

        const address = {
          row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow),
          col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn),
          sheet: this.sheetId,
        };

        this.syncChangeWithEngine(
          visualRow, visualColumn, this.#getValueGetterValue(physicalRow, physicalColumn, newValue),
        );
        writtenCells.push({
          address, physicalRow, physicalColumn, visualRow, visualColumn, oldValue, writtenContent: undefined,
        });
        changedCells.push({ address });
      });
    }), 'cells');

    const readWrittenContent = () => writtenCells.forEach((cell) => {
      cell.writtenContent = this.#readEngineContent(cell.address);
    });

    // A held write is read once the engine resumes: reading it now would recalculate once per write. A later
    // write to the same cell in the same hold makes the content the later one.
    if (!runAfterEvaluationFlush(engine, readWrittenContent)) {
      readWrittenContent();
    }

    return { dependentCells, changedCells, writtenCells };
  }

  /**
   * `beforeChangeRender` hook callback.
   *
   * Writes what `afterSetDataAtCell` left of a change set into the engine, now that the Core applies it:
   * the changes the Core could reject that the validators accepted (the Core spliced the rejected
   * ones out of this very array, so they never reach the engine), and the changes past the last row or
   * column, whose rows and columns the Core has just created. `beforeChangeRender` is the first hook
   * `applyChanges` runs on its own after it writes the set to the data (the row and column hooks of
   * `alter()`, such as `beforeCreateRow`/`afterCreateRow`, can fire before it, from `writeChangesToData`
   * and `adjustRowsAndCols`, when a change lies out of bounds), and it runs before the render that
   * follows, so the grid paints the values the engine computes from the write.
   *
   * The whole set is written instead when a full sheet write from the source data replaced the sheet, or
   * the binding moved to another sheet, between `afterSetDataAtCell` and now: an `updateSettings()` in
   * the same task as the change rebuilds the sheet from source data that does not hold the changes
   * written early yet. A sheet switch loads data, so the Core drops a set that waited across one and this
   * listener never sees it (`#onChangesDropped` handles it). The sheet id is still compared, so a set that
   * does reach the render after the binding moved to another sheet is written into the current one, where
   * the grid holds it, and the sheet it left gets its early-written cells back.
   *
   * Each write is one batch - one engine undo entry - and the dependents it recalculated are validated.
   *
   * @param {Array[]|null} changes An array of changes in format [[row, prop, oldValue, value], ...].
   */
  #onBeforeChangeRender = (changes: CellChange[] | null) => {
    const awaitingApply = changes ? this.#changesAwaitingApply.get(changes) : undefined;

    if (!changes || !awaitingApply) {
      return;
    }

    this.#changesAwaitingApply.delete(changes);

    const engine = this.engine;
    const isSheetReplaced = awaitingApply.writeCount !== this.#sheetWriteCount ||
      awaitingApply.sheetId !== this.sheetId;
    const changesToWrite = isSheetReplaced
      ? changes
      : changes.filter(change => awaitingApply.deferredChanges.has(change));

    if (!engine || this.#isSheetEmptiedSince(awaitingApply)) {
      return;
    }

    // One write, so a grid on another sheet that reads a restored cell and a written one paints once.
    const { dependentCells, changedCells } = changesToWrite.length === 0
      ? { dependentCells: [], changedCells: [] }
      : this.#writeOwnSheet(engine, () => {
        if (awaitingApply.sheetId !== null && awaitingApply.sheetId !== this.sheetId) {
          this.#restoreSwitchedAwaySheet(awaitingApply.writtenCells, awaitingApply.sheetId);
        }

        return this.#writeChangesToEngine(changesToWrite);
      }, 'cells');
    // The dependents the early write left to the apply (see `#splitDependentsOfDeferred()`), also when every
    // deferred change was rejected and nothing is written here.
    const dependentsToValidate = uniqueCellChanges([...dependentCells, ...awaitingApply.heldDependents]);
    const { readersOfDeferred } = awaitingApply;
    const readerKeys = new Set(readersOfDeferred.map(({ address }) => toCellKey(address)));
    const isReader = (change: unknown) => isHFCellChange(change) && !!change.address &&
      readerKeys.has(toCellKey(change.address));

    if (readerKeys.size === 0) {
      this.#validateChangedDependents(awaitingApply, dependentsToValidate, changedCells);

      return;
    }

    // The Core validated the readers of the deferred cells by the probe's result, which is what they hold
    // now when every deferred change was accepted, so they are not validated again. After a rejection they
    // hold a value computed from the old content, so they are validated again. A reader whose validator
    // answered in its own call is validated inside the edit's undo step, so what its validator or
    // `afterValidate` writes is undone with the edit. Any other one is validated outside every step, like a
    // dependent: inside, its validator would hold the step and an undo right after `afterChange` was lost.
    const isAnyRejected = awaitingApply.rejectableChanges.some(change => !changes.includes(change));
    const otherChangedCells = changedCells.filter(change => !isReader(change));

    this.#validateChangedDependents(
      awaitingApply,
      dependentsToValidate.filter(change => !isReader(change)),
      [...changedCells, ...readersOfDeferred],
    );

    if (isAnyRejected) {
      const isSync = ({ answer }: { answer: ReaderAnswer }) => answer.answered &&
        (!answer.isSyncChecked || answer.wasAnsweredAtCheck);

      this.validateDependentCells(readersOfDeferred.filter(isSync), otherChangedCells);
      this.#validateDependentCellsUnrecorded(readersOfDeferred.filter(reader => !isSync(reader)), otherChangedCells);
    }
  };

  /**
   * Validates the dependents an apply recalculated: outside every undo step when the set held a change the
   * Core can reject (`#validateDependentCellsUnrecorded()`), inside the edit's step otherwise.
   *
   * @param {object} awaitingApply The record of the change set.
   * @param {object[]} dependentCells The cells to validate.
   * @param {object[]} changedCells The cells the Core validates as changes of the set.
   */
  #validateChangedDependents(
    awaitingApply: ChangeSetAwaitingApply, dependentCells: unknown[], changedCells: unknown[],
  ) {
    // A held apply (`batchEvaluation`) reports no dependents: the release validates them, once, against the
    // recalculated values. The dependents the early write left to the apply are validated now.
    recordHeldWrite(this.engine, changedCells);

    if (awaitingApply.hasRejectableChange) {
      this.#validateDependentCellsUnrecorded(dependentCells, changedCells);
    } else {
      this.validateDependentCells(dependentCells, changedCells);
    }
  }

  /**
   * Answers whether the engine refused a full write of the sheet while the change set waited, with no
   * full write since: the sheet was emptied (`#clearRejectedSheet`), and the set's cells are not written
   * into it.
   *
   * @param {object} awaitingApply The record of the change set.
   * @returns {boolean}
   */
  #isSheetEmptiedSince(awaitingApply: ChangeSetAwaitingApply) {
    return awaitingApply.refusedWriteCount !== this.#refusedSheetWriteCount &&
      this.#sheetWriteCountAtRefusal === this.#sheetWriteCount;
  }

  /**
   * Called by the Core for a change set it dropped: the set waited for its validators while
   * `loadData()` replaced the data, so it is never applied. `afterSetDataAtCell` already wrote it into
   * the sheet the grid showed then, so when the grid now shows another sheet, that sheet is put back
   * to the values the set replaced. Without this, the switched-away sheet kept a value its grid data
   * never received, and showed it on a switch back.
   *
   * While the grid still shows the sheet the set was written into, two cases differ. When a load the
   * plugin did not make ran since the set was written (`#foreignLoadCount` moved), the grid holds that
   * load's data, which never had the dropped value, and nothing is put back. That includes a load the
   * engine refused, which empties the sheet without counting a sheet write. Otherwise every load was the
   * plugin's own `switchSheet()` (away and back within the window), which loads the grid FROM the sheet,
   * so the grid's data holds the dropped value too, and both are put back (`#restoreReloadedCells`), cell
   * by cell only where the engine still holds what the first write put there: a newer edit of the cell
   * keeps its value.
   *
   * The restore runs in a plugin write that paints this grid as well: the Core renders nothing for a
   * dropped set, so a cell of the sheet shown that reads a restored cell kept the value computed from the
   * dropped one. Only the changes the Core cannot reject were written early; the others never
   * reached the engine, so they need nothing.
   *
   * @param {Array[]} changes The dropped change array, the one `afterSetDataAtCell` received.
   */
  #onChangesDropped = (changes: CellChange[]) => {
    const awaitingApply = this.#changesAwaitingApply.get(changes);

    if (!awaitingApply) {
      return;
    }

    this.#changesAwaitingApply.delete(changes);

    const { sheetId, writtenCells, foreignLoadCount } = awaitingApply;

    if (!this.engine || sheetId === null) {
      return;
    }

    // The restore compares what the engine holds, and a held first write records that only when it resumes.
    this.#flushEvaluation();

    if (sheetId !== this.sheetId) {
      withPluginEngineWrite(this.engine, () => this.#trackOwnEngineWrite(
        () => this.#restoreSwitchedAwaySheet(writtenCells, sheetId), 'cells',
      ));

    } else if (foreignLoadCount === this.#foreignLoadCount) {
      this.#restoreReloadedCells(writtenCells);
    }
  };

  /**
   * Puts the old values of a dropped change set back into a grid that loaded its data from the engine
   * sheet the set was written into, and into that sheet. The grid's data and the engine both hold the
   * dropped value then. The values go through `setSourceDataAtCell()`, whose `afterSetSourceDataAtCell`
   * writes the engine, at the cells the first write reached, translated from engine indexes, because the
   * load built the grid's rows from the engine sheet. A cell whose engine content is no longer what the
   * first write left (`WrittenCell#writtenContent`) is skipped. All cells go in one `setSourceDataAtCell()`
   * call, so a dropped paste renders and writes the engine once. The write is not an undo step: the user
   * never made the change it reverts.
   *
   * @param {Array} writtenCells The cells the first write reached.
   */
  #restoreReloadedCells(writtenCells: WrittenCell[]) {
    const restores: [number, string | number, unknown][] = [];

    writtenCells.forEach(({ address, oldValue, writtenContent }) => {
      if (writtenContent === undefined || this.#readEngineContent(address) !== writtenContent) {
        return;
      }

      const visualRow = this.rowAxisSyncer?.getVisualIndexFromHfIndex(address.row) ?? -1;
      const visualColumn = this.columnAxisSyncer?.getVisualIndexFromHfIndex(address.col) ?? -1;
      const physicalRow = visualRow < 0 ? null : this.hot.toPhysicalRow(visualRow);

      if (physicalRow !== null && visualColumn >= 0) {
        restores.push([physicalRow, this.hot.colToProp(visualColumn) as string | number, oldValue]);
      }
    });

    if (restores.length === 0) {
      return;
    }

    this.hot._getOperationScope().suppress(() => {
      this.hot.setSourceDataAtCell(
        restores, undefined as unknown as string, undefined, 'Formulas.restoreDroppedChange',
      );
    });
  }

  /**
   * Reads what the engine holds in a cell (`getCellSerialized()`), or `undefined` when the address is
   * outside what the engine can read (a sheet removed since, an index the engine refused).
   *
   * @param {object} address The engine address.
   * @returns {*}
   */
  #readEngineContent(address: WrittenCell['address']): unknown {
    if (!this.engine || address.sheet === null || address.row < 0 || address.col < 0
      || this.engine.getSheetName(address.sheet) === undefined) {
      return undefined;
    }

    return this.engine.getCellSerialized(address as { row: number; col: number; sheet: number });
  }

  /**
   * Puts a sheet the grid switched away from back to the values a change set replaced in it. It runs
   * inside a plugin write, which paints the grids that read the sheet.
   *
   * `afterSetDataAtCell` writes a change into the sheet the grid shows at that moment, before the Core
   * validates it. When the grid shows another sheet by the time the set is dropped or applied, the
   * sheet it was written into must not keep it.
   *
   * The cells come from the record the FIRST write kept (`ChangeSetAwaitingApply#writtenCells`), not
   * from mapping the changes again: by now the grid's indexes describe the switched-to sheet's data -
   * rows the Core just created included - so a fresh mapping named cells that write never touched
   * and skipped ones it did. An out-of-bounds change, or one the Core could reject, was never written
   * there (it waits for `beforeChangeRender`), so it has no record. The old values are what that sheet held,
   * because the grid's data was that sheet's when the change was made. A sheet removed from the
   * engine in the meantime is left alone.
   *
   * @param {Array} writtenCells The cells the first write reached.
   * @param {number} sheetId The engine id of the sheet the set was first written into.
   */
  #restoreSwitchedAwaySheet(writtenCells: WrittenCell[], sheetId: number) {
    const engine = this.engine!;

    if (engine.getSheetName(sheetId) === undefined || writtenCells.length === 0) {
      return;
    }

    const metaManager = this.hot._getMetaManager();

    runEngineBatch(engine, () => {
      writtenCells.forEach(({ address, physicalRow, physicalColumn, visualRow, visualColumn, oldValue }) => {
        let previous = this.#getValueGetterValue(physicalRow, physicalColumn, oldValue);

        if (typeof previous === 'string') {
          previous = this.#escapeEngineBoundValue(
            previous,
            metaManager.getCellMetaTransient(physicalRow, physicalColumn, { visualRow, visualColumn }),
          );
        }

        if (engine.isItPossibleToSetCellContents(address)) {
          engine.setCellContents(address, previous ?? null);
        }
      });
    });
  }

  /**
   * `onAfterSetSourceDataAtCell` hook callback.
   *
   * Unlike `afterSetDataAtCell`, this hook reports **physical** row indexes.
   *
   * @param {Array[]} changes An array of changes in format [[physicalRow, prop, oldValue, value], ...].
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   */
  #onAfterSetSourceDataAtCell = (changes: CellChange[], source: string) => {
    // Checked before the blocked-source branch so the write-back never reaches undo/redo tracking.
    if (this.#sourceDataSyncPending) {
      return;
    }

    if (isBlockedSource(source)) {
      return;
    }

    if (isRestoreSource(source)) {
      changes.forEach((change) => {
        this.#restoredWrites.push(change);
      });

      return;
    }

    // Skip HF re-sync when we are writing back to HOT after a moveCells HF operation.
    if (this.#moveCellsSyncPending) {
      return;
    }

    this.#markDataChanged();
    this.#writeSourceChangesToEngine(changes);
  };

  /**
   * Writes source-level cell changes into the engine, renders the dependent sheets and validates the
   * dependent cells.
   *
   * @param {Array[]} changes The changes, in the `afterSetSourceDataAtCell` format (physical rows).
   * @param {boolean} [restored=false] `true` for the writes of an undo or a redo: they are written in
   *   one `engine.batch()`, so the engine recalculates once for the whole restore, and this grid is
   *   rendered too. A batch is not nestable in the engine, so the forward path keeps its per-cell calls.
   */
  #writeSourceChangesToEngine(changes: CellChange[], restored = false) {
    const changedCells: unknown[] = [];
    const dependentCells: unknown[] = [];
    const metaManager = this.hot._getMetaManager();
    const writeAll = () => changes.forEach(([physicalRow, prop, , newValue]) => {
      if (typeof prop !== 'string' && typeof prop !== 'number') {
        return;
      }

      // This hook reports physical rows, and the engine holds trimmed rows as well – so the engine
      // row index is resolved straight out of the physical one. Going through the visual index
      // instead would have no answer for a trimmed row, and the fallback of reading its physical
      // index as a visual one lands on a different row of the engine.
      // The visual row is still resolved, because the cell meta read below needs it as its hook
      // context; a trimmed row keeps its own index there, which is what a meta hook that has no
      // visual cell to talk about gets.
      const visualRow = this.hot.toVisualRow(physicalRow) ?? physicalRow;
      // `propToCol` already returns a visual column index – it resolves the prop, or a physical
      // column index for array-based data, through `toVisualColumn`.
      const visualColumn = this.hot.propToCol(prop);

      if (visualColumn === null || !isNumeric(visualColumn)) {
        return;
      }

      const address = {
        row: this.rowAxisSyncer!.getHfIndexFromPhysicalIndex(physicalRow),
        col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn),
        sheet: this.sheetId
      };

      if (!this.engine?.isItPossibleToSetCellContents(address)) {
        warn(`Not possible to set source cell data at ${JSON.stringify(address)}`);

        return;
      }

      const physicalColumn = this.hot.toPhysicalColumn(visualColumn) ?? visualColumn;

      // The stored value, projected the way an edit and a load project it: an object value (a
      // `{ key, value }` dropdown option) reaches the engine as its `valueGetter` text, never raw.
      newValue = this.#getValueGetterValue(physicalRow, physicalColumn, newValue);

      // Values the escaping can never change skip the meta read: both `isDate()` and
      // `isPreservedText()` require a string. That read runs the user-provided `cells` function,
      // which is the expensive part of a bulk `setSourceDataAtCell`.
      if (typeof newValue === 'string') {
        // The meta is read by PHYSICAL coordinates, with the visual pair passed only as the hook
        // context the way `#escapeSourceDataArray` does it. Reading it through the visual row would
        // resolve a trimmed row's index fallback back into a DIFFERENT physical row, so the escaping
        // would consult a visible neighbor's meta instead of the written cell's own.
        const cellMeta = metaManager.getCellMetaTransient(
          physicalRow, physicalColumn,
          { visualRow, visualColumn },
        );

        newValue = this.#escapeEngineBoundValue(newValue, cellMeta);
      }

      changedCells.push({ address });
      this.#noteOwnCellWrite(address);
      this.engine!.setCellContents(address, newValue).forEach((dependentCell: unknown) => {
        dependentCells.push(dependentCell);
      });
      this.#recordSyncedCell(physicalRow, visualColumn, newValue);
    });

    const engine = this.engine!;

    if (!restored) {
      this.#writeOwnSheet(engine, () => {
        beginHeldEngineWrite(engine);
        writeAll();
      }, 'cells');
      this.#validateWriteDependents(dependentCells, changedCells);

      return;
    }

    const { dependents, changed } = withPluginEngineWrite(engine, () => this.#trackOwnEngineWrite(() => (
      this.#runRestoreWrite(engine, () => runEngineBatch(engine, writeAll))
    ), 'cells'));

    this.validateDependentCells(dependentCells.concat(dependents), changedCells.concat(changed));
  }

  /**
   * `beforeCreateRow` hook callback.
   *
   * @param {number} visualRow Represents the visual index of first newly created row in the data source array.
   * @param {number} amount Number of newly created rows in the data source array.
   * @param {string} [source] The source of the change. An undo or a redo is not asked about: the
   *   sheet is brought in line with the restored grid once the restore is done.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  #onBeforeCreateRow = (visualRow: number, amount: number, source?: string) => {
    this.#validateHeldWritesBeforeAlter(source);

    if (isRestoreSource(source)) {
      return;
    }

    let hfRowIndex = this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow);

    if (visualRow >= this.hot.countRows()) {
      hfRowIndex = visualRow; // Row beyond the table boundaries.
    }

    if (
      this.sheetId === null ||
      !this.engine?.doesSheetExist(this.sheetName!) ||
      !this.engine?.isItPossibleToAddRows(this.sheetId, [hfRowIndex, amount])
    ) {
      return false;
    }
  };

  /**
   * `beforeCreateCol` hook callback.
   *
   * @param {number} visualColumn Represents the visual index of first newly created column in the data source.
   * @param {number} amount Number of newly created columns in the data source.
   * @param {string} [source] The source of the change. An undo or a redo is not asked about: the
   *   sheet is brought in line with the restored grid once the restore is done.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  #onBeforeCreateCol = (visualColumn: number, amount: number, source?: string) => {
    this.#validateHeldWritesBeforeAlter(source);

    if (isRestoreSource(source)) {
      return;
    }

    let hfColumnIndex = this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn);

    if (visualColumn >= this.hot.countCols()) {
      hfColumnIndex = visualColumn; // Column beyond the table boundaries.
    }

    if (
      this.sheetId === null ||
      !this.engine?.doesSheetExist(this.sheetName!) ||
      !this.engine?.isItPossibleToAddColumns(this.sheetId, [hfColumnIndex, amount])
    ) {
      return false;
    }
  };

  /**
   * `beforeRemoveRow` hook callback.
   *
   * @param {number} row Visual index of starter row.
   * @param {number} amount Amount of rows to be removed.
   * @param {number[]} physicalRows An array of physical rows removed from the data source.
   * @param {string} [source] The source of the change. An undo or a redo is not asked about: the
   *   sheet is brought in line with the restored grid once the restore is done.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  #onBeforeRemoveRow = (row: number, amount: number, physicalRows: number[], source?: string) => {
    this.#validateHeldWritesBeforeAlter(source);

    if (isRestoreSource(source)) {
      return;
    }

    const hfRows = this.rowAxisSyncer!.setRemovedHfIndexes(physicalRows);

    const possible = hfRows.every((hfRow: number) => {
      return this.engine?.isItPossibleToRemoveRows(this.sheetId, [hfRow, 1]);
    });

    return possible === false ? false : undefined;
  };

  /**
   * `beforeRemoveCol` hook callback.
   *
   * @param {number} col Visual index of starter column.
   * @param {number} amount Amount of columns to be removed.
   * @param {number[]} physicalColumns An array of physical columns removed from the data source.
   * @param {string} [source] The source of the change. An undo or a redo is not asked about: the
   *   sheet is brought in line with the restored grid once the restore is done.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  #onBeforeRemoveCol = (col: number, amount: number, physicalColumns: number[], source?: string) => {
    this.#validateHeldWritesBeforeAlter(source);

    if (isRestoreSource(source)) {
      return;
    }

    const hfColumns = this.columnAxisSyncer!.setRemovedHfIndexes(physicalColumns);

    const possible = hfColumns.every((hfColumn: number) => {
      return this.engine?.isItPossibleToRemoveColumns(this.sheetId, [hfColumn, 1]);
    });

    return possible === false ? false : undefined;
  };

  /**
   * Checks whether the engine's column indexes are Handsontable's *physical* ones.
   *
   * `#getProcessedSourceDataArray` feeds the engine rows projected to the visible columns only when
   * an array-of-arrays source actually skips physical indexes; array-of-objects rows arrive already
   * projected. In every other case the engine receives the raw physical row, so a `columns` list
   * that merely *reorders* the same number of columns leaves the engine on physical indexes while
   * the grid reads them through `colToProp`.
   *
   * This is the single source of truth for that question. `#syncFormulasToSourceData` asks it
   * directly, and `#escapeSourceDataArray` asks for its negation – the column space of the array fed
   * to the engine is visual exactly when the engine is not on physical columns. Neither may
   * re-derive the answer from `#areSourceColumnsSkipped()` and `#isSourceDataArrayOfArrays()` on its
   * own, or hardening either of those checks would make the escape scan and the formula write-back
   * classify the same dataset differently.
   *
   * @private
   * @returns {boolean}
   */
  #doesEngineHoldPhysicalColumns(): boolean {
    return !this.#areSourceColumnsSkipped() && this.#isSourceDataArrayOfArrays();
  }

  /**
   * Resolves an engine column index to the visual column to read from and the prop to write to.
   *
   * The two differ: `getSourceDataAtCell` resolves its column argument as a visual index, while
   * `setSourceDataAtCell` takes a prop. Returns `null` when the cell has no visual counterpart and
   * must be left alone.
   *
   * @private
   * @param {number} hfColumn The engine's column index.
   * @param {boolean} engineHoldsPhysicalColumns Result of `#doesEngineHoldPhysicalColumns`, passed in
   *   because it reads the whole source data and must not be recomputed per cell.
   * @returns {{ visualColumn: number, prop: string | number } | null}
   */
  #resolveEngineColumn(hfColumn: number, engineHoldsPhysicalColumns: boolean) {
    if (engineHoldsPhysicalColumns) {
      // The engine index is the physical one, which doubles as the prop for array-of-arrays data.
      const visualColumn = this.hot.propToCol(hfColumn);

      return isNumeric(visualColumn) && (visualColumn as number) >= 0
        ? { visualColumn: visualColumn as number, prop: hfColumn }
        : null;
    }

    const visualColumn = this.columnAxisSyncer!.getVisualIndexFromHfIndex(hfColumn);

    // A trimmed column has no visual index, and without one there is no prop to write to either.
    return visualColumn === -1 ? null : { visualColumn, prop: this.hot.colToProp(visualColumn) as string | number };
  }

  /**
   * Checks whether a stored cell value is the same formula as the one the engine holds, ignoring
   * how it was spelled.
   *
   * HyperFormula hands back a canonical form - `=sum( a1 : a2 )` comes out as `=SUM( A1:A2 )`. A
   * plain string comparison would read that as a change and rewrite formulas the operation never
   * touched, including ones with no cell references at all.
   *
   * @private
   * @param {*} stored The value held in the source data.
   * @param {string} engineFormula The formula reported by the engine.
   * @returns {boolean}
   */
  #isSameFormula(stored: unknown, engineFormula: string) {
    if (!isFormula(stored)) {
      return false;
    }

    try {
      return this.engine!.normalizeFormula(stored as string) === engineFormula;
    } catch {
      // Not something the engine can parse - treat it as different and let the write happen.
      return false;
    }
  }

  /**
   * Writes the formulas that HyperFormula rewrote during a structural change back into
   * Handsontable's source data.
   *
   * Inserting or removing rows and columns makes HyperFormula shift the references inside every
   * affected formula (`=SUM(A1:A3)` becomes `=SUM(A1:A4)` after a row is inserted into that
   * range). Until this sync runs, that rewrite lives only inside the engine and is projected onto
   * reads by the `modifySourceData` hook, which leaves the array the developer passed to
   * Handsontable holding the *old* formula. Any consumer that owns the data outside the grid — a
   * Redux store, a React `data` prop, a snapshot saved to a server — then keeps the stale text and
   * reverts the formula the moment that array is loaded back in.
   *
   * The engine changes reported by `addRows`/`removeRows`/... cannot drive this: they list cells
   * whose *value* changed, and a reference shift usually leaves the value intact. So the sheet's
   * formulas are read in bulk and only the cells that actually differ are written.
   *
   * The write is fenced with `#sourceDataSyncPending` so `afterSetSourceDataAtCell` does not push
   * the formulas straight back into the engine. External listeners still receive that hook, which
   * is what lets an outside store learn the new formula text - with a real previous value, because
   * the same flag switches the read projection off while Core builds that payload.
   *
   * Row and column *moves* (and sorting) are deliberately excluded: they reorder the engine's
   * indexes without touching the source data, so the two stop sharing a reference frame. While that
   * is the case nothing is written back at all, and the stored text keeps whatever the last sync
   * left there.
   *
   * Ordinary reads are unaffected: `#onModifySourceData` still projects the engine's current
   * formula, so the grid keeps reporting the up-to-date text. The reads that feed the engine
   * (`#getProcessedSourceDataArray`) deliberately do not - they have to report what is stored, or a
   * data load could never replace a formula - so in a moved or sorted frame those reads hand the
   * engine the stored, possibly stale text. Narrowing the order guard above so a structural change
   * in that state still syncs is tracked separately.
   *
   * A Nested Rows detach is excluded for the same reason, and needs its own flag to be recognized:
   * that plugin moves the rows inside the source data itself and reports the move as a row removal
   * followed by a row creation, so the axis order stays physical throughout and the exclusion above
   * cannot see it. Between the two legs the engine holds a reference to the detached row as broken,
   * and the removal leg is one of the operations allowed to persist a broken reference – so without
   * the flag the developer's array ends up with a `#REF!` in place of a formula whose target still
   * exists, one row further down.
   *
   * @private
   * @param {boolean} [allowBrokenReferences] `true` to write a `#REF!` the engine holds.
   * @param {Array} [cells] The only engine cells to write (another grid's rewrites); every cell of
   *   the sheet when omitted.
   */
  #syncFormulasToSourceData(
    allowBrokenReferences = false,
    cells?: ReadonlyArray<{ row: number, col: number }>,
  ) {
    if (
      this.#internalOperationPending ||
      this.#nestedRowsDetachPending ||
      this.sheetName === null ||
      !this.engine?.doesSheetExist(this.sheetName)
    ) {
      return;
    }

    const engine = this.engine;
    const sheetId = engine.getSheetId(this.sheetName)!;

    // Once rows or columns have been moved or sorted, the engine and the source data no longer
    // share a reference frame, and the engine's formulas would be wrong in the source data's terms.
    // Only a formula can have been rewritten, so a sheet without one leaves nothing stale and must not
    // make every later step serialize the sheet.
    if (!this.rowAxisSyncer!.isHfOrderPhysical() || !this.columnAxisSyncer!.isHfOrderPhysical()) {
      this.#sourceHasStaleFormulas ||= engine.getSheetFormulas(sheetId)
        .some(formulasRow => formulasRow?.some(formula => formula !== undefined));

      return;
    }

    const dimensions = engine.getSheetDimensions(sheetId);

    if (dimensions.width === 0 && dimensions.height === 0) {
      return;
    }

    const changes: Array<[number, string | number, unknown]> = [];
    // Resolved once for the run, and only if a formula cell is actually found - it reads the data.
    let engineHoldsPhysicalColumns: boolean | null = null;
    const holdsPhysicalColumns = () => {
      engineHoldsPhysicalColumns ??= this.#doesEngineHoldPhysicalColumns();

      return engineHoldsPhysicalColumns;
    };
    let leftStale = false;
    const collect = (hfRow: number, hfColumn: number, formula: string | undefined) => {
      const change = formula === undefined ? null :
        this.#readSourceChange(hfRow, hfColumn, formula, allowBrokenReferences, holdsPhysicalColumns);

      if (change === 'skipped') {
        leftStale = true;
      } else if (change !== null) {
        changes.push(change);
      }
    };

    // Compare against what Handsontable stores, not against what it reports - `#onModifySourceData`
    // would otherwise answer with the engine's formula and hide every diff.
    this.#internalOperationPending = true;

    try {
      if (cells === undefined) {
        engine.getSheetFormulas(sheetId).forEach((formulasRow, hfRow) => {
          formulasRow?.forEach((formula, hfColumn) => collect(hfRow, hfColumn, this.#readableFormula(formula)));
        });
      } else {
        cells.forEach(({ row, col }) => collect(row, col,
          this.#readableFormula(engine.getCellFormula({ sheet: sheetId, row, col }))));
      }
    } finally {
      this.#internalOperationPending = false;
    }

    if (cells === undefined && !leftStale) {
      this.#sourceHasStaleFormulas = false;
    }

    if (changes.length === 0) {
      return;
    }

    this.#sourceDataSyncPending = true;

    try {
      this.hot.setSourceDataAtCell(
        changes, undefined, undefined, `${toUpperCaseFirst(PLUGIN_KEY)}.syncSourceData`
      );
    } finally {
      this.#sourceDataSyncPending = false;
    }

    // The engine already holds these formulas; the source data now holds them too.
    changes.forEach(([physicalRow, prop, value]) => {
      const visualColumn = this.hot.propToCol(prop);

      if (isNumeric(visualColumn)) {
        this.#recordSyncedCell(physicalRow, visualColumn as number, value);
      }
    });
  }

  /**
   * Returns the source data write that brings one engine formula into the source data, `null` when the
   * source already holds it, or `'skipped'` when it must not get it. The engine order must be the
   * physical one.
   *
   * @param {number} hfRow The engine row – the physical row, in the physical order.
   * @param {number} hfColumn The engine column.
   * @param {string} formula The engine's formula.
   * @param {boolean} allowBrokenReferences `true` to write a `#REF!` the source does not hold yet.
   * @param {Function} holdsPhysicalColumns Tells whether the engine holds the columns in physical order.
   * @returns {Array|string|null} The write, as `[physicalRow, prop, formula]`.
   */
  #readSourceChange(
    hfRow: number,
    hfColumn: number,
    formula: string,
    allowBrokenReferences: boolean,
    holdsPhysicalColumns: () => boolean,
  ): [number, string | number, unknown] | 'skipped' | null {
    // The engine's index IS the physical index in the physical order, so trimmed rows (Filters,
    // `trimRows`) are reached too – they hold formulas that need the same catch-up.
    const physicalRow = hfRow;
    const column = this.#resolveEngineColumn(hfColumn, holdsPhysicalColumns());

    if (column === null) {
      return this.#isUnreachableCellStale(physicalRow, hfColumn, formula) ? 'skipped' : null;
    }

    // `getSourceDataAtCell` takes a physical row and a visual column, `setSourceDataAtCell` a physical
    // row and a prop.
    const stored = this.hot.getSourceDataAtCell(physicalRow, column.visualColumn);

    if (stored === formula || this.#isSameFormula(stored, formula)) {
      return null;
    }

    // An engine formula can hold `#REF!` for reasons this change did not cause. Persisting it would
    // overwrite a still-good formula in the developer's array with an unrecoverable one, so it is only
    // written for the operations that can legitimately break a reference.
    if (!allowBrokenReferences && REF_ERROR_PATTERN.test(formula) && !REF_ERROR_PATTERN.test(String(stored))) {
      return 'skipped';
    }

    return [physicalRow, column.prop, formula];
  }

  /**
   * Tells whether the source data holds another formula than the engine for a cell no write can reach:
   * its column has no visual counterpart, a column trimmed after the sheet was built. In the physical
   * order the engine's column is the physical one, which `columns` maps to the property the source reads
   * it by (the engine holds that column's data, not the source column of the same index). A `data`
   * accessor function names no property, so its cell counts as stale.
   *
   * @private
   * @param {number} physicalRow The engine row – the physical row, in the physical order.
   * @param {number} physicalColumn The engine column – the physical column, in the physical order.
   * @param {string} formula The engine's formula.
   * @returns {boolean}
   */
  #isUnreachableCellStale(physicalRow: number, physicalColumn: number, formula: string): boolean {
    const { columns } = this.hot.getSettings();
    const column = typeof columns === 'function' ? columns(physicalColumn) : columns?.[physicalColumn];
    const prop = column?.data ?? physicalColumn;
    // A host can write a formula into the engine past the source rows, where there is no row to read.
    const row = this.hot.getSourceDataAtRow(physicalRow) as Record<string | number, unknown> | null;

    return !this.#isSameFormula(row?.[prop as string | number], formula);
  }

  /**
   * `afterCreateRow` hook callback.
   *
   * @param {number} visualRow Represents the visual index of first newly created row in the data source array.
   * @param {number} amount Number of newly created rows in the data source array.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   */
  #onAfterCreateRow = (visualRow: number, amount: number, source: string) => {
    // Physical indexes shift; the repaint that follows the structural change re-registers the cells.
    this.#hyperlinkCells.clear();
    this.#followSyncedRows((rows) => {
      const physicalRow = this.hot.toPhysicalRow(visualRow) ?? rows.length;

      if (physicalRow > rows.length) {
        return false;
      }

      insertEmptyRows(rows, physicalRow, amount);

      return true;
    });

    if (isBlockedSource(source) || isRestoreSource(source)) {
      return;
    }

    this.#markStructureChanged();

    const engine = this.engine!;

    this.#trackPeerRewrites(() => this.#writeOwnSheet(engine, () => {
      beginHeldEngineWrite(engine);

      return engine.addRows(this.sheetId, [this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow), amount]);
    }, 'resets'));

    this.#syncFormulasToSourceData();
  };

  /**
   * `afterCreateCol` hook callback.
   *
   * @param {number} visualColumn Represents the visual index of first newly created column in the data source.
   * @param {number} amount Number of newly created columns in the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   */
  #onAfterCreateCol = (visualColumn: number, amount: number, source: string) => {
    // Physical indexes shift; the repaint that follows the structural change re-registers the cells.
    this.#hyperlinkCells.clear();
    this.#syncedContent = null;

    if (isBlockedSource(source) || isRestoreSource(source)) {
      return;
    }

    this.#markStructureChanged();

    const engine = this.engine!;

    this.#trackPeerRewrites(() => this.#writeOwnSheet(engine, () => {
      beginHeldEngineWrite(engine);

      return engine.addColumns(this.sheetId, [this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn), amount]);
    }, 'resets'));

    this.#syncFormulasToSourceData();
  };

  /**
   * `afterRemoveRow` hook callback.
   *
   * @param {number} row Visual index of starter row.
   * @param {number} amount An amount of removed rows.
   * @param {number[]} physicalRows An array of physical rows removed from the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   */
  #onAfterRemoveRow = (row: number, amount: number, physicalRows: number[], source: string) => {
    // Physical indexes shift; the repaint that follows the structural change re-registers the cells.
    this.#hyperlinkCells.clear();
    this.#followSyncedRows((rows) => {
      // One pass that moves every kept row up once: a splice per removed row (or per span, when the removed
      // rows are scattered) shifts the rest of the array each time, which is quadratic on a large removal.
      const removed = new Set(physicalRows);
      let kept = 0;

      for (let physicalRow = 0; physicalRow < rows.length; physicalRow += 1) {
        if (!removed.has(physicalRow)) {
          rows[kept] = rows[physicalRow];
          kept += 1;
        }
      }

      rows.length = kept;

      return true;
    });

    if (isBlockedSource(source) || isRestoreSource(source)) {
      return;
    }

    this.#markStructureChanged();

    const removedSpans = coalesceIndexesToSpans(this.rowAxisSyncer!.getRemovedHfIndexes());
    const engine = this.engine!;

    this.#trackPeerRewrites(() => this.#writeOwnSheet(engine, () => runEngineBatch(engine, () => {
      this.#removeSpansFromEngine(removedSpans, 'removeRows');
    }, { movesCells: true }), 'resets'));

    this.#syncFormulasToSourceData(true);
  };

  /**
   * `afterRemoveCol` hook callback.
   *
   * @param {number} col Visual index of starter column.
   * @param {number} amount An amount of removed columns.
   * @param {number[]} physicalColumns An array of physical columns removed from the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   */
  #onAfterRemoveCol = (col: number, amount: number, physicalColumns: number[], source: string) => {
    // Physical indexes shift; the repaint that follows the structural change re-registers the cells.
    this.#hyperlinkCells.clear();
    this.#syncedContent = null;

    if (isBlockedSource(source) || isRestoreSource(source)) {
      return;
    }

    this.#markStructureChanged();

    const removedSpans = coalesceIndexesToSpans(this.columnAxisSyncer!.getRemovedHfIndexes());
    const engine = this.engine!;

    this.#trackPeerRewrites(() => this.#writeOwnSheet(engine, () => runEngineBatch(engine, () => {
      this.#removeSpansFromEngine(removedSpans, 'removeColumns');
    }, { movesCells: true }), 'resets'));

    this.#syncFormulasToSourceData(true);
  };

  /**
   * Checks whether every visual index in the `[visualFrom, visualTo]` span maps to consecutive
   * HyperFormula indexes on the given axis. Only then is a visual rectangle equivalent to the
   * single HF rectangle the `moveCells` engine operation works on.
   *
   * @param {AxisSyncer} syncer The row or column axis syncer.
   * @param {number} visualFrom The first visual index of the span.
   * @param {number} visualTo The last visual index of the span.
   * @returns {boolean}
   */
  #mapsToContiguousHfBlock(syncer: AxisSyncer, visualFrom: number, visualTo: number): boolean {
    const hfBase = syncer.getHfIndexFromVisualIndex(visualFrom);

    if (hfBase < 0) {
      return false;
    }

    for (let offset = 1; offset <= visualTo - visualFrom; offset++) {
      if (syncer.getHfIndexFromVisualIndex(visualFrom + offset) !== hfBase + offset) {
        return false;
      }
    }

    return true;
  }

  /**
   * `beforeMoveCells` hook callback.
   *
   * Converts the visual source range and target top-left corner to HyperFormula
   * (physical) coordinates, validates feasibility for a MOVE operation, and stores
   * the converted addresses for use in the `afterMoveCells` handler.
   *
   * Returns `false` to veto the whole operation when the source range is not a valid range
   * (the documented `false` veto value, or garbage folded into the argument by a preceding
   * listener's truthy return value), when HyperFormula reports the move is not possible
   * (e.g. the source or target contains an array formula), or when the visual ranges do not map
   * to contiguous HF blocks (trimmed/filtered/reordered indexes), because the engine rectangle
   * would then cover cells outside the visual operation.
   *
   * @param {CellRange|boolean} sourceRange The visual source range, or `false` after an earlier veto.
   * @param {CellCoords} targetTopLeft The visual top-left of the destination.
   * @param {boolean} isCopy `true` when copying (not moving) cells.
   * @returns {boolean|undefined} `false` to cancel the operation; `undefined` otherwise.
   */
  #onBeforeMoveCells = (sourceRange: unknown, targetTopLeft: CellCoords, isCopy: boolean) => {
    if (!isCellRangeLike(sourceRange)) {
      this.#pendingMoveCells = null;

      return false;
    }

    if (!this.engine || this.sheetId === null) {
      return;
    }

    const topStart = sourceRange.getTopStartCorner();
    const bottomEnd = sourceRange.getBottomEndCorner();
    const fromRow = topStart.row!;
    const fromCol = topStart.col!;
    const toRow = bottomEnd.row!;
    const toCol = bottomEnd.col!;
    const targetRow = targetTopLeft.row!;
    const targetCol = targetTopLeft.col!;

    // The engine operates on a single HF rectangle built from the mapped corners below. That is
    // only equivalent to the visual operation when every visual index in all four spans maps to
    // consecutive HF indexes. With Filters/TrimRows the HF sheet still contains the trimmed rows,
    // and sorting or manual move permutes the order — a rectangle would then move cells the grid
    // never touches, desyncing the engine from the data source. Veto instead.
    if (
      !this.#mapsToContiguousHfBlock(this.rowAxisSyncer!, fromRow, toRow) ||
      !this.#mapsToContiguousHfBlock(this.columnAxisSyncer!, fromCol, toCol) ||
      !this.#mapsToContiguousHfBlock(this.rowAxisSyncer!, targetRow, targetRow + (toRow - fromRow)) ||
      !this.#mapsToContiguousHfBlock(this.columnAxisSyncer!, targetCol, targetCol + (toCol - fromCol))
    ) {
      this.#pendingMoveCells = null;

      return false;
    }

    const hfFromRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(fromRow);
    const hfFromCol = this.columnAxisSyncer!.getHfIndexFromVisualIndex(fromCol);
    const hfToRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(toRow);
    const hfToCol = this.columnAxisSyncer!.getHfIndexFromVisualIndex(toCol);
    const hfTargetRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(targetRow);
    const hfTargetCol = this.columnAxisSyncer!.getHfIndexFromVisualIndex(targetCol);

    const source = {
      start: { sheet: this.sheetId, row: hfFromRow, col: hfFromCol },
      end: { sheet: this.sheetId, row: hfToRow, col: hfToCol },
    };
    const dest = { sheet: this.sheetId, row: hfTargetRow, col: hfTargetCol };

    if (!isCopy && !this.engine.isItPossibleToMoveCells(source, dest)) {
      this.#pendingMoveCells = null;

      return false;
    }

    if (isCopy) {
      // Pre-check the paste target for a COPY the same way isItPossibleToMoveCells guards a
      // MOVE (e.g. pasting over part of an array formula throws in `engine.paste`), so the
      // operation vetoes cleanly before the grid mutates instead of failing halfway through.
      const targetRegion = {
        start: dest,
        end: {
          sheet: this.sheetId,
          row: hfTargetRow + (hfToRow - hfFromRow),
          col: hfTargetCol + (hfToCol - hfFromCol),
        },
      };

      if (!this.engine.isItPossibleToSetCellContents(targetRegion)) {
        this.#pendingMoveCells = null;

        return false;
      }
    }

    this.#pendingMoveCells = {
      source,
      dest,
      isCopy,
      rect: { fromRow, fromCol, toRow, toCol, targetRow, targetCol, isCopy },
    };
  };

  /**
   * Executes the HyperFormula move or copy operation prepared in `beforeMoveCells`. Called by
   * the MoveCells plugin BEFORE any grid mutation (cell meta, selection, undo history),
   * so a failed engine operation aborts the whole `moveCells` operation atomically instead of
   * leaving the grid state recording a move whose data write never happened.
   *
   * For a MOVE, calls `engine.moveCells`, which physically relocates cell content and adjusts
   * all dependent formula references (Excel-style). For a COPY, calls `engine.copy` followed
   * by `engine.paste`, which duplicates the content with adjusted relative references. Note:
   * `engine.copy` reads cell values and must NOT be wrapped in `engine.batch` because batch
   * suspends evaluation, causing `copy` to throw `EvaluationSuspendedError`.
   *
   * Undo and redo never run a move again – they restore the recorded cells, which reach the engine
   * through `restoreState()` – so this method runs for a user's move only.
   *
   * This is the second half of a two-phase protocol with the MoveCells plugin: `beforeMoveCells`
   * prepares `#pendingMoveCells`, and this method commits it. It is internal despite being reachable
   * through `getPlugin('formulas')` — not part of the public API.
   *
   * @private
   * @returns {boolean} `true` when the engine operation succeeded (or was intentionally
   *   skipped); `false` when there is no prepared operation or the engine rejected it.
   */
  commitPendingMoveCells(): boolean {
    if (!this.engine || !this.#pendingMoveCells) {
      return false;
    }

    const { source, dest, isCopy, rect } = this.#pendingMoveCells;

    this.#pendingMoveCells = null;
    this.#moveCellsChanges = null;

    // HyperFormula can still throw for cases the isItPossibleTo* pre-checks in
    // `beforeMoveCells` do not cover. Failing here is safe: the core has not mutated
    // anything yet and aborts the whole operation when `false` is returned.
    const engine = this.engine;

    try {
      if (isCopy) {
        // copy() reads cell values and cannot run inside batch() (evaluation must not be suspended), and
        // paste() throws while it is suspended, so a held recalculation ends here and neither is held.
        this.#flushEvaluation();
        engine.copy(source);
        this.#moveCellsChanges = this.#writeOwnSheet(engine, () => engine.paste(dest));
      } else {
        this.#moveCellsChanges = this.#trackPeerRewrites(() => this.#writeOwnSheet(engine, () => (
          runEngineBatch(engine, () => {
            engine.moveCells(source, dest);
          })
        )));
      }
    } catch (e) {
      const operation = isCopy ? 'copy/paste' : 'moveCells';
      const reason = e instanceof Error ? e.message : String(e);

      warn(`Formulas: HyperFormula operation failed during ${operation}: ${reason}`);

      return false;
    }

    this.#committedMoveCells = rect;

    // A move rewrites every formula that points at the moved cells. In physical order those rewrites
    // are written back to the source data, so the journal holds them. Out of it they are not, so the
    // step records the engine's sheet instead, and its undo loads it back.
    if (!isCopy && !(this.rowAxisSyncer!.isHfOrderPhysical() && this.columnAxisSyncer!.isHfOrderPhysical())) {
      this.#markStructureChanged();
    } else {
      this.#markDataChanged();
    }

    return true;
  }

  /**
   * `afterMoveCells` hook callback.
   *
   * Runs after the engine operation already executed in `commitPendingMoveCells` (the core
   * calls it before mutating the grid, so a failed engine operation never reaches this hook).
   * Synchronises HOT's source data array with HF's state so that `getDataAtCell` returns
   * correct values for plain VALUE / EMPTY cells (formula cells are already served from HF
   * via the `modifyData` hook), then re-renders the dependent sheets. The sync is guarded by
   * `#moveCellsSyncPending` so that `afterSetDataAtCell` does not re-write the same values
   * back into HyperFormula.
   *
   * Takes no arguments on purpose. The engine has already moved the cells by the time this runs, so
   * there is nothing left to veto and bailing out would strand the data source out of sync with the
   * engine — which is what reading the replaceable `sourceRange` argument used to cause. The
   * operation is read from `#committedMoveCells` instead, captured before any listener could run.
   */
  #onAfterMoveCells = () => {
    this.#syncedContent = null;
    const committed = this.#committedMoveCells;
    const dependentCells = this.#moveCellsChanges;

    // Consume the state on every run, including the ones that return early below, so a run without
    // a committed move behind it cannot pick up the previous operation's leftovers.
    this.#committedMoveCells = null;
    this.#moveCellsChanges = null;

    if (!this.engine || committed === null) {
      return;
    }

    // Sync HOT's source data with HF's updated state so that getDataAtCell returns
    // correct values for VALUE/EMPTY cells (formula cells are already served via modifyData).
    this.#syncHotDataAfterMoveCells(committed);

    // `#syncHotDataAfterMoveCells` covers the cells that were moved. Formulas elsewhere that
    // pointed at the moved range were rewritten by the engine too, and need the same catch-up.
    this.#syncFormulasToSourceData(true);

    // The move wrote the engine before the grid changed, so the engine's write left this grid unpainted.
    if (dependentCells !== null && this.sheetId !== null && changesNameSheet(dependentCells, this.sheetId)) {
      this.#paintGrid();
    }
  };

  /**
   * Synchronises HOT's raw data source array with HyperFormula's state after a
   * `moveCells` or copy operation.
   *
   * Formula cells are already served correctly through `modifyData` via `getCellValue`.
   * Plain VALUE / EMPTY cells, however, fall back to the raw HOT data, so after HF
   * moves the data the old raw values must be cleared from the source cells and the
   * serialized HF content must be written to the target cells.
   *
   * The write is fenced with `#moveCellsSyncPending` to prevent the `afterSetDataAtCell`
   * hook from re-syncing the same data back into HyperFormula.
   *
   * @private
   * @param {object} rect The committed operation in visual coordinates.
   */
  #syncHotDataAfterMoveCells(rect: MoveCellsRect) {
    const {
      fromRow: srcFromRow,
      fromCol: srcFromCol,
      toRow: srcToRow,
      toCol: srcToCol,
      targetRow: tgtFromRow,
      targetCol: tgtFromCol,
      isCopy,
    } = rect;

    const height = srcToRow - srcFromRow + 1;
    const width = srcToCol - srcFromCol + 1;

    // A held move is read back once it is recalculated.
    this.#flushEvaluation();

    // Build target values from HF serialized content (formula strings or raw values).
    const targetData: unknown[][] = [];

    for (let r = 0; r < height; r++) {
      const row: unknown[] = [];

      for (let c = 0; c < width; c++) {
        const hfRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(tgtFromRow + r);
        const hfCol = this.columnAxisSyncer!.getHfIndexFromVisualIndex(tgtFromCol + c);
        const serialized = this.#readableFormula(this.engine!.getCellSerialized({
          sheet: this.sheetId,
          row: hfRow,
          col: hfCol,
        }));

        // The serialized content keeps the escape apostrophe that dates and preserved text values
        // were written with, so it is unescaped before it goes back into the grid. The meta comes
        // from the SOURCE cell, which is what the escape was applied from – `preserveTextValue` and
        // `type` do not travel with a moved cell, so reading the destination's meta would leave the
        // apostrophe in the grid whenever the value lands on a cell that declares neither. This is
        // the same source-meta rule the autofill path (`#onBeforeAutofill`) already follows.
        row.push(serialized === null || serialized === undefined
          ? null
          : this.#unescapeEngineBoundValueAt(serialized, srcFromRow + r, srcFromCol + c));
      }

      targetData.push(row);
    }

    this.#moveCellsSyncPending = true;

    try {
      if (!isCopy) {
        // Clear source cells in HOT's data first (HF already moved them out), so that an
        // overlapping source/target range does not null out cells the target write is about
        // to fill — the target data was already snapshotted from HF above.
        const nullRow: null[] = Array.from<null>({ length: width }).fill(null);
        const nullGrid: null[][] = Array.from({ length: height }, () => nullRow.slice());

        this.hot.populateFromArray(
          srcFromRow, srcFromCol, nullGrid,
          srcToRow, srcToCol,
          'auto'
        );
      }

      // Write target cells with HF-serialized content (formula strings preserved). The writes run
      // inside the move's own operation, so the move's undo step records them, and the `auto`
      // source keeps them out of this plugin's own write listeners.
      this.hot.populateFromArray(
        tgtFromRow, tgtFromCol, targetData,
        tgtFromRow + height - 1, tgtFromCol + width - 1,
        'auto'
      );
    } finally {
      this.#moveCellsSyncPending = false;
    }
  }

  /**
   * Removes the provided `[startIndex, amount]` spans from the engine in as few calls as possible.
   * One call handles many spans, so the engine pays its dependency-graph remap once per call instead
   * of once per removed row or column. The engine methods are variadic, so the spans are chunked to
   * keep the argument spread within call-stack limits; chunks run from the highest spans down, which
   * keeps the original coordinates of the not-yet-removed lower spans valid.
   *
   * @param {Array<Array<number>>} spans Ascending list of `[startIndex, amount]` spans to remove.
   * @param {'removeRows'|'removeColumns'} engineMethodName The engine removal method to call.
   */
  #removeSpansFromEngine(spans: [number, number][], engineMethodName: 'removeRows' | 'removeColumns') {
    for (let end = spans.length; end > 0; end -= REMOVAL_SPANS_CHUNK_SIZE) {
      const chunk = spans.slice(Math.max(0, end - REMOVAL_SPANS_CHUNK_SIZE), end);

      if (engineMethodName === 'removeRows') {
        this.engine!.removeRows(this.sheetId, ...chunk);

      } else {
        this.engine!.removeColumns(this.sheetId, ...chunk);
      }
    }
  }

  /**
   * `beforeDetachChild` hook callback.
   * Opens the guarded span in which `#syncFormulasToSourceData` must not run – see
   * `#nestedRowsDetachPending`. `#onAfterDetachChild`'s `try`/`finally` guarantees the span closes
   * whenever that listener runs, even if its own body throws. It does NOT guarantee the listener
   * runs at all: `afterDetachChild` also has an earlier listener, registered by the Nested Rows
   * plugin itself (`#onAfterDetachChild` in `nestedRows.ts`), and a throw there aborts the hook
   * emitter before this plugin's listener is reached, leaving the flag set. `enablePlugin()` clears
   * it, so that leak is bounded by the next enable rather than lasting the whole session.
   */
  #onBeforeDetachChild = () => {
    this.#nestedRowsDetachPending = true;
  };

  /**
   * Closes guard spans that their own closing path never got to close, at the head of the
   * structural operations that re-establish the engine's relationship to the source data
   * (`afterLoadData`, `afterUpdateData`, `afterCellMetaReset`).
   *
   * `#nestedRowsDetachPending` is left open when a listener registered ahead of this plugin's own
   * throws out of `afterDetachChild` – see `#onBeforeDetachChild`. `#internalOperationPending` is
   * left open by a throw from `setSheetContent` or `setupSyncEndpoint`,
   * which the two handlers below open it across without a `try`/`finally`. Both leaks are silent:
   * the first suppresses `#syncFormulasToSourceData`, so the developer's array keeps stale formula
   * text, and the second makes the read hooks early-return, so formula cells report their raw text.
   *
   * This is a BOUND, not a guarantee that the spans are closed. A detach does not run to completion
   * before these handlers can fire: `dataManager.detachFromParent` emits `beforeCreateRow` and
   * `afterCreateRow` between `beforeDetachChild` and `afterDetachChild`, and those are
   * user-reachable, so a listener that calls `updateSettings()` or `loadData()` from inside a
   * detach clears the flag mid-span and leaves the remaining legs unguarded – which is the
   * `#REF!`-over-a-live-formula write-back the flag exists to prevent. That is narrower than an
   * unbounded flag, which is why the trade is made this way, but it is a trade.
   */
  #closeLeakedGuards() {
    this.#nestedRowsDetachPending = false;
    this.#internalOperationPending = false;
  }

  /**
   * `afterDetachChild` hook callback.
   * Used to sync the data of the rows detached in the Nested Rows plugin with the engine's dataset.
   *
   * @param {object} parent An object representing the parent from which the element was detached.
   * @param {object} element The detached element.
   * @param {number} finalElementRowIndex The final row index of the detached element.
   */
  #onAfterDetachChild = (parent: Record<string, unknown>, element: Record<string, unknown>,
                         finalElementRowIndex: number, source?: string) => {
    this.#markStructureChanged();
    this.#syncedContent = null;

    try {
      if (isBlockedSource(source)) {
        return;
      }

      this.#internalOperationPending = true;

      const childrenCount = countNestedRowsDescendants(element);
      const rowsData = this.#getProcessedSourceDataArray(
        finalElementRowIndex,
        0,
        finalElementRowIndex + childrenCount,
        this.hot.countSourceCols()
      );

      this.#internalOperationPending = false;

      // `rowsData` is a partial array starting at the detached element's row, so the escaping needs
      // that row as its offset. The reported row index is a physical one – the Nested Rows data
      // manager derives it from the flattened source data (`dataManager.getRowIndex()`), not from the
      // visual order. That distinction matters, because collapsing rows in that plugin installs a
      // trimming map, under which the visual and physical row spaces genuinely differ.
      this.#escapeSourceDataArray(rowsData, finalElementRowIndex, 0);

      this.#writeOwnSheet(this.engine, () => {
        rowsData.forEach((row: unknown[], relativeRowIndex: number) => {
          row.forEach((value: unknown, colIndex: number) => {
            this.engine?.setCellContents({
              col: colIndex,
              row: finalElementRowIndex + relativeRowIndex,
              sheet: this.sheetId
            }, [[value]]);
          });
        });
      });
    } finally {
      // Both flags are opened by this span – `#nestedRowsDetachPending` in `#onBeforeDetachChild`
      // and `#internalOperationPending` on the first line of the `try` – so both have to close
      // here. The mid-body reset above still matters (the flag must be down before
      // `setCellContents` runs); this is the net that catches a throw from a `cells()` function, a
      // `beforeGetCellMeta` listener, or the engine itself.
      this.#internalOperationPending = false;
      this.#nestedRowsDetachPending = false;
    }
  };
}
