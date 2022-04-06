describe('HiddenColumns (RTL mode)', () => {
  using('configuration object', [
    { htmlDir: 'rtl', layoutDirection: 'inherit' },
    { htmlDir: 'ltr', layoutDirection: 'rtl' },
  ], ({ htmlDir, layoutDirection }) => {
    const id = 'testContainer';

    beforeEach(function() {
      $('html').attr('dir', htmlDir);
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('navigation', () => {
      describe('should go to the closest not hidden cell in a row while navigating', () => {
        it('by HOME key (without fixed rows and columns)', () => {
          handsontable({
            layoutDirection,
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

        it('by HOME key (with fixed rows and columns)', () => {
          handsontable({
            layoutDirection,
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            fixedColumnsStart: 2,
            fixedRowsTop: 1,
            fixedRowsBottom: 1,
            hiddenColumns: {
              columns: [1, 2],
            },
          });

          selectCell(2, 4);
          keyDownUp('home');

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

        it('by shift + HOME key', () => {
          handsontable({
            layoutDirection,
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [0, 1, 3],
            },
          });

          selectCell(4, 4);
          keyDownUp(['shift', 'home']);

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
            layoutDirection,
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

        it('by shift + END key', () => {
          handsontable({
            layoutDirection,
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [1, 3, 4],
            },
          });

          selectCell(0, 0);
          keyDownUp(['shift', 'end']);

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
        it('by ctrl/cmd + HOME key (without fixed rows and columns)', () => {
          handsontable({
            layoutDirection,
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [1, 3],
            },
          });

          selectCell(4, 4);
          keyDownUp(['control/meta', 'home']);

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

        it('by ctrl/cmd + HOME key (with fixed rows and columns)', () => {
          handsontable({
            layoutDirection,
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            fixedColumnsStart: 2,
            fixedRowsTop: 1,
            fixedRowsBottom: 1,
            hiddenColumns: {
              columns: [1, 2],
            },
          });

          selectCell(4, 4);
          keyDownUp(['control/meta', 'home']);

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

        it('by ctrl/cmd + END key (without fixed rows and columns)', () => {
          handsontable({
            layoutDirection,
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [1, 3],
            },
          });

          selectCell(1, 1);
          keyDownUp(['control/meta', 'end']);

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

        it('by ctrl/cmd + END key (with fixed rows and columns)', () => {
          handsontable({
            layoutDirection,
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            fixedColumnsStart: 2,
            fixedRowsTop: 1,
            fixedRowsBottom: 1,
            hiddenColumns: {
              columns: [1, 2],
            },
          });

          selectCell(1, 1);
          keyDownUp(['control/meta', 'end']);

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
});
