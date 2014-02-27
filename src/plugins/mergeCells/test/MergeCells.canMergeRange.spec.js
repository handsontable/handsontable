describe("handsontable.MergeCells", function () {
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

  describe("canMergeRange", function () {
    it("should return false if start and end cell is the same", function () {
      var hot = handsontable({
        data: createSpreadsheetObjectData(10, 5)
      });
      var mergeCells = new Handsontable.MergeCells(hot);
      var cellRange = new WalkontableCellRange(new WalkontableCellCoords(0, 1), new WalkontableCellCoords(0, 1));
      var result = mergeCells.canMergeRange(cellRange);
      expect(result).toBe(false);
    });

    it("should return true for 2 consecutive cells in the same column", function () {
      var hot = handsontable({
        data: createSpreadsheetObjectData(10, 5)
      });
      var mergeCells = new Handsontable.MergeCells(hot);
      var cellRange = new WalkontableCellRange(new WalkontableCellCoords(0, 1), new WalkontableCellCoords(1, 1));
      var result = mergeCells.canMergeRange(cellRange);
      expect(result).toBe(true);
    });

    it("should return true for 2 consecutive cells in the same row", function () {
      var hot = handsontable({
        data: createSpreadsheetObjectData(10, 5)
      });
      var mergeCells = new Handsontable.MergeCells(hot);
      var cellRange = new WalkontableCellRange(new WalkontableCellCoords(0, 1), new WalkontableCellCoords(0, 2));
      var result = mergeCells.canMergeRange(cellRange);
      expect(result).toBe(true);
    });

    it("should return true for 4 neighboring cells", function () {
      var hot = handsontable({
        data: createSpreadsheetObjectData(10, 5)
      });
      var mergeCells = new Handsontable.MergeCells(hot);
      var cellRange = new WalkontableCellRange(new WalkontableCellCoords(0, 1), new WalkontableCellCoords(1, 2));
      var result = mergeCells.canMergeRange(cellRange);
      expect(result).toBe(true);
    });
  });
})
;