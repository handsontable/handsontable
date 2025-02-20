import { mixin } from '../../helpers/object';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import localHooks from '../../mixins/localHooks';
import { getCondition } from './conditionRegisterer';
import { OPERATION_ID as OPERATION_AND } from './logicalOperations/conjunction';
import { operations, getOperationFunc } from './logicalOperationRegisterer';
import { isUndefined } from '../../helpers/mixed';
import { LinkedPhysicalIndexToValueMap as IndexToValueMap } from '../../translations';

const MAP_NAME = 'ConditionCollection.filteringStates';

/**
 * @private
 * @class ConditionCollection
 */
class ConditionCollection {
  /**
   * Handsontable instance.
   *
   * @type {Core}
   */
  hot;
  /**
   * Indicates whether the internal IndexMap should be registered or not. Generally,
   * registered Maps responds to the index changes. Within that collection, sometimes
   * this is not necessary.
   *
   * @type {boolean}
   */
  isMapRegistrable;
  /**
   * Index map storing filtering states for every column. ConditionCollection write and read to/from element.
   *
   * @type {LinkedPhysicalIndexToValueMap}
   */
  filteringStates = new IndexToValueMap();
  /**
   * Stores the previous state of the condition stack before the latest filter operation.
   * This is used in the `beforeFilter` plugin to allow performing the undo operation.
   *
   * @type {null|Array}
   */
  previousConditionStack = null;

  constructor(hot, isMapRegistrable = true) {
    this.hot = hot;
    this.isMapRegistrable = isMapRegistrable;

    if (this.isMapRegistrable === true) {
      this.hot.columnIndexMapper.registerMap(MAP_NAME, this.filteringStates);

    } else {
      this.filteringStates.init(this.hot.columnIndexMapper.getNumberOfIndexes());
    }
  }

  /**
   * Check if condition collection is empty (so no needed to filter data).
   *
   * @returns {boolean}
   */
  isEmpty() {
    return this.getFilteredColumns().length === 0;
  }

  /**
   * Check if value is matched to the criteria of conditions chain.
   *
   * @param {object} value Object with `value` and `meta` keys.
   * @param {number} column The physical column index.
   * @returns {boolean}
   */
  isMatch(value, column) {
    const stateForColumn = this.filteringStates.getValueAtIndex(column);
    const conditions = stateForColumn?.conditions ?? [];
    const operation = stateForColumn?.operation;

    return this.isMatchInConditions(conditions, value, operation);
  }

  /**
   * Check if the value is matches the conditions.
   *
   * @param {Array} conditions List of conditions.
   * @param {object} value Object with `value` and `meta` keys.
   * @param {string} [operationType='conjunction'] Type of conditions operation.
   * @returns {boolean}
   */
  isMatchInConditions(conditions, value, operationType = OPERATION_AND) {
    if (conditions.length) {
      return getOperationFunc(operationType)(conditions, value);
    }

    return true;
  }

  /**
   * Add condition to the collection.
   *
   * @param {number} column The physical column index.
   * @param {object} conditionDefinition Object with keys:
   *  * `command` Object, Command object with condition name as `key` property.
   *  * `args` Array, Condition arguments.
   * @param {string} [operation='conjunction'] Type of conditions operation.
   * @param {number} [position] Position to which condition will be added. When argument is undefined
   * the condition will be processed as the last condition.
   * @fires ConditionCollection#beforeAdd
   * @fires ConditionCollection#afterAdd
   */
  addCondition(column, conditionDefinition, operation = OPERATION_AND, position) {
    const localeForColumn = this.hot.getCellMeta(0, column).locale;
    const args = conditionDefinition.args
      .map(v => (typeof v === 'string' ? v.toLocaleLowerCase(localeForColumn) : v));
    const name = conditionDefinition.name || conditionDefinition.command.key;

    // If there's no previous condition stack defined (which means the condition stack was not cleared after the
    // previous filter operation or that there was no filter operation performed yet), store the current conditions as
    // the previous condition stack.
    if (this.previousConditionStack === null) {
      this.setPreviousConditionStack(this.exportAllConditions());
    }

    this.runLocalHooks('beforeAdd', column);

    const columnType = this.getOperation(column);

    if (columnType) {
      if (columnType !== operation) {
        throw Error(toSingleLine`The column of index ${column} has been already applied with a \`${columnType}\`\x20
        filter operation. Use \`removeConditions\` to clear the current conditions and then add new ones.\x20
        Mind that you cannot mix different types of operations (for instance, if you use \`conjunction\`,\x20
        use it consequently for a particular column).`);
      }

    } else if (isUndefined(operations[operation])) {
      throw new Error(toSingleLine`Unexpected operation named \`${operation}\`. Possible ones are\x20
        \`disjunction\` and \`conjunction\`.`);
    }

    const conditionsForColumn = this.getConditions(column);

    if (conditionsForColumn.length === 0) {
      // Create first condition for particular column.
      this.filteringStates.setValueAtIndex(column, {
        operation,
        conditions: [{
          name,
          args,
          func: getCondition(name, args),
        }]
      }, position);

    } else {
      // Add next condition for particular column (by reference).
      conditionsForColumn.push({
        name,
        args,
        func: getCondition(name, args)
      });
    }

    this.runLocalHooks('afterAdd', column);
  }

