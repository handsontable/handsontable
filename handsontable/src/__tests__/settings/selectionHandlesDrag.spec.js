describe('settings', () => {
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

  describe('selectionHandles drag-to-resize', () => {
    /**
     * Helper: returns the visible handle element for the given edge, or null.
     *
     * @param {string} edge One of 'top', 'bottom', 'start', 'end'.
     * @returns {Element|null}
     */
    function getHandle(edge) {
      return spec().$container[0].querySelector(`.wtSelectionHandle--${edge}[style*="display: block"]`);
    }

    it('should grow the selection downward when the bottom handle is dragged to a lower row', async() => {
      handsontable({
        data: createSpreadsheetData(10, 8),
        selectionHandles: true,
        selectionMode: 'multiple',
        width: 400,
        height: 300,
      });

      await selectCells([[2, 2, 4, 4]]);

      // Hover the selection to make handles visible.
      await mouseOver(getCell(3, 3));

      const bottomHandle = getHandle('bottom');

      expect(bottomHandle).not.toBeNull();

      const handleRect = bottomHandle.getBoundingClientRect();
      const targetCell = getCell(7, 4);
      const targetRect = targetCell.getBoundingClientRect();

      // Mousedown the bottom handle.
      $(bottomHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });

      // Drag to row 7.
      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      $(document.documentElement).simulate('mouseup');

      // The selection should have expanded to row 7 (anchor = row 2, dragged bottom to row 7).
      const selected = getSelected();

      expect(selected[0][0]).toBe(2); // anchor row
      expect(selected[0][2]).toBe(7); // new bottom row
    });

    it('should clamp the top handle so it cannot cross the bottom edge (no flip)', async() => {
      handsontable({
        data: createSpreadsheetData(12, 8),
        selectionHandles: true,
        selectionMode: 'multiple',
        width: 400,
        height: 400,
      });

      await selectCells([[2, 2, 5, 5]]);

      await mouseOver(getCell(3, 3));

      const topHandle = getHandle('top');

      expect(topHandle).not.toBeNull();

      const handleRect = topHandle.getBoundingClientRect();
      // Target is row 9, which is below the bottom edge (row 5) — should clamp to row 5.
      const targetCell = getCell(9, 3);
      const targetRect = targetCell.getBoundingClientRect();

      $(topHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });

      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      $(document.documentElement).simulate('mouseup');

      // Anchor = row 5 (bottom of original), clamped top = row 5 → single row selection.
      const selected = getSelected();

      // The selection should be a single row at the anchor (bottom) with no flip.
      expect(selected[0][0]).toBe(5); // anchor row (was bottom of original)
      expect(selected[0][2]).toBe(5); // clamped to anchor — single row
    });

    it('should move only the start (left) edge, keeping the end (right) edge anchored', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        selectionHandles: true,
        selectionMode: 'multiple',
        width: 500,
        height: 300,
      });

      await selectCells([[2, 3, 5, 6]]);

      await mouseOver(getCell(3, 4));

      const startHandle = getHandle('start');

      expect(startHandle).not.toBeNull();

      const handleRect = startHandle.getBoundingClientRect();
      // Drag start edge to column 1.
      const targetCell = getCell(3, 1);
      const targetRect = targetCell.getBoundingClientRect();

      $(startHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });

      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      $(document.documentElement).simulate('mouseup');

      const selected = getSelected();

      // Start column should have moved, end column (anchor = 6) stays.
      // Column axis: anchor = col 6, new start = col 1.
      const minCol = Math.min(selected[0][1], selected[0][3]);
      const maxCol = Math.max(selected[0][1], selected[0][3]);

      expect(minCol).toBe(1);
      expect(maxCol).toBe(6);
    });

    it('should not show handles when selectionMode is single', async() => {
      handsontable({
        data: createSpreadsheetData(8, 8),
        selectionHandles: true,
        selectionMode: 'single',
        width: 400,
        height: 300,
      });

      await selectCell(2, 2);
      await mouseOver(getCell(2, 2));

      const handles = spec().$container[0].querySelectorAll('.wtSelectionHandle');
      const visibleHandles = Array.from(handles).filter(el => el.style.display === 'block');

      expect(visibleHandles.length).toBe(0);
    });

    it('should not show handles when an entire column is selected', async() => {
      handsontable({
        data: createSpreadsheetData(8, 8),
        selectionHandles: true,
        selectionMode: 'multiple',
        width: 400,
        height: 300,
      });

      await selectColumns(2, 4);
      await mouseOver(getCell(2, 3));

      const handles = spec().$container[0].querySelectorAll('.wtSelectionHandle');
      const visibleHandles = Array.from(handles).filter(el => el.style.display === 'block');

      expect(visibleHandles.length).toBe(0);
    });
  });
});
