import { arrayEach, arrayFilter, arrayReduce } from 'handsontable/helpers/array';
import CellValue from './cell/value';

/**
 * This component is responsible for storing all calculated cells which contain formula expressions (CellValue) and
 * register for all cell references (CellReference).
 *
 * CellValue is an object which represents a formula expression. It contains a calculated value of that formula,
 * an error if applied and cell references. Cell references are CellReference object instances which represent a cell
 * in a spreadsheet. One CellReference can be assigned to multiple CellValues as a precedent cell. Each cell
 * modification triggers a search through CellValues that are dependent of the CellReference. After
 * the match, the cells are marked as 'out of date'. In the next render cycle, all CellValues marked with
 * that state are recalculated.
 *
 * @class Matrix
 * @util
 */
class Matrix {
  constructor(recordTranslator) {
    /**
     * Record translator for translating visual records into psychical and vice versa.
     *
     * @type {RecordTranslator}
     */
    this.t = recordTranslator;
    /**
     * List of all cell values with theirs precedents.
     *
     * @type {Array}
     */
    this.data = [];
    /**
     * List of all created and registered cell references.
     *
     * @type {Array}
     */
    this.cellReferences = [];
  }

  /**
   * Get cell value at given row and column index.
   *
   * @param {Number} row Physical row index.
   * @param {Number} column Physical column index.
   * @returns {CellValue|null} Returns CellValue instance or `null` if cell not found.
   */
  getCellAt(row, column) {
    let result = null;

    arrayEach(this.data, (cell) => {
      if (cell.row === row && cell.column === column) {
        result = cell;

        return false;
      }
    });

    return result;
  }

  /**
   * Get all out of date cells.
   *
   * @returns {Array}
   */
  getOutOfDateCells() {
    return arrayFilter(this.data, cell => cell.isState(CellValue.STATE_OUT_OFF_DATE));
  }

  /**
   * Add cell value to the collection.
   *
   * @param {CellValue|Object} cellValue Cell value object.
   */
  add(cellValue) {
    if (!arrayFilter(this.data, cell => cell.isEqual(cellValue)).length) {
      this.data.push(cellValue);
    }
  }

  /**
   * Remove cell value from the collection.
   *
   * @param {CellValue|Object|Array} cellValue Cell value object.
   */
  remove(cellValue) {
    const isArray = Array.isArray(cellValue);
    const isEqual = (cell, values) => {
      let result = false;

      if (isArray) {
        arrayEach(values, (value) => {
          if (cell.isEqual(value)) {
            result = true;

            return false;
          }
        });
      } else {
        result = cell.isEqual(values);
      }

      return result;
    };
    this.data = arrayFilter(this.data, cell => !isEqual(cell, cellValue));
  }

  /**
   * Get cell dependencies using visual coordinates.
   *
   * @param {Object} cellCoord Visual cell coordinates object.
   */
  getDependencies(cellCoord) {
    /* eslint-disable arrow-body-style */
    const getDependencies = (cell) => {
      return arrayReduce(this.data, (acc, cellValue) => {
        if (cellValue.hasPrecedent(cell) && acc.indexOf(cellValue) === -1) {
          acc.push(cellValue);
        }

        return acc;
      }, []);
    };

    const getTotalDependencies = (cell) => {
      let deps = getDependencies(cell);

      if (deps.length) {
        arrayEach(deps, (cellValue) => {
          if (cellValue.hasPrecedents()) {
            deps = deps.concat(getTotalDependencies(this.t.toVisual(cellValue)));
          }
        });
      }

      return deps;
    };

    return getTotalDependencies(cellCoord);
  }

  /**
   * Register cell reference to the collection.
   *
   * @param {CellReference|Object} cellReference Cell reference object.
   */
  registerCellRef(cellReference) {
    if (!arrayFilter(this.cellReferences, cell => cell.isEqual(cellReference)).length) {
      this.cellReferences.push(cellReference);
    }
  }

  /**
   * Remove cell references from the collection.
   *
   * @param {Object} start Start visual coordinate.
   * @param {Object} end End visual coordinate.
   * @returns {Array} Returns removed cell references.
   */
  removeCellRefsAtRange({ row: startRow, column: startColumn }, { row: endRow, column: endColumn }) {
    const removed = [];

    const rowMatch = cell => (startRow === void 0 ? true : cell.row >= startRow && cell.row <= endRow);
    const colMatch = cell => (startColumn === void 0 ? true : cell.column >= startColumn && cell.column <= endColumn);

    this.cellReferences = arrayFilter(this.cellReferences, (cell) => {
      if (rowMatch(cell) && colMatch(cell)) {
        removed.push(cell);

        return false;
      }

      return true;
    });

    return removed;
  }

  /**
   * Reset matrix data.
   */
  reset() {
    this.data.length = 0;
    this.cellReferences.length = 0;
  }
}

export default Matrix;
