describe('DragToScroll selection — window scroll', () => {
  const id = 'testContainer';
  const styleId = 'drag-to-scroll-window-scroll-test-styles';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      // Forces the browser window to have scrollbars in both axes so the window
      // becomes the scroll container for vertical AND horizontal drag-to-scroll.
      styleElement.textContent = `
        body { margin-bottom: 2000px; margin-right: 2000px; }
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
    // Reset window scroll position so tests do not bleed into each other.
    window.scrollTo(0, 0);
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

    // Use sleep instead of waitForNextAnimationFrames. The DragToScroll auto-scroller uses
    // setTimeout (via hot._registerTimeout), so sleep() reliably yields to both the first
    // immediate auto-scroll tick and any subsequent ticks — no rAF needed.
    await sleep(400);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    // Anchor row must be unchanged.
    expect(selectedAfter[0]).toBe(anchorRow);
    // The selection end row must be >= anchor — dragging DOWN should never push the
    // end row ABOVE the anchor row (which was the bug when the window was the scroll container).
    expect(selectedAfter[2]).toBeGreaterThanOrEqual(anchorRow);
  });

  it('should extend the selection upward when dragging above the window viewport', async() => {
    handsontable({
      data: createSpreadsheetData(80, 5),
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
    });

    // Scroll down so that the first few rows are off-screen above the viewport.
    await scrollViewportTo({
      row: 20,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    const anchorRow = getFirstFullyVisibleRow();
    const $anchorCell = $(getCell(anchorRow, 0, true));
    const anchorRect = $anchorCell[0].getBoundingClientRect();

    $anchorCell.simulate('mousedown', {
      clientX: anchorRect.left + 2,
      clientY: anchorRect.top + 2,
    });

    // Place the mouse ABOVE the window's top edge to trigger upward auto-scroll.
    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: anchorRect.left + 2,
        clientY: -50,
      });

    await sleep(400);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    // Anchor row must be unchanged.
    expect(selectedAfter[0]).toBe(anchorRow);
    // Dragging UP should extend the selection end above the anchor.
    expect(selectedAfter[2]).toBeLessThanOrEqual(anchorRow);
  });

  it('should extend the selection rightward when dragging past the right edge of the window viewport', async() => {
    // 100 columns and a fixed width so horizontal scroll is required. Horizontal
    // scrolling may be the window or the table holder, depending on layout.
    handsontable({
      data: createSpreadsheetData(5, 100),
      width: 300,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
    });

    const anchorCol = getFirstFullyVisibleColumn();
    const $anchorCell = $(getCell(0, anchorCol, true));
    const anchorRect = $anchorCell[0].getBoundingClientRect();

    $anchorCell.simulate('mousedown', {
      clientX: anchorRect.left + 2,
      clientY: anchorRect.top + 2,
    });

    // Place the mouse PAST the window's right edge to trigger rightward auto-scroll.
    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: window.innerWidth + 50,
        clientY: anchorRect.top + 2,
      });

    await sleep(400);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    // Anchor column must be unchanged.
    expect(selectedAfter[1]).toBe(anchorCol);
    // The selection end column must be further right than the anchor.
    expect(selectedAfter[3]).toBeGreaterThan(anchorCol);
    // The horizontal scroll offset must have increased (window and holder differ by layout).
    expect(hot().view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).toBeGreaterThan(0);
  });

  it('should stop scrolling when the mouse returns inside the window viewport', async() => {
    handsontable({
      data: createSpreadsheetData(200, 5),
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
    });

    const $cell = $(getCell(0, 0, true));
    const cellRect = $cell[0].getBoundingClientRect();

    $cell.simulate('mousedown', {
      clientX: cellRect.left + 2,
      clientY: cellRect.top + 2,
    });

    // Move below the window to start auto-scroll.
    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: cellRect.left + 2,
        clientY: window.innerHeight + 50,
      });

    await sleep(300);

    const scrollYWhenOutside = window.scrollY;

    expect(scrollYWhenOutside).toBeGreaterThan(0);

    // Move the mouse back inside the window — the auto-scroller must stop immediately.
    $(document.body).simulate('mousemove', {
      clientX: cellRect.left + 2,
      clientY: window.innerHeight / 2,
    });

    // Give the scheduler a moment; if the scroller did NOT stop it would keep
    // advancing scrollY during this delay.
    await sleep(300);

    const scrollYAfterReturn = window.scrollY;

    $(document.body).simulate('mouseup');

    expect(scrollYAfterReturn).toBe(scrollYWhenOutside);
  });
});
