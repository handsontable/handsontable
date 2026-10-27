import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import type { HookCallback } from '../../core/hooks/bucket';
import { SheetModel, clampSheetName, type Sheet, type SheetDescriptor } from './sheetModel';
import { SheetsBarUI } from './ui/bar';
import { TabStrip, type TabBox, type TabStripMotion } from './ui/tabStrip';
import { resolveSwitchTransition, pillDurationMs, tabSlideDurationMs } from './ui/switchTiming';
import { MotionGate } from './ui/motionGate';
import {
  isValidAnimationSetting,
  keepAnimatedMotion,
  resolveAnimationSetting,
  type SheetsBarAnimationSettings,
  type SheetsBarMotion,
} from './ui/animationSettings';
import { SheetsBarMenus } from './ui/menus';
import { OverflowController } from './ui/overflow';
import {
  captureViewState,
  clearFrozenCountShadow,
  clearCustomBorders,
  clearMergedCells,
  FROZEN_COUNT_KEYS,
  keepSelectionOnPage,
  rebuildCustomBordersFromCellMeta,
  resetViewState,
  resetViewport,
  restoreViewState,
  restoreViewport,
  type TrackedCellMeta,
  type ViewState,
  type FrozenCountKey,
  type ViewStatePart,
  VIEW_STATE_PARTS,
} from '../../utils/viewState/viewState';
import { withoutUndoEntry } from '../../utils/viewState/withoutUndoEntry';
import * as C from '../../i18n/constants';
import { announce } from '../../utils/a11yAnnouncer';
import { isRootInstance } from '../../utils/rootInstance';
import { deepClone, isPlainObject } from '../../helpers/object';
import { normalizeFixedColumnsAlias, renameFixedColumnsLeft } from '../../core/fixedColumnsAlias';
import {
  formatSheetName, isUnquotedSheetName, quoteUnreadableSheetNames, rewriteSheetReferences,
} from '../../utils/formulaReferences';
import {
  collectFormulaTextChanges, getEngineCellKeys, getEngineColumnLayout, isChangeTargetFrozen, listSheetRows, readCell,
  toEngineContent, writeFormulaTextChanges,
} from './formulaSheetData';
import type { FormulaTextChange, SheetLayoutSettings } from './formulaSheetData';
import { error as logError, warn, warnOnce } from '../../helpers/console';
import { isHTMLElement } from '../../helpers/dom/element';
import { syncIcon } from '../../themes/engine/icons';
import type { CellOptionMetaEntry, HotInstance, KeptCellMetas } from '../../core/types';
import type { GridSettings } from '../../core/settings';
import type {
  DataProvider,
  DataProviderConfig,
  DataProviderContextOwner,
  DataProviderDetachedOutcome,
  DataProviderFetchResult,
  DataProviderRequestKind,
} from '../dataProvider/dataProvider';
import type { FormulasEngineSheetOrder } from '../formulas/formulas';

export const PLUGIN_KEY = 'sheetsBar';
export const PLUGIN_PRIORITY = 910;
const LAYOUT_WEIGHT = 50;
const SHORTCUTS_CONTEXT_NAME = `plugin:${PLUGIN_KEY}`;
const SHORTCUTS_GROUP = PLUGIN_KEY;

/**
 * Source tag for operations initiated through the public plugin API.
 */
export const SOURCE_API = 'SheetsBar.api';
/**
 * Source tag for operations initiated from the bar UI.
 */
export const SOURCE_UI = 'SheetsBar.ui';

/**
 * `warnOnce` key for the grid-level `dataProvider` that the sheets bar disables.
 */
const GRID_LEVEL_DATA_PROVIDER_WARN_KEY = 'sheetsBar.gridLevelDataProvider';

/**
 * Console message for the grid-level `dataProvider` that the sheets bar disables.
 */
const GRID_LEVEL_DATA_PROVIDER_WARNING = 'The grid-level `dataProvider` is disabled while `sheetsBar` is ' +
  'enabled. Declare `dataProvider` in the `settings` of each sheet that loads from a server.';

/**
 * Console message for an `activeSheet` setting whose switch was refused: another switch is running (the
 * value came from a listener of that switch), a cell value still waits for its validator, or the cell
 * editor holds a value its validator rejected.
 */
const ACTIVE_SHEET_REFUSED_WARNING = 'The `activeSheet` setting was not applied because another sheet switch ' +
  'is running, or a cell value is still being validated or was rejected. Send the same value again once the ' +
  'switch has finished or the cell is saved.';

/**
 * The warning a rename, an add, a duplicate or a removal logs when it is refused, before anything changes,
 * because the `sheets` array or the sheet's entry is frozen.
 */
const SHEETS_NOT_WRITABLE_ERROR = 'The sheets bar writes renamed, added and removed sheets into the ' +
  '`sheetsBar.sheets` array, and that array or its entry is frozen. Pass a mutable array.';

/**
 * A sheet definition accepted by the `sheets` setting.
 */
export interface SheetsBarSheetConfig {
  name?: string;
  data?: unknown[];
  settings?: Record<string, unknown>;
}

/**
 * The object form of the `sheetsBar` setting.
 */
export interface SheetsBarSettings {
  sheets?: SheetsBarSheetConfig[] | null;
  activeSheet?: number;
  controls?: boolean;
  paging?: boolean;
  position?: 'top' | 'bottom';
  uiContainer?: HTMLElement | null;
  animation?: boolean | SheetsBarAnimationSettings;
}

export type { SheetsBarAnimationSettings } from './ui/animationSettings';

/**
 * The tab positions a change that moves tabs recorded before the repaint, the transition the
 * slide runs with, and the motion that started it.
 */
interface TabMotion {
  from: Map<number, number>;
  transitionMs: number;
  motion: 'remove' | 'move';
}

/**
 * User-set cell meta keys a sheet does not keep when the user leaves it. `hidden` and `spanned` are
 * MergeCells' own bookkeeping, not options: the switch restores the merges, which writes them again, and a
 * kept copy would stay on the cells of a stored merge that no longer fits and is dropped. `valid` is read
 * from core's own list of the cells whose meta holds `valid: false` instead, whatever wrote it, so only a
 * `valid: false` is kept and a `valid: true` is dropped.
 */
const UNKEPT_META_KEYS = new Set(['valid', 'hidden', 'spanned']);

/**
 * The undo step types (and operation names) that insert, remove or move rows, columns or cells: the
 * steps whose undo or redo makes the formula engine rewrite references other sheets hold.
 */
const STRUCTURAL_STEPS = new Set([
  'insert_row', 'insert_col', 'remove_row', 'remove_col', 'row_move', 'col_move', 'move_cells', 'nested_rows_detach',
]);

/**
 * Whether a row or column insert or removal with this source reached the formula engine as it happened:
 * the rows the minimum sizes add (`auto`) never do, and an undo or redo replays its rows before the engine
 * is put back.
 *
 * @param {string} [source] The operation source.
 * @returns {boolean}
 */
function isEngineChangingSource(source?: string): boolean {
  return source !== 'auto' && !source?.startsWith('UndoRedo.');
}

/**
 * Baseline keys a later grid-level `updateSettings()` does not refresh through the generic rule, because
 * each has a rule of its own: the bar blocks a grid-level `dataProvider`, and the grid-level `columnSummary`
 * and `cell` also drop the state each sheet stored for the previous value.
 */
const SELF_BASELINED_KEYS = new Set(['dataProvider', 'columnSummary', 'cell']);

/**
 * Keys the settings filter never takes off a payload, even when the visible sheet declares them: the bar
 * itself, `data` (`#keepDeclaredSheetRows` keeps the visible rows) and `dataProvider` (the bar's own gate
 * decides it).
 */
const UNFILTERED_SETTING_KEYS = new Set([PLUGIN_KEY, 'data', 'dataProvider']);

/**
 * Keys `updateSheetSettings()` does not take: the bar itself, which a sheet cannot reconfigure, and `data`,
 * which is the sheet's `data` in the host's `sheets` array, not one of its settings.
 */
/**
 * The view-state parts each setting declares. A hidden sheet that `updateSheetSettings()` gives one of these
 * settings resets the parts on its next visit, so the new value applies, instead of restoring what the sheet
 * kept for them. The sort and the row order go together: the kept order is the sorted one, a row order
 * restored without its sort clears the sort, and a sort restored without its row order re-sorts the kept
 * unsorted order over a new one.
 */
const VIEW_STATE_PARTS_BY_SETTING: Partial<Record<string, ViewStatePart[]>> = {
  manualColumnMove: ['columnOrder'],
  manualRowMove: ['rowOrder', 'sort'],
  columnSorting: ['sort', 'rowOrder'],
  multiColumnSorting: ['sort', 'rowOrder'],
  filters: ['filters'],
  trimRows: ['trimmedRows'],
  hiddenRows: ['hiddenRows'],
  hiddenColumns: ['hiddenColumns'],
  nestedRows: ['collapsedRows'],
  colWidths: ['columnWidths'],
  manualColumnResize: ['columnWidths'],
  rowHeights: ['rowHeights'],
  manualRowResize: ['rowHeights'],
};

/**
 * Whether a setting name is one of the four frozen counts.
 *
 * @param {string} key The setting name.
 * @returns {boolean}
 */
function isFrozenCountKey(key: string): key is FrozenCountKey {
  return FROZEN_COUNT_KEYS.some(frozenKey => frozenKey === key);
}

const UNSETTABLE_SHEET_KEYS = new Set([PLUGIN_KEY, 'data']);

/**
 * The warning a top-level `data` beside a declared workbook raises, once, at init or on an update.
 */
const TOP_LEVEL_DATA_WARNING = 'The `data` setting is ignored when `sheetsBar.sheets` declares a workbook — ' +
  'each sheet declares its own data.';

/**
 * Compares two values structurally, with two deliberate reference-equality floors: arrays are
 * compared element by element, object literals key by key (`isObjectLiteral`), dates by their time value,
 * and everything else — a class instance such as a HyperFormula engine, a function, a DOM element — by reference,
 * since a copy of those is a different thing, not an equal one. A date is a value: a framework
 * wrapper rebuilds an inline `new Date(...)` on every render, and two invalid dates are equal too.
 *
 * `compared` holds the pairs already being compared, so an object literal that refers to itself (a tree
 * node pointing at its parent) ends the walk instead of recursing until the stack overflows. The
 * comparison runs against a copy (`copySettingsValue`), never the host's object itself, so the two sides
 * are never the same reference.
 */
function isStructurallyEqual(a: unknown, b: unknown, compared = new WeakMap<object, Set<unknown>>()): boolean {
  if (a === b) {
    return true;
  }

  if (a instanceof Date && b instanceof Date) {
    const aTime = a.getTime();
    const bTime = b.getTime();

    return aTime === bTime || (Number.isNaN(aTime) && Number.isNaN(bTime));
  }

  const isArrayPair = Array.isArray(a) && Array.isArray(b);
  const isObjectPair = isObjectLiteral(a) && isObjectLiteral(b);

  if (!isArrayPair && !isObjectPair) {
    return false;
  }

  const pairs = compared.get(a as object) ?? new Set<unknown>();

  if (pairs.has(b)) {
    return true;
  }

  pairs.add(b);
  compared.set(a as object, pairs);

  if (isArrayPair) {
    const left = a as unknown[];
    const right = b as unknown[];

    return left.length === right.length
      && left.every((entry, index) => isStructurallyEqual(entry, right[index], compared));
  }

  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const leftKeys = Object.keys(left);

  return leftKeys.length === Object.keys(right).length
    && leftKeys.every(key => key in right && isStructurallyEqual(left[key], right[key], compared));
}

/**
 * Tells whether a value is an entry of the `sheets` setting: an object. A Vue reactive array hands back a
 * proxy of the object pushed into it, and the bar keeps that proxy, so its later writes reach the host's
 * reactivity.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
function isSheetConfig(value: unknown): value is SheetsBarSheetConfig {
  return isPlainObject(value);
}

/**
 * Tells whether a sheet declares its own `columnSummary` in its settings.
 *
 * @param {object|null} sheet The sheet record.
 * @returns {boolean}
 */
function declaresColumnSummary(sheet: Sheet | null | undefined): boolean {
  return isPlainObject(sheet?.settings) && 'columnSummary' in sheet.settings;
}

/**
 * Compares two entries of the `sheets` setting. Entries are equal when they carry the same
 * name, hand over the same `data` array, and declare structurally equal `settings`. The data
 * arrays are compared by reference on purpose — a workbook's data can be arbitrarily large —
 * while the settings objects are compared by content, so a framework wrapper re-emitting a
 * fresh-but-identical settings literal on every render does not read as a new workbook.
 */
function isSameSheetConfig(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (!isPlainObject(a) || !isPlainObject(b)) {
    return false;
  }

  return a.name === b.name && a.data === b.data && isStructurallyEqual(a.settings, b.settings);
}

/**
 * Compares two values of the `sheets` setting. Used to tell an `updateSettings` call that
 * re-emits or leaves out the workbook — a framework wrapper's full re-emit, or a partial
 * payload changing a UI-only key — apart from one that genuinely declares a different
 * workbook. Only `sheets` decides the workbook's identity: the UI keys are re-read on every
 * enable, so changing them must not discard the runtime sheets and their view state.
 */
function isSameSheetsList(a: unknown, b: unknown): boolean {
  if ((a ?? null) === (b ?? null)) {
    return true;
  }

  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }

  return a.every((entry, index) => isSameSheetConfig(entry, b[index]));
}

/**
 * Tells whether a value is an object literal: an object whose prototype is `Object.prototype` or `null`.
 * `isPlainObject` also answers `true` for a class instance such as a HyperFormula engine.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
function isObjectLiteral(value: unknown): boolean {
  if (!isPlainObject(value)) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

/**
 * Copies a settings value for a snapshot: arrays and object literals are copied level by level, a date is
 * copied by its time value, and everything else is kept by reference. A class instance such as a
 * HyperFormula engine is not copied: its object graph has cycles, and copying it never ended. A kept
 * reference still compares equal to itself. A date is copied because the host can edit it in place
 * (`setFullYear()`) and send it again, and a kept reference would compare the edited date with itself.
 *
 * `copies` maps every array and object literal already copied to its copy, so a value that refers to itself
 * is copied with the same shape instead of recursing until the stack overflows, and a sub-object two keys
 * share is copied once.
 */
function copySettingsValue(value: unknown, copies = new WeakMap<object, unknown>()): unknown {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (!Array.isArray(value) && !isObjectLiteral(value)) {
    return value;
  }

  const source = value as object;

  if (copies.has(source)) {
    return copies.get(source);
  }

  if (Array.isArray(source)) {
    const copy: unknown[] = [];

    copies.set(source, copy);
    source.forEach((entry: unknown) => {
      copy.push(copySettingsValue(entry, copies));
    });

    return copy;
  }

  const copy: Record<string, unknown> = {};

  copies.set(source, copy);
  Object.entries(source).forEach(([key, entry]) => {
    copy[key] = copySettingsValue(entry, copies);
  });

  return copy;
}

/**
 * Takes a snapshot of a `sheets` value for {@link isSameSheetsList}: the array and each entry are copied,
 * each entry's `settings` level by level, and its `data` is kept by reference. A host that edits its own
 * array or a sheet's settings object in place and sends it again otherwise compares it with itself, and
 * the change is ignored.
 */
function snapshotSheetsList(sheets: unknown): unknown {
  if (!Array.isArray(sheets)) {
    return sheets;
  }

  return (sheets as unknown[]).map((entry: unknown) => (
    isPlainObject(entry) ? { ...entry, settings: copySettingsValue(entry.settings) } : entry
  ));
}

/**
 * The part of a sheet's `formulas` setting the sheets bar cooperates with, and the part of
 * a HyperFormula instance it talks to. An engine passed as the `HyperFormula` class rather
 * than a built instance has none of these methods.
 */
interface SheetFormulas {
  engine?: {
    doesSheetExist?: (name: string) => boolean;
    addSheet?: (name: string) => string;
    renameSheet?: (sheetId: number, name: string) => void;
    removeSheet?: (sheetId: number) => void;
    getSheetId?: (name: string) => number | undefined;
    getSheetName?: (sheetId: number) => string | undefined;
    setSheetContent?: (sheetId: number, content: unknown[]) => void;
    isItPossibleToReplaceSheetContent?: (sheetId: number, content: unknown[]) => boolean;
    getSheetSerialized?: (sheetId: number) => unknown[][];
    validateFormula?: (formula: string) => boolean;
    listNamedExpressions?: (scope?: number) => string[];
    getNamedExpression?: (name: string, scope?: number) => { options?: unknown } | null;
    getNamedExpressionFormula?: (name: string, scope?: number) => string | undefined;
    getNamedExpressionValue?: (name: string, scope?: number) => unknown;
    addNamedExpression?: (name: string, expression: unknown, scope?: number, options?: unknown) => void;
    getCellFormula?: (address: { sheet: number, row: number, col: number }) => string | undefined;
    normalizeFormula?: (formula: string) => string;
    on?: (event: string, listener: (changes: unknown[]) => void) => void;
    off?: (event: string, listener: (changes: unknown[]) => void) => void;
  };
  sheetName?: string;
}

/**
 * Returns the sheet's `formulas` setting, or `null` when the sheet declares none.
 */
function formulasSettingOf(sheet: Sheet): SheetFormulas | null {
  const formulas = sheet.settings?.formulas;

  return isPlainObject(formulas) ? formulas as SheetFormulas : null;
}

/**
 * Whether the engine is a built HyperFormula instance the sheets bar can register sheets in —
 * as opposed to the `HyperFormula` class, which only builds one.
 */
function isEngineInstance(engine: SheetFormulas['engine']): boolean {
  return typeof engine === 'object' && engine !== null && typeof engine.doesSheetExist === 'function';
}

/**
 * Whether the engine holds a sheet under `newName` that is not the one bound under `oldName`. The engine
 * matches names without regard to case, so `prices` and `Prices` name one sheet, and a rename that only
 * changes the case is a rename of that sheet, not a collision with another one.
 */
function isOtherEngineSheet(engine: NonNullable<SheetFormulas['engine']>, oldName: string, newName: string): boolean {
  return engine.doesSheetExist!(newName) && engine.getSheetId!(newName) !== engine.getSheetId!(oldName);
}

/**
 * Whether two sheet names name one sheet to the engine, which compares them without regard to case
 * through a plain `toLowerCase()`. A locale-aware lower case follows the host: on a Turkish host `ITEMS`
 * becomes `ıtems`, so a rename of the engine sheet `items` left `=ITEMS!A1` behind in the host's data.
 */
function isSameSheetName(first: string, second: string): boolean {
  return first.toLowerCase() === second.toLowerCase();
}

/**
 * Returns a name the engine has no sheet under yet, counting up from the requested one. A
 * brand-new binding — a runtime-added sheet, a duplicate — must never adopt an engine sheet
 * that already exists: a `sheetName` is allowed to differ from its tab's name, so a free tab
 * label can still identify another sheet's engine data, and registering under it would
 * overwrite that data and fuse the two tabs onto one engine sheet.
 */
function freeEngineName(engine: NonNullable<SheetFormulas['engine']>, requested: string): string {
  let candidate = requested;
  let counter = 2;

  while (engine.doesSheetExist!(candidate)) {
    candidate = `${requested} (${counter})`;
    counter += 1;
  }

  return candidate;
}

/**
 * What a server sheet (a sheet with its own `dataProvider`) keeps while it is not shown: its last `fetchRows`
 * response, shown again on return through `DataProvider#_restoreFetchResult()`, and the failures whose error
 * notifications wait for the sheet to be shown.
 */
interface ServerSheetView {
  lastResult: DataProviderFetchResult | null;
  failure: unknown;
  hasFailure: boolean;
  mutationFailures: Array<{ kind: DataProviderRequestKind, error: unknown }>;
}

/**
 * What survives an `updatePlugin` round trip that keeps the workbook.
 */
interface PreservedState {
  model: SheetModel;
  settingsBaseline: Map<string, unknown>;
  declaredEntries: Map<number, SheetsBarSheetConfig>;
  physicalOrder: number[];
}

/**
 * @plugin SheetsBar
 * @class SheetsBar
 *
 * @description
 * The plugin renders a tab bar below the grid, or above it with the `position` setting,
 * and lets the user switch between the sheets of a workbook. Each sheet has its own data,
 * settings overrides, and view state.
 *
 * A sheet's own settings win over the grid-level ones. While a sheet that declares a setting is
 * shown, {@link Core#updateSettings} changes only the grid-level value of that setting, which the
 * sheets without their own value use. A framework wrapper that sends every prop again on each
 * render therefore leaves the visible sheet as it is. To change a sheet's own settings, call
 * {@link SheetsBar#updateSheetSettings}.
 */
export class SheetsBar extends BasePlugin {
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
   * Returns the default settings applied when the plugin is enabled without explicit configuration.
   */
  static get DEFAULT_SETTINGS() {
    return {
      sheets: null as unknown,
      activeSheet: 0,
      controls: true,
      paging: true,
      position: 'bottom',
      uiContainer: null as unknown,
      animation: true as unknown,
    };
  }

  /**
   * Returns an object of validator functions used to type-check each settings property at runtime.
   */
  static get SETTINGS_VALIDATORS() {
    return {
      sheets: (value: unknown) => value === null || value === undefined
        || (Array.isArray(value) && value.every(isPlainObject)),
      activeSheet: (value: unknown) => typeof value === 'number',
      controls: (value: unknown) => typeof value === 'boolean',
      paging: (value: unknown) => typeof value === 'boolean',
      position: (value: unknown) => value === 'top' || value === 'bottom',
      uiContainer: (value: unknown) => value === null || value === undefined || isHTMLElement(value),
      animation: isValidAnimationSetting,
    };
  }

