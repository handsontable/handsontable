import type { HotInstance } from '../../core/types';
import { arrayEach, arrayMap, arrayFilter } from '../../helpers/array';
import { mixin, objectEach } from '../../helpers/object';
import { curry } from '../../helpers/function';
import localHooks from '../../mixins/localHooks';
import ConditionCollection from './conditionCollection';
import DataFilter from './dataFilter';
import { createArrayAssertion } from './utils';

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
   * Initializes the observer with the Handsontable instance, a condition collection to watch, and an optional factory for column source data.
   */
  constructor(
    hot: HotInstance,
    conditionCollection: ConditionCollection,
    columnDataFactory: (physicalColumn: number) => Record<string, unknown>[] = () => []
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

    arrayEach(this.changes, (column) => {
      this.updateStatesAtColumn(column);
    });
    this.changes.length = 0;
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
   * @param {object} conditionArgsChange Object describing condition changes which can be handled by filters on `update` hook.
   * It contains keys `conditionKey` and `conditionValue` which refers to change specified key of condition to specified value
   * based on referred keys.
   */
  updateStatesAtColumn(column: number, conditionArgsChange?: unknown) {
    if (this.grouping) {
      if (this.changes.indexOf(column) === -1) {
        this.changes.push(column);
      }

      return;
    }

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

      const allRows = this.columnDataFactory(Number(curriedColumn));
      let visibleRows;

      if (splitConditionCollection.isEmpty()) {
        visibleRows = allRows;
      } else {
        visibleRows = (new DataFilter(
          splitConditionCollection,
          this.columnDataFactory
        )).filter();
      }
      visibleRows = arrayMap(visibleRows, rowData => (rowData as { meta: { visualRow: number } }).meta.visualRow);

      const visibleRowsAssertion = createArrayAssertion(visibleRows);

      splitConditionCollection.destroy();

      return arrayFilter(allRows, (rowData) => {
        return visibleRowsAssertion((rowData as { meta: { visualRow: number } }).meta.visualRow);
      });
    })(conditionsBefore);

    const editedConditions = [...this.conditionCollection.getConditions(column)];

    this.runLocalHooks('update', {
      editedConditionStack: { column, conditions: editedConditions },
      dependentConditionStacks: conditionsAfter,
      filteredRowsFactory: visibleDataFactory,
      conditionArgsChange
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
    arrayEach(this.latestOrderStack, (column) => {
      this.updateStatesAtColumn(column);
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
