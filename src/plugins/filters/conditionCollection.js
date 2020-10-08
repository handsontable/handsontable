import { arrayEach, arrayMap, arrayReduce } from '../../helpers/array';
import { mixin } from '../../helpers/object';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import localHooks from '../../mixins/localHooks';
import { getCondition } from './conditionRegisterer';
import { OPERATION_ID as OPERATION_AND } from './logicalOperations/conjunction';
import { operations, getOperationFunc } from './logicalOperationRegisterer';
import { isUndefined } from '../../helpers/mixed';

/**
 * @class ConditionCollection
 * @plugin Filters
 */
class ConditionCollection {
  constructor(filteringStates) {
    this.filteringStates = filteringStates;
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
   * @param {number} column Column index.
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
   * @param {number} column Column index.
   * @param {object} conditionDefinition Object with keys:
   *  * `command` Object, Command object with condition name as `key` property.
   *  * `args` Array, Condition arguments.
   * @param {string} [operation='conjunction'] Type of conditions operation.
   * @fires ConditionCollection#beforeAdd
   * @fires ConditionCollection#afterAdd
   */
  addCondition(column, conditionDefinition, operation = OPERATION_AND) {
    const args = arrayMap(conditionDefinition.args, v => (typeof v === 'string' ? v.toLowerCase() : v));
    const name = conditionDefinition.name || conditionDefinition.command.key;

    this.runLocalHooks('beforeAdd', column);

    const columnType = this.filteringStates.getValueAtIndex(column)?.operation;

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
      });

    } else {
      // Add next condition for particular column by reference.
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
   * @param {number} column Column index.
   * @returns {Array} Returns conditions collection as an array.
   */
  getConditions(column) {
    return this.filteringStates.getValueAtIndex(column)?.conditions ?? [];
  }

  /**
   * Get all filtered columns in the order in which the action is performed.
   *
   * @returns {Array}
   */
  getFilteredColumns() {
    return this.filteringStates.getIndexesQueue();
  }

  /**
   * Get operation for particular column.
   *
   * @param {number} column Column index.
   * @returns {string|undefined}
   */
  getOperation(column) {
    return this.filteringStates.getValueAtIndex(column)?.operation;
  }

  /**
   * Export all previously added conditions.
   *
   * @returns {Array}
   */
  exportAllConditions() {
    return arrayReduce(this.filteringStates.getEntries(), (allConditions, [column, { operation, conditions }]) => {
      return allConditions.concat({
        column,
        operation,
        conditions: arrayMap(conditions, ({ name, args }) => ({ name, args })),
      });
    }, []);
  }

  /**
   * Import conditions to the collection.
   *
   * @param {Array} conditions The collection of the conditions.
   */
  importAllConditions(conditions) {
    this.clean();

    arrayEach(conditions, (stack) => {
      arrayEach(stack.conditions, condition => this.addCondition(stack.column, condition));
    });
  }

  /**
   * Remove conditions at given column index.
   *
   * @param {number} column Column index.
   * @fires ConditionCollection#beforeRemove
   * @fires ConditionCollection#afterRemove
   */
  removeConditions(column) {
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
   * @param {number} column Column index.
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
   * Destroy object.
   */
  destroy() {
    this.filteringStates = null;
    this.clearLocalHooks();
  }
}

mixin(ConditionCollection, localHooks);

export default ConditionCollection;
