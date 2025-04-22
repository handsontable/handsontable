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

  describe('selection', () => {
    it('should keep saved selection state after undo and redo data change', async() => {
      handsontable();

      await selectCell(0, 0);
      await setDataAtCell(0, 0, 'test');
      await selectCell(0, 1);
      await setDataAtCell(0, 1, 'test2');

      await selectCell(0, 2);
      getPlugin('undoRedo').undo();
      getPlugin('undoRedo').undo();

      expect(getSelectedLast()).toEqual([0, 0, 0, 0]);

      getPlugin('undoRedo').redo();
      getPlugin('undoRedo').redo();

      expect(getSelectedLast()).toEqual([0, 1, 0, 1]);
    });

    it('should restore row headers selection after undoing changes', async() => {
      handsontable({
        data: createSpreadsheetData(3, 5),
        colHeaders: true,
        rowHeaders: true,
      });

      await selectRows(1);
      await emptySelectedCells();

      getPlugin('undoRedo').undo();

      expect(getSelected()).toEqual([[1, -1, 1, 4]]);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should restore column headers selection after undoing changes', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        rowHeaders: true,
      });

      await selectColumns(1);
      await emptySelectedCells();

      getPlugin('undoRedo').undo();

      expect(getSelected()).toEqual([[-1, 1, 4, 1]]);
      expect(`
        |   ║   : * :   |
        |===:===:===:===|
        | - ║   : A :   |
        | - ║   : 0 :   |
        | - ║   : 0 :   |
        | - ║   : 0 :   |
        | - ║   : 0 :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should keep saved selection state ater undoing non-contignous selected cells', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      await selectCells([[0, 0, 1, 1], [1, 2, 2, 3]]);
      await emptySelectedCells();

      await selectCell(4, 0);
      getPlugin('undoRedo').undo();

      expect(getSelected().length).toBe(2);
      expect(getSelected()[0]).toEqual([0, 0, 1, 1]);
      expect(getSelected()[1]).toEqual([1, 2, 2, 3]);
    });

    it('should transform the header selection down after undoing rows removal', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
      });

      await selectRows(4, 5);
      await alter('remove_row', 1, 3);
      getPlugin('undoRedo').undo();

      expect(getSelected()).toEqual([[4, -1, 5, 9]]);
      expect(`
        |   ║ - : - : - : - : - : - : - : - : - : - |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should transform cells selection down after undoing rows removal', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
      });

      await selectCells([[3, 3, 3, 3], [5, 2, 6, 2]]);
      await alter('remove_row', 1, 3);
      getPlugin('undoRedo').undo();

      expect(getSelected()).toEqual([[3, 3, 3, 3], [5, 2, 6, 2]]);
      // By design only last selection is interactive.
      expect(`
        |   ║   :   : - : - :   :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        | - ║   :   :   : 0 :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        | - ║   :   : A :   :   :   :   :   :   :   |
        | - ║   :   : 0 :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should transform the header selection right after undoing columns removal', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
      });

      await selectColumns(4, 5);
      await alter('remove_col', 1, 3);
      getPlugin('undoRedo').undo();

      expect(getSelected()).toEqual([[-1, 4, 9, 5]]);
      expect(`
        |   ║   :   :   :   : * : * :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        | - ║   :   :   :   : A : 0 :   :   :   :   |
        | - ║   :   :   :   : 0 : 0 :   :   :   :   |
        | - ║   :   :   :   : 0 : 0 :   :   :   :   |
        | - ║   :   :   :   : 0 : 0 :   :   :   :   |
        | - ║   :   :   :   : 0 : 0 :   :   :   :   |
        | - ║   :   :   :   : 0 : 0 :   :   :   :   |
        | - ║   :   :   :   : 0 : 0 :   :   :   :   |
        | - ║   :   :   :   : 0 : 0 :   :   :   :   |
        | - ║   :   :   :   : 0 : 0 :   :   :   :   |
        | - ║   :   :   :   : 0 : 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should transform cells selection right after undoing columns removal', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
      });

      await selectCells([[3, 3, 3, 3], [2, 5, 2, 6]]);
      await alter('remove_col', 1, 3);
      getPlugin('undoRedo').undo();

      expect(getSelected()).toEqual([[3, 3, 3, 3], [2, 5, 2, 6]]);
      // By design only last selection is interactive.
      expect(`
        |   ║   :   :   : - :   : - : - :   :   :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        | - ║   :   :   :   :   : A : 0 :   :   :   |
        | - ║   :   :   : 0 :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should undo removal of fixed column on the left', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        colHeaders: true,
        rowHeaders: true,
        fixedColumnsStart: 1,
      });

      await alter('remove_col', 0, 3);
      getPlugin('undoRedo').undo();

      expect(getSettings().fixedColumnsStart).toBe(1);
    });
  });
});
