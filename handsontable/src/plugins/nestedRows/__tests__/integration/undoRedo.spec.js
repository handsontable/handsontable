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
        fixedRowsTop: 2,
        nestedRows: true,
      });

      await alter('remove_row', 0);

      const fixedRowsTopAfterRemove = getSettings().fixedRowsTop;

      getPlugin('nestedRows').disablePlugin();
      getPlugin('undoRedo').undo();

      expect(getPlugin('undoRedo').doneActions.length).toBe(1);
      expect(getPlugin('undoRedo').undoneActions.length).toBe(0);
      expect(countRows()).toBe(0);
      expect(getSettings().fixedRowsTop).toBe(fixedRowsTopAfterRemove);
      expect(beforeUndo).not.toHaveBeenCalled();
      expect(afterUndo).not.toHaveBeenCalled();
    });

    it('should restore two sibling parents in their original order', async() => {
      handsontable({
        data: [
          { col1: 'A' },
          { col1: 'B' },
          { col1: 'C' },
        ],
        nestedRows: true,
      });

      await alter('remove_row', 0, 2);
      getPlugin('undoRedo').undo();

      expect(getPlugin('nestedRows').dataManager.getRawSourceData()).toEqual([
        { col1: 'A' },
        { col1: 'B' },
        { col1: 'C' },
      ]);
    });

    it('should ask every removed root before refusing a later create-row veto', async() => {
      const beforeCreateRow = jasmine.createSpy('beforeCreateRow').and.callFake(index => index !== 1);

      handsontable({
        data: [
          { col1: 'A' },
          { col1: 'B' },
          { col1: 'C' },
        ],
        beforeCreateRow,
        nestedRows: true,
      });

      await alter('remove_row', 0, 2);
      beforeCreateRow.calls.reset();
      getPlugin('undoRedo').undo();

      expect(beforeCreateRow.calls.allArgs().map(args => args[0])).toEqual([0, 1]);
      expect(countRows()).toBe(1);
      expect(getPlugin('undoRedo').doneActions.length).toBe(1);
    });

    it('should keep restored cell-option meta out of the user-defined bucket', async() => {
      handsontable({
        data: [{
          col1: 'A1',
          __children: [{ col1: 'A1.1' }],
        }],
        cell: [{ row: 0, col: 0, className: 'from-cell-option' }],
        nestedRows: true,
      });

      await alter('remove_row', 0);
      getPlugin('undoRedo').undo();
      await updateSettings({
        cell: [{ row: 0, col: 0, className: 'replaced' }],
      });

      expect(getCellMeta(0, 0).className).toBe('replaced');
    });

    it('should undo and redo a detached nested subtree as one action', async() => {
      const originalData = [
        {
          col1: 'Parent',
          __children: [{
            col1: 'Child',
            __children: [{ col1: 'Grandchild' }],
          }],
        },
        { col1: 'After' },
      ];

      handsontable({
        data: JSON.parse(JSON.stringify(originalData)),
        nestedRows: true,
      });

      const nestedRows = getPlugin('nestedRows');
      const undoRedo = getPlugin('undoRedo');

      nestedRows.dataManager.detachFromParent(nestedRows.dataManager.getDataObject(1));

      expect(undoRedo.doneActions.length).toBe(1);
      expect(undoRedo.doneActions[0].actionType).toBe('nested_rows_detach');
      expect(nestedRows.dataManager.getRawSourceData()).toEqual([
        { col1: 'Parent', __children: [] },
        { col1: 'After' },
        {
          col1: 'Child',
          __children: [{ col1: 'Grandchild' }],
        },
      ]);

      undoRedo.undo();
      await waitUntil(() => undoRedo.undoneActions.length === 1);

      expect(undoRedo.doneActions.length).toBe(0);
      expect(undoRedo.undoneActions.length).toBe(1);
      expect(nestedRows.dataManager.getRawSourceData()).toEqual(originalData);

      undoRedo.redo();
      await waitUntil(() => undoRedo.doneActions.length === 1);

      expect(undoRedo.doneActions.length).toBe(1);
      expect(undoRedo.undoneActions.length).toBe(0);
      expect(nestedRows.dataManager.getRawSourceData()).toEqual([
        { col1: 'Parent', __children: [] },
        { col1: 'After' },
        {
          col1: 'Child',
          __children: [{ col1: 'Grandchild' }],
        },
      ]);
    });

    it('should restore a last child to its original nested parent', async() => {
      const originalData = [
        {
          col1: 'Parent',
          __children: [{
            col1: 'Child',
            __children: [{
              col1: 'Grandchild',
              __children: [{ col1: 'Great grandchild' }],
            }],
          }],
        },
        { col1: 'After' },
      ];

      handsontable({
        data: JSON.parse(JSON.stringify(originalData)),
        nestedRows: true,
      });

      const nestedRows = getPlugin('nestedRows');
      const undoRedo = getPlugin('undoRedo');

      nestedRows.dataManager.detachFromParent(nestedRows.dataManager.getDataObject(2));

      expect(undoRedo.doneActions.length).toBe(1);
      expect(nestedRows.dataManager.getRawSourceData()).toEqual([
        {
          col1: 'Parent',
          __children: [
            { col1: 'Child', __children: [] },
            {
              col1: 'Grandchild',
              __children: [{ col1: 'Great grandchild' }],
            },
          ],
        },
        { col1: 'After' },
      ]);

      undoRedo.undo();
      await waitUntil(() => undoRedo.undoneActions.length === 1);

      expect(nestedRows.dataManager.getRawSourceData()).toEqual(originalData);

      undoRedo.redo();
      await waitUntil(() => undoRedo.doneActions.length === 1);

      expect(nestedRows.dataManager.getRawSourceData()).toEqual([
        {
          col1: 'Parent',
          __children: [
            { col1: 'Child', __children: [] },
            {
              col1: 'Grandchild',
              __children: [{ col1: 'Great grandchild' }],
            },
          ],
        },
        { col1: 'After' },
      ]);
    });

    it('should undo a detached subtree with collapsed descendants', async() => {
      const originalData = [
        {
          col1: 'Collapsed parent',
          __children: [{ col1: 'Hidden child' }],
        },
        {
          col1: 'Outer parent',
          __children: [{
            col1: 'Parent',
            __children: [{
              col1: 'Child',
              __children: [{ col1: 'Grandchild' }],
            }],
          }],
        },
        { col1: 'After' },
      ];

      handsontable({
        data: JSON.parse(JSON.stringify(originalData)),
        nestedRows: true,
      });

      const nestedRows = getPlugin('nestedRows');
      const undoRedo = getPlugin('undoRedo');

      nestedRows.collapsingUI.collapseChildren(0);
      nestedRows.collapsingUI.collapseChildren(4);
      await waitUntil(() => countRows() === 5);

      nestedRows.dataManager.detachFromParent(nestedRows.dataManager.getDataObject(3));

      expect(undoRedo.doneActions.length).toBe(1);
      expect(undoRedo.doneActions[0].actionType).toBe('nested_rows_detach');

      undoRedo.undo();
      await waitUntil(() => undoRedo.undoneActions.length === 1);

      expect(nestedRows.dataManager.getRawSourceData()).toEqual(originalData);
    });

    it('should not remove following rows when undoing a detached subtree with a trimmed descendant', async() => {
      const originalData = [
        {
          col1: 'Grandparent',
          __children: [{
            col1: 'Parent',
            __children: [{
              col1: 'Child',
              __children: [{ col1: 'Trimmed grandchild' }],
            }],
          }],
        },
        { col1: 'After' },
      ];

      handsontable({
        data: JSON.parse(JSON.stringify(originalData)),
        nestedRows: true,
        trimRows: [3],
      });

      const nestedRows = getPlugin('nestedRows');
      const undoRedo = getPlugin('undoRedo');

      await waitUntil(() => countRows() === 4);

      nestedRows.dataManager.detachFromParent(nestedRows.dataManager.getDataObject(2));

      expect(undoRedo.doneActions.length).toBe(1);
      expect(undoRedo.doneActions[0].actionType).toBe('nested_rows_detach');

      undoRedo.undo();
      await waitUntil(() => undoRedo.undoneActions.length === 1);

      expect(nestedRows.dataManager.getRawSourceData()).toEqual(originalData);
    });

    it('should undo a detached child after external trimming shifts row indexes', async() => {
      const originalData = [
        { col1: 'Trimmed' },
        {
          col1: 'Parent',
          __children: [{ col1: 'Child' }],
        },
        { col1: 'After' },
      ];

      handsontable({
        data: JSON.parse(JSON.stringify(originalData)),
        nestedRows: true,
        trimRows: [0],
      });

      const nestedRows = getPlugin('nestedRows');
      const undoRedo = getPlugin('undoRedo');

      nestedRows.dataManager.detachFromParent(nestedRows.dataManager.getDataObject(2));

      expect(undoRedo.doneActions.length).toBe(1);
      expect(undoRedo.doneActions[0].actionType).toBe('nested_rows_detach');

      undoRedo.undo();
      await waitUntil(() => undoRedo.undoneActions.length === 1);

      expect(nestedRows.dataManager.getRawSourceData()).toEqual(originalData);
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

      await waitUntil(() => getPlugin('undoRedo').undoneActions.length === 1);

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
