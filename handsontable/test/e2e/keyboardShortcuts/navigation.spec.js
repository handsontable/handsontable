describe('Core navigation keyboard shortcut', () => {
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

  it('should not throw an error when dataset is empty', () => {
    handsontable({
      data: [],
      rowHeaders: true,
      colHeaders: true,
    });

    selectAll();
    listen();

    expect(() => keyDownUp('home')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'home'])).not.toThrow();
    expect(() => keyDownUp('end')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'end'])).not.toThrow();
    expect(() => keyDownUp('arrowtop')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'arrowtop'])).not.toThrow();
    expect(() => keyDownUp('arrowbottom')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'arrowbottom'])).not.toThrow();
    expect(() => keyDownUp('arrowright')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'arrowright'])).not.toThrow();
    expect(() => keyDownUp('arrowleft')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'arrowleft'])).not.toThrow();
    expect(getSelected()).toEqual([[-1, -1, -1, -1]]);
  });

  describe('"ArrowRight"', () => {
    it('should move the cell selection to the right', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(0, 0);
      keyDownUp('arrowright');

      expect(getSelected()).toEqual([[0, 1, 0, 1]]);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the row below, if the last column is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: false
        });

        selectCell(0, 4);
        keyDownUp('arrowright');

        expect(getSelected()).toEqual([[0, 4, 0, 4]]);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the first column of the row below, if the last column is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(0, 4);
        keyDownUp('arrowright');

        expect(getSelected()).toEqual([[1, 0, 1, 0]]);
      });

      it('should move the cell selection to the top-left corner, if the most bottom-right cell is selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(4, 4);
        keyDownUp('arrowright');

        expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      });

      it('should traverse whole table by constantly selecting next cell in row', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(0, 0);

        for (let row = 0, rlen = countRows(); row < rlen; row++) {
          for (let col = 0, clen = countCols(); col < clen; col++) {
            expect(getSelected()).toEqual([[row, col, row, col]]);
            keyDownUp('arrowright');
          }
        }

        expect(getSelected()).toEqual([[0, 0, 0, 0]]);
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
      keyDownUp(['control/meta', 'arrowright']);

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
      keyDownUp(['control/meta', 'arrowright']);

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

  describe('"ArrowLeft"', () => {
    it('should move the cell selection to the left', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 2);
      keyDownUp('arrowleft');

      expect(getSelected()).toEqual([[1, 1, 1, 1]]);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the row above, if the first column is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: false
        });

        selectCell(1, 0);
        keyDownUp('arrowleft');

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
        keyDownUp('arrowleft');

        expect(getSelected()).toEqual([[0, 4, 0, 4]]);
      });

      it('should move the cell selection to the bottom-right corner, if the most top-left cell is selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(0, 0);
        keyDownUp('arrowleft');

        expect(getSelected()).toEqual([[4, 4, 4, 4]]);
      });

      it('should traverse whole table by constantly selecting previous cell in row', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(4, 4);

        for (let row = countRows() - 1; row >= 0; row--) {
          for (let col = countCols() - 1; col >= 0; col--) {
            expect(getSelected()).toEqual([[row, col, row, col]]);
            keyDownUp('arrowleft');
          }
        }

        expect(getSelected()).toEqual([[4, 4, 4, 4]]);
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
      keyDownUp(['control/meta', 'arrowleft']);

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
      keyDownUp(['control/meta', 'arrowleft']);

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

      it('should traverse whole table by constantly selecting previous cell in column', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: true
        });

        selectCell(4, 4);

        for (let col = countCols() - 1; col >= 0; col--) {
          for (let row = countRows() - 1; row >= 0; row--) {
            expect(getSelected()).toEqual([[row, col, row, col]]);
            keyDownUp('arrowup');
          }
        }

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

      it('should traverse whole table by constantly selecting next cell in column', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: true
        });

        selectCell(0, 0);

        for (let col = 0, clen = countCols(); col < clen; col++) {
          for (let row = 0, rlen = countRows(); row < rlen; row++) {
            expect(getSelected()).toEqual([[row, col, row, col]]);
            keyDownUp('arrowdown');
          }
        }

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
    it('should move the cell selection up by the height of the table viewport', () => {
      handsontable({
        width: 180,
        height: 100, // 100/23 (default cell height) rounding down is 4. So PageUp will move up one per 4 rows
        startRows: 15,
        startCols: 3
      });

      selectCell(13, 1);
      keyDownUp('pageup');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[9, 1, 9, 1]]);

      keyDownUp('pageup');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[5, 1, 5, 1]]);

      keyDownUp('pageup');

      expect(`
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 1, 1, 1]]);

      keyDownUp('pageup');

      expect(`
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[0, 1, 0, 1]]);
    });
  });

  describe('"PageDown"', () => {
    it('should move the cell selection down by the height of the table viewport', () => {
      handsontable({
        width: 180,
        height: 100, // 100/23 (default cell height) rounding down is 4. So PageDown will move down one per 4 rows
        startRows: 15,
        startCols: 3
      });

      selectCell(1, 1);
      keyDownUp('pagedown');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[5, 1, 5, 1]]);

      keyDownUp('pagedown');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[9, 1, 9, 1]]);

      keyDownUp('pagedown');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[13, 1, 13, 1]]);

      keyDownUp('pagedown');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[14, 1, 14, 1]]);
    });
  });

  describe('"Home"', () => {
    using('document layout direction', [
      { htmlDir: 'ltr' },
      { htmlDir: 'rtl' },
    ], ({ htmlDir }) => {
      beforeEach(() => {
        $('html').attr('dir', htmlDir);
      });

      afterEach(() => {
        $('html').attr('dir', 'ltr');
      });

      describe('should move the selection to the first non-fixed cell in a row', () => {
        it('while the currently selected cell is in the main table', () => {
          handsontable({
            startRows: 5,
            startCols: 5
          });

          selectCell(3, 3);
          keyDownUp('home');

          expect(getSelected()).toEqual([[3, 0, 3, 0]]);
        });

        it('while the currently selected cell is in the top-left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(0, 0);
          keyDownUp('home');

          expect(getSelected()).toEqual([[0, 2, 0, 2]]);
        });

        it('while the currently selected cell is in the left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(1, 2);
          keyDownUp('home');

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
        });

        it('while the currently selected cell is in the bottom-left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsBottom: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(4, 0);
          keyDownUp('home');

          expect(getSelected()).toEqual([[4, 2, 4, 2]]);
        });

        it('when there is at least one cell visible in the viewport and belongs to the main table overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            startRows: 5,
            startCols: 3
          });

          selectCell(0, 0);
          keyDownUp('home');

          expect(getSelected()).toEqual([[0, 2, 0, 2]]);

          keyDownUp('home');

          expect(getSelected()).toEqual([[0, 2, 0, 2]]);
        });
      });

      describe('should not move the selection at all', () => {
        it('when the top overlay covers all table viewport', () => {
          handsontable({
            fixedRowsTop: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp('home');

          expect(getSelected()).toEqual([[2, 2, 2, 2]]);
        });

        it('when the bottom overlay covers all table viewport', () => {
          handsontable({
            fixedRowsBottom: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp('home');

          expect(getSelected()).toEqual([[2, 2, 2, 2]]);
        });

        it('when the left overlay covers all table viewport', () => {
          handsontable({
            fixedColumnsStart: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp('home');

          expect(getSelected()).toEqual([[2, 2, 2, 2]]);
        });

        it('when all overlays cover all table viewport', () => {
          handsontable({
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            fixedColumnsStart: 3,
            startRows: 4,
            startCols: 3
          });

          selectCell(1, 1);
          keyDownUp('home');

          expect(getSelected()).toEqual([[1, 1, 1, 1]]);
        });
      });
    });
  });

  describe('"Home + Ctrl/Cmd"', () => {
    using('document layout direction', [
      { htmlDir: 'ltr' },
      { htmlDir: 'rtl' },
    ], ({ htmlDir }) => {
      beforeEach(() => {
        $('html').attr('dir', htmlDir);
      });

      afterEach(() => {
        $('html').attr('dir', 'ltr');
      });

      describe('should move the selection to the first non-fixed cell of the table', () => {
        it('while the currently selected cell is in the main table', () => {
          handsontable({
            startRows: 5,
            startCols: 5
          });

          selectCell(3, 3);
          keyDownUp(['control/meta', 'home']);

          expect(getSelected()).toEqual([[0, 0, 0, 0]]);
        });

        it('while the currently selected cell is in the top-left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(0, 0);
          keyDownUp(['control/meta', 'home']);

          expect(getSelected()).toEqual([[2, 2, 2, 2]]);
        });

        it('while the currently selected cell is in the left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(1, 1);
          keyDownUp(['control/meta', 'home']);

          expect(getSelected()).toEqual([[0, 2, 0, 2]]);
        });

        it('while the currently selected cell is in the bottom-left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsBottom: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(4, 0);
          keyDownUp(['control/meta', 'home']);

          expect(getSelected()).toEqual([[0, 2, 0, 2]]);
        });

        it('when there is at least one cell visible in the viewport and belongs to the main table overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            startRows: 5,
            startCols: 3
          });

          selectCell(0, 0);
          keyDownUp(['control/meta', 'home']);

          expect(getSelected()).toEqual([[2, 2, 2, 2]]);

          keyDownUp(['control/meta', 'home']);

          expect(getSelected()).toEqual([[2, 2, 2, 2]]);
        });
      });

      describe('should not move the selection at all', () => {
        it('when the top overlay covers all table viewport', () => {
          handsontable({
            fixedRowsTop: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp(['control/meta', 'home']);

          expect(getSelected()).toEqual([[2, 2, 2, 2]]);
        });

        it('when the bottom overlay covers all table viewport', () => {
          handsontable({
            fixedRowsBottom: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp(['control/meta', 'home']);

          expect(getSelected()).toEqual([[2, 2, 2, 2]]);
        });

        it('when the left overlay covers all table viewport', () => {
          handsontable({
            fixedColumnsStart: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp(['control/meta', 'home']);

          expect(getSelected()).toEqual([[2, 2, 2, 2]]);
        });

        it('when all overlays cover all table viewport', () => {
          handsontable({
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            fixedColumnsStart: 3,
            startRows: 4,
            startCols: 3
          });

          selectCell(1, 1);
          keyDownUp(['control/meta', 'home']);

          expect(getSelected()).toEqual([[1, 1, 1, 1]]);
        });
      });
    });
  });

  describe('"End"', () => {
    using('document layout direction', [
      { htmlDir: 'ltr' },
      { htmlDir: 'rtl' },
    ], ({ htmlDir }) => {
      beforeEach(() => {
        $('html').attr('dir', htmlDir);
      });

      afterEach(() => {
        $('html').attr('dir', 'ltr');
      });

      describe('should move the selection to the last non-fixed cell in a row', () => {
        it('while the currently selected cell is in the main table', () => {
          handsontable({
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp('end');

          expect(getSelected()).toEqual([[2, 4, 2, 4]]);
        });

        it('while the currently selected cell is in the top-left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(0, 0);
          keyDownUp('end');

          expect(getSelected()).toEqual([[0, 4, 0, 4]]);
        });

        it('while the currently selected cell is in the left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(1, 1);
          keyDownUp('end');

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
        });

        it('while the currently selected cell is in the bottom-left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsBottom: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(4, 0);
          keyDownUp('end');

          expect(getSelected()).toEqual([[4, 4, 4, 4]]);
        });

        it('when there is at least one cell visible in the viewport and belongs to the main table overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            startRows: 5,
            startCols: 3
          });

          selectCell(0, 0);
          keyDownUp('end');

          expect(getSelected()).toEqual([[0, 2, 0, 2]]);

          keyDownUp('end');

          expect(getSelected()).toEqual([[0, 2, 0, 2]]);
        });
      });

      describe('should not move the selection at all', () => {
        it('when the top overlay covers all table viewport', () => {
          handsontable({
            fixedRowsTop: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp('end');

          expect(getSelected()).toEqual([[2, 2, 2, 2]]);
        });

        it('when the bottom overlay covers all table viewport', () => {
          handsontable({
            fixedRowsBottom: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp('end');

          expect(getSelected()).toEqual([[2, 2, 2, 2]]);
        });

        it('when the left overlay covers all table viewport', () => {
          handsontable({
            fixedColumnsStart: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp('end');

          expect(getSelected()).toEqual([[2, 2, 2, 2]]);
        });

        it('when all overlays cover all table viewport', () => {
          handsontable({
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            fixedColumnsStart: 3,
            startRows: 4,
            startCols: 3
          });

          selectCell(1, 1);
          keyDownUp('end');

          expect(getSelected()).toEqual([[1, 1, 1, 1]]);
        });
      });
    });
  });

  describe('"End + Ctrl/Cmd"', () => {
    using('document layout direction', [
      { htmlDir: 'ltr' },
      { htmlDir: 'rtl' },
    ], ({ htmlDir }) => {
      beforeEach(() => {
        $('html').attr('dir', htmlDir);
      });

      afterEach(() => {
        $('html').attr('dir', 'ltr');
      });

      describe('should move the selection to the last non-fixed cell of the table', () => {
        it('while the currently selected cell is in the main table', () => {
          handsontable({
            startRows: 5,
            startCols: 5
          });

          selectCell(1, 1);
          keyDownUp(['control/meta', 'end']);

          expect(getSelected()).toEqual([[4, 4, 4, 4]]);
        });

        it('while the currently selected cell is in the top-left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(0, 0);
          keyDownUp(['control/meta', 'end']);

          expect(getSelected()).toEqual([[4, 4, 4, 4]]);
        });

        it('while the currently selected cell is in the left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(1, 1);
          keyDownUp(['control/meta', 'end']);

          expect(getSelected()).toEqual([[4, 4, 4, 4]]);
        });

        it('while the currently selected cell is in the bottom-left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsBottom: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(4, 0);
          keyDownUp(['control/meta', 'end']);

          expect(getSelected()).toEqual([[2, 4, 2, 4]]);
        });

        it('when there is at least one cell visible in the viewport and belongs to the main table overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            startRows: 5,
            startCols: 3
          });

          selectCell(0, 0);
          keyDownUp(['control/meta', 'end']);

          expect(getSelected()).toEqual([[2, 2, 2, 2]]);

          keyDownUp(['control/meta', 'end']);

          expect(getSelected()).toEqual([[2, 2, 2, 2]]);
        });
      });

      describe('should not move the selection at all', () => {
        it('when the top overlay covers all table viewport', () => {
          handsontable({
            fixedRowsTop: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp(['control/meta', 'end']);

          expect(getSelected()).toEqual([[2, 2, 2, 2]]);
        });

        it('when the bottom overlay covers all table viewport', () => {
          handsontable({
            fixedRowsBottom: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp(['control/meta', 'end']);

          expect(getSelected()).toEqual([[2, 2, 2, 2]]);
        });

        it('when the left overlay covers all table viewport', () => {
          handsontable({
            fixedColumnsStart: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp(['control/meta', 'end']);

          expect(getSelected()).toEqual([[2, 2, 2, 2]]);
        });

        it('when all overlays cover all table viewport', () => {
          handsontable({
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            fixedColumnsStart: 3,
            startRows: 4,
            startCols: 3
          });

          selectCell(1, 1);
          keyDownUp(['control/meta', 'end']);

          expect(getSelected()).toEqual([[1, 1, 1, 1]]);
        });
      });
    });
  });
});
