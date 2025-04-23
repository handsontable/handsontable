describe('MergeCells Selection', () => {
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

  it('should leave the partially selected merged cells white (or any initial color), when selecting entire columns or rows', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
      mergeCells: [
        { row: 0, col: 0, rowspan: 3, colspan: 3 }
      ]
    });

    await selectColumns(0, 1);

    const mergedCell = getCell(0, 0);

    expect(getComputedStyle(mergedCell, ':before').opacity).toEqual('0');

    await selectRows(0, 1);

    expect(getComputedStyle(mergedCell, ':before').opacity).toEqual('0');
  });

  it('should leave the partially selected merged cells with their initial color, when selecting entire columns or rows ' +
    '(when the merged cells was previously fully selected)', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
      mergeCells: [
        { row: 0, col: 0, rowspan: 3, colspan: 3 }
      ],
      rowHeaders: true
    });

    // After changes introduced in Handsontable 12.0.0 we handle shortcuts only by listening Handsontable.
    // Please keep in mind that selectColumns/selectRows doesn't set instance to listening (see #7290).
    await listen();
    await selectColumns(0, 2);

    const mergedCell = getCell(0, 0);
    const selectedCellBackground = getComputedStyle(mergedCell, ':before').backgroundColor;
    const selectedCellOpacity = getComputedStyle(mergedCell, ':before').opacity;
    const firstRowHeader = getCell(0, -1, true);

    await keyDown('control/meta');

    await simulateClick(firstRowHeader);

    await keyUp('control/meta');

    expect(getComputedStyle(mergedCell, ':before').backgroundColor).toEqual(selectedCellBackground);
    expect(getComputedStyle(mergedCell, ':before').opacity).toEqual(selectedCellOpacity);
  });

  it('should make the entirely selected merged cells have the same background color as a regular selected area, when ' +
    'selecting entire columns or rows', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 6),
      mergeCells: [
        { row: 0, col: 0, rowspan: 3, colspan: 3 }
      ]
    });

    await selectCell(4, 4, 5, 5);

    const selectedCell = getCell(4, 4);
    const selectedCellBackground = getComputedStyle(selectedCell, ':before').backgroundColor;
    const selectedCellOpacity = getComputedStyle(selectedCell, ':before').opacity;

    await selectColumns(0, 2);

    const mergedCell = getCell(0, 0);

    expect(getComputedStyle(mergedCell, ':before').backgroundColor).toEqual(selectedCellBackground);
    expect(getComputedStyle(mergedCell, ':before').opacity).toEqual(selectedCellOpacity);

    await selectRows(0, 2);

    expect(getComputedStyle(mergedCell, ':before').backgroundColor).toEqual(selectedCellBackground);
    expect(getComputedStyle(mergedCell, ':before').opacity).toEqual(selectedCellOpacity);
  });

  it('should make the entirely selected merged cells have the same background color as a regular selected area, when ' +
    'selecting entire columns or rows (using multiple selection layers)', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
      mergeCells: [
        { row: 0, col: 0, rowspan: 3, colspan: 3 }
      ],
      rowHeaders: true,
      colHeaders: true
    });

    // sample the selected background
    await selectCells([[5, 1, 5, 2]]);
    const selectedCell = getCell(5, 1);
    const selectedCellBackground = getComputedStyle(selectedCell, ':before').backgroundColor;
    const selectedCellOpacity = getComputedStyle(selectedCell, ':before').opacity;

    const mergedCell = getCell(0, 0);
    const rowHeaders = [
      getCell(0, -1, true),
      getCell(1, -1, true),
      getCell(2, -1, true),
      getCell(3, -1, true),
    ];
    const columnHeaders = [
      spec().$container.find('.ht_clone_top tr:eq(0) th:eq(1)'),
      spec().$container.find('.ht_clone_top tr:eq(0) th:eq(2)'),
      spec().$container.find('.ht_clone_top tr:eq(0) th:eq(3)'),
      spec().$container.find('.ht_clone_top tr:eq(0) th:eq(4)'),
    ];

    await deselectCell();

    await keyDown('control/meta');
    await mouseDown(rowHeaders[0]);
    await mouseOver(rowHeaders[1]);
    await mouseUp(rowHeaders[1]);
    await mouseDown(rowHeaders[2]);
    await mouseOver(rowHeaders[2]);
    await mouseUp(rowHeaders[2]);
    await keyUp('control/meta');

    expect(getComputedStyle(mergedCell, ':before').backgroundColor).toEqual(selectedCellBackground);
    expect(getComputedStyle(mergedCell, ':before').opacity).toEqual(selectedCellOpacity);

    await deselectCell();

    await keyDown('control/meta');
    await mouseDown(columnHeaders[0]);
    await mouseOver(columnHeaders[1]);
    await mouseUp(columnHeaders[1]);
    await mouseDown(columnHeaders[2]);
    await mouseOver(columnHeaders[3]);
    await mouseUp(columnHeaders[3]);
    await keyUp('control/meta');

    expect(getComputedStyle(mergedCell, ':before').backgroundColor).toEqual(selectedCellBackground);
    expect(getComputedStyle(mergedCell, ':before').opacity).toEqual(selectedCellOpacity);
  });

  it('should make the entirely selected merged cells have the same background color as a regular selected area, when ' +
    'selecting entire columns or rows (when the merged cells was previously fully selected)', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
      mergeCells: [
        { row: 0, col: 0, rowspan: 3, colspan: 3 }
      ],
      rowHeaders: true
    });

    // sample the double-selected background
    await selectCells([[5, 1, 5, 2], [5, 1, 5, 2]]);
    const selectedCell = getCell(5, 1);
    const selectedCellBackground = getComputedStyle(selectedCell, ':before').backgroundColor;
    const selectedCellOpacity = getComputedStyle(selectedCell, ':before').opacity;

    await selectColumns(0, 2);

    const mergedCell = getCell(0, 0);
    const firstRowHeader = getCell(0, -1, true);
    const thirdRowHeader = getCell(2, -1, true);

    await keyDown('control/meta');

    await mouseDown(firstRowHeader);
    await mouseOver(thirdRowHeader);
    await mouseUp(thirdRowHeader);

    await keyUp('control/meta');

    expect(getComputedStyle(mergedCell, ':before').backgroundColor).toEqual(selectedCellBackground);
    expect(getComputedStyle(mergedCell, ':before').opacity).toEqual(selectedCellOpacity);
  });

  it('should keep headers\' selection after merging', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      colHeaders: true,
      rowHeaders: true,
      mergeCells: true,
      contextMenu: true,
    });

    await selectColumns(0, 2);
    await contextMenu();
    await selectContextMenuOption('Merge cells');

    expect(getSelected()).toEqual([[-1, 0, 4, 2]]);
    expect(`
    |   ║ * : * : * :   :   |
    |===:===:===:===:===:===|
    | - ║ A         :   :   |
    | - ║           :   :   |
    | - ║           :   :   |
    | - ║           :   :   |
    | - ║           :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should keep the selection on merged cells after inserting row above merged cells', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 }
      ],
    });

    await selectCell(1, 1);

    const $borderTop = spec().$container.find('.wtBorder.current').eq(1);
    const topPositionBefore = $borderTop.position().top;

    await alter('insert_row_above', 1);

    expect(getSelected()).toEqual([[2, 1, 3, 2]]);
    expect($borderTop.position().top).forThemes(({ classic, main, horizon }) => {
      classic.toBe(topPositionBefore + 23); // adds default row height
      main.toBe(topPositionBefore + 29);
      horizon.toBe(topPositionBefore + 37);
    });
  });

  it('should keep the selection on merged cells after inserting column to left to the merged cells', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 }
      ],
    });

    await selectCell(1, 1);

    const $borderLeft = spec().$container.find('.wtBorder.current').eq(1);
    const leftPositionBefore = $borderLeft.position().left;

    await alter('insert_col_start', 1);

    expect(getSelected()).toEqual([[1, 2, 2, 3]]);

    expect($borderLeft.position().left).toBe(leftPositionBefore + 50);
  });

  it('should correctly indicate that the selected merged cell is not multiple selection', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      colHeaders: true,
      rowHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 }
      ]
    });

    await selectCell(1, 1, 2, 2);

    expect(selection().isMultiple()).toBe(false);
    expect(`
      |   ║   : - : - :   :   |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | - ║   : #     :   :   |
      | - ║   :       :   :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await selectCell(2, 2, 1, 1);

    expect(selection().isMultiple()).toBe(false);
    expect(`
      |   ║   : - : - :   :   |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | - ║   : #     :   :   |
      | - ║   :       :   :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should correctly select the neighboring merged cells', async() => {
    handsontable({
      data: createSpreadsheetData(5, 8),
      colHeaders: true,
      rowHeaders: true,
      mergeCells: [
        { row: 1, col: 3, rowspan: 1, colspan: 3 },
        { row: 2, col: 1, rowspan: 2, colspan: 4 },
        { row: 2, col: 5, rowspan: 2, colspan: 2 },
      ]
    });

    await selectCell(1, 2, 2, 2);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,1 to: 3,6']);
    expect(`
      |   ║   : - : - : - : - : - : - :   |
      |===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   |
      | - ║   : 0 : A : 0         : 0 :   |
      | - ║   : 0             : 0     :   |
      | - ║   :                       :   |
      |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should keep the highlight (area selection) on the virtualized merged cell after horizontal scroll', async() => {
    handsontable({
      data: createSpreadsheetData(3, 30),
      width: 200,
      height: 200,
      viewportColumnRenderingOffset: 0,
      mergeCells: {
        virtualized: true,
      },
    });

    getPlugin('mergeCells').merge(0, 0, 0, 20);

    await selectCells([[1, 20, 0, 0]]);

    expect(`
      | 0             |
      | 0 : 0 : 0 : A |
      |   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 0, col: 22 }); // the merged cell is partially visible

    expect(`
      | 0     :   :   |
      | 0 : A :   :   |
      |   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('classic')('should keep the highlight (area selection) on the virtualized merged cell ' +
    'after vertical scroll', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
      viewportRowRenderingOffset: 0,
      mergeCells: {
        virtualized: true,
      },
    });

    getPlugin('mergeCells').merge(0, 0, 20, 0);

    await selectCells([[20, 1, 0, 0]]);

    expect(`
      | 0 : 0 :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 24, col: 0 }); // the merged cell is partially visible

    expect(`
      | 0 : 0 :   :   :   :   |
      |   : A :   :   :   :   |
      |   :   :   :   :   :   |
      |   :   :   :   :   :   |
      |   :   :   :   :   :   |
      |   :   :   :   :   :   |
      |   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('main')('should keep the highlight (area selection) on the virtualized merged cell ' +
    'after vertical scroll', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 248, // TODO: needs to be very specific to work, worth investigating if correct
      viewportRowRenderingOffset: 0,
      mergeCells: {
        virtualized: true,
      },
    });

    getPlugin('mergeCells').merge(0, 0, 20, 0);

    await selectCells([[20, 1, 0, 0]]);

    expect(`
      | 0 : 0 :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 24, col: 0 }); // the merged cell is partially visible

    expect(`
      | 0 : 0 :   :   :   :   |
      |   : A :   :   :   :   |
      |   :   :   :   :   :   |
      |   :   :   :   :   :   |
      |   :   :   :   :   :   |
      |   :   :   :   :   :   |
      |   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('horizon')('should keep the highlight (area selection) on the virtualized merged cell ' +
    'after vertical scroll', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 312, // TODO: needs to be very specific to work, worth investigating if correct
      viewportRowRenderingOffset: 0,
      mergeCells: {
        virtualized: true,
      },
    });

    getPlugin('mergeCells').merge(0, 0, 20, 0);

    await selectCells([[20, 1, 0, 0]]);

    expect(`
      | 0 : 0 :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 24, col: 0 }); // the merged cell is partially visible

    expect(`
      | 0 : 0 :   :   :   :   |
      |   : A :   :   :   :   |
      |   :   :   :   :   :   |
      |   :   :   :   :   :   |
      |   :   :   :   :   :   |
      |   :   :   :   :   :   |
      |   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should keep focus selection on the wide virtualized merged cell that intersects the left overlay', async() => {
    handsontable({
      data: createSpreadsheetData(3, 30),
      width: 200,
      height: 200,
      viewportColumnRenderingOffset: 1,
      fixedColumnsStart: 2,
      mergeCells: {
        virtualized: true,
      },
    });

    getPlugin('mergeCells').merge(0, 0, 0, 20);

    await selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('A1');
    expect(getInlineStartClone().find('tr:first td.current:first:visible').text()).toBe('A1');
    expect(`
      | #             |
      |   :   |   :   |
      |   :   |   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 0, col: 22 }); // the merged cell is partially visible

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('X1');
    expect(getInlineStartClone().find('tr:first td.current:first:visible').text()).toBe('A1');
    expect(`
      | # :   |   :   |
      |   :   |   :   |
      |   :   |   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 0, col: 25 }); // the merged cell is not visible (out of the viewport)

    expect(getHtCore().find('tr:first td:first').text()).toBe('X1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('AA1');
    expect(getInlineStartClone().find('tr:first td.current:first:visible').text()).toBe('A1');
    expect(`
      |   :   |   :   |
      |   :   |   :   |
      |   :   |   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should keep area selection on the wide virtualized merged cell that intersects the left overlay', async() => {
    handsontable({
      data: createSpreadsheetData(3, 30),
      width: 200,
      height: 200,
      viewportColumnRenderingOffset: 1,
      fixedColumnsStart: 2,
      mergeCells: {
        virtualized: true,
      },
    });

    getPlugin('mergeCells').merge(0, 0, 0, 20);

    await selectCell(1, 0, 0, 0);

    expect(getInlineStartClone().find('tr:first td.area.fullySelectedMergedCell-0:first:visible').text()).toBe('A1');

    await scrollViewportTo({ row: 0, col: 22 }); // the merged cell is partially visible

    expect(getInlineStartClone().find('tr:first td.area.fullySelectedMergedCell-0:first:visible').text()).toBe('A1');

    await scrollViewportTo({ row: 0, col: 25 }); // the merged cell is not visible (out of the viewport)

    expect(getInlineStartClone().find('tr:first td.area.fullySelectedMergedCell-0:first:visible').text()).toBe('A1');
  });

  it.forTheme('classic')('should keep focus selection on the high virtualized merged cell that ' +
    'intersects the top overlay', async() => {
    handsontable({
      data: createSpreadsheetData(30, 3),
      width: 200,
      height: 200,
      viewportRowRenderingOffset: 1,
      fixedRowsTop: 2,
      mergeCells: {
        virtualized: true,
      },
    });

    getPlugin('mergeCells').merge(0, 0, 20, 0);

    await selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A1');
    expect(getTopClone().find('tr:first td.current:first:visible').text()).toBe('A1');
    expect(`
      | # :   :   |
      |   :   :   |
      |---:---:---|
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 25, col: 0 }); // the merged cell is partially visible

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A28');
    expect(getTopClone().find('tr:first td.current:first:visible').text()).toBe('A1');
    expect(`
      | # :   :   |
      |   :   :   |
      |---:---:---|
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 29, col: 0 }); // the merged cell is not visible (out of the viewport)

    expect(getHtCore().find('tr:first td:first').text()).toBe('A24');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A30');
    expect(getTopClone().find('tr:first td.current:first:visible').text()).toBe('A1');
    expect(`
      |   :   :   |
      |   :   :   |
      |---:---:---|
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('main')('should keep focus selection on the high virtualized merged cell that ' +
    'intersects the top overlay', async() => {
    // TODO: The test is tightly bound to this specific table height. Probably worth looking into it.
    handsontable({
      data: createSpreadsheetData(30, 3),
      width: 200,
      height: 248,
      viewportRowRenderingOffset: 1,
      fixedRowsTop: 2,
      mergeCells: {
        virtualized: true,
      },
    });

    getPlugin('mergeCells').merge(0, 0, 20, 0);

    await selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A1');
    expect(getTopClone().find('tr:first td.current:first:visible').text()).toBe('A1');
    expect(`
      | # :   :   |
      |   :   :   |
      |---:---:---|
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 25, col: 0 }); // the merged cell is partially visible

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A28');
    expect(getTopClone().find('tr:first td.current:first:visible').text()).toBe('A1');
    expect(`
      | # :   :   |
      |   :   :   |
      |---:---:---|
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 29, col: 0 }); // the merged cell is not visible (out of the viewport)

    expect(getHtCore().find('tr:first td:first').text()).toBe('A24');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A30');
    expect(getTopClone().find('tr:first td.current:first:visible').text()).toBe('A1');
    expect(`
      |   :   :   |
      |   :   :   |
      |---:---:---|
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('horizon')('should keep focus selection on the high virtualized merged cell that ' +
    'intersects the top overlay', async() => {
    // TODO: The test is tightly bound to this specific table height. Probably worth looking into it.
    handsontable({
      data: createSpreadsheetData(30, 3),
      width: 200,
      height: 313,
      viewportRowRenderingOffset: 1,
      fixedRowsTop: 2,
      mergeCells: {
        virtualized: true,
      },
    });

    getPlugin('mergeCells').merge(0, 0, 20, 0);

    await selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A1');
    expect(getTopClone().find('tr:first td.current:first:visible').text()).toBe('A1');
    expect(`
      | # :   :   |
      |   :   :   |
      |---:---:---|
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 25, col: 0 }); // the merged cell is partially visible

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A28');
    expect(getTopClone().find('tr:first td.current:first:visible').text()).toBe('A1');
    expect(`
      | # :   :   |
      |   :   :   |
      |---:---:---|
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 29, col: 0 }); // the merged cell is not visible (out of the viewport)

    expect(getHtCore().find('tr:first td:first').text()).toBe('A24');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A30');
    expect(getTopClone().find('tr:first td.current:first:visible').text()).toBe('A1');
    expect(`
      |   :   :   |
      |   :   :   |
      |---:---:---|
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should keep area selection on the high virtualized merged cell that intersects the top overlay', async() => {
    handsontable({
      data: createSpreadsheetData(30, 3),
      width: 200,
      height: 200,
      viewportRowRenderingOffset: 1,
      fixedRowsTop: 2,
      mergeCells: {
        virtualized: true,
      },
    });

    getPlugin('mergeCells').merge(0, 0, 20, 0);

    await selectCell(0, 1, 0, 0);

    expect(getTopClone().find('tr:first td.area.fullySelectedMergedCell-0:first:visible').text()).toBe('A1');

    await scrollViewportTo({ row: 25, col: 0 }); // the merged cell is partially visible

    expect(getTopClone().find('tr:first td.area.fullySelectedMergedCell-0:first:visible').text()).toBe('A1');

    await scrollViewportTo({ row: 29, col: 0 }); // the merged cell is not visible (out of the viewport)

    expect(getTopClone().find('tr:first td.area.fullySelectedMergedCell-0:first:visible').text()).toBe('A1');
  });
});
