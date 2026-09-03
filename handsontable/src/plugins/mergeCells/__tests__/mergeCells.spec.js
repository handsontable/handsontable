describe('MergeCells', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('initialization', () => {
    it('should merge cell in startup', async() => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 }
        ]
      });
      const TD = hot.rootElement.querySelector('td');

      expect(TD.getAttribute('rowspan')).toBe('2');
      expect(TD.getAttribute('colspan')).toBe('2');
    });

    it('should overwrite proper cells while creating new dataset (with nulls in place of merge areas)', async() => {
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: [
          [null, null, 3, 4, null],
          [null, null, null, null, null],
          [null, 5, null, null, null],
        ],
        mergeCells: [{
          row: 0,
          col: 3,
          rowspan: 2,
          colspan: 2
        }, {
          row: 2,
          col: 1,
          rowspan: 1,
          colspan: 2
        }],
        afterChange,
      });

      expect(afterChange.calls.mostRecent().args[0]).toEqual([
        [0, 4, null, null],
        [1, 3, null, null],
        [1, 4, null, null],
        [2, 2, null, null],
      ]);
      expect(getSourceData()).toEqual([
        [null, null, 3, 4, null],
        [null, null, null, null, null],
        [null, 5, null, null, null],
      ]);
      expect(getData()).toEqual([
        [null, null, 3, 4, null],
        [null, null, null, null, null],
        [null, 5, null, null, null],
      ]);
    });

    it('should provide information about the source of the change in the `beforeChange` and `afterChange` hooks', async() => {
      const beforeChange = jasmine.createSpy('beforeChange');
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: [
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
          [13, 14, 15, 16],
        ],
        mergeCells: [{
          row: 0,
          col: 0,
          rowspan: 2,
          colspan: 2
        }],
        beforeChange,
        afterChange,
      });

      expect(beforeChange.calls.mostRecent().args[1]).toEqual('MergeCells');
      expect(afterChange.calls.mostRecent().args[1]).toEqual('MergeCells');

      getPlugin('mergeCells').merge(2, 2, 3, 3);

      expect(beforeChange.calls.mostRecent().args[1]).toEqual('MergeCells');
      expect(afterChange.calls.mostRecent().args[1]).toEqual('MergeCells');
    });

    it('should merge cells on startup respecting indexes sequence changes', async() => {
      handsontable({
        data: [
          ['A1', 'B1', null, null],
          ['A2', 'B2', null, null]
        ],
        mergeCells: [{
          row: 0,
          col: 2,
          rowspan: 1,
          colspan: 2
        }, {
          row: 1,
          col: 2,
          rowspan: 1,
          colspan: 2
        }],
        manualColumnMove: [1, 0, 2, 3],
      });

      expect(getSourceData()).toEqual([['A1', 'B1', null, null], ['A2', 'B2', null, null]]);
      expect(getData()).toEqual([['B1', 'A1', null, null], ['B2', 'A2', null, null]]);
    });
  });

  describe('manualColumnMove integration', () => {
    it('should follow merged cells when columns are moved (issue #10437 repro)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 6),
        manualColumnMove: true,
        mergeCells: [
          { row: 0, col: 4, rowspan: 3, colspan: 1 },
        ],
      });

      getPlugin('manualColumnMove').moveColumn(5, 4);
      await render();

      const merges = getPlugin('mergeCells').mergedCellsCollection.mergedCells;

      expect(merges.length).toBe(1);
      expect(merges[0].row).toBe(0);
      expect(merges[0].col).toBe(5);
      expect(merges[0].rowspan).toBe(3);
      expect(merges[0].colspan).toBe(1);
    });

    it('should shift a horizontal merge that is moved as a whole', async() => {
      handsontable({
        data: createSpreadsheetData(4, 8),
        manualColumnMove: true,
        mergeCells: [
          { row: 0, col: 2, rowspan: 1, colspan: 3 },
        ],
      });

      getPlugin('manualColumnMove').moveColumns([2, 3, 4], 0);
      await render();

      const merges = getPlugin('mergeCells').mergedCellsCollection.mergedCells;

      expect(merges.length).toBe(1);
      expect(merges[0].row).toBe(0);
      expect(merges[0].col).toBe(0);
      expect(merges[0].colspan).toBe(3);
    });

    it('should auto-split a horizontal merge bisected by a column move (rowspan kept)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 8),
        manualColumnMove: true,
        mergeCells: [
          { row: 0, col: 2, rowspan: 2, colspan: 3 },
        ],
      });

      getPlugin('manualColumnMove').moveColumn(3, 0);
      await render();

      const merges = getPlugin('mergeCells').mergedCellsCollection.mergedCells
        .slice()
        .sort((a, b) => a.col - b.col);

      expect(merges.length).toBe(2);
      expect(merges[0].row).toBe(0);
      expect(merges[0].col).toBe(0);
      expect(merges[0].rowspan).toBe(2);
      expect(merges[0].colspan).toBe(1);
      expect(merges[1].row).toBe(0);
      expect(merges[1].col).toBe(3);
      expect(merges[1].rowspan).toBe(2);
      expect(merges[1].colspan).toBe(2);
    });

    it('should drop singleton fragments left after bisecting a colspan-only merge', async() => {
      handsontable({
        data: createSpreadsheetData(4, 8),
        manualColumnMove: true,
        mergeCells: [
          { row: 0, col: 2, rowspan: 1, colspan: 2 },
        ],
      });

      getPlugin('manualColumnMove').moveColumn(2, 6);
      await render();

      const merges = getPlugin('mergeCells').mergedCellsCollection.mergedCells;

      expect(merges.length).toBe(0);
    });

    it('should follow merged cells when rows are moved', async() => {
      handsontable({
        data: createSpreadsheetData(6, 4),
        manualRowMove: true,
        mergeCells: [
          { row: 4, col: 0, rowspan: 1, colspan: 3 },
        ],
      });

      getPlugin('manualRowMove').moveRow(5, 4);
      await render();

      const merges = getPlugin('mergeCells').mergedCellsCollection.mergedCells;

      expect(merges.length).toBe(1);
      expect(merges[0].row).toBe(5);
      expect(merges[0].col).toBe(0);
      expect(merges[0].rowspan).toBe(1);
      expect(merges[0].colspan).toBe(3);
    });

    it('should auto-split a vertical merge bisected by a row move (colspan kept)', async() => {
      handsontable({
        data: createSpreadsheetData(8, 4),
        manualRowMove: true,
        mergeCells: [
          { row: 2, col: 0, rowspan: 3, colspan: 2 },
        ],
      });

      getPlugin('manualRowMove').moveRow(3, 0);
      await render();

      const merges = getPlugin('mergeCells').mergedCellsCollection.mergedCells
        .slice()
        .sort((a, b) => a.row - b.row);

      expect(merges.length).toBe(2);
      expect(merges[0].row).toBe(0);
      expect(merges[0].col).toBe(0);
      expect(merges[0].rowspan).toBe(1);
      expect(merges[0].colspan).toBe(2);
      expect(merges[1].row).toBe(3);
      expect(merges[1].col).toBe(0);
      expect(merges[1].rowspan).toBe(2);
      expect(merges[1].colspan).toBe(2);
    });

    it('should restore merged cells after undoing a column move', async() => {
      handsontable({
        data: createSpreadsheetData(4, 6),
        manualColumnMove: true,
        mergeCells: [
          { row: 0, col: 4, rowspan: 3, colspan: 1 },
        ],
      });

      getPlugin('manualColumnMove').moveColumn(5, 4);
      await render();

      getPlugin('undoRedo').undo();
      await render();

      const merges = getPlugin('mergeCells').mergedCellsCollection.mergedCells;

      expect(merges.length).toBe(1);
      expect(merges[0].col).toBe(4);
      expect(merges[0].colspan).toBe(1);
      expect(merges[0].rowspan).toBe(3);
    });

    it('should reapply a column move via redo', async() => {
      handsontable({
        data: createSpreadsheetData(4, 6),
        manualColumnMove: true,
        mergeCells: [
          { row: 0, col: 4, rowspan: 3, colspan: 1 },
        ],
      });

      getPlugin('manualColumnMove').moveColumn(5, 4);
      await render();
      getPlugin('undoRedo').undo();
      await render();
      getPlugin('undoRedo').redo();
      await render();

      const merges = getPlugin('mergeCells').mergedCellsCollection.mergedCells;

      expect(merges.length).toBe(1);
      expect(merges[0].col).toBe(5);
      expect(merges[0].colspan).toBe(1);
      expect(merges[0].rowspan).toBe(3);
    });

    it('should not translate merges when the move is rejected (movePossible=false)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 6),
        manualColumnMove: true,
        mergeCells: [
          { row: 0, col: 4, rowspan: 1, colspan: 2 },
        ],
      });

      // Out-of-bounds final index makes `movePossible` false.
      getPlugin('manualColumnMove').moveColumn(4, 100);

      await render();

      const merges = getPlugin('mergeCells').mergedCellsCollection.mergedCells;

      expect(merges.length).toBe(1);
      expect(merges[0].col).toBe(4);
      expect(merges[0].colspan).toBe(2);
    });

    it('should preserve user-declared merge coords through manualColumnMove initial config', async() => {
      handsontable({
        data: createSpreadsheetData(2, 4),
        manualColumnMove: [1, 0, 2, 3],
        mergeCells: [
          { row: 0, col: 2, rowspan: 1, colspan: 2 },
          { row: 1, col: 2, rowspan: 1, colspan: 2 },
        ],
      });

      const merges = getPlugin('mergeCells').mergedCellsCollection.mergedCells;

      expect(merges.length).toBe(2);
      expect(merges[0].col).toBe(2);
      expect(merges[1].col).toBe(2);
    });

    it('should follow merges through column freeze', async() => {
      handsontable({
        data: createSpreadsheetData(4, 6),
        manualColumnFreeze: true,
        mergeCells: [
          { row: 0, col: 4, rowspan: 2, colspan: 1 },
        ],
      });

      getPlugin('manualColumnFreeze').freezeColumn(4);
      await render();

      const merges = getPlugin('mergeCells').mergedCellsCollection.mergedCells;

      expect(merges.length).toBe(1);
      expect(merges[0].col).toBe(0);
      expect(merges[0].colspan).toBe(1);
      expect(merges[0].rowspan).toBe(2);
    });

    it('should keep a merge intact when an internal column move re-permutes its physical columns', async() => {
      handsontable({
        data: createSpreadsheetData(4, 8),
        manualColumnMove: true,
        hiddenColumns: { columns: [1] },
        mergeCells: [
          { row: 0, col: 0, rowspan: 1, colspan: 3 },
        ],
      });

      getPlugin('manualColumnMove').moveColumn(2, 0);
      await render();

      const merges = getPlugin('mergeCells').mergedCellsCollection.mergedCells;

      expect(merges.length).toBe(1);
      expect(merges[0].row).toBe(0);
      expect(merges[0].col).toBe(0);
      expect(merges[0].rowspan).toBe(1);
      expect(merges[0].colspan).toBe(3);
    });
  });

  describe('mergeCells updateSettings', () => {
    it('should allow to overwrite the initial settings using the updateSettings method', async() => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 }
        ]
      });
      let TD = hot.rootElement.querySelector('td');

      expect(TD.getAttribute('rowspan')).toBe('2');
      expect(TD.getAttribute('colspan')).toBe('2');

      await updateSettings({
        mergeCells: [
          { row: 2, col: 2, rowspan: 2, colspan: 2 }
        ]
      });

      TD = hot.rootElement.querySelector('td');
      expect(TD.getAttribute('rowspan')).toBe(null);
      expect(TD.getAttribute('colspan')).toBe(null);

      TD = getCell(2, 2);

      expect(TD.getAttribute('rowspan')).toBe('2');
      expect(TD.getAttribute('colspan')).toBe('2');
    });

    it('should allow resetting the merged cells by changing it to an empty array', async() => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 }
        ]
      });
      let TD = hot.rootElement.querySelector('td');

      expect(TD.getAttribute('rowspan')).toBe('2');
      expect(TD.getAttribute('colspan')).toBe('2');

      await updateSettings({
        mergeCells: []
      });

      TD = hot.rootElement.querySelector('td');
      expect(TD.getAttribute('rowspan')).toBe(null);
      expect(TD.getAttribute('colspan')).toBe(null);
    });

    it('should allow resetting and turning off the mergeCells plugin by changing mergeCells to \'false\'', async() => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 }
        ]
      });
      let TD = hot.rootElement.querySelector('td');

      expect(TD.getAttribute('rowspan')).toBe('2');
      expect(TD.getAttribute('colspan')).toBe('2');

      await updateSettings({
        mergeCells: false
      });

      TD = hot.rootElement.querySelector('td');
      expect(TD.getAttribute('rowspan')).toBe(null);
      expect(TD.getAttribute('colspan')).toBe(null);
    });

    it('should not emit the change hooks again when the `mergeCells` config is re-applied unchanged (#7555)', async() => {
      const beforeChange = jasmine.createSpy('beforeChange');
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: [
          ['A1', 'B1', 'C1'],
          ['A2', 'B2', 'C2'],
          ['A3', 'B3', 'C3'],
        ],
        mergeCells: [{ row: 1, col: 0, rowspan: 2, colspan: 2 }],
        beforeChange,
        afterChange,
      });

      // The first application clears every cell the merge area covers except its anchor.
      expect(beforeChange.calls.count()).toBe(1);
      expect(beforeChange.calls.mostRecent().args[0]).toEqual([
        [1, 1, 'B2', null],
        [2, 0, 'A3', null],
        [2, 1, 'B3', null],
      ]);

      beforeChange.calls.reset();
      afterChange.calls.reset();

      // Framework wrappers resend every setting on each render, so an unchanged `mergeCells` value
      // arrives again. Re-clearing the same cells would write nothing but still emit, which loops a
      // store-driven integration that re-renders in response to the hook.
      await updateSettings({
        mergeCells: [{ row: 1, col: 0, rowspan: 2, colspan: 2 }],
      });

      expect(beforeChange.calls.count()).toBe(0);
      expect(afterChange.calls.count()).toBe(0);
      expect(getData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', null, 'C2'],
        [null, null, 'C3'],
      ]);
    });

    it('should populate only the newly added merge area when the `mergeCells` config is extended', async() => {
      const beforeChange = jasmine.createSpy('beforeChange');

      handsontable({
        data: [
          ['A1', 'B1', 'C1', 'D1'],
          ['A2', 'B2', 'C2', 'D2'],
          ['A3', 'B3', 'C3', 'D3'],
        ],
        mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
        beforeChange,
      });

      beforeChange.calls.reset();

      await updateSettings({
        mergeCells: [
          { row: 0, col: 0, rowspan: 1, colspan: 2 },
          { row: 2, col: 2, rowspan: 1, colspan: 2 },
        ],
      });

      expect(beforeChange.calls.count()).toBe(1);
      expect(beforeChange.calls.mostRecent().args[0]).toEqual([
        [2, 3, 'D3', null],
      ]);
    });

    it('should stay quiet on a re-apply when the visual and physical column order differ', async() => {
      const beforeChange = jasmine.createSpy('beforeChange');
      const mergeCells = [{ row: 0, col: 0, rowspan: 2, colspan: 2 }];

      handsontable({
        data: [
          ['A1', 'B1', 'C1'],
          ['A2', 'B2', 'C2'],
          ['A3', 'B3', 'C3'],
        ],
        // Visual column 0 is physical 2, visual 1 is physical 0. Reading the stored value with a
        // physical index would land on the anchor column and see a value that was never cleared.
        manualColumnMove: [2, 0, 1],
        mergeCells,
        beforeChange,
      });

      const dataAfterMerge = getData();

      beforeChange.calls.reset();

      await updateSettings({ mergeCells });
      await updateSettings({ mergeCells });

      expect(beforeChange.calls.count()).toBe(0);
      expect(getData()).toEqual(dataAfterMerge);
    });

    it('should stay quiet on a re-apply when a `valueGetter` makes a cleared cell read back non-null', async() => {
      const beforeChange = jasmine.createSpy('beforeChange');

      handsontable({
        data: [
          ['A1', 'B1', 'C1'],
          ['A2', 'B2', 'C2'],
          ['A3', 'B3', 'C3'],
        ],
        // The displayed value of a cleared cell is no longer `null`, so the decision to skip has to
        // read the stored value instead.
        columns: [{ valueGetter: value => value ?? 'N/A' }, { valueGetter: value => value ?? 'N/A' }, {}],
        mergeCells: [{ row: 1, col: 0, rowspan: 2, colspan: 2 }],
        beforeChange,
      });

      beforeChange.calls.reset();

      await updateSettings({ mergeCells: [{ row: 1, col: 0, rowspan: 2, colspan: 2 }] });
      await updateSettings({ mergeCells: [{ row: 1, col: 0, rowspan: 2, colspan: 2 }] });

      expect(beforeChange.calls.count()).toBe(0);
      expect(getSourceData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', null, 'C2'],
        [null, null, 'C3'],
      ]);
    });

    it('should keep trying to clear a covered cell whose clearing write is cancelled', async() => {
      // Documented limitation: the skip is decided from the stored value, so a handler that refuses
      // the write leaves the cell filled and every re-apply tries again.
      const beforeChange = jasmine.createSpy('beforeChange').and.returnValue(false);

      handsontable({
        data: [
          ['A1', 'B1', 'C1'],
          ['A2', 'B2', 'C2'],
          ['A3', 'B3', 'C3'],
        ],
        mergeCells: [{ row: 1, col: 0, rowspan: 2, colspan: 2 }],
        beforeChange,
      });

      beforeChange.calls.reset();

      await updateSettings({ mergeCells: [{ row: 1, col: 0, rowspan: 2, colspan: 2 }] });

      expect(beforeChange.calls.count()).toBe(1);
      expect(getData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        ['A3', 'B3', 'C3'],
      ]);
    });

    it('should still clear the covered cells of newly passed data when `mergeCells` is unchanged', async() => {
      const beforeChange = jasmine.createSpy('beforeChange');

      handsontable({
        data: [
          ['A1', 'B1', 'C1'],
          ['A2', 'B2', 'C2'],
          ['A3', 'B3', 'C3'],
        ],
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }],
        beforeChange,
      });

      beforeChange.calls.reset();

      // The new data brings real values back into the covered cells, so they are cleared again. Only
      // a re-apply that would change nothing is skipped.
      await updateSettings({
        data: [
          ['X1', 'Y1', 'Z1'],
          ['X2', 'Y2', 'Z2'],
          ['X3', 'Y3', 'Z3'],
        ],
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }],
      });

      expect(beforeChange.calls.count()).toBe(1);
      expect(getData()).toEqual([
        ['X1', null, 'Z1'],
        [null, null, 'Z2'],
        ['X3', 'Y3', 'Z3'],
      ]);
    });

    it('should settle after one re-population when the `mergeCells` config is re-applied over a sorted grid', async() => {
      const beforeChange = jasmine.createSpy('beforeChange');
      const mergeCells = [{ row: 1, col: 0, rowspan: 2, colspan: 2 }];

      handsontable({
        data: [
          ['A1', 'B1', 5],
          ['A2', 'B2', 3],
          ['A3', 'B3', 4],
          ['A4', 'B4', 1],
          ['A5', 'B5', 2],
        ],
        mergeCells,
        columnSorting: true,
        beforeChange,
      });

      // Sorting moves other rows under the merge area, so the covered cells hold values again.
      getPlugin('columnSorting').sort({ column: 2, sortOrder: 'asc' });

      expect(getData()).toEqual([
        ['A4', 'B4', 1],
        ['A5', 'B5', 2],
        ['A2', null, 3],
        [null, null, 4],
        ['A1', 'B1', 5],
      ]);

      beforeChange.calls.reset();

      await updateSettings({ mergeCells });

      // Those values are cleared once, and only the cells that still held one are touched.
      expect(beforeChange.calls.count()).toBe(1);
      expect(beforeChange.calls.mostRecent().args[0]).toEqual([
        [1, 1, 'B5', null],
        [2, 0, 'A2', null],
      ]);
      expect(getData()).toEqual([
        ['A4', 'B4', 1],
        ['A5', null, 2],
        [null, null, 3],
        [null, null, 4],
        ['A1', 'B1', 5],
      ]);

      beforeChange.calls.reset();

      // From here the area is empty again, so further re-applies stay silent.
      await updateSettings({ mergeCells });
      await updateSettings({ mergeCells });

      expect(beforeChange.calls.count()).toBe(0);
    });

    it('should populate the merge area again when the `mergeCells` config changes its span', async() => {
      const beforeChange = jasmine.createSpy('beforeChange');

      handsontable({
        data: [
          ['A1', 'B1', 'C1'],
          ['A2', 'B2', 'C2'],
          ['A3', 'B3', 'C3'],
        ],
        mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
        beforeChange,
      });

      beforeChange.calls.reset();

      await updateSettings({
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }],
      });

      expect(beforeChange.calls.count()).toBe(1);
      expect(beforeChange.calls.mostRecent().args[0]).toEqual([
        [0, 1, null, null],
        [1, 0, 'A2', null],
        [1, 1, 'B2', null],
      ]);
    });
  });

  describe('loadData', () => {
    it('should preserve column widths after loadData when autoColumnSize and mergeCells are enabled (#8864)', async() => {
      const data = [
        ['', 'Group 2', 'Group 2', 'Group 2'],
        ['', 'Col1', 'Group 1', 'Group 1'],
        ['', 'Col1', 'Col2', 'Col3'],
        ['Row1', '', '', ''],
      ];

      handsontable({
        data: data.map(row => row.slice()),
        mergeCells: [
          { row: 0, col: 1, rowspan: 1, colspan: 3 },
          { row: 1, col: 1, rowspan: 2, colspan: 1 },
          { row: 1, col: 2, rowspan: 1, colspan: 2 },
        ],
        autoColumnSize: true,
      });

      const widthsBefore = [0, 1, 2, 3].map(col => getColWidth(col));

      await loadData(data.map(row => row.slice()));

      const widthsAfter = [0, 1, 2, 3].map(col => getColWidth(col));

      expect(widthsAfter).toEqual(widthsBefore);
    });

    it('should restore `spanned` and `hidden` cell metas after loadData', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: [
          { row: 0, col: 1, rowspan: 1, colspan: 3 },
        ],
      });

      await loadData(createSpreadsheetData(5, 5));

      expect(getCellMeta(0, 1).spanned).toBe(true);
      expect(getCellMeta(0, 2).hidden).toBe(true);
      expect(getCellMeta(0, 3).hidden).toBe(true);
    });
  });

  describe('mergeCells copy', () => {
    it('should not copy text of cells that are merged into another cell', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 }
        ]
      });

      expect(getCopyableText(0, 0, 2, 2)).toBe('A1\t\tC1\n\t\tC2\nA3\tB3\tC3');
    });
  });

  describe('merged cells selection', () => {
    it('should not change the selection after toggling the merge/unmerge state', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: true
      });

      await selectCell(2, 2, 4, 4);
      await keyDownUp(['control', 'm']);

      const mergedCell = getCell(2, 2);

      expect(mergedCell.rowSpan).toBe(3);
      expect(mergedCell.colSpan).toBe(3);
      expect(getSelected()).toEqual([[2, 2, 4, 4]]);

      await keyDownUp(['control', 'm']);

      expect(mergedCell.rowSpan).toBe(1);
      expect(mergedCell.colSpan).toBe(1);
      expect(getSelected()).toEqual([[2, 2, 4, 4]]);
    });

    it('should select the whole range of cells which form a merged cell', async() => {
      handsontable({
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

      const $table = spec().$container.find('table.htCore');
      const $td = $table.find('tr:eq(0) td:eq(0)');

      expect($td.attr('rowspan')).toEqual('1');
      expect($td.attr('colspan')).toEqual('4');

      expect(getSelectedLast()).toBeUndefined();

      await selectCell(0, 0);

      expect(getSelectedLast()).toEqual([0, 0, 0, 3]);

      await deselectCell();

      await selectCell(0, 1);

      expect(getSelectedLast()).toEqual([0, 0, 0, 3]);
    });

    it('should always make a rectangular selection, when selecting merged and not merged cells', async() => {
      handsontable({
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

      const $table = spec().$container.find('table.htCore');
      const $td = $table.find('tr:eq(1) td:eq(1)');

      expect($td.attr('rowspan')).toEqual('2');
      expect($td.attr('colspan')).toEqual('3');

      expect(getSelectedLast()).toBeUndefined();

      await selectCell(0, 0);

      expect(getSelectedLast()).toEqual([0, 0, 0, 0]);

      await deselectCell();

      await selectCell(0, 0, 1, 1);

      expect(getSelectedLast()).not.toEqual([0, 0, 1, 1]);
      expect(getSelectedLast()).toEqual([0, 0, 2, 3]);

      await deselectCell();

      await selectCell(0, 1, 1, 1);

      expect(getSelectedLast()).toEqual([0, 1, 2, 3]);
    });

    it('should not switch the selection start point when selecting from non-merged cells to merged cells', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 },
          { row: 3, col: 4, rowspan: 2, colspan: 2 }
        ]
      });

      $(getCell(6, 6)).simulate('mousedown');

      expect(getSelectedRangeLast().from.col).toEqual(6);
      expect(getSelectedRangeLast().from.row).toEqual(6);

      $(getCell(1, 1)).simulate('mouseenter');

      expect(getSelectedRangeLast().from.col).toEqual(6);
      expect(getSelectedRangeLast().from.row).toEqual(6);

      $(getCell(3, 3)).simulate('mouseenter');

      expect(getSelectedRangeLast().from.col).toEqual(6);
      expect(getSelectedRangeLast().from.row).toEqual(6);

      $(getCell(4, 4)).simulate('mouseenter');

      expect(getSelectedRangeLast().from.col).toEqual(6);
      expect(getSelectedRangeLast().from.row).toEqual(6);
    });

    // TODO: After some changes please take a look at #7010 (test for unspecified behavior)
    it('should select cells in the correct direction when changing selections around a merged range', async() => {
      handsontable({
        data: createSpreadsheetObjectData(10, 10),
        mergeCells: [
          { row: 4, col: 4, rowspan: 2, colspan: 2 }
        ]
      });

      await selectCell(5, 5, 5, 2);

      expect(getSelectedRangeLast().getDirection()).toEqual('NE-SW');
      // Rectangular area from the marginal cell to the cell on the opposite.
      expect(getSelected()).toEqual([[4, 5, 5, 2]]);

      // What about, for example: selectCell(5, 4, 5, 2);
      // Is it specified properly?
      await selectCell(4, 4, 2, 5);

      expect(getSelectedRangeLast().getDirection()).toEqual('SW-NE');
      // It flips the selection direction vertically.
      expect(getSelected()).toEqual([[5, 4, 2, 5]]);

      await selectCell(4, 4, 5, 7);

      expect(getSelectedRangeLast().getDirection()).toEqual('NW-SE');
      expect(getSelected()).toEqual([[4, 4, 5, 7]]);

      await selectCell(4, 5, 7, 5);

      expect(getSelectedRangeLast().getDirection()).toEqual('NW-SE');
      // It flips the selection direction horizontally.
      expect(getSelected()).toEqual([[4, 4, 7, 5]]);
    });

    it('should not add an area class to the selected cell if a single merged cell is selected', async() => {
      handsontable({
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

      await selectCell(1, 1);
      expect(getCell(1, 1).className.indexOf('area')).toEqual(-1);

      await selectCell(1, 1, 4, 4);
      expect(getCell(1, 1).className.indexOf('area')).not.toEqual(-1);

      await selectCell(1, 1);
      expect(getCell(1, 1).className.indexOf('area')).toEqual(-1);

      await selectCell(0, 0);
      expect(getCell(1, 1).className.indexOf('area')).toEqual(-1);
    });

    it('should render fill handle after merge cells', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: true
      });

      const plugin = getPlugin('mergeCells');

      await selectCell(0, 0, 2, 2);
      plugin.mergeSelection();

      expect(spec().$container.find('.wtBorder.current.corner:visible').length).toEqual(1);
    });

    it('should render fill handle when merge cells is highlighted cell in right bottom corner', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 2, col: 2, rowspan: 2, colspan: 2 }
        ]
      });

      await selectCell(2, 2, 1, 1);

      expect(spec().$container.find('.wtBorder.corner:visible').length).toEqual(1);
    });

    it('should render fill handle when cell in right bottom corner is a merged cell', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 2, col: 2, rowspan: 2, colspan: 2 }
        ]
      });

      await selectCell(1, 1, 2, 2);

      expect(spec().$container.find('.wtBorder.corner:visible').length).toEqual(1);
    });

    it('should select the cell in the top-left corner of the merged cell, when navigating down using the ENTER key on the' +
      ' bottom edge of the table', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        autoWrapRow: true,
        autoWrapCol: true,
        mergeCells: [
          { row: 8, col: 8, rowspan: 2, colspan: 2 }
        ]
      });

      await setDataAtCell(8, 8, 'top-left-corner!');
      await selectCell(7, 9);

      await keyDownUp('enter');
      await keyDownUp('enter');
      await keyDownUp('enter');

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('top-left-corner!');

      await keyDownUp('enter');
      await keyDownUp('enter');

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      await keyDownUp('enter');
      await keyDownUp('enter');

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A2');
    });

    it('should not select the cell in the top-left corner of the merged cell, when navigating down using the TAB key on the' +
      ' bottom edge of the table', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 8, col: 8, rowspan: 2, colspan: 2 }
        ],
        autoWrapCol: false,
        autoWrapRow: false
      });

      await setDataAtCell(8, 8, 'top-left-corner!');
      await selectCell(9, 7);

      await keyDownUp('enter');
      await keyDownUp('tab');
      await keyDownUp('enter');

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('top-left-corner!');

      await keyDownUp('tab');
      await keyDownUp('enter');

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('');

      await keyDownUp('tab');
      await keyDownUp('enter');

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('');
    });

    it('should select the cell in the top-left corner of the merged cell, when navigating down using the SHIFT + ENTER key on the' +
      ' top edge of the table', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 }
        ],
        autoWrapCol: false,
        autoWrapRow: false
      });

      await setDataAtCell(0, 0, 'top-left-corner!');

      await selectCell(2, 1);

      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('top-left-corner!');

      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('top-left-corner!');

      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('top-left-corner!');
    });

    it('should select the cell in the top-left corner of the merged cell, when navigating down using the SHIFT + TAB key on the' +
      ' top edge of the table', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 }
        ],
        autoWrapRow: true,
        autoWrapCol: true,
      });

      await setDataAtCell(0, 0, 'top-left-corner!');

      await selectCell(1, 2);

      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'enter']);

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('top-left-corner!');

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'enter']);

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('J1');

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'enter']);

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('I1');
    });

    describe('compatibility with other plugins', () => {
      it('should be possible to traverse through columns using the DOWN ARROW or ENTER, when there\'s a' +
        ' partially-hidden merged cell in the way', async() => {
        handsontable({
          data: createSpreadsheetData(4, 4),
          hiddenColumns: {
            columns: [1],
            indicators: true
          },
          mergeCells: [
            { row: 1, col: 1, rowspan: 2, colspan: 2 }
          ]
        });

        await selectCell(0, 2);

        await keyDownUp('enter');
        await keyDownUp('enter');

        let lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 2));

        await keyDownUp('enter');
        await keyDownUp('enter');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(3, 2));

        await selectCell(0, 2);

        await keyDownUp('arrowdown');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 2));

        await keyDownUp('arrowdown');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(3, 2));
      });

      it('should be possible to traverse through columns using the UP ARROW or SHIFT+ENTER, when there\'s a' +
        ' partially-hidden merged cell in the way', async() => {
        handsontable({
          data: createSpreadsheetData(4, 4),
          hiddenColumns: {
            columns: [1],
            indicators: true
          },
          mergeCells: [
            { row: 1, col: 1, rowspan: 2, colspan: 2 }
          ]
        });

        await selectCell(3, 2);

        await keyDownUp(['shift', 'enter']);
        await keyDownUp(['shift', 'enter']);

        let lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 2));

        await keyDownUp(['shift', 'enter']);
        await keyDownUp(['shift', 'enter']);

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(0, 2));

        await selectCell(3, 2);

        await keyDownUp('arrowup');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 2));

        await keyDownUp('arrowup');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(0, 2));
      });

      it('should be possible to traverse through columns using the RIGHT ARROW or TAB, when there\'s a' +
        ' partially-hidden merged cell in the way', async() => {
        handsontable({
          data: createSpreadsheetData(4, 4),
          hiddenRows: {
            rows: [1],
            indicators: true
          },
          mergeCells: [
            { row: 1, col: 1, rowspan: 2, colspan: 2 }
          ]
        });

        await selectCell(2, 0);

        await keyDownUp('tab');

        let lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 2));

        await keyDownUp('tab');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 3));

        await selectCell(2, 0);

        await keyDownUp('arrowright');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 2));

        await keyDownUp('arrowright');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 3));
      });

      it('should be possible to traverse through columns using the LEFT ARROW or SHIFT+TAB, when there\'s a' +
        ' partially-hidden merged cell in the way', async() => {
        handsontable({
          data: createSpreadsheetData(4, 4),
          hiddenRows: {
            rows: [1],
            indicators: true
          },
          mergeCells: [
            { row: 1, col: 1, rowspan: 2, colspan: 2 }
          ]
        });

        await selectCell(2, 3);

        await keyDownUp(['shift', 'tab']);

        let lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 2));

        await keyDownUp(['shift', 'tab']);

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 0));

        await selectCell(2, 3);

        await keyDownUp('arrowleft');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 2));

        await keyDownUp('arrowleft');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 0));
      });
    });
  });

  describe('merge cells shift', () => {
    it('should shift the merged cells right, when inserting a column on the left side of them', async() => {
      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
          { row: 3, col: 5, rowspan: 2, colspan: 1 },
          { row: 3, col: 6, rowspan: 2, colspan: 1 },
        ],
        height: 400,
        width: 400
      });

      await alter('insert_col_start', 3, 2);

      const cellsCollection = getPlugin('mergeCells').mergedCellsCollection;

      expect(cellsCollection.get(1, 1).col).toBe(1);
      expect(cellsCollection.get(3, 3)).toBe(false);
      expect(cellsCollection.get(3, 4)).toBe(false);
      expect(cellsCollection.get(3, 5)).toBe(false);
      expect(cellsCollection.get(3, 6)).toBe(false);
      expect(cellsCollection.get(3, 7).col).toBe(7);
      expect(cellsCollection.get(3, 8).col).toBe(8);
      expect(cellsCollection.get(3, 9)).toBe(false);
    });

    it('should shift the merged cells left, when removing a column on the left side of them', async() => {
      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
          { row: 3, col: 5, rowspan: 2, colspan: 1 },
          { row: 3, col: 6, rowspan: 2, colspan: 1 },
        ],
        height: 400,
        width: 400
      });

      await alter('remove_col', 3, 2);

      const cellsCollection = getPlugin('mergeCells').mergedCellsCollection;

      expect(cellsCollection.get(1, 1).col).toBe(1);
      expect(cellsCollection.get(3, 3).col).toBe(3);
      expect(cellsCollection.get(3, 4).col).toBe(4);
      expect(cellsCollection.get(3, 5)).toBe(false);
      expect(cellsCollection.get(3, 6)).toBe(false);
      expect(cellsCollection.get(3, 7)).toBe(false);

    });

    it('should shift the merged cells down, when inserting rows above them', async() => {
      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 1, col: 1, rowspan: 1, colspan: 2 },
          { row: 5, col: 5, rowspan: 2, colspan: 2 },
          { row: 7, col: 5, rowspan: 2, colspan: 2 },
        ],
        height: 400,
        width: 400
      });

      await alter('insert_row_above', 3, 2);

      const cellsCollection = getPlugin('mergeCells').mergedCellsCollection;

      expect(cellsCollection.get(1, 1).row).toBe(1);
      expect(cellsCollection.get(5, 5)).toBe(false);
      expect(cellsCollection.get(6, 5)).toBe(false);
      expect(cellsCollection.get(7, 5).row).toBe(7);
      expect(cellsCollection.get(8, 5).row).toBe(7);
      expect(cellsCollection.get(9, 5).row).toBe(9);
      expect(cellsCollection.get(10, 5).row).toBe(9);
    });

    it('should shift the merged cells up, when removing rows above them', async() => {
      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
          { row: 5, col: 5, rowspan: 2, colspan: 2 },
          { row: 7, col: 5, rowspan: 2, colspan: 2 },
        ],
        height: 400,
        width: 400
      });

      await alter('remove_row', 3, 2);

      const cellsCollection = getPlugin('mergeCells').mergedCellsCollection;

      expect(cellsCollection.get(1, 1).row).toBe(1);
      expect(cellsCollection.get(2, 5)).toBe(false);
      expect(cellsCollection.get(3, 5).row).toBe(3);
      expect(cellsCollection.get(4, 5).row).toBe(3);
      expect(cellsCollection.get(5, 5).row).toBe(5);
      expect(cellsCollection.get(6, 5).row).toBe(5);
      expect(cellsCollection.get(7, 5)).toBe(false);
    });

    it('should trim the merged cell\'s height, when removing rows between their start and end', async() => {
      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 1, col: 1, rowspan: 5, colspan: 3 }
        ],
        height: 400,
        width: 400
      });

      await alter('remove_row', 2, 2);

      const plugin = getPlugin('mergeCells');
      const mergedCellsCollection = plugin.mergedCellsCollection.mergedCells;

      expect(mergedCellsCollection[0].row).toEqual(1);
      expect(mergedCellsCollection[0].rowspan).toEqual(3);

      plugin.mergedCellsCollection.clear();
      plugin.merge(1, 1, 2, 2);

      await alter('remove_row', 2, 2);

      expect(mergedCellsCollection[0].row).toEqual(1);
      expect(mergedCellsCollection[0].rowspan).toEqual(1);
    });

    it('should trim the merged cell\'s width, when removing columns between their start and end', async() => {
      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 5 }
        ],
        height: 400,
        width: 400
      });

      await alter('remove_col', 2, 2);

      const plugin = getPlugin('mergeCells');
      const mergedCellsCollection = plugin.mergedCellsCollection.mergedCells;

      expect(mergedCellsCollection[0].col).toEqual(1);
      expect(mergedCellsCollection[0].colspan).toEqual(3);

      plugin.mergedCellsCollection.clear();
      plugin.merge(1, 1, 2, 2);

      await alter('remove_col', 2, 2);

      expect(mergedCellsCollection[0].col).toEqual(1);
      expect(mergedCellsCollection[0].colspan).toEqual(1);
    });

    it('should shift the `row` of a merged cells, when removing rows consisting it', async() => {
      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 5, col: 5, rowspan: 5, colspan: 3 }
        ],
        height: 400,
        width: 400
      });

      await alter('remove_row', 4, 3);

      const plugin = getPlugin('mergeCells');
      const mergedCellsCollection = plugin.mergedCellsCollection.mergedCells;

      expect(mergedCellsCollection[0].row).toEqual(4);
      expect(mergedCellsCollection[0].rowspan).toEqual(3);

      plugin.mergedCellsCollection.clear();
      plugin.merge(1, 1, 2, 2);

      await alter('remove_row', 0, 2);

      expect(mergedCellsCollection[0].row).toEqual(0);
      expect(mergedCellsCollection[0].rowspan).toEqual(1);

      plugin.mergedCellsCollection.clear();
      plugin.merge(1, 1, 2, 2);

      await alter('remove_row', 1, 1);

      expect(mergedCellsCollection[0].row).toEqual(1);
      expect(mergedCellsCollection[0].rowspan).toEqual(1);
    });

    it('should shift the `col` of a merged cells, when removing columns consisting it', async() => {
      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 5, col: 5, rowspan: 3, colspan: 5 }
        ],
        height: 400,
        width: 400
      });

      await alter('remove_col', 4, 3);

      const plugin = getPlugin('mergeCells');
      const mergedCellsCollection = plugin.mergedCellsCollection.mergedCells;

      expect(mergedCellsCollection[0].col).toEqual(4);
      expect(mergedCellsCollection[0].colspan).toEqual(3);

      plugin.mergedCellsCollection.clear();
      plugin.merge(1, 1, 2, 2);

      await alter('remove_col', 0, 2);

      expect(mergedCellsCollection[0].col).toEqual(0);
      expect(mergedCellsCollection[0].colspan).toEqual(1);

      plugin.mergedCellsCollection.clear();
      plugin.merge(1, 1, 2, 2);

      await alter('remove_col', 1, 1);

      expect(mergedCellsCollection[0].col).toEqual(1);
      expect(mergedCellsCollection[0].colspan).toEqual(1);
    });

    it('should allow removing multiple merged cells, while removing multiple rows', async() => {
      const errorSpy = spyOn(console, 'error');

      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 },
          { row: 5, col: 5, rowspan: 3, colspan: 3 }
        ],
        height: 400,
        width: 400
      });

      await alter('remove_row', 0, 10);

      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('merged cell candidates validation', () => {
    it('should check if the provided merged cell information object contains negative values, and if so, do not add it ' +
      'to the collection and throw an appropriate warning', async() => {
      const warnSpy = spyOnConsoleWarn();
      const newMergedCells = [
        {
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        },
        {
          row: -5,
          col: 8,
          rowspan: 3,
          colspan: 4
        },
        {
          row: 20,
          col: -21,
          rowspan: 3,
          colspan: 4
        },
        {
          row: 200,
          col: 210,
          rowspan: -3,
          colspan: 4
        },
        {
          row: 220,
          col: 220,
          rowspan: 3,
          colspan: -4
        }];

      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: newMergedCells
      });

      expect(warnSpy)
        .toHaveBeenCalledWith('The merged cell declared with {row: -5, col: 8, rowspan: 3, colspan: 4} ' +
          'contains negative values, which is not supported. It will not be added to the collection.');
      expect(warnSpy)
        .toHaveBeenCalledWith('The merged cell declared with {row: 20, col: -21, rowspan: 3, colspan: 4} ' +
          'contains negative values, which is not supported. It will not be added to the collection.');
      expect(warnSpy)
        .toHaveBeenCalledWith('The merged cell declared with {row: 200, col: 210, rowspan: -3, colspan: 4} ' +
          'contains negative values, which is not supported. It will not be added to the collection.');
      expect(warnSpy)
        .toHaveBeenCalledWith('The merged cell declared with {row: 220, col: 220, rowspan: 3, colspan: -4} ' +
          'contains negative values, which is not supported. It will not be added to the collection.');

      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toEqual(1);
    });

    it('should check if the provided merged cell information object has rowspan and colspan declared as 0, and if so, do not add it ' +
      'to the collection and throw an appropriate warning', async() => {
      const warnSpy = spyOnConsoleWarn();
      const newMergedCells = [
        {
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        },
        {
          row: 6,
          col: 6,
          rowspan: 0,
          colspan: 0
        },
        {
          row: 9,
          col: 9,
          rowspan: 1,
          colspan: 0
        }
      ];

      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: newMergedCells
      });

      expect(warnSpy).toHaveBeenCalledWith('The merged cell declared at [6, 6] has "rowspan" or ' +
        '"colspan" declared as "0", which is not supported. It cannot be added to the collection.');
      expect(warnSpy).toHaveBeenCalledWith('The merged cell declared at [9, 9] has "rowspan" or ' +
        '"colspan" declared as "0", which is not supported. It cannot be added to the collection.');

      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toEqual(1);
    });

    it('should check if the provided merged cell information object represents a single cell, and if so, do not add it ' +
      'to the collection and throw an appropriate warning', async() => {
      const warnSpy = spyOnConsoleWarn();
      const newMergedCells = [
        {
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        },
        {
          row: 5,
          col: 8,
          rowspan: 1,
          colspan: 1
        },
        {
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        }
      ];

      handsontable({
        data: createSpreadsheetData(30, 30),
        mergeCells: newMergedCells
      });

      expect(warnSpy).toHaveBeenCalledWith('The merged cell declared at [5, 8] has both "rowspan" and "colspan" ' +
        'declared as "1", which makes it a single cell. It cannot be added to the collection.');
      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toEqual(2);
    });

    it('should check if the provided merged cell information object contains merged declared out of bounds, and if so, ' +
      'do not add it to the collection and throw an appropriate warning', async() => {
      const warnSpy = spyOnConsoleWarn();
      const newMergedCells = [
        {
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        },
        {
          row: 17,
          col: 17,
          rowspan: 5,
          colspan: 5
        },
        {
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        }
      ];

      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: newMergedCells
      });

      expect(warnSpy).toHaveBeenCalledWith('The merged cell declared at [17, 17] is positioned ' +
        '(or positioned partially) outside of the table range. It was not added to the table, please fix your setup.');
      expect(warnSpy).toHaveBeenCalledWith('The merged cell declared at [20, 21] is positioned ' +
        '(or positioned partially) outside of the table range. It was not added to the table, please fix your setup.');
      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toEqual(1);
    });
  });

  describe('ContextMenu', () => {
    it('should disable `Merge cells` context menu item when context menu was triggered from corner header', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        mergeCells: true,
      });

      const corner = $('.ht_clone_top_inline_start_corner .htCore').find('thead').find('th').eq(0);

      await simulateClick(corner, 'RMB');
      await contextMenu();

      expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
        'Insert column left',
        'Insert column right',
        'Remove columns',
        'Undo',
        'Redo',
        'Read only',
        'Alignment',
        'Merge cells',
      ].join(''));
    });
  });

  describe('Validation', () => {
    it('should not hide the merged cells after validating the table', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 5, col: 4, rowspan: 2, colspan: 2 },
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
        ],
        validator(query, callback) {
          callback(true);
        },
        afterValidate: onAfterValidate
      });

      let firstCollection = getCell(5, 4);
      let secondCollection = getCell(1, 1);

      expect(firstCollection.style.display.indexOf('none')).toEqual(-1);
      expect(secondCollection.style.display.indexOf('none')).toEqual(-1);

      await validateCells();
      await waitForNextAnimationFrames(2);

      expect(onAfterValidate).toHaveBeenCalled();

      firstCollection = getCell(5, 4);
      secondCollection = getCell(1, 1);

      expect(firstCollection.style.display.indexOf('none')).toEqual(-1);
      expect(secondCollection.style.display.indexOf('none')).toEqual(-1);
    });
  });

  describe('Entire row/column selection', () => {
    it('should be possible to select a single entire column, when there\'s a merged cell in it', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 5, col: 4, rowspan: 2, colspan: 5 }
        ]
      });

      await selectColumns(5);

      expect(getSelectedLast()).toEqual([0, 5, 9, 5]);

      // it should work only for selecting the entire column
      await selectCell(4, 5, 7, 5);

      expect(getSelectedLast()).toEqual([4, 4, 7, 8]);
    });

    it('should be possible to select a single entire row, when there\'s a merged cell in it', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 5, col: 4, rowspan: 5, colspan: 2 }
        ]
      });

      await selectRows(5);

      expect(getSelectedLast()).toEqual([5, 0, 5, 9]);

      // it should work only for selecting the entire row
      await selectCell(6, 3, 6, 7);

      expect(getSelectedLast()).toEqual([5, 3, 9, 7]);
    });
  });

  describe('cooperation with the `Autofill` plugin', () => {
    it('should add new merged areas when dragged the merged cell', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 }
        ],
        fillHandle: true
      });

      await selectCell(0, 0);

      // Dragging merged cell one level down.
      simulateFillHandleDrag(getCell(2, 0));

      // First merged cell.
      expect(spec().$container.find('tr:eq(0) td:eq(0)')[0].offsetWidth).toBe(100);
      expect(spec().$container.find('tr:eq(0) td:eq(0)')[0].offsetHeight).toBe(
        ((2 * getThemeLayout().defaultDataRowHeight) + getThemeLayout().cellBorderWidth),
      );
      expect(getCell(0, 1).innerText).toBe('A1');
      expect(getDataAtCell(0, 0)).toBe('A1');
      // Already populated merged cell.
      expect(spec().$container.find('tr:eq(2) td:eq(0)')[0].offsetWidth).toBe(100);
      expect(spec().$container.find('tr:eq(2) td:eq(0)')[0].offsetHeight).toBe(
        (2 * getThemeLayout().defaultDataRowHeight),
      );
      expect(getCell(2, 1).innerText).toBe('A1');
      expect(getDataAtCell(2, 0)).toBe('A1');

      await selectCell(0, 0);

      // Dragging merged cell one level right.
      simulateFillHandleDrag(getCell(0, 2));

      // First merged cell.
      expect(spec().$container.find('tr:eq(0) td:eq(0)')[0].offsetWidth).toBe(100);
      expect(spec().$container.find('tr:eq(0) td:eq(0)')[0].offsetHeight).toBe(
        ((2 * getThemeLayout().defaultDataRowHeight) + getThemeLayout().cellBorderWidth),
      );
      expect(getCell(0, 1).innerText).toBe('A1');
      expect(getDataAtCell(0, 0)).toBe('A1');
      // Previously populated merged cell.
      expect(spec().$container.find('tr:eq(2) td:eq(0)')[0].offsetWidth).toBe(100);
      expect(spec().$container.find('tr:eq(2) td:eq(0)')[0].offsetHeight).toBe(
        (2 * getThemeLayout().defaultDataRowHeight),
      );
      expect(getCell(2, 1).innerText).toBe('A1');
      expect(getDataAtCell(2, 0)).toBe('A1');
      // Already populated merged cell.
      expect(spec().$container.find('tr:eq(0) td:eq(2)')[0].offsetWidth).toBe(100);
      expect(spec().$container.find('tr:eq(0) td:eq(2)')[0].offsetHeight).toBe(
        ((2 * getThemeLayout().defaultDataRowHeight) + getThemeLayout().cellBorderWidth),
      );
      expect(getCell(0, 3).innerText).toBe('A1');
      expect(getDataAtCell(0, 2)).toBe('A1');

      expect($(getHtCore())[0].offsetWidth).toBe(5 * 50);
      const L = getThemeLayout();

      expect($(getHtCore())[0].offsetHeight).toBe(L.firstRenderedRowDefaultHeight + (4 * L.defaultDataRowHeight));
    });
  });

  describe('cooperation with the `CopyPaste` plugin', () => {
    // A validator moves `applyChanges` into a microtask, so the paste is not finished when
    // `triggerPaste` returns. Wait for the change to be applied AND for the plugin to have reacted
    // to it: the `orderIndex` puts this listener behind the plugin's own `afterChange` handler,
    // which is registered at the default index.
    function pasteAndSettle(text) {
      const settled = new Promise((resolve) => {
        hot().addHookOnce('afterChange', resolve, 2000);
      });

      triggerPaste(text);

      return settled;
    }

    // The paste writes into every cell of the area, including the ones the merge keeps hidden. Before
    // the fix the merge survived, so eight of the nine pasted values were stored but never rendered:
    // the grid showed one value while `getData()` returned nine (#5092).
    it('should unmerge the destination area when a multi-cell block is pasted over a merged cell', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 5, col: 6, rowspan: 3, colspan: 3 }, // G6:I8
        ],
      });

      await selectCell(5, 6);

      triggerPaste('a\tb\tc\nd\te\tf\ng\th\ti');

      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toBe(0);
      expect(getData(5, 6, 7, 8)).toEqual([
        ['a', 'b', 'c'],
        ['d', 'e', 'f'],
        ['g', 'h', 'i'],
      ]);

      // Every pasted value has to be visible, so no cell may be left covered.
      for (let row = 5; row <= 7; row++) {
        for (let column = 6; column <= 8; column++) {
          expect(getCellMeta(row, column).hidden).toBeFalsy();
          expect(getCellMeta(row, column).spanned).toBeFalsy();
          expect(getCellMeta(row, column).copyable).not.toBe(false);
        }
      }
    });

    // A single pasted value carries no structure, so it must not destroy the merge. It needs an
    // intervention all the same: a selection touching a merge is expanded to the merge's whole
    // rectangle and the clipboard is then tiled across it, which without the fix wrote the one value
    // into all nine cells.
    it('should keep the merged cell and write only its top-left cell when a single value is pasted', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 5, col: 6, rowspan: 3, colspan: 3 }, // G6:I8
        ],
      });

      await selectCell(5, 6);

      triggerPaste('ZZ');

      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toBe(1);
      expect(getDataAtCell(5, 6)).toBe('ZZ');
      expect(getData(5, 6, 7, 8)).toEqual([
        ['ZZ', null, null],
        [null, null, null],
        [null, null, null],
      ]);

      // The covered cells stay covered, so the value is not repeated nine times on screen.
      expect(getCellMeta(5, 7).hidden).toBe(true);
      expect(getCellMeta(7, 8).hidden).toBe(true);
    });

    // A paste writes `max(clipboard extent, selection extent)`, so the written rectangle can reach
    // past the selection and clip a merge whose top-left corner the selection never touched. An
    // anchor-only lookup misses exactly those.
    it('should unmerge a merged cell that only the paste overflow reaches, not the selection', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 2, col: 1, rowspan: 2, colspan: 2 }, // B3:C4 - fully inside the written area
          { row: 1, col: 3, rowspan: 3, colspan: 2 }, // D2:E4 - anchored ABOVE the written area
        ],
      });

      await selectCell(2, 1); // expands to the 2x2 merge, B3:C4

      // A 3x3 clipboard overflows that selection and writes B3:D5.
      triggerPaste('a\tb\tc\nd\te\tf\ng\th\ti');

      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toBe(0);
      expect(getCellMeta(2, 3).hidden).toBeFalsy();
      expect(getDataAtCell(2, 3)).toBe('c');
    });

    // A validator moves `applyChanges` into a microtask, so `afterPaste` fires BEFORE
    // `afterChange`. Anything that clears the recorded geometry on `afterPaste` therefore makes
    // this fix inert on a validated column - and `type: 'numeric'`, `type: 'date'`, `dropdown` and
    // `autocomplete` all install a validator, so that is the common case, not the exotic one.
    it('should unmerge the destination area on a validated column too', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        validator: (value, callback) => callback(true),
        mergeCells: [
          { row: 5, col: 6, rowspan: 3, colspan: 3 }, // G6:I8
        ],
      });

      await selectCell(5, 6);

      await pasteAndSettle('a\tb\tc\nd\te\tf\ng\th\ti');

      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toBe(0);
      expect(getData(5, 6, 7, 8)).toEqual([
        ['a', 'b', 'c'],
        ['d', 'e', 'f'],
        ['g', 'h', 'i'],
      ]);
      expect(getCellMeta(5, 7).hidden).toBeFalsy();
      expect(getCellMeta(7, 8).hidden).toBeFalsy();
    });

    it('should keep the merged cell for a single pasted value on a validated column', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        validator: (value, callback) => callback(true),
        mergeCells: [
          { row: 5, col: 6, rowspan: 3, colspan: 3 }, // G6:I8
        ],
      });

      await selectCell(5, 6);

      await pasteAndSettle('ZZ');

      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toBe(1);
      expect(getDataAtCell(5, 6)).toBe('ZZ');
      expect(getData(5, 6, 7, 8)).toEqual([
        ['ZZ', null, null],
        [null, null, null],
        [null, null, null],
      ]);
      expect(getCellMeta(5, 7).hidden).toBe(true);
    });

    // `populateFromArray` drops the change for every cell that is `readOnly`, `skipRowOnPaste` or
    // `skipColumnOnPaste`, so a merged range covering only such cells receives nothing at all -
    // even while it sits inside the rectangle the surviving changes span. Matching the real change
    // coordinates rather than that rectangle is what keeps it merged.
    it('should keep a merged cell that the paste skipped entirely (skipColumnOnPaste)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        // Column 7 is skipped on paste; the merge spans only that column.
        columns: Array.from({ length: 10 }, (_, column) => (
          column === 7 ? { skipColumnOnPaste: true } : {}
        )),
        mergeCells: [
          { row: 5, col: 7, rowspan: 2, colspan: 1 }, // H6:H7
        ],
      });

      await selectCell(5, 6);

      // A 2x3 block anchored at G6 spans columns 6, 7 and 8 - but nothing is written into 7.
      await pasteAndSettle('P\tQ\tR\nS\tT\tU');

      const { mergedCells } = getPlugin('mergeCells').mergedCellsCollection;

      expect(mergedCells.length).toBe(1);
      expect(mergedCells[0].col).toBe(7);
      // The skipped column keeps both its value and its covered cell.
      expect(getDataAtCell(5, 7)).toBe('H6');
      expect(getDataAtCell(6, 7)).toBe(null);
      expect(getCellMeta(6, 7).hidden).toBe(true);
      // The columns either side did receive the paste.
      expect(getDataAtCell(5, 6)).toBe('P');
      expect(getDataAtCell(5, 8)).toBe('Q');
    });

    it('should keep a merged cell built entirely of read-only cells', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        columns: Array.from({ length: 10 }, (_, column) => (
          column === 7 ? { readOnly: true } : {}
        )),
        mergeCells: [
          { row: 5, col: 7, rowspan: 2, colspan: 1 }, // H6:H7
        ],
      });

      await selectCell(5, 6);

      await pasteAndSettle('P\tQ\tR\nS\tT\tU');

      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toBe(1);
      expect(getDataAtCell(5, 7)).toBe('H6');
    });

    it('should leave the collection untouched when the pasted area touches no merged cell', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 5, col: 6, rowspan: 3, colspan: 3 }, // G6:I8
        ],
      });

      await selectCell(0, 0);

      triggerPaste('a\tb\nc\td');

      const { mergedCells } = getPlugin('mergeCells').mergedCellsCollection;

      expect(mergedCells.length).toBe(1);
      expect(mergedCells[0].row).toBe(5);
      expect(mergedCells[0].col).toBe(6);
      expect(mergedCells[0].rowspan).toBe(3);
      expect(mergedCells[0].colspan).toBe(3);
      expect(getData(0, 0, 1, 1)).toEqual([
        ['a', 'b'],
        ['c', 'd'],
      ]);
    });

    it('should paste HTML carrying rowspan/colspan as plain cells when the plugin is disabled', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: false,
      });

      await selectCell(0, 0);

      getPlugin('copyPaste').paste(
        'M1\tX\nY',
        '<table><tbody><tr><td rowspan="2" colspan="2">M1</td><td>X</td></tr><tr><td>Y</td></tr></tbody></table>'
      );

      expect(getPlugin('mergeCells').enabled).toBe(false);
      expect(getData(0, 0, 1, 2)).toEqual([
        ['M1', null, 'X'],
        [null, null, 'Y'],
      ]);
    });
  });

  describe('Hooks', () => {
    it('should trigger the `beforeOnCellMouseDown` hook with proper coords', async() => {
      let rowOnCellMouseDown;
      let columnOnCellMouseDown;
      let coordsOnCellMouseDown;

      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 4 }],
        beforeOnCellMouseDown(_, coords) {
          coordsOnCellMouseDown = coords;
          rowOnCellMouseDown = coords.row;
          columnOnCellMouseDown = coords.col;
        }
      });

      // Click on the first visible cell (merged area).
      await simulateClick(spec().$container.find('tr:eq(1) td:eq(0)'));

      expect(rowOnCellMouseDown).toEqual(0);
      expect(columnOnCellMouseDown).toEqual(0);
      expect(coordsOnCellMouseDown).toEqual(jasmine.objectContaining({ row: 0, col: 0 }));
    });

    it('should trigger the `afterOnCellMouseDown` hook with proper coords', async() => {
      let rowOnCellMouseDown;
      let columnOnCellMouseDown;
      let coordsOnCellMouseDown;

      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 4 }],
        afterOnCellMouseDown(_, coords) {
          coordsOnCellMouseDown = coords;
          rowOnCellMouseDown = coords.row;
          columnOnCellMouseDown = coords.col;
        }
      });

      // Click on the first visible cell (merged area).
      await simulateClick(spec().$container.find('tr:eq(1) td:eq(0)'));

      expect(rowOnCellMouseDown).toEqual(0);
      expect(columnOnCellMouseDown).toEqual(0);
      expect(coordsOnCellMouseDown).toEqual(jasmine.objectContaining({ row: 0, col: 0 }));
    });
  });

  it('`getCell` should return merged cell parent', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
      mergeCells: [
        { row: 0, col: 0, rowspan: 2, colspan: 2 }
      ],
      height: 100,
      width: 400
    });

    const mergedCellParent = getCell(0, 0);
    const mergedCellHidden = getCell(1, 1);

    expect(mergedCellHidden).toBe(mergedCellParent);
  });

  it('should set/unset "copyable" cell meta attribute after performing merge/unmerge', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      mergeCells: true
    });

    await selectCell(2, 2, 4, 4);
    await keyDownUp(['control', 'm']);

    expect(getCellMeta(2, 2).copyable).toBe(true);
    expect(getCellMeta(2, 3).copyable).toBe(false);
    expect(getCellMeta(2, 4).copyable).toBe(false);
    expect(getCellMeta(3, 3).copyable).toBe(false);
    expect(getCellMeta(3, 4).copyable).toBe(false);
    expect(getCellMeta(4, 4).copyable).toBe(false);

    await keyDownUp(['control', 'm']);

    expect(getCellMeta(2, 2).copyable).toBe(true);
    expect(getCellMeta(2, 3).copyable).toBe(true);
    expect(getCellMeta(2, 4).copyable).toBe(true);
    expect(getCellMeta(3, 3).copyable).toBe(true);
    expect(getCellMeta(3, 4).copyable).toBe(true);
    expect(getCellMeta(4, 4).copyable).toBe(true);

    await keyDownUp(['control', 'm']);

    expect(getCellMeta(2, 2).copyable).toBe(true);
    expect(getCellMeta(2, 3).copyable).toBe(false);
    expect(getCellMeta(2, 4).copyable).toBe(false);
    expect(getCellMeta(3, 3).copyable).toBe(false);
    expect(getCellMeta(3, 4).copyable).toBe(false);
    expect(getCellMeta(4, 4).copyable).toBe(false);
  });

  it('should clear the "spanned"/"colspan"/"rowspan"/"hidden" cell meta after performing unmerge', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      mergeCells: [
        { row: 1, col: 1, rowspan: 1, colspan: 3 },
      ],
    });

    const plugin = getPlugin('mergeCells');

    // the merge parent carries the span flags, the covered cells are hidden
    expect(getCellMeta(1, 1).spanned).toBe(true);
    expect(getCellMeta(1, 1).colspan).toBe(3);
    expect(getCellMeta(1, 2).hidden).toBe(true);
    expect(getCellMeta(1, 3).hidden).toBe(true);

    plugin.unmerge(1, 1, 1, 3);

    // after unmerge the cached meta must not linger (it would leak into `toHTML`, copy, etc.)
    expect(getCellMeta(1, 1).spanned).toBeUndefined();
    expect(getCellMeta(1, 1).colspan).toBeUndefined();
    expect(getCellMeta(1, 1).rowspan).toBeUndefined();
    expect(getCellMeta(1, 2).hidden).toBeUndefined();
    expect(getCellMeta(1, 3).hidden).toBeUndefined();
  });

  it('should not emit stale colspan/rowspan in `toHTML` output after performing unmerge', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      mergeCells: [
        { row: 1, col: 1, rowspan: 1, colspan: 3 },
      ],
    });

    getPlugin('mergeCells').unmerge(1, 1, 1, 3);

    const html = toHTML();

    expect(html).not.toContain('colspan');
    expect(html).not.toContain('rowspan');
  });

  it('should not emit stale colspan/rowspan in `toHTML` output after a batched unmerge', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      mergeCells: [
        { row: 1, col: 1, rowspan: 1, colspan: 3 },
      ],
    });

    // Prime the per-render meta memo while the merge is still active, so the in-batch read below
    // hits the memoized path - the one on which the old lazy `afterGetCellMeta` cleanup is skipped.
    expect(getCellMeta(1, 1).colspan).toBe(3);

    let parentMeta;
    let coveredMeta;
    let html;

    // The unmerge runs without a real render (suspended inside `batch`), so the meta must be
    // cleared eagerly in `unmergeRange` and cannot rely on `afterGetCellMeta` recomputing. The
    // read happens inside the batch on purpose: `batch` ends with a render that clears the memo,
    // so reading after it would mask the stale-meta path (the trap the original tests fell into).
    batch(() => {
      getPlugin('mergeCells').unmerge(1, 1, 1, 3);

      // snapshot primitives - the meta object is a live reference mutated by the closing render
      parentMeta = { ...getCellMeta(1, 1) };
      coveredMeta = { ...getCellMeta(1, 2) };
      html = toHTML();
    });

    expect(parentMeta.spanned).toBeUndefined();
    expect(parentMeta.colspan).toBeUndefined();
    expect(parentMeta.rowspan).toBeUndefined();
    expect(coveredMeta.hidden).toBeUndefined();
    expect(html).not.toContain('colspan');
    expect(html).not.toContain('rowspan');
  });

  it('should not emit stale colspan/rowspan in `toHTML` output after the plugin is disabled within a batch', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      mergeCells: [
        { row: 1, col: 1, rowspan: 1, colspan: 3 },
      ],
    });

    // Prime the per-render meta memo while the merge is still active, so the in-batch read below
    // hits the memoized path - the one on which the old lazy `afterGetCellMeta` cleanup is skipped.
    expect(getCellMeta(1, 1).colspan).toBe(3);

    let parentMeta;
    let coveredMeta;
    let html;

    // Disabling the plugin drops the whole collection via `clearCollections`. The internal render
    // is suspended by `batch`, so - just like the unmerge case - the span meta must be cleared
    // eagerly. The read happens inside the batch, before the closing render clears the memo.
    batch(() => {
      getPlugin('mergeCells').disablePlugin();

      // snapshot primitives - the meta object is a live reference mutated by the closing render
      parentMeta = { ...getCellMeta(1, 1) };
      coveredMeta = { ...getCellMeta(1, 2) };
      html = toHTML();
    });

    expect(parentMeta.spanned).toBeUndefined();
    expect(parentMeta.colspan).toBeUndefined();
    expect(parentMeta.rowspan).toBeUndefined();
    expect(coveredMeta.hidden).toBeUndefined();
    expect(html).not.toContain('colspan');
    expect(html).not.toContain('rowspan');
  });

  it('should not collapse the main table\'s row height when the merge cell covers all cells width', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      mergeCells: true,
    });

    await updateSettings({
      mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 5 }],
    });

    expect(getCell(0, 0).offsetHeight).toBe(getThemeLayout().overlayHeight({ rows: 3 }));
  });

  it('should not collapse the left overlay height when the merge cell covers all overlay cells width', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      fixedColumnsStart: 1,
      mergeCells: true,
    });

    await updateSettings({
      mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 1 }],
    });

    expect(getInlineStartClone().find('.htCore').height()).toBe(getThemeLayout().overlayHeight({ rows: 5 }));

    await updateSettings({
      mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 2 }],
    });

    expect(getInlineStartClone().find('.htCore').height()).toBe(getThemeLayout().overlayHeight({ rows: 5 }));

    await updateSettings({
      mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 3 }],
    });

    expect(getInlineStartClone().find('.htCore').height()).toBe(getThemeLayout().overlayHeight({ rows: 5 }));
  });

  // Verified still failing (2026-08-05): the top overlay keeps the 2-row height
  // (59px in the main theme) instead of expanding to cover the 3-row merge
  // (88px) — the sibling left-overlay test shows the expected behavior. Real
  // product bug tracked in DEV-2194; unskip with the fix.
  xit('should not collapse the top overlay height when the merge cell covers all overlay cells width', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      fixedRowsTop: 2,
      mergeCells: true,
    });

    await updateSettings({
      mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 5 }],
    });

    expect(getTopClone().height()).toBe(getThemeLayout().overlayHeight({ rows: 3 }));

    await updateSettings({
      mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 5 }],
    });

    expect(getTopClone().height()).toBe(getThemeLayout().overlayHeight({ rows: 2 }));

    await updateSettings({
      mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 5 }],
    });

    expect(getTopClone().height()).toBe(getThemeLayout().overlayHeight({ rows: 2 }));
  });

  it('should correctly render all overlay\'s heights when they are contain merge cells', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      width: 600,
      height: 400,
      fixedColumnsStart: 1,
      fixedRowsTop: 3,
      mergeCells: [
        { row: 0, col: 0, rowspan: 5, colspan: 1 },
        { row: 0, col: 3, rowspan: 3, colspan: 1 },
        { row: 0, col: 5, rowspan: 8, colspan: 1 },
      ],
    });

    expect(getTopInlineStartClone().height()).toBe(getThemeLayout().overlayHeight({ rows: 3 }));
    expect(getTopClone().height()).toBe(getThemeLayout().overlayHeight({ rows: 3 }));
    expect(getInlineStartClone().height()).toBe(400);
  });

  it('should expand the all overlays size after changing the row height', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      width: 600,
      height: 400,
      autoRowSize: true, // the autoRowSize plugin is mandatory
      fixedColumnsStart: 1,
      fixedRowsTop: 3,
      mergeCells: [
        { row: 0, col: 0, rowspan: 5, colspan: 1 },
        { row: 0, col: 3, rowspan: 3, colspan: 1 },
        { row: 0, col: 5, rowspan: 8, colspan: 1 },
      ],
    });

    await selectCell(1, 1);
    await keyDownUp('enter');
    getActiveEditor().TEXTAREA.value = 'test\n\ntest';
    await keyDownUp('enter');

    const L = getThemeLayout();
    const expectedCloneHeight = L.overlayHeight({ rows: 3 }) + (2 * L.lineHeight);

    expect(getTopInlineStartClone().height()).toBe(expectedCloneHeight);
    expect(getTopClone().height()).toBe(expectedCloneHeight);
    expect(getInlineStartClone().height()).toBe(400);
  });

  it('should display properly wide merged cell', async() => {
    handsontable({
      data: createSpreadsheetData(3, 30),
      width: 200,
      height: 200,
      viewportColumnRenderingOffset: 0,
      mergeCells: true,
    });

    getPlugin('mergeCells').merge(0, 0, 0, 20);

    await selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('A1');
    expect(`
      | #                                                                                 |
      |   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   |
      |   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 0, col: 22 }); // the merged cell is partially visible

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('W1');
    expect(`
      | #                                                                                 :   :   |
      |   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   |
      |   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 0, col: 25 }); // the merged cell is not visible (out of the viewport)

    expect(getHtCore().find('tr:first td:first').text()).toBe('W1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('Z1');
    expect(`
      |   :   :   :   |
      |   :   :   :   |
      |   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should display properly wide virtualized merged cell', async() => {
    handsontable({
      data: createSpreadsheetData(3, 30),
      width: 200,
      height: 200,
      viewportColumnRenderingOffset: 0,
      mergeCells: {
        virtualized: true,
      },
    });

    getPlugin('mergeCells').merge(0, 0, 0, 20);

    await selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('A1');
    expect(`
      | #             |
      |   :   :   :   |
      |   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 0, col: 22 }); // the merged cell is partially visible

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('W1');
    expect(`
      | #     :   :   |
      |   :   :   :   |
      |   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 0, col: 25 }); // the merged cell is not visible (out of the viewport)

    expect(getHtCore().find('tr:first td:first').text()).toBe('W1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('Z1');
    expect(`
      |   :   :   :   |
      |   :   :   :   |
      |   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should correctly calculate the height of the merged cell for custom defined height (the first column as merged cell, row headers enabled)', async() => {
    handsontable({
      data: createSpreadsheetData(6, 3),
      rowHeaders: true,
      rowHeights: 50,
      mergeCells: [{ row: 0, col: 0, rowspan: 6, colspan: 1 }],
    });

    expect(getCell(0, 0).offsetHeight).toBe(300);
  });

  it('should correctly calculate the height of the merged cell for custom defined height (the first column as merged cell, row headers disabled)', async() => {
    handsontable({
      data: createSpreadsheetData(6, 3),
      rowHeaders: false,
      rowHeights: 50,
      mergeCells: [{ row: 0, col: 0, rowspan: 6, colspan: 1 }],
    });

    expect(getCell(0, 0).offsetHeight).toBe(300);
  });

  it('should correctly calculate the height of the merged cell for custom defined height (the second column as merged cell)', async() => {
    handsontable({
      data: createSpreadsheetData(6, 3),
      rowHeaders: false,
      rowHeights: 50,
      mergeCells: [{ row: 0, col: 1, rowspan: 6, colspan: 1 }],
    });

    expect(getCell(0, 1).offsetHeight).toBe(300);
  });

  it('should correctly calculate the height of the merged cell for custom defined height (the second column as non-fully merged cell)', async() => {
    handsontable({
      data: createSpreadsheetData(6, 3),
      rowHeaders: false,
      rowHeights: 50,
      mergeCells: [{ row: 0, col: 1, rowspan: 4, colspan: 1 }],
    });

    expect(getCell(0, 1).offsetHeight).toBe(200);
  });

  it('should proportionally calculate the height of the cells on the right of the merged cell (#dev-2302)', async() => {
    handsontable({
      data: createSpreadsheetData(4, 3),
      rowHeaders: false,
      rowHeights: 50,
      mergeCells: [{ row: 0, col: 0, rowspan: 4, colspan: 1 }],
    });

    expect(getCell(0, 0).offsetHeight).toBe(200);
    expect(getCell(0, 1).offsetHeight).toBe(50);
    expect(getCell(0, 1).offsetHeight).toBe(50);
    expect(getCell(1, 1).offsetHeight).toBe(50);
    expect(getCell(2, 1).offsetHeight).toBe(50);
    expect(getCell(3, 1).offsetHeight).toBe(50);
  });

  it('should respect the row heights when the first column is merged (#dev-2653)', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      rowHeaders: false,
      rowHeights: [80, 180, 60],
      mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }],
    });

    expect(getCell(0, 0).offsetHeight).toBe(260);
    expect(getCell(0, 1).offsetHeight).toBe(80);
    expect(getCell(1, 1).offsetHeight).toBe(180);
    expect(getCell(2, 1).offsetHeight).toBe(60);
  });

  it('should display properly high merged cell', async() => {
    handsontable({
      data: createSpreadsheetData(50, 3),
      width: 200,
      // TODO(I14): Cannot migrate to containerHeightForRows -- the test intent is "viewport smaller
      // than the 21-row merged span" so it can test partial-visibility scroll behavior; the exact
      // visible row count is not what matters here.
      height: scaleHeight(245),
      viewportRowRenderingOffset: 0,
      mergeCells: true,
    });

    getPlugin('mergeCells').merge(0, 0, 20, 0);

    await selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A1');

    expect(`
      | # :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 28, col: 0 }); // the merged cell is partially visible

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A30');

    expect(`
      | # :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 29, col: 0 }); // the merged cell is not visible (out of the viewport)

    expect(getHtCore().find('tr:first td:first').text()).toBe('A22');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A31');

    expect(`
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();

  });

  it('should display properly high virtualized merged cell', async() => {
    handsontable({
      data: createSpreadsheetData(50, 30),
      width: 200,
      // TODO(I14): Cannot migrate to containerHeightForRows -- 30 columns trigger a horizontal
      // scrollbar whose OS-dependent height reduces the data area unpredictably; and the intent
      // is "viewport smaller than the 21-row merged span", not a specific visible row count.
      height: scaleHeightWithScrollbar(248),
      viewportRowRenderingOffset: 0,
      mergeCells: {
        virtualized: true,
      },
    });

    getPlugin('mergeCells').merge(0, 0, 20, 0);

    await selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A1');

    expect(`
      | # :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 27, col: 0 }); // the merged cell is partially visible

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A1');

    expect(`
      | # :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 28, col: 0 }); // the merged cell is not visible (out of the viewport)

    expect(getHtCore().find('tr:first td:first').text()).toBe('A22');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A30');

    expect(`
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  describe('row trimming (Filters / trimRows) — merge re-anchoring', () => {
    const merges = () => getPlugin('mergeCells').mergedCellsCollection.mergedCells
      .map(({ row, col, rowspan, colspan }) => ({ row, col, rowspan, colspan }));

    it('should re-anchor a merge (kept whole) when a filter hides the rows above it', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        filters: true,
        mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }], // C3:E5, physical rows 2,3,4
      });
      const filters = getPlugin('filters');

      // keep only the merge's own rows (A3,A4,A5 -> physical 2,3,4); hides A1,A2 above it
      filters.addCondition(0, 'by_value', [['A3', 'A4', 'A5']]);
      filters.filter();

      await render();

      // the merge stays whole and its anchor follows its physical top-left up to visual row 0
      expect(merges()).toEqual([{ row: 0, col: 2, rowspan: 3, colspan: 3 }]);

      const TD = getCell(0, 2);

      expect(TD.getAttribute('rowspan')).toBe('3');
      expect(TD.getAttribute('colspan')).toBe('3');
    });

    it('should shrink a merge to its visible rows when a filter hides a row inside its span', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        filters: true,
        mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }],
      });
      const filters = getPlugin('filters');

      // hide A4 (physical row 3) — inside the merge; the anchor (A3) stays visible
      filters.addCondition(0, 'by_value', [['A1', 'A2', 'A3', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']]);
      filters.filter();

      await render();

      // a trimmed row has no visual index, so keeping `rowspan: 3` would make the merge reach past its
      // own rows and onto the one below
      expect(merges()).toEqual([{ row: 2, col: 2, rowspan: 2, colspan: 3 }]);

      filters.clearConditions();
      filters.filter();

      await render();

      // the trimmed row is part of the merge again, so the full span comes back
      expect(merges()).toEqual([{ row: 2, col: 2, rowspan: 3, colspan: 3 }]);
    });

    it('should restore the merge anchor after the filter is cleared', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        filters: true,
        mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }],
      });
      const filters = getPlugin('filters');

      filters.addCondition(0, 'by_value', [['A3', 'A4', 'A5']]);
      filters.filter();

      await render();

      filters.clearConditions();
      filters.filter();

      await render();

      expect(merges()).toEqual([{ row: 2, col: 2, rowspan: 3, colspan: 3 }]);
    });

    it('should keep a merge whole (not clipped) when trimRows hides an interior row from the config', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        trimRows: [3], // physical row 3 trimmed from the start — inside the merge span
        mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }],
      });

      // the merge keeps its full rowspan and renders over the visible rows
      expect(merges()).toEqual([{ row: 2, col: 2, rowspan: 3, colspan: 3 }]);

      getPlugin('trimRows').untrimAll();

      await render();

      expect(merges()).toEqual([{ row: 2, col: 2, rowspan: 3, colspan: 3 }]);
    });

    it('should capture correct anchors at bootstrap when trimRows hides rows above the merge from the config', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        trimRows: [0, 1], // physical rows 0,1 trimmed from the start — above the merge
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }], // visual rows 0,1 -> physical 2,3
      });

      // the merge sits at its config (visual) coordinates over the still-visible rows
      expect(merges()).toEqual([{ row: 0, col: 0, rowspan: 2, colspan: 2 }]);

      getPlugin('trimRows').untrimAll();

      await render();

      // the bootstrap anchor was bound to physical row 2 (not left on the config visual row 0), so once
      // the rows above reappear the merge follows its physical rows down to visual row 2
      expect(merges()).toEqual([{ row: 2, col: 0, rowspan: 2, colspan: 2 }]);
    });

    it('should re-anchor a merge created at runtime after a filter hides rows above it', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        filters: true,
        mergeCells: true,
      });

      getPlugin('mergeCells').merge(4, 0, 6, 1); // A5:B7 -> physical rows 4,5,6

      await render();

      const filters = getPlugin('filters');

      // keep only the merge's rows (physical 4,5,6), hiding everything above. The condition reads
      // column C, which the merge does not cover — merging cleared A6 and A7, so filtering column A by
      // those values would hide two of the merge's own rows.
      filters.addCondition(2, 'by_value', [['C5', 'C6', 'C7']]);
      filters.filter();

      await render();

      expect(merges()).toEqual([{ row: 0, col: 0, rowspan: 3, colspan: 2 }]);
    });

    it('should re-anchor a merge to follow its physical rows after sorting', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        columnSorting: true,
        mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }], // physical rows 2,3,4
      });
      const mc = getPlugin('mergeCells');

      getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

      await render();

      // the anchor follows physical row 2 (A3) to its new visual position; the span stays whole
      expect(merges()).toEqual([{ row: mc.hot.toVisualRow(2), col: 2, rowspan: 3, colspan: 3 }]);
      // sanity: the sort actually moved that physical row away from visual row 2
      expect(mc.hot.toVisualRow(2)).not.toBe(2);
    });

    it('should not corrupt the merge anchor when a column is inserted while a filter is active', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        filters: true,
        mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }],
      });
      const filters = getPlugin('filters');

      filters.addCondition(0, 'by_value', [['A3', 'A4', 'A5']]);
      filters.filter();

      await render();

      expect(merges()).toEqual([{ row: 0, col: 2, rowspan: 3, colspan: 3 }]); // re-anchored up

      await alter('insert_col_start', 0, 1); // structural edit performed mid-filter

      // merge shifts one column right; the trim-derived row anchor is preserved, not re-derived
      expect(merges()).toEqual([{ row: 0, col: 3, rowspan: 3, colspan: 3 }]);

      filters.clearConditions();
      filters.filter();

      await render();

      // clearing the filter restores the original physical row; the inserted column is reflected
      expect(merges()).toEqual([{ row: 2, col: 3, rowspan: 3, colspan: 3 }]);
    });

    it('should not corrupt the merge anchor when a row is inserted while a filter is active', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        filters: true,
        mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }], // physical rows 2,3,4
      });
      const filters = getPlugin('filters');

      filters.addCondition(0, 'by_value', [['A3', 'A4', 'A5']]);
      filters.filter();

      await render();

      expect(merges()).toEqual([{ row: 0, col: 2, rowspan: 3, colspan: 3 }]); // re-anchored up

      await alter('insert_row_above', 0, 1); // structural edit performed mid-filter

      // the blank row appears above; the merge follows its (now shifted) physical rows
      expect(merges()).toEqual([{ row: 1, col: 2, rowspan: 3, colspan: 3 }]);

      filters.clearConditions();
      filters.filter();

      await render();

      // clearing the filter reflects the insert: the cached anchor moved physical 2 -> 3
      expect(merges()).toEqual([{ row: 3, col: 2, rowspan: 3, colspan: 3 }]);
    });

    it('should not corrupt the merge anchor when a row above it is removed while a filter is active', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        filters: true,
        mergeCells: [{ row: 5, col: 2, rowspan: 3, colspan: 3 }], // physical rows 5,6,7
      });
      const filters = getPlugin('filters');

      // keep A1 (physical 0) plus the merge rows A6,A7,A8 (physical 5,6,7)
      filters.addCondition(0, 'by_value', [['A1', 'A6', 'A7', 'A8']]);
      filters.filter();

      await render();

      expect(merges()).toEqual([{ row: 1, col: 2, rowspan: 3, colspan: 3 }]); // re-anchored below A1

      await alter('remove_row', 0, 1); // remove A1 (physical 0) mid-filter

      // the merge slides up to the top of the still-visible rows
      expect(merges()).toEqual([{ row: 0, col: 2, rowspan: 3, colspan: 3 }]);

      filters.clearConditions();
      filters.filter();

      await render();

      // clearing the filter reflects the removal: the cached anchor moved physical 5 -> 4
      expect(merges()).toEqual([{ row: 4, col: 2, rowspan: 3, colspan: 3 }]);
    });

    it('should leave the merge untouched when hiddenRows hides rows above it', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        hiddenRows: { rows: [0, 1] },
        mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }],
      });

      // hiding keeps the visual row space intact, so the merge coords stay as-is
      expect(merges()).toEqual([{ row: 2, col: 2, rowspan: 3, colspan: 3 }]);

      getPlugin('hiddenRows').showRows([0, 1]);

      await render();

      expect(merges()).toEqual([{ row: 2, col: 2, rowspan: 3, colspan: 3 }]);
    });

    it('should follow the visible rows down when a filter hides the merge\'s own anchor row', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        filters: true,
        mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }], // C3:E5, physical rows 2,3,4
      });
      const filters = getPlugin('filters');

      // keep only A4,A5 (physical 3,4) — hides A3 (physical 2), the merge's own anchor row
      filters.addCondition(0, 'by_value', [['A4', 'A5']]);
      filters.filter();

      await render();

      // anchor row gone -> re-anchored to the topmost still-visible row of the span (physical 3 ->
      // visual 0), spanning the two rows of the merge that are left
      expect(merges()).toEqual([{ row: 0, col: 2, rowspan: 2, colspan: 3 }]);

      filters.clearConditions();
      filters.filter();

      await render();

      // clearing the filter brings the original anchor row back
      expect(merges()).toEqual([{ row: 2, col: 2, rowspan: 3, colspan: 3 }]);
    });

    it('should purge a fully hidden merge from the lookup matrix so it is not a phantom on an unrelated row', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        filters: true,
        mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }], // C3:E5, physical rows 2,3,4
      });
      const filters = getPlugin('filters');
      const collection = getPlugin('mergeCells').mergedCellsCollection;

      // show only the merge's own rows -> the merge re-anchors to visual row 0
      filters.addCondition(0, 'by_value', [['A3', 'A4', 'A5']]);
      filters.filter();

      await render();

      expect(collection.get(0, 2)).not.toBe(false); // the merge is present at visual row 0

      // hide ALL the merge's rows, keeping only the unrelated A1 (physical 0), which now sits at visual row 0
      filters.clearConditions();
      filters.addCondition(0, 'by_value', [['A1']]);
      filters.filter();

      await render();

      // the unrelated row now at visual row 0 must NOT resolve to the (now invisible) merge
      expect(collection.get(0, 2)).toBe(false);
    });

    it('should re-add a purged merge to the matrix when it reappears at the same visual coordinates', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        filters: true,
        mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }],
      });
      const filters = getPlugin('filters');
      const collection = getPlugin('mergeCells').mergedCellsCollection;

      // show only the merge's rows -> merge at visual row 0
      filters.addCondition(0, 'by_value', [['A3', 'A4', 'A5']]);
      filters.filter();

      await render();

      expect(collection.get(0, 2)).not.toBe(false);

      // hide all the merge's rows -> the merge is purged from the matrix
      filters.clearConditions();
      filters.addCondition(0, 'by_value', [['A1']]);
      filters.filter();

      await render();

      expect(collection.get(0, 2)).toBe(false);

      // show the merge's rows again -> it lands back at the exact visual row 0 it held before being purged
      filters.clearConditions();
      filters.addCondition(0, 'by_value', [['A3', 'A4', 'A5']]);
      filters.filter();

      await render();

      // the "skip relocation when unchanged" optimization must not leave the merge out of the matrix
      expect(collection.get(0, 2)).not.toBe(false);
      expect(merges()).toEqual([{ row: 0, col: 2, rowspan: 3, colspan: 3 }]);
    });

    it('should re-anchor a merge when a sort and a filter are batched into one cacheUpdated', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        columnSorting: true,
        filters: true,
        mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }], // C3:E5, physical rows 2,3,4
      });
      const mc = getPlugin('mergeCells');

      // a sort (index-sequence change) and a filter (trim change) collapsed into a single
      // `cacheUpdated` via suspendOperations/resumeOperations
      mc.hot.batch(() => {
        getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
        getPlugin('filters').addCondition(0, 'by_value', [['A3', 'A4', 'A5', 'A9', 'A10']]);
        getPlugin('filters').filter();
      });

      await render();

      // sanity: the batch actually moved the merge's physical anchor row away from visual row 2
      expect(mc.hot.toVisualRow(2)).not.toBe(2);

      // the trim re-anchor must not be dropped just because the batch also carried a sequence change:
      // the merge follows its physical anchor to the new visual position instead of staying at row 2
      expect(merges()[0].row).toBe(mc.hot.toVisualRow(2));
    });

    it('should re-anchor a merge after a column sort wrapped in hot.batch() with no filter', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        columnSorting: true,
        mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }], // physical rows 2,3,4
      });
      const mc = getPlugin('mergeCells');

      // a standalone sort batched on its own: the only cacheUpdated carries indexesSequenceChanged.
      // Re-anchoring inside the in-batch afterColumnSort would read a stale (pre-sort) cache.
      mc.hot.batch(() => {
        getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      });

      await render();

      // sanity: the sort moved the merge's physical anchor row away from visual row 2
      expect(mc.hot.toVisualRow(2)).not.toBe(2);

      // the merge follows its physical anchor to the new visual position instead of staying at row 2
      expect(merges()[0].row).toBe(mc.hot.toVisualRow(2));
    });

    it('should not let a row insert re-add a fully hidden (purged) merge to the lookup matrix', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        filters: true,
        mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }], // physical rows 2,3,4
      });
      const filters = getPlugin('filters');
      const collection = getPlugin('mergeCells').mergedCellsCollection;

      // hide ALL the merge's rows (keep only the unrelated A1) -> the merge is purged from the matrix
      filters.addCondition(0, 'by_value', [['A1']]);
      filters.filter();

      await render();

      const merge = collection.mergedCells[0];

      expect(collection.get(merge.row, merge.col)).toBe(false);

      // a row insert rebuilds the matrix from every merge via shiftCollections, re-adding the purged one
      await alter('insert_row_above', 0, 1);

      // the still-hidden merge must not reappear as a phantom footprint at its (shifted) stale coords
      expect(collection.get(merge.row, merge.col)).toBe(false);
    });

    it('should not let a column insert re-add a fully hidden (purged) merge to the lookup matrix', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        filters: true,
        mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }], // physical rows 2,3,4
      });
      const filters = getPlugin('filters');
      const collection = getPlugin('mergeCells').mergedCellsCollection;

      // hide ALL the merge's rows -> the merge is purged from the matrix
      filters.addCondition(0, 'by_value', [['A1']]);
      filters.filter();

      await render();

      const merge = collection.mergedCells[0];

      expect(collection.get(merge.row, merge.col)).toBe(false);

      // a column insert also rebuilds the matrix via shiftCollections
      await alter('insert_col_start', 0, 1);

      // the still-hidden merge must not reappear as a phantom footprint at its (shifted) stale coords
      expect(collection.get(merge.row, merge.col)).toBe(false);
    });

    it('should keep the rows a merge owns when a column is moved while a filter hides some of them',
      async() => {
        handsontable({
          data: createSpreadsheetData(10, 5),
          filters: true,
          manualColumnMove: true,
          mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }], // physical rows 2,3,4
        });
        const filters = getPlugin('filters');

        // hide A4 (physical row 3), inside the merge
        filters.addCondition(0, 'by_value', [['A1', 'A2', 'A3', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']]);
        filters.filter();

        await render();

        expect(merges()).toEqual([{ row: 2, col: 2, rowspan: 2, colspan: 3 }]);

        // a column move rebuilds every merge; the rows it owns must survive that
        getPlugin('manualColumnMove').moveColumn(0, 4);

        await render();

        filters.clearConditions();
        filters.filter();

        await render();

        // the trimmed row is back inside the merge, so the full span is restored
        expect(merges()[0].rowspan).toBe(3);
      });

    it('should keep the rows a merge owns when a column is frozen while a filter hides some of them',
      async() => {
        handsontable({
          data: createSpreadsheetData(10, 5),
          filters: true,
          manualColumnFreeze: true,
          mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }],
        });
        const filters = getPlugin('filters');

        filters.addCondition(0, 'by_value', [['A1', 'A2', 'A3', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']]);
        filters.filter();

        await render();

        getPlugin('manualColumnFreeze').freezeColumn(4);

        await render();

        filters.clearConditions();
        filters.filter();

        await render();

        expect(merges()[0].rowspan).toBe(3);
      });

    it('should keep a merge that owns trimmed rows when the last of its visible rows is removed', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        trimRows: true,
        mergeCells: [{ row: 2, col: 2, rowspan: 3, colspan: 3 }], // physical rows 2,3,4
      });
      const trimRows = getPlugin('trimRows');

      // leave only the merge's first row (physical 2) visible
      trimRows.trimRows([3, 4]);

      await render();

      expect(merges()).toEqual([{ row: 2, col: 2, rowspan: 1, colspan: 3 }]);

      // removing that one visible row must not take the two trimmed rows the merge still owns with it
      await alter('remove_row', 2, 1);

      expect(merges().length).toBe(1);

      trimRows.untrimAll();

      await render();

      // the two rows the merge kept are visible again, and it spans exactly them
      expect(merges()).toEqual([{ row: 2, col: 2, rowspan: 2, colspan: 3 }]);
    });
  });

  describe('nested rows — merge re-anchoring on collapse', () => {
    const merges = () => getPlugin('mergeCells').mergedCellsCollection.mergedCells
      .map(({ row, col, rowspan, colspan }) => ({ row, col, rowspan, colspan }));

    // Four groups of a parent plus five children, each covered by a merge in the first column.
    const nestedData = () => ['P0', 'P1', 'P2', 'P3'].map(category => ({
      category,
      __children: [0, 1, 2, 3, 4].map(index => ({ title: `${category} T${index}` })),
    }));
    const groupMerges = () => [0, 6, 12, 18].map(row => ({ row, col: 0, rowspan: 6, colspan: 1 }));

    it('should shrink a merge to the collapsed parent row instead of overlapping the group below', async() => {
      handsontable({
        data: nestedData(),
        nestedRows: true,
        mergeCells: groupMerges(),
      });

      getPlugin('nestedRows').collapsingUI.collapseChildren(0);

      await render();

      // the collapsed group is one visible row, and the groups below keep their whole span at the
      // visual positions they moved up to — no two merges claim the same row
      expect(merges()).toEqual([
        { row: 0, col: 0, rowspan: 1, colspan: 1 },
        { row: 1, col: 0, rowspan: 6, colspan: 1 },
        { row: 7, col: 0, rowspan: 6, colspan: 1 },
        { row: 13, col: 0, rowspan: 6, colspan: 1 },
      ]);

      const collection = getPlugin('mergeCells').mergedCellsCollection;

      expect(collection.get(0, 0)).toBe(collection.mergedCells[0]);
      expect(collection.get(1, 0)).toBe(collection.mergedCells[1]);
      expect(collection.get(6, 0)).toBe(collection.mergedCells[1]);
    });

    it('should restore every merge whole when the collapsed parent is expanded again', async() => {
      handsontable({
        data: nestedData(),
        nestedRows: true,
        mergeCells: groupMerges(),
      });
      const collapsingUI = getPlugin('nestedRows').collapsingUI;

      collapsingUI.collapseChildren(0);

      await render();

      collapsingUI.expandChildren(0);

      await render();

      expect(merges()).toEqual(groupMerges());

      // the rows the first merge covers again are marked as covered, not left as empty visible cells
      expect(getCellMeta(0, 0).rowspan).toBe(6);
      expect(getCellMeta(1, 0).hidden).toBe(true);
      expect(getCellMeta(5, 0).hidden).toBe(true);
      expect(getCellMeta(6, 0).rowspan).toBe(6);
    });

    it('should re-anchor correctly when two parents are collapsed and expanded in reverse order', async() => {
      handsontable({
        data: nestedData(),
        nestedRows: true,
        mergeCells: groupMerges(),
      });
      const collapsingUI = getPlugin('nestedRows').collapsingUI;

      collapsingUI.collapseChildren(0);

      await render();

      collapsingUI.collapseChildren(6);

      await render();

      expect(merges()).toEqual([
        { row: 0, col: 0, rowspan: 1, colspan: 1 },
        { row: 1, col: 0, rowspan: 1, colspan: 1 },
        { row: 2, col: 0, rowspan: 6, colspan: 1 },
        { row: 8, col: 0, rowspan: 6, colspan: 1 },
      ]);

      collapsingUI.expandChildren(6);

      await render();

      expect(merges()).toEqual([
        { row: 0, col: 0, rowspan: 1, colspan: 1 },
        { row: 1, col: 0, rowspan: 6, colspan: 1 },
        { row: 7, col: 0, rowspan: 6, colspan: 1 },
        { row: 13, col: 0, rowspan: 6, colspan: 1 },
      ]);

      collapsingUI.expandChildren(0);

      await render();

      expect(merges()).toEqual(groupMerges());
    });

    it('should not restore a one-cell merge when an unmerge done on a collapsed group is undone', async() => {
      handsontable({
        data: nestedData(),
        nestedRows: true,
        mergeCells: groupMerges(),
        undo: true,
      });
      const mergeCells = getPlugin('mergeCells');

      getPlugin('nestedRows').collapsingUI.collapseChildren(0);

      await render();

      // the collapsed group draws as one cell, so this is what the undo action records
      mergeCells.unmerge(0, 0, 0, 0);

      await render();

      expect(merges().length).toBe(3);

      getPlugin('undoRedo').undo();

      await render();

      // a one-cell area is not a merge. Re-creating it would shrink a six-row merge to a single row
      // for good — visible only once the group is expanded again — so the undo restores nothing.
      expect(merges().length).toBe(3);

      getPlugin('nestedRows').collapsingUI.expandChildren(0);

      await render();

      expect(merges()).toEqual(groupMerges().slice(1));
    });
  });
});
