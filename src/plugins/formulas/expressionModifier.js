import { toLabel, extractLabel, error, ERROR_REF } from 'hot-formula-parser';
import { arrayEach, arrayFilter } from '../../helpers/array';
import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';
import { toUpperCaseFormula } from './utils';

const BARE_CELL_STRICT_REGEX = /^\$?[A-Z]+\$?\d+$/;
const BARE_CELL_REGEX = /\$?[A-Z]+\$?\d+/;
const CELL_REGEX = /(?:[^0-9A-Z$: ]|^)\s*(\$?[A-Z]+\$?\d+)\s*(?![0-9A-Z_: ])/g;
const RANGE_REGEX = /\$?[A-Z]+\$?\d+\s*:\s*\$?[A-Z]+\$?\d+/g;
const CELL_AND_RANGE_REGEX = /((?:[^0-9A-Z$: ]|^)\s*(\$?[A-Z]+\$?\d+)\s*(?![0-9A-Z_: ]))|(\$?[A-Z]+\$?\d+\s*:\s*\$?[A-Z]+\$?\d+)/g;

/**
 * Component adds an ability to parse and modify formula expressions. It is designed for translating cell
 * coordinates and cell ranges in any direction. By default, component translates only relative coordinates but this
 * behavior can be overwritten by passing custom modifier which controls translating process.
 *
 * @class ExpressionModifier
 * @util
 */
class ExpressionModifier {
  constructor(expression) {
    /**
     * Formula expression to modify.
     *
     * @type {String}
     */
    this.expression = '';
    /**
     * Extracted cells and cells ranges.
     *
     * @type {Array}
     */
    this.cells = [];
    /**
     * Function which can modify default behaviour of how cells and cell ranges will be translated.
     *
     * @type {null|Function}
     */
    this.customModifier = null;

    if (typeof expression === 'string') {
      this.setExpression(expression);
    }
  }

  /**
   * Set formula expression to modify.
   *
   * @param {String} expression Formula expression to process.
   * @returns {ExpressionModifier}
   */
  setExpression(expression) {
    this.cells.length = 0;
    this.expression = toUpperCaseFormula(expression);

    this._extractCells();
    this._extractCellsRange();

    return this;
  }

  /**
   * Set function which can modify default behavior of how cells and cell ranges will be translated.
   * The passed function will be called with 4 arguments:
   *  - cell, A cell object with structure
   *            like this: {start: {row, column}, end: {row, column}, origLabel, type: 'cell|range', refError, toLabel: () => {}}
   *  - axis, Type of currently processing axis ('row' or 'column')
   *  - delta, Number as distance to translate. Can be positive or negative.
   *  - startFromIndex, Base index which translation will be applied from.
   *
   * the function must return an array with 3 items, where:
   *  [
   *    deltaStart, Number as a delta to translate first part of coordinates.
   *    deltaEnd,   Number as a delta to translate second part of coordinates (if cell range is modified).
   *    refError,   Defines an error which refers to the situation when translated cell overcrossed the data boundary.
   *  ]
   *
   *
   * @param {Function} customModifier Function with custom logic.
   */
  useCustomModifier(customModifier) {
    this.customModifier = customModifier;
  }

  /**
   * Translate formula expression cells.
   *
   * @param {Object} delta Distance to move in proper direction.
   * @param {Object} [startFrom] Coordinates which translation will be applied from.
   * @returns {ExpressionModifier}
   */
  translate({ row: deltaRow, column: deltaColumn }, startFrom = {}) {
    arrayEach(this.cells, (cell) => {
      if (deltaRow !== null && deltaRow !== void 0) {
        this._translateCell(cell, 'row', deltaRow, startFrom.row);
      }
      if (deltaColumn !== null && deltaColumn !== void 0) {
        this._translateCell(cell, 'column', deltaColumn, startFrom.column);
      }
    });

    return this;
  }

