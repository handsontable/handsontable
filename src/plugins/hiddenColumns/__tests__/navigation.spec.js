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
    it('should go to the closest not hidden cell on the right side while navigating by right arrow', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectCell(0, 0);

      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

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

    it('should go to the closest not hidden cell on the left side while navigating by left arrow', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectCell(0, 4);

      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

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

    it('should go to the first visible cell in the next row while navigating by right arrow if all column on the right side are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        autoWrapRow: true,
        autoWrapCol: true,
        hiddenColumns: {
          columns: [3, 4],
        },
      });

      selectCell(0, 2);

      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

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

    it('should go to the last visible cell in the previous row while navigating by left arrow if all column on the left side are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        autoWrapRow: true,
        autoWrapCol: true,
        hiddenColumns: {
          columns: [0, 1],
        },
      });

      selectCell(1, 2);

      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

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

    it('should go to the first cell in the next visible column while navigating by down arrow if column on the right side is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        autoWrapRow: true,
        autoWrapCol: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectCell(4, 0);

      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

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

    it('should go to the last cell in the previous visible column while navigating by up arrow if column on the left side is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        autoWrapRow: true,
        autoWrapCol: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectCell(0, 4);

      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

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
      it('first columns are hidden', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          autoWrapRow: true,
          autoWrapCol: true,
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [0, 1],
          },
        });

        const header = getCell(0, -1);

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

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

      it('last columns are hidden', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          autoWrapRow: true,
          autoWrapCol: true,
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [3, 4],
          },
        });

        const header = getCell(0, -1);

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

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

      it('just one column is visible (column at the start is not hidden)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          autoWrapRow: true,
          autoWrapCol: true,
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [1, 2, 3, 4],
          },
        });

        let header = getCell(0, -1); // first visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

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

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

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

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

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

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

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

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

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

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

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

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

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

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

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

      it('just one column is visible (column at the end is not hidden)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          autoWrapRow: true,
          autoWrapCol: true,
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [0, 1, 2, 3],
          },
        });

        let header = getCell(0, -1); // first visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

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

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

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

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

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

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

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

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

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

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

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

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

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

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

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
        it('hidden cell at the table start', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [0],
            },
          });

          const hookSpy1 = jasmine.createSpy('beforeModifyTransformStart');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformStart');

          hot.addHook('modifyTransformStart', hookSpy1);
          hot.addHook('afterModifyTransformStart', hookSpy2);

          selectCell(1, 0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);
        });

        it('hidden cell in the table middle', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [2],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformStart');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformStart');

          hot.addHook('modifyTransformStart', hookSpy1);
          hot.addHook('afterModifyTransformStart', hookSpy2);

          selectCell(1, 2);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);
        });

        it('hidden cell at the table end', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [4],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformStart');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformStart');

          hot.addHook('modifyTransformStart', hookSpy1);
          hot.addHook('afterModifyTransformStart', hookSpy2);

          selectCell(1, 4);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

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
        it('hidden cell at the table start', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [0],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformEnd');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformEnd');

          hot.addHook('modifyTransformEnd', hookSpy1);
          hot.addHook('afterModifyTransformEnd', hookSpy2);

          selectCell(1, 0);

          keyDownUp('shift+arrow_up');

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_down');

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_left');

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_right');

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);
        });

        it('hidden cell in the table middle', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [2],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformEnd');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformEnd');

          hot.addHook('modifyTransformEnd', hookSpy1);
          hot.addHook('afterModifyTransformEnd', hookSpy2);

          selectCell(1, 2);

          keyDownUp('shift+arrow_up');

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_down');

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_left');

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_right');

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);
        });

        it('hidden cell at the table end', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [4],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformEnd');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformEnd');

          hot.addHook('modifyTransformEnd', hookSpy1);
          hot.addHook('afterModifyTransformEnd', hookSpy2);

          selectCell(1, 4);

          keyDownUp('shift+arrow_up');

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_down');

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_left');

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_right');

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

    describe('should go to the closest not hidden cell while navigating', () => {
      it('by HOME key', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          hiddenColumns: {
            columns: [0, 1, 3],
          },
        });

        selectCell(4, 4);

        keyDownUp('home');

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

      it('by ctrl + HOME key', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          hiddenColumns: {
            columns: [0, 1, 3],
          },
        });

        selectCell(4, 4);

        keyDown('ctrl');
        keyDownUp('home', { ctrlKey: true });

        expect(`
        |   : A |
        |   :   |
        |   :   |
        |   :   |
        |   : 0 |
        `).toBeMatchToSelectionPattern();

        expect(getSelected()).toEqual([[4, 4, 4, 4], [0, 4, 0, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(4);
      });

      it('by shift + HOME key', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          hiddenColumns: {
            columns: [0, 1, 3],
          },
        });

        selectCell(4, 4);

        keyDown('shift');
        keyDownUp('home', { shiftKey: true });

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

      it('by END key', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          hiddenColumns: {
            columns: [1, 3, 4],
          },
        });

        selectCell(0, 0);

        keyDownUp('end');

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

      it('by ctrl + END key', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          hiddenColumns: {
            columns: [1, 3, 4],
          },
        });

        selectCell(0, 0);

        keyDown('ctrl');
        keyDownUp('end', { ctrlKey: true });

        expect(`
        | 0 :   |
        |   :   |
        |   :   |
        |   :   |
        | A :   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[0, 0, 0, 0], [4, 0, 4, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(0);
      });

      it('by shift + END key', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          hiddenColumns: {
            columns: [1, 3, 4],
          },
        });

        selectCell(0, 0);

        keyDown('shift');
        keyDownUp('end', { shiftKey: true });

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
  });
});
