import { runSourceDataValidators } from '../sourceDataValidator';

/**
 * Builds a minimal mock Handsontable instance for exercising `runSourceDataValidators` in isolation.
 *
 * @param {object} options Mock configuration.
 * @param {number} options.rows Number of source rows.
 * @param {number} options.cols Number of source cols.
 * @param {Function} [options.validator] The `sourceDataValidator` placed on every cell's meta.
 * @param {boolean} [options.allowInvalid] The `allowInvalid` meta value.
 * @param {object} [options.settings] The settings returned by `getSettings`.
 * @param {Function} [options.getValue] Maps `(row, col)` to a source value.
 * @returns {object} The mock and its spies.
 */
function createMockHot({ rows, cols, validator, allowInvalid, settings = {}, getValue } = {}) {
  const getCellMeta = jest.fn((visualRow, visualColumn) => {
    const meta = {
      row: visualRow,
      col: visualColumn,
      sourceDataWarningMessage: 'invalid',
    };

    if (validator) {
      meta.sourceDataValidator = validator;
    }

    if (allowInvalid !== undefined) {
      meta.allowInvalid = allowInvalid;
    }

    return meta;
  });
  const getAtCell = jest.fn((row, col) => (getValue ? getValue(row, col) : `${row}-${col}`));
  const setAtCell = jest.fn();
  const hot = {
    countSourceRows: () => rows,
    countSourceCols: () => cols,
    getSettings: () => settings,
    _getDataSource: () => ({ getAtCell, setAtCell }),
    toVisualRow: row => row,
    toVisualColumn: col => col,
    getCellMeta,
  };

  return { hot, getCellMeta, getAtCell, setAtCell };
}

/**
 * Creates a `sourceDataValidator` spy, optionally flagged row-independent (as the built-in
 * date/time validators are).
 *
 * @param {boolean} rowIndependent Whether to flag the validator as row-independent.
 * @param {Function} [impl] The validation implementation (defaults to always valid).
 * @returns {Function} The validator spy.
 */
function makeValidator(rowIndependent, impl = () => true) {
  const validator = jest.fn(impl);

  if (rowIndependent) {
    validator.rowIndependent = true;
  }

  return validator;
}

describe('runSourceDataValidators', () => {
  it('should materialize meta once per column (O(cols)) for a row-independent validator', () => {
    const validator = makeValidator(true);
    const { hot, getCellMeta } = createMockHot({ rows: 1000, cols: 10, validator });

    runSourceDataValidators(hot, 'init');

    // One sample meta per column — NOT one per cell.
    expect(getCellMeta).toHaveBeenCalledTimes(10);
    // Every value is still validated.
    expect(validator).toHaveBeenCalledTimes(1000 * 10);
  });

  it('should validate every value for a row-independent validator (full coverage preserved)', () => {
    const seen = [];
    const validator = makeValidator(true, (value) => {
      seen.push(value);

      return true;
    });
    const { hot } = createMockHot({ rows: 3, cols: 2, validator, getValue: (r, c) => `${r}:${c}` });

    runSourceDataValidators(hot, 'init');

    expect(seen.sort()).toEqual(['0:0', '0:1', '1:0', '1:1', '2:0', '2:1']);
  });

  it('should fall back to per-cell meta (O(rows*cols)) for a non-row-independent validator', () => {
    const validator = makeValidator(false);
    const { hot, getCellMeta } = createMockHot({ rows: 50, cols: 4, validator });

    runSourceDataValidators(hot, 'init');

    // Per-cell scan: the column probe samples column 0, then every cell is resolved.
    expect(getCellMeta).toHaveBeenCalledTimes((50 * 4) + 1);
    expect(validator).toHaveBeenCalledTimes(50 * 4);
  });

  it('should skip the row scan entirely when no validator is configured', () => {
    const { hot, getCellMeta, getAtCell } = createMockHot({ rows: 1000, cols: 8 });

    runSourceDataValidators(hot, 'init');

    // Only the per-column sample — no per-cell work.
    expect(getCellMeta).toHaveBeenCalledTimes(8);
    expect(getAtCell).not.toHaveBeenCalled();
  });

  it('should use per-cell meta when a `cells` function is configured (even with a row-independent validator)', () => {
    const validator = makeValidator(true);
    const { hot, getCellMeta } = createMockHot({
      rows: 20,
      cols: 3,
      validator,
      settings: { cells: () => ({}) },
    });

    runSourceDataValidators(hot, 'init');

    expect(getCellMeta).toHaveBeenCalledTimes(20 * 3);
  });

  it('should use per-cell meta when a non-empty `cell` array is configured', () => {
    const validator = makeValidator(true);
    const { hot, getCellMeta } = createMockHot({
      rows: 20,
      cols: 3,
      validator,
      settings: { cell: [{ row: 0, col: 0 }] },
    });

    runSourceDataValidators(hot, 'init');

    expect(getCellMeta).toHaveBeenCalledTimes(20 * 3);
  });

  it('should blank invalid values when allowInvalid is false (batched path)', () => {
    const validator = makeValidator(true, value => value !== 'bad');
    const { hot, setAtCell } = createMockHot({
      rows: 3,
      cols: 2,
      validator,
      allowInvalid: false,
      getValue: (r, c) => (r === 1 && c === 1 ? 'bad' : 'ok'),
    });

    runSourceDataValidators(hot, 'init');

    expect(setAtCell).toHaveBeenCalledTimes(1);
    expect(setAtCell).toHaveBeenCalledWith(1, 1, null);
  });

  it('should not blank invalid values when allowInvalid is true (batched path)', () => {
    const validator = makeValidator(true, value => value !== 'bad');
    const { hot, setAtCell } = createMockHot({
      rows: 3,
      cols: 2,
      validator,
      allowInvalid: true,
      getValue: (r, c) => (r === 1 && c === 1 ? 'bad' : 'ok'),
    });

    runSourceDataValidators(hot, 'init');

    expect(setAtCell).not.toHaveBeenCalled();
  });

  it('should do nothing when the dataset is empty', () => {
    const validator = makeValidator(true);
    const { hot, getCellMeta } = createMockHot({ rows: 0, cols: 5, validator });

    runSourceDataValidators(hot, 'init');

    expect(getCellMeta).not.toHaveBeenCalled();
  });
});
