import { arrayEach } from '../../helpers/array';
import { ColumnDataMap } from './columnDataMap';
import type { ColumnDataEntry } from './columnDataMap';

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
    columnDataFactory: (column: number, physicalRows?: number[]) => ColumnDataMap = () => ColumnDataMap.empty()
  ) {
    this.conditionCollection = conditionCollection;
    this.columnDataFactory = columnDataFactory;
  }

  /**
   * Filter data based on the conditions collection.
   *
   * @returns {number[]} The physical row indexes that matched every filtered column, in read order.
   */
  filter(): number[] {
    let matchedRows: number[] = [];

    arrayEach(this.conditionCollection.getFilteredColumns(), (physicalColumn, index) => {
      // Materialize only the rows that survived the previous columns' conditions instead of
      // re-reading (and re-creating cell meta for) every source row once per filtered column.
      const columnData = index
        ? this.columnDataFactory(physicalColumn as number, matchedRows)
        : this.columnDataFactory(physicalColumn as number);

      matchedRows = this.filterByColumn(physicalColumn as number, columnData);
    });

    return matchedRows;
  }

  /**
   * Filter the rows of one column read, by physical column index.
   *
   * Each condition call gets its own `{ row, meta, value }` object, with the cell meta of that row
   * alone. A condition is user code that may keep either past its own call, so neither the object
   * nor its meta is ever shared between rows.
   *
   * @param {number} column The physical column index.
   * @param {ColumnDataMap} [dataSource] The column read to filter.
   * @returns {number[]} The physical row indexes that matched.
   */
  filterByColumn(column: number, dataSource: ColumnDataMap = ColumnDataMap.empty()): number[] {
    const matchedRows: number[] = [];
    const rowsCount = dataSource.length;

    for (let index = 0; index < rowsCount; index++) {
      const physicalRow = dataSource.getRow(index);
      const dataRow: ColumnDataEntry = {
        row: physicalRow,
        meta: dataSource.getMeta(index),
        value: dataSource.getValue(index),
      };

      if (this.conditionCollection.isMatch(dataRow, column)) {
        matchedRows.push(physicalRow);
      }
    }

    return matchedRows;
  }
}

export default DataFilter;
