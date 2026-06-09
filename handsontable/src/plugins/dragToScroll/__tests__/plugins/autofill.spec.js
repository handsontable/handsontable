describe('DragToScroll — autofill integration', () => {
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
   * Reads the autofill fill-handle border range.
   *
   * @returns {CellRange|undefined}
   */
  function getFillRange() {
    return selection().highlight.getFill().visualCellRange;
  }

  /**
   * Returns the visible fill-handle corner element with non-zero dimensions.
   *
   * @returns {HTMLElement}
   */
  function getVisibleFillHandle() {
    const corners = spec().$container.find('.wtBorder.current.corner').toArray();

    return corners.find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
  }

  describe('down direction', () => {
    it('should scroll down and extend the autofill range when dragging the fill handle below the viewport',
      async() => {
        handsontable({
          data: createSpreadsheetData(40, 5),
          width: 250,
          height: 150,
          rowHeaders: true,
          colHeaders: true,
          dragToScroll: true,
          fillHandle: true,
        });

        await selectCell(0, 0);

        const fillHandle = getVisibleFillHandle();
        const handleRect = fillHandle.getBoundingClientRect();
        const tableRect = getMaster()[0].getBoundingClientRect();

        $(fillHandle).simulate('mousedown', {
          clientX: handleRect.left + (handleRect.width / 2),
          clientY: handleRect.top + (handleRect.height / 2),
        });

        $(document.body)
          .simulate('mouseover')
          .simulate('mousemove', {
            clientX: tableRect.left + 30,
            clientY: tableRect.bottom + 60,
          });

        await waitForNextAnimationFrames(15);

        const scrollTopAfter = getMaster().find('.wtHolder').scrollTop();
        const fillRange = getFillRange();

        $(document.body).simulate('mouseup');

        expect(scrollTopAfter).toBeGreaterThan(0);
        expect(fillRange).toBeTruthy();
        expect(fillRange.to.row).toBeGreaterThan(expectedLastFullyVisibleRow(150));
      });
  });

  describe('up direction', () => {
    it('should scroll up and extend the autofill range when dragging the fill handle above the viewport',
      async() => {
        handsontable({
          data: createSpreadsheetData(40, 5),
          width: 250,
          height: 150,
          rowHeaders: true,
          colHeaders: true,
          dragToScroll: true,
          fillHandle: true,
        });

        const lastRow = countRows() - 1;

        // Select a row near the bottom that is fully visible so the fill handle
        // is accessible. The viewport will scroll to make the cell visible.
        await selectCell(lastRow - 2, 0);

        const fillHandle = getVisibleFillHandle();
        const handleRect = fillHandle.getBoundingClientRect();
        const tableRect = getMaster()[0].getBoundingClientRect();

        $(fillHandle).simulate('mousedown', {
          clientX: handleRect.left + (handleRect.width / 2),
          clientY: handleRect.top + (handleRect.height / 2),
        });

        $(document.body)
          .simulate('mouseover')
          .simulate('mousemove', {
            clientX: tableRect.left + 30,
            clientY: tableRect.top - 60,
          });

        await waitForNextAnimationFrames(15);

        const fillRange = getFillRange();

        $(document.body).simulate('mouseup');

        expect(fillRange).toBeTruthy();
        // For upward drag, the fill range extends from the selected row to rows above.
        expect(fillRange.to.row).toBeLessThan(lastRow - 3);
      });
  });

  describe('right direction', () => {
    it('should scroll right and extend the autofill range when dragging the fill handle past the right edge',
      async() => {
        handsontable({
          data: createSpreadsheetData(5, 40),
          width: 250,
          height: 150,
          rowHeaders: true,
          colHeaders: true,
          dragToScroll: true,
          fillHandle: true,
        });

        await selectCell(0, 0);

        const fillHandle = getVisibleFillHandle();
        const handleRect = fillHandle.getBoundingClientRect();
        const tableRect = getMaster()[0].getBoundingClientRect();

        $(fillHandle).simulate('mousedown', {
          clientX: handleRect.left + (handleRect.width / 2),
          clientY: handleRect.top + (handleRect.height / 2),
        });

        $(document.body)
          .simulate('mouseover')
          .simulate('mousemove', {
            clientX: tableRect.right + 60,
            clientY: tableRect.top + 30,
          });

        await waitForNextAnimationFrames(15);

        const scrollLeftAfter = getMaster().find('.wtHolder').scrollLeft();
        const fillRange = getFillRange();

        $(document.body).simulate('mouseup');

        expect(scrollLeftAfter).toBeGreaterThan(0);
        expect(fillRange).toBeTruthy();
        expect(fillRange.to.col).toBeGreaterThan(3);
      });
  });

  describe('left direction', () => {
    it('should scroll left and extend the autofill range when dragging the fill handle past the left edge',
      async() => {
        spec().$container.css('margin-left', '100px');

        handsontable({
          data: createSpreadsheetData(5, 40),
          width: 250,
          height: 150,
          rowHeaders: true,
          colHeaders: true,
          dragToScroll: true,
          fillHandle: true,
        });

        const lastCol = countCols() - 1;

        // Select a column near the end that is fully visible so the fill handle
        // is accessible.
        await selectCell(0, lastCol - 2);

        const fillHandle = getVisibleFillHandle();
        const handleRect = fillHandle.getBoundingClientRect();
        const tableRect = getMaster()[0].getBoundingClientRect();

        $(fillHandle).simulate('mousedown', {
          clientX: handleRect.left + (handleRect.width / 2),
          clientY: handleRect.top + (handleRect.height / 2),
        });

        $(document.body)
          .simulate('mouseover')
          .simulate('mousemove', {
            clientX: tableRect.left - 60,
            clientY: tableRect.top + 30,
          });

        await waitForNextAnimationFrames(15);

        const fillRange = getFillRange();

        $(document.body).simulate('mouseup');

        expect(fillRange).toBeTruthy();
        // For leftward drag, the fill range extends from the selected col to cols before.
        expect(fillRange.to.col).toBeLessThan(lastCol - 3);
      });
  });

  describe('rtl', () => {
    it('should scroll and extend the autofill range when dragging the fill handle past the visual-left (end) edge in RTL',
      async() => {
        handsontable({
          data: createSpreadsheetData(5, 40),
          width: 250,
          height: 150,
          rowHeaders: true,
          colHeaders: true,
          dragToScroll: true,
          fillHandle: true,
          layoutDirection: 'rtl',
        });

        await selectCell(0, 0);

        const fillHandle = getVisibleFillHandle();
        const handleRect = fillHandle.getBoundingClientRect();
        const tableRect = getMaster()[0].getBoundingClientRect();

        $(fillHandle).simulate('mousedown', {
          clientX: handleRect.left + (handleRect.width / 2),
          clientY: handleRect.top + (handleRect.height / 2),
        });

        // In RTL, the visual-left edge corresponds to higher column indexes.
        // Dragging past it should auto-scroll and extend the fill through more columns.
        $(document.body)
          .simulate('mouseover')
          .simulate('mousemove', {
            clientX: tableRect.left - 60,
            clientY: tableRect.top + 30,
          });

        await waitForNextAnimationFrames(15);

        const fillRange = getFillRange();

        $(document.body).simulate('mouseup');

        expect(fillRange).toBeTruthy();
        expect(fillRange.to.col).toBeGreaterThan(3);
      });
  });
});
