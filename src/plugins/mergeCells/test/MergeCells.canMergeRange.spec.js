describe("handsontable.MergeCells", function() {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe("canMergeRange", function() {
    it("should return false if start and end cell is the same", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5)
      });
      var mergeCells = new Handsontable.MergeCells(hot);
      var coordsFrom = new WalkontableCellCoords(0, 1);
      var cellRange = new WalkontableCellRange(coordsFrom, coordsFrom, new WalkontableCellCoords(0, 1));
      var result = mergeCells.canMergeRange(cellRange);
      expect(result).toBe(false);
    });

    it("should return true for 2 consecutive cells in the same column", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5)
      });
      var mergeCells = new Handsontable.MergeCells(hot);
      var coordsFrom = new WalkontableCellCoords(0, 1);
      var cellRange = new WalkontableCellRange(coordsFrom, coordsFrom, new WalkontableCellCoords(1, 1));
      var result = mergeCells.canMergeRange(cellRange);
      expect(result).toBe(true);
    });

    it("should return true for 2 consecutive cells in the same row", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5)
      });
      var mergeCells = new Handsontable.MergeCells(hot);
      var coordsFrom = new WalkontableCellCoords(0, 1);
      var cellRange = new WalkontableCellRange(coordsFrom, coordsFrom, new WalkontableCellCoords(0, 2));
      var result = mergeCells.canMergeRange(cellRange);
      expect(result).toBe(true);
    });

    it("should return true for 4 neighboring cells", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5)
      });
      var mergeCells = new Handsontable.MergeCells(hot);
      var coordsFrom = new WalkontableCellCoords(0, 1);
      var cellRange = new WalkontableCellRange(coordsFrom, coordsFrom, new WalkontableCellCoords(1, 2));
      var result = mergeCells.canMergeRange(cellRange);
      expect(result).toBe(true);
    });
  });

  describe("mergeCells option", function() {
    it("should merge cell in startup", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
        mergeCells: [
          {row: 0, col: 0, rowspan: 2, colspan: 2}
        ]
      });
      var TD = hot.rootElement.querySelector('td');
      expect(TD.getAttribute('rowspan')).toBe('2');
      expect(TD.getAttribute('colspan')).toBe('2');
    });
  });

  describe("mergeCells updateSettings", function() {
    it("should allow to overwrite the initial settings using the updateSettings method", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
        mergeCells: [
          {row: 0, col: 0, rowspan: 2, colspan: 2}
        ]
      });
      var TD = hot.rootElement.querySelector('td');
      expect(TD.getAttribute('rowspan')).toBe('2');
      expect(TD.getAttribute('colspan')).toBe('2');

      updateSettings({
        mergeCells: [
          {row: 2, col: 2, rowspan: 2, colspan: 2}
        ]
      });

      var TD = hot.rootElement.querySelector('td');
      expect(TD.getAttribute('rowspan')).toBe(null);
      expect(TD.getAttribute('colspan')).toBe(null);

      TD = getCell(2,2);

      expect(TD.getAttribute('rowspan')).toBe('2');
      expect(TD.getAttribute('colspan')).toBe('2');
    });

    it("should allow resetting the merged cells by changing it to 'true'", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
        mergeCells: [
          {row: 0, col: 0, rowspan: 2, colspan: 2}
        ]
      });
      var TD = hot.rootElement.querySelector('td');
      expect(TD.getAttribute('rowspan')).toBe('2');
      expect(TD.getAttribute('colspan')).toBe('2');

      updateSettings({
        mergeCells: true
      });

      var TD = hot.rootElement.querySelector('td');
      expect(TD.getAttribute('rowspan')).toBe(null);
      expect(TD.getAttribute('colspan')).toBe(null);
    });

    it("should allow resetting and turning off the mergeCells plugin by changing mergeCells to 'false'", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
        mergeCells: [
          {row: 0, col: 0, rowspan: 2, colspan: 2}
        ]
      });
      var TD = hot.rootElement.querySelector('td');
      expect(TD.getAttribute('rowspan')).toBe('2');
      expect(TD.getAttribute('colspan')).toBe('2');

      updateSettings({
        mergeCells: false
      });

      var TD = hot.rootElement.querySelector('td');
      expect(TD.getAttribute('rowspan')).toBe(null);
      expect(TD.getAttribute('colspan')).toBe(null);
    });

  });

  describe("mergeCells copy", function() {
    it("should not copy text of cells that are merged into another cell", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
        mergeCells: [
          {row: 0, col: 0, rowspan: 2, colspan: 2}
        ]
      });
      expect(hot.getCopyableText(0, 0, 2, 2)).toBe("A1\t\tC1\n\t\tC2\nA3\tB3\tC3\n");
    });
  });

  describe("merged cells selection", function() {

    it("should select the whole range of cells which form a merged cell", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(4, 4),
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

    it("should always make a rectangular selection, when selecting merged and not merged cells", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(4, 4),
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

    it("should not switch the selection start point when selecting from non-merged cells to merged cells", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
        mergeCells: [
          {row: 1, col: 1, rowspan: 3, colspan: 3},
          {row: 3, col: 4, rowspan: 2, colspan: 2}
        ]
      });

      $(hot.getCell(6, 6)).simulate('mousedown');

      expect(hot.getSelectedRange().from.col).toEqual(6);
      expect(hot.getSelectedRange().from.row).toEqual(6);

      $(hot.getCell(1, 1)).simulate('mouseenter');

      expect(hot.getSelectedRange().from.col).toEqual(6);
      expect(hot.getSelectedRange().from.row).toEqual(6);

      $(hot.getCell(3, 3)).simulate('mouseenter');

      expect(hot.getSelectedRange().from.col).toEqual(6);
      expect(hot.getSelectedRange().from.row).toEqual(6);

      $(hot.getCell(4, 4)).simulate('mouseenter');

      expect(hot.getSelectedRange().from.col).toEqual(6);
      expect(hot.getSelectedRange().from.row).toEqual(6);

    });

    it("should select cells in the correct direction when changing selections around a merged range", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
        mergeCells: [
          {row: 4, col: 4, rowspan: 2, colspan: 2}
        ]
      });

      hot.selectCell(5, 5, 5, 2);
      expect(hot.getSelectedRange().getDirection()).toEqual("SE-NW");

      hot.selectCell(4, 4, 2, 5);
      expect(hot.getSelectedRange().getDirection()).toEqual("SW-NE");

      hot.selectCell(4, 4, 5, 7);
      expect(hot.getSelectedRange().getDirection()).toEqual("NW-SE");

      hot.selectCell(4, 5, 7, 5);
      expect(hot.getSelectedRange().getDirection()).toEqual("NE-SW");
    });

    it("should not add an area class to the selected cell if a single merged cell is selected", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(6, 6),
        mergeCells: [
          {
            row: 1,
            col: 1,
            colspan: 3,
            rowspan: 2
          }
        ]
      });

      selectCell(1, 1);
      expect(getCell(1, 1).className.indexOf('area')).toEqual(-1);

      selectCell(1, 1, 4, 4);
      expect(getCell(1, 1).className.indexOf('area')).toNotEqual(-1);

      selectCell(1, 1);
      expect(getCell(1, 1).className.indexOf('area')).toEqual(-1);

      selectCell(0, 0);
      expect(getCell(1, 1).className.indexOf('area')).toEqual(-1);

    });

  });

  describe("modifyTransform", function() {

    it("should not transform arrow right when entering a merged cell", function() {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var coords = new WalkontableCellCoords(1, 0);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = new WalkontableCellCoords(0, 1);
      mergeCells.modifyTransform("modifyTransformStart", currentSelection, inDelta);
      expect(inDelta).toEqual(new WalkontableCellCoords(0, 1));
    });

    it("should transform arrow right when leaving a merged cell", function() {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var coords = new WalkontableCellCoords(1, 1);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = new WalkontableCellCoords(0, 1);
      mergeCells.modifyTransform("modifyTransformStart", currentSelection, inDelta);
      expect(inDelta).toEqual(new WalkontableCellCoords(0, 3));
    });

    it("should transform arrow right when leaving a merged cell (return to desired row)", function() {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);

      var coords = new WalkontableCellCoords(2, 0);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var inDelta = new WalkontableCellCoords(0, 1);
      mergeCells.modifyTransform("modifyTransformStart", currentSelection, inDelta);
      expect(inDelta).toEqual(new WalkontableCellCoords(-1, 1));

      var coords = new WalkontableCellCoords(1, 1);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var inDelta = new WalkontableCellCoords(0, 1);
      mergeCells.modifyTransform("modifyTransformStart", currentSelection, inDelta);
      expect(inDelta).toEqual(new WalkontableCellCoords(1, 3));
    });

    it("should transform arrow left when entering a merged cell", function() {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var coords = new WalkontableCellCoords(1, 4);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = new WalkontableCellCoords(0, -1);
      mergeCells.modifyTransform("modifyTransformStart", currentSelection, inDelta);
      expect(inDelta).toEqual(new WalkontableCellCoords(0, -3));
    });

    it("should not transform arrow left when leaving a merged cell", function() {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var coords = new WalkontableCellCoords(1, 1);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = new WalkontableCellCoords(0, -1);
      mergeCells.modifyTransform("modifyTransformStart", currentSelection, inDelta);
      expect(inDelta).toEqual(new WalkontableCellCoords(0, -1));
    });

    it("should transform arrow left when leaving a merged cell (return to desired row)", function() {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);

      var coords = new WalkontableCellCoords(2, 4);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var inDelta = new WalkontableCellCoords(0, -1);
      mergeCells.modifyTransform("modifyTransformStart", currentSelection, inDelta);
      expect(inDelta).toEqual(new WalkontableCellCoords(-1, -3));

      var coords = new WalkontableCellCoords(1, 1);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var inDelta = new WalkontableCellCoords(0, -1);
      mergeCells.modifyTransform("modifyTransformStart", currentSelection, inDelta);
      expect(inDelta).toEqual(new WalkontableCellCoords(1, -1));
    });

    it("should not transform arrow down when entering a merged cell", function() {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var coords = new WalkontableCellCoords(0, 1);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = new WalkontableCellCoords(0, -1);
      mergeCells.modifyTransform("modifyTransformStart", currentSelection, inDelta);
      expect(inDelta).toEqual(new WalkontableCellCoords(0, -1));
    });

    it("should transform arrow down when leaving a merged cell", function() {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var coords = new WalkontableCellCoords(1, 1);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = new WalkontableCellCoords(1, 0);
      mergeCells.modifyTransform("modifyTransformStart", currentSelection, inDelta);
      expect(inDelta).toEqual(new WalkontableCellCoords(3, 0));
    });

    it("should transform arrow up when entering a merged cell", function() {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var coords = new WalkontableCellCoords(4, 1);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = new WalkontableCellCoords(-1, 0);
      mergeCells.modifyTransform("modifyTransformStart", currentSelection, inDelta);
      expect(inDelta).toEqual(new WalkontableCellCoords(-3, 0));
    });

    it("should not transform arrow up when leaving a merged cell", function() {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var coords = new WalkontableCellCoords(1, 1);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = new WalkontableCellCoords(-1, 0);
      mergeCells.modifyTransform("modifyTransformStart", currentSelection, inDelta);
      expect(inDelta).toEqual(new WalkontableCellCoords(-1, 0));
    });

  });

  describe("merged cells scroll", function() {
    it("getCell should return merged cell parent", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
        mergeCells: [
          {row: 0, col: 0, rowspan: 2, colspan: 2}
        ],
        height: 100,
        width: 400
      });

      var mergedCellParent = hot.getCell(0, 0);
      var mergedCellHidden = hot.getCell(1, 1);

      expect(mergedCellHidden).toBe(mergedCellParent);
    });

    it("should scroll viewport to beginning of a merged cell when it's clicked", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
        mergeCells: [
          {row: 5, col: 0, rowspan: 2, colspan: 2}
        ],
        height: 100,
        width: 400
      });

      var mainHolder = hot.view.wt.wtTable.holder;

      mainHolder.scrollTop = 130;
      hot.render();

      expect(mainHolder.scrollTop).toBe(130);

      var TD = hot.getCell(5, 0);
      mouseDown(TD);
      mouseUp(TD);
      var mergedCellScrollTop = mainHolder.scrollTop;
      expect(mergedCellScrollTop).toBeLessThan(130);
      expect(mergedCellScrollTop).toBeGreaterThan(0);

      mainHolder.scrollTop = 0;
      hot.render();

      mainHolder.scrollTop = 130;
      hot.render();

      TD = hot.getCell(5, 2);
      mouseDown(TD);
      mouseUp(TD);
      var regularCellScrollTop = mainHolder.scrollTop;
      expect(mergedCellScrollTop).toBe(regularCellScrollTop);
    });

    it("should render whole merged cell even when most rows are not in the viewport - scrolled to top", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(40, 5),
        mergeCells: [
          {row: 1, col: 0, rowspan: 21, colspan: 2},
          {row: 21, col: 2, rowspan: 18, colspan: 2}
        ],
        height: 100,
        width: 400
      });

      expect(hot.countRenderedRows()).toBe(39);
    });

    it("should render whole merged cell even when most rows are not in the viewport - scrolled to bottom", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(40, 5),
        mergeCells: [
          {row: 1, col: 0, rowspan: 21, colspan: 2},
          {row: 21, col: 2, rowspan: 18, colspan: 2}
        ],
        height: 100,
        width: 400
      });

      var mainHolder = hot.view.wt.wtTable.holder;

      $(mainHolder).scrollTop(99999);
      hot.render();

      expect(hot.countRenderedRows()).toBe(39);
    });

    it("should render whole merged cell even when most columns are not in the viewport - scrolled to the left", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(5, 40),
        mergeCells: [
          {row: 0, col: 1, rowspan: 2, colspan: 21},
          {row: 2, col: 21, rowspan: 2, colspan: 18}
        ],
        height: 100,
        width: 400
      });

      expect(hot.countRenderedCols()).toBe(39);
    });

    it("should render whole merged cell even when most columns are not in the viewport - scrolled to the right", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(5, 40),
        mergeCells: [
          {row: 0, col: 1, rowspan: 2, colspan: 21},
          {row: 2, col: 21, rowspan: 2, colspan: 18}
        ],
        height: 100,
        width: 400
      });

      this.$container.scrollLeft(99999);
      hot.render();

      expect(hot.countRenderedCols()).toBe(39);
    });

  });

  describe("merge cells shift", function() {
    it("should shift the merged cells right, when inserting a column on the left side of them", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(20, 20),
        mergeCells: [
          {row: 1, col: 1, rowspan: 2, colspan: 2},
          {row: 2, col: 5, rowspan: 2, colspan: 2}
        ],
        height: 400,
        width: 400
      });

      hot.alter('insert_col', 3, 2);

      expect(hot.mergeCells.mergedCellInfoCollection[0].col).toEqual(1);
      expect(hot.mergeCells.mergedCellInfoCollection[1].col).toEqual(6);

    });

    it("should shift the merged cells left, when removing a column on the left side of them", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(20, 20),
        mergeCells: [
          {row: 1, col: 1, rowspan: 2, colspan: 2},
          {row: 2, col: 5, rowspan: 2, colspan: 2}
        ],
        height: 400,
        width: 400
      });

      hot.alter('remove_col', 3, 2);

      expect(hot.mergeCells.mergedCellInfoCollection[0].col).toEqual(1);
      expect(hot.mergeCells.mergedCellInfoCollection[1].col).toEqual(4);

    });

    it("should shift the merged cells down, when inserting a row above them", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(20, 20),
        mergeCells: [
          {row: 1, col: 1, rowspan: 2, colspan: 2},
          {row: 5, col: 5, rowspan: 2, colspan: 2}
        ],
        height: 400,
        width: 400
      });

      hot.alter('insert_row', 3, 2);

      expect(hot.mergeCells.mergedCellInfoCollection[0].row).toEqual(1);
      expect(hot.mergeCells.mergedCellInfoCollection[1].row).toEqual(6);

    });

    it("should shift the merged cells down, when inserting a row above them", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(20, 20),
        mergeCells: [
          {row: 1, col: 1, rowspan: 2, colspan: 2},
          {row: 5, col: 5, rowspan: 2, colspan: 2}
        ],
        height: 400,
        width: 400
      });

      hot.alter('remove_row', 3, 2);

      expect(hot.mergeCells.mergedCellInfoCollection[0].row).toEqual(1);
      expect(hot.mergeCells.mergedCellInfoCollection[1].row).toEqual(4);

    });

  });

});
