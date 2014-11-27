describe('Core_navigation', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it("should move to the next cell", function () {
    handsontable({
      startRows: 5,
      startCols: 5
    });

    selectCell(0, 0);
    keyDown('arrow_right');

    expect(getSelected()).toEqual([0, 1, 0, 1]);
  });

  it("should move to the previous cell", function () {
    handsontable({
      startRows: 5,
      startCols: 5
    });

    selectCell(1, 2);
    keyDown('arrow_left');

    expect(getSelected()).toEqual([1, 1, 1, 1]);
  });

  it("should move to the cell above", function () {
    handsontable({
      startRows: 5,
      startCols: 5
    });

    selectCell(1, 2);
    keyDown('arrow_up');

    expect(getSelected()).toEqual([0, 2, 0, 2]);
  });

  it("should move to the cell below", function () {
    handsontable({
      startRows: 5,
      startCols: 5
    });

    selectCell(1, 2);
    keyDown('arrow_down');

    expect(getSelected()).toEqual([2, 2, 2, 2]);
  });

  describe("autoWrap disabled", function () {
    it("should NOT move to the next cell, if already at the last cell in row", function () {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: false
      });

      selectCell(0, 4);
      keyDown('arrow_right');

      expect(getSelected()).toEqual([0, 4, 0, 4]);
    });

    it("should NOT move to the previous cell, if already at the first cell in row", function () {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: false
      });

      selectCell(1, 0);
      keyDown('arrow_left');

      expect(getSelected()).toEqual([1, 0, 1, 0]);
    });

    it("should NOT move to the cell below, if already at the last cell in column", function () {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: false
      });

      selectCell(4, 0);
      keyDown('arrow_down');

      expect(getSelected()).toEqual([4, 0, 4, 0]);
    });

    it("should NOT move to the cell above, if already at the first cell in column", function () {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: false
      });

      selectCell(0, 1);
      keyDown('arrow_up');

      expect(getSelected()).toEqual([0, 1, 0, 1]);
    });

  });

  describe("autoWrap enabled", function () {
    it("should move to the first cell of the next row, if already at the last cell in row", function () {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: true
      });

      selectCell(0, 4);
      keyDown('arrow_right');

      expect(getSelected()).toEqual([1, 0, 1, 0]);
    });

    it("should move to the first cell of the previous row, if already at the first cell in row", function () {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: true
      });

      selectCell(1, 0);
      keyDown('arrow_left');

      expect(getSelected()).toEqual([0, 4, 0, 4]);
    });

    it("should move to the first cell of the next column, if already at the last cell in column", function () {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: true
      });

      selectCell(4, 1);
      keyDown('arrow_down');

      expect(getSelected()).toEqual([0, 2, 0, 2]);
    });

    it("should move to the last cell of the previous column, if already at the first cell in column", function () {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: true
      });

      selectCell(0, 1);
      keyDown('arrow_up');

      expect(getSelected()).toEqual([4, 0, 4, 0]);
    });

    it("should move to the first cell of the first row, after trying to get to the next cell in row, being already at the last cell in table", function () {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: true
      });

      selectCell(4, 4);
      keyDown('arrow_right');

      expect(getSelected()).toEqual([0, 0, 0, 0]);
    });

    it("should move to the first cell of the first row, after trying to get to the next cell in column, being already at the last cell in table", function () {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: true
      });

      selectCell(4, 4);
      keyDown('arrow_down');

      expect(getSelected()).toEqual([0, 0, 0, 0]);
    });

    it("should move to the last cell of the last row, after trying to get to the previous cell in row, being already at the first cell in table", function () {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: true
      });

      selectCell(0, 0);
      keyDown('arrow_left');

      expect(getSelected()).toEqual([4, 4, 4, 4]);
    });

    it("should move to the last cell of the last row, after trying to get to the previous cell in column, being already at the first cell in table", function () {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: true
      });

      selectCell(0, 0);
      keyDown('arrow_up');

      expect(getSelected()).toEqual([4, 4, 4, 4]);
    });

    it("should traverse whole table by constantly selecting next cell in row", function () {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: true
      });

      selectCell(0, 0);

      for (var row = 0, rlen = countRows(); row < rlen; row++) {
        for (var col = 0, clen = countCols(); col < clen; col++) {
          expect(getSelected()).toEqual([row, col, row, col]);
          keyDown('arrow_right');
        }
      }

      expect(getSelected()).toEqual([0, 0, 0, 0]);
    });

    it("should traverse whole table by constantly selecting previous cell in row", function () {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapRow: true
      });

      selectCell(4, 4);

      for (var row = countRows() - 1; row >= 0; row--) {
        for (var col = countCols() - 1; col >= 0; col--) {
          expect(getSelected()).toEqual([row, col, row, col]);
          keyDown('arrow_left');
        }
      }

      expect(getSelected()).toEqual([4, 4, 4, 4]);
    });

    it("should traverse whole table by constantly selecting next cell in column", function () {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: true
      });

      selectCell(0, 0);

      for (var col = 0, clen = countCols(); col < clen; col++) {
        for (var row = 0, rlen = countRows(); row < rlen; row++) {
          expect(getSelected()).toEqual([row, col, row, col]);
          keyDown('arrow_down');
        }
      }

      expect(getSelected()).toEqual([0, 0, 0, 0]);
    });

    it("should traverse whole table by constantly selecting previous cell in column", function () {
      handsontable({
        startRows: 5,
        startCols: 5,
        autoWrapCol: true
      });

      selectCell(4, 4);

      for (var col = countCols() - 1; col >= 0; col--) {
        for (var row = countRows() - 1; row >= 0; row--) {
          expect(getSelected()).toEqual([row, col, row, col]);
          keyDown('arrow_up');
        }
      }

      expect(getSelected()).toEqual([4, 4, 4, 4]);
    });


  });

});
