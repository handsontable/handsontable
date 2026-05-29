import { arrayEach } from '../../helpers/array';

/**
 * @private
 * @class DataFilter
 */
class DataFilter {
  /**
   * Reference to the instance of {ConditionCollection}.
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

  constructor(
    conditionCollection: { getFilteredColumns: () => unknown[]; isMatch: (value: unknown, column: number) => boolean },
    columnDataFactory: (column: number) => unknown[] = () => []
  ) {
    this.conditionCollection = conditionCollection;
    this.columnDataFactory = columnDataFactory;
  }

  /**
   * Filter data based on the conditions collection.
   *
   * @returns {Array}
   */
  filter() {
    let filteredData: unknown[] = [];

    arrayEach(this.conditionCollection.getFilteredColumns(), (physicalColumn, index) => {
      let columnData = this.columnDataFactory(physicalColumn as number);

      if (index) {
        columnData = this._getIntersectData(columnData, filteredData);
      }

      filteredData = this.filterByColumn(physicalColumn as number, columnData);
    });

    return filteredData;
  }

  /**
   * Filter data based on specified physical column index.
   *
   * @param {number} column The physical column index.
   * @param {Array} [dataSource] Data source as array of objects with `value` and `meta` keys (e.g. `{value: 'foo', meta: {}}`).
   * @returns {Array} Returns filtered data.
   */
  filterByColumn(column: number, dataSource: unknown[] = []) {
    const filteredData: unknown[] = [];

    arrayEach(dataSource, (dataRow) => {
      if (dataRow !== undefined && this.conditionCollection.isMatch(dataRow, column)) {
        filteredData.push(dataRow);
      }
    });

    return filteredData;
  }

  /**
   * Intersect data.
   *
   * @private
   * @param {Array} data The data to intersect.
   * @param {Array} needles The collection intersected rows with the data.
   * @returns {Array}
   */
  _getIntersectData(data: unknown[], needles: unknown[]) {
    const result: unknown[] = [];

    arrayEach(needles, (needleRow) => {
      const row = (needleRow as Record<string, unknown> & { meta: Record<string, unknown> }).meta.row as number;

      if (data[row] !== undefined) {
        result[row] = data[row];
      }
    });

    return result;
  }
}

export default DataFilter;
