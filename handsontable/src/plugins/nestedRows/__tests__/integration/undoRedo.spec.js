describe('NestedRows', () => {
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

  describe('working with UndoRedo plugin', () => {
    it('should properly undo remove of the child row', async() => {
      handsontable({
        data: [
          {
            col1: 'A1',
            __children: [{ col1: 'A1.1' }],
          },
        ],
        nestedRows: true,
      });

      await alter('remove_row', 1);
      getPlugin('undoRedo').undo();

      expect(getDataAtCell(1, 0)).toBe('A1.1');
    });

    it('should restore collapsed row state when undoing a removed parent', async() => {
      handsontable({
        data: [
          {
            col1: 'A1',
            __children: [{
              col1: 'A1.1',
              __children: [{ col1: 'A1.1.1' }],
            }],
          },
          { col1: 'A2' },
        ],
        nestedRows: true,
      });

      getPlugin('nestedRows').collapseParent(0);
      await alter('remove_row', 0);
      getPlugin('undoRedo').undo();

      expect(getPlugin('nestedRows').getCollapsedParents()).toEqual([0]);
      expect(getPlugin('nestedRows').dataManager.getRawSourceData()).toEqual([
        {
          col1: 'A1',
          __children: [{
            col1: 'A1.1',
            __children: [{ col1: 'A1.1.1' }],
          }],
        },
        { col1: 'A2' },
      ]);
      expect(getPlugin('nestedRows').dataManager.hot.rowIndexMapper.isTrimmed(1)).toBe(true);
      expect(getPlugin('nestedRows').dataManager.hot.rowIndexMapper.isTrimmed(2)).toBe(true);
    });

    it('should restore named linked row maps by physical index and order', async() => {
      handsontable({
        data: [{
          col1: 'A1',
          __children: [{ col1: 'A1.1' }, { col1: 'A1.2' }],
        }],
        nestedRows: true,
      });

      const rowIndexMapper = getPlugin('nestedRows').dataManager.hot.rowIndexMapper;
      const linkedMap = rowIndexMapper.createAndRegisterIndexMap(
        'nestedRowsUndoLinkedMap', 'linkedPhysicalIndexToValue'
      );

      linkedMap.setValueAtIndex(2, 'child-2');
      linkedMap.setValueAtIndex(1, 'child-1', 0);

      await alter('remove_row', 0);
      getPlugin('undoRedo').undo();

      expect(linkedMap.getEntries()).toEqual([
        [1, 'child-1'],
        [2, 'child-2'],
      ]);
    });

    it('should restore merges spanning a removed nested subtree', async() => {
      handsontable({
        data: [
          {
            col1: 'A1',
            __children: [{ col1: 'A1.1' }, { col1: 'A1.2' }],
          },
          { col1: 'A2' },
        ],
        mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 1 }],
        nestedRows: true,
      });

      getPlugin('nestedRows').collapseParent(0);
      await alter('remove_row', 0);
      getPlugin('undoRedo').undo();

      const restoredMerge = getPlugin('mergeCells').mergedCellsCollection.mergedCells[0];

      expect(restoredMerge).toEqual(jasmine.objectContaining({
        row: 0,
        col: 0,
        rowspan: 1,
        colspan: 1,
      }));

      getPlugin('nestedRows').expandParent(0);

      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells[0].rowspan).toBe(3);
    });

    it('should keep descendant values when undoing a parent under an expanded merge', async() => {
      handsontable({
        data: [
          {
            col1: 'A1',
            __children: [{ col1: 'A1.1' }, { col1: 'A1.2' }],
          },
          { col1: 'A2' },
        ],
        mergeCells: true,
        nestedRows: true,
      });

      const mergeCells = getPlugin('mergeCells');
      const range = mergeCells.hot._createCellRange(
        mergeCells.hot._createCellCoords(0, 0),
        mergeCells.hot._createCellCoords(0, 0),
        mergeCells.hot._createCellCoords(2, 0)
      );

      // Geometry only: `merge()` would `populateFromArray` nulls into the children before we
      // remove them, so the undo snapshot would already lack `A1.1` / `A1.2`.
      mergeCells.mergeRange(range, true, true);

      expect(getPlugin('nestedRows').dataManager.getRawSourceData()).toEqual([
        {
          col1: 'A1',
          __children: [{ col1: 'A1.1' }, { col1: 'A1.2' }],
        },
        { col1: 'A2' },
      ]);

      await alter('remove_row', 0);
      getPlugin('undoRedo').undo();

      expect(getPlugin('nestedRows').dataManager.getRawSourceData()).toEqual([
        {
          col1: 'A1',
          __children: [{ col1: 'A1.1' }, { col1: 'A1.2' }],
        },
        { col1: 'A2' },
      ]);
      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells[0]).toEqual(jasmine.objectContaining({
        row: 0,
        col: 0,
        rowspan: 3,
        colspan: 1,
      }));
    });

    it('should fire row creation hooks when undo restores a nested parent', async() => {
      const beforeCreateRow = jasmine.createSpy('beforeCreateRow');
      const afterCreateRow = jasmine.createSpy('afterCreateRow');

      handsontable({
        data: [{
          col1: 'A1',
          __children: [{ col1: 'A1.1' }],
        }],
        beforeCreateRow,
        afterCreateRow,
        nestedRows: true,
      });

      await alter('remove_row', 0);
      getPlugin('undoRedo').undo();

      expect(beforeCreateRow).toHaveBeenCalledWith(0, 2, 'UndoRedo.undo');
      expect(afterCreateRow).toHaveBeenCalledWith(0, 2, 'UndoRedo.undo');
    });

    it('should keep the removal action when a create-row hook vetoes undo', async() => {
      const beforeUndo = jasmine.createSpy('beforeUndo');
      const afterUndo = jasmine.createSpy('afterUndo');

      handsontable({
        data: [{
          col1: 'A1',
          __children: [{ col1: 'A1.1' }],
        }],
        beforeCreateRow: () => false,
        beforeUndo,
        afterUndo,
        nestedRows: true,
      });

      await alter('remove_row', 0);
      getPlugin('undoRedo').undo();

      expect(countRows()).toBe(0);
      expect(getPlugin('undoRedo').doneActions.length).toBe(1);
      expect(getPlugin('undoRedo').undoneActions.length).toBe(0);
      expect(beforeUndo).not.toHaveBeenCalled();
      expect(afterUndo).not.toHaveBeenCalled();
    });

    it('should keep the nested removal action when the plugin is disabled before undo', async() => {
      const beforeUndo = jasmine.createSpy('beforeUndo');
      const afterUndo = jasmine.createSpy('afterUndo');

      handsontable({
        data: [{
          col1: 'A1',
          __children: [{ col1: 'A1.1' }],
        }],
        beforeUndo,
        afterUndo,
        nestedRows: true,
      });

      await alter('remove_row', 0);
      getPlugin('nestedRows').disablePlugin();
      getPlugin('undoRedo').undo();

      expect(getPlugin('undoRedo').doneActions.length).toBe(1);
      expect(getPlugin('undoRedo').undoneActions.length).toBe(0);
      expect(countRows()).toBe(0);
      expect(beforeUndo).not.toHaveBeenCalled();
      expect(afterUndo).not.toHaveBeenCalled();
    });

    it('should not throw an error when removing a parent row', async() => {
      const onErrorSpy = spyOn(window, 'onerror').and.returnValue(true);

      handsontable({
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        data: [
          {
            col1: 'A1',
            __children: [{ col1: 'A1.1' }],
          },
        ],
        nestedRows: true,
      });

      await alter('remove_row', 0);

      getPlugin('undoRedo').undo();

      await waitForNextAnimationFrames(2);

      expect(onErrorSpy).not.toHaveBeenCalled();
      expect(countRows()).toBe(2);
      expect(getDataAtCell(0, 0)).toBe('A1');
      expect(getDataAtCell(1, 0)).toBe('A1.1');
      expect(getPlugin('nestedRows').dataManager.getRawSourceData()).toEqual([
        {
          col1: 'A1',
          __children: [{ col1: 'A1.1' }],
        },
      ]);

      getPlugin('undoRedo').redo();

      expect(countRows()).toBe(0);
    });
  });
});
