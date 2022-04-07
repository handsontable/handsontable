describe('Core_navigation', () => {
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

  describe('"ArrowRight" keyboard shortcut', () => {
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

  describe('"ArrowLeft" keyboard shortcut', () => {
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

  describe('"ArrowUp" keyboard shortcut', () => {
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

  describe('"ArrowDown" keyboard shortcut', () => {
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

  describe('"PageUp" keyboard shortcut', () => {
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

  describe('"PageDown" keyboard shortcut', () => {
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

  describe('"Home" keyboard shortcut', () => {
    it('should move the selection to the first non-fixed cell in a row', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(3, 3);
      keyDownUp('home');

      expect(getSelected()).toEqual([[3, 0, 3, 0]]);
    });
  });

  describe('"Ctrl/Cmd + Home" keyboard shortcut', () => {
    it('should move the selection to the first non-fixed cell of the table (top-left corner)', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(3, 3);
      keyDownUp(['control/meta', 'home']);

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    });
  });

  describe('"End" keyboard shortcut', () => {
    it('should move the selection to the last non-fixed cell in a row', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(3, 1);
      keyDownUp('end');

      expect(getSelected()).toEqual([[3, 4, 3, 4]]);
    });
  });

  describe('"Ctrl/Cmd + End" keyboard shortcut', () => {
    it('should move the selection to the last non-fixed cell of the table (bottom-right corner)', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 1);
      keyDownUp(['control/meta', 'end']);

      expect(getSelected()).toEqual([[4, 4, 4, 4]]);
    });
  });
});
