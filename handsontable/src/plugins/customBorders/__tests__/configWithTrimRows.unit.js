import Handsontable from '../../../index';

describe('CustomBorders config applied in the same updateSettings() call as trimRows', () => {
  const border = row => ({ row, col: 0, top: { width: 2, color: '#FF0000' } });
  let container;
  let oracleContainer;
  let hot;
  let oracle;

  beforeEach(() => {
    container = document.createElement('div');
    oracleContainer = document.createElement('div');
    document.body.appendChild(container);
    document.body.appendChild(oracleContainer);
  });

  afterEach(() => {
    hot?.destroy();
    oracle?.destroy();
    hot = null;
    oracle = null;
    container.remove();
    oracleContainer.remove();
  });

  /**
   * Rows holding their own index in column 0.
   *
   * @returns {Array[]}
   */
  function rows() {
    return Array.from({ length: 10 }, (_, row) => [row, `r${row}c1`]);
  }

  /**
   * @param {HTMLElement} element The grid container.
   * @param {object} settings The grid settings.
   * @returns {Handsontable}
   */
  function createGrid(element, settings) {
    return new Handsontable(element, {
      data: rows(),
      width: 400,
      height: 400,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });
  }

  /**
   * Finds the records that carry `borders` meta.
   *
   * @param {Handsontable} instance The grid.
   * @returns {number[]} The values of column 0 (the record ids) of the bordered records.
   */
  function borderedRecords(instance) {
    const bordered = [];

    for (let physicalRow = 0; physicalRow < instance.countSourceRows(); physicalRow++) {
      const visualRow = instance.toVisualRow(physicalRow);

      if (visualRow !== null && instance.getCellMeta(visualRow, 0).borders) {
        bordered.push(instance.getSourceDataAtCell(physicalRow, 0));
      }
    }

    return bordered;
  }

  /**
   * @param {Handsontable} instance The grid.
   * @returns {number[]} The visual rows the model reports.
   */
  function modelRows(instance) {
    return instance.getPlugin('customBorders').getBorders().map(({ row }) => row);
  }

  /**
   * @param {Handsontable} instance The grid.
   * @returns {number[]} The rows of the rendered custom border selections.
   */
  function renderedBorderRows(instance) {
    return instance.selection.highlight.customSelections
      .map(selection => selection.cellRange?.from.row)
      .filter(row => row !== undefined);
  }

  /**
   * Builds the oracle: the same final settings passed at init.
   *
   * @param {object} settings The final settings.
   */
  function createOracle(settings) {
    oracle = createGrid(oracleContainer, settings);
  }

  /**
   * Expects the updated grid to match the oracle, before and after a rebuild from the cell meta.
   */
  function expectToMatchOracle() {
    expect(borderedRecords(hot)).toEqual(borderedRecords(oracle));
    expect(modelRows(hot)).toEqual(modelRows(oracle));
    expect(renderedBorderRows(oracle).length).toBeGreaterThan(0);
    expect(renderedBorderRows(hot)).toEqual(renderedBorderRows(oracle));

    hot.getPlugin('trimRows').trimRow(1);
    oracle.getPlugin('trimRows').trimRow(1);

    expect(modelRows(hot)).toEqual(modelRows(oracle));
    expect(borderedRecords(hot)).toEqual(borderedRecords(oracle));
  }

  it('should store the borders on the post-trim records when the plugin was off and trimRows is an array', () => {
    hot = createGrid(container, { trimRows: true });
    createOracle({ trimRows: [0], customBorders: [border(8)] });

    hot.updateSettings({ customBorders: [border(8)], trimRows: [0] });

    expect(borderedRecords(hot)).toEqual([9]);
    expectToMatchOracle();
  });

  it('should store the borders on the post-trim records when the trim moves to another row', () => {
    hot = createGrid(container, { trimRows: [9] });
    createOracle({ trimRows: [0], customBorders: [border(8)] });

    hot.updateSettings({ customBorders: [border(8)], trimRows: [0] });

    expect(borderedRecords(hot)).toEqual([9]);
    expectToMatchOracle();
  });

  it('should store the borders on the post-trim records when the trim is cleared in the same call', () => {
    hot = createGrid(container, { trimRows: [0] });
    createOracle({ trimRows: [], customBorders: [border(8)] });

    hot.updateSettings({ customBorders: [border(8)], trimRows: [] });

    expect(borderedRecords(hot)).toEqual([8]);
    expectToMatchOracle();
  });

  it('should store the borders on the post-trim records when the config changes while the plugin is on', () => {
    hot = createGrid(container, { trimRows: true, customBorders: [border(2)] });
    createOracle({ trimRows: [0], customBorders: [border(5)] });

    hot.updateSettings({ customBorders: [border(5)], trimRows: [0] });

    expect(borderedRecords(hot)).toEqual([6]);
    expectToMatchOracle();
  });

  it('should store the borders on the post-trim records when the plugin was switched off and on before', () => {
    hot = createGrid(container, { trimRows: true, customBorders: [border(2)] });
    hot.updateSettings({ customBorders: false });
    hot.updateSettings({ customBorders: true });
    createOracle({ trimRows: [0], customBorders: [border(5)] });

    hot.updateSettings({ customBorders: [border(5)], trimRows: [0] });

    expect(borderedRecords(hot)).toEqual([6]);
    expectToMatchOracle();
  });

  it('should store the borders on the post-trim records when the call runs inside hot.batch()', () => {
    hot = createGrid(container, { trimRows: true });
    createOracle({ trimRows: [0], customBorders: [border(8)] });

    hot.batch(() => {
      hot.updateSettings({ customBorders: [border(8)], trimRows: [0] });
    });

    expect(borderedRecords(hot)).toEqual([9]);
    expectToMatchOracle();
  });

  it('should store the borders on the post-trim records while the row index mapper is suspended', () => {
    hot = createGrid(container, { trimRows: true });
    createOracle({ trimRows: [0], customBorders: [border(8)] });

    hot.rowIndexMapper.suspendOperations();
    hot.updateSettings({ customBorders: [border(8)], trimRows: [0] });
    hot.rowIndexMapper.resumeOperations();

    expect(borderedRecords(hot)).toEqual([9]);
    expectToMatchOracle();
  });

  describe('with manualRowMove in the same call', () => {
    const moved = [5, 6, 7, 0, 1, 2, 3, 4, 8, 9];

    it('should store the borders on the post-move records when the plugin was off', () => {
      hot = createGrid(container, { trimRows: true });
      createOracle({ trimRows: true, manualRowMove: moved, customBorders: [border(2)] });

      hot.updateSettings({ customBorders: [border(2)], manualRowMove: moved });

      expect(borderedRecords(hot)).toEqual([7]);
      expectToMatchOracle();
    });

    it('should store the borders on the post-move records when the config changes while the plugin is on', () => {
      hot = createGrid(container, { trimRows: true, customBorders: [border(4)] });
      createOracle({ trimRows: true, manualRowMove: moved, customBorders: [border(2)] });

      hot.updateSettings({ customBorders: [border(2)], manualRowMove: moved });

      expect(borderedRecords(hot)).toEqual([7]);
      expectToMatchOracle();
    });

    it('should apply the config once', () => {
      hot = createGrid(container, { customBorders: true });

      const spy = jest.spyOn(hot.getPlugin('customBorders'), 'changeBorderSettings');

      hot.updateSettings({ customBorders: [border(2)], manualRowMove: moved });

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it('should apply the config once when trimRows is part of the call', () => {
    hot = createGrid(container, { trimRows: true, customBorders: true });

    const spy = jest.spyOn(hot.getPlugin('customBorders'), 'changeBorderSettings');

    hot.updateSettings({ customBorders: [border(5)], trimRows: [0] });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should apply the config once when trimRows is not part of the call', () => {
    hot = createGrid(container, { trimRows: [0], customBorders: true });

    const spy = jest.spyOn(hot.getPlugin('customBorders'), 'changeBorderSettings');

    hot.updateSettings({ customBorders: [border(5)] });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(borderedRecords(hot)).toEqual([6]);
  });

  it('should store the borders on the post-trim records when the config is applied progressively', async() => {
    hot = createGrid(container, { trimRows: true, customBordersProgressive: true });
    createOracle({ trimRows: [0], customBorders: [border(8)] });

    const done = new Promise((resolve) => {
      hot.addHookOnce('afterCustomBordersUpdate', resolve);
    });

    hot.updateSettings({ customBorders: [border(8)], trimRows: [0] });
    await done;

    expectToMatchOracle();
  });

  it('should apply the config of the outer call when a listener makes a nested updateSettings()', () => {
    hot = createGrid(container, { trimRows: true });
    createOracle({ trimRows: [0], customBorders: [border(8)] });

    let nested = false;

    hot.addHook('afterUpdateSettings', () => {
      if (!nested) {
        nested = true;
        hot.updateSettings({ colHeaders: true });
      }
    });

    hot.updateSettings({ customBorders: [border(8)], trimRows: [0] });

    expectToMatchOracle();
  });

  it('should not apply a stale config in a later call when a listener threw before the last one ran', () => {
    hot = createGrid(container, { trimRows: true, customBorders: [border(2)] });

    const failingListener = () => {
      throw new Error('listener failed');
    };

    hot.addHook('afterUpdateSettings', failingListener);

    expect(() => hot.updateSettings({ customBorders: [border(5)], trimRows: [0] })).toThrow('listener failed');

    hot.removeHook('afterUpdateSettings', failingListener);
    hot.getPlugin('customBorders').setBorders([[0, 0, 0, 0]], { top: { width: 2, color: '#00FF00' } });

    const bordered = borderedRecords(hot);

    hot.updateSettings({ colHeaders: true });

    expect(borderedRecords(hot)).toEqual(bordered);
  });

  it('should not throw on a later updateSettings() once the plugin was destroyed on its own', () => {
    hot = createGrid(container, { trimRows: true, customBorders: true });

    hot.getPlugin('customBorders').destroy();

    expect(() => hot.updateSettings({ customBorders: [border(5)], trimRows: [0] })).not.toThrow();
    expect(() => hot.getPlugin('customBorders')?.destroy()).not.toThrow();
  });
});
