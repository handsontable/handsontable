import type { HotInstance } from '../../core/types';
import { arrayEach, arrayFilter } from '../../helpers/array';
import { mixin, objectEach } from '../../helpers/object';
import { curry } from '../../helpers/function';
import localHooks from '../../mixins/localHooks';
import ConditionCollection from './conditionCollection';
import DataFilter from './dataFilter';
import { createArrayAssertion } from './utils';
import { ColumnDataMap } from './columnDataMap';
import type { ColumnDataEntry } from './columnDataMap';

/**
 * Class which is designed for observing changes in condition collection. When condition is changed by user at specified
 * column it's necessary to update all conditions defined after this edited one.
 *
 * Object fires `update` hook for every column conditions change.
 *
 * @private
 * @class ConditionUpdateObserver
 */
class ConditionUpdateObserver {
  /**
   * Handsontable instance.
   *
   * @type {Core}
   */
  declare hot: HotInstance;
  /**
   * Reference to the instance of {@link ConditionCollection}.
   *
   * @type {ConditionCollection}
   */
  conditionCollection;
  /**
   * Function which provide source data factory for specified column.
   *
   * @type {Function}
   */
  columnDataFactory;
  /**
   * Collected changes when grouping is enabled.
   *
   * @type {Array}
   * @default []
   */
  changes: number[] = [];
  /**
   * Flag which determines if grouping events is enabled.
   *
   * @type {boolean}
   */
  grouping = false;
  /**
   * The latest known position of edited conditions at specified column index.
   *
   * @type {number}
   * @default -1
   */
  latestEditedColumnPosition = -1;
  /**
   * The latest known order of conditions stack.
   *
   * @type {Array}
   */
  latestOrderStack: number[] = [];
  /**
   * Memoized full-column results of `columnDataFactory`, keyed by physical column index. Active
   * (non-null) only for the duration of one state update or one `flush()` batch — reading a column's
   * data map walks every source row, and one update reads the same columns several times.
   */
  #columnDataCache: Map<number, ColumnDataMap> | null = null;

  /**
   * Initializes the observer with the Handsontable instance, a condition collection to watch, and an optional factory for column source data.
   */
  constructor(
    hot: HotInstance,
    conditionCollection: ConditionCollection,
    columnDataFactory: (physicalColumn: number, physicalRows?: number[]) => ColumnDataMap =
    () => ColumnDataMap.empty()
  ) {
    this.hot = hot;
    this.conditionCollection = conditionCollection;
    this.columnDataFactory = columnDataFactory;

    this.conditionCollection.addLocalHook('beforeRemove', (column: number) => this.#onConditionBeforeModify(column));
    this.conditionCollection.addLocalHook('afterRemove', (column: number) => this.updateStatesAtColumn(column));
    this.conditionCollection.addLocalHook('afterAdd', (column: number) => this.updateStatesAtColumn(column));
    this.conditionCollection.addLocalHook('beforeClean', () => this.#onConditionBeforeClean());
    this.conditionCollection.addLocalHook('afterClean', () => this.#onConditionAfterClean());
  }

  /**
   * Enable grouping changes. Grouping is helpful in situations when a lot of conditions is added in one moment. Instead of
   * trigger `update` hook for every condition by adding/removing you can group this changes and call `flush` method to trigger
   * it once.
   */
  groupChanges() {
    this.grouping = true;
  }

  /**
   * Flush all collected changes. This trigger `update` hook for every previously collected change from condition collection.
   */
  flush() {
    this.grouping = false;

    this.#withColumnDataCache(() => {
      arrayEach(this.changes, (column) => {
        this.updateStatesAtColumn(column);
      });
    });
    this.changes.length = 0;
  }

  /**
   * Runs the callback with the full-column data memo active. Source data does not change while
   * component states are recomputed, so every full-column read within one update (the edited
   * column, the first dependent column, and each column re-scanned by `DataFilter`) can share
   * one data map per column. Nested activations reuse the outer cache.
   *
   * @param {Function} callback The callback to run with the cache active.
   */
  #withColumnDataCache(callback: () => void) {
    if (this.#columnDataCache !== null) {
      callback();

      return;
    }

    this.#columnDataCache = new Map();

    try {
      callback();
    } finally {
      this.#columnDataCache = null;
    }
  }

  /**
   * Reads the data map for a column through the active memo. Subset reads (with `physicalRows`)
   * are already narrowed to surviving rows, so only full-column reads are memoized.
   *
   * @param {number} physicalColumn The physical column index.
   * @param {number[]} [physicalRows] When provided, only these physical rows are read.
   * @returns {ColumnDataMap} The column read.
   */
  #getColumnData(physicalColumn: number, physicalRows?: number[]): ColumnDataMap {
    if (physicalRows || this.#columnDataCache === null) {
      return this.columnDataFactory(physicalColumn, physicalRows);
    }

    let columnData = this.#columnDataCache.get(physicalColumn);

    if (!columnData) {
      // The memo exists so that several passes over one column cost one read. Memoizing the meta
      // too is what keeps that promise now that the read resolves it lazily.
      columnData = this.columnDataFactory(physicalColumn).withMemoizedMeta();
      this.#columnDataCache.set(physicalColumn, columnData);
    }

