import { BasePlugin } from '../base';
import { SheetModel, clampSheetName, type Sheet, type SheetDescriptor } from './sheetModel';
import { SheetsBarUI } from './ui/bar';
import { TabStrip } from './ui/tabStrip';
import { SheetsBarMenus } from './ui/menus';
import { OverflowController } from './ui/overflow';
import {
  captureViewState,
  resetViewState,
  restoreViewState,
  restoreViewport,
  type TrackedCellMeta,
  type ViewState,
} from './viewState';
import * as C from '../../i18n/constants';
import { announce } from '../../utils/a11yAnnouncer';
import { isRootInstance } from '../../utils/rootInstance';
import { isPlainObject } from '../../helpers/object';
import { warn } from '../../helpers/console';
import { isHTMLElement } from '../../helpers/dom/element';

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
 * A sheet definition accepted by the `sheets` setting.
 */
export interface SheetsBarSheetConfig {
  name?: string;
  data?: unknown[][];
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
}

/**
 * The key a tracked cell-meta write is stored under: one slot per cell and property.
 */
function trackedCellMetaKey({ row, col, key }: TrackedCellMeta): string {
  return `${row}:${col}:${key}`;
}

/**
 * Compares two entries of the `sheets` setting. Entries are equal when they carry the
 * same name and hand over the same `data` and `settings` objects — the arrays are
 * compared by reference on purpose, since a workbook's data can be arbitrarily large
 * and a framework wrapper re-emits the same references on every render.
 */
function isSameSheetConfig(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (!isPlainObject(a) || !isPlainObject(b)) {
    return false;
  }

  return a.name === b.name && a.data === b.data && a.settings === b.settings;
}

/**
 * Compares two values of the `sheetsBar` setting structurally. Used to tell an
 * `updateSettings` call that merely re-emits the same configuration from a framework
 * wrapper apart from one that genuinely declares a different workbook.
 */
