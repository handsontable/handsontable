describe('HandsontableEditor positioning (RTL mode)', () => {
  function createEditorSettings() {
    return {
      type: 'handsontable',
      handsontable: {
        colHeaders: ['Marque', 'Country', 'Parent company'],
        colWidths: [85, 85, 220],
        data: [
          { name: 'BMW', country: 'Germany', owner: 'Bayerische Motoren Werke AG' },
          { name: 'Chrysler', country: 'USA', owner: 'Chrysler Group LLC' },
          { name: 'Nissan', country: 'Japan', owner: 'Nissan Motor Company Ltd' },
          { name: 'Suzuki', country: 'Japan', owner: 'Suzuki Motor Corporation' },
          { name: 'Toyota', country: 'Japan', owner: 'Toyota Motor Corporation' },
          { name: 'Volvo', country: 'Sweden', owner: 'Zhejiang Geely Holding Group' }
        ],
      }
    };
  }

  using('configuration object', [
    { htmlDir: 'rtl', layoutDirection: 'inherit' },
    { htmlDir: 'ltr', layoutDirection: 'rtl' },
  ], ({ htmlDir, layoutDirection }) => {

    beforeEach(function() {
      $('html').attr('dir', htmlDir);
      this.$container = $('<div id="testContainer"></div>').appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    // all other E2E tests are moved to visual tests. See ./visual-tests/tests/js-only/editors/handsontable/

    it('should render the editors dropdown on the right edited cell when there is no space left on the left', async() => {
      handsontable({
        data: createSpreadsheetData(25, 25),
        layoutDirection,
        colWidths: 80,
        rowHeights: 38,
        width: 800,
        height: 300,
        ...createEditorSettings(),
      });

      // Probe the dropdown's rendered width so we can pick scroll positions that clear the
      // flip boundary regardless of per-theme rendering width.
      await selectCell(1, 7);
      await keyDownUp('enter');
      const dropdownWidth = getActiveEditor().htContainer.getBoundingClientRect().width;

      await keyDownUp('escape');
      await deselectCell();

      // RTL mirrors the LTR geometry horizontally. Cell 7 sits at (25 - 1 - 7) columns from
      // the right edge of the data area = col index from right = 17. Cell 7 data-right = 7*80,
      // so scrolling right (positive scrollX) moves cell 7 toward the left edge in RTL.
      const workspaceWidth = 800;
      const colWidth = 80;
      const cellDataLeft = 7 * colWidth;
      // Inline-start space in RTL = space on the LEFT of the cell.
      const cellInlineStartForInlineEndPlacement = Math.max(0, workspaceWidth - colWidth - dropdownWidth - 20);
      const cellInlineStartForInlineStartPlacement = workspaceWidth - dropdownWidth + 20;
      const inlineEndScroll = cellDataLeft - cellInlineStartForInlineEndPlacement;
      const inlineStartScroll = Math.max(0, cellDataLeft - cellInlineStartForInlineStartPlacement);

      // Under RTL, `scrollViewportHorizontally` scrolls in the inline axis; the sign semantics
      // match the LTR spec. Pick the larger scroll (closer to inline-end) for the inline-end
      // placement (dropdown to the left of the cell in RTL, equivalent to "right of cell" in
      // LTR geometry).
      await scrollViewportHorizontally(inlineEndScroll);
      await selectCell(1, 7);
      await keyDownUp('enter');

      {
        const relativeRect = getCell(2, 7).getBoundingClientRect();
        const containerRect = getActiveEditor().htContainer.getBoundingClientRect();

        // Inline-end placement: the dropdown's right edge aligns with the cell's right edge
        // (within the editor's 1px inline-start border compensation, which differs by theme).
        expect(containerRect.top).toBe(relativeRect.top);
        expect(Math.abs(containerRect.right - (relativeRect.right + 1))).toBeLessThanOrEqual(1);
        // The dropdown sits to the INLINE-END of the cell in RTL, so its left edge is well
        // before the cell's left edge.
        expect(containerRect.left).toBeLessThan(relativeRect.left);
      }

      await keyDownUp('escape');
      await scrollViewportHorizontally(inlineStartScroll);
      await keyDownUp('enter');

      {
        const relativeRect = getCell(2, 7).getBoundingClientRect();
        const containerRect = getActiveEditor().htContainer.getBoundingClientRect();

        // Inline-start placement (flipped): the dropdown's left edge aligns with the cell's
        // left edge, within the editor's 1px inline-start border compensation.
        expect(containerRect.top).toBe(relativeRect.top);
        expect(Math.abs(containerRect.left - (relativeRect.left - 1))).toBeLessThanOrEqual(1);
        // The dropdown sits to the INLINE-START of the cell in RTL, so its right edge is well
        // past the cell's right edge.
        expect(containerRect.right).toBeGreaterThan(relativeRect.right);
      }
    });
  });
});
