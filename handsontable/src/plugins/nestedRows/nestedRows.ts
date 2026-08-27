import type { default as CellCoords } from '../../3rdparty/walkontable/src/cell/coords';
import { BasePlugin } from '../base';
import DataManager, { type RowObject } from './data/dataManager';
import CollapsingUI from './ui/collapsing';
import HeadersUI from './ui/headers';
import ContextMenuUI from './ui/contextMenu';
import { isValidDataSource } from './utils/isValidDataSource';
import { error } from '../../helpers/console';
import type { TrimmingMap } from '../../translations';
import { EDITOR_EDIT_GROUP as SHORTCUTS_GROUP_EDITOR } from '../../shortcuts/contexts';
import RowMoveController from './utils/rowMoveController';

export const PLUGIN_KEY = 'nestedRows';
export const PLUGIN_PRIORITY = 300;
const SHORTCUTS_GROUP = PLUGIN_KEY;

/**
 * Error message for the wrong data type error.
 */
const WRONG_DATA_TYPE_ERROR = 'The Nested Rows plugin requires an Array of Objects as a dataset to be' +
  ' provided. The plugin has been disabled.';

/**
 * @plugin NestedRows
 * @class NestedRows
 *
 * @description
 * Plugin responsible for displaying and operating on data sources with nested structures.
 */
export class NestedRows extends BasePlugin {
  /**
   * Returns the plugin key used to identify and access this plugin within Handsontable.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority value that determines the plugin's initialization order relative to other plugins.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Reference to the DataManager instance.
   *
   * @private
   * @type {object}
   */
  dataManager: DataManager | null = null;
  /**
   * Reference to the HeadersUI instance.
   *
   * @private
   * @type {object}
   */
  headersUI: HeadersUI | null = null;
  /**
   * Reference to the CollapsingUI instance.
   *
   * @private
   * @type {object}
   */
  collapsingUI: CollapsingUI | null = null;
  /**
   * Reference to the ContextMenuUI instance.
   *
   * @private
   * @type {object}
   */
  contextMenuUI: ContextMenuUI | null = null;
  /**
   * Reference to the RowMoveController instance.
   *
   * @private
   * @type {object}
   */
  rowMoveController: RowMoveController | null = null;
  /**
   * Map of skipped rows by plugin.
   *
   * @private
   * @type {null|TrimmingMap}
   */
  collapsedRowsMap: TrimmingMap | null = null;
  /**
   * Allows skipping the render cycle if set as `true`.
   *
   * @type {boolean}
   */
  #skipRender = false;
  /**
   * Allows skipping the internal Core methods call if set as `true`.
   *
   * @type {boolean}
   */
  #skipCoreAPIModifiers = false;
  /**
   * State of the first render.
   *
   * @type {boolean}
   */
  #isFirstRender = true;

  /**
   * Tree paths of the parents that were collapsed when `updateData()` started, kept only until the
   * new structure is cached and they can be collapsed again.
   *
   * @type {number[][]}
   */
  #collapsedParentPaths: number[][] = [];

  /**
   * Tree paths held by a stash that an outer operation left open when `updateData()` started.
   * `null` means there was no open stash.
   *
   * @type {number[][]|null}
   */
  #stashedParentPaths: number[][] | null = null;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link NestedRows#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.collapsedRowsMap = this.hot.rowIndexMapper.createAndRegisterIndexMap('nestedRows', 'trimming');

    this.dataManager = new DataManager(this, this.hot);
    this.collapsingUI = new CollapsingUI(this, this.hot);
    this.headersUI = new HeadersUI(this, this.hot);
    this.contextMenuUI = new ContextMenuUI(this, this.hot);
    this.rowMoveController = new RowMoveController(
      this as unknown as ConstructorParameters<typeof RowMoveController>[0]
    );

