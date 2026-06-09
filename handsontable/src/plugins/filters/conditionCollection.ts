import type { HotInstance } from '../../core/types';
import type { OperationType, ConditionId, ColumnConditions } from './filters';

/**
 * Internal representation of a condition — extends the public ConditionId with the resolved function.
 */
interface StoredCondition extends ConditionId {
  func: Function;
}
/**
 * Internal column state as stored in filteringStates.
 */
interface StoredColumnState {
  operation: OperationType;
  conditions: StoredCondition[];
}
import { mixin } from '../../helpers/object';
import { throwWithCause } from '../../helpers/errors';
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
  declare hot: HotInstance;
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
   * Initializes the condition collection with the Handsontable instance, optionally registering the filtering states index map on the column index mapper.
   */
  constructor(hot: HotInstance, isMapRegistrable = true) {
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
  isMatch(value: unknown, column: number): boolean {
    const stateForColumn = this.filteringStates.getValueAtIndex<Record<string, unknown> | null>(column);
    const conditions = (stateForColumn?.conditions ?? []) as unknown[];
    const operation = stateForColumn?.operation as string;

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
  isMatchInConditions(conditions: unknown[], value: unknown, operationType = OPERATION_AND): boolean {
    if (conditions.length) {
      return getOperationFunc(operationType)(conditions, value) as boolean;
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
  addCondition(
    column: number, conditionDefinition: Record<string, unknown>, operation = OPERATION_AND, position?: number
  ) {
    const localeForColumn = this.hot.getCellMeta(0, column).locale;
    const args = (conditionDefinition.args as unknown[])
      .map((v: unknown) => (typeof v === 'string' ? v.toLocaleLowerCase(localeForColumn as string) : v));
    const name = (conditionDefinition.name || (conditionDefinition.command as Record<string, unknown>).key) as string;

    this.runLocalHooks('beforeAdd', column);

    const columnType = this.getOperation(column);

    if (columnType) {
      if (columnType !== operation) {
        throwWithCause(toSingleLine`The column of index ${column} has been already applied with a \`${columnType}\`\x20
        filter operation. Use \`removeConditions\` to clear the current conditions and then add new ones.\x20
        Mind that you cannot mix different types of operations (for instance, if you use \`conjunction\`,\x20
        use it consequently for a particular column).`);
      }

    } else if (isUndefined(operations[operation])) {
      throwWithCause(toSingleLine`Unexpected operation named \`${operation}\`. Possible ones are\x20
        \`disjunction\` and \`conjunction\`.`);
    }

    const conditionsForColumn = this.getConditions(column) as StoredCondition[];

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
  getConditions(column: number): ConditionId[] {
    return this.filteringStates.getValueAtIndex<StoredColumnState | undefined>(column)?.conditions ?? [];
  }

  /**
   * Get operation for particular column.
   *
   * @param {number} column The physical column index.
   * @returns {string|undefined}
   */
  getOperation(column: number): OperationType | undefined {
    return this.filteringStates.getValueAtIndex<StoredColumnState | undefined>(column)?.operation;
  }

  /**
   * Get all filtered physical columns in the order in which actions are performed.
   *
   * @returns {Array}
   */
  getFilteredColumns(): number[] {
    return this.filteringStates.getEntries().map(([physicalColumn]) => physicalColumn as number);
  }

  /**
   * Gets position in the filtering states stack for the specific column.
   *
   * @param {number} column The physical column index.
   * @returns {number} Returns -1 when the column doesn't exist in the stack.
   */
  getColumnStackPosition(column: number) {
    return this.getFilteredColumns().indexOf(column);
  }

  /**
   * Export all previously added conditions.
   *
   * @returns {Array}
   */
  exportAllConditions(): ColumnConditions[] {
    return (this.filteringStates.getEntries() as [number, StoredColumnState][])
      .reduce((allConditions: ColumnConditions[], [column, stateValue]) => {
        const { operation, conditions } = stateValue;

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
  importAllConditions(conditions: ColumnConditions[] | unknown[]) {
    this.clean();

    (conditions as ColumnConditions[]).forEach((stack) => {
      stack.conditions.forEach((condition) => {
        this.addCondition(stack.column, condition as unknown as Record<string, unknown>, stack.operation);
      });
    });
  }

  /**
   * Remove conditions at given column index.
   *
   * @param {number} column The physical column index.
   * @fires ConditionCollection#beforeRemove
   * @fires ConditionCollection#afterRemove
   */
  removeConditions(column: number) {
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
  hasConditions(column: number, name?: string) {
    const conditions = this.getConditions(column);

    if (name) {
      return conditions.some((condition: ConditionId) => condition.name === name);
    }

    return conditions.length > 0;
  }

  /**
   * Destroy object.
   */
  destroy() {
    if (this.isMapRegistrable) {
      this.hot.columnIndexMapper.unregisterMap(MAP_NAME);
    }

    this.clearLocalHooks();
    (this as unknown as { filteringStates: null }).filteringStates = null;
  }
}

interface ConditionCollection {
  addLocalHook(key: string, callback: Function): this;
  removeLocalHook(key: string, callback: Function): this;
  runLocalHooks(key: string, ...args: unknown[]): void;
  clearLocalHooks(): this;
}

mixin(ConditionCollection, localHooks);

export default ConditionCollection;
