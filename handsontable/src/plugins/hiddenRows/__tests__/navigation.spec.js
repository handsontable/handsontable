describe('HiddenRows', () => {
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
    it('should not throw an error when all rows are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0, 1, 2, 3, 4],
        },
      });

      selectAll();
      listen();

      expect(() => keyDownUp('home')).not.toThrow();
      expect(() => keyDownUp(['control/meta', 'home'])).not.toThrow();
      expect(() => keyDownUp('end')).not.toThrow();
      expect(() => keyDownUp(['control/meta', 'end'])).not.toThrow();
      expect(() => keyDownUp('arrowtop')).not.toThrow();
      expect(() => keyDownUp('arrowbottom')).not.toThrow();
      expect(() => keyDownUp('arrowright')).not.toThrow();
      expect(() => keyDownUp('arrowleft')).not.toThrow();
      expect(getSelected()).toEqual([[-1, -1, 4, 4]]);
    });

    it('should go to the closest not hidden cell on the bottom while navigating by arrow down', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        autoWrapRow: true,
        autoWrapCol: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      selectCell(0, 0);

      keyDownUp('arrowdown');

      expect(getSelected()).toEqual([[4, 0, 4, 0]]);
      expect(getCell(4, 0)).toHaveClass('current');
      expect(getSelectedRangeLast().highlight.row).toBe(4);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(`
        |   :   :   :   :   |
        | # :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should go to the closest not hidden cell on the top while navigating by arrow up', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        autoWrapRow: true,
        autoWrapCol: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      selectCell(4, 0);

      keyDownUp('arrowup');

      expect(getCell(0, 0)).toHaveClass('current');
      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(0);
      expect(`
        | # :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should go to the first visible cell in the next column while navigating by arrow down if ' +
       'all rows on the bottom are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        autoWrapRow: true,
        autoWrapCol: true,
        hiddenRows: {
          rows: [3, 4],
        },
      });

      selectCell(2, 0);

      keyDownUp('arrowdown');

      expect(getCell(0, 1)).toHaveClass('current');
      expect(getSelected()).toEqual([[0, 1, 0, 1]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(1);
      expect(`
        |   : # :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should go to the last visible cell in the previous column while navigating by arrow up if ' +
       'all rows on the top are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        autoWrapRow: true,
        autoWrapCol: true,
        hiddenRows: {
          rows: [0, 1],
        },
      });

      selectCell(2, 1);

      keyDownUp('arrowup');

      expect(getCell(4, 0)).toHaveClass('current');
      expect(getSelected()).toEqual([[4, 0, 4, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(4);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(4);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(0);
      expect(`
        |   :   :   :   :   |
        |   :   :   :   :   |
        | # :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should go to the first cell in the next visible column while navigating by arrow down if ' +
       'row on the bottom is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        autoWrapRow: true,
        autoWrapCol: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      selectCell(4, 0);

      keyDownUp('arrowdown');

      expect(getCell(0, 1)).toHaveClass('current');
      expect(getSelected()).toEqual([[0, 1, 0, 1]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(1);
      expect(`
        |   : # :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should go to the last cell in the last visible column while navigating by arrow left if ' +
       'row on the top is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        autoWrapRow: true,
        autoWrapCol: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      selectCell(4, 0);

      keyDownUp('arrowleft');

      expect(getCell(0, 4)).toHaveClass('current');
      expect(getSelected()).toEqual([[0, 4, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(4);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(4);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);
      expect(`
        |   :   :   :   : # |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    describe('should go to the proper cell while navigating if row header is selected and', () => {
      it('first rows are hidden', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          autoWrapRow: true,
          autoWrapCol: true,
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: {
            rows: [0, 1],
          },
        });

        const header = getCell(-1, 0);

        simulateClick(header, 'LMB');
        keyDownUp('arrowdown');

        expect(getSelected()).toEqual([[3, 0, 3, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(3);
        expect(getSelectedRangeLast().to.col).toBe(0);
        expect(`
          |   ║ - :   :   :   :   |
          |===:===:===:===:===:===|
          |   ║   :   :   :   :   |
          | - ║ # :   :   :   :   |
          |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('last rows are hidden', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          autoWrapRow: true,
          autoWrapCol: true,
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: {
            rows: [3, 4],
          },
        });

        const header = getCell(-1, 0);

        simulateClick(header, 'LMB');
        keyDownUp('arrowup');

        expect(getSelected()).toEqual([[2, 4, 2, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(2);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(2);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(2);
        expect(getSelectedRangeLast().to.col).toBe(4);
        expect(`
          |   ║   :   :   :   : - |
          |===:===:===:===:===:===|
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
          | - ║   :   :   :   : # |
        `).toBeMatchToSelectionPattern();
      });

      it('just one row is visible (row at the start is not hidden)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          autoWrapRow: true,
          autoWrapCol: true,
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: {
            rows: [1, 2, 3, 4],
          },
        });

        simulateClick(getCell(-1, 0), 'LMB'); // Select first column by clicking the column header.
        keyDownUp('arrowleft');

        expect(getSelected()).toEqual([[0, 4, 0, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(4);
        expect(`
          |   ║   :   :   :   : - |
          |===:===:===:===:===:===|
          | - ║   :   :   :   : # |
        `).toBeMatchToSelectionPattern();

        simulateClick(getCell(-1, 0), 'LMB'); // Select first column by clicking the column header.
        keyDownUp('arrowright');

        expect(getSelected()).toEqual([[0, 1, 0, 1]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(1);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(1);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(1);
        expect(`
          |   ║   : - :   :   :   |
          |===:===:===:===:===:===|
          | - ║   : # :   :   :   |
        `).toBeMatchToSelectionPattern();

        simulateClick(getCell(-1, 0), 'LMB'); // Select first column by clicking the column header.
        keyDownUp('arrowup');

        expect(getSelected()).toEqual([[0, 4, 0, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(4);
        expect(`
          |   ║   :   :   :   : - |
          |===:===:===:===:===:===|
          | - ║   :   :   :   : # |
        `).toBeMatchToSelectionPattern();

        simulateClick(getCell(-1, 0), 'LMB'); // Select first column by clicking the column header.
        keyDownUp('arrowdown');

        expect(getSelected()).toEqual([[0, 1, 0, 1]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(1);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(1);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(1);
        expect(`
          |   ║   : - :   :   :   |
          |===:===:===:===:===:===|
          | - ║   : # :   :   :   |
        `).toBeMatchToSelectionPattern();

        simulateClick(getCell(-1, 4), 'LMB'); // Select last column by clicking the column header.
        keyDownUp('arrowleft');

        expect(getSelected()).toEqual([[0, 3, 0, 3]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(3);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(3);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(3);
        expect(`
          |   ║   :   :   : - :   |
          |===:===:===:===:===:===|
          | - ║   :   :   : # :   |
        `).toBeMatchToSelectionPattern();

        simulateClick(getCell(-1, 4), 'LMB'); // Select last column by clicking the column header.
        keyDownUp('arrowright');

        expect(getSelected()).toEqual([[0, 0, 0, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(0);
        expect(`
          |   ║ - :   :   :   :   |
          |===:===:===:===:===:===|
          | - ║ # :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        simulateClick(getCell(-1, 4), 'LMB'); // Select last column by clicking the column header.
        keyDownUp('arrowup');

        expect(getSelected()).toEqual([[0, 3, 0, 3]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(3);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(3);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(3);
        expect(`
          |   ║   :   :   : - :   |
          |===:===:===:===:===:===|
          | - ║   :   :   : # :   |
        `).toBeMatchToSelectionPattern();

        simulateClick(getCell(-1, 4), 'LMB'); // Select last column by clicking the column header.
        keyDownUp('arrowdown');

        expect(getSelected()).toEqual([[0, 0, 0, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(0);
        expect(`
          |   ║ - :   :   :   :   |
          |===:===:===:===:===:===|
          | - ║ # :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('just one row is visible (row at the end is not hidden)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          autoWrapRow: true,
          autoWrapCol: true,
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: {
            rows: [0, 1, 2, 3],
          },
        });

        simulateClick(getCell(-1, 0), 'LMB'); // Select first column by clicking the column header.
        keyDownUp('arrowleft');

        expect(getSelected()).toEqual([[4, 4, 4, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(4);
        expect(`
          |   ║   :   :   :   : - |
          |===:===:===:===:===:===|
          | - ║   :   :   :   : # |
        `).toBeMatchToSelectionPattern();

        simulateClick(getCell(-1, 0), 'LMB'); // Select first column by clicking the column header.
        keyDownUp('arrowright');

        expect(getSelected()).toEqual([[4, 1, 4, 1]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(1);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(1);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(1);
        expect(`
          |   ║   : - :   :   :   |
          |===:===:===:===:===:===|
          | - ║   : # :   :   :   |
        `).toBeMatchToSelectionPattern();

        simulateClick(getCell(-1, 0), 'LMB'); // Select first column by clicking the column header.
        keyDownUp('arrowup');

        expect(getSelected()).toEqual([[4, 4, 4, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(4);
        expect(`
          |   ║   :   :   :   : - |
          |===:===:===:===:===:===|
          | - ║   :   :   :   : # |
        `).toBeMatchToSelectionPattern();

        simulateClick(getCell(-1, 0), 'LMB'); // Select first column by clicking the column header.
        keyDownUp('arrowdown');

        expect(getSelected()).toEqual([[4, 1, 4, 1]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(1);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(1);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(1);
        expect(`
          |   ║   : - :   :   :   |
          |===:===:===:===:===:===|
          | - ║   : # :   :   :   |
        `).toBeMatchToSelectionPattern();

        simulateClick(getCell(-1, 4), 'LMB'); // Select last column by clicking the column header.
        keyDownUp('arrowleft');

        expect(getSelected()).toEqual([[4, 3, 4, 3]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(3);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(3);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(3);
        expect(`
          |   ║   :   :   : - :   |
          |===:===:===:===:===:===|
          | - ║   :   :   : # :   |
        `).toBeMatchToSelectionPattern();

        simulateClick(getCell(-1, 4), 'LMB'); // Select last column by clicking the column header.
        keyDownUp('arrowright');

        expect(getSelected()).toEqual([[4, 0, 4, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(0);
        expect(`
          |   ║ - :   :   :   :   |
          |===:===:===:===:===:===|
          | - ║ # :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        simulateClick(getCell(-1, 4), 'LMB'); // Select last column by clicking the column header.
        keyDownUp('arrowup');

        expect(getSelected()).toEqual([[4, 3, 4, 3]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(3);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(3);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(3);
        expect(`
          |   ║   :   :   : - :   |
          |===:===:===:===:===:===|
          | - ║   :   :   : # :   |
        `).toBeMatchToSelectionPattern();

        simulateClick(getCell(-1, 4), 'LMB'); // Select last column by clicking the column header.
        keyDownUp('arrowdown');

        expect(getSelected()).toEqual([[4, 0, 4, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(0);
        expect(`
          |   ║ - :   :   :   :   |
          |===:===:===:===:===:===|
          | - ║ # :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });
    });

    describe('should not change position and call hook when single hidden cell was selected and ' +
             'navigating by any arrow key', () => {
      /**
       * Helper for removing undefined values from arguments. This fixes an issue couses by runHooks
       * which triggers subjects with fixed numbers of arguments.
       *
       * @param {object} spyContext
       */
      function fixUndefinedArgs(spyContext) {
        return spyContext.args.filter(arg => arg !== undefined);
      }

      describe('without shift key pressed', () => {
        it('hidden cell at the table start', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenRows: {
              rows: [0],
            },
          });

          const hookSpy1 = jasmine.createSpy('beforeModifyTransformStart');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformStart');

          hot.addHook('modifyTransformStart', hookSpy1);
          hot.addHook('afterModifyTransformStart', hookSpy2);

          selectCell(0, 1);

          keyDownUp('arrowleft');

          expect(getSelected()).withContext('ARROW_LEFT (getSelected)').toEqual([[0, 1, 0, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_LEFT (before mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: -1 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_LEFT (after mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: 1 }), 0, 0
          ]);

          keyDownUp('arrowright');

          expect(getSelected()).withContext('ARROW_RIGHT (getSelected)').toEqual([[0, 1, 0, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_RIGHT (before mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: 1 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_RIGHT (after mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: 1 }), 0, 0
          ]);

          keyDownUp('arrowup');

          expect(getSelected()).withContext('ARROW_UP (getSelected)').toEqual([[0, 1, 0, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_UP (before mod)').toEqual([
            jasmine.objectContaining({ row: -1, col: 0 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_UP (after mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: 1 }), 0, 0
          ]);

          keyDownUp('arrowdown');

          expect(getSelected()).withContext('ARROW_DOWN (getSelected)').toEqual([[0, 1, 0, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_DOWN (before mod)').toEqual([
            jasmine.objectContaining({ row: 1, col: 0 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_DOWN (after mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: 1 }), 0, 0
          ]);
        });

        it('hidden cell in the table middle', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenRows: {
              rows: [2],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformStart');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformStart');

          hot.addHook('modifyTransformStart', hookSpy1);
          hot.addHook('afterModifyTransformStart', hookSpy2);

          selectCell(2, 1);

          keyDownUp('arrowleft');

          expect(getSelected()).withContext('ARROW_LEFT (getSelected)').toEqual([[2, 1, 2, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_LEFT (before mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: -1 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_LEFT (after mod)').toEqual([
            jasmine.objectContaining({ row: 2, col: 1 }), 0, 0
          ]);

          keyDownUp('arrowright');

          expect(getSelected()).withContext('ARROW_RIGHT (getSelected)').toEqual([[2, 1, 2, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_RIGHT (before mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: 1 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_RIGHT (after mod)').toEqual([
            jasmine.objectContaining({ row: 2, col: 1 }), 0, 0
          ]);

          keyDownUp('arrowup');

          expect(getSelected()).withContext('ARROW_UP (getSelected)').toEqual([[2, 1, 2, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_UP (before mod)').toEqual([
            jasmine.objectContaining({ row: -1, col: 0 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_UP (after mod)').toEqual([
            jasmine.objectContaining({ row: 2, col: 1 }), 0, 0
          ]);

          keyDownUp('arrowdown');

          expect(getSelected()).withContext('ARROW_DOWN (getSelected)').toEqual([[2, 1, 2, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_DOWN (before mod)').toEqual([
            jasmine.objectContaining({ row: 1, col: 0 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_DOWN (after mod)').toEqual([
            jasmine.objectContaining({ row: 2, col: 1 }), 0, 0
          ]);
        });

        it('hidden cell at the table end', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenRows: {
              rows: [4],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformStart');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformStart');

          hot.addHook('modifyTransformStart', hookSpy1);
          hot.addHook('afterModifyTransformStart', hookSpy2);

          selectCell(4, 1);

          keyDownUp('arrowleft');

          expect(getSelected()).withContext('ARROW_LEFT (getSelected)').toEqual([[4, 1, 4, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_LEFT (before mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: -1 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_LEFT (after mod)').toEqual([
            jasmine.objectContaining({ row: 4, col: 1 }), 0, 0
          ]);

          keyDownUp('arrowright');

          expect(getSelected()).withContext('ARROW_RIGHT (getSelected)').toEqual([[4, 1, 4, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_RIGHT (before mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: 1 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_RIGHT (after mod)').toEqual([
            jasmine.objectContaining({ row: 4, col: 1 }), 0, 0
          ]);

          keyDownUp('arrowup');

          expect(getSelected()).withContext('ARROW_UP (getSelected)').toEqual([[4, 1, 4, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_UP (before mod)').toEqual([
            jasmine.objectContaining({ row: -1, col: 0 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_UP (after mod)').toEqual([
            jasmine.objectContaining({ row: 4, col: 1 }), 0, 0
          ]);

          keyDownUp('arrowdown');

          expect(getSelected()).withContext('ARROW_DOWN (getSelected)').toEqual([[4, 1, 4, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_DOWN (before mod)').toEqual([
            jasmine.objectContaining({ row: 1, col: 0 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_DOWN (after mod)').toEqual([
            jasmine.objectContaining({ row: 4, col: 1 }), 0, 0
          ]);
        });
      });

      describe('with shift key pressed', () => {
        it('hidden cell at the table start', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenRows: {
              rows: [0],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformEnd');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformEnd');

          hot.addHook('modifyTransformEnd', hookSpy1);
          hot.addHook('afterModifyTransformEnd', hookSpy2);

          selectCell(0, 1);
          keyDownUp(['shift', 'arrowleft']);

          expect(getSelected()).withContext('ARROW_LEFT (getSelected)').toEqual([[0, 1, 0, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_LEFT (before mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: -1 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_LEFT (after mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: 1 }), 0, 0
          ]);

          keyDownUp(['shift', 'arrowright']);

          expect(getSelected()).withContext('ARROW_RIGHT (getSelected)').toEqual([[0, 1, 0, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_RIGHT (before mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: 1 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_RIGHT (after mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: 1 }), 0, 0
          ]);

          keyDownUp(['shift', 'arrowup']);

          expect(getSelected()).withContext('ARROW_UP (getSelected)').toEqual([[0, 1, 0, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_UP (before mod)').toEqual([
            jasmine.objectContaining({ row: -1, col: 0 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_UP (after mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: 1 }), 0, 0
          ]);

          keyDownUp(['shift', 'arrowdown']);

          expect(getSelected()).withContext('ARROW_DOWN (getSelected)').toEqual([[0, 1, 0, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_DOWN (before mod)').toEqual([
            jasmine.objectContaining({ row: 1, col: 0 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_DOWN (after mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: 1 }), 0, 0
          ]);
        });

        it('hidden cell in the table middle', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenRows: {
              rows: [2],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformEnd');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformEnd');

          hot.addHook('modifyTransformEnd', hookSpy1);
          hot.addHook('afterModifyTransformEnd', hookSpy2);

          selectCell(2, 1);
          keyDownUp(['shift', 'arrowleft']);

          expect(getSelected()).withContext('ARROW_LEFT (getSelected)').toEqual([[2, 1, 2, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_LEFT (before mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: -1 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_LEFT (after mod)').toEqual([
            jasmine.objectContaining({ row: 2, col: 1 }), 0, 0
          ]);

          keyDownUp(['shift', 'arrowright']);

          expect(getSelected()).withContext('ARROW_RIGHT (getSelected)').toEqual([[2, 1, 2, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_RIGHT (before mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: 1 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_RIGHT (after mod)').toEqual([
            jasmine.objectContaining({ row: 2, col: 1 }), 0, 0
          ]);

          keyDownUp(['shift', 'arrowup']);

          expect(getSelected()).withContext('ARROW_UP (getSelected)').toEqual([[2, 1, 2, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_UP (before mod)').toEqual([
            jasmine.objectContaining({ row: -1, col: 0 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_UP (after mod)').toEqual([
            jasmine.objectContaining({ row: 2, col: 1 }), 0, 0
          ]);

          keyDownUp(['shift', 'arrowdown']);

          expect(getSelected()).withContext('ARROW_DOWN (getSelected)').toEqual([[2, 1, 2, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_DOWN (before mod)').toEqual([
            jasmine.objectContaining({ row: 1, col: 0 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_DOWN (after mod)').toEqual([
            jasmine.objectContaining({ row: 2, col: 1 }), 0, 0
          ]);
        });

        it('hidden cell at the table end', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenRows: {
              rows: [4],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformEnd');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformEnd');

          hot.addHook('modifyTransformEnd', hookSpy1);
          hot.addHook('afterModifyTransformEnd', hookSpy2);

          selectCell(4, 1);
          keyDownUp(['shift', 'arrowleft']);

          expect(getSelected()).withContext('ARROW_LEFT (getSelected)').toEqual([[4, 1, 4, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_LEFT (before mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: -1 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_LEFT (after mod)').toEqual([
            jasmine.objectContaining({ row: 4, col: 1 }), 0, 0
          ]);

          keyDownUp(['shift', 'arrowright']);

          expect(getSelected()).withContext('ARROW_RIGHT (getSelected)').toEqual([[4, 1, 4, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_RIGHT (before mod)').toEqual([
            jasmine.objectContaining({ row: 0, col: 1 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_RIGHT (after mod)').toEqual([
            jasmine.objectContaining({ row: 4, col: 1 }), 0, 0
          ]);

          keyDownUp(['shift', 'arrowup']);

          expect(getSelected()).withContext('ARROW_UP (getSelected)').toEqual([[4, 1, 4, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_UP (before mod)').toEqual([
            jasmine.objectContaining({ row: -1, col: 0 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_UP (after mod)').toEqual([
            jasmine.objectContaining({ row: 4, col: 1 }), 0, 0
          ]);

          keyDownUp(['shift', 'arrowdown']);

          expect(getSelected()).withContext('ARROW_DOWN (getSelected)').toEqual([[4, 1, 4, 1]]);
          expect(fixUndefinedArgs(hookSpy1.calls.mostRecent())).withContext('ARROW_DOWN (before mod)').toEqual([
            jasmine.objectContaining({ row: 1, col: 0 })
          ]);
          expect(fixUndefinedArgs(hookSpy2.calls.mostRecent())).withContext('ARROW_DOWN (after mod)').toEqual([
            jasmine.objectContaining({ row: 4, col: 1 }), 0, 0
          ]);
        });
      });
    });

    describe('should go to the closest not hidden cell in a row while navigating', () => {
      it('by HOME key (without fixed columns)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          hiddenRows: {
            rows: [0, 1, 3],
          },
        });

        selectCell(4, 4);
        keyDownUp('home');

        expect(`
        |   :   :   :   :   |
        | # :   :   :   :   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[4, 0, 4, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(0);
      });

      it('by HOME key (with fixed rows and columns)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(7, 5),
          fixedColumnsStart: 1,
          fixedRowsTop: 2,
          fixedRowsBottom: 2,
          hiddenRows: {
            rows: [1, 2, 5],
          },
        });

        selectCell(4, 4);
        keyDownUp('home');

        expect(`
        |   |   :   :   :   |
        |---:---:---:---:---|
        |   |   :   :   :   |
        |   | # :   :   :   |
        |---:---:---:---:---|
        |   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[4, 1, 4, 1]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(1);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(1);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(1);
      });

      it('by shift + HOME key', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          hiddenRows: {
            rows: [0, 1, 3],
          },
        });

        selectCell(4, 4);
        keyDownUp(['shift', 'home']);

        expect(`
        |   :   :   :   :   |
        | 0 : 0 : 0 : 0 : A |
        `).toBeMatchToSelectionPattern();

        expect(getSelected()).toEqual([[4, 4, 4, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(0);
      });

      it('by END key', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          hiddenRows: {
            rows: [1, 3, 4],
          },
        });

        selectCell(0, 0);
        keyDownUp('end');

        expect(`
        |   :   :   :   : # |
        |   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[0, 4, 0, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(4);
      });

      it('by shift + END key', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          hiddenRows: {
            rows: [1, 3, 4],
          },
        });

        selectCell(0, 0);

        keyDownUp(['shift', 'end']);

        expect(`
        | A : 0 : 0 : 0 : 0 |
        |   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[0, 0, 0, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(4);
      });
    });

    describe('should go to the closest not hidden cell of the table while navigating', () => {
      it('by ctrl/cmd + HOME key (without fixed rows and columns)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          hiddenRows: {
            rows: [1, 3],
          },
        });

        selectCell(4, 4);
        keyDownUp(['control/meta', 'home']);

        expect(`
        | # :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        expect(getSelected()).toEqual([[0, 0, 0, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(0);
      });

      it('by ctrl/cmd + HOME key (with fixed rows and columns)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(7, 5),
          fixedColumnsStart: 1,
          fixedRowsTop: 2,
          fixedRowsBottom: 2,
          hiddenRows: {
            rows: [1, 2, 5],
          },
        });

        selectCell(4, 4);
        keyDownUp(['control/meta', 'home']);

        expect(`
        |   |   :   :   :   |
        |---:---:---:---:---|
        |   | # :   :   :   |
        |   |   :   :   :   |
        |---:---:---:---:---|
        |   |   :   :   :   |
        `).toBeMatchToSelectionPattern();

        expect(getSelected()).toEqual([[3, 1, 3, 1]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(1);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(1);
        expect(getSelectedRangeLast().to.row).toBe(3);
        expect(getSelectedRangeLast().to.col).toBe(1);
      });

      it('by ctrl/cmd + END key (without fixed rows and columns)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          hiddenRows: {
            rows: [1, 3],
          },
        });

        selectCell(0, 0);
        keyDownUp(['control/meta', 'end']);

        expect(`
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   : # |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[4, 4, 4, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(4);
      });

      it('by ctrl/cmd + END key (with fixed rows and columns)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(7, 5),
          fixedColumnsStart: 1,
          fixedRowsTop: 2,
          fixedRowsBottom: 2,
          hiddenRows: {
            rows: [1, 2, 5],
          },
        });

        selectCell(0, 0);
        keyDownUp(['control/meta', 'end']);

        expect(`
        |   |   :   :   :   |
        |---:---:---:---:---|
        |   |   :   :   :   |
        |   |   :   :   : # |
        |---:---:---:---:---|
        |   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[4, 4, 4, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(4);
      });
    });
  });
});
