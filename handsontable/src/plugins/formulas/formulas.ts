import { BasePlugin, type PluginRestoreContext } from '../base';
import { staticRegister } from '../../utils/staticRegister';
import { deprecatedWarnOnce, error, warn, warnOnce } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { isNumeric } from '../../helpers/number';
import { isObject, isPlainObject } from '../../helpers/object';
import { isDefined, isUndefined } from '../../helpers/mixed';
import { getRegisteredHotInstances, setupEngine, setupSheet, unregisterEngine, } from './engine/register';
import {
  coalesceIndexesToSpans,
  escapeTextValue,
  getDateFromExcelDate,
  getDateInHfFormat,
  getDateInHotFormat,
  getTimeFromHfTimeFraction,
  isDate,
  isDateValid,
  isEngineEscapedValue,
  isFormula,
  isPreservedText,
  normalizeValueForFormulaEngine,
  padRowsToWidestRow,
  unescapeEngineBoundValue,
  unescapeFormulaExpression,
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
import { isArrayOfArrays } from '../../helpers/data';
import { toUpperCaseFirst } from '../../helpers/string';
import { getValueGetterValue } from '../../utils/valueAccessors';
import { Hooks } from '../../core/hooks';
import IndexSyncer from './indexSyncer';
import type AxisSyncer from './indexSyncer/axisSyncer';
import type { EngineOrder } from './indexSyncer/axisSyncer';
import type { HyperFormulaEngine, FormulasCellAddress, FormulasCellRange } from './engine/types';
import type { CellChange, CellValue } from '../../settings';
import type { RangeType } from '../../core/types';
import type CellRange from '../../3rdparty/walkontable/src/cell/range';
import { isCellRangeLike } from '../../3rdparty/walkontable/src/cell/range';
import type CellCoords from '../../3rdparty/walkontable/src/cell/coords';

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
 * A `setDataAtCell()` / `setDataAtRowProp()` change set written into the engine and not yet applied
 * to the source data by the Core (see `Formulas#changesAwaitingApply`). `writeCount` and `sheetId`
 * are taken when the set is written; `writtenBack` is set once `beforeChangeRender` has written the
 * whole set again, so the deferred write of its out-of-bounds changes is skipped.
 */
interface ChangeSetAwaitingApply {
  writeCount: number;
  sheetId: number | null;
  writtenBack: boolean;
}

/**
 * The object form of the `formulas.hyperlinks` setting.
 */
export interface FormulasHyperlinkSettings {
  target?: LinkTarget;
  schemes?: LinkScheme[];
}

/**
 * The expected shape of the `formulas` plugin settings object (the non-boolean form).
 */
interface FormulasPluginSettings {
  sheetName?: string;
  engine: unknown;
  hyperlinks?: boolean | FormulasHyperlinkSettings;
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
interface EngineSheetSnapshot {
  readonly content: unknown[][];
  readonly rowOrder: EngineOrder;
  readonly columnOrder: EngineOrder;
}

/**
 * What UndoRedo records for this plugin: a version that changes whenever the engine's rows or columns
 * are added, removed or reordered, a version that changes whenever a cell write reaches it, and – while
 * the engine's order is not the physical one – the engine's sheet itself.
 */
interface FormulasUndoState {
  readonly structureVersion: number;
  readonly dataVersion: number;
  readonly engineSheet: EngineSheetSnapshot | null;
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
 * This plugin allows you to perform Excel-like calculations in your business applications. It does it by an
 * integration with our other product, [HyperFormula](https://github.com/handsontable/hyperformula/), which is a
 * powerful calculation engine with an extensive number of features.
 *
 * To test out HyperFormula, see [this guide](@/guides/formulas/formula-calculation/formula-calculation.md#available-functions).
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
   * The `setDataAtCell()` / `setDataAtRowProp()` change sets written into the engine that the Core
   * has not applied to the source data yet, keyed by the change array itself (the Core hands the
   * same array to `afterSetDataAtCell` and to `beforeChangeRender`). Each one records the sheet write
   * count and the sheet id at the moment it was written.
   *
   * The plugin writes a change into the engine from `afterSetDataAtCell`, before validation, while
   * the Core applies a validated change to the source data only after its validators resolve, in a
   * microtask. A full sheet write in between - an `updateSettings()` in the same task - scans source
   * data that does not hold the change yet and drops it from the engine, and a sheet switch in
   * between hands the grid another sheet's data, which the change then lands in;
   * `#onBeforeChangeRender` writes it back into the current sheet. A `WeakMap`, so a change set that never reaches `beforeChangeRender` holds
   * nothing alive.
   *
   * @type {WeakMap<CellChange[], ChangeSetAwaitingApply>}
   */
  #changesAwaitingApply = new WeakMap<CellChange[], ChangeSetAwaitingApply>();

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
   * The cells an undo or a redo recalculated when it reloaded the sheet, validated once the restore is
   * done – see `#validateRestoredDependents`.
   */
  #restoredDependentCells: unknown[] = [];

  /**
   * The engine addresses of the cells an undo or a redo wrote, as its `afterChange` reported them. The
   * UndoRedo plugin validates those itself, so they are left out of `#restoredDependentCells`.
   */
  #restoredChangedCells: unknown[] = [];

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
   * The flag that makes a `sheetName` change applied through `updateSettings` bind the sheet
   * without loading its content into the grid. Set by a caller that loads the sheet's data
   * itself right after the update (the SheetsBar plugin), so the grid is loaded once, not twice.
   * That load's `afterLoadData` writes the data into the sheet bound here. A name the engine does
   * not know still goes through `switchSheet`, which reports it.
   *
   * @private
   * @type {boolean}
   */
  skipSheetSwitchLoad = false;

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

    this.engine = setupEngine(this.hot) ?? this.engine;
    this.#ownSheetExists = null;
    this.#sheetsNotNamingOwnSheet.clear();

    if (!this.engine) {
      warn('Missing the required `engine` key in the Formulas settings. Please fill it with either an' +
        ' engine class or an engine instance.');

      return;
    }

    // Useful for disabling -> enabling the plugin using `updateSettings` or the API.
    if (this.sheetName !== null && !this.engine.doesSheetExist(this.sheetName)) {
      const sourceDataArray = this.#getProcessedSourceDataArray();

      this.#escapeSourceDataArray(sourceDataArray);

      const newSheetName = this.addSheet(this.sheetName, sourceDataArray);

      if (typeof newSheetName === 'string') {
        this.#updateSheetNameAndSheetId(newSheetName);
      }
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

    this.addHook('afterSetSourceDataAtCell', this.#onAfterSetSourceDataAtCell);
    this.addHook('afterSetDataAtCell', this.#onAfterSetDataAtCell);
    this.addHook('afterSetDataAtRowProp', this.#onAfterSetDataAtCell);
    this.addHook('beforeChangeRender', this.#onBeforeChangeRender);

    this.addHook('beforeCreateRow', this.#onBeforeCreateRow);
    this.addHook('beforeCreateCol', this.#onBeforeCreateCol);

    this.addHook('afterCreateRow', this.#onAfterCreateRow);
    this.addHook('afterCreateCol', this.#onAfterCreateCol);

    this.addHook('beforeRemoveRow', this.#onBeforeRemoveRow);
    this.addHook('beforeRemoveCol', this.#onBeforeRemoveCol);

    this.addHook('afterRemoveRow', this.#onAfterRemoveRow);
    this.addHook('afterRemoveCol', this.#onAfterRemoveCol);

    this.indexSyncer = new IndexSyncer(
      this.hot.rowIndexMapper, this.hot.columnIndexMapper, (postponedAction: Function) => {
        this.hot.addHookOnce('init', () => {
          // Engine is initialized after executing callback to `afterLoadData` hook. Thus, some actions on indexes should
          // be postponed.
          postponedAction();
        });
      });

    this.rowAxisSyncer = this.indexSyncer.getForAxis('row');
    this.columnAxisSyncer = this.indexSyncer.getForAxis('column');

    this.addHook('afterRowSequenceChange', this.rowAxisSyncer!.getIndexesChangeSyncMethod());
    this.addHook('afterColumnSequenceChange', this.columnAxisSyncer!.getIndexesChangeSyncMethod());
    // Any reorder rewrites formula references inside the engine, a sort included.
    this.addHook('afterRowSequenceChange', this.#onAfterSequenceChange);
    this.addHook('afterColumnSequenceChange', this.#onAfterSequenceChange);

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

    this.addHook('beforeColumnUnfreeze', (column: number, unfreezePerformed: boolean) => {
      const fixedColumnsStart = this.hot.getSettings().fixedColumnsStart;

      this.columnAxisSyncer!.storeMovesInformation(
        [column], fixedColumnsStart! - 1, unfreezePerformed);
    });

    this.addHook('afterColumnUnfreeze', (_column: number, unfreezePerformed: boolean) => {
      this.#trackPeerRewrites(
        () => this.columnAxisSyncer!.calculateAndSyncMoves(unfreezePerformed, unfreezePerformed));
    });

    // Date and preserved-text escaping runs both here (for `updateSettings`-driven
    // initialization, where `afterLoadData` returns early) and in `afterLoadData` /
    // `afterUpdateData`, where the transient meta read provides composed cell properties.
    this.addHook('afterCellMetaReset', this.#onAfterCellMetaReset);
    this.addHook('beforeRender', this.#onBeforeRender);

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
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
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
    const newEngineSettings = getEngineSettingsWithOverrides(this.hot.getSettings());

    if (this.engine && haveEngineSettingsChanged(this.engine.getConfig(), newEngineSettings)) {
      this.engine.updateConfig(newEngineSettings);
    }

    const pluginSettings = this.hot.getSettings()[PLUGIN_KEY];

    if (
      pluginSettings !== undefined &&
      typeof pluginSettings !== 'boolean' &&
      pluginSettings.sheetName !== undefined &&
      // Sheet ids are compared rather than names, because `sheetName` holds the engine's casing
      // while the setting keeps the one it was written with. An unknown name has no id, which
      // still differs from the current one and lets `switchSheet` report it.
      this.engine?.getSheetId(pluginSettings.sheetName) !== this.sheetId
    ) {
      if (this.skipSheetSwitchLoad && this.engine?.doesSheetExist(pluginSettings.sheetName)) {
        this.#updateSheetNameAndSheetId(pluginSettings.sheetName);

      } else {
        this.switchSheet(pluginSettings.sheetName);
      }
    }

    // If no data was passed to the `updateSettings` method and no sheet is connected to the instance -> create a
    // new sheet using the currently used data. Otherwise, it will be handled by the `afterLoadData` call.
    if (!newSettings.data && this.sheetName === null) {
      const formulasSettings = this.hot.getSettings()[PLUGIN_KEY];
      const sheetName = isFormulasSettingsObject(formulasSettings) ? formulasSettings.sheetName : undefined;

      if (sheetName && this.engine?.doesSheetExist(sheetName)) {
        this.switchSheet(sheetName);

      } else {
        const sourceDataArray = this.#getProcessedSourceDataArray();

        this.#escapeSourceDataArray(sourceDataArray);

        const newSheetName = this.addSheet(sheetName ?? undefined, sourceDataArray);

        if (typeof newSheetName === 'string') {
          this.#updateSheetNameAndSheetId(newSheetName);
        }
      }
    }

    this.#refreshHyperlinksSetting();

    super.updatePlugin(newSettings);
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#engineListeners?.forEach(([eventName, listener]) => this.engine?.off(eventName, listener));
    this.#engineListeners = null;

    if (this.engine) {
      unregisterEngine(this.engine, this.hot);
    }

    this.engine = null;
    this.#ownSheetExists = null;

    super.destroy();
  }

  /**
   * Update sheetName and sheetId properties.
   *
   * @param {string} [sheetName] The new sheet name.
   */
  #updateSheetNameAndSheetId(sheetName: string) {
    const sheetId = this.engine?.getSheetId(sheetName) ?? null;

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
   * engine, the created sheet name otherwise.
   */
  addSheet(sheetName?: string | null, sheetData?: unknown[][]): string | boolean {
    if (isDefined(sheetData) && !isArrayOfArrays(sheetData)) {
      warn('The provided data should be an array of arrays.');

      return false;
    }

    if (sheetName !== undefined && sheetName !== null && this.engine?.doesSheetExist(sheetName)) {
      warn('Sheet with the provided name already exists.');

      return false;
    }

    try {
      const actualSheetName = this.engine!.addSheet(sheetName ?? undefined);

      if (sheetData) {
        this.engine!.setSheetContent(this.engine!.getSheetId(actualSheetName), sheetData);
      }

      return actualSheetName;

    } catch (e) {
      warn(e instanceof Error ? e.message : String(e));

      return false;
    }
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
    if (!this.engine?.doesSheetExist(sheetName)) {
      error(`The sheet named \`${sheetName}\` does not exist, switch aborted.`);

      return;
    }

    // Captured BEFORE the id is updated. A reload of the sheet this grid is already synced to - what
    // `#onAfterCellMetaReset` performs on the empty-data branch - can confirm the unescaping against
    // the grid's own source data, which a switch to a genuinely different sheet cannot.
    const isSameSheetReload = this.engine.getSheetId(sheetName) === this.sheetId;

    this.#updateSheetNameAndSheetId(sheetName);

    const unescaped = this.#unescapeEngineSheetArray(
      this.engine.getSheetSerialized(this.sheetId), isSameSheetReload
    );
    // The engine trims each row's trailing empty cells, and the core reads the column count off the
    // first row, so a first row that ends in an emptied cell would load a grid one column short.
    const padded = padRowsToWidestRow(unescaped);
    // A grid whose settings cap the column count below the padded width is left as it was: padding the
    // source rows past that count would make `#areSourceColumnsSkipped()` true, and the next resync would
    // write only the visible columns back into the sheet.
    const serialized = this.#isColumnCountCappedBySettings(padded[0]?.length ?? 0) ? unescaped : padded;

    if (serialized.length > 0) {
      this.hot.loadData(serialized, `${toUpperCaseFirst(PLUGIN_KEY)}.switchSheet`);
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
   * Renders dependent sheets (handsontable instances) based on the changes - list of the
   * recalculated dependent cells.
   *
   * @private
   * @param {object[]} dependentCells The values and location of applied changes within HF engine.
   * @param {boolean} [renderSelf] `true` if it's supposed to render itself, `false` otherwise.
   */
  renderDependentSheets(dependentCells: unknown[], renderSelf = false) {
    const affectedSheetIds = new Set();

    dependentCells.forEach((change: unknown) => {
      // For the Named expression the address is empty, hence the `sheetId` is undefined.
      const sheetId = isHFCellChange(change) ? change.address?.sheet : undefined;

      if (sheetId !== undefined && !affectedSheetIds.has(sheetId)) {
        affectedSheetIds.add(sheetId);
      }
    });

    if (!this.engine) {
      return;
    }

    getRegisteredHotInstances(this.engine).forEach((relatedHot, sheetId) => {
      if (
        (renderSelf || (sheetId !== this.sheetId)) &&
        affectedSheetIds.has(sheetId)
      ) {
        relatedHot.render();
      }
    });
  }

  /**
   * Validates dependent cells based on the cells that are modified by the change.
   *
   * @private
   * @param {object[]} dependentCells The values and location of applied changes within HF engine.
   * @param {object[]} [changedCells] The values and location of applied changes by developer (through API or UI).
   */
  validateDependentCells(dependentCells: unknown[], changedCells: unknown[] = []) {
    const stringifyAddress = (change: unknown) => {
      const address = isHFCellChange(change) ? change.address : undefined;
      const { row, col, sheet } = address ?? {};

      return isDefined(sheet) ? `${sheet}:${row}x${col}` : '';
    };
    const changedCellsSet = new Set(changedCells.map((change: unknown) => stringifyAddress(change)));

    dependentCells.forEach((change: unknown) => {
      const address = isHFCellChange(change) ? change.address : undefined;
      const { row, col, sheet: sheetId } = address ?? {};

      // Don't try to validate cells outside of the visual part of the table.
      if (row === undefined || col === undefined ||
        row >= this.hot.countRows() || col >= this.hot.countCols()) {
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

        // It will just re-render certain cell when necessary.
        boundHot.validateCell(
          boundHot.getDataAtCell(row, col),
          boundHot.getCellMeta(row, col),
          () => {}
        );
      }
    });
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

    if (
      isFormulasUndoState(previous) &&
      previous.structureVersion === this.#structureVersion &&
      previous.dataVersion === this.#dataVersion &&
      this.#pendingPeerRewrites.size === 0
    ) {
      return previous;
    }

    const peerRewrites = Array.from(this.#pendingPeerRewrites.values())
      .filter(rewrite => rewrite.after !== rewrite.before);

    this.#pendingPeerRewrites.clear();

    return {
      structureVersion: this.#structureVersion,
      dataVersion: this.#dataVersion,
      engineSheet: this.#captureEngineSheet(isFormulasUndoState(previous) ? previous.engineSheet : null),
      peerRewrites,
    };
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
      this.#restoredWrites = [];
      this.#structureVersion = state.structureVersion;
      this.#dataVersion = state.dataVersion;

      return;
    }

    if (state.structureVersion !== this.#structureVersion) {
      this.#restoredWrites = [];
      this.#structureVersion = state.structureVersion;
      this.#dataVersion = state.dataVersion;

      const dependentCells = state.engineSheet === null ?
        this.#loadSourceDataIntoSheet() : this.#loadEngineSheet(state.engineSheet);

      dependentCells.forEach((cell) => {
        this.#restoredDependentCells.push(cell);
      });
    } else {
      this.#dataVersion = state.dataVersion;
      this.#flushRestoredWrites();
    }

    this.#restorePeerRewrites(state, context);
  }

  /**
   * A step that changed only data, on a grid in physical order, restores the cells it wrote by prop,
   * so it names no column. A step that reloads the sheet, or restores a serialized one, restores a
   * column layout, so it cannot be kept across a `columns` settings update.
   *
   * @private
   * @param {*} state The state on one side of a step.
   * @param {*} other The state on the other side.
   * @returns {number[]|null}
   */
  getStateColumns(state: unknown, other: unknown): readonly number[] | null {
    if (
      isFormulasUndoState(state) && isFormulasUndoState(other) &&
      state.engineSheet === null && other.engineSheet === null &&
      state.structureVersion === other.structureVersion
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
        formulasRow.forEach((formula, col) => {
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
        const formula: string | undefined = engine.getNamedExpressionFormula(name, scope);

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
      const after: string | undefined = candidate.kind === 'cell' ?
        engine.getCellFormula({ sheet: candidate.sheet, row: candidate.row, col: candidate.col }) :
        engine.getNamedExpressionFormula(candidate.name, candidate.scope);

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
   */
  #restorePeerRewrites(state: FormulasUndoState, context?: PluginRestoreContext) {
    // The step's rewrites are recorded in the state it ended in.
    const stepEnd = context?.direction === 'undo' ? context.other : state;

    if (context?.direction === undefined || !isFormulasUndoState(stepEnd) || stepEnd.peerRewrites.length === 0) {
      return;
    }

    const engine = this.engine!;
    const isUndo = context.direction === 'undo';
    let keptEdited = false;
    const changes = engine.batch(() => {
      stepEnd.peerRewrites.forEach((rewrite) => {
        const expected = isUndo ? rewrite.after : rewrite.before;
        const text = isUndo ? rewrite.before : rewrite.after;

        if (rewrite.kind === 'cell') {
          const address = { sheet: rewrite.sheet, row: rewrite.row, col: rewrite.col };

          if (engine.getSheetName(rewrite.sheet) === undefined) {
            return;
          }

          if (engine.getCellFormula(address) !== expected) {
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

        if (engine.getNamedExpressionFormula(rewrite.name, rewrite.scope) !== expected) {
          keptEdited = true;
        } else if (text !== undefined &&
            engine.isItPossibleToChangeNamedExpression(rewrite.name, text, rewrite.scope)) {
          engine.changeNamedExpression(rewrite.name, text, rewrite.scope,
            engine.getNamedExpression(rewrite.name, rewrite.scope)?.options);
        }
      });
    });

    if (keptEdited) {
      warnOnce(this.hot, 'formulas.undoKeptEditedPeerFormula', toSingleLine`Formulas: an undo or a redo left\x20
        a formula in another sheet or a named expression as it was, because it was edited after the step.`);
    }

    changes.forEach((cell) => {
      this.#restoredDependentCells.push(cell);
    });
    this.renderDependentSheets(changes);
    this.#syncPeerSources(stepEnd.peerRewrites);
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

      peerHot._getOperationScope().suppress(() => peer.#syncFormulasToSourceData(true, cells));
    });
  }

  /**
   * Returns the engine's sheet while its order is not the physical one, and `null` otherwise – the
   * source data rebuilds a sheet in physical order. A row that reads the same as in the previous
   * capture is that capture's row array, so consecutive steps share what they did not change: each
   * step keeps the rows it changed, not a copy of the whole sheet.
   *
   * @param {object|null} previous The sheet the previous capture returned.
   * @returns {object|null}
   */
  #captureEngineSheet(previous: EngineSheetSnapshot | null): EngineSheetSnapshot | null {
    if (
      !this.engine || this.sheetId === null ||
      (this.rowAxisSyncer!.isHfOrderPhysical() && this.columnAxisSyncer!.isHfOrderPhysical())
    ) {
      return null;
    }

    const content: unknown[][] = this.engine.getSheetSerialized(this.sheetId);

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
   * Loads a recorded engine sheet back, in the order it was recorded in, and returns the cells whose
   * values changed.
   *
   * @param {object} snapshot The recorded sheet.
   * @returns {Array}
   */
  #loadEngineSheet(snapshot: EngineSheetSnapshot): unknown[] {
    this.#internalOperationPending = true;

    try {
      const dependentCells = this.engine!.setSheetContent(this.sheetId, snapshot.content);

      this.rowAxisSyncer!.adoptEngineOrder(snapshot.rowOrder);
      this.columnAxisSyncer!.adoptEngineOrder(snapshot.columnOrder);
      this.renderDependentSheets(dependentCells);

      return dependentCells;
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

    return this.engine?.setCellContents(address, newValue);
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
   * The whole scan is skipped – just like the escape scan – when `#needsEngineBoundEscaping()`
   * reports that no configuration layer can mark a cell for escaping, so a sheet switch in the
   * default configuration pays no per-cell meta read. Within the scan, values the unescaping can
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
   * The scan is skipped entirely when `#needsEngineBoundEscaping()` reports that no configuration
   * layer can mark a cell for escaping.
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
   * @param {Array<Array<*>>} sourceDataArray Source data array to process.
   * @param {number} [rowOffset=0] Physical row index of the array's first row (non-zero for partial arrays).
   * @param {number} [columnOffset=0] Index of the array's first column, in the array's own column space.
   */
  #escapeSourceDataArray(sourceDataArray: unknown[][], rowOffset = 0, columnOffset = 0) {
    if (!this.#needsEngineBoundEscaping()) {
      return;
    }

    const columnsInVisualOrder = !this.#doesEngineHoldPhysicalColumns();
    const metaManager = this.hot._getMetaManager();

    sourceDataArray.forEach((rowData: unknown[], arrayRowIndex: number) => {
      const physicalRow = rowOffset + arrayRowIndex;
      const visualRow = this.hot.toVisualRow(physicalRow) ?? physicalRow;

      rowData.forEach((cellValue: unknown, arrayColumnIndex: number) => {
        // Values that the escaping can never change – non-strings, and formulas, which the engine
        // parses on its own – skip the meta read altogether. That read is the expensive part of
        // this full-dataset scan, and it runs the user-provided `cells` function.
        if (typeof cellValue !== 'string' || isFormula(cellValue)) {
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
   * @param {*} value The cell value to validate.
   * @param {number} visualRow The visual row index.
   * @param {number|string} prop The visual column index or property name of the column.
   * @returns {*} Returns value to validate.
   */
  #onBeforeValidate = (value: unknown, visualRow: number, prop: number | string) => {
    const visualColumn = this.hot.propToCol(prop);

    // A prop that names no existing column has no engine address to validate against.
    if (visualColumn === null) {
      return value;
    }

    if (this.isFormulaCellType(visualRow, visualColumn)) {
      const address = {
        row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow),
        col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn),
        sheet: this.sheetId,
      };

      const cellMeta = this.hot.getCellMetaTransient(visualRow, visualColumn);
      let cellValue = this.engine!.getCellValue(address); // Date as an integer (Excel-like date).

      if (cellMeta.type === 'date' && isNumeric(cellValue)) {
        cellValue = getDateFromExcelDate(cellValue);
      } else if (cellMeta.type === 'time' && isNumeric(cellValue)) {
        cellValue = getTimeFromHfTimeFraction(cellValue as number);
      }

      // If `cellValue` is an object it is expected to be an error
      return hasValueProperty(cellValue) ? cellValue.value : cellValue;
    }

    return value;
  };

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

    const fillRangeData = this.engine!.getFillRangeData(engineSourceRange, engineTargetRange);
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
   * `beforeLoadData` hook callback.
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
    this.#hotWasInitializedWithEmptyData = isUndefined(this.hot.getSettings().data);
  };

  /**
   * Callback to `afterCellMetaReset` hook which is triggered after setting cell meta.
   *
   * The Core fires it in the middle of `updateSettings()`, before `afterUpdateSettings` and so
   * before any plugin has applied the new settings. A scan run here describes the layout the
   * plugins are about to replace, so outside of construction the scan is only recorded as owed
   * and `#resyncSheet` runs it later, once per cycle - see `#sheetResyncPending`. Construction
   * has no `afterUpdateSettings` pass (the Core skips the hook on its first run), so the scan
   * stays eager there; `hot.view` is what the Core creates right after that first run.
   */
  #onAfterCellMetaReset = () => {
    this.#closeLeakedGuards();

    // The reload below and the scan in `#resyncSheet` both run a full-dataset read whose per-cell
    // meta read fires `cells()` and the `beforeGetCellMeta`/`afterGetCellMeta` listeners – see
    // `#escapeSourceDataArray` for what that changes for a listener with side effects.
    if (this.#hotWasInitializedWithEmptyData) {
      if (this.sheetName !== null) {
        this.switchSheet(this.sheetName);
      }

      this.#recordSyncedLayout();

      return;
    }

    if (this.hot.view) {
      this.#sheetResyncPending = true;
      this.#sheetIdAtLastSync = this.sheetId;

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

    const sourceDataArray = this.#getProcessedSourceDataArray();

    if (!this.engine!.isItPossibleToReplaceSheetContent(this.sheetId, sourceDataArray)) {
      this.#clearRejectedSheet();

      return;
    }

    this.#writeSheet(sourceDataArray);
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
   * @param {Array<Array<*>>} sourceDataArray The array `#getProcessedSourceDataArray()` produced.
   */
  #writeSheet(sourceDataArray: unknown[][]): unknown[] {
    this.#escapeSourceDataArray(sourceDataArray);

    this.#internalOperationPending = true;

    let dependentCells: unknown[] = [];

    try {
      this.#sheetWriteCount += 1;

      dependentCells = this.engine!.setSheetContent(this.sheetId, sourceDataArray);

      this.indexSyncer!.setupSyncEndpoint(this.engine!, this.sheetId);
      this.renderDependentSheets(dependentCells);
    } finally {
      this.#internalOperationPending = false;
    }

    this.#recordSyncedLayout();

    return dependentCells;
  }

  /**
   * Empties the sheet when the engine cannot hold the grid's layout - it exceeds the engine's
   * `maxRows` or `maxColumns` - and warns. Leaving the sheet untouched would keep the previous
   * data in the engine while the grid already shows the new one, so stale values would be served;
   * emptying it changes what every grid reading it computes, hence the dependent redraw. The
   * layout is recorded so the late `afterUpdateSettings` listener does not take the emptied sheet
   * for a row-count change and scan a layout the engine just rejected.
   */
  #clearRejectedSheet(): unknown[] {
    this.#internalOperationPending = true;

    let dependentCells: unknown[] = [];

    try {
      dependentCells = this.engine!.setSheetContent(this.sheetId, [[]]);

      this.renderDependentSheets(dependentCells);
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
   */
  #onBeforeRender = () => {
    if (this.engine && this.#sheetResyncPending) {
      this.#resyncSheet();
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

    if (source.includes(toUpperCaseFirst(PLUGIN_KEY))) {
      return;
    }

    if (!this.engine) {
      return;
    }

    this.#closeLeakedGuards();

    const formulasSettings = this.hot.getSettings()[PLUGIN_KEY];
    const settingsSheetName = isFormulasSettingsObject(formulasSettings) ? formulasSettings.sheetName : undefined;
    // Fall back to the sheet this instance already owns. Without it every `loadData`/`updateData`
    // call adds a sheet and abandons the previous one - with its whole dependency graph - inside
    // the engine, which the engine then recalculates on every subsequent call.
    const sheetName = setupSheet(this.engine, settingsSheetName ?? this.sheetName);

    this.#updateSheetNameAndSheetId(sheetName);

    if (source === 'updateSettings') {
      // For performance reasons, the initialization will be done in afterCellMetaReset hook
      return;
    }

    if (!this.#hotWasInitializedWithEmptyData) {
      // Records the layout too, so a settings update this load ran inside of has no row-count change
      // left to carry.
      this.#loadSourceDataIntoSheet();

    } else if (this.sheetName !== null) {
      this.switchSheet(this.sheetName);
    }
  };

  /**
   * Fills the sheet with the source data, renders the grids that read it, and returns the cells
   * whose values changed. When the data does not fit the engine, the sheet is emptied instead.
   *
   * @returns {Array} The engine's changes.
   */
  #loadSourceDataIntoSheet(): unknown[] {
    // Whatever this writes supersedes a resync still owed from a settings update it interrupted.
    this.#sheetResyncPending = false;

    const sourceDataArray = this.#getProcessedSourceDataArray();

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

    fastInnerText(TD, String(this.engine!.getCellSerialized(address)));
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

        data[rowIndex][columnIndex] = this.engine!.getCellSerialized(address);
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

    valueHolder.value = this.engine!.getCellSerialized(address);
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

    const { dependentCells, changedCells, outOfBoundsChanges } = this.#writeChangesToEngine(changes);
    const awaitingApply: ChangeSetAwaitingApply = {
      writeCount: this.#sheetWriteCount,
      sheetId: this.sheetId,
      writtenBack: false,
    };

    this.#changesAwaitingApply.set(changes, awaitingApply);

    if (outOfBoundsChanges.length) {
      // Workaround for rows/columns being created two times (by HOT and the engine).
      // (unfortunately, this requires an extra re-render)
      this.hot.addHookOnce('afterChange', () => {
        // A write-back in `beforeChangeRender` already wrote the whole set, these changes included,
        // once the Core had created their rows and columns. A second write would add a second
        // engine undo entry for one grid action, and a grid undo would revert only one of them.
        if (awaitingApply.writtenBack) {
          return;
        }

        const outOfBoundsDependentCells = this.engine!.batch(() => {
          outOfBoundsChanges.forEach(([row, column, newValue]) => {
            this.syncChangeWithEngine(row, column, newValue);
          });
        });

        this.renderDependentSheets(outOfBoundsDependentCells, true);
      });
    }

    this.renderDependentSheets(dependentCells);
    this.validateDependentCells(dependentCells, changedCells);
  };

  /**
   * Writes a `setDataAtCell()` / `setDataAtRowProp()` change set into the engine, in one batch.
   * A change whose row or column does not exist yet is not written: it is returned in
   * `outOfBoundsChanges` for the caller to write once the Core created it.
   *
   * @param {Array[]} changes An array of changes in format [[row, prop, oldValue, value], ...].
   * @returns {{ dependentCells: unknown[], changedCells: unknown[], outOfBoundsChanges: Array[] }}
   */
  #writeChangesToEngine(changes: CellChange[]) {
    const outOfBoundsChanges: [number, number, unknown][] = [];
    const changedCells: unknown[] = [];

    this.#markDataChanged();

    const dependentCells = this.engine!.batch(() => {
      changes.forEach(([visualRow, prop, , newValue]) => {
        if (typeof prop !== 'string' && typeof prop !== 'number') {
          return;
        }
        // This hook runs before the change is applied, so a write past the last column on array
        // data addresses a column that does not exist yet. Its index is kept, as in `dataChange.ts`,
        // so the value still reaches the engine through the out-of-bounds path below.
        const visualColumn = this.hot.propToCol(prop) ?? (typeof prop === 'number' ? prop : null);

        // A property that names no column has no engine address to sync.
        if (visualColumn === null) {
          return;
        }

        const physicalRow = this.hot.toPhysicalRow(visualRow);
        const physicalColumn = this.hot.toPhysicalColumn(visualColumn);
        const address = {
          row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow),
          col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn),
          sheet: this.sheetId,
        };

        newValue = this.#getValueGetterValue(physicalRow, physicalColumn, newValue);

        if (physicalRow !== null && physicalColumn !== null) {
          this.syncChangeWithEngine(visualRow, visualColumn, newValue);

        } else {
          outOfBoundsChanges.push([visualRow, visualColumn, newValue]);
        }

        changedCells.push({ address });
      });
    });

    return { dependentCells, changedCells, outOfBoundsChanges };
  }

  /**
   * `beforeChangeRender` hook callback.
   *
   * Writes a change set back into the engine when a full sheet write from the source data replaced
   * the sheet, or a sheet switch replaced the grid's data, between `afterSetDataAtCell` (where the
   * change first reached the engine) and now, when the Core applied it. `beforeChangeRender` is the first hook `applyChanges` runs on its own
   * after it writes the set to the data (the row and column hooks of `alter()`, such as
   * `beforeCreateRow`/`afterCreateRow`, can fire before it, from `writeChangesToData` and
   * `adjustRowsAndCols`, when a change lies out of bounds). It runs before the render that follows, so
   * the cell never paints its raw formula text. That window
   * is open while the Core validates a change, which it does in a microtask, so an `updateSettings()`
   * in the same task rebuilds the sheet from source data that does not hold the change yet. After a
   * sheet switch, the Core applies the change to the data of the sheet the grid shows now, so the
   * set is written into that sheet - the current `sheetId` - for the engine to hold what the grid
   * holds. A switch alone writes no sheet, so the sheet id, not the write count, detects it.
   *
   * By now the Core has created the rows and columns an out-of-bounds change needed, so the whole set
   * is written in one batch - one engine undo entry for one grid action - and the deferred
   * `afterChange` write of those changes is skipped. The dependents the write recalculated are
   * validated, as on the `afterSetDataAtCell` path.
   *
   * @param {Array[]|null} changes An array of changes in format [[row, prop, oldValue, value], ...].
   */
  #onBeforeChangeRender = (changes: CellChange[] | null) => {
    const awaitingApply = changes ? this.#changesAwaitingApply.get(changes) : undefined;

    if (!changes || !awaitingApply) {
      return;
    }

    this.#changesAwaitingApply.delete(changes);

    if (
      !this.engine ||
      (awaitingApply.writeCount === this.#sheetWriteCount && awaitingApply.sheetId === this.sheetId) ||
      changes.length === 0
    ) {
      return;
    }

    const { dependentCells, changedCells } = this.#writeChangesToEngine(changes);

    awaitingApply.writtenBack = true;

    this.renderDependentSheets(dependentCells);
    this.validateDependentCells(dependentCells, changedCells);
  };

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
      this.engine!.setCellContents(address, newValue).forEach((dependentCell: unknown) => {
        dependentCells.push(dependentCell);
      });
    });

    if (restored) {
      this.engine!.batch(writeAll).forEach((dependentCell: unknown) => {
        dependentCells.push(dependentCell);
      });
    } else {
      writeAll();
    }

    this.renderDependentSheets(dependentCells, restored);
    this.validateDependentCells(dependentCells, changedCells);
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

    // Once rows or columns have been moved or sorted, the engine and the source data no longer
    // share a reference frame, and the engine's formulas would be wrong in the source data's terms.
    if (!this.rowAxisSyncer!.isHfOrderPhysical() || !this.columnAxisSyncer!.isHfOrderPhysical()) {
      return;
    }

    const engine = this.engine;
    const sheetId = engine.getSheetId(this.sheetName)!;
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
    const collect = (hfRow: number, hfColumn: number, formula: string | undefined) => {
      const change = formula === undefined ? null :
        this.#readSourceChange(hfRow, hfColumn, formula, allowBrokenReferences, holdsPhysicalColumns);

      if (change !== null) {
        changes.push(change);
      }
    };

    // Compare against what Handsontable stores, not against what it reports - `#onModifySourceData`
    // would otherwise answer with the engine's formula and hide every diff.
    this.#internalOperationPending = true;

    try {
      if (cells === undefined) {
        engine.getSheetFormulas(sheetId).forEach((formulasRow, hfRow) => {
          formulasRow?.forEach((formula, hfColumn) => collect(hfRow, hfColumn, formula));
        });
      } else {
        cells.forEach(({ row, col }) => collect(row, col, engine.getCellFormula({ sheet: sheetId, row, col })));
      }
    } finally {
      this.#internalOperationPending = false;
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
  }

  /**
   * Returns the source data write that brings one engine formula into the source data, or `null`
   * when the source already holds it or must not get it. The engine order must be the physical one.
   *
   * @param {number} hfRow The engine row – the physical row, in the physical order.
   * @param {number} hfColumn The engine column.
   * @param {string} formula The engine's formula.
   * @param {boolean} allowBrokenReferences `true` to write a `#REF!` the source does not hold yet.
   * @param {Function} holdsPhysicalColumns Tells whether the engine holds the columns in physical order.
   * @returns {Array|null} The write, as `[physicalRow, prop, formula]`.
   */
  #readSourceChange(
    hfRow: number,
    hfColumn: number,
    formula: string,
    allowBrokenReferences: boolean,
    holdsPhysicalColumns: () => boolean,
  ): [number, string | number, unknown] | null {
    // The engine's index IS the physical index in the physical order, so trimmed rows (Filters,
    // `trimRows`) are reached too – they hold formulas that need the same catch-up.
    const physicalRow = hfRow;
    const column = this.#resolveEngineColumn(hfColumn, holdsPhysicalColumns());

    if (column === null) {
      return null;
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
      return null;
    }

    return [physicalRow, column.prop, formula];
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

    if (isBlockedSource(source) || isRestoreSource(source)) {
      return;
    }

    this.#markStructureChanged();

    const changes = this.#trackPeerRewrites(() => this.engine!.addRows(this.sheetId,
      [this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow), amount]));

    this.#syncFormulasToSourceData();
    this.renderDependentSheets(changes);
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

    if (isBlockedSource(source) || isRestoreSource(source)) {
      return;
    }

    this.#markStructureChanged();

    const changes = this.#trackPeerRewrites(() => this.engine!.addColumns(this.sheetId,
      [this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn), amount]));

    this.#syncFormulasToSourceData();
    this.renderDependentSheets(changes);
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

    if (isBlockedSource(source) || isRestoreSource(source)) {
      return;
    }

    this.#markStructureChanged();

    const removedSpans = coalesceIndexesToSpans(this.rowAxisSyncer!.getRemovedHfIndexes());

    const changes = this.#trackPeerRewrites(() => this.engine!.batch(() => {
      this.#removeSpansFromEngine(removedSpans, 'removeRows');
    }));

    this.#syncFormulasToSourceData(true);
    this.renderDependentSheets(changes);
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

    if (isBlockedSource(source) || isRestoreSource(source)) {
      return;
    }

    this.#markStructureChanged();

    const removedSpans = coalesceIndexesToSpans(this.columnAxisSyncer!.getRemovedHfIndexes());

    const changes = this.#trackPeerRewrites(() => this.engine!.batch(() => {
      this.#removeSpansFromEngine(removedSpans, 'removeColumns');
    }));

    this.#syncFormulasToSourceData(true);
    this.renderDependentSheets(changes);
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
    try {
      if (isCopy) {
        // copy() reads cell values and cannot run inside batch() (evaluation must not be suspended).
        this.engine.copy(source);
        this.#moveCellsChanges = this.engine.paste(dest);
      } else {
        this.#moveCellsChanges = this.#trackPeerRewrites(() => this.engine!.batch(() => {
          this.engine!.moveCells(source, dest);
        }));
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

    if (dependentCells !== null) {
      this.renderDependentSheets(dependentCells, true);
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

    // Build target values from HF serialized content (formula strings or raw values).
    const targetData: unknown[][] = [];

    for (let r = 0; r < height; r++) {
      const row: unknown[] = [];

      for (let c = 0; c < width; c++) {
        const hfRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(tgtFromRow + r);
        const hfCol = this.columnAxisSyncer!.getHfIndexFromVisualIndex(tgtFromCol + c);
        const serialized = this.engine!.getCellSerialized({
          sheet: this.sheetId,
          row: hfRow,
          col: hfCol,
        });

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
   * left open by a throw from `setSheetContent`, `setupSyncEndpoint`, or `renderDependentSheets`,
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

      rowsData.forEach((row: unknown[], relativeRowIndex: number) => {
        row.forEach((value: unknown, colIndex: number) => {
          this.engine?.setCellContents({
            col: colIndex,
            row: finalElementRowIndex + relativeRowIndex,
            sheet: this.sheetId
          }, [[value]]);
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
