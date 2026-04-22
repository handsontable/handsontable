describe('DragToScroll selection — window scroll', () => {
  const id = 'testContainer';
  const styleId = 'drag-to-scroll-window-scroll-test-styles';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      // Forces the browser window to have scrollbars so the window becomes the scroll container.
      styleElement.textContent = `
        body { margin-bottom: 2000px; }
        #${id} { position: absolute; top: 500px; left: 0; }
      `;
      document.head.appendChild(styleElement);
    }
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }

    document.getElementById(styleId)?.remove();
  });

  it('should extend the selection downward (not upward) when dragging below the window viewport', async() => {
    // 80 rows ensures room to scroll after the user drags outside the window bottom edge.
    handsontable({
      data: createSpreadsheetData(80, 5),
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
    });

    // Scroll so that the last few rows are visible but row 0 is off-screen.
    await scrollViewportTo({
      row: 50,
      col: 0,
      verticalSnap: 'bottom',
      horizontalSnap: 'start',
    });

    // Pick the anchor cell at the last fully visible row.
    const anchorRow = getLastFullyVisibleRow();
    const $anchorCell = $(getCell(anchorRow, 0, true));

    $anchorCell.simulate('mousedown', {
      clientX: $anchorCell.offset().left + 2,
      clientY: $anchorCell.offset().top + 2,
    });

    // Place the mouse BELOW the window's bottom edge to trigger downward auto-scroll.
    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: $anchorCell.offset().left + 2,
        clientY: window.innerHeight + 50,
      });

    await waitForNextAnimationFrames(12);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    // Anchor row must be unchanged.
    expect(selectedAfter[0]).toBe(anchorRow);
    // The selection end row must be >= anchor — dragging DOWN should never push the
    // end row ABOVE the anchor row (which was the bug when the window was the scroll container).
    expect(selectedAfter[2]).toBeGreaterThanOrEqual(anchorRow);
  });
});