    this.addHook('afterInit', this.#onAfterInit);
    this.addHook('afterRender', this.#onAfterRender);
    this.addHook('beforeViewRender', this.#onBeforeViewRender);
    this.addHook('modifyRowData', this.onModifyRowData.bind(this));
    this.addHook('modifySourceLength', this.onModifySourceLength.bind(this));
    this.addHook('beforeDataSplice', this.onBeforeDataSplice.bind(this));
    this.addHook('filterData', this.#onFilterData);
    this.addHook('afterContextMenuDefaultOptions', this.#onAfterContextMenuDefaultOptions);
    this.addHook('afterGetRowHeader', this.#onAfterGetRowHeader);
    this.addHook('beforeOnCellMouseDown', this.#onBeforeOnCellMouseDown);
    this.addHook('beforeRemoveRow', this.#onBeforeRemoveRow);
    this.addHook('afterRemoveRow', this.#onAfterRemoveRow);
    this.addHook('beforeAddChild', this.#onBeforeAddChild);
    this.addHook('afterAddChild', this.#onAfterAddChild);
    this.addHook('beforeDetachChild', this.#onBeforeDetachChild);
    this.addHook('afterDetachChild', this.#onAfterDetachChild);
    this.addHook('modifyRowHeaderWidth', this.#onModifyRowHeaderWidth);
    this.addHook('afterCreateRow', this.#onAfterCreateRow);
    this.addHook('beforeRowMove', this.#onBeforeRowMove);
    this.addHook('beforeLoadData', this.#onBeforeLoadData);
    this.addHook('beforeUpdateData', this.#onBeforeUpdateData);
    this.addHook('afterUpdateData', this.#onAfterUpdateData);

    this.registerShortcuts();
    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.hot.rowIndexMapper.unregisterMap('nestedRows');

    this.unregisterShortcuts();
    super.disablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`nestedRows`](@/api/options.md#nestedrows)
   */
  updatePlugin() {
    // `disablePlugin` unregisters the trimming map and `enablePlugin` builds a brand new CollapsingUI,
    // so the collapsed state has to be copied out before the teardown and replayed afterwards.
    // Without this every `updateSettings` call that carries the `nestedRows` key expands the grid -
    // which, in React, is every parent re-render.
    const collapsedParents = this.collapsingUI?.getCollapsedParents() ?? [];

    this.disablePlugin();

    // We store a state of the data manager.
    const currentSourceData = this.dataManager!.getData();

    this.enablePlugin();

    // After enabling plugin previously stored data is restored.
    this.dataManager!.updateWithData(currentSourceData!);

    if (collapsedParents.length > 0) {
      // Replaying a state the user already chose is not a new action, so the hooks stay silent. Firing
      // them here would report a collapse on every settings update.
      this.collapsingUI!.toggleCollapsedRows(collapsedParents, 'collapse', false);
    }

    super.updatePlugin();
  }

  /**
   * Register shortcuts responsible for toggling collapsible columns.
   *
   * @private
   */
  registerShortcuts() {
    this.hot.getShortcutManager()
      .getContext('grid')
      ?.addShortcut({
        keys: [['Enter']],
        callback: () => {
          const activeRange = this.hot.getSelectedRangeActive();

          if (!activeRange) {
            return false;
          }

          const { highlight } = activeRange;
          const row = this.collapsingUI!.translateTrimmedRow(highlight.row ?? 0);

          this.collapsingUI!.toggleCollapsedRows(
            [row],
            this.collapsingUI!.areChildrenCollapsed(row) ? 'expand' : 'collapse'
          );

          // prevent default Enter behavior (move to the next row within a selection range)
          return false;
        },
        runOnlyIf: () => {
          const highlight = this.hot.getSelectedRangeActive()?.highlight;

          return !!(highlight && this.hot.getSelectedRangeActive()?.isSingle() &&
            this.hot.selection.isCellVisible(highlight) && highlight.col === -1 &&
            highlight.row !== null && highlight.row >= 0);
        },
        group: SHORTCUTS_GROUP,
        relativeToGroup: SHORTCUTS_GROUP_EDITOR,
        position: 'before',
      });
  }

  /**
   * Unregister shortcuts responsible for toggling collapsible columns.
   *
   * @private
   */
  unregisterShortcuts() {
    this.hot.getShortcutManager()
      .getContext('grid')
      ?.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Collapses every top-level parent row, which hides all of their descendants.
   *
   * A parent that was already collapsed inside another one stays collapsed.
   *
   * @fires Hooks#beforeRowCollapse
   * @fires Hooks#afterRowCollapse
   */
  collapseAll(): void {
    if (!this.#isOperational()) {
      return;
    }

    this.collapsingUI!.collapseAll();
  }

  /**
   * Expands every collapsed parent row at every nesting level, so no row stays hidden.
   *
   * @fires Hooks#beforeRowExpand
   * @fires Hooks#afterRowExpand
   */
  expandAll(): void {
    if (!this.#isOperational()) {
      return;
    }

    this.collapsingUI!.toggleCollapsedRows(this.collapsingUI!.getCollapsedParentsShallowestFirst(), 'expand');
  }

  /**
   * Collapses a parent row, which hides its children.
   *
   * @param {number} row Visual row index of the parent.
   * @returns {boolean} `true` if the collapsed state changed. `false` when the row is not a parent,
   * when it is already collapsed, or when the {@link Hooks#beforeRowCollapse} hook blocked the action.
   * @fires Hooks#beforeRowCollapse
   * @fires Hooks#afterRowCollapse
   */
  collapseParent(row: number): boolean {
    return this.#toggleParentAt(row, 'collapse');
  }

  /**
   * Expands a parent row, which shows its children again.
   *
   * @param {number} row Visual row index of the parent.
   * @returns {boolean} `true` if the collapsed state changed. `false` when the row is not a parent,
   * when it is already expanded, or when the {@link Hooks#beforeRowExpand} hook blocked the action.
   * @fires Hooks#beforeRowExpand
   * @fires Hooks#afterRowExpand
   */
  expandParent(row: number): boolean {
    return this.#toggleParentAt(row, 'expand');
  }

  /**
   * Collapses an expanded parent row, or expands a collapsed one. This is the same action as clicking
   * the button in the row header or pressing Enter on it.
   *
   * @param {number} row Visual row index of the parent.
   * @returns {boolean} `true` if the collapsed state changed.
   * @fires Hooks#beforeRowCollapse
   * @fires Hooks#afterRowCollapse
   * @fires Hooks#beforeRowExpand
   * @fires Hooks#afterRowExpand
   */
  toggleParent(row: number): boolean {
    const physicalRow = this.#toPhysicalParentRow(row);

    if (physicalRow === null) {
      return false;
    }

    const isCollapsed = this.dataManager!.isParent(physicalRow) &&
      this.collapsingUI!.areChildrenCollapsed(physicalRow);

    return this.collapsingUI!.toggleCollapsedRows([physicalRow], isCollapsed ? 'expand' : 'collapse');
  }

  /**
   * Returns the physical row indexes of every parent row that is collapsed.
   *
   * The indexes are physical, not visual, because a parent collapsed inside another collapsed parent
   * is trimmed and therefore has no visual index at all. Physical indexes are also what you want to
   * store when saving the state. Convert one with {@link Core#toVisualRow}.
   *
   * @returns {number[]} Physical row indexes, sorted ascending.
   */
  getCollapsedParents(): number[] {
    if (!this.#isOperational()) {
      return [];
    }

    return this.collapsingUI!.getCollapsedParents();
  }

  /**
   * Checks whether a parent row is collapsed.
   *
   * @param {number} row Visual row index of the parent.
   * @returns {boolean} `true` if the row is a parent and its children are hidden.
   */
  isParentCollapsed(row: number): boolean {
    const physicalRow = this.#toPhysicalParentRow(row);

    // A row without children is never collapsed. The check matters because
    // `areChildrenCollapsed` answers "are all children collapsed", which is vacuously `true`
    // for a row that has none.
    if (physicalRow === null || !this.dataManager!.isParent(physicalRow)) {
      return false;
    }

    return this.collapsingUI!.areChildrenCollapsed(physicalRow);
  }

  /**
   * Checks whether a row has children.
   *
   * @param {number} row Visual row index.
   * @returns {boolean}
   */
  isParent(row: number): boolean {
    const physicalRow = this.#toPhysicalRow(row);

    if (physicalRow === null) {
      return false;
    }

    return this.dataManager!.isParent(physicalRow);
  }

  /**
   * Returns how deeply a row is nested. Top-level rows are at level `0`.
   *
   * @param {number} row Visual row index.
   * @returns {number|null} The nesting level, or `null` when the row does not exist.
   */
  getRowLevel(row: number): number | null {
    const physicalRow = this.#toPhysicalRow(row);

    if (physicalRow === null) {
      return null;
    }

    return this.dataManager!.getRowLevel(physicalRow);
  }

  /**
   * Returns the parent of a row.
   *
   * A visible row always has visible ancestors, so the returned index is visual like the argument.
   *
   * @param {number} row Visual row index.
   * @returns {number|null} Visual row index of the parent, or `null` for a top-level row.
   */
  getRowParent(row: number): number | null {
    const physicalRow = this.#toPhysicalRow(row);

    if (physicalRow === null) {
      return null;
    }

    const parentObject = this.dataManager!.getRowParent(physicalRow);
    const parentPhysicalRow = this.dataManager!.getRowIndex(parentObject);

    if (parentPhysicalRow === null) {
      return null;
    }

    const parentVisualRow = this.hot.toVisualRow(parentPhysicalRow);

    return parentVisualRow === null ? null : parentVisualRow;
  }

  /**
   * Counts the children of a row.
   *
   * @param {number} row Visual row index.
   * @param {boolean} [recursive=false] `true` counts every descendant, `false` counts only the direct
   * children.
   * @returns {number}
   */
  countChildren(row: number, recursive = false): number {
    const physicalRow = this.#toPhysicalRow(row);

    if (physicalRow === null) {
      return 0;
    }

    if (recursive) {
      return this.dataManager!.countChildren(physicalRow);
    }

    const rowObject = this.dataManager!.getDataObject(physicalRow);

    return (rowObject?.__children ?? []).length;
  }

  /**
   * Expands every ancestor of a row, so that a row hidden inside collapsed parents becomes visible.
   *
   * Takes a physical row index, because the row you want to reveal is hidden and therefore has no
   * visual index.
   *
   * @param {number} row Physical row index of the row to reveal.
   * @returns {boolean} `true` if anything was expanded.
   * @fires Hooks#beforeRowExpand
   * @fires Hooks#afterRowExpand
   */
  expandToRow(row: number): boolean {
    if (!this.#isOperational() || !Number.isInteger(row) || row < 0) {
      return false;
    }

    const collapsedAncestors: number[] = [];
    let parentObject = this.dataManager!.getRowParent(row);

    while (parentObject !== null) {
      const parentRow = this.dataManager!.getRowIndex(parentObject);

      if (parentRow === null) {
        break;
      }

      if (this.collapsingUI!.getCollapsedParents().indexOf(parentRow) > -1) {
        collapsedAncestors.push(parentRow);
      }

      parentObject = this.dataManager!.getRowParent(parentObject);
    }

    if (collapsedAncestors.length === 0) {
      return false;
    }

    // Shallowest first, so an ancestor is expanded before its own descendants.
    return this.collapsingUI!.toggleCollapsedRows(collapsedAncestors.reverse(), 'expand');
  }

  /**
   * Shows rows down to the given nesting level and collapses everything deeper.
   *
   * Level `0` leaves only the top-level rows visible.
   *
   * This runs as two steps - an expand and a collapse - so it fires both pairs of hooks. Returning
   * `false` from {@link Hooks#beforeRowExpand} cancels the whole call and leaves the grid as it was.
   * Returning `false` from {@link Hooks#beforeRowCollapse} blocks only the collapse step, so the
   * expand step stays applied.
   *
   * @param {number} level The deepest nesting level that stays expanded.
   * @fires Hooks#beforeRowCollapse
   * @fires Hooks#afterRowCollapse
   * @fires Hooks#beforeRowExpand
   * @fires Hooks#afterRowExpand
   */
  expandToLevel(level: number): void {
    if (!this.#isOperational() || !Number.isInteger(level) || level < 0) {
      return;
    }

    const toCollapse: number[] = [];
    const toExpand: number[] = [];

    // `batch` suspends rendering as well as index-map recalculation. This runs two passes, and each
    // one renders on its own, so without it the grid would render the intermediate state where the
    // deeper rows are briefly untrimmed.
    this.hot.batch(() => {
      const data = this.dataManager!.getData() ?? [];

      this.#eachParent(data, (parentRow: number, parentLevel: number) => {
        if (parentLevel >= level) {
          toCollapse.push(parentRow);
        } else {
          toExpand.push(parentRow);
        }
      });

      // Expand from the shallowest down, so each parent is reachable when its turn comes, then
      // collapse from the deepest up.
      //
      // The expand pass is checked for a veto, not for `performed`: `performed` is also `false` when
      // every shallower parent is already open, which is the common case and must not stop the
      // collapse pass. A `beforeRowExpand` veto cancels the whole call, so the grid keeps the state it
      // had. A veto on the collapse pass below leaves the expand applied - see the method's JSDoc.
      if (toExpand.length > 0 && this.collapsingUI!.applyCollapsedRowsChange(toExpand, 'expand').vetoed) {
        return;
      }

      if (toCollapse.length > 0) {
        this.collapsingUI!.toggleCollapsedRows(toCollapse.reverse(), 'collapse');
      }
    });
  }

  /**
   * Walks the nested structure depth-first and calls back for every row that has children.
   *
   * @param {Array} nodes Row objects to walk.
   * @param {Function} callback Receives the physical row index and the nesting level.
   * @param {number} [level=0] The nesting level of `nodes`.
   */
  #eachParent(nodes: RowObject[], callback: (row: number, level: number) => void, level = 0): void {
    nodes.forEach((node: RowObject) => {
      if (!this.dataManager!.hasChildren(node)) {
        return;
      }

      const physicalRow = this.dataManager!.getRowIndex(node);

      if (physicalRow !== null) {
        callback(physicalRow, level);
      }

      this.#eachParent((node.__children ?? []) as RowObject[], callback, level + 1);
    });
  }

  /**
   * Tells whether the plugin can act on the grid right now.
   *
   * `disablePlugin()` unregisters the `nestedRows` index map but leaves `collapsingUI` and
   * `collapsedRowsMap` in place, so a write to the map afterwards is silently dropped. Without this
   * check the public methods would report a state change that never reached the grid.
   *
   * @returns {boolean}
   */
  #isOperational(): boolean {
    return this.enabled && !!this.dataManager && !!this.collapsingUI;
  }

  /**
   * Translates a visual row index into a physical one.
   *
   * @param {number} row Visual row index.
   * @returns {number|null} `null` when the argument is not a valid, existing visual row.
   */
  #toPhysicalRow(row: number): number | null {
    if (!this.#isOperational() || !Number.isInteger(row) || row < 0) {
      return null;
    }

    const physicalRow = this.hot.toPhysicalRow(row);

    return physicalRow === null || physicalRow === undefined ? null : physicalRow;
  }

  /**
   * Translates a visual row index into a physical one, for the methods that act on a parent row.
   *
   * Returns `null` when the plugin is not ready, so the caller can bail out before reaching the
   * CollapsingUI. Whether the row is really a parent is decided by the CollapsingUI, which reports it
   * through the hooks.
   *
   * @param {number} row Visual row index.
   * @returns {number|null}
   */
  #toPhysicalParentRow(row: number): number | null {
    return this.#toPhysicalRow(row);
  }

  /**
   * Collapses or expands a single parent, addressed by its visual row index.
   *
   * @param {number} row Visual row index of the parent.
   * @param {string} action Either `'collapse'` or `'expand'`.
   * @returns {boolean} `true` if the collapsed state changed.
   */
  #toggleParentAt(row: number, action: 'collapse' | 'expand'): boolean {
    const physicalRow = this.#toPhysicalParentRow(row);

    if (physicalRow === null) {
      return false;
    }

    return this.collapsingUI!.toggleCollapsedRows([physicalRow], action);
  }

  /**
   * `beforeRowMove` hook callback.
   *
   * @param {Array} rows Array of visual row indexes to be moved.
   * @param {number} finalIndex Visual row index, being a start index for the moved rows. Points to where the elements
   *   will be placed after the moving action. To check the visualization of the final index, please take a look at
   *   [documentation](@/guides/rows/row-summary/row-summary.md).
   * @param {undefined|number} dropIndex Visual row index, being a drop index for the moved rows. Points to where we
   *   are going to drop the moved elements. To check visualization of drop index please take a look at
   *   [documentation](@/guides/rows/row-summary/row-summary.md).
   * @param {boolean} movePossible Indicates if it's possible to move rows to the desired position.
   * @fires Hooks#afterRowMove
   * @returns {boolean}
   */
  #onBeforeRowMove = (rows: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean) => {
    return this.rowMoveController!.onBeforeRowMove(rows, finalIndex, dropIndex, movePossible);
  };

  /**
   * Enable the modify hook skipping flag - allows retrieving the data from Handsontable without this plugin's
   * modifications.
   *
   * @private
   */
  disableCoreAPIModifiers(): void {
    this.#skipCoreAPIModifiers = true;
  }

  /**
   * Disable the modify hook skipping flag.
   *
   * @private
   */
  enableCoreAPIModifiers(): void {
    this.#skipCoreAPIModifiers = false;
  }

  /**
   * `beforeOnCellMousedown` hook callback.
   *
   * @param {MouseEvent} event Mousedown event.
   * @param {object} coords Cell coords.
   * @param {HTMLElement} TD Clicked cell.
   */
  #onBeforeOnCellMouseDown = (event: Event, coords: CellCoords, TD: HTMLTableCellElement) => {
    this.collapsingUI!.toggleState(event, coords, TD);
  };

  /**
   * The modifyRowData hook callback.
   *
   * @private
   * @param {number} row Visual row index.
   * @returns {boolean}
   */
  onModifyRowData(row: number): unknown {
    if (this.#skipCoreAPIModifiers) {
      return;
    }

    return this.dataManager!.getDataObject(row);
  }

  /**
   * Modify the source data length to match the length of the nested structure.
   *
   * @private
   * @returns {number}
   */
  onModifySourceLength() {
    if (this.#skipCoreAPIModifiers) {
      return;
    }

    return this.dataManager!.countAllRows();
  }

  /**
   * @private
   * @param {number} index The index where the data was spliced.
   * @param {number} amount An amount of items to remove.
   * @param {object} element An element to add.
   * @returns {boolean}
   */
  onBeforeDataSplice(index: number, amount: number, element: Record<string, unknown>) {
    if (this.#skipCoreAPIModifiers || this.dataManager!.isRowHighestLevel(index)) {
      return true;
    }

    this.dataManager!.spliceData(index, amount, [element]);

    return false;
  }

  /**
   * Provide custom source data filtering. It's handled by core method and replaces the native filtering.
   *
   * @param {number} index The index where the data filtering starts.
   * @param {number} amount An amount of rows which filtering applies to.
   * @param {number} physicalRows Physical row indexes.
   * @returns {Array}
   */
  #onFilterData = (index: number, amount: number, physicalRows: number[]) => {
    this.collapsingUI!.collapsedRowsStash.stash();
    this.collapsingUI!.collapsedRowsStash.trimStash(physicalRows[0], amount);
    this.collapsingUI!.collapsedRowsStash.shiftStash(physicalRows[0], null, (-1) * amount);
    this.dataManager!.filterData(index, amount, physicalRows);

    this.#skipRender = true;

    return this.dataManager!.getData()!.slice(); // Data contains reference sometimes.
  };

  /**
   * `afterContextMenuDefaultOptions` hook callback.
   *
   * @param {object} defaultOptions The default context menu items order.
   * @returns {boolean}
   */
  #onAfterContextMenuDefaultOptions = (defaultOptions: { items: unknown[]; [key: string]: unknown }) => {
    type DefaultOptions = { items: { key: string; [k: string]: unknown }[]; [key: string]: unknown };

    return this.contextMenuUI!.appendOptions(defaultOptions as DefaultOptions);
  };

  /**
   * `afterGetRowHeader` hook callback.
   *
   * @param {number} row Row index.
   * @param {HTMLElement} TH Row header element.
   */
  #onAfterGetRowHeader = (row: number, TH: HTMLTableCellElement) => {
    this.headersUI!.appendLevelIndicators(row, TH);
  };

  /**
   * `modifyRowHeaderWidth` hook callback.
   *
   * The indentation this plugin draws needs a floor under the row header width. Another handler may
   * already have answered per row header level - `AutoRowHeaderSize` does - so an array is widened
   * entry by entry rather than being fed to `Math.max`, which would turn it into `NaN`.
   *
   * @param {number|number[]} rowHeaderWidth The initial row header width(s).
   * @returns {number|number[]}
   */
  #onModifyRowHeaderWidth = (rowHeaderWidth: number | number[]) => {
    const minimumWidth = this.headersUI!.rowHeaderWidthCache ?? 0;

    if (Array.isArray(rowHeaderWidth)) {
      // Only the first level. The cached minimum is the room THIS plugin's own header needs for its
      // indentation and its collapse button; the levels after it come from
      // `afterGetRowHeaderRenderers` and draw neither, so raising them to a deep tree's minimum
      // would inflate a narrow numbering column for nothing.
      return rowHeaderWidth.map((levelWidth, headerLevel) => (
        headerLevel === 0 ? Math.max(minimumWidth, levelWidth) : levelWidth
      ));
    }

    return Math.max(minimumWidth, rowHeaderWidth);
  };

  /**
   * `onAfterRemoveRow` hook callback.
   *
   * @param {number} index Removed row.
   * @param {number} amount Amount of removed rows.
   * @param {Array} logicRows An array of the removed physical rows.
   * @param {string} source Source of action.
   */
  #onAfterRemoveRow = (index: number, amount: number, logicRows: unknown[], source: string) => {
    if (source === this.pluginName) {
      return;
    }

    this.hot._registerTimeout(() => {
      this.#skipRender = false;
      this.headersUI!.updateRowHeaderWidth();
      this.collapsingUI!.collapsedRowsStash.applyStash();
    });
  };

  /**
   * Callback for the `beforeRemoveRow` change list of removed physical indexes by reference. Removing parent node
   * has effect in removing children nodes.
   *
   * @param {number} index Visual index of starter row.
   * @param {number} amount Amount of rows to be removed.
   * @param {Array} physicalRows List of physical indexes.
   */
  #onBeforeRemoveRow = (index: number, amount: number, physicalRows: number[]) => {
    const modifiedPhysicalRows = Array.from(physicalRows.reduce((removedRows: Set<number>, physicalIndex: number) => {
      if (this.dataManager!.isParent(physicalIndex)) {
        const children = this.dataManager!.getDataObject(physicalIndex)?.__children;

        // Preserve a parent in the list of removed rows.
        removedRows.add(physicalIndex);

        if (Array.isArray(children)) {
          // Add a children to the list of removed rows.
          children.forEach((child) => {
            const childRowIndex = this.dataManager!.getRowIndex(child);

            if (childRowIndex !== null) {
              removedRows.add(childRowIndex);
            }
          });
        }

        return removedRows;
      }

      // Don't modify list of removed rows when already checked element isn't a parent.
      return removedRows.add(physicalIndex);
    }, new Set()));

    // Modifying hook's argument by the reference.
    physicalRows.length = 0;
    physicalRows.push(...modifiedPhysicalRows);
  };

  /**
   * `beforeAddChild` hook callback.
   */
  #onBeforeAddChild = () => {
    this.collapsingUI!.collapsedRowsStash.stash();
  };

  /**
   * `afterAddChild` hook callback.
   *
   * @param {object} parent Parent element.
   * @param {object} element New child element.
   */
  #onAfterAddChild = (parent: RowObject, element: RowObject | undefined) => {
    const newChildRowIndex = this.dataManager!.getRowIndex(element);

    if (newChildRowIndex !== null) {
      this.collapsingUI!.collapsedRowsStash.shiftStash(newChildRowIndex);
    }

    this.collapsingUI!.collapsedRowsStash.applyStash();

    this.headersUI!.updateRowHeaderWidth(undefined);
  };

  /**
   * `beforeDetachChild` hook callback.
   */
  #onBeforeDetachChild = () => {
    this.collapsingUI!.collapsedRowsStash.stash();
  };

  /**
   * `afterDetachChild` hook callback.
   *
   * @param {object} parent Parent element.
   * @param {object} element New child element.
   * @param {number} finalElementRowIndex The final row index of the detached element.
   */
  #onAfterDetachChild = (parent: Record<string, unknown>, element: Record<string, unknown>,
                         finalElementRowIndex: number) => {
    this.collapsingUI!.collapsedRowsStash.shiftStash(finalElementRowIndex, null, -1);
    this.collapsingUI!.collapsedRowsStash.applyStash();

    this.headersUI!.updateRowHeaderWidth(undefined);
  };

  /**
   * `afterCreateRow` hook callback.
   */
  #onAfterCreateRow = () => {
    this.dataManager!.rewriteCache();
  };

