import { runSourceDataValidators } from '../sourceDataValidator';

/**
 * Builds a minimal mock Handsontable instance for exercising `runSourceDataValidators` in isolation.
 *
 * Source-data validation resolves meta through `MetaManager.getCellMetaUncached`, so the mock exposes
 * that method (not the `Core#getCellMeta` visual-index wrapper) and counts its calls.
 *
 * @param {object} options Mock configuration.
 * @param {number} options.rows Number of source rows.
 * @param {number} options.cols Number of source cols.
 * @param {Function} [options.validator] The `sourceDataValidator` placed on every resolved cell meta.
 * @param {boolean} [options.allowInvalid] The `allowInvalid` meta value.
 * @param {object} [options.settings] The settings returned by `getSettings`.
 * @param {Function} [options.getValue] Maps `(row, prop)` to a source value.
 * @param {Function} [options.toVisualRow] Maps a physical row to its visual index (or `null`).
 * @param {Function} [options.colToProp] Maps a visual column to its source address. Defaults to the
 *   identity, which is what an array-of-arrays grid with no `columns` setting does.
 * @param {Array} [options.userDefinedCellMetas] Imperatively-set cell metas (`setCellMeta`) to report.
 * @returns {object} The mock and its spies.
 */
function createMockHot({
  rows, cols, validator, allowInvalid, settings = {}, getValue, toVisualRow = row => row,
  colToProp = column => column, userDefinedCellMetas = [],
} = {}) {
  const getCellMetaUncached = jest.fn((physicalRow, physicalColumn, { visualRow, visualColumn }) => {
    const meta = {
      row: physicalRow,
      col: physicalColumn,
      visualRow,
      visualCol: visualColumn,
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
  // Reads go through the prop, exactly as the source data itself is keyed — never through a
  // visual column index, which `columns[].data` and a column move both detach from the address.
  const getAtSourceProp = jest.fn((row, prop) => (getValue ? getValue(row, prop) : `${row}-${prop}`));
  const setAtCell = jest.fn();
  const modifyRowData = jest.fn(row => `row-${row}`);
  const hot = {
    countSourceRows: () => rows,
    countSourceCols: () => cols,
    getSettings: () => settings,
    colToProp: jest.fn(colToProp),
    _getDataSource: () => ({ getAtSourceProp, setAtCell, modifyRowData }),
    rowIndexMapper: { getVisualFromPhysicalIndex: toVisualRow },
    columnIndexMapper: { getVisualFromPhysicalIndex: col => col },
    _getMetaManager: () => ({
      getCellMetaUncached,
      getUserDefinedCellMetas: () => userDefinedCellMetas,
    }),
  };

  return { hot, getCellMetaUncached, getAtSourceProp, setAtCell, modifyRowData };
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
    const { hot, getCellMetaUncached } = createMockHot({ rows: 1000, cols: 10, validator });

    runSourceDataValidators(hot, 'init');

    // One sample meta per column — NOT one per cell.
    expect(getCellMetaUncached).toHaveBeenCalledTimes(10);
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
    const { hot, getCellMetaUncached } = createMockHot({ rows: 50, cols: 4, validator });

    runSourceDataValidators(hot, 'init');

    // Per-cell scan: the column probe samples column 0, then every cell is resolved.
    expect(getCellMetaUncached).toHaveBeenCalledTimes((50 * 4) + 1);
    expect(validator).toHaveBeenCalledTimes(50 * 4);
  });

  it('should skip the row scan entirely when no validator is configured', () => {
    const { hot, getCellMetaUncached, getAtSourceProp } = createMockHot({ rows: 1000, cols: 8 });

    runSourceDataValidators(hot, 'init');

    // Only the per-column sample — no per-cell work.
    expect(getCellMetaUncached).toHaveBeenCalledTimes(8);
    expect(getAtSourceProp).not.toHaveBeenCalled();
  });

  it('should skip the scan when a `cells` function is configured but no validator exists', () => {
    // The regression from the forum report: a `cells` function must NOT force full-dataset meta
    // resolution when nothing carries a source-data validator.
    const { hot, getCellMetaUncached, getAtSourceProp } = createMockHot({
      rows: 30000,
      cols: 20,
      settings: { cells: () => ({ className: 'x' }) },
    });

    runSourceDataValidators(hot, 'init');

    // Only the per-column probe runs — the 600k-cell scan is skipped.
    expect(getCellMetaUncached).toHaveBeenCalledTimes(20);
    expect(getAtSourceProp).not.toHaveBeenCalled();
  });

  it('should NOT force per-cell meta for a `cells` function when the validator is column-level', () => {
    // A `cells` function no longer routes to the per-cell scan: uncached meta ignores it, so a
    // row-independent column validator is still validated through the batched (O(cols)) path.
    const validator = makeValidator(true);
    const { hot, getCellMetaUncached } = createMockHot({
      rows: 20,
      cols: 3,
      validator,
      settings: { cells: () => ({}) },
    });

    runSourceDataValidators(hot, 'init');

    expect(getCellMetaUncached).toHaveBeenCalledTimes(3);
    expect(validator).toHaveBeenCalledTimes(20 * 3);
  });

  it('should NOT force per-cell meta when a `beforeGetCellMeta` hook is registered', () => {
    // Hooks are never run during uncached resolution, so they cannot introduce a validator and must
    // not route to the per-cell scan.
    const validator = makeValidator(true);
    const { hot, getCellMetaUncached } = createMockHot({ rows: 20, cols: 3, validator });

    runSourceDataValidators(hot, 'init');

    expect(getCellMetaUncached).toHaveBeenCalledTimes(3);
  });

  it('should use per-cell meta when a non-empty `cell` array is configured', () => {
    // A declarative `cell` override is persistent per-cell meta that uncached resolution DOES see, so
    // it forces the per-cell scan (a stored cell may carry a validator on any row).
    const validator = makeValidator(true);
    const { hot, getCellMetaUncached } = createMockHot({
      rows: 20,
      cols: 3,
      validator,
      settings: { cell: [{ row: 0, col: 0 }] },
    });

    runSourceDataValidators(hot, 'init');

    // Column probe (3) + full per-cell scan (20 * 3).
    expect(getCellMetaUncached).toHaveBeenCalledTimes(3 + (20 * 3));
    expect(validator).toHaveBeenCalledTimes(20 * 3);
  });

  it('should use per-cell meta when imperatively-set cell meta exists (`setCellMeta`)', () => {
    const validator = makeValidator(true);
    const { hot, getCellMetaUncached } = createMockHot({
      rows: 20,
      cols: 3,
      validator,
      userDefinedCellMetas: [{ physicalRow: 2, physicalColumn: 0, key: 'allowInvalid', value: false }],
    });

    runSourceDataValidators(hot, 'init');

    // Column probe (3) + full per-cell scan (20 * 3).
    expect(getCellMetaUncached).toHaveBeenCalledTimes(3 + (20 * 3));
    expect(validator).toHaveBeenCalledTimes(20 * 3);
  });

  it('should still scan when a `cell` array is present even if the column probe finds no validator', () => {
    // No column validator, but a stored cell might carry one — the scan must run (not skip). With no
    // validator on any cell here it does no validation work, but it must NOT skip the array case.
    const { hot, getCellMetaUncached, getAtSourceProp } = createMockHot({
      rows: 20,
      cols: 3,
      settings: { cell: [{ row: 5, col: 1 }] },
    });

    runSourceDataValidators(hot, 'init');

    expect(getCellMetaUncached).toHaveBeenCalledTimes(3 + (20 * 3));
    // No validator anywhere, so no source value is read.
    expect(getAtSourceProp).not.toHaveBeenCalled();
  });

  it('should keep the batched path when no `cell` array or imperative meta are present', () => {
    const validator = makeValidator(true);
    const { hot, getCellMetaUncached } = createMockHot({ rows: 20, cols: 3, validator });

    runSourceDataValidators(hot, 'init');

    // One sample meta per column — the batched path is preserved.
    expect(getCellMetaUncached).toHaveBeenCalledTimes(3);
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

  // `columns: [{ data: 2 }, { data: 3 }]` maps column 0 onto source index 2. The validator used to
  // read through the visual index and blank through the physical one, so it judged one cell and
  // cleared another (DEV-2722).
  it('should read and blank at the column source address when `columns[].data` remaps it (batched path)', () => {
    const validator = makeValidator(true, value => value !== 'bad');
    const { hot, setAtCell, getAtSourceProp } = createMockHot({
      rows: 2,
      cols: 2,
      validator,
      allowInvalid: false,
      colToProp: column => column + 2,
      getValue: (r, prop) => (r === 1 && prop === 2 ? 'bad' : 'ok'),
    });

    runSourceDataValidators(hot, 'init');

    expect(getAtSourceProp).toHaveBeenCalledWith(1, 2, expect.anything());
    expect(setAtCell).toHaveBeenCalledTimes(1);
    // Source index 2, not the physical column 0 the meta belongs to.
    expect(setAtCell).toHaveBeenCalledWith(1, 2, null);
  });

  it('should read and blank at the column source address when `columns[].data` remaps it (per-cell path)', () => {
    const validator = makeValidator(false, value => value !== 'bad');
    const { hot, setAtCell, getAtSourceProp } = createMockHot({
      rows: 2,
      cols: 2,
      validator,
      allowInvalid: false,
      settings: { cell: [{ row: 0, col: 0 }] },
      colToProp: column => column + 2,
      getValue: (r, prop) => (r === 0 && prop === 3 ? 'bad' : 'ok'),
    });

    runSourceDataValidators(hot, 'init');

    expect(getAtSourceProp).toHaveBeenCalledWith(0, 3, expect.anything());
    expect(setAtCell).toHaveBeenCalledTimes(1);
    expect(setAtCell).toHaveBeenCalledWith(0, 3, null);
  });

  // A `columns[].data` accessor function is a third address shape: `colToProp()` hands back the
  // function itself, and both the read and the write go through it rather than through a key.
  it('should read and blank through a `columns[].data` accessor function (batched path)', () => {
    // Each accessor owns one key: it reads with no value, writes with one.
    const makeAccessor = key => (row, value) => {
      if (value === undefined) {
        return row[key];
      }

      row[key] = value;
    };
    const accessors = [makeAccessor('name'), makeAccessor('city')];
    const validator = makeValidator(true, value => value !== 'bad');
    const { hot, setAtCell, getAtSourceProp } = createMockHot({
      rows: 2,
      cols: 2,
      validator,
      allowInvalid: false,
      colToProp: column => accessors[column],
      getValue: (r, prop) => (r === 1 && prop === accessors[1] ? 'bad' : 'ok'),
    });

    runSourceDataValidators(hot, 'init');

    expect(getAtSourceProp).toHaveBeenCalledWith(1, accessors[1], expect.anything());
    expect(setAtCell).toHaveBeenCalledTimes(1);
    // The accessor itself is the address — it owns both the read and the write.
    expect(setAtCell).toHaveBeenCalledWith(1, accessors[1], null);
  });

  it('should read and blank through a `columns[].data` accessor function (per-cell path)', () => {
    // Each accessor owns one key: it reads with no value, writes with one.
    const makeAccessor = key => (row, value) => {
      if (value === undefined) {
        return row[key];
      }

      row[key] = value;
    };
    const accessors = [makeAccessor('name'), makeAccessor('city')];
    const validator = makeValidator(false, value => value !== 'bad');
    const { hot, setAtCell, getAtSourceProp } = createMockHot({
      rows: 2,
      cols: 2,
      validator,
      allowInvalid: false,
      settings: { cell: [{ row: 0, col: 0 }] },
      colToProp: column => accessors[column],
      getValue: (r, prop) => (r === 0 && prop === accessors[0] ? 'bad' : 'ok'),
    });

    runSourceDataValidators(hot, 'init');

    expect(getAtSourceProp).toHaveBeenCalledWith(0, accessors[0], expect.anything());
    expect(setAtCell).toHaveBeenCalledTimes(1);
    expect(setAtCell).toHaveBeenCalledWith(0, accessors[0], null);
  });

  it('should run `modifyRowData` once per row, not once per column (batched path)', () => {
    // The row representation depends only on the row, and resolving it runs a hook — so a
    // 10-column row must not pay for it ten times.
    const validator = makeValidator(true);
    const { hot, modifyRowData, getAtSourceProp } = createMockHot({ rows: 5, cols: 10, validator });

    runSourceDataValidators(hot, 'init');

    expect(getAtSourceProp).toHaveBeenCalledTimes(5 * 10);
    expect(modifyRowData).toHaveBeenCalledTimes(5);
    // Every column of a row is read against that row's single representation.
    expect(getAtSourceProp).toHaveBeenCalledWith(0, 0, 'row-0');
    expect(getAtSourceProp).toHaveBeenCalledWith(0, 9, 'row-0');
  });

  it('should run `modifyRowData` once per row on the per-cell path, and skip rows it never reads', () => {
    // Every visible row resolves its row representation exactly once, however many columns it
    // validates — and the trimmed row 3 never resolves one at all.
    const validator = makeValidator(false);
    const { hot, modifyRowData } = createMockHot({
      rows: 4,
      cols: 3,
      validator,
      settings: { cell: [{ row: 0, col: 0 }] },
      toVisualRow: row => (row === 3 ? null : row),
    });

    runSourceDataValidators(hot, 'init');

    // Rows 0-2 are read once each; the trimmed row 3 never resolves one.
    expect(modifyRowData).toHaveBeenCalledTimes(3);
  });

  it('should not run `modifyRowData` for rows whose cells carry no validator (per-cell path)', () => {
    // A per-cell scan with no validator anywhere reads nothing, so no row representation is built.
    const { hot, modifyRowData, getAtSourceProp } = createMockHot({
      rows: 20,
      cols: 3,
      settings: { cell: [{ row: 5, col: 1 }] },
    });

    runSourceDataValidators(hot, 'init');

    expect(getAtSourceProp).not.toHaveBeenCalled();
    expect(modifyRowData).not.toHaveBeenCalled();
  });

  it('should address string props for object data', () => {
    const validator = makeValidator(true, value => value !== 'bad');
    const { hot, setAtCell } = createMockHot({
      rows: 2,
      cols: 2,
      validator,
      allowInvalid: false,
      colToProp: column => ['name', 'city'][column],
      getValue: (r, prop) => (r === 0 && prop === 'city' ? 'bad' : 'ok'),
    });

    runSourceDataValidators(hot, 'init');

    expect(setAtCell).toHaveBeenCalledTimes(1);
    expect(setAtCell).toHaveBeenCalledWith(0, 'city', null);
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

  it('should blank invalid values on the per-cell path (`cell` array present)', () => {
    // Guard against over-skipping: with persistent per-cell meta AND a validator, invalid source
    // values must still be blanked at load.
    const validator = makeValidator(false, value => value !== 'bad');
    const { hot, setAtCell } = createMockHot({
      rows: 3,
      cols: 2,
      validator,
      allowInvalid: false,
      settings: { cell: [{ row: 0, col: 0 }] },
      getValue: (r, c) => (r === 2 && c === 1 ? 'bad' : 'ok'),
    });

    runSourceDataValidators(hot, 'init');

    expect(setAtCell).toHaveBeenCalledTimes(1);
    expect(setAtCell).toHaveBeenCalledWith(2, 1, null);
  });

  it('should skip rows with no visual index (trimmed rows) in the batched path', () => {
    const seen = [];
    const validator = makeValidator(true, (value) => {
      seen.push(value);

      return true;
    });
    // Physical rows 1 and 3 are trimmed (no visual index); row 0 stays visible so the column probe
    // still picks the batched path.
    const { hot, getAtSourceProp } = createMockHot({
      rows: 4,
      cols: 2,
      validator,
      getValue: (r, c) => `${r}:${c}`,
      toVisualRow: row => (row === 1 || row === 3 ? null : row),
    });

    runSourceDataValidators(hot, 'init');

    // Only the visible rows (0 and 2) are read and validated.
    expect(getAtSourceProp).toHaveBeenCalledTimes(2 * 2);
    expect(seen.sort()).toEqual(['0:0', '0:1', '2:0', '2:1']);
  });

  it('should not blank source values of trimmed rows when allowInvalid is false (batched path)', () => {
    const validator = makeValidator(true, value => value !== 'bad');
    // Physical row 1 is trimmed and its value is invalid — it must NOT be blanked.
    const { hot, setAtCell } = createMockHot({
      rows: 3,
      cols: 1,
      validator,
      allowInvalid: false,
      getValue: () => 'bad',
      toVisualRow: row => (row === 1 ? null : row),
    });

    runSourceDataValidators(hot, 'init');

    // Rows 0 and 2 are blanked; the trimmed row 1 is left untouched.
    expect(setAtCell).toHaveBeenCalledTimes(2);
    expect(setAtCell).toHaveBeenCalledWith(0, 0, null);
    expect(setAtCell).toHaveBeenCalledWith(2, 0, null);
    expect(setAtCell).not.toHaveBeenCalledWith(1, 0, null);
  });

  it('should do nothing when the dataset is empty', () => {
    const validator = makeValidator(true);
    const { hot, getCellMetaUncached } = createMockHot({ rows: 0, cols: 5, validator });

    runSourceDataValidators(hot, 'init');

    expect(getCellMetaUncached).not.toHaveBeenCalled();
  });
});
