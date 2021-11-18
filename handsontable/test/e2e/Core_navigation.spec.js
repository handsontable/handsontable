describe('Core_navigation LTR', () => {
  const id = 'testContainer';
  const ARROW_NEXT_COLUMN = ['arrowright'];
  const ARROW_PREV_COLUMN = ['arrowleft'];

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should move to the next cell', () => {
    handsontable({
      startRows: 5,
      startCols: 5
    });

    selectCell(0, 0);
    keyDown(ARROW_NEXT_COLUMN);

    expect(getSelected()).toEqual([[0, 1, 0, 1]]);
  });

  it('should move to the previous cell', () => {
    handsontable({
      startRows: 5,
      startCols: 5
    });

    selectCell(1, 2);
    keyDown(ARROW_PREV_COLUMN);

    expect(getSelected()).toEqual([[1, 1, 1, 1]]);
  });

  it('should move to the cell above', () => {
    handsontable({
      startRows: 5,
      startCols: 5
    });

    selectCell(1, 2);
    keyDownUp(['arrowup']);

    expect(getSelected()).toEqual([[0, 2, 0, 2]]);
  });

  it('should move to the cell below', () => {
    handsontable({
      startRows: 5,
      startCols: 5
    });

    selectCell(1, 2);
    keyDownUp(['arrowdown']);

    expect(getSelected()).toEqual([[2, 2, 2, 2]]);
  });

  describe('autoWrap disabled', () => {
    it('should NOT move to the next cell, if already at the last cell in row', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: false
      });

      selectCell(0, 4);
      keyDown(ARROW_NEXT_COLUMN);

      expect(getSelected()).toEqual([[0, 4, 0, 4]]);
    });

    it('should NOT move to the previous cell, if already at the first cell in row', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: false
      });

      selectCell(1, 0);
      keyDown(ARROW_PREV_COLUMN);

      expect(getSelected()).toEqual([[1, 0, 1, 0]]);
    });

    it('should NOT move to the cell below, if already at the last cell in column', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: false
      });

      selectCell(4, 0);
      keyDownUp(['arrowdown']);

      expect(getSelected()).toEqual([[4, 0, 4, 0]]);
    });

    it('should NOT move to the cell above, if already at the first cell in column', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: false
      });

      selectCell(0, 1);
      keyDownUp(['arrowup']);

      expect(getSelected()).toEqual([[0, 1, 0, 1]]);
    });

  });

  describe('autoWrap enabled', () => {
    it('should move to the first cell of the next row, if already at the last cell in row', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: true
      });

      selectCell(0, 4);
      keyDown(ARROW_NEXT_COLUMN);

      expect(getSelected()).toEqual([[1, 0, 1, 0]]);
    });

    it('should move to the first cell of the previous row, if already at the first cell in row', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: true
      });

      selectCell(1, 0);
      keyDown(ARROW_PREV_COLUMN);

      expect(getSelected()).toEqual([[0, 4, 0, 4]]);
    });

    it('should move to the first cell of the next column, if already at the last cell in column', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: true
      });

      selectCell(4, 1);
      keyDownUp(['arrowdown']);

      expect(getSelected()).toEqual([[0, 2, 0, 2]]);
    });

    it('should move to the last cell of the previous column, if already at the first cell in column', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: true
      });

      selectCell(0, 1);
      keyDownUp(['arrowup']);

      expect(getSelected()).toEqual([[4, 0, 4, 0]]);
    });

    it('should move to the first cell of the first row, after trying to get to the next cell in row, being already at the last cell in table', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: true
      });

      selectCell(4, 4);
      keyDown(ARROW_NEXT_COLUMN);

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    });

    it('should move to the first cell of the first row, after trying to get to the next cell in column, being already at the last cell in table', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: true
      });

      selectCell(4, 4);
      keyDownUp(['arrowdown']);

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    });

    it('should move to the last cell of the last row, after trying to get to the previous cell in row, being already at the first cell in table', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: true
      });

      selectCell(0, 0);
      keyDown(ARROW_PREV_COLUMN);

      expect(getSelected()).toEqual([[4, 4, 4, 4]]);
    });

    it('should move to the last cell of the last row, after trying to get to the previous cell in column, being already at the first cell in table', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: true
      });

      selectCell(0, 0);
      keyDownUp(['arrowup']);

      expect(getSelected()).toEqual([[4, 4, 4, 4]]);
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
          keyDown(ARROW_NEXT_COLUMN);
        }
      }

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
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
          keyDown(ARROW_PREV_COLUMN);
        }
      }

      expect(getSelected()).toEqual([[4, 4, 4, 4]]);
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
          keyDownUp(['arrowdown']);
        }
      }

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
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
          keyDownUp(['arrowup']);
        }
      }

      expect(getSelected()).toEqual([[4, 4, 4, 4]]);
    });
  });
});
describe('Core_navigation RTL', () => {
  const id = 'testContainer';
  const ARROW_NEXT_COLUMN = 'arrow_left';
  const ARROW_PREV_COLUMN = 'arrow_right';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
    $('html').attr('dir', 'ltr');
  });

  it('should move to the next cell', () => {
    handsontable({
      startRows: 5,
      startCols: 5
    });

    selectCell(0, 0);
    keyDown(ARROW_NEXT_COLUMN);

    expect(getSelected()).toEqual([[0, 1, 0, 1]]);
  });
  it('should move to the previous cell', () => {
    handsontable({
      startRows: 5,
      startCols: 5
    });

    selectCell(1, 2);
    keyDown(ARROW_PREV_COLUMN);

    expect(getSelected()).toEqual([[1, 1, 1, 1]]);
  });

  it('should move to the cell above', () => {
    handsontable({
      startRows: 5,
      startCols: 5
    });

    selectCell(1, 2);
    keyDownUp(['arrowup']);

    expect(getSelected()).toEqual([[0, 2, 0, 2]]);
  });

  it('should move to the cell below', () => {
    handsontable({
      startRows: 5,
      startCols: 5
    });

    selectCell(1, 2);
    keyDownUp(['arrowdown']);

    expect(getSelected()).toEqual([[2, 2, 2, 2]]);
  });

  describe('autoWrap disabled', () => {
    it('should NOT move to the next cell, if already at the last cell in row', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: false
      });

      selectCell(0, 4);
      keyDown(ARROW_NEXT_COLUMN);

      expect(getSelected()).toEqual([[0, 4, 0, 4]]);
    });

    it('should NOT move to the previous cell, if already at the first cell in row', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: false
      });

      selectCell(1, 0);
      keyDown(ARROW_PREV_COLUMN);

      expect(getSelected()).toEqual([[1, 0, 1, 0]]);
    });

    it('should NOT move to the cell below, if already at the last cell in column', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: false
      });

      selectCell(4, 0);
      keyDownUp(['arrowdown']);

      expect(getSelected()).toEqual([[4, 0, 4, 0]]);
    });

    it('should NOT move to the cell above, if already at the first cell in column', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: false
      });

      selectCell(0, 1);
      keyDownUp(['arrowup']);

      expect(getSelected()).toEqual([[0, 1, 0, 1]]);
    });

  });

  describe('autoWrap enabled', () => {
    it('should move to the first cell of the next row, if already at the last cell in row', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: true
      });

      selectCell(0, 4);
      keyDown(ARROW_NEXT_COLUMN);

      expect(getSelected()).toEqual([[1, 0, 1, 0]]);
    });

    it('should move to the first cell of the previous row, if already at the first cell in row', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: true
      });

      selectCell(1, 0);
      keyDown(ARROW_PREV_COLUMN);

      expect(getSelected()).toEqual([[0, 4, 0, 4]]);
    });

    it('should move to the first cell of the next column, if already at the last cell in column', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: true
      });

      selectCell(4, 1);
      keyDownUp(['arrowdown']);

      expect(getSelected()).toEqual([[0, 2, 0, 2]]);
    });

    it('should move to the last cell of the previous column, if already at the first cell in column', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: true
      });

      selectCell(0, 1);
      keyDownUp(['arrowup']);

      expect(getSelected()).toEqual([[4, 0, 4, 0]]);
    });

    it('should move to the first cell of the first row, after trying to get to the next cell in row, being already at the last cell in table', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: true
      });

      selectCell(4, 4);
      keyDown(ARROW_NEXT_COLUMN);

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    });

    it('should move to the first cell of the first row, after trying to get to the next cell in column, being already at the last cell in table', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: true
      });

      selectCell(4, 4);
      keyDownUp(['arrowdown']);

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    });

    it('should move to the last cell of the last row, after trying to get to the previous cell in row, being already at the first cell in table', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: true
      });

      selectCell(0, 0);
      keyDown(ARROW_PREV_COLUMN);

      expect(getSelected()).toEqual([[4, 4, 4, 4]]);
    });

    it('should move to the last cell of the last row, after trying to get to the previous cell in column, being already at the first cell in table', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: true
      });

      selectCell(0, 0);
      keyDownUp(['arrowup']);

      expect(getSelected()).toEqual([[4, 4, 4, 4]]);
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
          keyDown(ARROW_NEXT_COLUMN);
        }
      }

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
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
          keyDown(ARROW_PREV_COLUMN);
        }
      }

      expect(getSelected()).toEqual([[4, 4, 4, 4]]);
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
          keyDownUp(['arrowdown']);
        }
      }

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
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
          keyDownUp(['arrowup']);
        }
      }

      expect(getSelected()).toEqual([[4, 4, 4, 4]]);
    });
  });
});
