import Handsontable from 'handsontable';

/**
 * A change can name a row that does not exist yet. `applyChanges()` creates it only after the
 * validation settles, so the result has to be stored under the physical index the row will take,
 * not under its visual one (DEV-155).
 */
describe('Core validation of rows created by a change', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = null;
  });

  afterEach(() => {
    hot?.destroy();
    container.remove();
  });

  /**
   * Creates a one-column grid whose validator rejects every value but `ok`.
   *
   * @param {object} settings Extra grid settings.
   * @returns {Handsontable}
   */
  function createGrid(settings) {
    hot = new Handsontable(container, {
      data: [['ok'], ['ok'], ['ok'], ['ok'], ['ok']],
      columns: [{ validator: (value, callback) => callback(value === 'ok') }],
      allowInsertRow: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot;
  }

  /**
   * Flushes the microtasks that defer the validation and the row creation behind it.
   */
  async function settle() {
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }
  }

  it('should mark every created row invalid when some rows are trimmed', async() => {
    createGrid({ trimRows: [1, 3] });

    hot.populateFromArray(2, 0, [['bad1'], ['bad2'], ['bad3'], ['bad4']]);
    await settle();

    expect(hot.countRows()).toBe(6);

    for (let row = 2; row < 6; row++) {
      expect(hot.getCellMeta(row, 0).valid).toBe(false);
    }
  });

  it('should not leave a validation result on the records the paste did not touch', async() => {
    createGrid({ trimRows: [1, 3] });

    hot.populateFromArray(2, 0, [['bad1'], ['bad2'], ['bad3'], ['bad4']]);
    await settle();

    hot.getPlugin('trimRows').untrimAll();

    // Source records: 0 and 2 were never written, 1 and 3 were trimmed, 4 holds `bad1`, 5 to 7 the created rows.
    const validFlags = hot.getSourceData()
      .map((_, physicalRow) => hot.getCellMeta(hot.toVisualRow(physicalRow), 0).valid);

    expect(validFlags).toEqual([undefined, undefined, undefined, undefined, false, false, false, false]);
  });

  it('should mark the rows created in the gap below a single change far past the end', async() => {
    createGrid({ trimRows: [1, 3] });

    hot.setDataAtCell(6, 0, 'bad');
    await settle();

    expect(hot.countRows()).toBe(7);
    expect(hot.getCellMeta(6, 0).valid).toBe(false);
    expect(hot.getDataAtCell(6, 0)).toBe('bad');
  });

  it('should mark the created rows when the validator is asynchronous', async() => {
    let release;
    const gate = new Promise((resolve) => { release = resolve; });

    createGrid({
      trimRows: [1, 3],
      columns: [{ validator: (value, callback) => { gate.then(() => callback(value === 'ok')); } }],
    });

    hot.populateFromArray(2, 0, [['bad1'], ['bad2'], ['bad3'], ['bad4']]);
    expect(hot.countRows()).toBe(3);

    release();
    await settle();

    expect(hot.countRows()).toBe(6);

    for (let row = 2; row < 6; row++) {
      expect(hot.getCellMeta(row, 0).valid).toBe(false);
    }
  });

  it('should not leave a validation result for a row that was never created', async() => {
    createGrid({ trimRows: [1, 3], maxRows: 6 });

    hot.populateFromArray(2, 0, [['bad1'], ['bad2'], ['bad3'], ['bad4']]);
    await settle();

    // `maxRows` lets the grid grow by one row only, so the results for the other pasted rows belong
    // to rows that do not exist.
    expect(hot.countSourceRows()).toBe(6);

    hot.updateSettings({ maxRows: 10, minSpareRows: 2 });
    await settle();

    const lastRow = hot.countRows() - 1;

    expect(hot.getDataAtCell(lastRow, 0)).toBeNull();
    expect(hot.getCellMeta(lastRow, 0).valid).toBeUndefined();
    expect(hot.getCellMeta(lastRow - 1, 0).valid).toBeUndefined();
  });

  it('should paste into the created rows when `cells()` marks the trimmed records read-only', async() => {
    createGrid({
      trimRows: [1, 3],
      cells(physicalRow) {
        // `cells()` receives the physical row, and the trimmed records are physical rows 1 and 3.
        return physicalRow === 1 || physicalRow === 3 ? { readOnly: true } : {};
      },
    });

    hot.populateFromArray(2, 0, [['bad1'], ['bad2'], ['bad3'], ['bad4']]);
    await settle();

    expect(hot.getDataAtCol(0)).toEqual(['ok', 'ok', 'bad1', 'bad2', 'bad3', 'bad4']);
  });

  it('should keep reading a row index past the last visual row as the physical index of a trimmed record', () => {
    // The public meta methods leave the fallback alone: a plugin names a trimmed record by its
    // physical index this way (ColumnSummary), so only a write resolves a pending row.
    createGrid({ trimRows: [1, 3] });

    hot.setCellMeta(3, 0, 'className', 'trimmed-record');

    expect(hot.getCellMeta(3, 0).className).toBe('trimmed-record');

    hot.getPlugin('trimRows').untrimAll();

    expect(hot.getCellMeta(3, 0).className).toBe('trimmed-record');
    expect(hot.getCellMeta(4, 0).className).toBeUndefined();
  });

  it('should keep marking the created rows when no row is trimmed', async() => {
    createGrid();

    hot.populateFromArray(2, 0, [['bad1'], ['bad2'], ['bad3'], ['bad4']]);
    await settle();

    for (let row = 2; row < 6; row++) {
      expect(hot.getCellMeta(row, 0).valid).toBe(false);
    }
  });
});
