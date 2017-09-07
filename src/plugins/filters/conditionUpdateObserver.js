import {arrayEach, arrayMap, arrayFilter} from 'handsontable/helpers/array';
import {mixin, objectEach} from 'handsontable/helpers/object';
import {curry, debounce} from 'handsontable/helpers/function';
import localHooks from 'handsontable/mixins/localHooks';
import ConditionCollection from './conditionCollection';
import DataFilter from './dataFilter';
import {createArrayAssertion} from './utils';

/**
 * Class which is designed for observing changes in condition collection. When condition is changed by user at specified
 * column it's necessary to update all conditions defined after this edited one.
 *
 * Object fires `update` hook for every column conditions change.
 *
 * @class ConditionUpdateObserver
 * @plugin Filters
 * @pro
 */
class ConditionUpdateObserver {
  constructor(conditionCollection, columnDataFactory = (column) => []) {
    /**
     * Reference to the instance of {@link ConditionCollection}.
     *
     * @type {ConditionCollection}
     */
    this.conditionCollection = conditionCollection;
    /**
     * Function which provide source data factory for specified column.
     *
     * @type {Function}
     */
    this.columnDataFactory = columnDataFactory;
    /**
     * Collected changes when grouping is enabled.
     *
     * @type {Array}
     * @default []
     */
    this.changes = [];
    /**
     * Flag which determines if grouping events is enabled.
     *
     * @type {Boolean}
     */
    this.grouping = false;
    /**
     * The latest known position of edited conditions at specified column index.
     *
     * @type {Number}
     * @default -1
     */
    this.latestEditedColumnPosition = -1;
    /**
     * The latest known order of conditions stack.
     *
     * @type {Array}
     */
    this.latestOrderStack = [];

    this.conditionCollection.addLocalHook('beforeRemove', (column) => this._onConditionBeforeModify(column));
    this.conditionCollection.addLocalHook('afterAdd', (column) => this.updateStatesAtColumn(column));
    this.conditionCollection.addLocalHook('afterClear', (column) => this.updateStatesAtColumn(column));
    this.conditionCollection.addLocalHook('beforeClean', () => this._onConditionBeforeClean());
    this.conditionCollection.addLocalHook('afterClean', () => this._onConditionAfterClean());
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
   * On before modify condition (add or remove from collection),
   *
   * @param {Number} column Column index.
   * @private
   */
  _onConditionBeforeModify(column) {
    this.latestEditedColumnPosition = this.conditionCollection.orderStack.indexOf(column);
  }

  /**
   * Update all related states which should be changed after invoking changes applied to current column.
   *
   * @param column
   * @param {Object} conditionArgsChange Object describing condition changes which can be handled by filters on `update` hook.
   * It contains keys `conditionKey` and `conditionValue` which refers to change specified key of condition to specified value
   * based on referred keys.
   */
  updateStatesAtColumn(column, conditionArgsChange) {
    if (this.grouping) {
      if (this.changes.indexOf(column) === -1) {
        this.changes.push(column);
      }

      return;
    }
    let allConditions = this.conditionCollection.exportAllConditions();
    let editedColumnPosition = this.conditionCollection.orderStack.indexOf(column);

    if (editedColumnPosition === -1) {
      editedColumnPosition = this.latestEditedColumnPosition;
    }

    // Collection of all conditions defined before currently edited `column` (without edited one)
    let conditionsBefore = allConditions.slice(0, editedColumnPosition);
    // Collection of all conditions defined after currently edited `column` (without edited one)
    let conditionsAfter = allConditions.slice(editedColumnPosition);

    // Make sure that conditionAfter doesn't contain edited column conditions
    if (conditionsAfter.length && conditionsAfter[0].column === column) {
      conditionsAfter.shift();
    }

    let visibleDataFactory = curry((conditionsBefore, column, conditionsStack = []) => {
      let splitConditionCollection = new ConditionCollection();

      conditionsBefore = [].concat(conditionsBefore, conditionsStack);

      // Create new condition collection to determine what rows should be visible in "filter by value" box in the next conditions in the chain
      splitConditionCollection.importAllConditions(conditionsBefore);

      const allRows = this.columnDataFactory(column);
      let visibleRows;

      if (splitConditionCollection.isEmpty()) {
        visibleRows = allRows;
      } else {
        visibleRows = (new DataFilter(splitConditionCollection, (column) => this.columnDataFactory(column))).filter();
      }
      visibleRows = arrayMap(visibleRows, (rowData) => rowData.meta.visualRow);

      const visibleRowsAssertion = createArrayAssertion(visibleRows);

      return arrayFilter(allRows, (rowData) => visibleRowsAssertion(rowData.meta.visualRow));
    })(conditionsBefore);

    let editedConditions = [].concat(this.conditionCollection.getConditions(column));

    this.runLocalHooks('update', {
      editedConditionStack: {column, conditions: editedConditions},
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
  _onConditionBeforeClean() {
    this.latestOrderStack = [].concat(this.conditionCollection.orderStack);
  }

  /**
   * On after conditions clean listener.
   *
   * @private
   */
  _onConditionAfterClean() {
    arrayEach(this.latestOrderStack, (column) => {
      this.updateStatesAtColumn(column);
    });
  }

  /**
   * Destroy instance.
   */
  destroy() {
    this.clearLocalHooks();

    objectEach(this, (value, property) => {
      this[property] = null;
    });
  }
}

mixin(ConditionUpdateObserver, localHooks);

export default ConditionUpdateObserver;