  /**
   * Get all added conditions from the collection at specified column index.
   *
   * @param {number} column The physical column index.
   * @returns {Array} Returns conditions collection as an array.
   */
  getConditions(column) {
    return this.filteringStates.getValueAtIndex(column)?.conditions ?? [];
  }

  /**
   * Get operation for particular column.
   *
   * @param {number} column The physical column index.
   * @returns {string|undefined}
   */
  getOperation(column) {
    return this.filteringStates.getValueAtIndex(column)?.operation;
  }

  /**
   * Get all filtered physical columns in the order in which actions are performed.
   *
   * @returns {Array}
   */
  getFilteredColumns() {
    return this.filteringStates.getEntries().map(([physicalColumn]) => physicalColumn);
  }

  /**
   * Gets position in the filtering states stack for the specific column.
   *
   * @param {number} column The physical column index.
   * @returns {number} Returns -1 when the column doesn't exist in the stack.
   */
  getColumnStackPosition(column) {
    return this.getFilteredColumns().indexOf(column);
  }

  /**
   * Export all previously added conditions.
   *
   * @returns {Array}
   */
  exportAllConditions() {
    return this.filteringStates.getEntries()
      .reduce((allConditions, [column, { operation, conditions }]) => {
        allConditions.push({
          column,
          operation,
          conditions: conditions.map(({ name, args }) => ({ name, args: [...args] })),
        });

        return allConditions;
      }, []);
  }

  /**
   * Import conditions to the collection.
   *
   * @param {Array} conditions The collection of the conditions.
   */
  importAllConditions(conditions) {
    this.clean();

    conditions.forEach((stack) => {
      stack.conditions.forEach(condition => this.addCondition(stack.column, condition));
    });
  }

  /**
   * Remove conditions at given column index.
   *
   * @param {number} column The physical column index.
   * @fires ConditionCollection#beforeRemove
   * @fires ConditionCollection#afterRemove
   */
  removeConditions(column) {
    // Store the current conditions as the previous condition stack before it's cleared.
    this.setPreviousConditionStack(this.exportAllConditions());

    this.runLocalHooks('beforeRemove', column);
    this.filteringStates.clearValue(column);
    this.runLocalHooks('afterRemove', column);
  }

  /**
   * Clean all conditions collection and reset order stack.
   *
   * @fires ConditionCollection#beforeClean
   * @fires ConditionCollection#afterClean
   */
  clean() {
    this.runLocalHooks('beforeClean');
    this.filteringStates.clear();
    this.runLocalHooks('afterClean');
  }

  /**
   * Check if at least one condition was added at specified column index. And if second parameter is passed then additionally
   * check if condition exists under its name.
   *
   * @param {number} column The physical column index.
   * @param {string} [name] Condition name.
   * @returns {boolean}
   */
  hasConditions(column, name) {
    const conditions = this.getConditions(column);

    if (name) {
      return conditions.some(condition => condition.name === name);
    }

    return conditions.length > 0;
  }

  /**
   * Updates the `previousConditionStack` property with the provided stack.
   * It is used to store the current conditions before they are modified, allowing for undo operations.
   *
   * @param {Array|null} previousConditionStack The stack of previous conditions.
   */
  setPreviousConditionStack(previousConditionStack) {
    this.previousConditionStack = previousConditionStack;
  }

  /**
   * Destroy object.
   */
  destroy() {
    if (this.isMapRegistrable) {
      this.hot.columnIndexMapper.unregisterMap(MAP_NAME);
    }

    this.filteringStates = null;
    this.clearLocalHooks();
  }
}

mixin(ConditionCollection, localHooks);

export default ConditionCollection;
