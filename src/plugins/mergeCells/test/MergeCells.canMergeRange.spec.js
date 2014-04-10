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

  describe("mergeCells option", function () {
    it("should merge cell in startup", function () {
      var hot = handsontable({
        data: createSpreadsheetObjectData(10, 5),
        mergeCells: [
          {row: 0, col: 0, rowspan: 2, colspan: 2}
        ]
      });
      var TD = hot.rootElement[0].querySelector('td');
      expect(TD.getAttribute('rowspan')).toBe('2');
      expect(TD.getAttribute('colspan')).toBe('2');
    })
  });

  describe("merged cells selection", function () {

    it("should select the whole range of cells which form a merged cell", function () {
      var hot = handsontable({
        data: createSpreadsheetObjectData(4, 4),
        mergeCells: [
          {
            row: 0,
            col: 0,
            colspan: 4,
            rowspan: 1
          }
        ]
      });

      var $table = this.$container.find('table.htCore');
      var $td = $table.find('tr:eq(0) td:eq(0)');

      expect($td.attr('rowspan')).toEqual('1');
      expect($td.attr('colspan')).toEqual('4');

      expect(hot.getSelected()).toBeUndefined();

      hot.selectCell(0, 0);

      expect(hot.getSelected()).toEqual([0, 0, 0, 3]);

      deselectCell();

      hot.selectCell(0, 1);

      expect(hot.getSelected()).toEqual([0, 0, 0, 3]);
    });

    it("should always make a rectangular selection, when selecting merged and not merged cells", function () {
      var hot = handsontable({
        data: createSpreadsheetObjectData(4, 4),
        mergeCells: [
          {
            row: 1,
            col: 1,
            colspan: 3,
            rowspan: 2
          }
        ]
      });

      var $table = this.$container.find('table.htCore');
      var $td = $table.find('tr:eq(1) td:eq(1)');

      expect($td.attr('rowspan')).toEqual('2');
      expect($td.attr('colspan')).toEqual('3');

      expect(hot.getSelected()).toBeUndefined();


      hot.selectCell(0, 0);

      expect(hot.getSelected()).toEqual([0, 0, 0, 0]);

      deselectCell();

      hot.selectCell(0, 0, 1, 1);

      expect(hot.getSelected()).not.toEqual([0, 0, 1, 1]);
      expect(hot.getSelected()).toEqual([0, 0, 2, 3]);

      deselectCell();

      hot.selectCell(0, 1, 1, 1);

      expect(hot.getSelected()).toEqual([0, 1, 2, 3]);


    });

  });

  describe("modifyTransform", function () {

    it("should not transform arrow right when entering merged cell", function () {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 2, colspan: 2}
      ];
      var coords = new WalkontableCellCoords(1, 0);
      var currentSelection = new WalkontableCellRange(coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = 1;
      var outDelta = mergeCells.modifyTransform("modifyTransformStartCol", currentSelection, inDelta);
      expect(outDelta).toBe(inDelta);
    });

    it("should transform arrow right when inside merged cell", function () {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 2, colspan: 2}
      ];
      var coords = new WalkontableCellCoords(1, 1);
      var currentSelection = new WalkontableCellRange(coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = 1;
      var outDelta = mergeCells.modifyTransform("modifyTransformStartCol", currentSelection, inDelta);
      expect(outDelta).toBe(inDelta + 1);
    });

    it("should not transform arrow right when at the edge of the merged cell", function () {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 2, colspan: 2}
      ];
      var coords = new WalkontableCellCoords(1, 2);
      var currentSelection = new WalkontableCellRange(coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = 1;
      var outDelta = mergeCells.modifyTransform("modifyTransformStartCol", currentSelection, inDelta);
      expect(outDelta).toBe(inDelta);
    });

    it("should not transform arrow left when entering merged cell", function () {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 2, colspan: 2}
      ];
      var coords = new WalkontableCellCoords(1, 3);
      var currentSelection = new WalkontableCellRange(coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = -1;
      var outDelta = mergeCells.modifyTransform("modifyTransformStartCol", currentSelection, inDelta);
      expect(outDelta).toBe(inDelta);
    });

    it("should transform arrow left when inside merged cell", function () {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 2, colspan: 2}
      ];
      var coords = new WalkontableCellCoords(1, 2);
      var currentSelection = new WalkontableCellRange(coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = -1;
      var outDelta = mergeCells.modifyTransform("modifyTransformStartCol", currentSelection, inDelta);
      expect(outDelta).toBe(inDelta - 1);
    });

    it("should not transform arrow left when at the edge of the merged cell", function () {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 2, colspan: 2}
      ];
      var coords = new WalkontableCellCoords(1, 1);
      var currentSelection = new WalkontableCellRange(coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = -1;
      var outDelta = mergeCells.modifyTransform("modifyTransformStartCol", currentSelection, inDelta);
      expect(outDelta).toBe(inDelta);
    });

    it("should not transform arrow down when entering merged cell", function () {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 2, colspan: 2}
      ];
      var coords = new WalkontableCellCoords(0, 1);
      var currentSelection = new WalkontableCellRange(coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = 1;
      var outDelta = mergeCells.modifyTransform("modifyTransformStartRow", currentSelection, inDelta);
      expect(outDelta).toBe(inDelta);
    });

    it("should transform arrow down when inside merged cell", function () {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 2, colspan: 2}
      ];
      var coords = new WalkontableCellCoords(1, 1);
      var currentSelection = new WalkontableCellRange(coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = 1;
      var outDelta = mergeCells.modifyTransform("modifyTransformStartRow", currentSelection, inDelta);
      expect(outDelta).toBe(inDelta + 1);
    });

    it("should not transform arrow down when at the edge of the merged cell", function () {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 2, colspan: 2}
      ];
      var coords = new WalkontableCellCoords(2, 1);
      var currentSelection = new WalkontableCellRange(coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = 1;
      var outDelta = mergeCells.modifyTransform("modifyTransformStartRow", currentSelection, inDelta);
      expect(outDelta).toBe(inDelta);
    });

    it("should not transform arrow up when entering merged cell", function () {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 2, colspan: 2}
      ];
      var coords = new WalkontableCellCoords(3, 1);
      var currentSelection = new WalkontableCellRange(coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = -1;
      var outDelta = mergeCells.modifyTransform("modifyTransformStartRow", currentSelection, inDelta);
      expect(outDelta).toBe(inDelta);
    });

    it("should transform arrow up when inside merged cell", function () {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 2, colspan: 2}
      ];
      var coords = new WalkontableCellCoords(2, 1);
      var currentSelection = new WalkontableCellRange(coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = -1;
      var outDelta = mergeCells.modifyTransform("modifyTransformStartRow", currentSelection, inDelta);
      expect(outDelta).toBe(inDelta - 1);
    });

    it("should not transform arrow up when at the edge of the merged cell", function () {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 2, colspan: 2}
      ];
      var coords = new WalkontableCellCoords(1, 1);
      var currentSelection = new WalkontableCellRange(coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = -1;
      var outDelta = mergeCells.modifyTransform("modifyTransformStartRow", currentSelection, inDelta);
      expect(outDelta).toBe(inDelta);
    });

  });
})
;