import { arrayEach, arrayMap } from '../../helpers/array';

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
   * Function which provide source data factory for specified column. The optional second
   * argument narrows the read to the given physical rows only.
   *
   * @type {Function}
   */
  columnDataFactory;

  /**
   * Initializes the data filter with a condition collection that provides filtering logic and a factory function that supplies column source data.
   */
  constructor(
    conditionCollection: { getFilteredColumns: () => unknown[]; isMatch: (value: unknown, column: number) => boolean },
    columnDataFactory: (column: number, physicalRows?: number[]) => unknown[] = () => []
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
      let columnData;

      if (index) {
        // Materialize only the rows that survived the previous columns' conditions instead of
        // re-reading (and re-creating cell meta for) every source row once per filtered column.
        const survivingRows = arrayMap(filteredData,
          rowData => (rowData as { row: number }).row);

        columnData = this.columnDataFactory(physicalColumn as number, survivingRows);
      } else {
        columnData = this.columnDataFactory(physicalColumn as number);
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
}

export default DataFilter;
