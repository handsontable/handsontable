describe('settings', () => {
  describe('moveCells drag interaction', () => {
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

    /**
     * Returns the first visible `.wtMoveZone` element inside the master table, or null.
     *
     * @returns {Element|null}
     */
    function getMoveZone() {
      const all = spec().$container[0].querySelectorAll('.ht_master .wtMoveZone');

      return Array.from(all).find(el => el.style.display !== 'none') ?? null;
    }

    it('should show the move zone when moveCells is enabled and a range is selected', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        moveCells: true,
        width: 400,
        height: 300,
      });

      await selectCells([[2, 2, 3, 3]]);

      const zone = getMoveZone();

      expect(zone).not.toBeNull();
    });

    it('should not show the move zone when moveCells is disabled', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        moveCells: false,
        width: 400,
        height: 300,
      });

      await selectCells([[2, 2, 3, 3]]);

      const zone = getMoveZone();

      expect(zone).toBeNull();
    });

    it('should move the selection when dragging the edge move zone to a new location', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        moveCells: true,
        width: 400,
        height: 300,
      });

      const src = getDataAtCell(2, 2);

      await selectCells([[2, 2, 3, 3]]);

      const zone = getMoveZone();

      expect(zone).not.toBeNull();

      const zoneRect = zone.getBoundingClientRect();
      const targetCell = getCell(5, 5);
      const targetRect = targetCell.getBoundingClientRect();

      // Mousedown the move zone.
      $(zone).simulate('mousedown', {
        clientX: zoneRect.left + (zoneRect.width / 2),
        clientY: zoneRect.top + (zoneRect.height / 2),
      });

      // Move to the target cell.
      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      // Drop.
      $(document.documentElement).simulate('mouseup', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      expect(getDataAtCell(5, 5)).toBe(src);
      expect(getDataAtCell(2, 2)).toBeNull();
    });

    it('should render the ghost preview over the drop target while dragging', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        moveCells: true,
        width: 500,
        height: 400,
      });

      await selectCells([[2, 2, 3, 3]]);

      const zone = getMoveZone();

      expect(zone).not.toBeNull();

      const zoneRect = zone.getBoundingClientRect();
      const targetCell = getCell(5, 5);
      const targetRect = targetCell.getBoundingClientRect();

      $(zone).simulate('mousedown', {
        clientX: zoneRect.left + (zoneRect.width / 2),
        clientY: zoneRect.top + (zoneRect.height / 2),
      });

      // Move the pointer over an interior target cell (drag not yet released).
      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      const ghost = spec().$container[0].querySelector('.wtMoveGhost');

      expect(ghost).not.toBeNull();
      expect(ghost.style.display).not.toBe('none');

      // The ghost must be positioned OVER the drop-target cell (it overlaps it), proving the preview
      // shows where the selection will land. A positioning regression pushes the ghost off-screen
      // (negative offset) so it no longer overlaps the target.
      const ghostRect = ghost.getBoundingClientRect();
      const overlapsTarget =
        ghostRect.right > targetRect.left &&
        ghostRect.left < targetRect.right &&
        ghostRect.bottom > targetRect.top &&
        ghostRect.top < targetRect.bottom;

      expect(overlapsTarget).toBe(true);

      // Release to finish the drag cleanly.
      $(document.documentElement).simulate('mouseup', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });
    });

    it('should hold the grabbing cursor while dragging and clear it on drop', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        moveCells: true,
        width: 500,
        height: 400,
      });

      await selectCells([[2, 2, 3, 3]]);

      const zone = getMoveZone();

      expect(zone).not.toBeNull();

      const zoneRect = zone.getBoundingClientRect();
      const targetRect = getCell(5, 5).getBoundingClientRect();

      $(zone).simulate('mousedown', {
        clientX: zoneRect.left + (zoneRect.width / 2),
        clientY: zoneRect.top + (zoneRect.height / 2),
      });
      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      // During the drag the document body holds the grabbing cursor (so it persists off-grid too).
      expect(document.body.style.cursor).toBe('grabbing');

      $(document.documentElement).simulate('mouseup', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      // The cursor is cleared once the drag ends.
      expect(document.body.style.cursor).toBe('');
    });

    it('should copy instead of moving when Ctrl is held on drop', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        moveCells: true,
        width: 400,
        height: 300,
      });

      const src = getDataAtCell(2, 2);

      await selectCells([[2, 2, 3, 3]]);

      const zone = getMoveZone();

      expect(zone).not.toBeNull();

      const zoneRect = zone.getBoundingClientRect();
      const targetCell = getCell(5, 5);
      const targetRect = targetCell.getBoundingClientRect();

      $(zone).simulate('mousedown', {
        clientX: zoneRect.left + (zoneRect.width / 2),
        clientY: zoneRect.top + (zoneRect.height / 2),
      });

      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      // Drop with Ctrl held — should copy, not move.
      $(document.documentElement).simulate('mouseup', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
        ctrlKey: true,
      });

      // Source is kept when copying.
      expect(getDataAtCell(2, 2)).toBe(src);
      // Target receives the value.
      expect(getDataAtCell(5, 5)).toBe(src);
    });

    it('should cancel the move when Escape is pressed during drag', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        moveCells: true,
        width: 400,
        height: 300,
      });

      const src = getDataAtCell(2, 2);
      const targetOriginal = getDataAtCell(5, 5);

      await selectCells([[2, 2, 3, 3]]);

      const zone = getMoveZone();

      expect(zone).not.toBeNull();

      const zoneRect = zone.getBoundingClientRect();
      const targetCell = getCell(5, 5);
      const targetRect = targetCell.getBoundingClientRect();

      $(zone).simulate('mousedown', {
        clientX: zoneRect.left + (zoneRect.width / 2),
        clientY: zoneRect.top + (zoneRect.height / 2),
      });

      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      // Cancel by pressing Escape.
      $(document.documentElement).simulate('keydown', { key: 'Escape' });

      // Nothing should have changed.
      expect(getDataAtCell(2, 2)).toBe(src);
      expect(getDataAtCell(5, 5)).toBe(targetOriginal);
    });

    it('should add the ht__moving class during drag and remove it after drop', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        moveCells: true,
        width: 400,
        height: 300,
      });

      await selectCells([[2, 2, 3, 3]]);

      const zone = getMoveZone();
      const zoneRect = zone.getBoundingClientRect();
      // hot().rootElement is the actual root (a child wrapper div inside spec().$container).
      const rootEl = hot().rootElement;

      $(zone).simulate('mousedown', {
        clientX: zoneRect.left + (zoneRect.width / 2),
        clientY: zoneRect.top + (zoneRect.height / 2),
      });

      expect(rootEl.classList.contains('ht__moving')).toBe(true);

      const targetCell = getCell(5, 5);
      const targetRect = targetCell.getBoundingClientRect();

      $(document.documentElement).simulate('mouseup', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      expect(rootEl.classList.contains('ht__moving')).toBe(false);
    });

    it('should not start a move drag when moveCells option is false', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        moveCells: false,
        width: 400,
        height: 300,
      });

      const src = getDataAtCell(2, 2);

      await selectCells([[2, 2, 3, 3]]);

      // Simulate a mousedown at the position of a cell border — no zone should exist.
      const targetCell = getCell(5, 5);
      const targetRect = targetCell.getBoundingClientRect();

      $(document.documentElement).simulate('mouseup', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      // Data must be unchanged.
      expect(getDataAtCell(2, 2)).toBe(src);
    });

    it('should copy instead of moving when Meta (Cmd) is held on drop', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        moveCells: true,
        width: 400,
        height: 300,
      });

      const src = getDataAtCell(2, 2);

      await selectCells([[2, 2, 3, 3]]);

      const zone = getMoveZone();

      expect(zone).not.toBeNull();

      const zoneRect = zone.getBoundingClientRect();
      const targetCell = getCell(5, 5);
      const targetRect = targetCell.getBoundingClientRect();

      $(zone).simulate('mousedown', {
        clientX: zoneRect.left + (zoneRect.width / 2),
        clientY: zoneRect.top + (zoneRect.height / 2),
      });

      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      // Drop with Meta (Cmd) held — should copy, not move.
      $(document.documentElement).simulate('mouseup', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
        metaKey: true,
      });

      // Source is kept when copying.
      expect(getDataAtCell(2, 2)).toBe(src);
      // Target receives the value.
      expect(getDataAtCell(5, 5)).toBe(src);
    });

    it('should show the ghost element during drag and remove it after drop', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        moveCells: true,
        width: 400,
        height: 300,
      });

      await selectCells([[2, 2, 3, 3]]);

      const zone = getMoveZone();

      expect(zone).not.toBeNull();

      const zoneRect = zone.getBoundingClientRect();
      const targetCell = getCell(5, 5);
      const targetRect = targetCell.getBoundingClientRect();

      $(zone).simulate('mousedown', {
        clientX: zoneRect.left + (zoneRect.width / 2),
        clientY: zoneRect.top + (zoneRect.height / 2),
      });

      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      // Ghost should be present and visible during the drag.
      const ghostDuring = spec().$container[0].querySelector('.wtMoveGhost');

      expect(ghostDuring).not.toBeNull();
      expect(ghostDuring.style.display).toBe('block');

      // Drop.
      $(document.documentElement).simulate('mouseup', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      // Ghost should be removed after drop.
      const ghostAfter = spec().$container[0].querySelector('.wtMoveGhost');

      expect(ghostAfter).toBeNull();
    });

    it('should honor the grab offset when dragging from a non-top-left cell of a 2x2 range', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        moveCells: true,
        width: 400,
        height: 300,
      });

      // Select a 2x2 range: rows 1-2, cols 1-2.
      await selectCells([[1, 1, 2, 2]]);

      const zone = getMoveZone();

      expect(zone).not.toBeNull();

      // Grab the bottom-right cell of the range (row 2, col 2).
      const grabCell = getCell(2, 2);
      const grabRect = grabCell.getBoundingClientRect();

      $(zone).simulate('mousedown', {
        clientX: grabRect.left + (grabRect.width / 2),
        clientY: grabRect.top + (grabRect.height / 2),
      });

      // Move so that the grabbed cell (bottom-right) lands on row 6, col 6.
      // The grab offset within the range is (1, 1) (bottom-right of the 2x2),
      // so the block's top-left should end up at (6 - 1, 6 - 1) = (5, 5).
      const targetCell = getCell(6, 6);
      const targetRect = targetCell.getBoundingClientRect();

      $(document.documentElement).simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      // Drop.
      $(document.documentElement).simulate('mouseup', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      // The 2x2 block should have moved so that its top-left is at (5, 5).
      // Original top-left value (row 1, col 1) should now be at (5, 5).
      expect(getDataAtCell(5, 5)).toBe('B2');
      // Original positions should now be empty (moved, not copied).
      expect(getDataAtCell(1, 1)).toBeNull();
    });

    it('should not show the move zone bands when disableVisualSelection is set', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        moveCells: true,
        disableVisualSelection: true,
        width: 400,
        height: 300,
      });

      await selectCells([[2, 2, 3, 3]]);

      const zone = getMoveZone();

      // The move zone must not be rendered when visual selection is disabled.
      expect(zone).toBeNull();
    });

    it('should not move data when disableVisualSelection is set and a drag is attempted', async() => {
      const originalData = createSpreadsheetData(10, 10);

      handsontable({
        data: originalData,
        moveCells: true,
        disableVisualSelection: true,
        width: 400,
        height: 300,
      });

      const src = getDataAtCell(2, 2);

      await selectCells([[2, 2, 3, 3]]);

      // No zone should exist, so a manual drag attempt cannot start a move.
      const zone = getMoveZone();

      expect(zone).toBeNull();

      // Attempt a raw mouseup at a different cell — data must remain unchanged.
      const targetCell = getCell(5, 5);
      const targetRect = targetCell.getBoundingClientRect();

      $(document.documentElement).simulate('mouseup', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });

      expect(getDataAtCell(2, 2)).toBe(src);
      expect(getDataAtCell(5, 5)).toBe(originalData[5][5]);
    });
  });
});
