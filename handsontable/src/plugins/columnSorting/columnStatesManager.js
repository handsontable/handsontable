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
 * @class ColumnStatesManager
 * @plugin ColumnSorting
 */
export class ColumnStatesManager {
  constructor(hot, mapName) {
    /**
     * Handsontable instance.
     *
     * @type {Core}
     */
    this.hot = hot;
    /**
     * Index map storing sorting states for every column. ColumnStatesManager write and read to/from this element.
     *
     * @type {LinkedPhysicalIndexToValueMap}
     */
    this.sortingStates = new IndexToValueMap();
    /**
     * Determines whether we should sort empty cells.
     *
     * @type {boolean}
     */
    this.sortEmptyCells = SORT_EMPTY_CELLS_DEFAULT;
    /**
     * Determines whether indicator should be visible (for sorted columns).
     *
     * @type {boolean}
     */
    this.indicator = SHOW_SORT_INDICATOR_DEFAULT;
    /**
     * Determines whether click on the header perform sorting.
     *
     * @type {boolean}
     */
    this.headerAction = HEADER_ACTION_DEFAULT;
    /**
     * Determines compare function factory. Method get as parameters `sortOder` and `columnMeta` and return compare function.
     */
    this.compareFunctionFactory = void 0;
    /**
     * Name of map storing sorting states. Required for unique name (PR #7440 introduced it). It's needed as
     * both ColumnSorting and MultiColumnSorting plugins create state manager and as a consequence register maps.
     * Objects are destroyed in strange order as the updateSettings doesn't work well.
     */
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
  updateAllColumnsProperties(allSortSettings) {
    if (!isObject(allSortSettings)) {
      return;
    }

    objectEach(allSortSettings, (newValue, propertyName) => {
      if (inheritedColumnProperties.includes(propertyName)) {
        this[propertyName] = newValue;
      }
    });
  }

  /**
   * Get all column properties which affect the sorting result.
   *
   * @returns {object}
   */
  getAllColumnsProperties() {
    const columnProperties = {
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
  getSortOrderOfColumn(searchedColumn) {
    return this.sortingStates.getValueAtIndex(this.hot.toPhysicalColumn(searchedColumn))?.sortOrder;
  }

  /**
   * Get order of particular column in the states queue.
   *
   * @param {number} column Visual column index.
   * @returns {number}
   */
  getIndexOfColumnInSortQueue(column) {
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
  isColumnSorted(column) {
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
      ([physicalColumn, value]) => ({ column: this.hot.toVisualColumn(physicalColumn), ...value }));
  }

  /**
   * Get sort state for particular column. Object contains `column` and `sortOrder` properties.
   *
   * **Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key.
   *
   * @param {number} column Visual column index.
   * @returns {object|undefined}
   */
  getColumnSortState(column) {
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
  setSortStates(sortStates) {
    this.sortingStates.clear();

    for (let i = 0; i < sortStates.length; i += 1) {
      this.sortingStates.setValueAtIndex(this.hot.toPhysicalColumn(sortStates[i].column), {
        sortOrder: sortStates[i].sortOrder
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
