describe('HiddenColumns', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('navigation', () => {
    it('should not throw an error when all columns are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1, 2, 3, 4],
        },
      });

      await listen();
      await selectAll();

      /* eslint-disable handsontable/require-await */
      expect(() => keyDownUp('home')).not.toThrow();
      expect(() => keyDownUp(['control/meta', 'home'])).not.toThrow();
      expect(() => keyDownUp('end')).not.toThrow();
      expect(() => keyDownUp(['control/meta', 'end'])).not.toThrow();
      expect(() => keyDownUp('arrowtop')).not.toThrow();
      expect(() => keyDownUp('arrowbottom')).not.toThrow();
      expect(() => keyDownUp('arrowright')).not.toThrow();
      expect(() => keyDownUp('arrowleft')).not.toThrow();
      /* eslint-enable handsontable/require-await */
      expect(getSelected()).toEqual([[-1, -1, 4, 4]]);
    });

    it('should go to the closest not hidden cell on the right side while navigating by right arrow', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      await selectCell(0, 0);
      await keyDownUp('arrowright');

      expect(getSelected()).toEqual([[0, 4, 0, 4]]);
      expect(getCell(0, 4)).toHaveClass('current');
      expect(`
      |   : # |
      |   :   |
      |   :   |
      |   :   |
      |   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(4);
    });

    it('should go to the closest not hidden cell on the left side while navigating by left arrow', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      await selectCell(0, 4);
      await keyDownUp('arrowleft');

      expect(getCell(0, 0)).toHaveClass('current');
      expect(`
      | # :   |
      |   :   |
      |   :   |
      |   :   |
      |   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(0);
    });

    it('should go to the first visible cell in the next row while navigating by right arrow if all column on the right side are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        autoWrapRow: true,
        autoWrapCol: true,
        hiddenColumns: {
          columns: [3, 4],
        },
      });

      await selectCell(0, 2);
      await keyDownUp('arrowright');

      expect(getCell(1, 0)).toHaveClass('current');
      expect(`
      |   :   :   |
      | # :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 0, 1, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(1);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(1);
      expect(getSelectedRangeLast().to.col).toBe(0);
    });

    it('should go to the last visible cell in the previous row while navigating by left arrow if all column on the left side are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        autoWrapRow: true,
        autoWrapCol: true,
        hiddenColumns: {
          columns: [0, 1],
        },
      });

      await selectCell(1, 2);
      await keyDownUp('arrowleft');

      expect(getCell(0, 4)).toHaveClass('current');
      expect(`
      |   :   : # |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[0, 4, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(4);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(4);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);
    });

    it('should go to the first cell in the next visible column while navigating by down arrow if column on the right side is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        autoWrapRow: true,
        autoWrapCol: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      await selectCell(4, 0);
      await keyDownUp('arrowdown');

      expect(getCell(0, 4)).toHaveClass('current');
      expect(`
      |   : # |
      |   :   |
      |   :   |
      |   :   |
      |   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[0, 4, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(4);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(4);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);
    });

    it('should go to the last cell in the previous visible column while navigating by up arrow if column on the left side is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        autoWrapRow: true,
        autoWrapCol: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      await selectCell(0, 4);
      await keyDownUp('arrowup');

      expect(getCell(4, 0)).toHaveClass('current');
      expect(`
      |   :   |
      |   :   |
      |   :   |
      |   :   |
      | # :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[4, 0, 4, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(4);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(4);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(0);
    });

    describe('should go to the proper cell while navigating if row header is selected and', () => {
      it('first columns are hidden', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          autoWrapRow: true,
          autoWrapCol: true,
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [0, 1],
          },
        });

        const header = getCell(0, -1);

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowright');

        expect(`
        |   ║   : - :   |
        |===:===:===:===|
        | - ║   : # :   |
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[0, 3, 0, 3]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(3);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(3);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(3);
      });

      it('last columns are hidden', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          autoWrapRow: true,
          autoWrapCol: true,
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [3, 4],
          },
        });

        const header = getCell(0, -1);

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowleft');

        expect(`
        |   ║   :   : - |
        |===:===:===:===|
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        | - ║   :   : # |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[4, 2, 4, 2]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(2);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(2);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(2);
      });

      it('just one column is visible (column at the start is not hidden)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          autoWrapRow: true,
          autoWrapCol: true,
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [1, 2, 3, 4],
          },
        });

        let header = getCell(0, -1); // first visible cell

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowup');

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        |   ║   |
        |   ║   |
        |   ║   |
        | - ║ # |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[4, 0, 4, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(0);

        header = getCell(0, -1); // first visible cell

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowdown');

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        | - ║ # |
        |   ║   |
        |   ║   |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[1, 0, 1, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(1);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(1);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(1);
        expect(getSelectedRangeLast().to.col).toBe(0);

        header = getCell(0, -1); // first visible cell

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowleft');

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        |   ║   |
        |   ║   |
        |   ║   |
        | - ║ # |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[4, 0, 4, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(0);

        header = getCell(0, -1); // first visible cell

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowright');

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        | - ║ # |
        |   ║   |
        |   ║   |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[1, 0, 1, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(1);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(1);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(1);
        expect(getSelectedRangeLast().to.col).toBe(0);

        header = getCell(4, -1); // last visible cell

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowup');

        expect(getSelected()).toEqual([[3, 0, 3, 0]]);
        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        |   ║   |
        |   ║   |
        | - ║ # |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(0);

        header = getCell(4, -1); // last visible cell

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowdown');

        expect(`
        |   ║ - |
        |===:===|
        | - ║ # |
        |   ║   |
        |   ║   |
        |   ║   |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[0, 0, 0, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(0);

        header = getCell(4, -1); // last visible cell

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowleft');

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        |   ║   |
        |   ║   |
        | - ║ # |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[3, 0, 3, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(3);
        expect(getSelectedRangeLast().to.col).toBe(0);

        header = getCell(4, -1); // last visible cell

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowright');

        expect(`
        |   ║ - |
        |===:===|
        | - ║ # |
        |   ║   |
        |   ║   |
        |   ║   |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[0, 0, 0, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(0);
      });

      it('just one column is visible (column at the end is not hidden)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          autoWrapRow: true,
          autoWrapCol: true,
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [0, 1, 2, 3],
          },
        });

        let header = getCell(0, -1); // first visible cell

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowup');

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        |   ║   |
        |   ║   |
        |   ║   |
        | - ║ # |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[4, 4, 4, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(4);

        header = getCell(0, -1); // first visible cell

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowdown');

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        | - ║ # |
        |   ║   |
        |   ║   |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[1, 4, 1, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(1);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(1);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(1);
        expect(getSelectedRangeLast().to.col).toBe(4);

        header = getCell(0, -1); // first visible cell

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowleft');

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        |   ║   |
        |   ║   |
        |   ║   |
        | - ║ # |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[4, 4, 4, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(4);

        header = getCell(0, -1); // first visible cell

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowright');

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        | - ║ # |
        |   ║   |
        |   ║   |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[1, 4, 1, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(1);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(1);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(1);
        expect(getSelectedRangeLast().to.col).toBe(4);

        header = getCell(4, -1); // last visible cell

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowup');

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        |   ║   |
        |   ║   |
        | - ║ # |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[3, 4, 3, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(3);
        expect(getSelectedRangeLast().to.col).toBe(4);

        header = getCell(4, -1); // last visible cell

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowdown');

        expect(`
        |   ║ - |
        |===:===|
        | - ║ # |
        |   ║   |
        |   ║   |
        |   ║   |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[0, 4, 0, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(4);

        header = getCell(4, -1); // last visible cell

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowleft');

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        |   ║   |
        |   ║   |
        | - ║ # |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[3, 4, 3, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(3);
        expect(getSelectedRangeLast().to.col).toBe(4);

        header = getCell(4, -1); // last visible cell

        await simulateClick(header, 'LMB');
        await keyDownUp('arrowright');

        expect(`
        |   ║ - |
        |===:===|
        | - ║ # |
        |   ║   |
        |   ║   |
        |   ║   |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[0, 4, 0, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(4);
      });
    });

    describe('should not change position and call hook when single hidden cell was selected and' +
      'navigating by any arrow key', () => {
      describe('without shift key pressed', () => {
        it('hidden cell at the table start', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [0],
            },
          });

          const hookSpy1 = jasmine.createSpy('beforeModifyTransformStart');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformStart');

          addHook('modifyTransformStart', hookSpy1);
          addHook('afterModifyTransformStart', hookSpy2);

          await selectCell(1, 0);

          await keyDownUp('arrowup');

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp('arrowdown');

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp('arrowleft');

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp('arrowright');

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);
        });

        it('hidden cell in the table middle', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [2],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformStart');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformStart');

          addHook('modifyTransformStart', hookSpy1);
          addHook('afterModifyTransformStart', hookSpy2);

          await selectCell(1, 2);

          await keyDownUp('arrowup');

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp('arrowdown');

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp('arrowleft');

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp('arrowright');

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);
        });

        it('hidden cell at the table end', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [4],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformStart');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformStart');

          addHook('modifyTransformStart', hookSpy1);
          addHook('afterModifyTransformStart', hookSpy2);

          await selectCell(1, 4);

          await keyDownUp('arrowup');

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp('arrowdown');

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp('arrowleft');

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp('arrowright');

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);
        });
      });

      describe('with shift key pressed', () => {
        it('hidden cell at the table start', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [0],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformEnd');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformEnd');

          addHook('modifyTransformEnd', hookSpy1);
          addHook('afterModifyTransformEnd', hookSpy2);

          await selectCell(1, 0);

          await keyDownUp(['shift', 'arrowup']);

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp(['shift', 'arrowdown']);

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp(['shift', 'arrowleft']);

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp(['shift', 'arrowright']);

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);
        });

        it('hidden cell in the table middle', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [2],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformEnd');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformEnd');

          addHook('modifyTransformEnd', hookSpy1);
          addHook('afterModifyTransformEnd', hookSpy2);

          await selectCell(1, 2);

          await keyDownUp(['shift', 'arrowup']);

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp(['shift', 'arrowdown']);

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp(['shift', 'arrowleft']);

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp(['shift', 'arrowright']);

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);
        });

        it('hidden cell at the table end', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [4],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformEnd');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformEnd');

          addHook('modifyTransformEnd', hookSpy1);
          addHook('afterModifyTransformEnd', hookSpy2);

          await selectCell(1, 4);

          await keyDownUp(['shift', 'arrowup']);

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp(['shift', 'arrowdown']);

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp(['shift', 'arrowleft']);

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          await keyDownUp(['shift', 'arrowright']);

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);
        });
      });
    });

    describe('should go to the closest not hidden cell in a row while navigating', () => {
      it('by HOME key (without fixed rows and columns)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          hiddenColumns: {
            columns: [0, 1, 3],
          },
        });

        await selectCell(4, 4);
        await keyDownUp('home');

        expect(`
        |   :   |
        |   :   |
        |   :   |
        |   :   |
        | # :   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[4, 2, 4, 2]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(2);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(2);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(2);
      });

      it('by HOME key (with fixed rows and columns)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          fixedColumnsStart: 2,
          fixedRowsTop: 1,
          fixedRowsBottom: 1,
          hiddenColumns: {
            columns: [1, 2],
          },
        });

        await selectCell(2, 4);
        await keyDownUp('home');

        expect(`
        |   |   :   |
        |---:---:---|
        |   |   :   |
        |   | # :   |
        |   |   :   |
        |---:---:---|
        |   |   :   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[2, 3, 2, 3]]);
        expect(getSelectedRangeLast().highlight.row).toBe(2);
        expect(getSelectedRangeLast().highlight.col).toBe(3);
        expect(getSelectedRangeLast().from.row).toBe(2);
        expect(getSelectedRangeLast().from.col).toBe(3);
        expect(getSelectedRangeLast().to.row).toBe(2);
        expect(getSelectedRangeLast().to.col).toBe(3);
      });

      it('by shift + HOME key', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          hiddenColumns: {
            columns: [0, 1, 3],
          },
        });

        await selectCell(4, 4);
        await keyDownUp(['shift', 'home']);

        expect(`
        |   :   |
        |   :   |
        |   :   |
        |   :   |
        | 0 : A |
        `).toBeMatchToSelectionPattern();

        expect(getSelected()).toEqual([[4, 4, 4, 2]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(2);
      });

      it('by END key', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          hiddenColumns: {
            columns: [1, 3, 4],
          },
        });

        await selectCell(0, 0);
        await keyDownUp('end');

        expect(`
        |   : # |
        |   :   |
        |   :   |
        |   :   |
        |   :   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[0, 2, 0, 2]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(2);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(2);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(2);
      });

      it('by shift + END key', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          hiddenColumns: {
            columns: [1, 3, 4],
          },
        });

        await selectCell(0, 0);
        await keyDownUp(['shift', 'end']);

        expect(`
        | A : 0 |
        |   :   |
        |   :   |
        |   :   |
        |   :   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[0, 0, 0, 2]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(2);
      });
    });

    describe('should go to the closest not hidden cell of the table while navigating', () => {
      it('by ctrl/cmd + HOME key (without fixed rows and columns)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          hiddenColumns: {
            columns: [1, 3],
          },
        });

        await selectCell(4, 4);
        await keyDownUp(['control/meta', 'home']);

        expect(`
        | # :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        `).toBeMatchToSelectionPattern();

        expect(getSelected()).toEqual([[0, 0, 0, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(0);
      });

      it('by ctrl/cmd + HOME key (with fixed rows and columns)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          fixedColumnsStart: 2,
          fixedRowsTop: 1,
          fixedRowsBottom: 1,
          hiddenColumns: {
            columns: [1, 2],
          },
        });

        await selectCell(4, 4);
        await keyDownUp(['control/meta', 'home']);

        expect(`
        |   |   :   |
        |---:---:---|
        |   | # :   |
        |   |   :   |
        |   |   :   |
        |---:---:---|
        |   |   :   |
        `).toBeMatchToSelectionPattern();

        expect(getSelected()).toEqual([[1, 3, 1, 3]]);
        expect(getSelectedRangeLast().highlight.row).toBe(1);
        expect(getSelectedRangeLast().highlight.col).toBe(3);
        expect(getSelectedRangeLast().from.row).toBe(1);
        expect(getSelectedRangeLast().from.col).toBe(3);
        expect(getSelectedRangeLast().to.row).toBe(1);
        expect(getSelectedRangeLast().to.col).toBe(3);
      });

      it('by ctrl/cmd + END key (without fixed rows and columns)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          hiddenColumns: {
            columns: [1, 3],
          },
        });

        await selectCell(1, 1);
        await keyDownUp(['control/meta', 'end']);

        expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   : # |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[4, 4, 4, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(4);
      });

      it('by ctrl/cmd + END key (with fixed rows and columns)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          fixedColumnsStart: 2,
          fixedRowsTop: 1,
          fixedRowsBottom: 1,
          hiddenColumns: {
            columns: [1, 2],
          },
        });

        await selectCell(1, 1);
        await keyDownUp(['control/meta', 'end']);

        expect(`
        |   |   :   |
        |---:---:---|
        |   |   :   |
        |   |   :   |
        |   |   : # |
        |---:---:---|
        |   |   :   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[3, 4, 3, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(3);
        expect(getSelectedRangeLast().to.col).toBe(4);
      });
    });
  });
});
