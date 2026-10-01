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

  it('should keep marking the created rows when no row is trimmed', async() => {
    createGrid();

    hot.populateFromArray(2, 0, [['bad1'], ['bad2'], ['bad3'], ['bad4']]);
    await settle();

    for (let row = 2; row < 6; row++) {
      expect(hot.getCellMeta(row, 0).valid).toBe(false);
    }
  });
});
