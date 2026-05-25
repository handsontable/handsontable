import type { HotInstance } from '../../core/types';
import { isObject, objectEach } from '../../helpers/object';
import { LinkedPhysicalIndexToValueMap as IndexToValueMap } from '../../translations';
import { isDefined } from '../../helpers/mixed';

const inheritedColumnProperties = ['sortEmptyCells', 'indicator', 'headerAction', 'compareFunctionFactory'];

const SORT_EMPTY_CELLS_DEFAULT = false;
const SHOW_SORT_INDICATOR_DEFAULT = true;
const HEADER_ACTION_DEFAULT = true;

/**
 * Store and manages states of sorted columns.
 *
 * @private
 * @class ColumnStatesManager
 */
export class ColumnStatesManager {
  /**
   * Handsontable instance.
   *
   * @type {Core}
   */
  declare hot: HotInstance;
  /**
   * Index map storing sorting states for every column. ColumnStatesManager write and read to/from this element.
   *
   * @type {LinkedPhysicalIndexToValueMap}
   */
  sortingStates = new IndexToValueMap();
  /**
   * Determines whether we should sort empty cells.
   *
   * @type {boolean}
   */
  sortEmptyCells = SORT_EMPTY_CELLS_DEFAULT;
  /**
   * Determines whether indicator should be visible (for sorted columns).
   *
   * @type {boolean}
   */
  indicator = SHOW_SORT_INDICATOR_DEFAULT;
  /**
   * Determines whether click on the header perform sorting.
   *
   * @type {boolean}
   */
  headerAction = HEADER_ACTION_DEFAULT;
  /**
   * Determines compare function factory. Method get as parameters `sortOder` and `columnMeta` and return compare function.
   */
  declare compareFunctionFactory: unknown;
  /**
   * Name of map storing sorting states. Required for unique name (PR #7440 introduced it). It's needed as
   * both ColumnSorting and MultiColumnSorting plugins create state manager and as a consequence register maps.
   * Objects are destroyed in strange order as the updateSettings doesn't work well.
   */
  mapName;

  constructor(hot: HotInstance, mapName: string) {
    this.hot = hot;
    this.mapName = mapName;
    this.hot.columnIndexMapper.registerMap(mapName, this.sortingStates);
  }

  /**
   * Update column properties which affect the sorting result.
   *
   * **Note**: All column properties can be overwritten by {@link Options#columns} option.
   *
   * @param {object} allSortSettings Column sorting plugin's configuration object.
   */
  updateAllColumnsProperties(allSortSettings: Record<string, unknown>) {
    if (!isObject(allSortSettings)) {
      return;
    }

    objectEach(allSortSettings, (newValue: unknown, propertyName: string) => {
      if (inheritedColumnProperties.includes(propertyName)) {
        (this as Record<string, unknown>)[propertyName] = newValue;
      }
    });
  }

  /**
   * Get all column properties which affect the sorting result.
   *
   * @returns {object}
   */
  getAllColumnsProperties() {
    const columnProperties: Record<string, unknown> = {
      sortEmptyCells: this.sortEmptyCells,
      indicator: this.indicator,
      headerAction: this.headerAction
    };

    if (typeof this.compareFunctionFactory === 'function') {
      columnProperties.compareFunctionFactory = this.compareFunctionFactory;
    }

    return columnProperties;
  }

  /**
   * Get sort order of column.
   *
   * @param {number} searchedColumn Visual column index.
   * @returns {string|undefined} Sort order (`asc` for ascending, `desc` for descending and undefined for not sorted).
   */
  getSortOrderOfColumn(searchedColumn: number) {
    return this.sortingStates
      .getValueAtIndex<{ sortOrder?: string } | null>(this.hot.toPhysicalColumn(searchedColumn))?.sortOrder;
  }

  /**
   * Get order of particular column in the states queue.
   *
   * @param {number} column Visual column index.
   * @returns {number}
   */
  getIndexOfColumnInSortQueue(column: number) {
    column = this.hot.toPhysicalColumn(column);

    return this.sortingStates.getEntries().findIndex(([physicalColumn]) => physicalColumn === column);
  }

  /**
   * Get number of sorted columns.
   *
   * @returns {number}
   */
  getNumberOfSortedColumns() {
    return this.sortingStates.getLength();
  }

  /**
   * Get if list of sorted columns is empty.
   *
   * @returns {boolean}
   */
  isListOfSortedColumnsEmpty() {
    return this.getNumberOfSortedColumns() === 0;
  }

  /**
   * Get if particular column is sorted.
   *
   * @param {number} column Visual column index.
   * @returns {boolean}
   */
  isColumnSorted(column: number) {
    return isObject(this.sortingStates.getValueAtIndex(this.hot.toPhysicalColumn(column)));
  }

  /**
   * Queue of sort states containing sorted columns and their orders (Array of objects containing `column` and `sortOrder` properties).
   *
   * **Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key.
   *
   * @returns {Array<object>}
   */
  getSortStates() {
    if (this.sortingStates === null) {
      return [];
    }

    const sortingStatesQueue = this.sortingStates.getEntries();

    return sortingStatesQueue.map(
      ([physicalColumn, value]) => ({
        column: this.hot.toVisualColumn(physicalColumn as number), ...(value as Record<string, unknown>)
      }));
  }

  /**
   * Get sort state for particular column. Object contains `column` and `sortOrder` properties.
   *
   * **Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key.
   *
   * @param {number} column Visual column index.
   * @returns {object|undefined}
   */
  getColumnSortState(column: number) {
    const sortOrder = this.getSortOrderOfColumn(column);

    if (isDefined(sortOrder)) {
      return {
        column,
        sortOrder,
      };
    }
  }

  /**
   * Set all column states.
   *
   * @param {Array} sortStates Sort states.
   */
  setSortStates(sortStates: unknown[]) {
    this.sortingStates.clear();

    for (let i = 0; i < sortStates.length; i += 1) {
      const state = sortStates[i] as { column: number; sortOrder: string };

      this.sortingStates.setValueAtIndex(this.hot.toPhysicalColumn(state.column), {
        sortOrder: state.sortOrder
      });
    }
  }

  /**
   * Destroy the state manager.
   */
  destroy() {
    this.hot.columnIndexMapper.unregisterMap(this.mapName);
    this.sortingStates = null;
  }
}