  /**
   * Translate object into string representation.
   *
   * @returns {String}
   */
  toString() {
    let expression = this.expression.replace(CELL_AND_RANGE_REGEX, (match, p1, p2) => {
      const isSingleCell = match.indexOf(':') === -1;
      let result = match;
      let cellLabel = match;
      let translatedCellLabel = null;

      if (isSingleCell) {
        cellLabel = BARE_CELL_STRICT_REGEX.test(p1) ? p1 : p2;
      }
      const cell = this._searchCell(cellLabel);

      if (cell) {
        translatedCellLabel = cell.refError ? error(ERROR_REF) : cell.toLabel();

        if (isSingleCell) {
          result = match.replace(cellLabel, translatedCellLabel);
        } else {
          result = translatedCellLabel;
        }
      }

      return result;
    });

    if (!expression.startsWith('=')) {
      expression = `=${expression}`;
    }

    return expression;
  }

  /**
   * Translate single cell.
   *
   * @param {Object} cell Cell object.
   * @param {String} axis Axis to modify.
   * @param {Number} delta Distance to move.
   * @param {Number} [startFromIndex] Base index which translation will be applied from.
   * @private
   */
  _translateCell(cell, axis, delta, startFromIndex) {
    const { start, end } = cell;
    const startIndex = start[axis].index;
    const endIndex = end[axis].index;

    let deltaStart = delta;
    let deltaEnd = delta;
    let refError = false;

    if (this.customModifier) {
      [deltaStart, deltaEnd, refError] = this.customModifier(cell, axis, delta, startFromIndex);
    } else {
      // By default only relative cells are translated, if meets absolute reset deltas to 0
      if (start[axis].isAbsolute) {
        deltaStart = 0;
      }
      if (end[axis].isAbsolute) {
        deltaEnd = 0;
      }
    }

    if (deltaStart && !refError) {
      if (startIndex + deltaStart < 0) {
        refError = true;
      }
      start[axis].index = Math.max(startIndex + deltaStart, 0);
    }
    if (deltaEnd && !refError) {
      if (endIndex + deltaEnd < 0) {
        refError = true;
      }
      end[axis].index = Math.max(endIndex + deltaEnd, 0);
    }
    if (refError) {
      cell.refError = true;
    }
  }

  /**
   * Extract all cells from the formula expression.
   *
   * @private
   */
  _extractCells() {
    const matches = this.expression.match(CELL_REGEX);

    if (!matches) {
      return;
    }
    arrayEach(matches, (coord) => {
      const cellCoords = coord.match(BARE_CELL_REGEX);

      if (!cellCoords) {
        return;
      }
      const [row, column] = extractLabel(cellCoords[0]);

      this.cells.push(this._createCell({ row, column }, { row, column }, cellCoords[0]));
    });
  }

  /**
   * Extract all cells range from the formula expression.
   *
   * @private
   */
  _extractCellsRange() {
    const matches = this.expression.match(RANGE_REGEX);

    if (!matches) {
      return;
    }
    arrayEach(matches, (match) => {
      const [start, end] = match.split(':');
      const [startRow, startColumn] = extractLabel(start);
      const [endRow, endColumn] = extractLabel(end);
      const startCell = {
        row: startRow,
        column: startColumn,
      };
      const endCell = {
        row: endRow,
        column: endColumn,
      };

      this.cells.push(this._createCell(startCell, endCell, match));
    });
  }

  /**
   * Search cell by its label.
   *
   * @param {String} label Cell label eq. `B4` or `$B$6`.
   * @returns {Object|null}
   * @private
   */
  _searchCell(label) {
    const [cell] = arrayFilter(this.cells, cellMeta => cellMeta.origLabel === label);

    return cell || null;
  }

  /**
   * Create object cell.
   *
   * @param {Object} start Start coordinates (top-left).
   * @param {Object} end End coordinates (bottom-right).
   * @param {String} label Original label name.
   * @returns {Object}
   * @private
   */
  _createCell(start, end, label) {
    return {
      start,
      end,
      origLabel: label,
      type: label.indexOf(':') === -1 ? 'cell' : 'range',
      refError: false,
      toLabel() {
        let newLabel = toLabel(this.start.row, this.start.column);

        if (this.type === 'range') {
          newLabel += `:${toLabel(this.end.row, this.end.column)}`;
        }

        return newLabel;
      }
    };
  }
}

mixin(ExpressionModifier, localHooks);

export default ExpressionModifier;
