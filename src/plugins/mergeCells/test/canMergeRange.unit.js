describe('MergeCells', () => {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('canMergeRange', () => {
    it('should return false if start and end cell is the same', () => {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5)
      });
      var mergeCells = new Handsontable.MergeCells(hot);
      var coordsFrom = new WalkontableCellCoords(0, 1);
      var cellRange = new WalkontableCellRange(coordsFrom, coordsFrom, new WalkontableCellCoords(0, 1));
      var result = mergeCells.canMergeRange(cellRange);

      expect(result).toBe(false);
    });

    it('should return true for 2 consecutive cells in the same column', () => {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5)
      });
      var mergeCells = new Handsontable.MergeCells(hot);
      var coordsFrom = new WalkontableCellCoords(0, 1);
      var cellRange = new WalkontableCellRange(coordsFrom, coordsFrom, new WalkontableCellCoords(1, 1));
      var result = mergeCells.canMergeRange(cellRange);

      expect(result).toBe(true);
    });

    it('should return true for 2 consecutive cells in the same row', () => {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5)
      });
      var mergeCells = new Handsontable.MergeCells(hot);
      var coordsFrom = new WalkontableCellCoords(0, 1);
      var cellRange = new WalkontableCellRange(coordsFrom, coordsFrom, new WalkontableCellCoords(0, 2));
      var result = mergeCells.canMergeRange(cellRange);

      expect(result).toBe(true);
    });

    it('should return true for 4 neighboring cells', () => {
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

  describe('modifyTransform', () => {
    it('should not transform arrow right when entering a merged cell', () => {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var coords = new WalkontableCellCoords(1, 0);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = new WalkontableCellCoords(0, 1);
      mergeCells.modifyTransform('modifyTransformStart', currentSelection, inDelta);

      expect(inDelta).toEqual(new WalkontableCellCoords(0, 1));
    });

    it('should transform arrow right when leaving a merged cell', () => {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var coords = new WalkontableCellCoords(1, 1);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = new WalkontableCellCoords(0, 1);
      mergeCells.modifyTransform('modifyTransformStart', currentSelection, inDelta);

      expect(inDelta).toEqual(new WalkontableCellCoords(0, 3));
    });

    it('should transform arrow right when leaving a merged cell (return to desired row)', () => {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);

      var coords = new WalkontableCellCoords(2, 0);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var inDelta = new WalkontableCellCoords(0, 1);
      mergeCells.modifyTransform('modifyTransformStart', currentSelection, inDelta);

      expect(inDelta).toEqual(new WalkontableCellCoords(-1, 1));

      coords = new WalkontableCellCoords(1, 1);
      currentSelection = new WalkontableCellRange(coords, coords, coords);
      inDelta = new WalkontableCellCoords(0, 1);
      mergeCells.modifyTransform('modifyTransformStart', currentSelection, inDelta);

      expect(inDelta).toEqual(new WalkontableCellCoords(1, 3));
    });

    it('should transform arrow left when entering a merged cell', () => {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var coords = new WalkontableCellCoords(1, 4);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = new WalkontableCellCoords(0, -1);
      mergeCells.modifyTransform('modifyTransformStart', currentSelection, inDelta);

      expect(inDelta).toEqual(new WalkontableCellCoords(0, -3));
    });

    it('should not transform arrow left when leaving a merged cell', () => {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var coords = new WalkontableCellCoords(1, 1);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = new WalkontableCellCoords(0, -1);
      mergeCells.modifyTransform('modifyTransformStart', currentSelection, inDelta);

      expect(inDelta).toEqual(new WalkontableCellCoords(0, -1));
    });

    it('should transform arrow left when leaving a merged cell (return to desired row)', () => {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);

      var coords = new WalkontableCellCoords(2, 4);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var inDelta = new WalkontableCellCoords(0, -1);
      mergeCells.modifyTransform('modifyTransformStart', currentSelection, inDelta);

      expect(inDelta).toEqual(new WalkontableCellCoords(-1, -3));

      coords = new WalkontableCellCoords(1, 1);
      currentSelection = new WalkontableCellRange(coords, coords, coords);
      inDelta = new WalkontableCellCoords(0, -1);
      mergeCells.modifyTransform('modifyTransformStart', currentSelection, inDelta);

      expect(inDelta).toEqual(new WalkontableCellCoords(1, -1));
    });

    it('should not transform arrow down when entering a merged cell', () => {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var coords = new WalkontableCellCoords(0, 1);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = new WalkontableCellCoords(0, -1);
      mergeCells.modifyTransform('modifyTransformStart', currentSelection, inDelta);

      expect(inDelta).toEqual(new WalkontableCellCoords(0, -1));
    });

    it('should transform arrow down when leaving a merged cell', () => {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var coords = new WalkontableCellCoords(1, 1);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = new WalkontableCellCoords(1, 0);
      mergeCells.modifyTransform('modifyTransformStart', currentSelection, inDelta);

      expect(inDelta).toEqual(new WalkontableCellCoords(3, 0));
    });

    it('should transform arrow up when entering a merged cell', () => {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var coords = new WalkontableCellCoords(4, 1);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = new WalkontableCellCoords(-1, 0);
      mergeCells.modifyTransform('modifyTransformStart', currentSelection, inDelta);

      expect(inDelta).toEqual(new WalkontableCellCoords(-3, 0));
    });

    it('should not transform arrow up when leaving a merged cell', () => {
      var mergeCellsSettings = [
        {row: 1, col: 1, rowspan: 3, colspan: 3}
      ];
      var coords = new WalkontableCellCoords(1, 1);
      var currentSelection = new WalkontableCellRange(coords, coords, coords);
      var mergeCells = new Handsontable.MergeCells(mergeCellsSettings);
      var inDelta = new WalkontableCellCoords(-1, 0);
      mergeCells.modifyTransform('modifyTransformStart', currentSelection, inDelta);

      expect(inDelta).toEqual(new WalkontableCellCoords(-1, 0));
    });
  });
});
