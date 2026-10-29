import Handsontable from '../../../index';

describe('CustomBorders and updateSettings({ trimRows })', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
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
   * Waits for the microtasks the plugin registers to run.
   */
  async function flushMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
  }

  /**
   * @returns {number[]} The rows of the rendered custom border selections.
   */
  function renderedBorderRows() {
    return hot.selection.highlight.customSelections
      .map(selection => selection.cellRange?.from.row)
      .filter(row => row !== undefined);
  }

  /**
   * Creates a grid with a border on the record that holds `physicalRow` in column 0.
   *
   * @param {boolean|number[]} trimRows The initial `trimRows` option.
   * @param {number} [physicalRow=8] The physical row of the bordered record.
   */
  function createGridWithBorder(trimRows, physicalRow = 8) {
    hot = new Handsontable(container, {
      data: rows(),
      trimRows,
      customBorders: true,
      width: 400,
      height: 400,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const visualRow = hot.toVisualRow(physicalRow);

    hot.getPlugin('customBorders')
      .setBorders([[visualRow, 0, visualRow, 0]], { top: { width: 2, color: '#FF0000' } });
  }

  describe('when the trimmed rows change', () => {
    it('should move the border with its record while the trimmed rows change', async() => {
      createGridWithBorder(true);

      const borders = hot.getPlugin('customBorders');

      expect(renderedBorderRows()).toEqual([8]);

      hot.updateSettings({ trimRows: [0] });
      await flushMicrotasks();

      expect(borders.getBorders().map(({ row }) => row)).toEqual([7]);
      expect(renderedBorderRows()).toEqual([7]);

      hot.updateSettings({ trimRows: [0, 1] });
      await flushMicrotasks();

      expect(borders.getBorders().map(({ row }) => row)).toEqual([6]);
      expect(renderedBorderRows()).toEqual([6]);

      hot.updateSettings({ trimRows: [1] });
      await flushMicrotasks();

      expect(borders.getBorders().map(({ row }) => row)).toEqual([7]);
      expect(renderedBorderRows()).toEqual([7]);
    });

    it('should move the border back when trimRows is switched off', async() => {
      createGridWithBorder([0]);

      const borders = hot.getPlugin('customBorders');

      expect(renderedBorderRows()).toEqual([7]);

      hot.updateSettings({ trimRows: false });
      await flushMicrotasks();

      expect(borders.getBorders().map(({ row }) => row)).toEqual([8]);
      expect(renderedBorderRows()).toEqual([8]);
    });

    it('should move the border when trimRows is switched on', async() => {
      createGridWithBorder(false);

      const borders = hot.getPlugin('customBorders');

      hot.updateSettings({ trimRows: [0] });
      await flushMicrotasks();

      expect(borders.getBorders().map(({ row }) => row)).toEqual([7]);
      expect(renderedBorderRows()).toEqual([7]);
    });

    it('should move the border when the trim changes to as many other rows', async() => {
      createGridWithBorder([2], 3);

      const borders = hot.getPlugin('customBorders');

      expect(renderedBorderRows()).toEqual([2]);

      hot.updateSettings({ trimRows: [5] });
      await flushMicrotasks();

      expect(borders.getBorders().map(({ row }) => row)).toEqual([3]);
      expect(renderedBorderRows()).toEqual([3]);
    });

    it('should bring back a border on a row that was trimmed and is visible again at the end', async() => {
      createGridWithBorder(true, 9);

      const borders = hot.getPlugin('customBorders');

      expect(renderedBorderRows()).toEqual([9]);

      hot.updateSettings({ trimRows: [9] });
      await flushMicrotasks();

      expect(borders.getBorders()).toEqual([]);
      expect(renderedBorderRows()).toEqual([]);

      hot.updateSettings({ trimRows: false });
      await flushMicrotasks();

      expect(borders.getBorders().map(({ row }) => row)).toEqual([9]);
      expect(renderedBorderRows()).toEqual([9]);
    });

    it('should move the border when another updateSettings runs inside the trim update', async() => {
      createGridWithBorder(true);

      const borders = hot.getPlugin('customBorders');

      // Registered after the plugin's own -1 listener, so the plugin snapshots the rows before this one runs.
      hot.addHook('afterUpdateSettings', (settings) => {
        if (settings.trimRows) {
          hot.updateSettings({ colHeaders: true });
        }
      }, -1);

      hot.updateSettings({ trimRows: [0] });
      await flushMicrotasks();

      expect(borders.getBorders().map(({ row }) => row)).toEqual([7]);
      expect(renderedBorderRows()).toEqual([7]);
    });

    it('should rebuild the border model once for the update', async() => {
      createGridWithBorder(true);

      const walkSpy = jest.spyOn(hot._getMetaManager(), 'getUserDefinedCellMetas');

      hot.updateSettings({ trimRows: [0] });
      await flushMicrotasks();

      expect(walkSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the index operations are suspended', () => {
    it.each([
      ['hot.batch()', callback => hot.batch(callback)],
      ['hot.batchExecution()', callback => hot.batchExecution(callback)],
      ['hot.suspendExecution() and hot.resumeExecution()', (callback) => {
        hot.suspendExecution();
        callback();
        hot.resumeExecution();
      }],
    ])('should move the border back when %s wraps the switch-off of trimRows', async(_, run) => {
      createGridWithBorder([0]);

      const borders = hot.getPlugin('customBorders');

      expect(renderedBorderRows()).toEqual([7]);

      run(() => hot.updateSettings({ trimRows: false }));
      await flushMicrotasks();

      expect(hot.getDataAtCell(8, 0)).toBe(8);
      expect(borders.getBorders().map(({ row }) => row)).toEqual([8]);
      expect(renderedBorderRows()).toEqual([8]);
    });

    it('should move the border when hot.batch() wraps a change of the trimmed rows', async() => {
      createGridWithBorder([0]);

      const borders = hot.getPlugin('customBorders');

      hot.batch(() => hot.updateSettings({ trimRows: [0, 1] }));
      await flushMicrotasks();

      expect(borders.getBorders().map(({ row }) => row)).toEqual([6]);
      expect(renderedBorderRows()).toEqual([6]);
    });
  });

  describe('when customBorders and trimRows are in the same update', () => {
    const borderSettings = [{ row: 7, col: 0, top: { width: 2, color: '#FF0000' } }];

    it('should rebuild the border model once when the trimmed rows stay the same', async() => {
      hot = new Handsontable(container, {
        data: rows(),
        trimRows: [0],
        customBorders: borderSettings,
        width: 400,
        height: 400,
        licenseKey: 'non-commercial-and-evaluation',
      });

      // Re-enabling puts the plugin's listeners last in the hook list: a listener the plugin re-registers
      // mid-pass then runs in that same pass.
      hot.updateSettings({ customBorders: false });
      hot.updateSettings({ customBorders: borderSettings });

      const walkSpy = jest.spyOn(hot._getMetaManager(), 'getUserDefinedCellMetas');

      hot.updateSettings({ customBorders: borderSettings, trimRows: [0] });
      await flushMicrotasks();

      expect(walkSpy).toHaveBeenCalledTimes(1);
      expect(hot.getPlugin('customBorders').getBorders().map(({ row }) => row)).toEqual([7]);
      expect(renderedBorderRows()).toEqual([7]);
    });
  });

  describe('when the trimmed rows stay the same', () => {
    it.each([
      ['an untouched trimRows: true', true, true],
      ['a trimRows: false that stays off', false, false],
      ['the same list in a new array', [0, 3], [0, 3]],
      ['the same list in another order', [0, 3], [3, 0]],
    ])('should not rebuild the borders for %s', async(_, initialTrimRows, nextTrimRows) => {
      createGridWithBorder(initialTrimRows);

      const borders = hot.getPlugin('customBorders');
      const walkSpy = jest.spyOn(hot._getMetaManager(), 'getUserDefinedCellMetas');
      const selectionsBefore = [...hot.selection.highlight.customSelections];
      const rowsBefore = renderedBorderRows();

      expect(selectionsBefore.length).toBe(1);

      hot.updateSettings({ trimRows: nextTrimRows });
      await flushMicrotasks();

      expect(walkSpy).not.toHaveBeenCalled();
      expect(hot.selection.highlight.customSelections.length).toBe(selectionsBefore.length);
      hot.selection.highlight.customSelections.forEach((selection, index) => {
        expect(selection).toBe(selectionsBefore[index]);
      });
      expect(renderedBorderRows()).toEqual(rowsBefore);
      expect(borders.getBorders().map(({ row }) => row)).toEqual(rowsBefore);
    });

    it('should not rebuild the borders for a settings update without trimRows', async() => {
      createGridWithBorder([0]);

      const walkSpy = jest.spyOn(hot._getMetaManager(), 'getUserDefinedCellMetas');

      hot.updateSettings({ colHeaders: true });
      await flushMicrotasks();

      expect(walkSpy).not.toHaveBeenCalled();
    });

    it('should still rebuild once a later update changes the trimmed rows', async() => {
      createGridWithBorder([0]);

      const borders = hot.getPlugin('customBorders');

      hot.updateSettings({ trimRows: [0] });
      hot.updateSettings({ trimRows: [0, 1] });
      await flushMicrotasks();

      expect(borders.getBorders().map(({ row }) => row)).toEqual([6]);
      expect(renderedBorderRows()).toEqual([6]);
    });
  });
});
