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

      // Drag to a cell in a DIFFERENT column (col 8) to verify that horizontal mouse
      // movement does NOT affect the column extent (the defect that was fixed).
      const targetCell = getCell(7, 7);
      const targetRect = targetCell.getBoundingClientRect();

      // Mousedown the bottom handle.
      $(bottomHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });

      // Drag to row 7, col 7 (a different column than the original selection's col 2..4).
      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      $(document.documentElement).simulate('mouseup');

      // The selection should have expanded to row 7, but columns MUST remain 2..4.
      // The bottom handle only adjusts the row axis — horizontal mouse movement is ignored.
      const selected = getSelected();

      expect(selected[0][0]).toBe(2); // anchor row (top of original selection)
      expect(selected[0][2]).toBe(7); // new bottom row — dragged down to row 7

      // Column span must be unchanged despite mouse moving to col 7.
      const minCol = Math.min(selected[0][1], selected[0][3]);
      const maxCol = Math.max(selected[0][1], selected[0][3]);

      expect(minCol).toBe(2); // original fromCol
      expect(maxCol).toBe(4); // original toCol — NOT the mouse's col 7
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

      // Drag start edge to col 1 in a DIFFERENT row (row 8) than the original selection (rows 2..5).
      // This verifies the row axis is NOT affected by vertical mouse movement when dragging
      // a start/end handle (the defect that was fixed).
      const targetCell = getCell(8, 1);
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

      // Start column should have moved to col 1, end column (anchor = 6) stays.
      const minCol = Math.min(selected[0][1], selected[0][3]);
      const maxCol = Math.max(selected[0][1], selected[0][3]);

      expect(minCol).toBe(1);
      expect(maxCol).toBe(6);

      // Row span must be unchanged despite mouse moving to row 8.
      // The start handle only adjusts the column axis — vertical mouse movement is ignored.
      const minRow = Math.min(selected[0][0], selected[0][2]);
      const maxRow = Math.max(selected[0][0], selected[0][2]);

      expect(minRow).toBe(2); // original fromRow
      expect(maxRow).toBe(5); // original toRow — NOT the mouse's row 8
    });

    it('should expand the selection to include the full merged block when the bottom handle is dragged into a merge', async() => {
      handsontable({
        data: createSpreadsheetData(10, 8),
        selectionHandles: true,
        selectionMode: 'multiple',
        mergeCells: [{ row: 5, col: 2, rowspan: 2, colspan: 2 }],
        width: 400,
        height: 400,
      });

      // Initial selection: rows 2..4, cols 2..3.
      await selectCells([[2, 2, 4, 3]]);
      await mouseOver(getCell(3, 2));

      const bottomHandle = getHandle('bottom');

      expect(bottomHandle).not.toBeNull();

      const handleRect = bottomHandle.getBoundingClientRect();

      // Drag into the FIRST row of the merged region (row 5, col 3).
      // Because the merge spans rows 5..6 the selection must extend to row 6
      // so the merged block is fully included, not split.
      const targetCell = getCell(5, 3);
      const targetRect = targetCell.getBoundingClientRect();

      $(bottomHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });
      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });
      $(document.documentElement).simulate('mouseup');

      const selected = getSelected();

      // The anchor row stays at 2 (top of the original selection).
      expect(selected[0][0]).toBe(2);

      // The selection must reach at least row 6 (the last row of the merged block),
      // confirming the merge is fully included and not visually split.
      const bottomRow = Math.max(selected[0][0], selected[0][2]);

      expect(bottomRow).toBeGreaterThanOrEqual(6);

      // Column span must remain 2..3 (unchanged by the drag — only the row axis moves).
      const minCol = Math.min(selected[0][1], selected[0][3]);
      const maxCol = Math.max(selected[0][1], selected[0][3]);

      expect(minCol).toBe(2);
      expect(maxCol).toBe(3);
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

    it('should move only the end (right) edge, keeping the start (left) edge anchored', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        selectionHandles: true,
        selectionMode: 'multiple',
        width: 500,
        height: 300,
      });

      await selectCells([[2, 3, 5, 6]]);

      await mouseOver(getCell(3, 4));

      const endHandle = getHandle('end');

      expect(endHandle).not.toBeNull();

      const handleRect = endHandle.getBoundingClientRect();

      // Drag end edge to col 8 in a DIFFERENT row (row 9) than the original selection (rows 2..5).
      // This verifies the row axis is NOT affected by vertical mouse movement when dragging
      // an end handle (mirroring the start-edge axis-preservation spec for the opposite edge).
      const targetCell = getCell(9, 8);
      const targetRect = targetCell.getBoundingClientRect();

      $(endHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });

      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      $(document.documentElement).simulate('mouseup');

      const selected = getSelected();

      // End column should have moved to col 8; start column (anchor = 3) stays.
      const minCol = Math.min(selected[0][1], selected[0][3]);
      const maxCol = Math.max(selected[0][1], selected[0][3]);

      expect(minCol).toBe(3);
      expect(maxCol).toBe(8);

      // Row span must be unchanged despite mouse moving to row 9.
      // The end handle only adjusts the column axis — vertical mouse movement is ignored.
      const minRow = Math.min(selected[0][0], selected[0][2]);
      const maxRow = Math.max(selected[0][0], selected[0][2]);

      expect(minRow).toBe(2); // original fromRow
      expect(maxRow).toBe(5); // original toRow — NOT the mouse's row 9
    });

    it('should resize the selection correctly when dragging the bottom handle in RTL mode', async() => {
      // RTL affects the inline axis (column direction is visually mirrored), but getSelected()
      // always returns visual column indexes (0 = leftmost physical column regardless of direction).
      // To avoid RTL coordinate-mirroring ambiguity on the inline axis, this spec exercises the
      // block axis (bottom handle / row resize), which is direction-independent, and verifies
      // that the row axis changes while the column axis is preserved — the same invariant as
      // the LTR bottom-handle spec, now confirmed under RTL rendering.
      handsontable({
        data: createSpreadsheetData(10, 8),
        selectionHandles: true,
        selectionMode: 'multiple',
        layoutDirection: 'rtl',
        width: 400,
        height: 300,
      });

      await selectCells([[2, 2, 4, 4]]);

      // Hover an interior cell of the selection to make handles visible.
      await mouseOver(getCell(3, 3));

      const bottomHandle = getHandle('bottom');

      expect(bottomHandle).not.toBeNull();

      const handleRect = bottomHandle.getBoundingClientRect();

      // Drag to row 7 in a different column (col 6) to confirm the column axis is preserved.
      const targetCell = getCell(7, 6);
      const targetRect = targetCell.getBoundingClientRect();

      $(bottomHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });

      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      $(document.documentElement).simulate('mouseup');

      const selected = getSelected();

      // Anchor row stays at 2 (top of original selection); bottom row should have moved to 7.
      expect(selected[0][0]).toBe(2); // anchor row unchanged
      expect(selected[0][2]).toBe(7); // dragged bottom row

      // Column span must remain 2..4 — the bottom handle only adjusts the row axis in RTL too.
      const minCol = Math.min(selected[0][1], selected[0][3]);
      const maxCol = Math.max(selected[0][1], selected[0][3]);

      expect(minCol).toBe(2);
      expect(maxCol).toBe(4);
    });

    it('should preserve other selection layers when dragging the bottom handle of the hovered (last) layer', async() => {
      handsontable({
        data: createSpreadsheetData(10, 6),
        selectionHandles: true,
        selectionMode: 'multiple',
        width: 500,
        height: 400,
      });

      // Select two disjoint ranges: col 1 rows 2-6 and col 3 rows 2-7.
      await selectCells([[2, 1, 6, 1], [2, 3, 7, 3]]);

      // Hover a cell inside the SECOND (last) range to show its handles.
      await mouseOver(getCell(4, 3));

      const bottomHandle = getHandle('bottom');

      expect(bottomHandle).not.toBeNull();

      const handleRect = bottomHandle.getBoundingClientRect();

      // Drag the bottom handle of the second range from row 7 down to row 9.
      const targetCell = getCell(9, 3);
      const targetRect = targetCell.getBoundingClientRect();

      $(bottomHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });

      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      $(document.documentElement).simulate('mouseup');

      const selected = getSelected();

      // There must be TWO ranges — the first one must not have been wiped out.
      expect(selected.length).toBe(2);

      // First range (col 1, rows 2-6) must be unchanged.
      const firstRange = selected.find(([r1, c1, r2, c2]) =>
        Math.min(c1, c2) === 1 && Math.max(c1, c2) === 1);

      expect(firstRange).toBeDefined();

      const firstMinRow = Math.min(firstRange[0], firstRange[2]);
      const firstMaxRow = Math.max(firstRange[0], firstRange[2]);

      expect(firstMinRow).toBe(2);
      expect(firstMaxRow).toBe(6);

      // Second range (col 3) should have its bottom edge resized to row 9.
      const secondRange = selected.find(([r1, c1, r2, c2]) =>
        Math.min(c1, c2) === 3 && Math.max(c1, c2) === 3);

      expect(secondRange).toBeDefined();

      const secondMinRow = Math.min(secondRange[0], secondRange[2]);
      const secondMaxRow = Math.max(secondRange[0], secondRange[2]);

      expect(secondMinRow).toBe(2);  // anchor row (top) unchanged
      expect(secondMaxRow).toBe(9);  // dragged to row 9
    });

    it('should preserve other selection layers when dragging a handle on the non-last (first) layer', async() => {
      handsontable({
        data: createSpreadsheetData(10, 6),
        selectionHandles: true,
        selectionMode: 'multiple',
        width: 500,
        height: 400,
      });

      // Select two disjoint ranges: col 1 rows 2-6 and col 3 rows 2-7.
      await selectCells([[2, 1, 6, 1], [2, 3, 7, 3]]);

      // Hover a cell inside the FIRST range (col 1) to show its handles.
      await mouseOver(getCell(4, 1));

      const bottomHandle = getHandle('bottom');

      expect(bottomHandle).not.toBeNull();

      const handleRect = bottomHandle.getBoundingClientRect();

      // Drag the bottom handle of the first range from row 6 down to row 9.
      const targetCell = getCell(9, 1);
      const targetRect = targetCell.getBoundingClientRect();

      $(bottomHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });

      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      $(document.documentElement).simulate('mouseup');

      const selected = getSelected();

      // There must be TWO ranges — the second one must not have been wiped out.
      expect(selected.length).toBe(2);

      // Second range (col 3, rows 2-7) must be unchanged.
      const secondRange = selected.find(([r1, c1, r2, c2]) =>
        Math.min(c1, c2) === 3 && Math.max(c1, c2) === 3);

      expect(secondRange).toBeDefined();

      const secondMinRow = Math.min(secondRange[0], secondRange[2]);
      const secondMaxRow = Math.max(secondRange[0], secondRange[2]);

      expect(secondMinRow).toBe(2);
      expect(secondMaxRow).toBe(7);

      // First range (col 1) should have its bottom edge resized to row 9.
      const firstRange = selected.find(([r1, c1, r2, c2]) =>
        Math.min(c1, c2) === 1 && Math.max(c1, c2) === 1);

      expect(firstRange).toBeDefined();

      const firstMinRow = Math.min(firstRange[0], firstRange[2]);
      const firstMaxRow = Math.max(firstRange[0], firstRange[2]);

      expect(firstMinRow).toBe(2);  // anchor row (top) unchanged
      expect(firstMaxRow).toBe(9);  // dragged to row 9
    });

    it('should keep the focus/active cell stable when growing the selection via the top handle', async() => {
      handsontable({
        data: createSpreadsheetData(10, 8),
        selectionHandles: true,
        selectionMode: 'multiple',
        width: 400,
        height: 400,
      });

      // selectCells([[fromRow, fromCol, toRow, toCol]]) — focus lands at the first corner (2, 2).
      await selectCells([[2, 2, 5, 5]]);

      // Capture initial focus — must be (2, 2).
      const initialHighlight = hot().getSelectedRangeLast().highlight;

      expect(initialHighlight.row).toBe(2);
      expect(initialHighlight.col).toBe(2);

      await mouseOver(getCell(3, 3));

      const topHandle = getHandle('top');

      expect(topHandle).not.toBeNull();

      const handleRect = topHandle.getBoundingClientRect();
      const targetCell = getCell(0, 3);
      const targetRect = targetCell.getBoundingClientRect();

      // Drag the top handle upward to row 0 — selection grows to rows 0..5.
      $(topHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });

      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      $(document.documentElement).simulate('mouseup');

      // The focus/active cell must NOT jump to the anchor corner (5, 5).
      // It must remain at the original position (2, 2) which is still inside the new range.
      const finalHighlight = hot().getSelectedRangeLast().highlight;

      expect(finalHighlight.row).toBe(2);
      expect(finalHighlight.col).toBe(2);
    });

    it('should clamp the focus to the new range when shrinking shrinks it out', async() => {
      handsontable({
        data: createSpreadsheetData(10, 8),
        selectionHandles: true,
        selectionMode: 'multiple',
        width: 400,
        height: 400,
      });

      // selectCells([[2, 2, 5, 5]]) — focus starts at (2, 2).
      await selectCells([[2, 2, 5, 5]]);

      const initialHighlight = hot().getSelectedRangeLast().highlight;

      expect(initialHighlight.row).toBe(2);
      expect(initialHighlight.col).toBe(2);

      await mouseOver(getCell(3, 3));

      const topHandle = getHandle('top');

      expect(topHandle).not.toBeNull();

      const handleRect = topHandle.getBoundingClientRect();
      // Drag the top handle DOWN to row 4, shrinking the top edge past the original focus row (2).
      // New range will be rows 4..5, cols 2..5. Focus row 2 is outside — must clamp to row 4.
      const targetCell = getCell(4, 3);
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

      // Focus must be clamped to the nearest cell inside the new range.
      // Row clamped to 4 (the new top edge), col stays at 2 (still inside 2..5).
      const finalHighlight = hot().getSelectedRangeLast().highlight;

      expect(finalHighlight.row).toBe(4);
      expect(finalHighlight.col).toBe(2);
    });

    it('should keep the focus/active cell stable when growing the selection via the end handle', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        selectionHandles: true,
        selectionMode: 'multiple',
        width: 500,
        height: 400,
      });

      // selectCells([[2, 2, 5, 5]]) — focus starts at (2, 2).
      await selectCells([[2, 2, 5, 5]]);

      const initialHighlight = hot().getSelectedRangeLast().highlight;

      expect(initialHighlight.row).toBe(2);
      expect(initialHighlight.col).toBe(2);

      await mouseOver(getCell(3, 3));

      const endHandle = getHandle('end');

      expect(endHandle).not.toBeNull();

      const handleRect = endHandle.getBoundingClientRect();
      // Drag the end handle right to col 8, growing the selection rightward.
      const targetCell = getCell(3, 8);
      const targetRect = targetCell.getBoundingClientRect();

      $(endHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });

      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      $(document.documentElement).simulate('mouseup');

      // Focus must stay at (2, 2) — it must not jump to the anchor corner (2, 2), which is
      // the non-dragged (start) corner that setRangeEnd applies as the range's from-coord.
      const finalHighlight = hot().getSelectedRangeLast().highlight;

      expect(finalHighlight.row).toBe(2);
      expect(finalHighlight.col).toBe(2);
    });

    it('should clamp the focus to the new range when shrinking via the bottom handle pushes the focus out', async() => {
      handsontable({
        data: createSpreadsheetData(10, 8),
        selectionHandles: true,
        selectionMode: 'multiple',
        width: 400,
        height: 400,
      });

      // selectCells([[5, 2, 2, 5]]) → from=(5,2), to=(2,5). Focus lands at from=(5,2).
      // This places the focus on the bottom row (row 5) of the normalized [2..5] range.
      await selectCells([[5, 2, 2, 5]]);

      const initialHighlight = hot().getSelectedRangeLast().highlight;

      expect(initialHighlight.row).toBe(5);
      expect(initialHighlight.col).toBe(2);

      await mouseOver(getCell(3, 3));

      const bottomHandle = getHandle('bottom');

      expect(bottomHandle).not.toBeNull();

      const handleRect = bottomHandle.getBoundingClientRect();
      // Drag the bottom handle UP to row 3, shrinking the bottom edge past the original focus row (5).
      // New range will be rows [2..3], cols [2..5]. Focus row 5 is outside — must clamp to 3.
      const targetCell = getCell(3, 3);
      const targetRect = targetCell.getBoundingClientRect();

      $(bottomHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });

      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      $(document.documentElement).simulate('mouseup');

      // Focus must be clamped to the nearest row inside the new range.
      // Row 5 is above the new bottom edge (row 3 after shrink) → clamped to 3.
      // Col 2 is still inside [2..5] → unchanged.
      const finalHighlight = hot().getSelectedRangeLast().highlight;

      expect(finalHighlight.row).toBe(3);
      expect(finalHighlight.col).toBe(2);
    });

    it('should clamp the focus to the new range when shrinking via the start handle pushes the focus out', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        selectionHandles: true,
        selectionMode: 'multiple',
        width: 500,
        height: 400,
      });

      // selectCells([[2, 2, 5, 5]]) → from=(2,2), to=(5,5). Focus lands at from=(2,2).
      // This places the focus at the start column (col 2) of the normalized [2..5] range.
      await selectCells([[2, 2, 5, 5]]);

      const initialHighlight = hot().getSelectedRangeLast().highlight;

      expect(initialHighlight.row).toBe(2);
      expect(initialHighlight.col).toBe(2);

      await mouseOver(getCell(3, 3));

      const startHandle = getHandle('start');

      expect(startHandle).not.toBeNull();

      const handleRect = startHandle.getBoundingClientRect();
      // Drag the start handle RIGHT to col 4, shrinking the start edge past the original focus col (2).
      // New range will be rows [2..5], cols [4..5]. Focus col 2 is outside — must clamp to 4.
      const targetCell = getCell(3, 4);
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

      // Focus must be clamped to the nearest column inside the new range.
      // Col 2 is below the new start edge (col 4 after shrink) → clamped to 4.
      // Row 2 is still inside [2..5] → unchanged.
      const finalHighlight = hot().getSelectedRangeLast().highlight;

      expect(finalHighlight.row).toBe(2);
      expect(finalHighlight.col).toBe(4);
    });
  });
});