    return columnData;
  }

  /**
   * On before modify condition (add or remove from collection),.
   *
   * @param {number} column Column index.
   * @private
   */
  #onConditionBeforeModify(column: number) {
    this.latestEditedColumnPosition = this.conditionCollection.getColumnStackPosition(column);
  }

  /**
   * Update all related states which should be changed after invoking changes applied to current column.
   *
   * @param {number} column The column index.
   * @param {*} [_conditionArgsChange] No longer used. A data change used to hand its value set in
   * here, which is what rewrote the column's condition behind the user's back (issue #6471). The
   * parameter is kept so the published typings keep accepting the old two-argument call.
   */
  updateStatesAtColumn(column: number, _conditionArgsChange?: unknown) {
    if (this.grouping) {
      if (this.changes.indexOf(column) === -1) {
        this.changes.push(column);
      }

      return;
    }

    this.#withColumnDataCache(() => this.#updateStatesAtColumnInternal(column));
  }

  /**
   * Performs the actual state update for the column. Runs with the full-column data memo active.
   *
   * @param {number} column The column index.
   */
  #updateStatesAtColumnInternal(column: number) {
    const allConditions = this.conditionCollection.exportAllConditions();
    let editedColumnPosition = this.conditionCollection.getColumnStackPosition(column);

    if (editedColumnPosition === -1) {
      editedColumnPosition = this.latestEditedColumnPosition;
    }

    // Collection of all conditions defined before currently edited `column` (without edited one)
    const conditionsBefore = allConditions.slice(0, editedColumnPosition);
    // Collection of all conditions defined after currently edited `column` (with edited one)
    const conditionsAfter = allConditions.slice(editedColumnPosition);

    // Make sure that conditionAfter doesn't contain edited column conditions
    if (conditionsAfter.length && (conditionsAfter[0] as unknown as Record<string, unknown>).column === column) {
      conditionsAfter.shift();
    }

    const visibleDataFactory = curry((curriedConditionsBefore, curriedColumn, conditionsStack = []) => {
      const splitConditionCollection = new ConditionCollection(this.hot, false);
      const curriedConditionsBeforeArray = ([] as unknown[]).concat(
        curriedConditionsBefore as unknown[],
        conditionsStack as unknown[]
      );

      // Create new condition collection to determine what rows should be visible in "filter by value" box
      // in the next conditions in the chain
      splitConditionCollection.importAllConditions(curriedConditionsBeforeArray);

      const allRows: ColumnDataEntry[] = this.#getColumnData(Number(curriedColumn)).toArray();

      if (splitConditionCollection.isEmpty()) {
        splitConditionCollection.destroy();

        // No conditions at all, so every row survives - which is what the filtering branch below
        // would return, without the n-sized assertion set it would build to say so.
        return allRows;
      }

      // Correlate rows through the immutable physical row index `DataFilter.filter()` returns. The
      // coordinate stamps on `meta` are shared with every other meta reader (each read re-stamps
      // them), so they must not be used to match rows between two reads.
      const visibleRowsAssertion = createArrayAssertion((new DataFilter(
        splitConditionCollection,
        (physicalColumn: number, physicalRows?: number[]) => this.#getColumnData(physicalColumn, physicalRows)
      )).filter());

      splitConditionCollection.destroy();

      return arrayFilter(allRows, rowData => visibleRowsAssertion(rowData.row));
    })(conditionsBefore);

    const editedConditions = [...this.conditionCollection.getConditions(column)];

    this.runLocalHooks('update', {
      editedConditionStack: { column, conditions: editedConditions },
      dependentConditionStacks: conditionsAfter,
      filteredRowsFactory: visibleDataFactory,
      // Every row of a column, ignoring every condition. Consumers need it to tell a value that is
      // merely hidden by another column's filter from one that has left the data for good. Shares
      // the same memo as `visibleDataFactory`, which already reads this column, so it costs nothing.
      columnValuesFactory: (physicalColumn: number) => this.#getColumnData(physicalColumn).toArray()
    });
  }

  /**
   * On before conditions clean listener.
   *
   * @private
   */
  #onConditionBeforeClean() {
    this.latestOrderStack = this.conditionCollection.getFilteredColumns() as number[];
  }

  /**
   * On after conditions clean listener.
   *
   * @private
   */
  #onConditionAfterClean() {
    this.#withColumnDataCache(() => {
      arrayEach(this.latestOrderStack, (column) => {
        this.updateStatesAtColumn(column);
      });
    });
  }

  /**
   * Destroy instance.
   */
  destroy() {
    this.clearLocalHooks();

    objectEach(this, (_value: unknown, property: string) => {
      (this as Record<string, unknown>)[property] = null;
    });
  }
}

interface ConditionUpdateObserver {
  addLocalHook(key: string, callback: Function): this;
  removeLocalHook(key: string, callback: Function): this;
  runLocalHooks(key: string, ...args: unknown[]): void;
  clearLocalHooks(): this;
}

mixin(ConditionUpdateObserver, localHooks);

export default ConditionUpdateObserver;