  /**
   * The sheet collection model.
   *
   * @type {SheetModel}
   */
  #model: SheetModel | null = null;
  /**
   * Guards against re-entrant switches while a switch is applying settings/data.
   *
   * @type {boolean}
   */
  #isSwitching = false;
  /**
   * The id of the sheet whose rows the grid holds. The model points at the arriving sheet before
   * its data loads, so the two differ while a switch runs, and stay different when the switch
   * throws before the load (`#switchTo` then points the model back at this sheet).
   *
   * @type {number|null}
   */
  #loadedSheetId: number | null = null;
  /**
   * The sheet `#applySheet` is loading, read by `#onAfterSheetLoad`.
   *
   * @type {Sheet|null}
   */
  #loadingSheet: Sheet | null = null;
  /**
   * Whether a workbook change's before-hook is running. A listener of that hook cannot change the
   * workbook: the change it was told about would then run on another workbook state.
   *
   * @type {boolean}
   */
  #isRunningBeforeHook = false;
  /**
   * Whether the last workbook change was canceled by its before-hook listener (`#commit`). A rename undo
   * step reads it to tell a listener's veto, which keeps the step on its stack, from a rename that can no
   * longer happen.
   *
   * @type {boolean}
   */
  #lastCommitCanceled = false;
  /**
   * Holds every tab entrance, tab slide, and marker slide back until the grid has been painted:
   * the gate opens in the second animation frame after the render that armed it. Shut on a
   * genuine teardown, never on a workbook-preserving round trip, and armed by the first render
   * after it.
   */
  #motionGate = new MotionGate();
  /**
   * Counts the switches that changed the active sheet, so a switch can tell whether a later one
   * ran inside its own `afterSheetTabChange` and owns the marker slide now.
   *
   * @type {number}
   */
  #switchCount = 0;
  /**
   * The grid-level value of every setting any sheet has overridden, captured the first time
   * that setting is applied. Switching to a sheet that does not declare a key restores the
   * value from here, so one sheet's `columns` or `nestedHeaders` cannot follow the user onto
   * the next sheet.
   *
   * @type {Map}
   */
  #settingsBaseline = new Map<string, unknown>();
  /**
   * Guards against re-entrant `enablePlugin` calls triggered by the `afterUpdateSettings` hook
   * while the initial workbook build is still applying a sheet's settings/data. Building the
   * initial sheet calls `this.hot.updateSettings()` before `super.enablePlugin()` has set
   * `this.enabled`, so without this guard `BasePlugin#onUpdateSettings` would see the plugin as
   * "not yet enabled" and call `enablePlugin()` again, recursing without end.
   *
   * @type {boolean}
   */
  #isInitializing = false;
  /**
   * The ColumnSummary endpoints of each sheet the user left, at the positions they held then
   * (`#captureColumnSummary`).
   *
   * @type {WeakMap<object, object[]>}
   */
  #columnSummaryStates = new WeakMap<Sheet, unknown[]>();
  /**
   * The meta the `cell` option wrote on each sheet the user left, by physical indexes, as core kept it
   * then (`#captureCellOption`).
   *
   * @type {WeakMap<object, object[]>}
   */
  #cellOptionStates = new WeakMap<Sheet, CellOptionMetaEntry[]>();
  /**
   * The sheets whose `mergeCells` `updateSheetSettings()` changed while they were hidden: their next visit
   * builds the declared merges instead of restoring the ones the user left with.
   *
   * @type {WeakSet<object>}
   */
  #redeclaredMerges = new WeakSet<Sheet>();
  /**
   * The sheets whose `customBorders` `updateSheetSettings()` changed while they were hidden: their next
   * visit applies the declared borders instead of the ones kept in their cell meta.
   *
   * @type {WeakSet<object>}
   */
  #redeclaredBorders = new WeakSet<Sheet>();
  /**
   * The view-state parts of a hidden sheet that `updateSheetSettings()` declared anew. The sheet's next visit
   * resets those parts and lets the declared settings apply, as on a first visit, and restores the rest.
   */
  #redeclaredParts = new WeakMap<Sheet, Set<ViewStatePart>>();
  /**
   * The hidden sheets `updateSheetSettings()` gave a `pagination` value. The next visit shows the kept page in
   * the page size the sheet's settings set then, as `updateSettings()` treats the page on the grid; a value with
   * `initialPage` moves the kept page there first, the way that call moves the grid's page.
   */
  #redeclaredPageSize = new WeakSet<Sheet>();
  /**
   * The grid-level `cell` option, taken when the workbook starts and refreshed by a grid-level update
   * (`#refreshGridCellOption`). A sheet that declares no `cell` of its own restates it on a switch.
   *
   * @type {Array|undefined}
   */
  #gridCellOption: unknown = undefined;
  /**
   * The order the formula engine held each sheet in when the user left it sorted or with moved rows or
   * columns, with the data array and its length at that moment (`#captureEngineOrder`).
   *
   * @type {WeakMap<object, object>}
   */
  #engineOrders = new WeakMap<Sheet, { order: FormulasEngineSheetOrder; data: unknown[]; length: number }>();
  /**
   * The sheets the user left with formula text shown (`Formulas#showFormulas()`).
   *
   * @type {WeakSet<object>}
   */
  #formulaTextSheets = new WeakSet<Sheet>();
  /**
   * The server view of each sheet that loads its rows through its own `dataProvider`.
   *
   * @type {WeakMap<object, object>}
   */
  #serverViews = new WeakMap<Sheet, ServerSheetView>();
  /**
   * The DataProvider context of each sheet: a frozen, empty object handed to DataProvider in place
   * of the sheet record, so nothing outside this plugin ever holds the record itself.
   *
   * @type {WeakMap<object, object>}
   */
  #contextTokens = new WeakMap<Sheet, object>();
  /**
   * The sheet each DataProvider context token stands for (the reverse of `#contextTokens`).
   *
   * @type {WeakMap<object, object>}
   */
  #sheetsByContext = new WeakMap<object, Sheet>();
  /**
   * What the DataProvider plugin asks this plugin, as the owner of its contexts: the context the
   * grid shows, the outcome of a request made for a sheet the grid no longer shows, and the latest
   * response of such a sheet, whose query an off-screen refetch asks for.
   *
   * @type {object}
   */
  #contextOwner: DataProviderContextOwner = {
    getContext: () => {
      const sheet = this.#activeSheetRecord();

      return sheet ? this.#contextOf(sheet) : null;
    },
    onDetachedRequest: (kind, outcome, context) => this.#keepDetachedOutcome(kind, outcome, context),
    onShownResponse: (result, context) => {
      const sheet = this.#sheetOfContext(context);

      if (sheet) {
        this.#storeServerResult(sheet, result);
      }
    },
    getContextResult: (context) => {
      const sheet = this.#sheetOfContext(context);

      return sheet ? this.#serverViews.get(sheet)?.lastResult : undefined;
    },
  };
  /**
   * `true` while `#restoreBaselineToGrid` writes the grid-level settings back, so the grid-level
   * `dataProvider` it restores on a teardown is not blocked as if the user had set it.
   *
   * @type {boolean}
   */
  #isRestoringBaseline = false;
  /**
   * `true` while `#restoreActiveSheetDataProvider` writes the visible server sheet's own
   * `dataProvider` back over the grid-level value sent again.
   *
   * @type {boolean}
   */
  #isRestoringSheetDataProvider = false;
  /**
   * The grid-level `dataProvider` carried across a workbook rebuild (`undefined` when there is
   * none), or `null` outside one. A rebuild does not write it back to the grid (that would enable
   * it, and fetch, for the moment between the two workbooks); the rebuilt workbook blocks it again
   * from this value, and never reads the grid, which holds the departing sheet's own value then.
   *
   * @type {{ value: unknown }|null}
   */
  #rebuildGridDataProvider: { value: unknown } | null = null;
  /**
   * The UI instance rendering the bar and its controls.
   *
   * @type {SheetsBarUI | null}
   */
  #ui: SheetsBarUI | null = null;
  /**
   * The tab strip instance rendering one tab per sheet.
   *
   * @type {TabStrip | null}
   */
  #tabStrip: TabStrip | null = null;
  /**
   * The marker slide and tab entrances a workbook-preserving `updatePlugin` carries from the
   * strip it tears down to the strip it builds. `null` outside that window.
   *
   * @type {object|null}
   */
  #tabStripMotion: TabStripMotion | null = null;
  /**
   * The motion that started the latest tab slide (`remove` or `move`), so a workbook-preserving
   * `updatePlugin` can tell whether the `animation` setting still lets that slide run.
   *
   * @type {string|null}
   */
  #tabSlideMotion: SheetsBarMotion | null = null;
  /**
   * The cell meta a duplicate takes from its original, put back on the copy's first visit. A sheet the
   * user has left keeps its meta in its view state (`#captureCellMeta`); a copy has no view state until
   * the user leaves it once, so this is read only while it has none.
   *
   * @type {WeakMap<Sheet, object[]>}
   */
  #copiedCellMeta = new WeakMap<Sheet, TrackedCellMeta[]>();
  /**
   * The declared `sheets` entry each built sheet came from, so removing a sheet can prune its
   * entry out of the configured arrays — the settings object would otherwise keep the removed
   * sheet's rows resident for the grid's life.
   *
   * @type {Map<number, object>}
   */
  #declaredEntries = new Map<number, SheetsBarSheetConfig>();
  /**
   * Whether the top-level `data` / `sheets` clash has been reported, so a workbook that keeps
   * loading is warned about once rather than on every switch.
   *
   * @type {boolean}
   */
  #warnedAboutTopLevelData = false;
  /**
   * The tab name to re-activate after a workbook rebuild, or `null` when the rebuild should
   * follow the `activeSheet` setting. Set by `updatePlugin` for the window of one rebuild.
   *
   * @type {string|null}
   */
  #retainActiveName: string | null = null;
  /**
   * Owns the per-tab and all-sheets dropdown menus.
   *
   * @type {SheetsBarMenus | null}
   */
  #menus: SheetsBarMenus | null = null;
  /**
   * Watches the tab strip for overflow and drives the paging arrows.
   *
   * @type {OverflowController | null}
   */
  #overflow: OverflowController | null = null;
  /**
   * The `sheets` setting value the current workbook was built from, kept so `updatePlugin`
   * can tell a genuine reconfiguration apart from a settings object that a framework wrapper
   * re-emitted unchanged or a partial payload that only touched a UI key.
   *
   * @type {unknown}
   */
  #lastBuiltSheets: unknown = undefined;
  /**
   * The host's own entries of the `sheets` value the workbook was built from, in the order of
   * `#lastBuiltSheets`, so `removeSheet()` can take a pruned entry out of the snapshot too: the host's
   * array loses that entry in place, and a snapshot still holding it would read that array, sent again,
   * as a new workbook.
   *
   * @type {Array}
   */
  #lastBuiltEntries: unknown[] = [];
  /**
   * The host's `sheets` array the bar writes into, the way core writes into the host's `data` array: a
   * rename, an added sheet, a duplicate and a removal change it in place. Sent again, the same array keeps
   * the workbook without being compared, so the host's own edits of it are not watched.
   *
   * @type {Array|undefined}
   */
  #builtSheetsArray: unknown = undefined;
  /**
   * The sheet ids in the order of the host's `sheets` array (their physical order), while the tab strip
   * shows them in the model's order. `activeSheet` names a position here, and a sheet the bar creates is
   * appended, the way a row `alter()` appends lands after the last source row.
   *
   * @type {number[]}
   */
  #physicalOrder: number[] = [];
  /**
   * `true` while the bar applies settings of its own outside a switch (`updateSheetSettings()`), so the
   * settings filter (`#filterGridSettings`) lets them through.
   *
   * @type {boolean}
   */
  #isApplyingOwnSettings = false;
  /**
   * The settings the bar's elements were built from (`#readUiSettings`), so a workbook-preserving
   * `updatePlugin` can keep the elements when none of them changed.
   *
   * @type {object|null}
   */
  #builtUiSettings: Record<string, unknown> | null = null;
  /**
   * The `activeSheet` setting as it was last acted on, so a preserved re-enable can tell an
   * explicit switch request (`updateSettings({ sheetsBar: { activeSheet: 2 } })`) apart from a
   * wrapper re-emitting the value the workbook was built with.
   *
   * @type {unknown}
   */
  #lastActiveSheetSetting: unknown = undefined;
  /**
   * The model and the settings baseline carried across an
   * `updatePlugin` teardown when the incoming `sheetsBar` setting is structurally unchanged.
   * `null` outside that window.
   *
   * @type {object|null}
   */
  #preservedState: PreservedState | null = null;
  /**
   * Whether the bar's focus scope is registered, so teardown unregisters exactly what setup
   * registered.
   *
   * @type {boolean}
   */
  #hasFocusScope = false;
  /**
   * The layout side the bar was registered on, so teardown unregisters the same slot the
   * setup filled — the `position` setting may already read differently by then.
   *
   * @type {'top'|'bottom'|null}
   */
  #registeredSide: 'top' | 'bottom' | null = null;
  /**
   * The grid-level `fixedColumnsStart` as it stood before any sheet was applied. A sheet with
   * no captured view state opens with this freeze, so a freeze set at runtime on one sheet
   * does not follow the user onto a sheet they have never visited.
   *
   * @type {number|undefined}
   */
  #neutralFixedColumnsStart: number | undefined;
  /**
   * The grid-level `fixedColumnsEnd` as it stood before any sheet was applied. It plays the same part
   * as `#neutralFixedColumnsStart` for the frozen end columns.
   *
   * @type {number|undefined}
   */
  #neutralFixedColumnsEnd: number | undefined;
  /**
   * The grid-level `fixedRowsTop` as it stood before any sheet was applied. It plays the same part as
   * `#neutralFixedColumnsStart` for the frozen top rows.
   *
   * @type {number|undefined}
   */
  #neutralFixedRowsTop: number | undefined;
  /**
   * The grid-level `fixedRowsBottom` as it stood before any sheet was applied. It plays the same part as
   * `#neutralFixedColumnsStart` for the frozen bottom rows.
   *
   * @type {number|undefined}
   */
  #neutralFixedRowsBottom: number | undefined;

  /**
   * Checks if the plugin is enabled in the handsontable settings.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return isRootInstance(this.hot) && !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled || this.#isInitializing) {
      return;
    }

    // A preserved re-enable is the framework-wrapper re-emit path, where the active sheet's own
    // freeze is currently applied to the grid — re-reading it here would adopt that freeze as
    // the neutral value and leak it onto never-visited sheets.
    if (this.#preservedState === null) {
      this.#neutralFixedColumnsStart = this.hot.getSettings().fixedColumnsStart as number | undefined;
      this.#neutralFixedColumnsEnd = this.hot.getSettings().fixedColumnsEnd as number | undefined;
      this.#neutralFixedRowsTop = this.hot.getSettings().fixedRowsTop as number | undefined;
      this.#neutralFixedRowsBottom = this.hot.getSettings().fixedRowsBottom as number | undefined;
    }

    this.#getDataProvider()?._setContextOwner(this.#contextOwner);
    this.addHook('afterLoadData', this.#onAfterSheetLoad, -1);

    if (this.#preservedState) {
      this.#model = this.#preservedState.model;
      this.#settingsBaseline = this.#preservedState.settingsBaseline;
      this.#declaredEntries = this.#preservedState.declaredEntries;
      this.#physicalOrder = this.#preservedState.physicalOrder;
    } else {
      try {
        this.#isInitializing = true;
        this.#releaseDataProviderContexts([]);
        this.#model = new SheetModel(() => this.hot.getTranslatedPhrase(C.SHEETS_BAR_DEFAULT_SHEET_NAME) as string);
        this.#captureGridDataProvider();
        this.#captureGridColumnSummary();
        this.#gridCellOption = this.hot.getSettings().cell;
        this.#buildInitialWorkbook();
      } finally {
        this.#isInitializing = false;
      }

      this.#lastActiveSheetSetting = this.getSetting('activeSheet');
    }

    this.#recordBuiltSheets();
    this.#builtUiSettings = copySettingsValue(this.#readUiSettings()) as Record<string, unknown>;

    // Injected into the bar and the tab strip so both stay decoupled from the theme engine —
    // shared here rather than declared per call site.
    const syncIconForHot = (
      container: HTMLElement,
      slotClass: string,
      name: Parameters<typeof syncIcon>[3],
      options?: Parameters<typeof syncIcon>[4],
    ) => syncIcon(this.hot, container, slotClass, name, options);

    if (!this.#ui) {
      this.#ui = new SheetsBarUI({
        rootDocument: this.hot.rootDocument,
        uiContainer: this.getSetting('uiContainer'),
        isRtl: this.hot.isRtl(),
        themeName: this.hot.getCurrentThemeName(),
        phraseTranslator: (key: string, args?: unknown) => this.hot.getTranslatedPhrase(key, args),
        a11yAnnouncer: (message: unknown) => announce(String(message ?? '')),
        ariaTags: this.hot.getSettings().ariaTags,
        syncIcon: syncIconForHot,
      });
      this.#ui.setControlsVisible(this.getSetting<boolean>('controls') !== false);
      this.#ui
        // Adding from the bar switches to what was just created, the way a spreadsheet does —
        // the user asked for a new sheet in order to work in it. The API `addSheet()` stays
        // silent, so a script building a workbook does not walk the grid through every sheet.
        .addLocalHook('addSheetClick', () => {
          // The new sheet is meant to be switched to, so it is not added when that switch would be
          // refused: the tab would appear while the grid stays on the sheet being edited.
          if (!this.#finishEditing()) {
            return;
          }

          const added = this.addSheet(undefined, undefined, undefined, SOURCE_UI);

          if (added !== null) {
            this.setActiveSheet(added.id, SOURCE_UI);
          }
        })
        .addLocalHook('allSheetsClick', (fromKeyboard: boolean) => this.#openAllSheetsMenu(fromKeyboard));

      this.#tabStrip = new TabStrip({
        host: this.#ui.getTabStripElement(),
        dragRoot: this.#ui.getContainer(),
        eventManager: this.eventManager,
        translate: (key: string, args?: unknown) => this.#ui!.translate(key, args),
        ariaTags: this.hot.getSettings().ariaTags !== false,
        isRtl: this.hot.isRtl(),
        syncIcon: syncIconForHot,
        rootWindow: this.hot.rootWindow,
      });
      this.#tabStrip.setDragSlide(this.#animation().move);
      this.#tabStrip
        .addLocalHook('tabClick', (id: number) => this.setActiveSheet(id, SOURCE_UI))
        .addLocalHook('tabMenuClick', (
          id: number,
          anchor: HTMLElement,
          fromKeyboard: boolean,
          positionTarget?: HTMLElement,
        ) => {
          this.#openTabMenu(id, anchor, fromKeyboard, positionTarget);
        })
        .addLocalHook('tabRenameCommit', (id: number, name: string, restoreFocus: boolean) => {
          const oldName = this.#model?.getSheetById(id)?.name;
          const committed = this.#commitRename(id, name);
          const attempted = clampSheetName(name);

          // A name typed and then refused reverts without a visible change, so a reader who
          // did not see the input snap back is told why.
          if (!committed && attempted !== '' && attempted !== oldName) {
            this.#ui?.announce(this.#ui.translate(C.SHEETS_BAR_RENAME_REJECTED, { name: attempted }));
          }

          if (restoreFocus) {
            this.#tabStrip?.focusTab(id);
          }
        })
        .addLocalHook('tabRenameCancel', (id: number, restoreFocus: boolean) => {
          this.#refreshUI();

          if (restoreFocus) {
            this.#tabStrip?.focusTab(id);
          }
        })
        .addLocalHook('tabDragCommit', (id: number, toIndex: number) => {
          if (!this.#moveSheetToIndex(id, toIndex, SOURCE_UI, false)) {
            this.#refreshUI();
          }
        });

      const refs = this.#ui.getRefs();

      this.#overflow = new OverflowController({
        strip: refs.tabStrip,
        pagingSection: refs.pagingSection,
        pagePrev: refs.pagePrev,
        pageNext: refs.pageNext,
        pagingEnabled: this.getSetting<boolean>('paging') !== false,
        isRtl: this.hot.isRtl(),
        ariaTags: this.hot.getSettings().ariaTags !== false,
      });
      this.#overflow.attach();
    }

    if (!this.#menus) {
      this.#menus = new SheetsBarMenus(this.hot);
    }

    if (!this.getSetting('uiContainer')) {
      this.#registeredSide = this.getSetting('position') === 'top' ? 'top' : 'bottom';
      this.hot.getLayoutManager()
        .register(PLUGIN_KEY, this.#ui.getContainer(), { side: this.#registeredSide, weight: LAYOUT_WEIGHT });
    }

    this.hot.getFocusManager().registerOutsideClickExemptElement(this.#ui.getContainer());
    this.eventManager.addEventListener(this.#ui.getContainer(), 'pointerdown', this.#onBarPointerDown);
    this.#registerFocusScope();
    this.#registerShortcuts();

    this.addHook('afterSetTheme', this.#onAfterSetTheme);
    this.addHook('afterLanguageChange', this.#onAfterLanguageChange);
    this.addHook('afterCreateRow', this.#onAfterCreateAxisItems, 1);
    this.addHook('afterCreateCol', this.#onAfterCreateAxisItems, 1);
    this.addHook('afterRemoveRow', this.#onAfterRemoveAxisItems, 1);
    this.addHook('afterRemoveCol', this.#onAfterRemoveAxisItems, 1);
    this.addHook('afterUndo', this.#onAfterUndoRedo, 1);
    this.addHook('afterRedo', this.#onAfterUndoRedo, 1);
    ['afterRowMove', 'afterColumnMove', 'afterMoveCells'].forEach((hookName) => {
      this.addHook(hookName as 'afterRowMove', this.#onAfterStructureChange, 1);
    });
    this.addHook('afterLoadData', this.#onAfterLoadData);
    this.addHook('afterUpdateData', this.#onAfterUpdateData);
    this.addHook('beforeLoadData', this.#onBeforeLoadData);
    this.addHook('beforeUpdateData', this.#onBeforeUpdateData);
    this.addHook('afterUpdateSettings', this.#onAfterUpdateSettings, -1);
    this.addHook('afterDocumentKeyDown', this.#onKeyDownWithinBar, -1);
    this.addHook('beforeCompositionStart', this.#onKeyDownWithinBar, -1);
    this.addHook('afterRender', this.#onAfterRenderArmMotionGate);
    this.hot._setSettingsFilter(this.#filterGridSettings);

    this.#refreshUI();

    if (this.#tabStripMotion !== null) {
      this.#tabStrip?.resumeMotion(
        keepAnimatedMotion(this.#tabStripMotion, this.#animation(), this.#tabSlideMotion),
      );
      this.#tabStripMotion = null;
    }

    super.enablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   *
   * A framework wrapper sends its whole configuration on every render. When neither the workbook nor
   * anything the bar's elements were built from changed (`#readUiSettings`), the bar is left as it is and
   * only an `activeSheet` request is acted on: a teardown cancels an open rename and a drag, and the rest
   * of the name the user was typing landed in the selected cell.
   */
  updatePlugin(newSettings?: Record<string, unknown>) {
    // Read through `getSetting()`, not the raw grid settings: `updateSettings` replaces the
    // grid-level `sheetsBar` object wholesale, so a partial payload such as
    // `{ sheetsBar: { paging: false } }` carries no `sheets` key there — while the plugin's own
    // merged settings still do. Only a genuinely different `sheets` value is a new workbook.
    const model = this.#model;
    const keepsWorkbook = model !== null && this.#keepsWorkbookFor(this.getSetting('sheets'));

    if (keepsWorkbook && this.getSetting('sheets') !== this.#builtSheetsArray) {
      this.#repointDeclaredEntries(this.getSetting('sheets'));
    }

    const preservedState = keepsWorkbook && model !== null
      ? {
        model,
        settingsBaseline: this.#settingsBaseline,
        declaredEntries: this.#declaredEntries,
        physicalOrder: this.#physicalOrder,
      }
      : null;
    const activeSheetSettingBefore = this.#lastActiveSheetSetting;

    if (preservedState && isStructurallyEqual(this.#readUiSettings(), this.#builtUiSettings)) {
      this.#recordBuiltEntries();
      this.#applyActiveSheetSetting(newSettings?.[PLUGIN_KEY]);
      super.updatePlugin();

      return;
    }

    // A rebuild discards the runtime state by contract, but it does not have to flip the sheet
    // in front of the user: when the `activeSheet` setting itself did not change, the rebuilt
    // workbook activates the sheet of that name directly — inside the build, so no vetoable
    // switch runs and the sheet's data is loaded once, not twice.
    if (preservedState === null && this.getSetting('activeSheet') === activeSheetSettingBefore) {
      this.#retainActiveName = this.#model?.getActiveSheet()?.name ?? null;
    }

    // Assigned before the disable, which restores the settings baseline to the grid on a
    // genuine teardown and must stand aside on a preserved one.
    this.#preservedState = preservedState;
    this.#rebuildGridDataProvider = preservedState === null
      ? { value: this.#settingsBaseline.get('dataProvider') }
      : null;

    try {
      this.disablePlugin();
      this.enablePlugin();
    } finally {
      this.#preservedState = null;
      this.#tabStripMotion = null;
      this.#retainActiveName = null;
      this.#rebuildGridDataProvider = null;
    }

    if (preservedState) {
      this.#applyActiveSheetSetting(newSettings?.[PLUGIN_KEY]);
    }

    super.updatePlugin();
  }

  /**
   * Tells whether a `sheets` value keeps the workbook that is built. The array the bar writes into keeps it
   * whatever it holds now, with no comparison, the way core takes the same `data` array back: the bar does
   * not watch the host's own edits of it. Another array keeps it when it is structurally equal to that array
   * as the bar last wrote it (`#lastBuiltSheets`, refreshed after every write), which is how a wrapper that
   * copies the array, or writes its entries as fresh literals over stable `data`, is told apart from a new
   * workbook.
   *
   * @param {*} sheets The `sheets` value sent now.
   * @returns {boolean}
   */
  #keepsWorkbookFor(sheets: unknown): boolean {
    return (Array.isArray(sheets) && sheets === this.#builtSheetsArray)
      || isSameSheetsList(sheets, this.#lastBuiltSheets);
  }

  /**
   * Points each sheet's declared entry at the entry of the `sheets` value sent now, by its position in the
   * value the workbook was built from. A framework wrapper rebuilds the entry objects on every render, and
   * `#pruneDeclaredSheet` finds an entry by identity: still pointing at the first render's objects, it found
   * nothing in the host's array or in the snapshot, so a removal pruned neither, and the host's next value,
   * one sheet shorter, read as a new workbook. It runs only for another array: the same array keeps its
   * entries, and mapped by position after the host's own edit of it (which the bar does not watch), a rename
   * wrote into the entry of another sheet.
   *
   * @param {Array} sheets The `sheets` value sent now, structurally equal to the built one.
   */
  #repointDeclaredEntries(sheets: unknown) {
    if (!Array.isArray(sheets)) {
      return;
    }

    const entries = new Map<number, SheetsBarSheetConfig>();

    this.#declaredEntries.forEach((entry, id) => {
      const index = this.#lastBuiltEntries.indexOf(entry);
      const sent = index === -1 ? undefined : (sheets as SheetsBarSheetConfig[])[index];

      entries.set(id, sent ?? entry);
    });

    this.#declaredEntries = entries;
  }

  /**
   * Records the `sheets` value the workbook was built from, as a snapshot (`snapshotSheetsList`), with the
   * host's own entries beside it for `#pruneDeclaredSheet`. It runs again after every write the bar makes
   * into the host's array, so the snapshot always describes the array as the bar left it.
   */
  #recordBuiltSheets() {
    this.#lastBuiltSheets = snapshotSheetsList(this.getSetting<unknown>('sheets'));
    this.#recordBuiltEntries();
  }

  /**
   * Points `#lastBuiltEntries` and `#builtSheetsArray` at the host's entries and array just sent, keeping the
   * snapshot. A preserved cycle already proved the snapshot equal to them (`#keepsWorkbookFor`), so copying
   * every sheet's `settings` again on each wrapper re-render would buy nothing. From then on the bar writes
   * into the array just sent.
   */
  #recordBuiltEntries() {
    const sheets = this.getSetting<unknown>('sheets');

    this.#builtSheetsArray = Array.isArray(sheets) ? sheets : undefined;
    this.#lastBuiltEntries = Array.isArray(sheets) ? [...(sheets as unknown[])] : [];
  }

  /**
   * Returns the host's `sheets` arrays the bar writes into: the grid-level one and the plugin's merged one,
   * usually the same object. Empty for a workbook that declares no sheets (`sheetsBar: true`).
   *
   * @returns {Array[]}
   */
  #configuredSheetArrays(): unknown[][] {
    const rawSetting = this.hot.getSettings()[PLUGIN_KEY] as { sheets?: unknown } | boolean | undefined;
    const rawSheets = isPlainObject(rawSetting) ? (rawSetting as { sheets?: unknown }).sheets : undefined;
    const mergedSheets = this.getSetting('sheets');
    const arrays: unknown[][] = [];

    [rawSheets, mergedSheets].forEach((sheets) => {
      if (Array.isArray(sheets) && !arrays.includes(sheets)) {
        arrays.push(sheets);
      }
    });

    return arrays;
  }

  /**
   * Answers, before anything changes, whether the host's `sheets` arrays can take an added or a removed
   * entry. The write into the array comes after the model has changed, so a frozen array (Immer, Redux
   * Toolkit, `Object.freeze`) used to throw halfway: the tab was in the model, the strip, the formula engine
   * and the after-hook were not. A workbook that declares no array has nothing to write.
   *
   * @returns {boolean} `true` when the arrays can be written.
   */
  #canWriteSheetArrays(): boolean {
    return this.#refuseUnwritable(this.#configuredSheetArrays().every(sheets => Object.isExtensible(sheets)));
  }

  /**
   * Answers, before anything changes, whether a sheet's entry in the host's `sheets` array can take a new
   * `name`, for the same reason as `#canWriteSheetArrays`.
   *
   * @param {number} id The sheet about to be renamed.
   * @returns {boolean} `true` when the entry can be written.
   */
  #canWriteDeclaredName(id: number): boolean {
    const entry = this.#declaredEntries.get(id);

    if (!entry) {
      return true;
    }

    const descriptor = Object.getOwnPropertyDescriptor(entry, 'name');
    const isWritable = descriptor
      ? descriptor.writable === true || typeof descriptor.set === 'function'
      : Object.isExtensible(entry);

    return this.#refuseUnwritable(isWritable);
  }

  /**
   * Refuses a change the bar cannot write into the host's `sheets` array, with a warning. A throw reached no
   * host code from a gesture in the bar, and a rename left its tab with the input in place of the label; an API
   * call answers the same way, so a frozen array never leaves the workbook half changed whichever path asked.
   *
   * @param {boolean} isWritable Whether the arrays or the entry can be written.
   * @returns {boolean} `isWritable`.
   */
  #refuseUnwritable(isWritable: boolean): boolean {
    if (!isWritable) {
      warn(SHEETS_NOT_WRITABLE_ERROR);
    }

    return isWritable;
  }

  /**
   * Writes a sheet the bar created (an add or a duplicate) into the host's `sheets` arrays, at their end,
   * the way core appends a row past the last source row: `{ name, data }`, plus `settings` when the sheet has
   * any. Its `data` is the array the sheet holds, so the host's array reads the rows the user types into it.
   * A frozen array never gets here: `#canWriteSheetArrays` refuses the change first.
   *
   * @param {object} sheet The created sheet.
   */
  #appendDeclaredSheet(sheet: Sheet) {
    this.#physicalOrder.push(sheet.id);

    const arrays = this.#configuredSheetArrays();

    if (arrays.length === 0) {
      return;
    }

    const entry: SheetsBarSheetConfig = { name: sheet.name, data: sheet.data };

    if (sheet.settings) {
      entry.settings = sheet.settings;
    }

    arrays.forEach(sheets => sheets.push(entry));

    const stored = arrays[0][arrays[0].length - 1];

    this.#declaredEntries.set(sheet.id, isSheetConfig(stored) ? stored : entry);
    this.#recordBuiltSheets();
  }

  /**
   * Reads every setting the bar's elements are built from: its own layout and controls options, and the
   * grid's ARIA and direction, which `enablePlugin` hands to the bar and the tab strip. The theme is not
   * one of them: `#onAfterSetTheme` keeps the built bar in step with it.
   *
   * @returns {object}
   */
  #readUiSettings(): Record<string, unknown> {
    return {
      position: this.getSetting('position'),
      uiContainer: this.getSetting('uiContainer'),
      controls: this.getSetting('controls'),
      paging: this.getSetting('paging'),
      animation: this.getSetting('animation'),
      ariaTags: this.hot.getSettings().ariaTags,
      isRtl: this.hot.isRtl(),
    };
  }

  /**
   * Acts on an `activeSheet` value that arrived through a workbook-preserving `updateSettings`
   * call. A partial payload that names `activeSheet` without redeclaring `sheets` cannot be a
   * wrapper re-emitting its whole configuration, so it is always an explicit switch request —
   * including back to a value that was acted on before. A full re-emit is judged by value: one
   * equal to the last acted-on value changes nothing, a new one switches.
   *
   * A value is recorded once the switch got as far as its listeners, so a switch a
   * `beforeSheetTabChange` listener cancels is not asked again on every wrapper re-render. A switch
   * refused while a change waits for its validator, or while the editor holds a rejected value, is
   * not recorded and warns: the same value sent again retries it. That includes a change a listener
   * of the switch starts, which the second check right before the load refuses, and a value sent
   * while another switch runs or from a before-hook listener, where `setActiveSheet()` refuses too.
   *
   * The value is read from the payload, the number the host sent, and compared with the number the host
   * sent last, never with the plugin's own copy, which `#shiftActiveSheetSetting` lowers after a removal.
   * The grid does the same with a frozen count `alter()` lowered: a re-sent unchanged value leaves it alone.
   * Compared with the lowered copy, a React or Angular host's unchanged `activeSheet` read as a new request
   * on its next render after a removal, and the grid jumped to another sheet. A payload without
   * `activeSheet` asks for nothing.
   */
  #applyActiveSheetSetting(payload: unknown) {
    if (!isPlainObject(payload) || typeof payload.activeSheet !== 'number') {
      return;
    }

    const wanted = payload.activeSheet;
    const isExplicitRequest = !('sheets' in payload);

    if (!isExplicitRequest && wanted === this.#lastActiveSheetSetting) {
      return;
    }

    const targetId = this.#sheetIdAtPosition(wanted);
    const target = targetId === undefined ? undefined : this.getSheets().find(sheet => sheet.id === targetId);

    if (target && !target.isActive) {
      if (
        this.#isSwitching || this.#isRunningBeforeHook || !this.#finishEditing() ||
        (!this.setActiveSheet(target.id) && !this.#isEditingSettled())
      ) {
        warn(ACTIVE_SHEET_REFUSED_WARNING);

        return;
      }
    }

    this.#lastActiveSheetSetting = wanted;
  }

  /**
   * Returns the id of the sheet at a position of `activeSheet`: the host's `sheets` array, or the tab order
   * for a workbook that declares no array (`sheetsBar: true`), where no other order exists.
   *
   * @param {number} position The position.
   * @returns {number|undefined}
   */
  #sheetIdAtPosition(position: number): number | undefined {
    return this.#builtSheetsArray === undefined ? this.getSheets()[position]?.id : this.#physicalOrder[position];
  }

  /**
   * Keeps the plugin's own `activeSheet` naming the same sheet after a removal shifted the positions of the
   * host's `sheets` array, the way `alter()` lowers `fixedRowsBottom` when it removes a frozen row. A removal
   * in front of it lowers it by one; a removal of the sheet it names moves it to the sheet that became
   * active. The value is written into the plugin's own settings, never into the host's `sheetsBar` object,
   * and the number the host sent last stays the one a later payload is compared with
   * (`#applyActiveSheetSetting`), so the host's unchanged value sent again switches nothing.
   *
   * @param {number} removedIndex The position the removed sheet had in the host's array.
   */
  #shiftActiveSheetSetting(removedIndex: number) {
    const stored = this.getSetting<unknown>('activeSheet');

    if (this.#builtSheetsArray === undefined || typeof stored !== 'number' || removedIndex === -1
      || removedIndex > stored) {
      return;
    }

    const activeId = this.#model?.getActiveSheet()?.id;
    const shifted = removedIndex < stored ? stored - 1 : this.#physicalOrder.indexOf(activeId ?? -1);

    if (shifted === -1) {
      return;
    }

    this.updatePluginSettings({ activeSheet: shifted });
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   *
   * A genuine teardown discards the workbook: it drops the model first and releases every
   * sheet's DataProvider context, so whatever the settings restore below starts (a restored
   * grid-level `dataProvider` fetches) already sees a grid without sheets. Then it puts the
   * grid-level settings back before the baseline is dropped: the active sheet's own settings are
   * applied to the grid at this point, and leaving them there would make the next enable read a
   * polluted grid as its neutral state — a sheet's `fixedColumnsStart` or `columns` would follow
   * the user into the rebuilt workbook. A preserved re-enable keeps the workbook and the active
   * sheet applied, so it does neither. The restore re-enters this method on a `sheetsBar: false`
   * teardown; the model is gone by then, which is what keeps the second pass from releasing and
   * restoring again.
   */
  disablePlugin() {
    if (this.#preservedState === null && this.#model !== null) {
      const discardedSheets = this.#sheetRecords();
      const keptColumnSummary = this.#rebuildGridDataProvider === null
        ? this.#getActiveSheetGridColumnSummary()
        : undefined;

      this.#model = null;
      this.#releaseDataProviderContexts(discardedSheets);
      this.#restoreBaselineToGrid(keptColumnSummary);
    }

    super.disablePlugin();
    this.hot._setSettingsFilter(null);
    this.#getDataProvider()?._setContextOwner(null);
    this.#releaseState();
  }

  /**
   * Writes the captured grid-level value of every setting any sheet overrode back into the
   * grid. `undefined` baselines are written as `null`, because `updateSettings` reads
   * `undefined` as "not provided" and would leave the sheet's value in force.
   *
   * The freeze is restored on top of the baseline: a `fixedColumnsStart` set at runtime is
   * written to the grid by the view-state machinery directly and never enters the baseline
   * map, so on a workbook where no sheet declares `settings` the map alone would restore
   * nothing and the next enable would adopt the runtime freeze as neutral.
   *
   * A rebuild leaves the grid-level `dataProvider` out: written back, it would enable and fetch
   * for the moment between the two workbooks. The rebuilt workbook blocks it again from
   * `#rebuildGridDataProvider`. While this method writes, the `dataProvider` gate stands aside,
   * so a `sheetsBar: false` teardown gives the grid its own `dataProvider` back.
   *
   * A grid-level `columnSummary` the active sheet does not override goes back at the positions the
   * endpoints hold on that sheet now (`keptColumnSummary`), because the grid keeps that sheet's rows:
   * the declared positions would write the summary over a data cell a row insert moved into them.
   *
   * @param {Array} [keptColumnSummary] The active sheet's current endpoints, when they replace the
   * captured grid-level value.
   */
  #restoreBaselineToGrid(keptColumnSummary?: unknown[]) {
    if (this.hot.isDestroyed) {
      return;
    }

    const restored: Record<string, unknown> = {};

    this.#settingsBaseline.forEach((value, key) => {
      if (key !== 'dataProvider' || this.#rebuildGridDataProvider === null) {
        restored[key] = value === undefined ? null : value;
      }
    });

    if (keptColumnSummary !== undefined) {
      restored.columnSummary = keptColumnSummary;
    }

    // Each frozen count goes back to the value the grid started with, unless a sheet's own settings already put
    // it in the baseline.
    const neutral = this.#getNeutralFrozenCounts();

    FROZEN_COUNT_KEYS.forEach((key) => {
      if (!(key in restored) && (this.hot.getSettings()[key] ?? 0) !== (neutral[key] ?? 0)) {
        restored[key] = neutral[key] ?? 0;
      }
    });

    // A count written on the table meta (by the freeze bar, for example) would outlive the write below.
    FROZEN_COUNT_KEYS.forEach((key) => {
      if (key in restored) {
        clearFrozenCountShadow(this.hot, key);
      }
    });

    if (Object.keys(restored).length === 0) {
      return;
    }

    // Emptied before the write: `updateSettings` re-enters `BasePlugin#onUpdateSettings`, and
    // on a `sheetsBar: false` teardown that call reaches `disablePlugin()` again — the empty
    // baseline (and the freeze now matching neutral) is what stops the second pass from
    // restoring in a loop.
    this.#settingsBaseline = new Map();

    try {
      this.#isRestoringBaseline = true;
      this.#syncSettingsHooks(restored);
      this.hot.updateSettings(restored);
    } finally {
      this.#isRestoringBaseline = false;
    }
  }

  /**
   * The frozen counts a never-visited sheet opens with. A count some sheet declares is in the settings
   * baseline, so the switch's settings update applies it, the sheet's own or the grid-level one; the
   * neutral reset leaves such a count at its current value, or the shadow it wrote would outlive that
   * update whenever the arriving value equals the departing one. Every other count gets the value the
   * grid started with.
   *
   * @returns {object}
   */
  #getSwitchNeutralFrozenCounts() {
    const neutral: Record<string, number | undefined> = this.#getNeutralFrozenCounts();
    const settings = this.hot.getSettings() as Record<string, unknown>;

    FROZEN_COUNT_KEYS.forEach((key) => {
      if (this.#settingsBaseline.has(key)) {
        neutral[key] = (settings[key] as number | undefined) ?? 0;
      }
    });

    return neutral;
  }

  /**
   * The four frozen counts the grid had before any sheet was applied.
   *
   * @returns {object}
   */
  #getNeutralFrozenCounts() {
    return {
      fixedColumnsStart: this.#neutralFixedColumnsStart,
      fixedColumnsEnd: this.#neutralFixedColumnsEnd,
      fixedRowsTop: this.#neutralFixedRowsTop,
      fixedRowsBottom: this.#neutralFixedRowsBottom,
    };
  }

  /**
   * Captures the grid-level `dataProvider` as the workbook starts, and warns once when there is
   * one: the bar disables it on every sheet, including a workbook whose sheets all declare their
   * own. A rebuild takes the value carried over from the workbook it replaces, since the grid
   * holds the departing sheet's own `dataProvider` at that point, not the grid-level one. Only a
   * value that was actually set enters the baseline, so a workbook without any `dataProvider`
   * never writes the key back to the grid on a teardown.
   */
  #captureGridDataProvider() {
    const value = this.#rebuildGridDataProvider === null
      ? this.hot.getSettings().dataProvider
      : this.#rebuildGridDataProvider.value;

    if (value) {
      this.#recordBlockedGridDataProvider(value);
    }
  }

  /**
   * Captures a grid-level `columnSummary` array as the workbook starts, so every switch restates it like
   * a key a sheet overrides (`#withBaselineFor`). A row or column alteration moves the endpoints on the
   * sheet it happens on, and without the restatement the plugin kept those moved endpoints on every other
   * sheet, where they could land on a data row. A return to a sheet gets the endpoints it left with
   * (`#applySheet`), a sheet visited for the first time gets the declared ones, and a genuine teardown
   * gives the declared value back to the grid. The function form is not captured: it reads its settings
   * again on every pass.
   */
  #captureGridColumnSummary() {
    const value = this.hot.getSettings().columnSummary;

    if (Array.isArray(value) && value.length > 0) {
      this.#settingsBaseline.set('columnSummary', value);
    }
  }

  /**
   * Returns the endpoints the grid-level `columnSummary` holds on the active sheet now, or `undefined` when
   * the baseline holds no `columnSummary`, when the active sheet declares its own, or while the plugin
   * exports nothing (off, or configured with a function). A teardown gives these back to the grid.
   *
   * @returns {Array|undefined}
   */
  #getActiveSheetGridColumnSummary(): unknown[] | undefined {
    const activeId = this.#model?.getActiveSheet()?.id;
    const active = activeId === undefined ? null : this.#model?.getSheetById(activeId) ?? null;

    if (!this.#settingsBaseline.has('columnSummary') || declaresColumnSummary(active)) {
      return undefined;
    }

    return this.hot.getPlugin('columnSummary')?.exportEndpointSettings() ?? undefined;
  }

  /**
   * Takes a grid-level `columnSummary` set through `updateSettings()` outside a switch as the new value
   * every sheet without its own one restates (`#captureGridColumnSummary`). The baseline keeps the value it
   * captured otherwise, so the next first visit to a sheet put the previous configuration back. The stored
   * endpoints of those sheets describe the previous configuration, so they are dropped too. A structurally
   * equal value (a framework wrapper re-sends its settings on every render) changes nothing, but functions
   * compare by reference: an inline `customFunction` rebuilt on every render reads as a new configuration,
   * so a host keeps it stable. An update made while the active sheet declares its own `columnSummary` never
   * reaches this method: the settings filter takes it off the payload as the grid-level value
   * (`#filterGridSettings`).
   *
   * @param {object} newSettings The settings passed to `updateSettings()`.
   */
  #refreshGridColumnSummary(newSettings: Record<string, unknown>) {
    if (!('columnSummary' in newSettings) || this.#isSwitching || this.#isRestoringBaseline
      || this.#isInitializing || this.#model === null) {
      return;
    }

    if (declaresColumnSummary(this.#activeSheetRecord())) {
      return;
    }

    this.#takeGridColumnSummary(newSettings.columnSummary);
  }

  /**
   * Takes a grid-level `columnSummary` as the value restated for every sheet without its own, and drops the
   * endpoints those sheets stored for the previous value. A structurally equal value changes nothing.
   *
   * @param {*} value The grid-level `columnSummary`.
   */
  #takeGridColumnSummary(value: unknown) {
    if (isStructurallyEqual(value, this.#settingsBaseline.get('columnSummary'))) {
      return;
    }

    this.#settingsBaseline.set('columnSummary', value);
    this.#sheetRecords().forEach((sheet) => {
      if (!declaresColumnSummary(sheet)) {
        this.#columnSummaryStates.delete(sheet);
      }
    });
  }

  /**
   * Takes a grid-level value set through `updateSettings()` outside a switch as the baseline of its key, so
   * a switch to a sheet that does not declare the key, a `sheetsBar: false` teardown, and a rebuild give the
   * grid that value back, not the one captured when a sheet first overrode the key. A key the active sheet
   * declares is taken off the payload before core applies it, and becomes the baseline there
   * (`#filterGridSettings`). It reaches this method only from a payload that turns the bar off or declares
   * another workbook, which the filter lets through, and then it is taken as the baseline too: such a
   * payload restates the grid's own configuration beside the teardown or the rebuild. Only keys already in
   * the baseline are refreshed: a key first
   * overridden later reads the grid then. The settings an import writes (ImportFile's own `updateSettings()`
   * calls) describe the imported file on the sheet shown, not the grid, so they are left out too.
   * `dataProvider`, `columnSummary` and `cell` keep their own rules (`#onAfterUpdateSettings`,
   * `#refreshGridColumnSummary`, `#refreshGridCellOption`).
   *
   * @param {object} newSettings The settings passed to `updateSettings()`.
   */
  #refreshSettingsBaseline(newSettings: Record<string, unknown>) {
    if (this.#isSwitching || this.#isRestoringBaseline || this.#isInitializing || this.#model === null
      || this.hot.getPlugin('importFile')?._isApplyingImport()) {
      return;
    }

    const declared = this.#activeSheetRecord()?.settings;
    const ownSettings = isPlainObject(declared) ? renameFixedColumnsLeft(declared) : declared;
    const restatesGrid = PLUGIN_KEY in newSettings;

    Object.keys(newSettings).forEach((key) => {
      if (SELF_BASELINED_KEYS.has(key) || !this.#settingsBaseline.has(key)) {
        return;
      }

      if (restatesGrid || !(isPlainObject(ownSettings) && key in ownSettings)) {
        this.#settingsBaseline.set(key, newSettings[key]);
      }
    });
  }

  /**
   * Reads every `updateSettings()` payload before core applies it (`Core#_setSettingsFilter()`), and takes
   * out each key the visible sheet declares in its own settings: a sheet's own settings win over grid-level
   * ones, as they do on a switch. The value taken out becomes the grid-level value instead
   * (`#takeGridLevelValues`), so the sheets that do not declare the key, a `sheetsBar: false` teardown and a
   * rebuild get it. Without this, a framework wrapper, which sends every prop again on each render, wrote the
   * grid-level `colHeaders`, renderer, editor and `columns` over the visible sheet's own until the user left
   * the sheet. `data` and `dataProvider` keep their own rules (`#keepDeclaredSheetRows`, the `dataProvider`
   * gate), and the payload object the caller passed is never changed.
   *
   * @param {object} settings The payload passed to `updateSettings()`.
   * @returns {object} The payload core applies.
   */
  #filterGridSettings = (settings: Record<string, unknown>): Record<string, unknown> => {
    const declared = this.#activeSheetRecord()?.settings;
    const own = isPlainObject(declared) ? renameFixedColumnsLeft(declared) : declared;

    if (!isPlainObject(own) || !this.#filtersGridSettings(settings)) {
      return settings;
    }

    const kept: Record<string, unknown> = {};
    const taken: Record<string, unknown> = {};

    Object.keys(settings).forEach((key) => {
      if (key in own && !UNFILTERED_SETTING_KEYS.has(key) && settings[key] !== undefined) {
        taken[key] = settings[key];
      } else {
        kept[key] = settings[key];
      }
    });

    if (Object.keys(taken).length === 0) {
      return settings;
    }

    this.#takeGridLevelValues(taken);

    return kept;
  };

  /**
   * Tells whether `#filterGridSettings` acts on a payload. It stands aside for the bar's own writes (a switch,
   * the teardown's restore, the initial build, `updateSheetSettings()`), for the settings ImportFile applies
   * from an imported file to the sheet shown, and for a payload that turns the bar off or declares another
   * workbook: those leave the visible sheet, so its settings no longer win.
   *
   * @param {object} settings The payload passed to `updateSettings()`.
   * @returns {boolean}
   */
  #filtersGridSettings(settings: Record<string, unknown>): boolean {
    if (this.#model === null || this.#isSwitching || this.#isRestoringBaseline || this.#isInitializing
      || this.#isApplyingOwnSettings || this.hot.getPlugin('importFile')?._isApplyingImport()) {
      return false;
    }

    if (!(PLUGIN_KEY in settings)) {
      return true;
    }

    const next = settings[PLUGIN_KEY];

    if (!next) {
      return false;
    }

    if (!isPlainObject(next)) {
      return this.#keepsWorkbookFor(null);
    }

    const declaresValidSheets = 'sheets' in next && SheetsBar.SETTINGS_VALIDATORS.sheets(next.sheets);

    return this.#keepsWorkbookFor(declaresValidSheets ? next.sheets : this.getSetting('sheets'));
  }

  /**
   * Takes the values `#filterGridSettings` kept off the visible sheet as the grid-level ones. `columnSummary`
   * and `cell` also drop the state each sheet without its own stored for the previous value.
   *
   * @param {object} values The grid-level values, by key.
   */
  #takeGridLevelValues(values: Record<string, unknown>) {
    Object.keys(values).forEach((key) => {
      if (key === 'columnSummary') {
        this.#takeGridColumnSummary(values[key]);
      } else if (key === 'cell') {
        this.#takeGridCellOption(values[key]);
      } else {
        this.#settingsBaseline.set(key, values[key]);
      }
    });
  }

  /**
   * Records a grid-level `dataProvider` the bar disables, so a genuine teardown gives it back, and
   * warns about it once.
   */
  #recordBlockedGridDataProvider(value: unknown) {
    this.#settingsBaseline.set('dataProvider', value);
    warnOnce(this, GRID_LEVEL_DATA_PROVIDER_WARN_KEY, GRID_LEVEL_DATA_PROVIDER_WARNING);
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#releaseState();
    super.destroy();
  }

  /**
   * Drops the model, the UI modules, the layout slot, and the runtime state. Shared by
   * `disablePlugin` and `destroy`; every handle is optional-chained so the second teardown is
   * a no-op. The settings baseline goes too: it describes the grid as it was before this
   * workbook, and a workbook configured later starts from the grid as it is then. A
   * workbook-preserving round trip first takes the strip's running marker slide and tab
   * entrances, while the strip is still laid out, for the rebuilt strip to continue.
   */
  #releaseState() {
    if (this.#preservedState !== null) {
      this.#tabStripMotion = this.#tabStrip?.releaseMotion() ?? null;
    }

    if (isRootInstance(this.hot)) {
      if (this.#registeredSide) {
        this.hot.getLayoutManager().unregister(PLUGIN_KEY, this.#registeredSide);
        this.#registeredSide = null;
      }

      this.#unregisterFocusScope();
      this.#unregisterShortcuts();
    }

    if (this.#ui) {
      this.hot.getFocusManager().unregisterOutsideClickExemptElement(this.#ui.getContainer());
    }

    this.#model = null;
    this.#declaredEntries = new Map();
    this.#settingsBaseline = new Map();
    this.#lastBuiltSheets = undefined;
    this.#lastBuiltEntries = [];
    this.#builtSheetsArray = undefined;
    this.#physicalOrder = [];
    this.#builtUiSettings = null;
    this.#isSwitching = false;
    this.#isInitializing = false;

    if (this.#preservedState === null) {
      this.#loadedSheetId = null;
      this.#motionGate.close();
    }

    this.#tabStrip?.destroy();
    this.#tabStrip = null;
    this.#menus?.destroy();
    this.#menus = null;
    this.#overflow?.destroy();
    this.#overflow = null;
    this.#ui?.destroy();
    this.#ui = null;
  }

  /**
   * Returns descriptors of all sheets in tab order.
   *
   * @returns {object[]} One `{ id, name, isActive }` descriptor per sheet.
   */
  getSheets(): SheetDescriptor[] {
    return this.#model?.getSheets() ?? [];
  }

  /**
   * Renames a sheet.
   *
   * Returns `false` when the id is unknown, the name is blank or unchanged, another sheet
   * already uses the name (in the bar or in the sheet's formula engine), a
   * `beforeSheetTabRename` listener cancels the rename, the sheet's entry in your `sheets` array is frozen
   * (with a console warning), or it is called from a listener of a workbook change's before-hook. A name
   * that changes only the case of the letters is a rename.
   *
   * With the `Formulas` plugin, the references to the sheet are rewritten in the data of every sheet
   * that shares its formula engine, and the rename is one undo step.
   *
   * @param {number} id The sheet's id.
   * @param {string} name The new name. Trimmed, and cut to the name length limit.
   * @param {string} [source='SheetsBar.api'] Operation source tag, passed on to the hooks.
   * @returns {boolean} `true` when the sheet was renamed.
   */
  renameSheet(id: number, name: string, source: string = SOURCE_API): boolean {
    return this.#commitRename(id, name, source);
  }

  /**
   * Duplicates a sheet, placing the copy directly after the original.
   *
   * The copy gets a deep clone of the sheet's data and settings, and a name based on the
   * original's. The `formulas` setting is not cloned: the copy shares the original's engine,
   * under a sheet name of its own. Returns `null` when the id is unknown, a `beforeSheetTabAdd` listener
   * cancels the copy, your `sheets` array is frozen (with a console warning), or it is called from a
   * listener of a workbook change's before-hook.
   *
   * @param {number} id The sheet to copy.
   * @param {string} [source='SheetsBar.api'] Operation source tag, passed on to the hooks.
   * @returns {object|null} A descriptor for the copy, or `null`.
   */
  duplicateSheet(id: number, source: string = SOURCE_API): SheetDescriptor | null {
    return this.#duplicateSheet(id, source);
  }

  /**
   * Removes a sheet.
   *
   * Removing the active sheet first switches to its nearest neighbor. Returns `false` when the
   * id is unknown, the sheet is the last one, a `beforeSheetTabRemove` listener cancels the
   * removal, the switch to the neighbor is rejected, your `sheets` array is frozen (with a console
   * warning), or it is called from a listener of a workbook change's before-hook, such as
   * `beforeSheetTabChange`.
   *
   * @param {number} id The sheet to remove.
   * @param {string} [source='SheetsBar.api'] Operation source tag, passed on to the hooks.
   * @returns {boolean} `true` when the sheet was removed.
   */
  removeSheet(id: number, source: string = SOURCE_API): boolean {
    return this.#removeSheet(id, source);
  }

  /**
   * Updates a sheet's own settings, the way {@link Core#updateSettings} updates the grid's: the keys you
   * pass are merged into the settings the sheet already has. A key passed as `undefined` is left out, as
   * {@link Core#updateSettings} leaves it out, so a key a sheet declares cannot be removed from it, only
   * given another value. On the visible sheet the change applies at once; on any other sheet it applies
   * when the sheet is shown next, in place of what the sheet kept from your last visit for that key: its
   * frozen rows and columns, hidden rows and columns, sort, filters, row and column order, sizes, page,
   * merged cells, custom borders, `cell` meta, or column summary positions. The rest of what it kept, such
   * as the selection and the scroll position, comes back as usual. The settings stay with the
   * sheet: the entry in your `sheets` array keeps the `settings` you declared, the way
   * {@link Core#updateSettings} never writes into the object you passed it.
   *
   * A sheet's own settings win over the grid-level ones, so this is how you change a setting the sheet
   * declares: {@link Core#updateSettings} changes only the grid-level value of a key the visible sheet
   * declares.
   *
   * Returns `false` when the bar is off, the sheet does not exist, `settings` is not an object or changes
   * nothing, a sheet switch is in progress, or it is called from a listener of a workbook change's
   * before-hook. A `sheetsBar` key is ignored, because a sheet cannot reconfigure the bar, and so is `data`,
   * because a sheet's rows are its `data` in your `sheets` array.
   *
   * @param {number|string} idOrName The sheet's id, or its name.
   * @param {object} settings The settings to merge into the sheet's own.
   * @returns {boolean} `true` when the settings were updated.
   */
  updateSheetSettings(idOrName: number | string, settings: Record<string, unknown>): boolean {
    const model = this.#model;
    const id = model?.resolveId(idOrName) ?? null;
    const sheet = id === null ? null : model?.getSheetById(id);

    if (!sheet || !isPlainObject(settings) || this.#isSwitching || this.#isRunningBeforeHook) {
      return false;
    }

    const changes = normalizeFixedColumnsAlias(Object.fromEntries(
      Object.entries(settings).filter(([key, value]) => !UNSETTABLE_SHEET_KEYS.has(key) && value !== undefined)
    ), this.hot.isRtl());

    if (Object.keys(changes).length === 0) {
      return false;
    }

    sheet.settings = { ...renameFixedColumnsLeft(sheet.settings ?? {}), ...changes };

    if (model?.getActiveSheet()?.id === id) {
      this.#applyToVisibleSheet(changes, sheet.settings);
    } else {
      this.#dropKeptStateFor(sheet, changes);
    }

    return true;
  }

  /**
   * Activates a sheet by id or name. Returns `false` when the sheet doesn't exist, is
   * already active, another switch is in progress, or a `beforeSheetTabChange` listener
   * cancels the switch.
   *
   * The switch first saves the cell editor and the comment editor on the sheet you leave. It
   * returns `false`, and switches nothing, while a cell value waits for an asynchronous
   * validator, or while the editor holds a value its validator rejected (`allowInvalid: false`):
   * the value would otherwise be written into the arriving sheet. Validators always answer after
   * the edit, so a call made while the editor of a cell with a validator is open returns `false`
   * even for a valid value: close the editor first and switch once `afterValidate` has fired. A
   * change that a `beforeSheetTabChange` or `afterSheetTabStateCapture` listener makes to a cell
   * with a validator refuses the switch the same way. A validator that never calls its callback
   * blocks switching until {@link Core#loadData} loads other data. It also returns `false` when
   * it is called from a listener of a workbook change's before-hook, such as
   * `beforeSheetTabChange`, or of `afterSheetTabStateCapture`.
   *
   * @param {number|string} idOrName The sheet's id, or its name.
   * @param {string} [source='SheetsBar.api'] Operation source tag, passed on to the hooks.
   * @returns {boolean} `true` when the sheet was activated.
   */
  setActiveSheet(idOrName: number | string, source: string = SOURCE_API): boolean {
    const model = this.#model;
    const newId = model?.resolveId(idOrName) ?? null;

    if (
      model === null || newId === null || newId === model.getActiveSheet()?.id ||
      this.#isSwitching || this.#isRunningBeforeHook || !this.#finishEditing()
    ) {
      return false;
    }

    const oldId = model.getActiveSheet()?.id ?? null;

    if (newId === oldId) {
      return false;
    }

    let transitionMs = 0;
    let markerFrom: TabBox | null = null;
    let switchNumber = 0;

    const switched = this.#commit(
      'beforeSheetTabChange',
      [oldId, newId],
      () => {
        this.#switchCount += 1;
        switchNumber = this.#switchCount;
        transitionMs = this.#switchTransition('switch');
        markerFrom = transitionMs > 0 ? (this.#tabStrip?.captureActiveTabBox() ?? null) : null;

        const oldSheet = oldId === null ? null : model.getSheetById(oldId);

        if (oldSheet) {
          this.#syncActiveSheetData();
          oldSheet.viewState = captureViewState(this.hot, this.#captureCellMeta()) as
            unknown as Record<string, unknown>;
          this.#captureColumnSummary(oldSheet);
          this.#captureCellOption(oldSheet);
          this.#runBeforeChangeHook(() => {
            this.hot.runHooks('afterSheetTabStateCapture', oldId, oldSheet.viewState, source);
          });

          if (!this.#isLive(model)) {
            return false;
          }

          this.#captureEngineOrder(oldSheet);
          this.#captureFormulaText(oldSheet);
        }

        if (!this.#isEditingSettled()) {
          return false;
        }

        const dialog = this.hot.getPlugin('dialog');
        const isDialogOpen = !!dialog?.isVisible();

        try {
          this.#isSwitching = true;
          this.#withoutFetching(() => this.#switchTo(model, newId, source));
        } finally {
          this.#isSwitching = false;
        }

        if (isDialogOpen) {
          dialog?._adoptViewSelection();
        }
        this.#refreshUI();
        this.#showServerSheet();

        return true;
      },
      'afterSheetTabChange',
      () => [oldId, newId],
      source,
    );

    if (switched === false) {
      return false;
    }

    if (this.#ownsMarkerSlide(switchNumber)) {
      this.#slideActiveTabMarker(markerFrom, transitionMs);
    }

    // Announced for the bar's own gestures only. A switch made through the API is the host
    // page's doing, and one made from the keyboard already moved the focus onto the tab, whose
    // name the reader speaks.
    if (source === SOURCE_UI) {
      this.#ui?.announce(this.#ui.translate(C.SHEETS_BAR_SHEET_CHANGED, { name: model.getActiveSheet()!.name }));
    }

    return true;
  }

  /**
   * Finishes what the user is typing before a switch captures the departing sheet. The cell editor
   * saves its value, and a comment editor opened through the API, which no click on a tab blurs,
   * saves its text. Answers `false`, and the switch does not happen, while a change still waits for
   * its validator, the editor's own save included, or while the editor stays open because its
   * validator rejected the value (`allowInvalid: false`): the change would otherwise be written into
   * the arriving sheet when the validator answers, or the editor would stay over it.
   */
  #finishEditing(): boolean {
    this.#saveCellEditor();
    this.hot.getPlugin('comments')?._saveAndCloseEditor();

    return this.#isEditingSettled();
  }

  /**
   * Saves and closes the cell editor, unless it already waits for its validator.
   */
  #saveCellEditor() {
    const editor = this.hot.getActiveEditor();

    if (editor?.isOpened() && !editor.isWaiting()) {
      this.hot.destroyEditor(false, false);
    }
  }

  /**
   * Tells whether no change waits for its validator and no cell editor is open. Asked before the
   * listeners of a switch run and again right before the arriving data loads, because a listener can
   * start a validated change of its own (a `setDataAtCell()` call that stamps the departing sheet).
   */
  #isEditingSettled(): boolean {
    return !this.hot.getActiveEditor()?.isOpened() && !this.hot._hasPendingValidation();
  }

  /**
   * A press anywhere in the bar saves the cell editor. A mouse press does the same through the grid's
   * outside-click handling, which skips the mouse events a touch screen synthesizes. On a touch screen
   * the editor would close only in the tab's `click` handler, and a validator answers after that, so
   * the first tap would be refused. Saving on the press gives the validator time to answer before the
   * `click`.
   */
  #onBarPointerDown = () => {
    this.#saveCellEditor();
  };

  /**
   * Runs host listeners that are told about a workbook change before it has finished: a change's
   * before-hook, `afterSheetTabStateCapture`, and `afterSheetTabStateRestore`, which fires in the
   * middle of the switch. A workbook change they request is refused (`#commit`), because the change
   * they were told about would then run on another workbook state: a restore listener that removed the
   * departing sheet left `afterSheetTabChange` reporting a sheet that no longer exists.
   */
  #runBeforeChangeHook(runListeners: () => void) {
    const wasRunning = this.#isRunningBeforeHook;

    this.#isRunningBeforeHook = true;

    try {
      runListeners();
    } finally {
      this.#isRunningBeforeHook = wasRunning;
    }
  }

  /**
   * Tells whether the plugin still runs the workbook it ran before a host listener was called: the
   * grid is not destroyed, the bar is on, and the workbook was not replaced.
   */
  #isLive(model: SheetModel | null): boolean {
    return !!this.hot && !this.hot.isDestroyed && this.enabled && this.#model === model;
  }

  /**
   * Tells whether a switch still owns the marker slide: the plugin is enabled, and no later
   * switch ran since, as one an `afterSheetTabChange` listener starts. A later switch started its
   * own slide, which this one must not replace.
   */
  #ownsMarkerSlide(switchNumber: number): boolean {
    return this.enabled && switchNumber === this.#switchCount;
  }

  /**
   * Slides a newly created sheet's tab into the strip. Nothing slides when the entrance is
   * instant: the `animation` setting turns it off, no theme transition, a user who prefers reduced
   * motion, or a grid still loading.
   */
  #markTabEntering(id: number): void {
    if (this.#tabStrip === null) {
      return;
    }

    this.#tabStrip.markEntering(id, this.#switchTransition('add'));
  }

  /**
   * Returns the transition one motion of the bar runs with, or `0` when it is instant: the
   * `animation` setting turns it off, or the grid still loads (until the motion gate opens, a
   * marker slide, a tab entrance, and a tab slide are instant, and read nothing from the DOM).
   */
  #switchTransition(motion: SheetsBarMotion): number {
    if (!this.#animation()[motion] || !this.#motionGate.isOpen()) {
      return 0;
    }

    return resolveSwitchTransition(this.hot);
  }

  /**
   * Returns the `animation` setting resolved to one flag per motion.
   */
  #animation() {
    return resolveAnimationSetting(this.getSetting('animation'));
  }

  /**
   * Records where every tab stands before a change that moves tabs, with the transition the
   * slide will run with, or answers `null` when the motion is instant: the `animation` setting
   * turns it off, no theme transition, a user who prefers reduced motion, or a grid still
   * loading.
   */
  #captureTabMotion(motion: TabMotion['motion']): TabMotion | null {
    const transitionMs = this.#tabStrip === null ? 0 : this.#switchTransition(motion);

    if (transitionMs <= 0) {
      return null;
    }

    return { from: this.#tabStrip!.captureTabPositions(), transitionMs, motion };
  }

  /**
   * Slides the tabs from the places `#captureTabMotion()` recorded to the places the repaint
   * gave them, led by the tab of `leadId`.
   */
  #playTabMotion(motion: TabMotion | null, leadId: number): void {
    if (motion === null) {
      return;
    }

    this.#tabSlideMotion = motion.motion;
    this.#tabStrip?.slideTabs(motion.from, tabSlideDurationMs(motion.transitionMs), leadId);
  }

  /**
   * Slides the active tab marker from the box the previous sheet's tab held to the new active
   * tab. A switch that does not animate ends a slide still running instead.
   */
  #slideActiveTabMarker(from: TabBox | null, transitionMs: number): void {
    if (this.#tabStrip === null) {
      return;
    }

    if (from === null || transitionMs <= 0) {
      this.#tabStrip.finishIndicator();

      return;
    }

    this.#tabStrip.slideIndicator(from, pillDurationMs(transitionMs));
  }

  /**
   * Moves a sheet to a position in the tab order.
   *
   * The index counts sheets in tab order, not on screen, so it is the same under RTL.
   * Returns `false` when the id is unknown, the index is out of range or is the sheet's
   * current one, a `beforeSheetTabMove` listener cancels the move, or it is called from a listener
   * of a workbook change's before-hook.
   *
   * @param {number} id The sheet id.
   * @param {number} to The target index.
   * @param {string} [source='SheetsBar.api'] The operation source reported to the hooks.
   * @returns {boolean} `true` when the sheet moved.
   */
  moveSheetToIndex(id: number, to: number, source: string = SOURCE_API): boolean {
    return this.#moveSheetToIndex(id, to, source);
  }

  /**
   * Appends a sheet and returns its descriptor, or `null` when a `beforeSheetTabAdd`
   * listener cancels it, your `sheets` array is frozen (with a console warning), or it is called from a
   * listener of a workbook change's before-hook.
   *
   * Without `settings`, the new sheet joins the workbook's shared formula engine, if there is
   * one, under its own name. Formulas and cross-sheet references then work on it right away.
   *
   * @param {string} [name] The sheet's name. Omitted, the next free `Sheet{n}` is used.
   * @param {Array} [data] The sheet's data: rows as arrays, or as objects. Omitted, the sheet starts blank.
   * @param {object} [settings] The sheet's settings. Omitted, the sheet inherits the
   * workbook's shared formula engine when one is configured.
   * @param {string} [source='SheetsBar.api'] Operation source tag, passed on to the hooks.
   * @returns {object|null} A descriptor for the new sheet, or `null`.
   */
  addSheet(
    name?: string,
    data?: unknown[],
    settings?: Record<string, unknown>,
    source: string = SOURCE_API,
  ): SheetDescriptor | null {
    const model = this.#model;

    if (model === null || !this.#canWriteSheetArrays()) {
      return null;
    }

    const sheet = this.#commit(
      'beforeSheetTabAdd',
      [name ?? null],
      () => {
        const added = model.addSheet(name ?? null, data, settings);

        if (!added.settings) {
          const inherited = this.#inheritedFormulaSettings(added.name);

          if (inherited) {
            added.settings = inherited;
          }
        }

        this.#registerFormulaSheet(added);
        this.#appendDeclaredSheet(added);
        this.#markTabEntering(added.id);
        this.#refreshUI();

        return added;
      },
      'afterSheetTabAdd',
      (added: Sheet) => [added.id, added.name],
      source,
    );

    return sheet === false ? null : { id: sheet.id, name: sheet.name, isActive: false };
  }

  /**
   * Builds the settings a runtime-added sheet starts with in a workbook whose sheets share a
   * formula engine: the shared engine, bound under the new sheet's own name. Returns `null`
   * when no sheet hands over a built engine instance.
   */
  #inheritedFormulaSettings(sheetName: string): Record<string, unknown> | null {
    for (const { id } of this.getSheets()) {
      const sheet = this.#model?.getSheetById(id);
      const formulas = sheet ? formulasSettingOf(sheet) : null;

      if (formulas?.sheetName && isEngineInstance(formulas.engine)) {
        return { formulas: { ...formulas, sheetName: freeEngineName(formulas.engine!, sheetName) } };
      }
    }

    return null;
  }

  /**
   * Runs an operation with rendering suspended, resuming in a `finally` so a listener that
   * throws mid-switch — a `beforeLoadData` hook, a settings validator — cannot leave the grid
   * render-suspended for the rest of its life. `Core#batchRender` has no such guard, and a
   * sheet switch runs host code through `updateSettings` and `loadData`.
   */
  #batchRender(operations: () => void) {
    this.hot.suspendRender();

    try {
      operations();
    } finally {
      this.hot.resumeRender();
    }
  }

  /**
   * Runs a switch as a DataProvider context change: DataProvider stays passive (the arriving
   * sheet's `dataProvider` applies without a refetch, every sheet's running fetch keeps going, and
   * the arriving sheet's sort and filters are restored without being sent to the server), and it
   * brings the per-view state of the plugins it drives (the pager total, the loading overlay, the
   * server-filter rollback) in line with the arriving sheet. What the arriving server sheet shows
   * is decided once the switch completes. The passive window covers `#switchTo` only, and
   * `afterSheetTabStateRestore` fires inside it: a sort or filter applied from that listener on a
   * server sheet is canceled, not sent to the server. A sort or filter made from an
   * `afterSheetTabStateCapture` or `afterSheetTabChange` listener is an ordinary user action and goes
   * to the server.
   */
  #withoutFetching(operation: () => void) {
    const dataProvider = this.#getDataProvider();

    if (dataProvider) {
      dataProvider._runContextChange(operation);
    } else {
      operation();
    }
  }

  /**
   * Returns the DataProvider plugin instance, or `undefined` when the build does not register it.
   */
  #getDataProvider(): DataProvider | undefined {
    return this.hot.getPlugin('dataProvider');
  }

  /**
   * Returns the record of the sheet the grid shows, or `null` without a workbook.
   */
  #activeSheetRecord(): Sheet | null {
    const activeId = this.#model?.getActiveSheet()?.id;

    return activeId === undefined ? null : this.#model?.getSheetById(activeId) ?? null;
  }

  /**
   * Returns the records of every sheet in the workbook, in tab order.
   */
  #sheetRecords(): Sheet[] {
    return this.getSheets()
      .map(({ id }) => this.#model?.getSheetById(id) ?? null)
      .filter((sheet): sheet is Sheet => sheet !== null);
  }

  /**
   * Returns a sheet's DataProvider context token, creating it on first use.
   */
  #contextOf(sheet: Sheet): object {
    let token = this.#contextTokens.get(sheet);

    if (!token) {
      token = Object.freeze({});
      this.#contextTokens.set(sheet, token);
      this.#sheetsByContext.set(token, sheet);
    }

    return token;
  }

  /**
   * Returns the sheet of the current workbook that a DataProvider context names, or `null` for a
   * context of a removed sheet, of a replaced workbook, or of no sheet at all.
   */
  #sheetOfContext(context: object): Sheet | null {
    const sheet = this.#sheetsByContext.get(context);

    return sheet && this.#sheetRecords().includes(sheet) ? sheet : null;
  }

  /**
   * Returns a sheet's server view, creating an empty one on first use.
   */
  #serverViewOf(sheet: Sheet): ServerSheetView {
    let view = this.#serverViews.get(sheet);

    if (!view) {
      view = { lastResult: null, failure: undefined, hasFailure: false, mutationFailures: [] };
      this.#serverViews.set(sheet, view);
    }

    return view;
  }

  /**
   * Keeps a server sheet's latest response and forgets the fetch failure it replaces.
   */
  #storeServerResult(sheet: Sheet, result: DataProviderFetchResult) {
    const view = this.#serverViewOf(sheet);

    view.lastResult = result;
    view.failure = undefined;
    view.hasFailure = false;
  }

  /**
   * Keeps the outcome of a request DataProvider made for a sheet the grid no longer shows. A
   * response's rows replace the sheet's data array rather than being written into it, so an array
   * the host declared (frozen, or observed by a framework) is never touched. The cell meta the sheet
   * kept is dropped with its old rows, the way a `loadData()` on the grid shown drops it. A failure waits in the
   * sheet's server view, and its error notification appears when the sheet is shown again. The
   * outcome of a request for a sheet that no longer exists is dropped, and so is one for the sheet
   * the grid shows (DataProvider reports it as detached only while it is disabled there): writing
   * it would overwrite the visible sheet's record behind the grid's back.
   */
  #keepDetachedOutcome(kind: DataProviderRequestKind, outcome: DataProviderDetachedOutcome, context: object) {
    const sheet = this.#sheetOfContext(context);

    if (!sheet || sheet === this.#activeSheetRecord()) {
      return;
    }

    if ('result' in outcome) {
      sheet.data = outcome.result.rows;
      this.#storeServerResult(sheet, outcome.result);

      this.#columnSummaryStates.delete(sheet);
      this.#cellOptionStates.delete(sheet);

      if (sheet.viewState) {
        const viewState = { ...sheet.viewState };

        delete viewState.cellMeta;
        sheet.viewState = viewState;
      }

      return;
    }

    const view = this.#serverViewOf(sheet);

    if (kind === 'fetch') {
      view.failure = outcome.error;
      view.hasFailure = true;
    } else {
      view.mutationFailures.push({ kind, error: outcome.error });
    }
  }

  /**
   * Gives a duplicated sheet the original's last response, so its first visit shows it instead of
   * fetching. Failures waiting on the original stay with the original, and so does a fetch the
   * original still has running.
   */
  #copyServerView(original: Sheet, duplicate: Sheet) {
    const lastResult = this.#serverViews.get(original)?.lastResult;

    if (lastResult) {
      this.#storeServerResult(duplicate, lastResult);
    }
  }

  /**
   * Tells the DataProvider plugin that the given sheets are gone for good, together with the
   * default context: the fetch the grid had running before the workbook was built, if any, is
   * aborted, and the work still queued for a discarded sheet is dropped.
   */
  #releaseDataProviderContexts(sheets: Sheet[]) {
    const dataProvider = this.#getDataProvider();

    if (!dataProvider) {
      return;
    }

    dataProvider._releaseContext(null);
    sheets.forEach(sheet => dataProvider._releaseContext(this.#contextOf(sheet)));
  }

  /**
   * Decides what a server sheet shows once a switch has brought it in: the error notifications
   * its requests left while it was not shown, then its own fetch still running, its last response
   * (with the fetch error that came after it, when there is one), or a first fetch.
   */
  #showServerSheet() {
    const dataProvider = this.#getDataProvider();
    const sheet = this.#activeSheetRecord();

    if (!dataProvider?.enabled || !sheet) {
      return;
    }

    const view = this.#serverViews.get(sheet);

    if (view) {
      const failures = view.mutationFailures;

      view.mutationFailures = [];
      failures.forEach(({ kind, error }) => dataProvider._showRequestError(kind, error));
    }

    if (dataProvider.isFetching()) {
      return;
    }

    if (view?.hasFailure) {
      this.#showStoredFetchFailure(dataProvider, view);

      return;
    }

    if (view?.lastResult) {
      dataProvider._restoreFetchResult(view.lastResult);

      return;
    }

    dataProvider.fetchData({ page: 1 }).catch((error) => {
      logError('Data fetch failed:', error);
    });
  }

  /**
   * Shows the fetch failure a server sheet kept while it was not shown: its last response comes
   * back (so its sort, filters, and pager do), and the error notification appears, its Refetch
   * action fetching the sheet. Nothing is fetched automatically.
   */
  #showStoredFetchFailure(dataProvider: DataProvider, view: ServerSheetView) {
    const { failure, lastResult } = view;

    view.failure = undefined;
    view.hasFailure = false;

    if (lastResult) {
      dataProvider._restoreFetchResult(lastResult);
    } else {
      this.hot.render();
    }

    dataProvider._showRequestError('fetch', failure);
  }

  /**
   * Returns the array the grid currently works on. `loadData` assigns the caller's array
   * by reference, so this is the same array every cell edit mutates — storing it, rather
   * than a materialized copy, is what makes the design's "the grid works directly on the
   * active sheet's data array" invariant hold for the default sheet too.
   */
  #getLiveSourceData(): unknown[][] {
    return this.hot.getSettings().data as unknown[][];
  }

  /**
   * Points the active sheet's record at the array the grid currently works on. `loadData`
   * hands its array over by reference, but a `beforeLoadData` listener may substitute
   * another one, so the record is only guaranteed current right after this call.
   */
  #syncActiveSheetData() {
    const loadedId = this.#loadedSheetId ?? this.#model?.getActiveSheet()?.id ?? null;
    const loadedSheet = loadedId === null ? null : this.#model?.getSheetById(loadedId);

    if (loadedSheet) {
      loadedSheet.data = this.#getLiveSourceData();
    }
  }

  /**
   * Activates a sheet in the model, applies its settings and data, and brings the view
   * back to the state it was captured in. A sheet that was never visited gets a neutral
   * baseline instead, so it does not inherit the outgoing sheet's filters, hidden
   * indexes, merges, borders, or manual sizes.
   *
   * The departing sheet's runtime freeze is in its captured state by then, and it comes off the
   * table meta before the arriving settings are applied: left there, it would be in force during
   * that update (Pagination refuses to enable next to a frozen row), and `updateSettings()` keeps
   * such a shadow over a count equal to the previous grid-level one, so a sheet declaring the same
   * count opened unfrozen.
   */
  #switchTo(model: SheetModel, newId: number, source: string) {
    const departingId = this.#loadedSheetId;

    model.setActiveSheet(newId);

    try {
      this.#showSheet(model.getSheetById(newId) as Sheet, source);
    } catch (error) {
      const departingSheet = departingId === null ? undefined : model.getSheetById(departingId);

      if (departingSheet && this.#loadedSheetId !== newId) {
        model.setActiveSheet(departingSheet.id);

        try {
          this.#showSheet(departingSheet, source);
        } catch {
          throw error;
        }
      }

      throw error;
    }
  }

  /**
   * Applies the sheet the model has just activated, and restores its view state. When this throws
   * before the sheet's data loaded, the grid still holds the departing sheet's rows, while the
   * arriving sheet's settings are applied over them and the neutral reset has already cleared their
   * filters, hidden rows, merges, and sizes. `#switchTo` then shows the departing sheet again, from
   * the view state captured a moment before: left at the arriving one, the next switch stored the
   * departing rows as the arriving sheet's data, and two tabs then shared one array; only pointing
   * the model back left the departing sheet without its view state, and the next switch away stored
   * that empty state as its own.
   */
  #showSheet(newSheet: Sheet, source: string) {
    const newId = newSheet.id;

    // The whole switch paints once. Applying the sheet, restoring its view state, re-selecting
    // and scrolling each ask for a full render on their own, and every one of those renders
    // re-measures the column widths of the sheet that has just arrived — on a large sheet that
    // was four sweeps over the same data before a single frame reached the screen.
    const viewState = newSheet.viewState as unknown as ViewState | undefined;
    const redeclaredParts = viewState ? this.#redeclaredParts.get(newSheet) : undefined;
    const keptParts = redeclaredParts
      ? new Set(VIEW_STATE_PARTS.filter(part => !redeclaredParts.has(part)))
      : undefined;

    const switchSheet = () => {
      if (this.hot.view) {
        this.hot.deselectCell();
      }

      // The neutral reset runs BEFORE the sheet arrives. `loadData` resets only the index
      // mappers, so the reset is what clears the previous sheet's filters, hidden and trimmed
      // indexes, merges, borders, manual sizes, and a runtime freeze — and running it first
      // lets everything the arriving sheet declares in its own `settings` (merges, hidden
      // indexes, a freeze, a sort) land after it and stay in force. Reset after the apply,
      // those declarations were wiped on the sheet's first activation and then captured as
      // its own empty state.
      FROZEN_COUNT_KEYS.forEach(key => clearFrozenCountShadow(this.hot, key));

      if (!viewState) {
        resetViewState(this.hot, this.#getSwitchNeutralFrozenCounts());
      } else {
        clearMergedCells(this.hot);
        clearCustomBorders(this.hot);

        if (redeclaredParts) {
          resetViewState(this.hot, {}, redeclaredParts);
        }
      }

      const copiedCellMeta = viewState ? undefined : this.#copiedCellMeta.get(newSheet);

      this.#applySheet(newSheet, source, {
        restoresState: viewState !== undefined,
        cellMeta: viewState ? viewState.cellMeta : copiedCellMeta,
      });

      if (viewState) {
        restoreViewState(this.hot, viewState, keptParts);
      } else if (copiedCellMeta) {
        this.#copiedCellMeta.delete(newSheet);
        rebuildCustomBordersFromCellMeta(this.hot);
      }

      this.#restoreFormulaText(newSheet);
    };

    const engineOrder = viewState ? this.#engineOrderToAdopt(newSheet) : null;

    this.#withoutUndoEntry(() => {
      this.#withEngineOrderHeld(() => {
        if (this.hot.view) {
          this.#batchRender(switchSheet);
        } else {
          switchSheet();
        }
      }, engineOrder);
    });

    this.#redeclaredParts.delete(newSheet);

    // The selection, the scroll position, and the hook wait for the batch to end: the first two
    // need the arriving sheet painted at its own sizes, and a listener reading the DOM from the
    // hook has to see the sheet it is being told about.
    if (this.hot.view) {
      let selectionRestored = false;

      this.#batchRender(() => {
        if (viewState) {
          if (redeclaredParts) {
            resetViewport(this.hot, redeclaredParts);
          }

          selectionRestored = restoreViewport(this.hot, this.#withCurrentPageSize(newSheet, viewState), keptParts);

          if (!selectionRestored) {
            this.hot.deselectCell();
          }
        } else {
          resetViewport(this.hot);
        }
      });
      keepSelectionOnPage(this.hot, selectionRestored);
    }

    this.#redeclaredPageSize.delete(newSheet);

    if (viewState) {
      this.#runBeforeChangeHook(() => {
        this.hot.runHooks('afterSheetTabStateRestore', newId, newSheet.viewState, source);
      });
    }
  }

  /**
   * Builds the initial workbook from the `sheets` setting, or wraps the grid's
   * current data as `Sheet1` when the setting is omitted.
   */
  #buildInitialWorkbook() {
    const model = this.#model as SheetModel;
    const sheetsSetting = this.getSetting('sheets') as
      Array<{ name?: string, data?: unknown[], settings?: Record<string, unknown> }> | null;

    if (Array.isArray(sheetsSetting) && sheetsSetting.length > 0) {
      this.#declaredEntries = new Map();

      this.#physicalOrder = [];

      sheetsSetting.forEach((entry) => {
        const sheet = model.addSheet(entry.name ?? null, entry.data, entry.settings);

        this.#declaredEntries.set(sheet.id, entry);
        this.#physicalOrder.push(sheet.id);
      });

      const activeIndex = this.getSetting<number>('activeSheet') ?? 0;
      const descriptors = model.getSheets();
      const retained = this.#retainActiveName === null
        ? undefined
        : descriptors.find(descriptor => descriptor.name === this.#retainActiveName);
      const target = retained
        ?? descriptors.find(descriptor => descriptor.id === this.#physicalOrder[activeIndex])
        ?? descriptors[0];

      const targetSheet = model.getSheetById(target.id) as Sheet;

      this.#withEngineWrites(
        this.#sheetRecords().flatMap((sheet) => {
          const engine = formulasSettingOf(sheet)?.engine;

          return isEngineInstance(engine) ? [engine!] : [];
        }),
        () => this.#sheetRecords().forEach(sheet => this.#registerFormulaSheet(sheet, { feed: sheet !== targetSheet }))
      );

      model.setActiveSheet(target.id);

      // On a live grid — an enable after startup, or an updatePlugin rebuild — `loadData` does
      // not clear filters, hidden or trimmed indexes, merges, borders, or manual sizes, so the
      // previous workbook's view collections would land on the new workbook's opening sheet
      // and be captured as its own state on the first switch away. The reset runs before the
      // sheet is applied, so the opening sheet's own declared `settings` stay in force.
      if (this.hot.view) {
        this.#withoutUndoEntry(() => resetViewState(this.hot, this.#getNeutralFrozenCounts()));
      }

      this.#applySheet(targetSheet, SOURCE_API);

      if (!this.hot.view) {
        this.#handOpeningSheetToInitPass(targetSheet.settings);
      }
    } else {
      const settings = this.#withBaselineFor(undefined);

      if (settings) {
        this.hot.updateSettings(settings);
      }

      this.#loadedSheetId = model.addSheet(null, this.#getLiveSourceData()).id;
      this.#physicalOrder = [this.#loadedSheetId];
    }
  }

  /**
   * Applies a sheet's settings and data to the grid. Undeclared settings keys keep the grid-level
   * values (`#withBaselineFor`).
   *
   * Both go through core's `_applySettingsAndData()`, the order the grid's own initialization uses:
   * every plugin configures with no data-dependent work while the grid still holds the departing
   * sheet's rows, the arriving sheet's data loads with that configuration in force (sized to its own
   * `min*` values), and the work that reads the data (the `cell` option, ColumnSummary's endpoints,
   * CustomBorders, the sorting plugins' `initialConfig`) runs after the load, through each plugin's
   * `onDataReady()`. The `cell` option is restated on every switch (`#effectiveCellOption`), because
   * the load clears the cell meta it wrote. Without a view the grid is still being built, and the
   * plugins do that work from their own `afterInit` instead.
   *
   * With `restoresState` set the sheet returns with a stored view state. It then gets the ColumnSummary
   * endpoints it left with (`#captureColumnSummary`), and the merges its settings declare are not built:
   * the stored ones are restored instead, and the declared ones would win over the ones the user changed.
   *
   * `cellMeta` is the cell meta the sheet's rows carried when the user left it (`#captureCellMeta`). Core
   * writes it back in the meta phase, before the cell types expand, so it is ordinary cell meta again:
   * undo, a row or column change, and a later `loadData()` treat it as they treat any other. That meta is
   * the record of the sheet's custom borders too, so a declared `customBorders` array is not applied again
   * when it is given: the declared pass would replace the borders the user left with by the declared ones.
   * It is not given for a sheet whose rows a server response replaced while it was hidden, so the declared
   * borders apply to the fresh rows.
   */
  #applySheet(
    sheet: Sheet,
    source: string,
    { restoresState = false, cellMeta }: { restoresState?: boolean, cellMeta?: TrackedCellMeta[] } = {},
  ) {
    const payload: Record<string, unknown> = { ...(this.#withBaselineFor(sheet.settings) ?? {}) };
    const cell = this.#effectiveCellOption(payload);

    if (cell) {
      payload.cell = cell;
    }

    const cellOptionMetas = cell ? (this.#cellOptionStates.get(sheet) ?? null) : null;
    const keptCellMetas = cellMeta && cellMeta.length > 0 ? SheetsBar.#toKeptCellMetas(cellMeta) : null;

    if (cellMeta && Array.isArray(payload.customBorders) && !this.#redeclaredBorders.has(sheet)) {
      payload.customBorders = true;
    }

    if (payload.columnSummary && restoresState && this.#columnSummaryStates.has(sheet)) {
      payload.columnSummary = this.#columnSummaryStates.get(sheet);
    }

    const apply = () => {
      this.#loadingSheet = sheet;

      try {
        this.#syncSettingsHooks(payload, sheet.settings);
        this.hot._applySettingsAndData(
          payload as Partial<GridSettings>, sheet.data as unknown[], `${source}.switch`, cellOptionMetas,
          keptCellMetas,
        );
      } finally {
        this.#loadingSheet = null;
      }

      if (this.hot.view) {
        this.#runMergeCellsSettingsPass(!restoresState || this.#redeclaredMerges.has(sheet));
      }

      this.#redeclaredMerges.delete(sheet);
      this.#redeclaredBorders.delete(sheet);
    };

    if (this.hot.view) {
      this.#batchRender(apply);
    } else {
      apply();
    }
  }

  /**
   * Stores the order the formula engine holds the departing sheet in, when a sort or a move reached the
   * engine. The engine moves formula cells on every order it gets, and the sheet's data does not follow
   * (the Formulas plugin writes formula text back into the data only while the order is physical), so
   * the formulas the user saw on a sorted or moved sheet exist only in the engine. Loading the data again
   * and sorting it produced other formulas: `#REF!` in place of moved columns, other sums. A return with
   * the same data array, still as long as when the user left, takes the engine sheet over instead
   * (`#engineOrderToAdopt`). Nothing is stored for a sheet in physical order, whose data matches the
   * engine.
   *
   * @param {object} sheet The departing sheet.
   */
  #captureEngineOrder(sheet: Sheet) {
    const order = this.hot.getPlugin('formulas')?.exportEngineOrder() ?? null;

    if (order) {
      this.#engineOrders.set(sheet, { order, data: sheet.data, length: sheet.data.length });
    } else {
      this.#engineOrders.delete(sheet);
    }
  }

  /**
   * Records whether the departing sheet shows formula text (`Formulas#showFormulas()`). The mode is kept
   * per sheet, like a sort or the filters: it lives on the Formulas plugin, so it carried over to the next
   * formulas sheet, while a sheet without formulas turned the plugin off and dropped it.
   *
   * @param {object} sheet The departing sheet.
   */
  #captureFormulaText(sheet: Sheet) {
    const formulas = this.hot.getPlugin('formulas');

    if (formulas?.enabled && formulas.isShowingFormulas()) {
      this.#formulaTextSheets.add(sheet);
    } else {
      this.#formulaTextSheets.delete(sheet);
    }
  }

  /**
   * Shows or hides formula text for the arriving sheet as the user left it, or hides it on a sheet the
   * user has not left with formula text shown.
   *
   * @param {object} sheet The arriving sheet.
   */
  #restoreFormulaText(sheet: Sheet) {
    const formulas = this.hot.getPlugin('formulas');

    if (!formulas?.enabled || formulas.isShowingFormulas() === this.#formulaTextSheets.has(sheet)) {
      return;
    }

    if (this.#formulaTextSheets.has(sheet)) {
      formulas.showFormulas();
    } else {
      formulas.hideFormulas();
    }
  }

  /**
   * Returns the engine order a returning sheet takes over, or `null` when its data must be loaded into
   * the engine: nothing was stored, the host replaced or resized the data while the sheet was away, or
   * the engine no longer holds the sheet under its binding.
   *
   * @param {object} sheet The arriving sheet.
   * @returns {object|null}
   */
  #engineOrderToAdopt(sheet: Sheet): FormulasEngineSheetOrder | null {
    const stored = this.#engineOrders.get(sheet);
    const formulas = formulasSettingOf(sheet);

    if (!stored || stored.data !== sheet.data || stored.length !== sheet.data.length
      || !formulas?.sheetName || (formulas.engine as unknown) !== stored.order.engine
      || stored.order.engine.getSheetId(formulas.sheetName) !== stored.order.sheetId) {
      return null;
    }

    return stored.order;
  }

  /**
   * Runs a sheet switch with the grid's order changes kept from the formula engine
   * (`Formulas#runWithEngineOrderHeld`), or as it is when the Formulas plugin is not registered.
   *
   * @param {Function} run The switch.
   * @param {object|null} engineOrder The engine order the arriving sheet takes over.
   */
  #withEngineOrderHeld(run: () => void, engineOrder: FormulasEngineSheetOrder | null) {
    const formulas = this.hot.getPlugin('formulas');

    if (formulas) {
      formulas.runWithEngineOrderHeld(run, engineOrder);
    } else {
      run();
    }
  }

  /**
   * Stores the departing sheet's ColumnSummary endpoints at the positions they hold now. A row or column
   * alteration moves an endpoint, while the sheet's settings keep naming the declared position, and a
   * return to the sheet applies those settings again: the summary was then written over the data cell
   * the alteration had moved into its old place. A return applies the stored endpoints instead
   * (`#applySheet`). Nothing is stored while the plugin is off or configured with a function, which
   * reads its settings again on every pass.
   *
   * @param {object} sheet The departing sheet.
   */
  #captureColumnSummary(sheet: Sheet) {
    const endpoints = this.hot.getPlugin('columnSummary')?.exportEndpointSettings() ?? null;

    if (endpoints) {
      this.#columnSummaryStates.set(sheet, endpoints);
    } else {
      this.#columnSummaryStates.delete(sheet);
    }
  }

  /**
   * Stores the meta the `cell` option wrote on the departing sheet, by physical indexes. Core moves that meta
   * with its record on a row or column alteration, while the entries of the setting name visual positions,
   * which a reordering or trimming plugin of the sheet's own settings (a `manualRowMove` or `trimRows`
   * array) also changes during the load. A return that applied the entries again by their coordinates put a
   * declared `readOnly` on another record, on every round trip. A return hands the stored meta to core
   * instead (`#applySheet`), which puts it back by physical index and stores the `cell` setting as declared.
   * Nothing is stored while no `cell` entry is in force.
   *
   * @param {object} sheet The departing sheet.
   */
  #captureCellOption(sheet: Sheet) {
    const entries = this.#exportCellOption();

    if (entries) {
      this.#cellOptionStates.set(sheet, entries);
    } else {
      this.#cellOptionStates.delete(sheet);
    }
  }

  /**
   * Returns the meta the `cell` option wrote on the grid, by physical indexes, or `null` while no `cell`
   * entry is in force.
   *
   * @returns {object[]|null}
   */
  #exportCellOption(): CellOptionMetaEntry[] | null {
    const declared = this.hot.getSettings().cell;

    if (!Array.isArray(declared) || declared.length === 0) {
      return null;
    }

    return this.hot._getMetaManager().getCellOptionCellMetas().map(entry => ({ ...entry }));
  }

  /**
   * Gives a duplicated sheet the `cell`-option meta of its original as the original holds it now. The copy's
   * data is a copy of the original's rows, in the same physical order, so the copy's first visit puts that
   * meta back by physical index like a return does, for the reason `#copyColumnSummaryEndpoints` gives the
   * summaries.
   *
   * @param {object} original The sheet that was duplicated.
   * @param {object} copy The duplicate.
   */
  #copyCellOption(original: Sheet, copy: Sheet) {
    const isOriginalShown = this.#model?.getActiveSheet()?.id === original.id;
    const entries = isOriginalShown ? this.#exportCellOption() : (this.#cellOptionStates.get(original) ?? null);

    if (entries) {
      this.#cellOptionStates.set(copy, entries.map(entry => ({ ...entry })));
    }
  }

  /**
   * Gives a duplicated sheet the cell meta its original carries now: the grid's when the original is shown,
   * or what it left with otherwise. The copy's data is a copy of the original's rows in the same physical
   * order, so its first visit puts the meta back by physical index like a return does, borders included, and
   * it is stored even when empty, so the copy does not take the declared borders its original no longer has.
   * It is dropped once the copy has been shown. Each entry is copied, and so is a plain object or array value,
   * so a change made in place on one sheet does not reach the other. A class instance at the top level is
   * shared, and one nested inside an object value comes out as a plain object.
   *
   * @param {object} original The sheet that was duplicated.
   * @param {object} copy The duplicate.
   */
  #copyCellMeta(original: Sheet, copy: Sheet) {
    const isOriginalShown = this.#model?.getActiveSheet()?.id === original.id;
    const entries = isOriginalShown
      ? this.#captureCellMeta()
      : ((original.viewState?.cellMeta as TrackedCellMeta[] | undefined) ?? this.#copiedCellMeta.get(original));

    if (entries) {
      this.#copiedCellMeta.set(copy, entries.map(entry => ({
        ...entry,
        value: isPlainObject(entry.value) || Array.isArray(entry.value) ? deepClone(entry.value) : entry.value,
      })));
    }
  }

  /**
   * Takes a grid-level `cell` set through `updateSettings()` outside a switch as the value every sheet
   * without its own `cell` restates (`#gridCellOption`), and drops the meta those sheets stored, which
   * describes the previous value: a return put it back over the new one. An unchanged value changes
   * nothing. An update made while the active sheet declares its own `cell` never reaches this method: the
   * settings filter takes it off the payload as the grid-level value (`#filterGridSettings`).
   *
   * @param {object} newSettings The settings passed to `updateSettings()`.
   */
  #refreshGridCellOption(newSettings: Record<string, unknown>) {
    if (!('cell' in newSettings) || this.#isSwitching || this.#isRestoringBaseline
      || this.#isInitializing || this.#model === null) {
      return;
    }

    const active = this.#activeSheetRecord();

    if (isPlainObject(active?.settings) && 'cell' in active.settings) {
      return;
    }

    this.#takeGridCellOption(newSettings.cell);
  }

  /**
   * Takes a grid-level `cell` as the value restated for every sheet without its own, and drops the `cell`
   * meta those sheets stored for the previous value. A structurally equal value changes nothing.
   *
   * @param {*} value The grid-level `cell`.
   */
  #takeGridCellOption(value: unknown) {
    const declaresCell = (sheet: Sheet | null) => isPlainObject(sheet?.settings) && 'cell' in sheet.settings;

    if (isStructurallyEqual(value, this.#gridCellOption)) {
      return;
    }

    this.#gridCellOption = value;

    if (this.#settingsBaseline.has('cell')) {
      this.#settingsBaseline.set('cell', value);
    }

    this.#sheetRecords().forEach((sheet) => {
      if (!declaresCell(sheet)) {
        this.#cellOptionStates.delete(sheet);
      }
    });
  }

  /**
   * Gives a duplicated sheet the ColumnSummary endpoints its original holds now, written into the copy's
   * own settings. The copy's data is a copy of the original's, with every summary at the position a row
   * or column alteration moved it to, and the copy opens as a first visit, so the declared positions
   * would write the summary over the data cell that moved into their place.
   *
   * @param {object} original The sheet that was duplicated.
   * @param {object} copy The duplicate.
   */
  #copyColumnSummaryEndpoints(original: Sheet, copy: Sheet) {
    const isOriginalShown = this.#model?.getActiveSheet()?.id === original.id;
    const endpoints = isOriginalShown
      ? (this.hot.getPlugin('columnSummary')?.exportEndpointSettings() ?? null)
      : (this.#columnSummaryStates.get(original) ?? null);

    if (endpoints) {
      copy.settings = { ...copy.settings, columnSummary: endpoints };
    }
  }

  /**
   * Returns the `cell` value to apply after the arriving sheet's `loadData()`, or `null` when there is
   * none. `loadData()` clears every cell meta object, the ones the `cell` option wrote included, so the
   * option is applied after it on every switch: the sheet's own entries, the grid-level ones when the
   * sheet declares none, and `[]` when the baseline holds no grid-level value, which removes the
   * entries the departing sheet declared from core's record of them. A workbook where neither the
   * grid nor any sheet declares an entry applies nothing, so its switch keeps one settings update.
   *
   * @param {object} settings The settings `#withBaselineFor` built for the arriving sheet.
   * @returns {Array|null}
   */
  #effectiveCellOption(settings: Record<string, unknown>): unknown[] | null {
    if (!('cell' in settings)) {
      const gridCell = this.#gridCellOption;

      return Array.isArray(gridCell) && gridCell.length > 0 ? gridCell : null;
    }

    return Array.isArray(settings.cell) ? settings.cell as unknown[] : [];
  }

  /**
   * Hands the opening sheet's hooks and `cell` entries to core's init settings pass. The bar applies the
   * opening sheet from `beforeInit`, and core then runs that pass with the grid's settings: it registers
   * the grid-level callback of every hook again, replacing the one the sheet declared, and applies the
   * grid-level `cell` after its first load, which clears the cell meta the sheet's own entries wrote.
   * `Core#_replaceInitPassSettings()` makes the pass apply the sheet's values instead, once, with no
   * settings update of their own: applying them again afterwards through `updateSettings()` fired
   * `afterUpdateSettings` before `afterInit`, updated every plugin and ran the validators once more. The
   * grid-level callback each hook replaced goes into the settings baseline, so a switch to another sheet
   * restores it.
   *
   * @param {object|undefined} sheetSettings The opening sheet's own settings.
   */
  #handOpeningSheetToInitPass(sheetSettings: Record<string, unknown> | undefined) {
    const settings = this.#takeInitPassSettings(sheetSettings);
    const replaced = settings ? this.hot._replaceInitPassSettings(settings) : null;

    if (!settings || !replaced) {
      return;
    }

    Object.keys(settings).forEach((key) => {
      if (key !== 'cell' && this.#settingsBaseline.get(key) === undefined) {
        this.#settingsBaseline.set(key, replaced[key]);
      }
    });
  }

  /**
   * Returns the part of the opening sheet's settings that core's own init settings pass would undo
   * (its hook callbacks and its `cell` entries), or `null` when there is none.
   *
   * @param {object|undefined} sheetSettings The opening sheet's own settings.
   * @returns {object|null}
   */
  #takeInitPassSettings(sheetSettings: Record<string, unknown> | undefined): Record<string, unknown> | null {
    const hooks = Hooks.getSingleton();
    const settings = Object.fromEntries(Object.entries(sheetSettings ?? {}).filter(([key, value]) => {
      if (key === 'cell') {
        return Array.isArray(value);
      }

      return key !== PLUGIN_KEY && (hooks.isRegistered(key) || hooks.isDeprecated(key));
    }));

    return Object.keys(settings).length > 0 ? settings : null;
  }

  /**
   * Returns the tab that stands where a removed sheet used to be, or the last tab when the
   * removed sheet was itself the last one.
   *
   * @param {number} position The removed sheet's index in tab order.
   * @returns {HTMLElement|null} The tab to hand the focus to, or `null` when none is left.
   */
  #neighbourTabOf(position: number): HTMLElement | null {
    const sheets = this.getSheets();

    if (position === -1 || sheets.length === 0) {
      return null;
    }

    const neighbour = sheets[Math.min(position, sheets.length - 1)];

    return this.#tabStrip?.getTab(neighbour.id) ?? null;
  }

  /**
   * Expands a sheet's settings with the grid-level value of every key another sheet has
   * overridden but this one does not declare.
   *
   * A sheet's settings are applied with `updateSettings()`, which only knows the keys it is
   * given — so without this, a `columns` array declared by one sheet would still be in force on
   * the next sheet, describing data that no longer exists. The grid-level value of each key is
   * captured the first time a sheet overrides it, which is the last moment it is still the
   * grid's own.
   *
   * The bar introduces the incompatibility between a grid-level `dataProvider` and a multi-sheet
   * workbook (most sheets have no server of their own), so it owns blocking it, rather than the
   * plugin conflict registry, which would also block a sheet's own provider. A sheet without a
   * `dataProvider` of its own (a missing key, or a falsy value) gets `null`; the grid-level value
   * stays in the baseline, captured when the workbook started, so a genuine teardown gives it
   * back. The `null` is only added while there is a `dataProvider` to take off the grid (a
   * baseline one, or the one a previous sheet applied), so a workbook where nobody declared a
   * `dataProvider` never sends the key at all. The baseline never reads `dataProvider` from the
   * grid: a grid-level value was captured before the workbook was built, so the grid holds a
   * sheet's own `dataProvider` by now (after a rebuild, the departing sheet's), and a teardown must
   * not give that back as if it were the grid's.
   *
   * @param {object|undefined} settings The sheet's own settings.
   * @returns {object|null} The settings to apply, or `null` when there is nothing to apply.
   */
  #withBaselineFor(sheetSettings: Record<string, unknown> | undefined): Record<string, unknown> | null {
    // A sheet cannot reconfigure the bar it is a part of: applying `sheetsBar` from inside a
    // switch would rebuild the workbook that is mid-switch.
    const ownSettings = sheetSettings && PLUGIN_KEY in sheetSettings
      ? Object.fromEntries(Object.entries(sheetSettings).filter(([key]) => key !== PLUGIN_KEY))
      : sheetSettings;
    const settings = ownSettings && normalizeFixedColumnsAlias(ownSettings, this.hot.isRtl());

    Object.keys(settings ?? {}).forEach((key) => {
      if (!this.#settingsBaseline.has(key)) {
        this.#settingsBaseline.set(
          key,
          key === 'dataProvider' ? undefined : (this.hot.getSettings() as Record<string, unknown>)[key]
        );
      }
    });

    const restored: Record<string, unknown> = {};

    this.#settingsBaseline.forEach((value, key) => {
      if (!(settings && key in settings)) {
        // `undefined` reads as "not provided" to `updateSettings()`, which skips the key rather
        // than resetting it — `columns: undefined` leaves the previous sheet's column meta in
        // place, so its cell types keep describing data that is no longer there. `null` is the
        // value that clears.
        restored[key] = value === undefined ? null : value;
      }
    });

    if (!settings?.dataProvider
      && (this.#settingsBaseline.has('dataProvider') || this.hot.getSettings().dataProvider)) {
      restored.dataProvider = null;
    }

    const merged = { ...restored, ...(settings ?? {}) };

    return Object.keys(merged).length > 0 ? merged : null;
  }

  /**
   * Applies settings `updateSheetSettings()` merged into the visible sheet's own. A key no sheet set before
   * gets its grid-level value recorded first, as `#withBaselineFor` does on a switch, so the sheets that do not
   * declare it get that value back. The write passes the settings filter (`#isApplyingOwnSettings`), which
   * would otherwise take a key the sheet declares off the payload as a grid-level value.
   *
   * @param {object} changes The settings to apply.
   * @param {object} ownSettings The visible sheet's own settings, the changes included.
   */
  #applyToVisibleSheet(changes: Record<string, unknown>, ownSettings: Record<string, unknown>) {
    Object.keys(changes).forEach((key) => {
      if (!this.#settingsBaseline.has(key)) {
        this.#settingsBaseline.set(
          key,
          key === 'dataProvider' ? undefined : (this.hot.getSettings() as Record<string, unknown>)[key]
        );
      }
    });

    this.#syncSettingsHooks(changes, ownSettings);

    try {
      this.#isApplyingOwnSettings = true;
      this.hot.updateSettings(changes);
    } finally {
      this.#isApplyingOwnSettings = false;
    }
  }

  /**
   * Drops what a hidden sheet kept from the user's last visit for the keys `updateSheetSettings()` changed,
   * so its next visit applies the new values. A return otherwise restores the kept state in place of the
   * declared one, and a change made while the sheet was hidden was lost: the `cell` meta by physical index
   * (`#cellOptionStates`), the column summary positions (`#columnSummaryStates`), the merges, the borders,
   * and every view-state part (`#redeclaredParts`, reset on the next visit and left to the settings). A
   * frozen count is written into the kept state instead, because one part holds all four counts.
   *
   * @param {Sheet} sheet The hidden sheet.
   * @param {object} changes The settings that changed.
   */
  #dropKeptStateFor(sheet: Sheet, changes: Record<string, unknown>) {
    const keys = Object.keys(changes);

    if (keys.includes('cell')) {
      this.#cellOptionStates.delete(sheet);
    }

    if (keys.includes('columnSummary')) {
      this.#columnSummaryStates.delete(sheet);
    }

    if (keys.includes('mergeCells') && sheet.viewState) {
      sheet.viewState = { ...sheet.viewState, mergedCells: [] };
      this.#redeclaredMerges.add(sheet);
    }

    if (keys.includes('customBorders')) {
      this.#dropKeptBorders(sheet);
    }

    if (!sheet.viewState) {
      return;
    }

    keys.forEach((key) => {
      const value = changes[key];

      if (isFrozenCountKey(key)) {
        sheet.viewState = { ...sheet.viewState, [key]: typeof value === 'number' ? value : undefined };
      }

      if (key === 'pagination') {
        this.#redeclarePage(sheet, value);
      }

      VIEW_STATE_PARTS_BY_SETTING[key]?.forEach((part) => {
        const parts = this.#redeclaredParts.get(sheet) ?? new Set<ViewStatePart>();

        parts.add(part);
        this.#redeclaredParts.set(sheet, parts);
      });
    });
  }

  /**
   * Applies a `pagination` value `updateSheetSettings()` gave a hidden sheet to the page the sheet kept, in the
   * order the calls came: an `initialPage` moves the kept page there, as `updateSettings()` moves the grid's
   * page, and the next visit shows the kept page in the new page size (`#withCurrentPageSize`). Resetting the
   * page instead made one call with `initialPage` win over every later call without it.
   *
   * @param {Sheet} sheet The hidden sheet.
   * @param {*} value The new `pagination` value.
   */
  #redeclarePage(sheet: Sheet, value: unknown) {
    const kept = sheet.viewState?.pagination;

    if (kept && isPlainObject(value) && typeof value.initialPage === 'number') {
      sheet.viewState = { ...sheet.viewState, pagination: { ...kept, page: value.initialPage } };
    }

    this.#redeclaredPageSize.add(sheet);
  }

  /**
   * Returns the view state a return restores its viewport from. After `updateSheetSettings()` gave the sheet a
   * `pagination` value, the kept page comes back in the page size the sheet's settings now set, clamped to the
   * pages there are, the way `updateSettings()` treats the page on the grid; the kept page size would otherwise
   * win over the new one.
   *
   * @param {Sheet} sheet The arriving sheet.
   * @param {object} viewState The sheet's kept view state.
   * @returns {object}
   */
  #withCurrentPageSize(sheet: Sheet, viewState: ViewState): ViewState {
    const pagination = this.hot.getPlugin('pagination');

    if (!this.#redeclaredPageSize.has(sheet) || !viewState.pagination || !pagination?.enabled) {
      return viewState;
    }

    return { ...viewState, pagination: { ...viewState.pagination, pageSize: pagination.getCurrentPageSize() } };
  }

  /**
   * Takes the custom borders out of the cell meta a hidden sheet kept (its view state, or a duplicate's
   * copy of its original's meta), where the borders live, and marks the sheet so its next visit applies
   * the declared borders.
   *
   * @param {object} sheet The hidden sheet.
   */
  #dropKeptBorders(sheet: Sheet) {
    const kept = sheet.viewState?.cellMeta;
    const copied = this.#copiedCellMeta.get(sheet);

    if (Array.isArray(kept)) {
      sheet.viewState = {
        ...sheet.viewState,
        cellMeta: kept.filter(entry => isPlainObject(entry) && entry.key !== 'borders'),
      };
    }

    if (copied) {
      this.#copiedCellMeta.set(sheet, copied.filter(entry => entry.key !== 'borders'));
    }

    this.#redeclaredBorders.add(sheet);
  }

  /**
   * Makes the settings callbacks of each hook the payload sets exactly the callbacks the arriving sheet runs
   * with, before the payload is applied (`Hooks#_replaceFromSettings()`). Core's own path cannot: a function
   * in the settings replaces only the earlier settings function, and an array is added beside the earlier
   * callbacks, so the departing sheet's callbacks kept running on the arriving sheet, and after a teardown,
   * whenever either value was an array. A function keeps the place of the one it replaces, so a switch
   * leaves the order of the settings callback and the `addHook()` listeners alone. A grid-level array keeps
   * running beside a sheet's own callback, as it always did: it is registered again after the sheet's. A
   * `null` value needs nothing here, because core removes the settings callbacks for it.
   *
   * @param {object} payload The settings about to be applied.
   * @param {object} [ownSettings] The arriving sheet's own settings.
   */
  #syncSettingsHooks(payload: Record<string, unknown>, ownSettings?: Record<string, unknown>) {
    const hooks = Hooks.getSingleton();
    const context = this.hot as unknown as Record<string, unknown>;

    Object.keys(payload).forEach((key) => {
      const value = payload[key];

      if ((typeof value !== 'function' && !Array.isArray(value))
        || !(hooks.isRegistered(key) || hooks.isDeprecated(key))) {
        return;
      }

      hooks._replaceFromSettings(key, value as HookCallback | HookCallback[], context);

      const gridLevel = this.#settingsBaseline.get(key);

      if (ownSettings && key in ownSettings && Array.isArray(gridLevel)) {
        hooks._addFromSettings(key, gridLevel as HookCallback[], context);
      }
    });
  }

  /**
   * Re-renders the tab strip against the current model state and recomputes
   * paging arrow visibility.
   */
  #refreshUI() {
    this.#tabStrip?.render(this.getSheets());
    this.#overflow?.refresh();
  }

  /**
   * Opens the "all sheets" menu anchored below the `≡` control.
   */
  #openAllSheetsMenu(fromKeyboard: boolean = false) {
    const anchor = this.#ui?.getRefs().allButton;

    if (!anchor) {
      return;
    }

    this.#menus?.openAllSheetsMenu(
      anchor,
      this.getSheets(),
      (id: number) => this.setActiveSheet(id, SOURCE_UI),
      fromKeyboard,
    );
  }

  /**
   * Opens a tab's context menu anchored below its chevron.
   */
  #openTabMenu(id: number, anchor: HTMLElement, fromKeyboard: boolean = false, positionTarget?: HTMLElement) {
    const sheets = this.getSheets();
    const position = sheets.findIndex(sheet => sheet.id === id);
    const canMoveTowardStart = position > 0;
    const canMoveTowardEnd = position !== -1 && position < sheets.length - 1;

    this.#menus?.openTabMenu(anchor, {
      sheetId: id,
      sheetName: sheets[position]?.name ?? '',
      selectFirstItem: fromKeyboard,
      positionTarget,
      // Resolved on close rather than captured here: a command can rebuild the tab this menu
      // was opened from — moving the sheet repaints the whole strip — and the focus has to land
      // on whatever now represents that sheet, not on the node that has since been replaced.
      // When the sheet is gone entirely, the focus goes to whichever tab took its place, and to
      // the one before it when the sheet was last.
      resolveFocusTarget: () => this.#tabStrip?.getTab(id) ?? this.#neighbourTabOf(position) ?? null,
      // A move that cannot go anywhere is offered as disabled rather than silently doing
      // nothing, so the edges of the strip — and a lone sheet, which has no edge to move to —
      // read as such before the item is clicked.
      //
      // Both items name a direction on screen, and under RTL the strip runs the other way: the
      // sheet at index 0 is the rightmost tab, so it is "move right" that has nowhere to go.
      // `#moveSheet()` mirrors the step for the same reason, and the two have to agree.
      canMoveLeft: this.hot.isRtl() ? canMoveTowardEnd : canMoveTowardStart,
      canMoveRight: this.hot.isRtl() ? canMoveTowardStart : canMoveTowardEnd,
      // A workbook always keeps one sheet, so the last one is offered as disabled rather than
      // as a command that quietly does nothing.
      canRemove: sheets.length > 1,
      actions: {
        rename: (sheetId: number) => this.#tabStrip?.startRename(sheetId),
        duplicate: (sheetId: number) => this.#duplicateSheet(sheetId),
        remove: (sheetId: number) => this.#removeSheet(sheetId),
        moveRight: (sheetId: number) => this.#moveSheet(sheetId, 1),
        moveLeft: (sheetId: number) => this.#moveSheet(sheetId, -1),
      },
    });
  }

  /**
   * Runs a mutating operation through one chokepoint: a cancellable before-hook, the
   * mutation itself, and the after-hook, in that order. `mutate` returns `false` to
   * signal the model rejected the operation (no after-hook fires) or the payload
   * passed to `toAfterArgs` on success. `mutate` is responsible for calling
   * `#refreshUI()` itself before returning a successful payload, so the tab strip is
   * always repainted before the after-hook runs.
   *
   * A workbook change requested by a before-hook listener is refused, because the change the
   * listener was told about would then run on another workbook state. And the change stops when a
   * listener destroyed the grid, turned the bar off, or replaced the workbook (`#isLive`).
   */
  #commit<T>(
    beforeHook: string,
    beforeArgs: unknown[],
    mutate: () => T | false,
    afterHook: string,
    toAfterArgs: (payload: T) => unknown[],
    source: string,
  ): T | false {
    const model = this.#model;

    if (this.#isRunningBeforeHook) {
      return false;
    }

    let canceled = false;

    this.#runBeforeChangeHook(() => {
      canceled = this.hot.runHooks(beforeHook, ...beforeArgs, source) === false;
    });
    this.#lastCommitCanceled = canceled;

    if (canceled || !this.#isLive(model)) {
      return false;
    }

    const payload = mutate();

    if (payload === false) {
      return false;
    }

    this.hot.runHooks(afterHook, ...toAfterArgs(payload), source);

    return payload;
  }

  /**
   * Commits an inline tab rename coming from the tab strip. Rejects (and just
   * restores the tab strip's rendered state) when the name is blank, unchanged, already
   * identifying a different sheet in the formula engine, a `beforeSheetTabRename` listener
   * cancels, or the model rejects the name (collision with another sheet).
   */
  #commitRename(id: number, newName: string, source: string = SOURCE_UI): boolean {
    const model = this.#model;

    if (!model) {
      return false;
    }

    const sheet = model.getSheetById(id);

    if (!sheet || typeof newName !== 'string') {
      return false;
    }

    // Clamped here, before the hooks, so the name the hooks report is the name the sheet ends
    // up with.
    const oldName = sheet.name;
    const trimmed = clampSheetName(newName);
    const canAttempt = trimmed !== '' && trimmed !== oldName
      && !this.#renameCollidesInEngine(sheet, oldName, trimmed)
      && this.#canWriteDeclaredName(id);

    const committed = canAttempt && this.#commit(
      'beforeSheetTabRename',
      [id, oldName, trimmed],
      () => {
        if (!model.renameSheet(id, trimmed)) {
          return false;
        }

        this.#writeDeclaredName(id, trimmed);

        if (this.#renameFormulaSheet(sheet, oldName, trimmed, source)) {
          this.#recordRenameStep(id, oldName, trimmed, source);
        }

        this.#refreshUI();

        return trimmed;
      },
      'afterSheetTabRename',
      (name: string) => [id, oldName, name],
      source,
    );

    if (committed === false) {
      this.#refreshUI();
    }

    return committed !== false && committed !== undefined;
  }

  /**
   * Writes a sheet's new name into its entry of the host's `sheets` array, the way an edit writes into the
   * host's `data`, so the array the host keeps describes the workbook as it is. The entry is the host's own
   * object; a frozen one never gets here (`#canWriteDeclaredName` refuses the rename first).
   *
   * @param {number} id The renamed sheet.
   * @param {string} name Its new name.
   */
  #writeDeclaredName(id: number, name: string) {
    const entry = this.#declaredEntries.get(id);

    if (!entry) {
      return;
    }

    entry.name = name;
    this.#recordBuiltSheets();
  }

  /**
   * Records a rename that renamed a formula engine sheet as an undo step, which renames the tab back (and
   * a redo renames it again). The steps recorded before it hold formula text with the old name, and the
   * engine knows only the new one: undoing an older row removal put `=Prices!A1` back into a workbook
   * whose sheet is `Costs`, and the cell showed `#REF!`. Undone in order, the rename goes first, and
   * every older step meets the name its text was written with. Only a `beforeSheetTabRename` listener's
   * veto leaves the step on its stack. A step whose bar was turned off or replaced, whose sheet was removed,
   * or whose name another sheet took since, passes as done: kept on the stack, it was the step every undo
   * hit again, and the older steps could not be reached. Nothing is recorded while UndoRedo is off.
   *
   * @param {number} id The renamed sheet.
   * @param {string} oldName Its name before the rename.
   * @param {string} newName Its name after it.
   * @param {string} source The operation source.
   */
  #recordRenameStep(id: number, oldName: string, newName: string, source: string) {
    const undoRedo = this.hot.getPlugin('undoRedo');
    const owner = this.#model;

    if (!undoRedo?.enabled) {
      return;
    }

    const replay = (name: string, replaySource: string): boolean => {
      if (this.#model !== owner || !owner?.getSheetById(id)) {
        return true;
      }

      this.#lastCommitCanceled = false;

      return this.#commitRename(id, name, replaySource) || !this.#lastCommitCanceled;
    };

    undoRedo.done(() => ({
      actionType: 'rename_sheet',
      undo: (hot: HotInstance, callback: (result?: { wasUndone?: boolean }) => void) => {
        callback({ wasUndone: replay(oldName, 'UndoRedo.undo') });
      },
      redo: (hot: HotInstance, callback: (result?: { wasRedone?: boolean }) => void) => {
        callback({ wasRedone: replay(newName, 'UndoRedo.redo') });
      },
    }), source);
  }

  /**
   * Removes a sheet. When it is the currently active one, first activates the
   * neighbor the model will pick (so the grid runs its normal view-state
   * capture/restore switch) before removing it. Refuses to remove the last sheet.
   * Unless the bar's motion is instant, a copy of the removed tab fades out toward the inline
   * start while the tabs after it slide to close the gap.
   */
  #removeSheet(id: number, source: string = SOURCE_UI): boolean {
    const model = this.#model as SheetModel;
    const sheets = model.getSheets();

    if (sheets.length <= 1 || !sheets.some(sheet => sheet.id === id) || !this.#canWriteSheetArrays()) {
      return false;
    }

    const removed = this.#commit(
      'beforeSheetTabRemove',
      [id],
      () => {
        if (model.getActiveSheet()?.id === id) {
          const index = sheets.findIndex(sheet => sheet.id === id);
          const remaining = sheets.filter(sheet => sheet.id !== id);
          const switched = this.setActiveSheet(remaining[Math.min(index, remaining.length - 1)].id, source);

          // An `afterSheetTabChange` listener may have switched back to the sheet being removed.
          if (!switched || model.getActiveSheet()?.id === id) {
            return false;
          }
        }

        const removedSheet = model.getSheetById(id);
        const tabMotion = this.#captureTabMotion('remove');
        const leavingTab = tabMotion === null ? null : (this.#tabStrip?.captureLeavingTab(id) ?? null);

        if (!model.removeSheet(id)) {
          return false;
        }

        if (removedSheet) {
          this.#removeFormulaSheet(removedSheet);
          this.#getDataProvider()?._releaseContext(this.#contextOf(removedSheet));
        }

        const removedIndex = this.#physicalOrder.indexOf(id);

        if (removedIndex !== -1) {
          this.#physicalOrder.splice(removedIndex, 1);
        }

        this.#pruneDeclaredSheet(id);
        this.#shiftActiveSheetSetting(removedIndex);
        this.#refreshUI();
        this.#playTabMotion(tabMotion, -1);

        if (leavingTab !== null && tabMotion !== null) {
          this.#tabStrip?.slideTabOut(leavingTab, tabMotion.transitionMs);
        }

        return true;
      },
      'afterSheetTabRemove',
      () => [id],
      source,
    );

    return removed !== false;
  }

  /**
   * Takes a removed sheet's declared entry out of the configured `sheets` arrays, so its rows
   * do not stay resident for the grid's life — the model drops its reference, but the settings
   * object would keep holding the data the way `Core` would without its own `loadData` sync of
   * the `data` setting. The grid-level and the plugin-level array are usually one object;
   * both are pruned when they are not.
   */
  #pruneDeclaredSheet(id: number) {
    const entry = this.#declaredEntries.get(id);

    if (!entry) {
      return;
    }

    this.#declaredEntries.delete(id);

    this.#configuredSheetArrays().forEach((sheets) => {
      const index = sheets.indexOf(entry);

      if (index !== -1) {
        sheets.splice(index, 1);
      }
    });

    this.#recordBuiltSheets();
  }

  /**
   * Moves a sheet one tab position toward the given direction (`1` = right,
   * `-1` = left). Under RTL, the tab strip's visual right is the model's lower
   * index, so the direction is mirrored before it is applied to the model.
   */
  #moveSheet(id: number, direction: 1 | -1, source: string = SOURCE_UI): boolean {
    const model = this.#model as SheetModel;
    const order = model.getSheets();
    const from = order.findIndex(sheet => sheet.id === id);

    if (from === -1) {
      return false;
    }

    const step = this.hot.isRtl() ? -direction : direction;

    return this.#moveSheetToIndex(id, from + step, source);
  }

  /**
   * Moves a sheet to an absolute index through the cancellable hook pair.
   *
   * Unless the move comes from a drag, which already put the tab in its place, the tabs slide
   * from their old places to the new ones, and the strip reveals the moved tab.
   *
   * @param {number} id The sheet id.
   * @param {number} to The target index.
   * @param {string} source The operation source reported to the hooks.
   * @param {boolean} [slide=true] Whether the tabs slide to their new places.
   * @returns {boolean} `true` when the sheet moved.
   */
  #moveSheetToIndex(id: number, to: number, source: string, slide: boolean = true): boolean {
    const model = this.#model as SheetModel;
    const order = model.getSheets();
    const from = order.findIndex(sheet => sheet.id === id);

    if (from === -1 || to === from || to < 0 || to >= order.length) {
      return false;
    }

    const moved = this.#commit(
      'beforeSheetTabMove',
      [id, to],
      () => {
        const tabMotion = slide ? this.#captureTabMotion('move') : null;

        if (!model.moveSheet(id, to)) {
          return false;
        }

        this.#refreshUI();
        this.#playTabMotion(tabMotion, id);

        if (slide) {
          this.#tabStrip?.revealTab(id);
        }

        return true;
      },
      'afterSheetTabMove',
      () => [id, to],
      source,
    );

    return moved !== false;
  }

  /**
   * Duplicates a sheet with a derived unique name. A duplicate is treated as an add,
   * so it fires the same `beforeSheetTabAdd`/`afterSheetTabAdd` hooks as `addSheet`.
   */
  #duplicateSheet(id: number, source: string = SOURCE_UI): SheetDescriptor | null {
    const model = this.#model as SheetModel;

    const original = model.getSheetById(id);

    if (!original) {
      return null;
    }

    this.#syncActiveSheetData();

    if (!this.#canWriteSheetArrays()) {
      return null;
    }

    const duplicated = this.#commit(
      'beforeSheetTabAdd',
      [original.name],
      () => {
        const sheet = model.duplicateSheet(id);

        if (!sheet) {
          return false;
        }

        this.#copyServerView(original, sheet);
        this.#copyColumnSummaryEndpoints(original, sheet);
        this.#copyCellOption(original, sheet);
        this.#copyCellMeta(original, sheet);

        // The copy cannot share the original's engine sheet — two tabs writing into one set of
        // cells — so it gets an engine sheet of its own, named like the copy, seeded with the
        // duplicated data.
        const formulas = formulasSettingOf(sheet);

        if (formulas?.sheetName && isEngineInstance(formulas.engine)) {
          const copyName = freeEngineName(formulas.engine!, sheet.name);

          sheet.settings = { ...sheet.settings, formulas: { ...formulas, sheetName: copyName } };
          this.#registerFormulaCopy(sheet, formulas.engine!, formulas.sheetName, copyName);
        }

        this.#appendDeclaredSheet(sheet);
        this.#markTabEntering(sheet.id);
        this.#refreshUI();

        return sheet;
      },
      'afterSheetTabAdd',
      (sheet: Sheet) => [sheet.id, sheet.name],
      source,
    );

    return duplicated === false ? null : { id: duplicated.id, name: duplicated.name, isActive: false };
  }

  /**
   * Registers the bar as a focus scope, so <kbd>Tab</kbd> walks into it from the grid and out
   * of it again, and the bar's shortcut context is active while the focus is inside it.
   */
  #registerFocusScope() {
    const container = this.#ui?.getContainer();

    if (!container || this.#hasFocusScope) {
      return;
    }

    this.hot.getFocusScopeManager().registerScope(PLUGIN_KEY, container, {
      shortcutsContextName: SHORTCUTS_CONTEXT_NAME,
      // A click that opens a menu reaches the scope manager after the menu has taken the
      // keyboard, and activating the scope then would hand the keyboard back to the grid. While
      // a menu is open the bar stands aside; it is a scope again the moment the menu closes and
      // the focus lands back on a tab.
      runOnlyIf: () => !this.#menus?.isOpened(),
      onActivate: (focusSource: unknown) => {
        const focusable = this.#ui?.getFocusableElements() ?? [];

        // The shortcut pipeline only runs for the instance that is listening, and a plain click
        // on a tab activates the scope without making the grid listen. The bar is part of this
        // grid, so the focus landing in it is the grid's to answer.
        this.hot.listen();

        if (focusSource === 'tab_from_above') {
          focusable[0]?.focus();
        } else if (focusSource === 'tab_from_below') {
          focusable[focusable.length - 1]?.focus();
        }
      },
    });
    this.#hasFocusScope = true;
  }

  /**
   * Unregisters the bar's focus scope.
   */
  #unregisterFocusScope() {
    if (!this.#hasFocusScope) {
      return;
    }

    this.hot.getFocusScopeManager().unregisterScope(PLUGIN_KEY);
    this.#hasFocusScope = false;
  }

  /**
   * Binds the bar's keys in its shortcut context: <kbd>Enter</kbd> and <kbd>Space</kbd>
   * activate the focused tab, the arrows and <kbd>Home</kbd>/<kbd>End</kbd> move the focus
   * along the strip, and <kbd>Escape</kbd> abandons a drag.
   *
   * The activation stops the event on its way: opening a menu hands the keyboard to the menu,
   * and the same keystroke would otherwise reach the menu's own listener and run its first
   * item. The rename input is left alone — it owns its keys.
   */
  #registerShortcuts() {
    const context = this.hot.getShortcutManager().getOrCreateContext(SHORTCUTS_CONTEXT_NAME);
    const onTab = () => Boolean(this.#tabStrip?.getFocusedTab());
    const move = (step: 1 | -1 | 'first' | 'last') => () => {
      this.#tabStrip?.focusRelativeTab(step);
    };
    const arrow = (key: 'ArrowLeft' | 'ArrowRight') => () => {
      this.#tabStrip?.focusRelativeTab(this.#tabStrip.arrowStep(key));
    };

    context.addShortcuts([
      {
        keys: [['Enter'], ['Space']],
        callback: () => {
          this.#tabStrip?.activateFocusedTab();
        },
        runOnlyIf: onTab,
        stopPropagation: true,
      },
      { keys: [['ArrowRight']], callback: arrow('ArrowRight'), runOnlyIf: onTab },
      { keys: [['ArrowLeft']], callback: arrow('ArrowLeft'), runOnlyIf: onTab },
      { keys: [['Home']], callback: move('first'), runOnlyIf: onTab },
      { keys: [['End']], callback: move('last'), runOnlyIf: onTab },
      {
        keys: [['Escape']],
        callback: () => {
          this.#tabStrip?.abortDrag();
        },
        runOnlyIf: () => this.#tabStrip?.isDragging() === true,
      },
    ], { group: SHORTCUTS_GROUP });
  }

  /**
   * Removes the bar's shortcuts from its context.
   */
  #unregisterShortcuts() {
    this.hot.getShortcutManager().getContext(SHORTCUTS_CONTEXT_NAME)?.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Registers a sheet in the shared formula engine its settings point at, so a formula on
   * another sheet can reference it before it has ever been activated. Without this, such a
   * reference reads `#REF!` until the first visit feeds the engine.
   *
   * Only a sheet that names its `sheetName` in a built engine instance is registered. A sheet
   * handing over the `HyperFormula` class instead gets an engine of its own per enable, which
   * no other sheet can reference — worth a warning when a `sheetName` suggests the intent was
   * a shared workbook.
   */
  #registerFormulaSheet(
    sheet: Sheet | null,
    { feed = true, beforeFeed }: { feed?: boolean, beforeFeed?: (sheetId: number) => void } = {},
  ) {
    const formulas = sheet ? formulasSettingOf(sheet) : null;

    if (!sheet || !formulas?.sheetName) {
      return;
    }

    if (!isEngineInstance(formulas.engine)) {
      if (typeof formulas.engine === 'function') {
        warn(`The sheet "${sheet.name}" passes the HyperFormula class with a sheetName. Cross-sheet ` +
          'references need one shared engine instance — build it once with HyperFormula.buildEmpty() ' +
          'and pass that instance to every sheet.');
      }

      return;
    }

    const engine = formulas.engine!;

    this.#withEngineWrite(engine, () => this.#feedFormulaSheet(sheet, formulas, engine, feed, beforeFeed));
  }

  /**
   * Adds the sheet to `engine` when the engine does not hold it yet, and feeds it the sheet's data.
   */
  #feedFormulaSheet(
    sheet: Sheet,
    formulas: SheetFormulas,
    engine: NonNullable<SheetFormulas['engine']>,
    feed: boolean,
    beforeFeed?: (sheetId: number) => void,
  ) {
    let engineName = formulas.sheetName!;

    if (!engine.doesSheetExist!(engineName)) {
      // The engine may normalize the name it is asked for — two tabs the model tells apart can
      // be one sheet to the engine — so the binding follows the name `addSheet()` reports back,
      // or the id lookups below would come up empty.
      engineName = engine.addSheet!(engineName);

      if (engineName !== formulas.sheetName) {
        sheet.settings = { ...sheet.settings, formulas: { ...formulas, sheetName: engineName } };
      }
    }

    const sheetId = engine.getSheetId!(engineName);

    if (typeof sheetId !== 'number') {
      return;
    }

    beforeFeed?.(sheetId);

    // Fed on every registration, not only when the sheet is new to the engine: a rebuilt
    // workbook can reuse the names with new data, and an engine sheet left on its old content
    // would keep feeding stale values into the cross-sheet formulas until each sheet is
    // visited once.
    if (feed) {
      const content = this.#readableEngineContent(engine, toEngineContent(sheet.data, this.#layoutSettingsOf(sheet)));

      if (engine.isItPossibleToReplaceSheetContent?.(sheetId, content) === false) {
        engine.setSheetContent!(sheetId, [[]]);
        warn(`The data of the sheet "${sheet.name}" could not be passed to the formula engine, so its ` +
          'formulas were cleared. It most likely exceeds the engine\'s `maxRows` or `maxColumns` limit.');

      } else {
        engine.setSheetContent!(sheetId, content);
      }
    }
  }

  /**
   * Returns a function that quotes every sheet name in a formula that `engine` cannot read without
   * quotes (`#sheetNameText`), asking the engine once per name.
   *
   * @param {object} engine The engine.
   * @returns {Function}
   */
  #formulaQuoterFor(engine: NonNullable<SheetFormulas['engine']>): (formula: string) => string {
    const readable = new Map<string, boolean>();
    const canReadUnquoted = (name: string) => {
      if (!readable.has(name)) {
        readable.set(name, this.#sheetNameText(engine, name) === name);
      }

      return readable.get(name)!;
    };

    return formula => quoteUnreadableSheetNames(formula, canReadUnquoted);
  }

  /**
   * Returns the content the bar feeds `engine` with the quotes the engine needs around a sheet name it
   * cannot read unquoted (`=Лист2!A1` becomes `='Лист2'!A1`), the rule the Formulas plugin applies to
   * every formula it writes into the engine. A row with nothing to quote is kept, and a changed row is
   * a copy, so the host's data is never written.
   *
   * @param {object} engine The engine.
   * @param {Array} content The rows to feed.
   * @returns {Array}
   */
  #readableEngineContent(engine: NonNullable<SheetFormulas['engine']>, content: unknown[]): unknown[] {
    const quoteIfNeeded = this.#formulaQuoterFor(engine);

    return content.map((row) => {
      if (!Array.isArray(row)) {
        return row;
      }

      const cells = row as unknown[];
      let copy: unknown[] | null = null;

      cells.forEach((cell, columnIndex) => {
        if (typeof cell === 'string' && cell.startsWith('=')) {
          const text = quoteIfNeeded(cell);

          if (text !== cell) {
            copy ??= cells.slice();
            copy[columnIndex] = text;
          }
        }
      });

      return copy ?? cells;
    });
  }

  /**
   * Registers a duplicated sheet in the engine of its original, as a copy of the original's engine sheet.
   * A copy is a sheet of its own, so a reference the original makes to itself by name (`=Budget!B1` on
   * `Budget`) names the copy in the copy, as spreadsheet apps duplicate a sheet; kept as it was, the
   * copy's formulas read the original's cells and ignored the copy's own. The original's sheet-scoped
   * named expressions are copied too, with the same change, before the copy's content is fed: without
   * them its formulas read `#NAME?`.
   *
   * @param {object} sheet The copy.
   * @param {object} engine The engine.
   * @param {string} originalName The original's engine sheet name.
   * @param {string} copyName The copy's engine sheet name.
   */
  #registerFormulaCopy(
    sheet: Sheet, engine: NonNullable<SheetFormulas['engine']>, originalName: string, copyName: string,
  ) {
    const copyText = this.#sheetNameText(engine, copyName);
    const repoint = (formula: string) => rewriteSheetReferences(formula, reference => (
      isSameSheetName(reference.name, originalName) ? copyText : null
    ));
    const originalId = engine.getSheetId!(originalName);

    this.#replaceSheetData(sheet, writeFormulaTextChanges(sheet.data, collectFormulaTextChanges(sheet.data, repoint)));
    this.#registerFormulaSheet(sheet, {
      beforeFeed: (copyId) => {
        if (typeof originalId !== 'number') {
          return;
        }

        engine.listNamedExpressions?.(originalId).forEach((name) => {
          const formula = engine.getNamedExpressionFormula?.(name, originalId);
          const expression = formula === undefined
            ? engine.getNamedExpressionValue?.(name, originalId)
            : repoint(formula);

          engine.addNamedExpression?.(name, expression, copyId, engine.getNamedExpression?.(name, originalId)?.options);
        });
      },
    });
  }

  /**
   * Takes a removed sheet out of the formula engine it was bound to, so formulas on the
   * remaining sheets stop calculating against data that no longer has a tab, and the name
   * becomes free for a later sheet or rename to take.
   */
  #removeFormulaSheet(sheet: Sheet) {
    const formulas = formulasSettingOf(sheet);
    const engine = formulas?.engine;

    if (!formulas?.sheetName || !isEngineInstance(engine) || !engine!.doesSheetExist!(formulas.sheetName)) {
      return;
    }

    const sheetId = engine!.getSheetId!(formulas.sheetName);

    if (typeof sheetId === 'number') {
      this.#withEngineWrite(engine!, () => engine!.removeSheet!(sheetId));
    }
  }

  /**
   * Runs an engine call the bar makes as one write: when it ends, every grid on that engine whose
   * sheet the call recalculated paints once (see `Formulas#runEngineWrite`). The write is scoped
   * through the bar's Formulas plugin even while that plugin is off or bound to another engine,
   * so a standalone grid on `engine` paints too.
   *
   * @param {object} engine The engine.
   * @param {Function} run The engine call.
   */
  #withEngineWrite<T>(engine: NonNullable<SheetFormulas['engine']>, run: () => T): T {
    const formulas = this.hot.getPlugin('formulas');

    return formulas ? formulas.runEngineWrite(engine, run) : run();
  }

  /**
   * Runs `run` as one write on each distinct engine of `engines`, so a workbook build that feeds many
   * sheets paints the other grids once per engine, not once per fed sheet.
   *
   * @param {Array<object>} engines The engines the build writes.
   * @param {Function} run The build.
   */
  #withEngineWrites(engines: Array<NonNullable<SheetFormulas['engine']>>, run: () => void) {
    [...new Set(engines)].reduceRight((inner, engine) => () => this.#withEngineWrite(engine, inner), run)();
  }

  /**
   * Whether renaming the tab would strand its engine binding: the sheet is bound under its tab
   * name, and the engine already holds a different sheet under the requested name. The engine
   * rename would be refused, leaving a tab that shows the new name while its formulas keep
   * resolving against the old one — so the rename is rejected up front instead, the way a
   * collision with another tab already is.
   */
  #renameCollidesInEngine(sheet: Sheet, oldName: string, newName: string): boolean {
    const formulas = formulasSettingOf(sheet);

    return formulas?.sheetName === oldName
      && isEngineInstance(formulas.engine)
      && formulas.engine!.doesSheetExist!(oldName)
      && isOtherEngineSheet(formulas.engine!, oldName, newName);
  }

  /**
   * Follows a tab rename into the formula engine: when the sheet was bound to an engine sheet
   * carrying its old tab name, the engine sheet is renamed too, and the stored setting follows.
   * HyperFormula rewrites existing formula references on a rename, so `=Old!A1` elsewhere in
   * the workbook becomes `=New!A1` by itself. A binding whose `sheetName` never matched the tab
   * name is deliberately left alone — the formulas reference the engine name, not the tab.
   */
  #renameFormulaSheet(sheet: Sheet, oldName: string, newName: string, source: string): boolean {
    const formulas = formulasSettingOf(sheet);
    const engine = formulas?.engine;

    if (
      !formulas || formulas.sheetName !== oldName || !isEngineInstance(engine)
      || !engine!.doesSheetExist!(oldName) || isOtherEngineSheet(engine!, oldName, newName)
    ) {
      return false;
    }

    const sheetId = engine!.getSheetId!(oldName);

    if (typeof sheetId !== 'number') {
      return false;
    }

    engine!.renameSheet!(sheetId, newName);

    const engineName = engine!.getSheetName?.(sheetId) ?? newName;
    const nameText = this.#sheetNameText(engine!, engineName);

    sheet.settings = { ...sheet.settings, formulas: { ...formulas, sheetName: engineName } };
    this.#rewriteFormulaText(engine!, formula => rewriteSheetReferences(formula, reference => (
      isSameSheetName(reference.name, oldName) ? nameText : null
    )), source);

    return true;
  }

  /**
   * Returns a sheet name as a formula has to reference it: in quotes when the engine cannot read it
   * without them. HyperFormula writes a name that starts with a digit (`2026`, `1Q`) without quotes,
   * and then cannot read its own text back, so the text the bar writes is checked with the engine
   * itself rather than with a copy of its grammar. The engine is asked only about a name a formula reads
   * as one name (`isUnquotedSheetName()`): it parses `=Sales-EU!A1` as a subtraction, so it would answer
   * yes for a name that needs quotes.
   *
   * @param {object} engine The engine.
   * @param {string} name The sheet name.
   * @returns {string}
   */
  #sheetNameText(engine: NonNullable<SheetFormulas['engine']>, name: string): string {
    const readable = isUnquotedSheetName(name) && engine.validateFormula?.(`=${name}!A1`) !== false;

    return formatSheetName(name, !readable);
  }

  /**
   * Rewrites the formula text of every sheet bound to an engine with `rewrite`, in the data the host
   * holds. A rename makes HyperFormula rewrite the references inside the engine only, and the next load
   * of a sheet's data would feed the old name back as a `#REF!`.
   *
   * The data's own text is rewritten, never replaced by the engine's: on a sorted or moved sheet the
   * engine holds its rows in another order, and its formula text was moved with them, so copying it
   * cell by cell overwrote the formulas of other rows. Every change is found before any is written.
   *
   * @param {object} engine The engine.
   * @param {Function} rewrite Maps a formula's text to its new text.
   * @param {string} source The operation source.
   */
  #rewriteFormulaText(
    engine: NonNullable<SheetFormulas['engine']>, rewrite: (formula: string) => string, source: string,
  ) {
    const active = this.#activeSheetRecord();
    const pending = this.#sheetRecords()
      .filter(sheet => formulasSettingOf(sheet)?.engine === engine)
      .map(sheet => ({ sheet, changes: collectFormulaTextChanges(sheet.data, rewrite) }))
      .filter(({ changes }) => changes.length > 0);

    pending.forEach(({ sheet, changes }) => {
      if (sheet === active) {
        this.#writeActiveFormulaText(sheet, changes, source);
      } else {
        this.#replaceSheetData(sheet, writeFormulaTextChanges(sheet.data, changes));
      }
    });
  }

  /**
   * Writes formula text changes into the active sheet. A cell goes through `setDataAtCell()` where the grid
   * addresses it faithfully, so `afterChange` fires and a host saving off that hook learns the new text:
   * the engine holds the sheet in physical order (`setDataAtCell()` writes the text into the engine as
   * well, and on a sorted or moved sheet the engine's text at that cell is another formula), and the
   * cell's indexes resolve to a visual position whose `colToProp` points back at the same source key (a
   * non-identity `columns[].data` binding breaks that). The rest are written straight into the source
   * array, followed by one render.
   *
   * @param {object} sheet The active sheet.
   * @param {object[]} changes The changes.
   * @param {string} source The operation source.
   */
  #writeActiveFormulaText(sheet: Sheet, changes: FormulaTextChange[], source: string) {
    const formulas = this.hot.getPlugin('formulas');
    const physicalOrder = formulas?.exportEngineOrder() === null;
    const physicalRowOf = new Map<string, number>();
    const edits: Array<[number, number, string]> = [];
    const direct: FormulaTextChange[] = [];

    listSheetRows(sheet.data, !!this.#layoutSettingsOf(sheet).nestedRows).forEach(({ path }, physicalRow) => {
      physicalRowOf.set(path.join('/'), physicalRow);
    });

    changes.forEach((change) => {
      const { key, text } = change;
      const physicalRow = physicalRowOf.get(change.path.join('/'));
      const visualRow = physicalRow === undefined ? null : this.hot.toVisualRow(physicalRow);
      const visualColumn = typeof key === 'number' ? this.hot.toVisualColumn(key) : this.hot.propToCol(key);
      const addressable = physicalOrder && visualRow !== null && typeof visualColumn === 'number'
        && visualColumn >= 0 && this.hot.colToProp(visualColumn) === key && !isChangeTargetFrozen(sheet.data, change);

      if (addressable) {
        edits.push([visualRow, visualColumn, text]);
      } else {
        direct.push(change);
      }
    });

    if (edits.length > 0) {
      this.#withoutUndoEntry(() => this.hot.setDataAtCell(edits, `${source}.rename`));
    }

    if (direct.length === 0) {
      return;
    }

    const data = writeFormulaTextChanges(sheet.data, direct);

    if (data === sheet.data) {
      this.hot.render();

      return;
    }

    const load = () => this.#withoutUndoEntry(() => this.hot.updateData(data as unknown[][], `${source}.rename`));

    if (formulas?.enabled) {
      formulas.runWithEngineOrderHeld(load, formulas.exportEngineOrder());
    } else {
      load();
    }

    sheet.data = data;
  }

  /**
   * Points a sheet that is not in front of the grid at a new data array, and keeps the engine order
   * stored for it (`#captureEngineOrder`) valid when only the array, not its rows, changed.
   *
   * @param {object} sheet The sheet.
   * @param {Array} data The new data, or the sheet's own array.
   */
  #replaceSheetData(sheet: Sheet, data: unknown[]) {
    if (data === sheet.data) {
      return;
    }

    const stored = this.#engineOrders.get(sheet);

    if (stored?.data === sheet.data) {
      this.#engineOrders.set(sheet, { ...stored, data });
    }

    sheet.data = data;
  }

  /**
   * Runs an operation without recording it on the undo stack. Two callers need it. The rename
   * rewrites travel through `setDataAtCell` so `afterChange` fires and the grid repaints, but
   * they are part of the rename, which `#recordRenameStep()` records as one step of its own:
   * recorded on their own, an undo would restore the old reference strings against the
   * already-renamed engine sheet and resolve them to `#REF!`. And a sheet switch re-applies the
   * arriving sheet's sort, filters, and merges through the public APIs, which the user did not
   * just perform.
   *
   * @param {Function} write The operation to run.
   */
  #withoutUndoEntry(write: () => void) {
    withoutUndoEntry(this.hot, write);
  }

  /**
   * Runs the MergeCells settings pass `_applySettingsAndData()` held back, against the
   * arriving sheet's data. With `apply` unset, the declared merges are not built: a sheet that
   * returns with a stored view state restores its own merges, and the declared ones would win over
   * the ones the user unmerged or moved.
   *
   * @param {boolean} apply Whether to build the declared merges.
   */
  #runMergeCellsSettingsPass(apply: boolean) {
    this.hot.getPlugin('mergeCells')?.runDeferredSettingsPass(apply);
  }

  /**
   * Arms the motion gate after a render, so the bar's motion starts in the second animation frame
   * after it, once the first frame has painted the grid. A no-op once the gate is open or one of
   * its frames is pending.
   */
  #onAfterRenderArmMotionGate = (): void => {
    this.#motionGate.arm(this.hot.rootWindow, () => this.enabled && !this.hot.isDestroyed);
  };

  /**
   * Updates the bar's theme when the grid's theme changes.
   */
  #onAfterSetTheme = (themeName: unknown) => {
    this.#ui?.updateTheme(themeName as string | undefined);
    // The icons are refreshed in place, never through `#refreshUI()`: `TabStrip#render()` aborts
    // a tab drag and cancels an open rename, and this hook also fires for a color-scheme or
    // density switch (a ThemeBuilder `params()` or `setColorScheme()` included), so a user typing
    // a sheet name would lose it when the app toggled dark mode. `syncIcon()` re-applies a
    // class-list or renderer mapping only when the theme's icons revision moved.
    this.#ui?.refreshIcons();
    this.#tabStrip?.refreshIcons();
  };

  /**
   * Re-renders the bar's translated labels and tabs when the grid's language changes.
   */
  #onAfterLanguageChange = () => {
    this.#ui?.refreshLabels();
    this.#refreshUI();
  };

  /**
   * Records which sheet's rows the grid holds once `#applySheet` has loaded them. Registered first
   * (`orderIndex` -1), so a later `afterLoadData` listener that throws cannot hide a load that
   * happened.
   */
  #onAfterSheetLoad = () => {
    if (this.#loadingSheet !== null) {
      this.#loadedSheetId = this.#loadingSheet.id;
    }
  };

  /**
   * Brings the formula text of the sheets not in front of the grid in line with the engine after the
   * active sheet changed shape: rows or columns inserted, removed or moved, cells moved, or such a change
   * undone or redone. HyperFormula rewrites the references other sheets hold into the active sheet
   * (`=Data!A5` becomes `=Data!A6` after a row inserted above), but only inside itself, and the Formulas
   * plugin writes the new text back for the grids it knows, not for the sheets the bar keeps. The next
   * switch then fed the old text back, so the reference pointed at another row, and a reference into a
   * removed row read a number instead of `#REF!`.
   */
  #onAfterStructureChange = (): void => {
    if (this.#isSwitching || this.#isInitializing) {
      return;
    }

    const engine = this.hot.getPlugin('formulas')?.engine as SheetFormulas['engine'] | null | undefined;

    if (isEngineInstance(engine ?? undefined)) {
      this.#syncInactiveSheetsFromEngine(engine!);
    }
  };

  /**
   * `afterCreateRow`/`afterCreateCol` listener for `#onAfterStructureChange`. The rows and columns core
   * appends for `minSpareRows` and the other minimum sizes (source `auto`) never reach the engine. An
   * undo or redo replays its rows through `alter()` before the Formulas plugin puts the engine back, so
   * its sync waits for `afterUndo`/`afterRedo` (`#onAfterUndoRedo`).
   */
  #onAfterCreateAxisItems = (index: number, amount: number, source?: string) => {
    if (isEngineChangingSource(source)) {
      this.#onAfterStructureChange();
    }
  };

  /**
   * `afterRemoveRow`/`afterRemoveCol` listener for `#onAfterStructureChange`, with the same exceptions
   * as `#onAfterCreateAxisItems`.
   */
  #onAfterRemoveAxisItems = (index: number, amount: number, physicalIndexes: number[], source?: string) => {
    if (isEngineChangingSource(source)) {
      this.#onAfterStructureChange();
    }
  };

  /**
   * `afterUndo`/`afterRedo` listener for `#onAfterStructureChange`, for a step that inserted, removed or
   * moved rows, columns or cells. A step that changed only cells rewrites no reference, and every undo of
   * an edit used to read the other sheets.
   *
   * @param {object} action The undone or redone step.
   */
  #onAfterUndoRedo = (action: { actionType?: string, operations?: string[] }) => {
    if ([action.actionType, ...(action.operations ?? [])].some(name => STRUCTURAL_STEPS.has(name ?? ''))) {
      this.#onAfterStructureChange();
    }
  };

  /**
   * Copies the engine's formula text into the data of every sheet bound to `engine` that is not in front
   * of the grid. Only a sheet the engine holds in physical order is written: a sheet left sorted or with
   * moved rows or columns has its rows in another order there, and its formulas exist only in the engine
   * until the user returns, when the bar takes the engine sheet over (`#captureEngineOrder`).
   *
   * The engine's cells are matched to the data through the layout the sheet is fed with
   * (`getEngineColumnLayout()`), so a sheet whose `columns` leaves data columns out, a sheet of object rows
   * and a NestedRows tree are written at the cells their text came from; a layout the bar cannot know ahead
   * of time (a `columns` function, a `dataSchema`) is skipped. Only the formula cells whose text names the
   * active sheet are read, one by one: a structural change rewrites nothing else, and serializing every
   * other sheet made each row insert, removal, move and undo pay for the whole workbook. A reference to a
   * sheet name the engine cannot read back without quotes gets them (`#sheetNameText`).
   *
   * @param {object} engine The engine.
   */
  #syncInactiveSheetsFromEngine(engine: NonNullable<SheetFormulas['engine']>) {
    const active = this.#activeSheetRecord();
    const activeName = this.hot.getPlugin('formulas')?.sheetName;

    if (!activeName || !engine.getCellFormula) {
      return;
    }

    const quoteIfNeeded = this.#formulaQuoterFor(engine);
    const needles = [activeName, formatSheetName(activeName, true), '#ref!'].map(name => name.toLowerCase());
    const namesActiveSheet = (formula: string) => {
      const text = formula.toLowerCase();

      return needles.some(needle => text.includes(needle));
    };
    const readsAsEngineText = (cell: string, text: string) => {
      const readable = quoteIfNeeded(cell);

      if (engine.validateFormula?.(readable) !== true) {
        return false;
      }

      const normalized = engine.normalizeFormula?.(readable);

      return typeof normalized === 'string' && quoteIfNeeded(normalized) === text;
    };

    this.#sheetRecords().forEach((sheet) => {
      const formulas = formulasSettingOf(sheet);
      const sheetId = formulas?.sheetName ? engine.getSheetId!(formulas.sheetName) : undefined;

      if (sheet === active || formulas?.engine !== engine || typeof sheetId !== 'number'
        || this.#engineOrders.has(sheet)) {
        return;
      }

      const settings = this.#layoutSettingsOf(sheet);
      const layout = getEngineColumnLayout(sheet.data, settings);

      if (layout === null) {
        return;
      }

      const changes: FormulaTextChange[] = [];

      listSheetRows(sheet.data, !!settings.nestedRows).forEach(({ row, path }, engineRow) => {
        getEngineCellKeys(row, layout).forEach((key, engineColumn) => {
          const cell = typeof key === 'number' || typeof key === 'string' ? readCell(row, key) : undefined;

          if (typeof cell !== 'string' || !cell.startsWith('=') || !namesActiveSheet(cell)) {
            return;
          }

          const fromEngine = engine.getCellFormula!({ sheet: sheetId, row: engineRow, col: engineColumn });
          const text = typeof fromEngine === 'string' ? quoteIfNeeded(fromEngine) : cell;

          if (text !== cell && !readsAsEngineText(cell, text)) {
            changes.push({ path, key: key as number | string, text });
          }
        });
      });

      if (changes.length > 0) {
        this.#replaceSheetData(sheet, writeFormulaTextChanges(sheet.data, changes));
      }
    });
  }

  /**
   * Returns the settings that decide where a sheet's cells sit in its engine sheet, as the sheet is shown
   * with them: its own value of each key, else the grid-level value the switch restores for it.
   *
   * @param {object} sheet The sheet.
   * @returns {object}
   */
  #layoutSettingsOf(sheet: Sheet): SheetLayoutSettings {
    const own = (sheet.settings ?? {}) as Record<string, unknown>;
    const gridSettings = this.hot.getSettings() as unknown as Record<string, unknown>;
    const valueOf = (key: string) => {
      if (Object.prototype.hasOwnProperty.call(own, key)) {
        return own[key];
      }

      return this.#settingsBaseline.has(key) ? this.#settingsBaseline.get(key) : gridSettings[key];
    };

    return {
      columns: valueOf('columns'),
      maxCols: valueOf('maxCols'),
      dataSchema: valueOf('dataSchema'),
      nestedRows: valueOf('nestedRows'),
    };
  }

  /**
   * Points the active sheet's record at the array the host loaded into the grid. The plugin's own loads
   * (the initial build and every switch) are skipped: they load the sheet's own array.
   */
  #onAfterLoadData = (sourceData: unknown[], initialLoad: boolean) => {
    if (initialLoad || this.#isSwitching || this.#isInitializing) {
      return;
    }

    this.#syncActiveSheetData();
  };

  /**
   * Points the active sheet's record at the array the host replaced the grid's data with through
   * `updateData()`, which is how the React, Vue and Angular wrappers hand a grid new data. Left on the old
   * array, a rename rewrote the formulas of the array the grid no longer shows and wrote that text over
   * the cells of the live one.
   */
  #onAfterUpdateData = () => {
    if (!this.#isSwitching && !this.#isInitializing) {
      this.#syncActiveSheetData();
    }
  };

  /**
   * Keeps the keys typed inside the bar away from the grid. A press on the bar keeps the grid's
   * selection, and the editor manager opens the cell editor on any printable key while the grid
   * listens and has a selection, whatever shortcut context is active - so without this a letter
   * typed into the rename input, or pressed on a focused tab, would start editing the selected
   * cell. Registered ahead of the editor manager's own listener, which skips an event marked this
   * way. Only the mark is set: `stopImmediatePropagation()` from `helpers/dom/event` also sets
   * `cancelBubble`, and the grid's key listener sits on the `documentElement`, so the host page's
   * own `document` and `window` listeners would stop seeing every key pressed in the bar.
   *
   * @param {Event} event The keyboard or composition event.
   */
  #onKeyDownWithinBar = (event: Event) => {
    const container = this.#ui?.getContainer();

    if (container && event.composedPath().includes(container)) {
      (event as Event & { isImmediatePropagationEnabled: boolean }).isImmediatePropagationEnabled = false;
    }
  };

  /**
   * Makes the declared workbook win the initial data load. The plugin applies the active
   * sheet's data while the plugins are initialized, but the grid's own init pass then loads
   * whatever the top-level `data` setting declares — which would leave the active sheet never
   * loaded, and the first switch away would capture the host array over the sheet's declared
   * rows, destroying them. With a declared workbook, each sheet owns its data, so the initial
   * load is redirected at the active sheet's array and a clashing top-level `data` is
   * reported once.
   *
   * When the active sheet's own `dataProvider` makes {@link Hooks#hasExternalDataSource} return
   * `true`, this same hook also fires for core's OWN placeholder reload — an unconditional fresh
   * `[]`, never a user-declared top-level `data` (core already ignores that in this mode; see
   * `core.ts`'s own warning for it). That placeholder can never be reference-equal to any sheet's
   * `data`, so without this check every workbook whose active sheet declares a `dataProvider`
   * would warn on every load. The redirect to the active sheet's array still applies — the
   * placeholder must not overwrite it — only the warning is skipped.
   */
  #onBeforeLoadData = (sourceData: unknown[][], initialLoad: boolean) => {
    const activeId = this.#model?.getActiveSheet()?.id ?? null;
    const activeSheet = activeId === null ? null : this.#model?.getSheetById(activeId);

    if (!initialLoad || !activeSheet || this.#declaredEntries.size === 0 || sourceData === activeSheet.data) {
      return;
    }

    const isExternalDataSourcePlaceholder = this.hot.runHooks('hasExternalDataSource') === true;

    if (!isExternalDataSourcePlaceholder && !this.#warnedAboutTopLevelData) {
      this.#warnedAboutTopLevelData = true;
      warn(TOP_LEVEL_DATA_WARNING);
    }

    return activeSheet.data;
  };

  /**
   * Tells whether a `dataProvider` written to the grid now is the grid-level value the bar
   * disables: not a switch applying a sheet's own `dataProvider`, not the teardown restoring the
   * grid-level one, and not the user re-configuring the visible server sheet (the active sheet
   * declares a `dataProvider` of its own).
   *
   * @returns {boolean}
   */
  #blocksGridDataProvider(): boolean {
    if (this.#isSwitching || this.#isRestoringBaseline || this.#model === null) {
      return false;
    }

    const activeId = this.#model.getActiveSheet()?.id ?? null;
    const activeSheet = activeId === null ? null : this.#model.getSheetById(activeId);

    return !activeSheet?.settings?.dataProvider;
  }

  /**
   * Keeps the visible sheet's rows when a later `updateSettings()` call sets a grid-level
   * `dataProvider`. Core applies the new setting before this plugin can block it, sees a complete
   * `dataProvider`, and replaces the grid's data with an empty placeholder through
   * `updateData([])`. The sheet record still points at the rows the grid shows, so the next switch
   * away would store the placeholder as the sheet's data. The placeholder is redirected at the
   * rows the grid already shows, and `#onAfterUpdateSettings` then blocks the value itself. The
   * same holds for the grid-level value sent again while a server sheet is shown, and for the
   * update that puts that sheet's own `dataProvider` back.
   *
   * @param {Array} sourceData The rows about to be loaded.
   * @param {boolean} initialLoad `true` for the initial data load.
   * @param {string} source The source of the update.
   * @returns {Array|undefined} The grid's current rows while a blocked `dataProvider` is applied.
   */
  #onBeforeUpdateData = (sourceData: unknown[], initialLoad: boolean, source: string) => {
    if (source !== 'updateSettings') {
      return;
    }

    const { dataProvider } = this.hot.getSettings();

    if (dataProvider && (this.#blocksGridDataProvider() || this.#isRestoringSheetDataProvider
      || this.#isResentGridDataProvider(dataProvider))) {
      return this.#getLiveSourceData();
    }

    return this.#keepDeclaredSheetRows(sourceData);
  };

  /**
   * Keeps the visible sheet's rows when an `updateSettings()` call sends a top-level `data` beside a
   * declared workbook. Each sheet declares its own data, so the top-level value is ignored on an update the
   * way `#onBeforeLoadData` ignores it at init (one warning covers both): applied, it replaced the active
   * sheet's rows, and the next switch away stored the host's array as that sheet's data. A framework wrapper
   * re-sends its `data` prop on a re-render, which is how this happens without the host asking for it.
   * A `sheetsBar: true` workbook declares no sheets, so its only sheet is the grid's own data and still
   * follows the update. While the active sheet has an external data source, the incoming array is core's
   * own placeholder for DataProvider (a `dataProvider` the user re-configured on the visible server sheet),
   * and it goes through.
   *
   * @param {Array} sourceData The rows about to be loaded.
   * @returns {Array|undefined} The rows the grid shows, when the incoming ones are ignored.
   */
  #keepDeclaredSheetRows(sourceData: unknown[]): unknown[] | undefined {
    const liveData = this.#getLiveSourceData();

    if (this.#isSwitching || this.#declaredEntries.size === 0 || sourceData === liveData
      || !this.#declaresWorkbookNow() || this.hot.runHooks('hasExternalDataSource') === true) {
      return;
    }

    if (!this.#warnedAboutTopLevelData) {
      this.#warnedAboutTopLevelData = true;
      warn(TOP_LEVEL_DATA_WARNING);
    }

    return liveData;
  }

  /**
   * Tells whether the grid-level `sheetsBar` setting still declares a workbook. Core loads an
   * `updateSettings()` payload's `data` before `afterUpdateSettings`, where the bar is turned off or
   * rebuilt, so `#keepDeclaredSheetRows` runs while the previous workbook is still built: for
   * `{ sheetsBar: false, data }`, `sheetsBar: true`, or `sheets: null` the setting already says there is
   * no declared workbook, and the rows belong to the plain grid or the sheet that wraps it.
   *
   * @returns {boolean}
   */
  #declaresWorkbookNow(): boolean {
    const setting: unknown = this.hot.getSettings()[PLUGIN_KEY];

    if (!isPlainObject(setting)) {
      return false;
    }

    return !('sheets' in setting) || (Array.isArray(setting.sheets) && setting.sheets.length > 0);
  }

  /**
   * Blocks a grid-level `dataProvider` set through a later `updateSettings()` call, the same way
   * `#withBaselineFor` blocks it on a switch. It runs ahead of every other `afterUpdateSettings`
   * listener (a negative `orderIndex`), so the DataProvider plugin never enables with the blocked
   * value: no `fetchRows` call, no loading overlay. The initial workbook build applies its
   * opening sheet before this hook is registered. See `#blocksGridDataProvider` for the cases
   * that are left alone.
   *
   * @param {object} newSettings The settings passed to `updateSettings()`.
   */
  #onAfterUpdateSettings = (newSettings: Record<string, unknown>) => {
    this.#refreshSettingsBaseline(newSettings);
    this.#refreshGridColumnSummary(newSettings);
    this.#refreshGridCellOption(newSettings);

    if (newSettings.dataProvider === null && !(PLUGIN_KEY in newSettings)) {
      this.#keepActiveSheetDataProvider(null);
    }

    if (!newSettings.dataProvider) {
      return;
    }

    if (!this.#blocksGridDataProvider()) {
      if (this.#isResentGridDataProvider(newSettings.dataProvider)) {
        this.#restoreActiveSheetDataProvider();
      } else {
        this.#keepActiveSheetDataProvider(newSettings.dataProvider);
      }

      return;
    }

    this.#recordBlockedGridDataProvider(newSettings.dataProvider);
    this.hot.updateSettings({ dataProvider: null });
  };

  /**
   * Tells whether a `dataProvider` written to the grid is the grid-level value the bar blocked,
   * sent again while a server sheet is shown. Framework wrappers re-send unchanged settings on every
   * render, so this value must not be taken for the user re-configuring the visible sheet.
   *
   * @param {*} dataProvider The value written to the grid.
   * @returns {boolean}
   */
  #isResentGridDataProvider(dataProvider: unknown): boolean {
    if (!dataProvider || this.#isSwitching || this.#isRestoringBaseline) {
      return false;
    }

    const own = this.#activeSheetRecord()?.settings?.dataProvider;

    return Boolean(own) && own !== dataProvider && dataProvider === this.#settingsBaseline.get('dataProvider');
  }

  /**
   * Puts the visible server sheet's own `dataProvider` back over the grid-level value sent again,
   * without a refetch: the sheet keeps its rows, its running fetch, and its query.
   */
  #restoreActiveSheetDataProvider() {
    const own = this.#activeSheetRecord()?.settings?.dataProvider as DataProviderConfig;
    const apply = () => this.hot.updateSettings({ dataProvider: own });
    const dataProvider = this.#getDataProvider();

    this.#isRestoringSheetDataProvider = true;

    try {
      if (dataProvider) {
        dataProvider._runWithoutFetching(apply);
      } else {
        apply();
      }
    } finally {
      this.#isRestoringSheetDataProvider = false;
    }
  }

  /**
   * Keeps a `dataProvider` the user sets through `updateSettings()` on the visible server sheet as
   * that sheet's own, so switching away and back applies it again instead of the one the sheet was
   * declared with. That includes `null`, which turns the sheet into a local one: without it the
   * declared `dataProvider` came back on the next return. The sheet record's `settings` object is
   * replaced, never written into: it may be the object the host declared. A switch applying a sheet,
   * and the teardown restoring the grid-level value, are left alone. The bar's own
   * `updateSettings({ dataProvider: null })`, which takes a blocked grid-level value off a sheet with no
   * `dataProvider` of its own, changes nothing here.
   */
  #keepActiveSheetDataProvider(dataProvider: unknown) {
    if (this.#isSwitching || this.#isRestoringBaseline) {
      return;
    }

    const sheet = this.#activeSheetRecord();

    if (sheet?.settings?.dataProvider && sheet.settings.dataProvider !== dataProvider) {
      sheet.settings = { ...sheet.settings, dataProvider };
    }
  }

  /**
   * Returns the cell meta the grid's rows carry now, by physical indexes, for a sheet the user is about to
   * leave: every key set through `setCellMeta()` (or put back by an undo of one), and a `valid: false` entry
   * for each cell whose last validation failed. The keys MergeCells keeps for itself (`hidden`, `spanned`) are
   * left out, because the switch restores the merges. `valid` comes only from core's list of the cells whose
   * meta holds `valid: false`, so a `valid: true` is dropped.
   *
   * @returns {object[]}
   */
  #captureCellMeta(): TrackedCellMeta[] {
    const metaManager = this.hot._getMetaManager();
    const entries: TrackedCellMeta[] = [];

    metaManager.getUserDefinedCellMetas().forEach(({ physicalRow, physicalColumn, key, value }) => {
      if (!UNKEPT_META_KEYS.has(key)) {
        entries.push({ row: physicalRow, col: physicalColumn, key, value });
      }
    });
    metaManager.getInvalidCellMetas().forEach(({ physicalRow, physicalColumn }) => {
      entries.push({ row: physicalRow, col: physicalColumn, key: 'valid', value: false });
    });

    return entries;
  }

  /**
   * Splits a sheet's kept cell meta into what core puts back after the sheet's rows load: the keys the user
   * set, and the cells to mark invalid.
   *
   * @param {object[]} entries The entries `#captureCellMeta` returned.
   * @returns {object}
   */
  static #toKeptCellMetas(entries: TrackedCellMeta[]): KeptCellMetas {
    const kept: KeptCellMetas = { userDefined: [], invalid: [] };

    entries.forEach(({ row, col, key, value }) => {
      if (key === 'valid') {
        if (value === false) {
          kept.invalid.push({ physicalRow: row, physicalColumn: col });
        }
      } else {
        kept.userDefined.push({ physicalRow: row, physicalColumn: col, key, value });
      }
    });

    return kept;
  }
}
