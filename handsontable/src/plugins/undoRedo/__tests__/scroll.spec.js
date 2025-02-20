describe('UndoRedo', () => {
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

  describe('scroll', () => {
    it('should move to the already changed cell only vertically', async() => {
      handsontable({
        data: createSpreadsheetData(50, 50),
        rowHeaders: true,
        colHeaders: true,
        width: 500,
        height: 400,
      });

      selectCell(4, 4);
      setDataAtCell(4, 4, 'aaaa');
      selectCell(5, 4);
      scrollViewportTo({ row: 25, col: 4, verticalSnap: 'top' });
      getPlugin('undoRedo').undo();

      expect(getFirstFullyVisibleRow()).toBe(5);
      expect(getFirstFullyVisibleColumn()).toBe(0);
    });

    it('should move to the already changed cell only horizontally', async() => {
      handsontable({
        data: createSpreadsheetData(50, 50),
        rowHeaders: true,
        colHeaders: true,
        width: 500,
        height: 400,
      });

      selectCell(4, 4);
      setDataAtCell(4, 4, 'aaaa');
      selectCell(5, 4);
      scrollViewportTo({ row: 4, col: 25, horizontalSnap: 'start' });
      getPlugin('undoRedo').undo();

      expect(getFirstFullyVisibleRow()).toBe(0);
      expect(getFirstFullyVisibleColumn()).toBe(4);
    });

    it('should move to the already changed cell on both axis', async() => {
      handsontable({
        data: createSpreadsheetData(50, 50),
        rowHeaders: true,
        colHeaders: true,
        width: 500,
        height: 400,
      });

      selectCell(4, 4);
      setDataAtCell(4, 4, 'aaaa');
      selectCell(5, 4);
      scrollViewportTo({ row: 25, col: 25 });
      getPlugin('undoRedo').undo();

      expect(getFirstFullyVisibleRow()).toBe(5);
      expect(getFirstFullyVisibleColumn()).toBe(4);
    });

    it('should not move to the already changed cell when selection has not been changed', async() => {
      handsontable({
        data: createSpreadsheetData(50, 50),
        rowHeaders: true,
        colHeaders: true,
        width: 500,
        height: 400,
      });

      selectCell(4, 4);
      setDataAtCell(4, 4, 'aaaa');
      scrollViewportTo({ row: 25, col: 25, horizontalSnap: 'start', verticalSnap: 'top' });
      getPlugin('undoRedo').undo();

      expect(getFirstFullyVisibleRow()).toBe(4);
      expect(getFirstFullyVisibleColumn()).toBe(4);
    });
  });
});