function isSameSheetsBarSetting(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (!isPlainObject(a) || !isPlainObject(b)) {
    return false;
  }

  const scalarKeys = ['activeSheet', 'controls', 'paging', 'position', 'uiContainer'];

  if (scalarKeys.some(key => a[key] !== b[key])) {
    return false;
  }

  if (a.sheets === b.sheets) {
    return true;
  }

  if (!Array.isArray(a.sheets) || !Array.isArray(b.sheets) || a.sheets.length !== b.sheets.length) {
    return false;
  }

  return a.sheets.every((entry, index) => isSameSheetConfig(entry, (b.sheets as unknown[])[index]));
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
    setSheetContent?: (sheetId: number, content: unknown[][]) => void;
    getSheetSerialized?: (sheetId: number) => unknown[][];
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
 * What survives an `updatePlugin` round trip that keeps the workbook.
 */
interface PreservedState {
  model: SheetModel;
  trackedCellMeta: Map<string, TrackedCellMeta>;
  settingsBaseline: Map<string, unknown>;
}

/**
 * @plugin SheetsBar
 * @class SheetsBar
 *
 * @description
 * The plugin renders a tab bar below the grid — or above it, with the `position`
 * setting — and lets the user switch between the
 * sheets of a multi-sheet workbook. Each sheet owns its data, its optional settings,
 * and its runtime view state.
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
    };
  }

  /**
   * Returns an object of validator functions used to type-check each settings property at runtime.
   */
  static get SETTINGS_VALIDATORS() {
    return {
      sheets: (value: unknown) => value === null || value === undefined || Array.isArray(value),
      activeSheet: (value: unknown) => typeof value === 'number',
      controls: (value: unknown) => typeof value === 'boolean',
      paging: (value: unknown) => typeof value === 'boolean',
      position: (value: unknown) => value === 'top' || value === 'bottom',
      uiContainer: (value: unknown) => value === null || value === undefined || isHTMLElement(value),
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
   * Explicit `setCellMeta` writes made while the active sheet is applied, tracked so they
   * can be replayed after the sheet is switched back to. Keyed by cell and property, so a
   * property written many times — a validator flipping `valid`, a renderer toggling a class —
   * costs one entry holding the last value rather than one per write. Cleared and reloaded
   * from the target sheet's captured view state on every switch.
   *
   * @type {Map<string, TrackedCellMeta>}
   */
  #trackedCellMeta = new Map<string, TrackedCellMeta>();
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
   * The `sheetsBar` setting value the current workbook was built from, kept so
   * `updatePlugin` can tell a genuine reconfiguration apart from a settings object that
   * a framework wrapper re-emitted unchanged.
   *
   * @type {unknown}
   */
  #lastBuiltSetting: unknown = undefined;
  /**
   * The model, the tracked cell meta, and the settings baseline carried across an
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

    this.#neutralFixedColumnsStart = this.hot.getSettings().fixedColumnsStart as number | undefined;

    if (this.#preservedState) {
      this.#model = this.#preservedState.model;
      this.#trackedCellMeta = this.#preservedState.trackedCellMeta;
      this.#settingsBaseline = this.#preservedState.settingsBaseline;
    } else {
      try {
        this.#isInitializing = true;
        this.#model = new SheetModel(() => this.hot.getTranslatedPhrase(C.SHEETS_BAR_DEFAULT_SHEET_NAME) as string);
        this.#buildInitialWorkbook();
      } finally {
        this.#isInitializing = false;
      }
    }

    this.#lastBuiltSetting = this.hot.getSettings()[PLUGIN_KEY];

    if (!this.#ui) {
      this.#ui = new SheetsBarUI({
        rootDocument: this.hot.rootDocument,
        uiContainer: this.getSetting('uiContainer'),
        isRtl: this.hot.isRtl(),
        themeName: this.hot.getCurrentThemeName(),
        phraseTranslator: (key: string, args?: unknown) => this.hot.getTranslatedPhrase(key, args),
        a11yAnnouncer: (message: unknown) => announce(String(message ?? '')),
        ariaTags: this.hot.getSettings().ariaTags,
      });
      this.#ui.setControlsVisible(this.getSetting<boolean>('controls') !== false);
      this.#ui
        // Adding from the bar switches to what was just created, the way a spreadsheet does —
        // the user asked for a new sheet in order to work in it. The API `addSheet()` stays
        // silent, so a script building a workbook does not walk the grid through every sheet.
        .addLocalHook('addSheetClick', () => {
          const added = this.addSheet(undefined, undefined, SOURCE_UI);

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
      });
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
          if (!this.#moveSheetToIndex(id, toIndex, SOURCE_UI)) {
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

    this.#registerFocusScope();
    this.#registerShortcuts();

    this.addHook('afterSetTheme', this.#onAfterSetTheme);
    this.addHook('afterLanguageChange', this.#onAfterLanguageChange);
    this.addHook('afterSetCellMeta', this.#onAfterSetCellMeta);

    this.#refreshUI();

    super.enablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    const incoming = this.hot.getSettings()[PLUGIN_KEY];
    const preservedState = this.#model !== null && isSameSheetsBarSetting(incoming, this.#lastBuiltSetting)
      ? { model: this.#model, trackedCellMeta: this.#trackedCellMeta, settingsBaseline: this.#settingsBaseline }
      : null;

    this.disablePlugin();

    this.#preservedState = preservedState;

    try {
      this.enablePlugin();
    } finally {
      this.#preservedState = null;
    }

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
    this.#releaseState();
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
   * workbook, and a workbook configured later starts from the grid as it is then.
   */
  #releaseState() {
    if (isRootInstance(this.hot)) {
      if (this.#registeredSide) {
        this.hot.getLayoutManager().unregister(PLUGIN_KEY, this.#registeredSide);
        this.#registeredSide = null;
      }

      this.#unregisterFocusScope();
      this.#unregisterShortcuts();
    }

    this.#model = null;
    this.#trackedCellMeta = new Map();
    this.#settingsBaseline = new Map();
    this.#lastBuiltSetting = undefined;
    this.#isSwitching = false;
    this.#isInitializing = false;
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
   * Rejected — and reported as `false` — when the name is blank, unchanged, already taken by
   * another sheet, or a `beforeSheetTabRename` listener cancels it.
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
   * The copy carries a deep clone of the sheet's data and settings, and a name derived from the
   * original. Rejected — and reported as `null` — when the id is unknown or a
   * `beforeSheetTabAdd` listener cancels it.
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
   * Removing the active sheet activates its nearest remaining neighbor first, so the grid runs
   * its normal view-state switch. The last remaining sheet cannot be removed. Rejected — and
   * reported as `false` — when the id is unknown, it is the last sheet, or a
   * `beforeSheetTabRemove` listener cancels it.
   *
   * @param {number} id The sheet to remove.
   * @param {string} [source='SheetsBar.api'] Operation source tag, passed on to the hooks.
   * @returns {boolean} `true` when the sheet was removed.
   */
  removeSheet(id: number, source: string = SOURCE_API): boolean {
    return this.#removeSheet(id, source);
  }

  /**
   * Activates a sheet by id or unique name. Returns `false` when the sheet does not
   * exist, is already active, or a `beforeSheetTabChange` listener canceled the switch.
   *
   * @param {number|string} idOrName The sheet's id, or its name.
   * @param {string} [source='SheetsBar.api'] Operation source tag, passed on to the hooks.
   * @returns {boolean} `true` when the sheet was activated.
   */
  setActiveSheet(idOrName: number | string, source: string = SOURCE_API): boolean {
    const model = this.#model;
    const newId = model?.resolveId(idOrName) ?? null;
    const oldId = model?.getActiveSheet()?.id ?? null;

    if (model === null || newId === null || newId === oldId || this.#isSwitching) {
      return false;
    }

    const switched = this.#commit(
      'beforeSheetTabChange',
      [oldId, newId],
      () => {
        const oldSheet = oldId === null ? null : model.getSheetById(oldId);

        if (oldSheet) {
          this.#syncActiveSheetData();
          oldSheet.viewState = captureViewState(this.hot, Array.from(this.#trackedCellMeta.values())) as
            unknown as Record<string, unknown>;
          this.hot.runHooks('afterSheetTabStateCapture', oldId, oldSheet.viewState, source);
        }

        try {
          this.#isSwitching = true;
          this.#switchTo(model, newId, source);
        } finally {
          this.#isSwitching = false;
        }

        this.#refreshUI();

        return true;
      },
      'afterSheetTabChange',
      () => [oldId, newId],
      source,
    );

    if (switched === false) {
      return false;
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
   * Moves a sheet to an absolute tab index.
   *
   * The index is a model index, not a visual one — a caller reading positions off the DOM under
   * RTL has already accounted for the mirroring, so nothing is mirrored here.
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
   * listener canceled the operation.
   *
   * @param {string} [name] The sheet's name. Omitted, the next free `Sheet{n}` is used.
   * @param {Array[]} [data] The sheet's data. Omitted, the sheet starts blank.
   * @param {string} [source='SheetsBar.api'] Operation source tag, passed on to the hooks.
   * @returns {object|null} A descriptor for the new sheet, or `null`.
   */
  addSheet(name?: string, data?: unknown[][], source: string = SOURCE_API): SheetDescriptor | null {
    const model = this.#model;

    if (model === null) {
      return null;
    }

    const sheet = this.#commit(
      'beforeSheetTabAdd',
      [name ?? null],
      () => {
        const added = model.addSheet(name ?? null, data);

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
    const activeId = this.#model?.getActiveSheet()?.id ?? null;
    const activeSheet = activeId === null ? null : this.#model?.getSheetById(activeId);

    if (activeSheet) {
      activeSheet.data = this.#getLiveSourceData();
    }
  }

  /**
   * Activates a sheet in the model, applies its settings and data, and brings the view
   * back to the state it was captured in. A sheet that was never visited gets a neutral
   * baseline instead, so it does not inherit the outgoing sheet's filters, hidden
   * indexes, merges, borders, or manual sizes.
   */
  #switchTo(model: SheetModel, newId: number, source: string) {
    model.setActiveSheet(newId);

    const newSheet = model.getSheetById(newId) as Sheet;

    this.#trackedCellMeta = new Map(
      ((newSheet.viewState?.cellMeta as TrackedCellMeta[] | undefined) ?? [])
        .map(entry => [trackedCellMetaKey(entry), entry]),
    );

    // The whole switch paints once. Applying the sheet, restoring its view state, re-selecting
    // and scrolling each ask for a full render on their own, and every one of those renders
    // re-measures the column widths of the sheet that has just arrived — on a large sheet that
    // was four sweeps over the same data before a single frame reached the screen.
    const viewState = newSheet.viewState as unknown as ViewState | undefined;
    const switchSheet = () => {
      this.#applySheet(newSheet, source);

      if (viewState) {
        restoreViewState(this.hot, viewState);
      } else {
        resetViewState(this.hot, this.#neutralFixedColumnsStart);
      }
    };

    if (this.hot.view) {
      this.hot.batchRender(switchSheet);
    } else {
      switchSheet();
    }

    // The selection, the scroll position, and the hook wait for the batch to end: the first two
    // need the arriving sheet painted at its own sizes, and a listener reading the DOM from the
    // hook has to see the sheet it is being told about.
    if (viewState) {
      if (this.hot.view) {
        this.hot.batchRender(() => restoreViewport(this.hot, viewState));
      }

      this.hot.runHooks('afterSheetTabStateRestore', newId, newSheet.viewState, source);
    }
  }

  /**
   * Builds the initial workbook from the `sheets` setting, or wraps the grid's
   * current data as `Sheet1` when the setting is omitted.
   */
  #buildInitialWorkbook() {
    const model = this.#model as SheetModel;
    const sheetsSetting = this.getSetting('sheets') as
      Array<{ name?: string, data?: unknown[][], settings?: Record<string, unknown> }> | null;

    if (Array.isArray(sheetsSetting) && sheetsSetting.length > 0) {
      sheetsSetting.forEach((entry) => {
        this.#registerFormulaSheet(model.addSheet(entry.name ?? null, entry.data, entry.settings));
      });

      const activeIndex = this.getSetting<number>('activeSheet') ?? 0;
      const descriptors = model.getSheets();
      const target = descriptors[activeIndex] ?? descriptors[0];

      model.setActiveSheet(target.id);
      this.#applySheet(model.getSheetById(target.id) as Sheet, SOURCE_API);
    } else {
      model.addSheet(null, this.#getLiveSourceData());
    }
  }

  /**
   * Applies a sheet's settings and data to the grid. Undeclared settings keys keep the
   * grid-level values. Batches the operation into a single render when the grid's view
   * is already constructed; during initial plugin setup the view does not exist yet and
   * the grid's own startup render covers it.
   */
  #applySheet(sheet: Sheet, source: string) {
    const apply = () => {
      const settings = this.#withBaselineFor(sheet.settings);

      if (settings) {
        this.hot.updateSettings(settings);
      }
      this.hot.loadData(sheet.data as never, `${source}.switch`);
    };

    if (this.hot.view) {
      this.hot.batchRender(apply);
    } else {
      apply();
    }
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
   * @param {object|undefined} settings The sheet's own settings.
   * @returns {object|null} The settings to apply, or `null` when there is nothing to apply.
   */
  #withBaselineFor(sheetSettings: Record<string, unknown> | undefined): Record<string, unknown> | null {
    // A sheet cannot reconfigure the bar it is a part of: applying `sheetsBar` from inside a
    // switch would rebuild the workbook that is mid-switch.
    const settings = sheetSettings && PLUGIN_KEY in sheetSettings
      ? Object.fromEntries(Object.entries(sheetSettings).filter(([key]) => key !== PLUGIN_KEY))
      : sheetSettings;

    Object.keys(settings ?? {}).forEach((key) => {
      if (!this.#settingsBaseline.has(key)) {
        this.#settingsBaseline.set(key, (this.hot.getSettings() as Record<string, unknown>)[key]);
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

    const merged = { ...restored, ...(settings ?? {}) };

    return Object.keys(merged).length > 0 ? merged : null;
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
   */
  #commit<T>(
    beforeHook: string,
    beforeArgs: unknown[],
    mutate: () => T | false,
    afterHook: string,
    toAfterArgs: (payload: T) => unknown[],
    source: string,
  ): T | false {
    if (this.hot.runHooks(beforeHook, ...beforeArgs, source) === false) {
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
   * restores the tab strip's rendered state) when the name is blank, unchanged, a
   * `beforeSheetTabRename` listener cancels, or the model rejects the name
   * (collision with another sheet).
   */
  #commitRename(id: number, newName: string, source: string = SOURCE_UI): boolean {
    const model = this.#model as SheetModel;
    const sheet = model.getSheetById(id);

    if (!sheet || typeof newName !== 'string') {
      return false;
    }

    // Clamped here, before the hooks, so the name the hooks report is the name the sheet ends
    // up with.
    const oldName = sheet.name;
    const trimmed = clampSheetName(newName);
    const canAttempt = trimmed !== '' && trimmed !== oldName;

    const committed = canAttempt && this.#commit(
      'beforeSheetTabRename',
      [id, oldName, trimmed],
      () => {
        if (!model.renameSheet(id, trimmed)) {
          return false;
        }

        this.#renameFormulaSheet(sheet, oldName, trimmed);
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
   * Removes a sheet. When it is the currently active one, first activates the
   * neighbor the model will pick (so the grid runs its normal view-state
   * capture/restore switch) before removing it. Refuses to remove the last sheet.
   */
  #removeSheet(id: number, source: string = SOURCE_UI): boolean {
    const model = this.#model as SheetModel;
    const sheets = model.getSheets();

    if (sheets.length <= 1 || !sheets.some(sheet => sheet.id === id)) {
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

          if (!switched) {
            return false;
          }
        }

        const removedSheet = model.getSheetById(id);

        if (!model.removeSheet(id)) {
          return false;
        }

        if (removedSheet) {
          this.#removeFormulaSheet(removedSheet);
        }

        this.#refreshUI();

        return true;
      },
      'afterSheetTabRemove',
      () => [id],
      source,
    );

    return removed !== false;
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
   * @param {number} id The sheet id.
   * @param {number} to The target index.
   * @param {string} source The operation source reported to the hooks.
   * @returns {boolean} `true` when the sheet moved.
   */
  #moveSheetToIndex(id: number, to: number, source: string): boolean {
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
        if (!model.moveSheet(id, to)) {
          return false;
        }

        this.#refreshUI();

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

    const duplicated = this.#commit(
      'beforeSheetTabAdd',
      [original.name],
      () => {
        const sheet = model.duplicateSheet(id);

        if (!sheet) {
          return false;
        }

        // The copy cannot share the original's engine sheet — two tabs writing into one set of
        // cells — so it gets an engine sheet of its own, named like the copy, seeded with the
        // duplicated data.
        const formulas = formulasSettingOf(sheet);

        if (formulas?.sheetName && isEngineInstance(formulas.engine)) {
          sheet.settings = { ...sheet.settings, formulas: { ...formulas, sheetName: sheet.name } };
          this.#registerFormulaSheet(sheet);
        }

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
  #registerFormulaSheet(sheet: Sheet | null) {
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

    if (!engine.doesSheetExist!(formulas.sheetName)) {
      engine.addSheet!(formulas.sheetName);
    }

    // Fed on every registration, not only when the sheet is new to the engine: a rebuilt
    // workbook can reuse the names with new data, and an engine sheet left on its old content
    // would keep feeding stale values into the cross-sheet formulas until each sheet is
    // visited once.
    engine.setSheetContent!(engine.getSheetId!(formulas.sheetName) as number, sheet.data);
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

    engine!.removeSheet!(engine!.getSheetId!(formulas.sheetName) as number);
  }

  /**
   * Follows a tab rename into the formula engine: when the sheet was bound to an engine sheet
   * carrying its old tab name, the engine sheet is renamed too, and the stored setting follows.
   * HyperFormula rewrites existing formula references on a rename, so `=Old!A1` elsewhere in
   * the workbook becomes `=New!A1` by itself. A binding whose `sheetName` never matched the tab
   * name is deliberately left alone — the formulas reference the engine name, not the tab.
   */
  #renameFormulaSheet(sheet: Sheet, oldName: string, newName: string) {
    const formulas = formulasSettingOf(sheet);
    const engine = formulas?.engine;

    if (
      !formulas || formulas.sheetName !== oldName || !isEngineInstance(engine)
      || !engine!.doesSheetExist!(oldName) || engine!.doesSheetExist!(newName)
    ) {
      return;
    }

    engine!.renameSheet!(engine!.getSheetId!(oldName) as number, newName);
    sheet.settings = { ...sheet.settings, formulas: { ...formulas, sheetName: newName } };
    this.#syncFormulaDataFromEngine(engine!);
  }

  /**
   * Writes the engine's formula strings back into the data of every sheet bound to it.
   *
   * A rename rewrites the references inside the engine only; each sheet's data array still
   * carries the strings it was written with, and the next switch would feed those back and
   * resurrect the old name as a `#REF!`. Only formula cells are touched — values stay the
   * caller's own.
   */
  #syncFormulaDataFromEngine(engine: NonNullable<SheetFormulas['engine']>) {
    this.getSheets().forEach(({ id }) => {
      const sheet = this.#model?.getSheetById(id);
      const formulas = sheet ? formulasSettingOf(sheet) : null;

      if (!sheet || formulas?.engine !== engine || !formulas.sheetName
        || !engine.doesSheetExist!(formulas.sheetName)) {
        return;
      }

      const serialized = engine.getSheetSerialized!(engine.getSheetId!(formulas.sheetName) as number);

      sheet.data.forEach((row, rowIndex) => {
        (row as unknown[]).forEach((cell, columnIndex) => {
          const current = typeof cell === 'string' ? cell : null;
          const fromEngine = serialized[rowIndex]?.[columnIndex];

          if (current?.startsWith('=') && typeof fromEngine === 'string' && fromEngine !== current) {
            (row as unknown[])[columnIndex] = fromEngine;
          }
        });
      });
    });
  }

  /**
   * Updates the bar's theme when the grid's theme changes.
   */
  #onAfterSetTheme = (themeName: unknown) => {
    this.#ui?.updateTheme(themeName as string | undefined);
  };

  /**
   * Re-renders the bar's translated labels and tabs when the grid's language changes.
   */
  #onAfterLanguageChange = () => {
    this.#ui?.refreshLabels();
    this.#refreshUI();
  };

  /**
   * Tracks explicit cell-meta writes for the active sheet so they can be replayed
   * after a switch round-trip. Writes performed by the plugin's own restore pass
   * are skipped via the switching guard.
   */
  #onAfterSetCellMeta = (row: number, col: number, key: string, value: unknown) => {
    if (!this.#isSwitching) {
      const entry = { row, col, key, value };

      this.#trackedCellMeta.set(trackedCellMetaKey(entry), entry);
    }
  };
}
