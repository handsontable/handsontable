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
  });
});
