import Handsontable from '../../../index';

describe('CustomBorders config applied in the same updateSettings() call as a row or column order change', () => {
  const border = row => ({ row, col: 0, top: { width: 2, color: '#FF0000' } });
  const movedRows = [5, 6, 7, 0, 1, 2, 3, 4, 8, 9];
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
    return Array.from({ length: 10 }, (_, row) => [row, `r${row}c1`, `r${row}c2`]);
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
   * Finds the columns that carry `borders` meta in visual row 1.
   *
   * @param {Handsontable} instance The grid.
   * @returns {number[]} The physical columns of the bordered cells.
   */
  function borderedPhysicalColumns(instance) {
    const bordered = [];

    for (let physicalCol = 0; physicalCol < instance.countSourceCols(); physicalCol++) {
      const visualCol = instance.toVisualColumn(physicalCol);

      if (visualCol !== null && instance.getCellMeta(1, visualCol).borders) {
        bordered.push(physicalCol);
      }
    }

    return bordered;
  }

  /**
   * @param {Handsontable} instance The grid.
   * @returns {number[][]} The visual coordinates the model reports.
   */
  function modelCells(instance) {
    return instance.getPlugin('customBorders').getBorders().map(({ row, col }) => [row, col]);
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
    expect(modelCells(hot)).toEqual(modelCells(oracle));
    expect(renderedBorderRows(oracle).length).toBeGreaterThan(0);
    expect(renderedBorderRows(hot)).toEqual(renderedBorderRows(oracle));

    hot.getPlugin('trimRows').trimRow(1);
    oracle.getPlugin('trimRows').trimRow(1);

    expect(modelCells(hot)).toEqual(modelCells(oracle));
    expect(borderedRecords(hot)).toEqual(borderedRecords(oracle));
  }

  it('should enable after every plugin that rewrites a row or column index map', () => {
    const { plugins } = Handsontable;
    const priority = plugins.CustomBorders.PLUGIN_PRIORITY;

    [
      'ManualColumnMove',
      'ManualRowMove',
      'MultiColumnSorting',
      'Filters',
      'NestedRows',
      'TrimRows',
    ].forEach((name) => {
      expect({ [name]: priority > plugins[name].PLUGIN_PRIORITY }).toEqual({ [name]: true });
    });
  });

  describe('with trimRows', () => {
    it('should store the borders on the post-trim records when the plugin was off', () => {
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

    it('should store the borders on the post-trim records when trimRows is turned off in the same call', () => {
      hot = createGrid(container, { trimRows: [0], customBorders: true });
      createOracle({ trimRows: true, customBorders: [border(8)] });

      hot.updateSettings({ customBorders: [border(8)], trimRows: false });

      expect(borderedRecords(hot)).toEqual([8]);
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
  });

  describe('with manualRowMove', () => {
    it('should store the borders on the post-move records when the plugin was off', () => {
      hot = createGrid(container, { trimRows: true });
      createOracle({ trimRows: true, manualRowMove: movedRows, customBorders: [border(2)] });

      hot.updateSettings({ customBorders: [border(2)], manualRowMove: movedRows });

      expect(borderedRecords(hot)).toEqual([7]);
      expectToMatchOracle();
    });

    it('should store the borders on the post-move records when the config changes while the plugin is on', () => {
      hot = createGrid(container, { trimRows: true, customBorders: [border(4)] });
      createOracle({ trimRows: true, manualRowMove: movedRows, customBorders: [border(2)] });

      hot.updateSettings({ customBorders: [border(2)], manualRowMove: movedRows });

      expect(borderedRecords(hot)).toEqual([7]);
      expectToMatchOracle();
    });

    it('should store the borders on the post-move records when the config is applied progressively', async() => {
      hot = createGrid(container, { trimRows: true, customBordersProgressive: true });
      createOracle({ trimRows: true, manualRowMove: movedRows, customBorders: [border(2)] });

      const done = new Promise((resolve) => {
        hot.addHookOnce('afterCustomBordersUpdate', resolve);
      });

      hot.updateSettings({ customBorders: [border(2)], manualRowMove: movedRows });
      await done;

      expect(borderedRecords(hot)).toEqual([7]);
      expectToMatchOracle();
    });
  });

  describe('with manualColumnMove', () => {
    it('should store the borders on the post-move columns', () => {
      const config = [{ row: 1, col: 0, top: { width: 2, color: '#FF0000' } }];

      hot = createGrid(container, {});
      createOracle({ manualColumnMove: [2, 0, 1], customBorders: config });

      hot.updateSettings({ customBorders: config, manualColumnMove: [2, 0, 1] });

      expect(borderedPhysicalColumns(hot)).toEqual([2]);
      expect(borderedPhysicalColumns(hot)).toEqual(borderedPhysicalColumns(oracle));
    });
  });

  describe('with multiColumnSorting', () => {
    it('should store the borders on the post-sort records', () => {
      hot = createGrid(container, { multiColumnSorting: true, trimRows: true });

      hot.updateSettings({
        customBorders: [border(2)],
        multiColumnSorting: { initialConfig: [{ column: 0, sortOrder: 'desc' }] },
      });

      // Sorted in descending order, visual row 2 shows record 7.
      expect(hot.getDataAtCell(2, 0)).toBe(7);
      expect(borderedRecords(hot)).toEqual([7]);
    });
  });

  describe('with filters', () => {
    it('should store the borders on the records visible after the plugin re-enables and drops the filter', () => {
      hot = createGrid(container, { filters: true, trimRows: true });
      hot.getPlugin('filters').addCondition(0, 'gt', [1]);
      hot.getPlugin('filters').filter();
      createOracle({ filters: true, trimRows: true, customBorders: [border(2)] });

      hot.updateSettings({ filters: true, customBorders: [border(2)] });

      expect(borderedRecords(hot)).toEqual(borderedRecords(oracle));
      expect(hot.getDataAtCell(2, 0)).toBe(oracle.getDataAtCell(2, 0));
    });
  });

  describe('with an afterUpdateSettings listener of the application', () => {
    it('should apply the config when the listener returns a value', () => {
      hot = createGrid(container, { trimRows: true });

      let calls = 0;

      hot.addHook('afterUpdateSettings', () => {
        calls += 1;

        return calls;
      });
      hot.updateSettings({ customBorders: [border(8)], trimRows: [0] });

      expect(calls).toBe(1);
      expect(borderedRecords(hot)).toEqual([9]);
    });

    it('should keep the borders the listener sets with setBorders()', () => {
      hot = createGrid(container, { trimRows: true, customBorders: true });
      hot.addHook('afterUpdateSettings', () => {
        hot.getPlugin('customBorders').setBorders([[0, 1, 0, 1]], { top: { width: 2, color: '#00FF00' } });
      });

      hot.updateSettings({ customBorders: [border(8)], trimRows: [0] });

      expect(modelCells(hot)).toEqual(expect.arrayContaining([[8, 0], [0, 1]]));
    });

    it('should apply the config when the listener throws', () => {
      hot = createGrid(container, { trimRows: true, customBorders: [border(2)] });

      const failingListener = () => {
        throw new Error('listener failed');
      };

      hot.addHook('afterUpdateSettings', failingListener);

      expect(() => hot.updateSettings({ customBorders: [border(5)], trimRows: [0] })).toThrow('listener failed');

      hot.removeHook('afterUpdateSettings', failingListener);

      expect(borderedRecords(hot)).toEqual([6]);
    });
  });

  it('should apply the config once when the call carries trimRows', () => {
    hot = createGrid(container, { trimRows: true, customBorders: true });

    const spy = jest.spyOn(hot.getPlugin('customBorders'), 'changeBorderSettings');

    hot.updateSettings({ customBorders: [border(5)], trimRows: [0] });

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
