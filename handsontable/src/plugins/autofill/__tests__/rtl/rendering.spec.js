describe('AutoFill (RTL mode) borders rendering', () => {
  const id = 'testContainer';
  const styleId = 'autofill-rendering-test-styles';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      // forces the browser window to have scrollbars
      styleElement.textContent = `
        body {
          margin-bottom: 2000px;
        }
        #${id} {
          position: absolute;
          top: 1000px;
          left: -1000px;
        }
      `;
      document.head.appendChild(styleElement);
    }
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }

    document.getElementById(styleId)?.remove();
  });

  it('should render borders when dragging left (not defined table size, window viewport is scrolled)', async() => {
    handsontable({
      data: createEmptySpreadsheetData(5, 5),
      fillHandle: {
        autoInsertRow: false,
      },
    });

    await selectCell(4, 4); // scroll to the bottom-end cell
    await selectCell(1, 1, 1, 1, false, true);

    // mouse points 1px to the left of the next column (no border change)
    simulateFillHandleDrag(getCell(1, 1), {
      finish: false,
      offsetX: -Math.floor(getDefaultColumnWidth() / 2) + 1,
    });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 1,1 from: 1,1 to: 1,1');

    // mouse points to the center of the next column (border change)
    simulateFillHandleDragMove(getCell(1, 2), { offsetX: 0 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 1,1 from: 1,1 to: 1,2');

    // mouse points to the end of the next column (no border change)
    simulateFillHandleDragMove(getCell(1, 2), {
      offsetX: -Math.floor(getDefaultColumnWidth() / 2) + 1,
    });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 1,1 from: 1,1 to: 1,2');

    // mouse points 1px to the right of the next column (border change)
    simulateFillHandleDragMove(getCell(1, 2), {
      offsetX: -Math.floor(getDefaultColumnWidth() / 2),
    });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 1,1 from: 1,1 to: 1,3');
  });

  it('should render borders when dragging left (defined table size with scrolled viewport, window viewport is scrolled)', async() => {
    const viewportSize = 6;

    handsontable({
      data: createEmptySpreadsheetData(20, 20),
      width: getDefaultColumnWidth() * viewportSize,
      height: getDefaultRowHeight() * viewportSize,
      dragToScroll: false,
      fillHandle: {
        autoInsertRow: false,
      },
    });

    await scrollViewportTo({
      row: countRows() / 2,
      col: countCols() / 2,
    });
    // center the viewport on the middle cell
    await selectCell(8, 8);

    // mouse points 1px to the left of the next column (no border change)
    simulateFillHandleDrag(getCell(8, 9), {
      finish: false,
      offsetX: Math.floor(getDefaultColumnWidth() / 2) + 1,
    });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,8');

    // mouse points to the center of the next column (border change)
    simulateFillHandleDragMove(getCell(8, 9), { offsetX: 0 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,9');

    // mouse points to the end of the next column (no border change)
    simulateFillHandleDragMove(getCell(8, 9), {
      offsetX: -Math.floor(getDefaultColumnWidth() / 2) + 1,
    });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,9');

    // mouse points 1px to the right of the next column (border change)
    simulateFillHandleDragMove(getCell(8, 9), {
      offsetX: -Math.floor(getDefaultColumnWidth() / 2),
    });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,10');
  });

  it('should render borders when dragging right (not defined table size, window viewport is scrolled)', async() => {
    handsontable({
      data: createEmptySpreadsheetData(5, 5),
      fillHandle: {
        autoInsertRow: false,
      },
    });

    await scrollViewportTo({
      row: countRows() - 1,
      col: countCols() - 1,
    });
    await selectCell(1, 3);

    // mouse points 1px to the left of the current column (no border change)
    simulateFillHandleDrag(getCell(1, 3), {
      finish: false,
      offsetX: Math.floor(getDefaultColumnWidth() / 2),
    });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 1,3 from: 1,3 to: 1,3');

    // mouse points to the center of the next column (border change)
    simulateFillHandleDragMove(getCell(1, 2), { offsetX: 0 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 1,3 from: 1,3 to: 1,2');

    // mouse points to the beginning of the next column (no border change)
    simulateFillHandleDragMove(getCell(1, 2), {
      offsetX: Math.floor(getDefaultColumnWidth() / 2),
    });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 1,3 from: 1,3 to: 1,2');

    // mouse points 1px to the left of the next column (border change)
    simulateFillHandleDragMove(getCell(1, 2), {
      offsetX: Math.floor(getDefaultColumnWidth() / 2) + 1,
    });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 1,3 from: 1,3 to: 1,1');
  });

  it('should render borders when dragging right (defined table size with scrolled viewport, window viewport is scrolled)', async() => {
    const viewportSize = 6;

    handsontable({
      data: createEmptySpreadsheetData(20, 20),
      width: getDefaultColumnWidth() * viewportSize,
      height: getDefaultRowHeight() * viewportSize,
      dragToScroll: false,
      fillHandle: {
        autoInsertRow: false,
      },
    });

    await scrollViewportTo({
      row: countRows() / 2,
      col: countCols() / 2,
    });
    // center the viewport on the middle cell
    await selectCell(8, 8);

    // mouse points 1px to the left of the current column (no border change)
    simulateFillHandleDrag(getCell(8, 8), {
      finish: false,
      offsetX: Math.floor(getDefaultColumnWidth() / 2),
    });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,8');

    // mouse points to the center of the next column (border change)
    simulateFillHandleDragMove(getCell(8, 7), { offsetX: 0 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,7');

    // mouse points to the beginning of the next column (no border change)
    simulateFillHandleDragMove(getCell(8, 7), {
      offsetX: Math.floor(getDefaultColumnWidth() / 2),
    });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,7');

    // mouse points 1px to the left of the next column (border change)
    simulateFillHandleDragMove(getCell(8, 7), {
      offsetX: Math.floor(getDefaultColumnWidth() / 2) + 1,
    });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,6');
  });

  it('should properly render borders when mouse is moving outside the table viewport (not defined table size, window viewport is scrolled)', async() => {
    handsontable({
      data: createEmptySpreadsheetData(5, 5),
      fillHandle: {
        autoInsertRow: false,
      },
    });

    await scrollViewportTo({
      row: countRows() - 1,
      col: countCols() - 1,
    });
    await selectCell(2, 2);

    simulateFillHandleDrag(getCell(3, 2), { finish: false });
    // extend the border range by pointing the mouse pointer 100px below the current cell (mouse is out of the table viewport)
    simulateFillHandleDragMove(getCell(4, 2), { offsetY: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 4,2');

    // test how the autofill border changes the direction when the mouse pointer is moved outside the table viewport

    // mouse pointer moves below the table viewport
    simulateFillHandleDragMove(getCell(4, 1), { offsetY: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 4,2');

    simulateFillHandleDragMove(getCell(4, 0), { offsetY: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 4,2');

    // mouse pointer moves on the left-bottom corner of the table viewport
    simulateFillHandleDragMove(getCell(4, 0), { offsetX: 100, offsetY: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 4,2');

    // mouse pointer moves on the left side of the table viewport
    simulateFillHandleDragMove(getCell(4, 0), { offsetX: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 4,2');

    simulateFillHandleDragMove(getCell(3, 0), { offsetX: 100 });

    // the autofill border changes the direction to horizontal
    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 3,2');

    simulateFillHandleDragMove(getCell(2, 0), { offsetX: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 2,0');

    simulateFillHandleDragMove(getCell(1, 0), { offsetX: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 2,0');

    simulateFillHandleDragMove(getCell(0, 0), { offsetX: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 2,0');

    // mouse pointer moves on the top-left corner of the table viewport
    simulateFillHandleDragMove(getCell(0, 0), { offsetX: 100, offsetY: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 2,0');

    // mouse pointer moves on the top side of the table viewport
    simulateFillHandleDragMove(getCell(0, 0), { offsetY: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 2,0');

    simulateFillHandleDragMove(getCell(0, 1), { offsetY: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 2,1');

    // the autofill border changes the direction to vertical
    simulateFillHandleDragMove(getCell(0, 2), { offsetY: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 0,2');

    simulateFillHandleDragMove(getCell(0, 3), { offsetY: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 0,2');

    simulateFillHandleDragMove(getCell(0, 4), { offsetY: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 0,2');

    // mouse pointer moves on the right-top corner of the table viewport
    simulateFillHandleDragMove(getCell(0, 4), { offsetX: -100, offsetY: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 0,2');

    // mouse pointer moves on the right side of the table viewport
    simulateFillHandleDragMove(getCell(0, 4), { offsetX: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 0,2');

    simulateFillHandleDragMove(getCell(1, 4), { offsetX: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 1,2');

    // the autofill border changes the direction to horizontal
    simulateFillHandleDragMove(getCell(2, 4), { offsetX: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 2,4');

    simulateFillHandleDragMove(getCell(3, 4), { offsetX: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 2,4');

    simulateFillHandleDragMove(getCell(4, 4), { offsetX: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 2,4');

    // mouse pointer moves on the right-bottom corner of the table viewport
    simulateFillHandleDragMove(getCell(4, 4), { offsetX: -100, offsetY: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 2,2 from: 2,2 to: 2,4');
  });

  it('should properly render borders when mouse is moving outside the table viewport (defined table size with scrolled viewport, window viewport is scrolled)', async() => {
    const viewportSize = 6;

    handsontable({
      data: createEmptySpreadsheetData(20, 20),
      width: getDefaultColumnWidth() * viewportSize,
      height: getDefaultRowHeight() * viewportSize,
      dragToScroll: false,
      fillHandle: {
        autoInsertRow: false,
      },
    });

    await scrollViewportTo({
      row: countRows() / 2,
      col: countCols() / 2,
    });
    // center the viewport on the middle cell
    await selectCell(8, 8);

    simulateFillHandleDrag(getCell(9, 8), { finish: false });
    // extend the border range by pointing the mouse pointer 100px below the current cell (mouse is out of the table viewport)
    simulateFillHandleDragMove(getCell(10, 8), { offsetY: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 11,8');

    // test how the autofill border changes the direction when the mouse pointer is moved outside the table viewport

    // mouse pointer moves below the table viewport
    simulateFillHandleDragMove(getCell(10, 7), { offsetY: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 11,8');

    simulateFillHandleDragMove(getCell(10, 5), { offsetY: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 11,8');

    // mouse pointer moves on the left-bottom corner of the table viewport
    simulateFillHandleDragMove(getCell(10, 4), { offsetX: 100, offsetY: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 11,8');

    // mouse pointer moves on the left side of the table viewport
    simulateFillHandleDragMove(getCell(10, 4), { offsetX: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 10,8');

    simulateFillHandleDragMove(getCell(9, 4), { offsetX: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 9,8');

    simulateFillHandleDragMove(getCell(8, 4), { offsetX: 100 });

    // the autofill border changes the direction to horizontal
    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,5');

    simulateFillHandleDragMove(getCell(7, 4), { offsetX: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,5');

    simulateFillHandleDragMove(getCell(6, 4), { offsetX: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,5');

    simulateFillHandleDragMove(getCell(5, 4), { offsetX: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,5');

    // mouse pointer moves on the top-left corner of the table viewport
    simulateFillHandleDragMove(getCell(5, 4), { offsetX: 100, offsetY: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,5');

    // mouse pointer moves on the top side of the table viewport
    simulateFillHandleDragMove(getCell(5, 5), { offsetY: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,5');

    simulateFillHandleDragMove(getCell(5, 7), { offsetY: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,7');

    // the autofill border changes the direction to vertical
    simulateFillHandleDragMove(getCell(5, 8), { offsetY: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 5,8');

    simulateFillHandleDragMove(getCell(5, 9), { offsetY: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 5,8');

    simulateFillHandleDragMove(getCell(5, 10), { offsetY: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 5,8');

    // mouse pointer moves on the right-top corner of the table viewport
    simulateFillHandleDragMove(getCell(5, 11), { offsetX: -100, offsetY: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 5,8');

    // mouse pointer moves on the right side of the table viewport
    simulateFillHandleDragMove(getCell(6, 11), { offsetX: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 6,8');

    simulateFillHandleDragMove(getCell(7, 11), { offsetX: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 7,8');

    // the autofill border changes the direction to horizontal
    simulateFillHandleDragMove(getCell(8, 11), { offsetX: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,10');

    simulateFillHandleDragMove(getCell(9, 11), { offsetX: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,10');

    simulateFillHandleDragMove(getCell(10, 11), { offsetX: -100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,10');

    // mouse pointer moves on the right-bottom corner of the table viewport
    simulateFillHandleDragMove(getCell(10, 11), { offsetX: -100, offsetY: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,10');

    // mouse pointer moves below the table viewport
    simulateFillHandleDragMove(getCell(10, 10), { offsetY: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,10');

    simulateFillHandleDragMove(getCell(10, 9), { offsetY: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 8,9');

    // the autofill border changes the direction to vertical
    simulateFillHandleDragMove(getCell(10, 8), { offsetY: 100 });

    expect(getFillHandleBorderRange()).toEqualCellRange('highlight: 8,8 from: 8,8 to: 11,8');
  });
});
