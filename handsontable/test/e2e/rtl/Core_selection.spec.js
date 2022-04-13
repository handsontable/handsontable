describe('ContextMenu (RTL mode)', () => {
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

    describe('multiple selection mode', () => {
      describe('should move the selection highlight to a proper position while using ctrl/meta + arrow keys', () => {
        it('arrow down', () => {
          handsontable({
            layoutDirection,
            rowHeaders: true,
            colHeaders: true,
            startRows: 5,
            startCols: 5,
          });

          selectCell(1, 1);
          keyDownUp(['control/meta', 'arrowdown']);

          expect(getSelected()).toEqual([[4, 1, 4, 1]]);
          expect(`
            |   ║   : - :   :   :   |
            |===:===:===:===:===:===|
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            | - ║   : # :   :   :   |
          `).toBeMatchToSelectionPattern();

          selectCells([[3, 3, 1, 1]]);
          keyDownUp(['control/meta', 'arrowdown']);

          expect(getSelected()).toEqual([[4, 3, 4, 3]]);
          expect(`
            |   ║   :   :   : - :   |
            |===:===:===:===:===:===|
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            | - ║   :   :   : # :   |
          `).toBeMatchToSelectionPattern();

          selectColumns(2);
          keyDownUp(['control/meta', 'arrowdown']);

          expect(getSelected()).toEqual([[4, 2, 4, 2]]);
          expect(`
            |   ║   :   : - :   :   |
            |===:===:===:===:===:===|
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            | - ║   :   : # :   :   |
          `).toBeMatchToSelectionPattern();
        });

        it('arrow up', () => {
          handsontable({
            layoutDirection,
            rowHeaders: true,
            colHeaders: true,
            startRows: 5,
            startCols: 5,
          });

          selectCell(3, 3);
          keyDownUp(['control/meta', 'arrowup']);

          expect(getSelected()).toEqual([[0, 3, 0, 3]]);
          expect(`
            |   ║   :   :   : - :   |
            |===:===:===:===:===:===|
            | - ║   :   :   : # :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
          `).toBeMatchToSelectionPattern();

          selectCells([[3, 1, 1, 3]]);
          keyDownUp(['control/meta', 'arrowup']);

          expect(getSelected()).toEqual([[0, 1, 0, 1]]);
          expect(`
            |   ║   : - :   :   :   |
            |===:===:===:===:===:===|
            | - ║   : # :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
          `).toBeMatchToSelectionPattern();

          selectColumns(2);
          keyDownUp(['control/meta', 'arrowup']);

          expect(getSelected()).toEqual([[0, 2, 0, 2]]);
          expect(`
            |   ║   :   : - :   :   |
            |===:===:===:===:===:===|
            | - ║   :   : # :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
          `).toBeMatchToSelectionPattern();
        });

        it('arrow left', () => {
          handsontable({
            layoutDirection,
            rowHeaders: true,
            colHeaders: true,
            startRows: 5,
            startCols: 5,
          });

          selectCell(1, 3);
          keyDownUp(['control/meta', 'arrowleft']);

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(`
            |   ║   :   :   :   : - |
            |===:===:===:===:===:===|
            |   ║   :   :   :   :   |
            | - ║   :   :   :   : # |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
          `).toBeMatchToSelectionPattern();

          selectCells([[3, 1, 1, 3]]);
          keyDownUp(['control/meta', 'arrowleft']);

          expect(getSelected()).toEqual([[3, 4, 3, 4]]);
          expect(`
            |   ║   :   :   :   : - |
            |===:===:===:===:===:===|
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            | - ║   :   :   :   : # |
            |   ║   :   :   :   :   |
          `).toBeMatchToSelectionPattern();

          selectRows(2);
          keyDownUp(['control/meta', 'arrowleft']);

          expect(getSelected()).toEqual([[2, 4, 2, 4]]);
          expect(`
            |   ║   :   :   :   : - |
            |===:===:===:===:===:===|
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            | - ║   :   :   :   : # |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
          `).toBeMatchToSelectionPattern();
        });

        it('arrow right', () => {
          handsontable({
            layoutDirection,
            rowHeaders: true,
            colHeaders: true,
            startRows: 5,
            startCols: 5,
          });

          selectCell(1, 3);
          keyDownUp(['control/meta', 'arrowright']);

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(`
            |   ║ - :   :   :   :   |
            |===:===:===:===:===:===|
            |   ║   :   :   :   :   |
            | - ║ # :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
          `).toBeMatchToSelectionPattern();

          selectCells([[3, 3, 1, 1]]);
          keyDownUp(['control/meta', 'arrowright']);

          expect(getSelected()).toEqual([[3, 0, 3, 0]]);
          expect(`
            |   ║ - :   :   :   :   |
            |===:===:===:===:===:===|
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            | - ║ # :   :   :   :   |
            |   ║   :   :   :   :   |
          `).toBeMatchToSelectionPattern();

          selectRows(2);
          keyDownUp(['control/meta', 'arrowright']);

          expect(getSelected()).toEqual([[2, 0, 2, 0]]);
          expect(`
            |   ║ - :   :   :   :   |
            |===:===:===:===:===:===|
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
            | - ║ # :   :   :   :   |
            |   ║   :   :   :   :   |
            |   ║   :   :   :   :   |
          `).toBeMatchToSelectionPattern();
        });
      });
    });
  });
});
