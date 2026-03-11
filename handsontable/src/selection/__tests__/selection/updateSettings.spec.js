describe('Selection', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('selection preservation during updateSettings', () => {
    it('should preserve non-consecutive selection after updateSettings', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
      });

      // Create a non-consecutive selection.
      hot.selectCells([[0, 0], [2, 2]]);

      // Verify we have multiple selection ranges
      const selectedRangesBefore = hot.getSelectedRange();

      expect(selectedRangesBefore.length).toBe(2);
      expect(selectedRangesBefore[0].from.row).toBe(0);
      expect(selectedRangesBefore[0].from.col).toBe(0);
      expect(selectedRangesBefore[1].from.row).toBe(2);
      expect(selectedRangesBefore[1].from.col).toBe(2);

      // Export selection state before updateSettings
      const selectionState = hot.selection.exportSelection();

      // Call updateSettings (which typically resets selection)
      hot.updateSettings({
        contextMenu: true
      });

      // Import selection state after updateSettings
      hot.selection.importSelection(selectionState);
      hot.render();

      // Verify selection is preserved
      const selectedRangesAfter = hot.getSelectedRange();

      expect(selectedRangesAfter.length).toBe(2);
      expect(selectedRangesAfter[0].from.row).toBe(0);
      expect(selectedRangesAfter[0].from.col).toBe(0);
      expect(selectedRangesAfter[1].from.row).toBe(2);
      expect(selectedRangesAfter[1].from.col).toBe(2);
    });

    it('should preserve active selection layer after updateSettings', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
      });

      // Create a non-consecutive selection with 3 layers.
      hot.selectCells([[0, 0], [1, 1], [2, 2]]);

      const activeLayerBefore = hot.selection.getActiveSelectionLayerIndex();

      // Export selection state
      const selectionState = hot.selection.exportSelection();

      // Call updateSettings
      hot.updateSettings({
        readOnly: true
      });

      // Import selection state
      hot.selection.importSelection(selectionState);
      hot.render();

      // Verify active layer is preserved
      const activeLayerAfter = hot.selection.getActiveSelectionLayerIndex();

      expect(activeLayerAfter).toBe(activeLayerBefore);
    });

    it('should preserve row header selection after updateSettings', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
      });

      // Select entire row
      await selectRows(2);

      // Export selection state
      const selectionState = hot.selection.exportSelection();

      expect(hot.selection.isSelectedByRowHeader(0)).toBe(true);

      // Call updateSettings
      hot.updateSettings({
        contextMenu: true
      });

      // Import selection state
      hot.selection.importSelection(selectionState);
      hot.render();

      // Verify row header selection is preserved
      expect(hot.selection.isSelectedByRowHeader(0)).toBe(true);
      const selectedRangesAfter = hot.getSelectedRange();

      expect(selectedRangesAfter.length).toBe(1);
      expect(selectedRangesAfter[0].from.row).toBe(2);
      expect(selectedRangesAfter[0].from.col).toBe(-1);
      expect(selectedRangesAfter[0].to.row).toBe(2);
      expect(selectedRangesAfter[0].to.col).toBe(4);
    });

    it('should preserve column header selection after updateSettings', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
      });

      // Select entire column
      await selectColumns(3);

      // Export selection state
      const selectionState = hot.selection.exportSelection();

      expect(hot.selection.isSelectedByColumnHeader(0)).toBe(true);

      // Call updateSettings
      hot.updateSettings({
        contextMenu: true
      });

      // Import selection state
      hot.selection.importSelection(selectionState);
      hot.render();

      // Verify column header selection is preserved
      expect(hot.selection.isSelectedByColumnHeader(0)).toBe(true);
      expect(`
        |   ║   :   :   : * :   |
        |===:===:===:===:===:===|
        | - ║   :   :   : A :   |
        | - ║   :   :   : 0 :   |
        | - ║   :   :   : 0 :   |
        | - ║   :   :   : 0 :   |
        | - ║   :   :   : 0 :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should handle empty selection state after updateSettings', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
      });

      // Don't select anything
      const selectedRangesBefore = hot.getSelectedRange();

      expect(selectedRangesBefore).toBeUndefined();

      // Export selection state
      const selectionState = hot.selection.exportSelection();

      // Call updateSettings
      hot.updateSettings({
        contextMenu: true
      });

      // Import selection state
      hot.selection.importSelection(selectionState);
      hot.render();

      // Verify no selection after update
      const selectedRangesAfter = hot.getSelectedRange();

      expect(selectedRangesAfter).toBeUndefined();
    });

    it('should preserve complex multi-range selection after updateSettings', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(6, 6),
        colHeaders: true,
        rowHeaders: true,
      });

      // Create a complex multi-range selection.
      hot.selectCells([[0, 0, 1, 1], [3, 3, 4, 4], [2, 5]]);

      // Export selection state
      const selectionState = hot.selection.exportSelection();

      const selectedRangesBefore = hot.getSelectedRange();

      expect(selectedRangesBefore.length).toBe(3);

      // Call updateSettings
      hot.updateSettings({
        readOnly: true,
        contextMenu: true
      });

      // Import selection state
      hot.selection.importSelection(selectionState);
      hot.render();

      // Verify complex selection is preserved
      const selectedRangesAfter = hot.getSelectedRange();

      expect(selectedRangesAfter.length).toBe(3);
      expect(selectedRangesAfter[0].from.row).toBe(0);
      expect(selectedRangesAfter[0].from.col).toBe(0);
      expect(selectedRangesAfter[0].to.row).toBe(1);
      expect(selectedRangesAfter[0].to.col).toBe(1);
      expect(selectedRangesAfter[1].from.row).toBe(3);
      expect(selectedRangesAfter[1].from.col).toBe(3);
      expect(selectedRangesAfter[1].to.row).toBe(4);
      expect(selectedRangesAfter[1].to.col).toBe(4);
      expect(selectedRangesAfter[2].from.row).toBe(2);
      expect(selectedRangesAfter[2].from.col).toBe(5);
    });
  });
});
