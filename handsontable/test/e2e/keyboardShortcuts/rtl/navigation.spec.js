describe('Core navigation keyboard shortcut (RTL mode)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('"ArrowRight"', () => {
    it('should move the cell selection to the right', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 1);
      keyDownUp('arrowright');

      expect(getSelected()).toEqual([[1, 0, 1, 0]]);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the row above, if the first column is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: false
        });

        selectCell(1, 0);
        keyDownUp('arrowright');

        expect(getSelected()).toEqual([[1, 0, 1, 0]]);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the last column of the row above, if the first column is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(1, 0);
        keyDownUp('arrowright');

        expect(getSelected()).toEqual([[0, 4, 0, 4]]);
      });

      it('should move the cell selection to the bottom-left corner, if the most top-right cell is selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(0, 0);
        keyDownUp('arrowright');

        expect(getSelected()).toEqual([[4, 4, 4, 4]]);
      });
    });
  });

  describe('"ArrowRight + Ctrl/Cmd"', () => {
    it('should move the cell selection to the most right cell in a row', () => {
      handsontable({
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

  describe('"ArrowLeft"', () => {
    it('should move the cell selection to the left', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 2);
      keyDownUp('arrowleft');

      expect(getSelected()).toEqual([[1, 3, 1, 3]]);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the row below, if the last column is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: false
        });

        selectCell(1, 4);
        keyDownUp('arrowleft');

        expect(getSelected()).toEqual([[1, 4, 1, 4]]);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the first column of the row below, if the last column is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(1, 4);
        keyDownUp('arrowleft');

        expect(getSelected()).toEqual([[2, 0, 2, 0]]);
      });

      it('should move the cell selection to the top-right corner, if the most bottom-left cell is selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(4, 4);
        keyDownUp('arrowleft');

        expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      });
    });
  });

  describe('"ArrowLeft + Ctrl/Cmd"', () => {
    it('should move the cell selection to the most left cell in a row', () => {
      handsontable({
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
  });

  describe('"ArrowUp"', () => {
    it('should move the cell selection above', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 2);
      keyDownUp('arrowup');

      expect(getSelected()).toEqual([[0, 2, 0, 2]]);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the previous column, if the first row is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: false
        });

        selectCell(0, 1);
        keyDownUp('arrowup');

        expect(getSelected()).toEqual([[0, 1, 0, 1]]);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the last row of the previous column, if the first row is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: true
        });

        selectCell(0, 1);
        keyDownUp('arrowup');

        expect(getSelected()).toEqual([[4, 0, 4, 0]]);
      });

      it('should move the cell selection to the bottom-right corner, if the most top-left cell is selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: true
        });

        selectCell(0, 0);
        keyDownUp('arrowup');

        expect(getSelected()).toEqual([[4, 4, 4, 4]]);
      });
    });
  });

  describe('"ArrowUp + Ctrl/Cmd"', () => {
    it('should move the cell selection to the first cell (first row) in a column', () => {
      handsontable({
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
  });

  describe('"ArrowDown"', () => {
    it('should move the cell selection below', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 2);
      keyDownUp('arrowdown');

      expect(getSelected()).toEqual([[2, 2, 2, 2]]);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the next column, if the last row is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: false
        });

        selectCell(4, 0);
        keyDownUp('arrowdown');

        expect(getSelected()).toEqual([[4, 0, 4, 0]]);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the first row of the next column, if the first row is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: true
        });

        selectCell(4, 1);
        keyDownUp('arrowdown');

        expect(getSelected()).toEqual([[0, 2, 0, 2]]);
      });

      it('should move the cell selection to the top-left corner, if the most bottom-right cell is selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: true
        });

        selectCell(4, 4);
        keyDownUp('arrowdown');

        expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      });
    });
  });

  describe('"ArrowDown + Ctrl/Cmd"', () => {
    it('should move the cell selection to the last cell (last row) in a column', () => {
      handsontable({
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
  });

  describe('"PageUp"', () => {
    it('should move the cell selection to the first row', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(4, 4);
      keyDownUp('pageup');

      expect(getSelected()).toEqual([[0, 4, 0, 4]]);

      selectCell(4, 4);
      keyDownUp(['shift', 'pageup']);

      // Temporary, for compatibility with Handsontable 11.0.x.
      expect(getSelected()).toEqual([[0, 4, 0, 4]]);
    });
  });

  describe('"PageDown"', () => {
    it('should move the cell selection to the last row', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(0, 0);
      keyDownUp('pagedown');

      expect(getSelected()).toEqual([[4, 0, 4, 0]]);

      selectCell(0, 0);
      keyDownUp(['shift', 'pagedown']);

      // Temporary, for compatibility with Handsontable 11.0.x.
      expect(getSelected()).toEqual([[4, 0, 4, 0]]);
    });
  });
});