  /**
   * `afterInit` hook callback.
   */
  #onAfterInit = () => {
    this.headersUI!.updateRowHeaderWidth(undefined);
  };

  /**
   * `afterRender` hook callback.
   * Recalculates table dimensions after the first render. Fixes the wtHider size being too small on initial display.
   */
  #onAfterRender = () => {
    if (this.#isFirstRender && this.hot.view) {
      this.#isFirstRender = false;

      this.hot.rootWindow.requestAnimationFrame(() => {
        if (this.hot && this.hot.view && !this.hot.isDestroyed) {
          this.hot.view.adjustElementsSize(true);
        }
      });
    }
  };

  /**
   * `beforeViewRender` hook callback.
   *
   * @param {boolean} force Indicates if the render call was triggered by a change of settings or data.
   * @param {object} skipRender An object, holder for skipRender functionality.
   */
  #onBeforeViewRender = (force: boolean, skipRender: { skipRender: boolean }) => {
    if (this.#skipRender) {
      skipRender.skipRender = true;
    }
  };

  /**
   * Checks the incoming data and turns the plugin off when it cannot work with it.
   *
   * @param {Array} data The source data.
   * @returns {boolean} `true` when the plugin accepts the data.
   */
  #acceptsData(data: unknown[]): boolean {
    if (isValidDataSource(data)) {
      return true;
    }

    error(WRONG_DATA_TYPE_ERROR);

    this.hot.getSettings()[PLUGIN_KEY] = false;
    this.disablePlugin();

    return false;
  }

  /**
   * Forgets which parents are collapsed, and untrims the rows that collapse had hidden.
   *
   * All three stores are keyed by physical row index, and none of those indexes means anything once
   * the data is replaced: the collapsed-parents list, the trimming map, and the stash an outer
   * operation left open.
   *
   * @param {boolean} untrimRows `true` also clears the trimming map. `loadData()` passes `false`,
   * because `initIndexMappers()` resets every map moments later and doing it twice costs a second
   * row index cache rebuild.
   */
  #clearCollapsedState(untrimRows: boolean) {
    if (!this.collapsingUI) {
      return;
    }

    if (this.collapsingUI.lastCollapsedRows) {
      this.collapsingUI.lastCollapsedRows = [];
    }

    // Nothing is trimmed when no parent is collapsed, and the early return is load-bearing:
    // `core.unit.js` asserts exactly one `cacheUpdated` on init with `nestedRows: true`, and a data
    // load runs on every grid init.
    if (this.collapsingUI.collapsedRows.length === 0) {
      return;
    }

    this.collapsingUI.collapsedRows.length = 0;

    if (untrimRows) {
      this.collapsedRowsMap?.clear();
    }
  }

  /**
   * Translates physical row indexes into tree paths, dropping the rows the current cache does not
   * know about.
   *
   * @param {number[]} rows Physical row indexes.
   * @returns {number[][]}
   */
  #toTreePaths(rows: number[]): number[][] {
    return rows
      .map(row => this.dataManager!.getRowTreePath(row))
      .filter((path): path is number[] => path !== null);
  }

  /**
   * Translates tree paths back into physical row indexes, keeping only the rows that still exist and
   * still have children.
   *
   * Order is left alone. Collapsing changes which rows are trimmed, not their physical indexes, so
   * an ancestor and its descendant can be collapsed in either order for the same result.
   *
   * @param {number[][]} paths Tree paths.
   * @returns {number[]} Physical row indexes.
   */
  #toCollapsibleRows(paths: number[][]): number[] {
    return paths
      .map(path => this.dataManager!.getRowIndexByTreePath(path))
      .filter((row): row is number => row !== null && this.dataManager!.hasChildren(row));
  }

  /**
   * `beforeLoadData` hook callback.
   *
   * `loadData()` resets the rows' states, so the collapsed parents are dropped along with them.
   *
   * @param {Array} data The source data.
   */
  #onBeforeLoadData = (data: unknown[]) => {
    if (!this.#acceptsData(data)) {
      return;
    }

    this.#clearCollapsedState(false);

    this.dataManager!.setData(data as RowObject[]);
    this.dataManager!.rewriteCache();
  };

  /**
   * `beforeUpdateData` hook callback.
   *
   * `updateData()` keeps the rows' states, so the collapsed parents have to survive the swap. They
   * cannot be carried over as physical row indexes: those shift as soon as any parent gains or
   * loses a child, and the stale indexes then hide the wrong rows - parent rows included. The
   * parents are remembered as tree paths instead, and collapsed again in `afterUpdateData`, once
   * the index maps have been resized to the new data.
   *
   * @param {Array} data The source data.
   */
  #onBeforeUpdateData = (data: unknown[]) => {
    if (!this.#acceptsData(data)) {
      return;
    }

    const openStash = this.collapsingUI?.lastCollapsedRows;

    this.#collapsedParentPaths = this.#toTreePaths(this.collapsingUI?.getCollapsedParents() ?? []);
    // An outer operation - add child, detach child, remove row, row move - may hold the collapsed
    // state in an open stash instead, having expanded the grid for the duration. That copy has to
    // be re-pointed as well, or `applyStash()` collapses whatever now sits at the old indexes.
    this.#stashedParentPaths = openStash ? this.#toTreePaths(openStash) : null;

    this.#clearCollapsedState(true);

    this.dataManager!.setData(data as RowObject[]);
    this.dataManager!.rewriteCache();
  };

  /**
   * `afterUpdateData` hook callback.
   *
   * Collapses the parents that were collapsed before the update and are still parents in the new
   * data, and re-points an open stash at the same rows. A parent that the new data dropped, or that
   * no longer has children, is simply forgotten.
   */
  #onAfterUpdateData = () => {
    const paths = this.#collapsedParentPaths;
    const stashedPaths = this.#stashedParentPaths;

    this.#collapsedParentPaths = [];
    this.#stashedParentPaths = null;

    if (!this.collapsingUI || !this.dataManager) {
      return;
    }

    if (stashedPaths !== null) {
      this.collapsingUI.lastCollapsedRows = this.#toCollapsibleRows(stashedPaths);
    }

    const parentsToCollapse = this.#toCollapsibleRows(paths);

    if (parentsToCollapse.length === 0) {
      return;
    }

    // Replaying a state the user already chose is not a new action, so the hooks stay silent, and
    // `replaceData` renders as soon as this hook returns - a render here would be the second one.
    this.collapsingUI.toggleCollapsedRows(parentsToCollapse, 'collapse', false, false);

    // The Core clamped the selection before this hook ran, against a grid that was still fully
    // expanded. Trimming does not re-clamp it - `selection.commit()` only follows hidden indexes -
    // so without this the highlight can sit past the last row.
    this.hot.selection.refresh();
  };

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
