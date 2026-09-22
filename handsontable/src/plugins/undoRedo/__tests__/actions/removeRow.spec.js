describe('UndoRedo -> RemoveRow action', () => {
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

  it('should have defined correct action properties', async() => {
    const afterUndo = jasmine.createSpy('afterUndo');

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      afterUndo,
    });

    await alter('remove_row', 1, 2);
    getPlugin('undoRedo').undo();

    expect(afterUndo).toHaveBeenCalledWith({
      actionType: 'remove_row',
      index: 1,
      data: [
        ['A2', 'B2', 'C2', 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3']
      ],
      accessorValues: [[], []],
      rowIndexesSequence: [0, 1, 2, 3, 4],
      fixedRowsTop: 0,
      fixedRowsBottom: 0,
      removedCellMetas: [
        [1, 0, jasmine.objectContaining({ visualRow: 1, visualCol: 0, row: 1, col: 0, prop: 0 })],
        [2, 0, jasmine.objectContaining({ visualRow: 2, visualCol: 0, row: 2, col: 0, prop: 0 })],
        [1, 1, jasmine.objectContaining({ visualRow: 1, visualCol: 1, row: 1, col: 1, prop: 1 })],
        [2, 1, jasmine.objectContaining({ visualRow: 2, visualCol: 1, row: 2, col: 1, prop: 1 })],
        [1, 2, jasmine.objectContaining({ visualRow: 1, visualCol: 2, row: 1, col: 2, prop: 2 })],
        [2, 2, jasmine.objectContaining({ visualRow: 2, visualCol: 2, row: 2, col: 2, prop: 2 })],
        [1, 3, jasmine.objectContaining({ visualRow: 1, visualCol: 3, row: 1, col: 3, prop: 3 })],
        [2, 3, jasmine.objectContaining({ visualRow: 2, visualCol: 3, row: 2, col: 3, prop: 3 })],
        [1, 4, jasmine.objectContaining({ visualRow: 1, visualCol: 4, row: 1, col: 4, prop: 4 })],
        [2, 4, jasmine.objectContaining({ visualRow: 2, visualCol: 4, row: 2, col: 4, prop: 4 })],
      ],
      removedMergedCells: [],
      removedHiddenRows: [],
    });
  });

  it('should undo and redo the remove action after row moving (#dev-2071)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      manualRowMove: true,
    });

    getPlugin('manualRowMove').moveRow(4, 0);
    await render();
    await alter('remove_row', 1, 1);
    getPlugin('undoRedo').undo();

    expect(getDataAtCol(0)).toEqual(['A5', 'A1', 'A2', 'A3', 'A4']);

    getPlugin('undoRedo').undo();

    expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);

    getPlugin('undoRedo').redo();

    expect(getDataAtCol(0)).toEqual(['A5', 'A1', 'A2', 'A3', 'A4']);

    getPlugin('undoRedo').redo();

    expect(getDataAtCol(0)).toEqual(['A5', 'A2', 'A3', 'A4']);
  });

  describe('#8039: undo restores hidden source-data fields', () => {
    it('should restore a hidden source-data field (not present in `columns`) after undo', async() => {
      handsontable({
        data: [
          { artist: 'Foo Fighters', category: 'rock', label: 'Roswell Records' },
          { artist: 'Alabama Shakes', category: 'blues', label: 'ATO Records' },
          { artist: 'Radiohead', category: 'rock', label: 'XL Recordings' },
        ],
        columns: [{ data: 'category' }, { data: 'label' }],
      });

      await alter('remove_row', 1, 1);

      expect(getSourceDataAtRow(1)).toEqual({ artist: 'Radiohead', category: 'rock', label: 'XL Recordings' });

      getPlugin('undoRedo').undo();

      expect(getSourceDataAtRow(1)).toEqual({
        artist: 'Alabama Shakes', category: 'blues', label: 'ATO Records',
      });
    });

    it('should restore a deep dot-notation prop (not exposed via `columns`) after undo', async() => {
      handsontable({
        data: [
          { id: 1, meta: { deep: { field: 'keep-1' } }, label: 'one' },
          { id: 2, meta: { deep: { field: 'keep-2' } }, label: 'two' },
          { id: 3, meta: { deep: { field: 'keep-3' } }, label: 'three' },
        ],
        columns: [{ data: 'label' }],
        dataDotNotation: true,
      });

      await alter('remove_row', 1, 1);
      getPlugin('undoRedo').undo();

      expect(getSourceDataAtRow(1).meta.deep.field).toBe('keep-2');
      expect(getSourceDataAtRow(1).id).toBe(2);
    });

    it('should still restore array-data rows correctly (no regression)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 3),
      });

      await alter('remove_row', 1, 1);
      getPlugin('undoRedo').undo();

      expect(getDataAtRow(1)).toEqual(['A2', 'B2', 'C2']);
      expect(getSourceDataAtRow(1)).toEqual(['A2', 'B2', 'C2']);
    });

    it('should restore hidden fields when removing multiple object rows in a single action', async() => {
      handsontable({
        data: [
          { artist: 'A1', category: 'c1', label: 'l1' },
          { artist: 'A2', category: 'c2', label: 'l2' },
          { artist: 'A3', category: 'c3', label: 'l3' },
          { artist: 'A4', category: 'c4', label: 'l4' },
        ],
        columns: [{ data: 'category' }, { data: 'label' }],
      });

      await alter('remove_row', 1, 2);
      getPlugin('undoRedo').undo();

      expect(getSourceDataAtRow(1).artist).toBe('A2');
      expect(getSourceDataAtRow(2).artist).toBe('A3');
      expect(getSourceDataAtRow(1).category).toBe('c2');
      expect(getSourceDataAtRow(2).category).toBe('c3');
    });

    it('should fire `afterSetSourceDataAtCell` with source `UndoRedo.undo` covering hidden props on undo', async() => {
      const afterSetSourceDataAtCell = jasmine.createSpy('afterSetSourceDataAtCell');

      handsontable({
        data: [
          { artist: 'Foo Fighters', category: 'rock', label: 'Roswell Records' },
          { artist: 'Alabama Shakes', category: 'blues', label: 'ATO Records' },
        ],
        columns: [{ data: 'category' }, { data: 'label' }],
        afterSetSourceDataAtCell,
      });

      await alter('remove_row', 1, 1);
      afterSetSourceDataAtCell.calls.reset();

      getPlugin('undoRedo').undo();

      const undoCalls = afterSetSourceDataAtCell.calls.allArgs().filter(args => args[1] === 'UndoRedo.undo');

      expect(undoCalls.length).toBeGreaterThan(0);
      const changedProps = undoCalls.flatMap(args => args[0]).map(change => change[1]);

      expect(changedProps).toContain('artist');
      expect(changedProps).toContain('category');
      expect(changedProps).toContain('label');
    });
  });

  describe('DEV-134: undo restores rows hidden by the `hiddenRows` plugin', () => {
    it('should re-hide a hidden row after undoing its removal', async() => {
      handsontable({
        data: createSpreadsheetData(6, 3),
        hiddenRows: true,
      });

      getPlugin('hiddenRows').hideRows([1, 3]);
      await render();

      await alter('remove_row', 3, 1);
      getPlugin('undoRedo').undo();

      expect(getPlugin('hiddenRows').getHiddenRows()).toEqual([1, 3]);
      expect(getPlugin('hiddenRows').isHidden(1)).toBe(true);
      expect(getPlugin('hiddenRows').isHidden(3)).toBe(true);
    });

    it('should restore the full pre-removal hiding config for the exact reported repro ' +
      '(hide rows, remove them via the context menu, undo)', async() => {
      handsontable({
        data: createSpreadsheetData(6, 3),
        hiddenRows: true,
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
      });

      getPlugin('hiddenRows').hideRows([2, 3]);
      await render();

      await selectRows(2, 3);
      getPlugin('contextMenu').executeCommand('remove_row');
      getPlugin('undoRedo').undo();

      expect(getPlugin('hiddenRows').getHiddenRows()).toEqual([2, 3]);

      // The ticket's second reported symptom (header selection misbehaving) traced back to the
      // same corrupted hiding-map state: with rows 2 and 3 wrongly counted as rendered, the
      // renderable row count - which row-header selection is built on - was wrong too. Pin it
      // directly: 6 rows total, 2 of them hidden, 4 must remain rendered.
      expect(countRenderedRows()).toBe(4);

      // Clicking the corner (select-all) must resolve to the DOM row headers actually rendered,
      // not the stale/wrong count the unfixed bug left behind.
      const corner = getCell(-1, -1);

      await simulateClick(corner, 'LMB');

      expect($('.ht_clone_inline_start .htCore tbody tr').length).toBe(4);
    });

    it('should not re-hide a row that was not hidden before the removal', async() => {
      handsontable({
        data: createSpreadsheetData(6, 3),
        hiddenRows: true,
      });

      getPlugin('hiddenRows').hideRows([1]);
      await render();

      await alter('remove_row', 2, 1);
      getPlugin('undoRedo').undo();

      expect(getPlugin('hiddenRows').getHiddenRows()).toEqual([1]);
      expect(getPlugin('hiddenRows').isHidden(2)).toBe(false);
    });

    it('should leave hiding state untouched when the `hiddenRows` plugin is disabled', async() => {
      handsontable({
        data: createSpreadsheetData(6, 3),
      });

      await alter('remove_row', 1, 1);

      expect(() => {
        getPlugin('undoRedo').undo();
      }).not.toThrowWithCause(undefined, { handsontable: true });
    });
  });
});
