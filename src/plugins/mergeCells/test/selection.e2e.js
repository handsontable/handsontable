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

  it('should leave the partially selected merged cells white (or any initial color), when selecting entire columns or rows', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
      mergeCells: [
        { row: 0, col: 0, rowspan: 3, colspan: 3 }
      ]
    });

    selectColumns(0, 1);

    const mergedCell = getCell(0, 0);

    expect(getComputedStyle(mergedCell, ':before').opacity).toEqual('0');

    selectRows(0, 1);

    expect(getComputedStyle(mergedCell, ':before').opacity).toEqual('0');
  });

  it('should leave the partially selected merged cells with their initial color, when selecting entire columns or rows ' +
    '(when the merged cells was previously fully selected)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
      mergeCells: [
        { row: 0, col: 0, rowspan: 3, colspan: 3 }
      ],
      rowHeaders: true
    });

    selectColumns(0, 2);

    const mergedCell = getCell(0, 0);
    const selectedCellBackground = getComputedStyle(mergedCell, ':before').backgroundColor;
    const selectedCellOpacity = getComputedStyle(mergedCell, ':before').opacity;
    const firstRowHeader = getCell(0, -1, true);

    keyDown('ctrl');

    $(firstRowHeader).simulate('mousedown');
    $(firstRowHeader).simulate('mouseup');

    expect(getComputedStyle(mergedCell, ':before').backgroundColor).toEqual(selectedCellBackground);
    expect(getComputedStyle(mergedCell, ':before').opacity).toEqual(selectedCellOpacity);
  });

  it('should make the entirely selected merged cells have the same background color as a regular selected area, when ' +
    'selecting entire columns or rows', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 6),
      mergeCells: [
        { row: 0, col: 0, rowspan: 3, colspan: 3 }
      ]
    });

    selectCell(4, 4, 5, 5);

    const selectedCell = getCell(4, 4);
    const selectedCellBackground = getComputedStyle(selectedCell, ':before').backgroundColor;
    const selectedCellOpacity = getComputedStyle(selectedCell, ':before').opacity;

    selectColumns(0, 2);

    const mergedCell = getCell(0, 0);

    expect(getComputedStyle(mergedCell, ':before').backgroundColor).toEqual(selectedCellBackground);
    expect(getComputedStyle(mergedCell, ':before').opacity).toEqual(selectedCellOpacity);

    selectRows(0, 2);

    expect(getComputedStyle(mergedCell, ':before').backgroundColor).toEqual(selectedCellBackground);
    expect(getComputedStyle(mergedCell, ':before').opacity).toEqual(selectedCellOpacity);
  });

  it('should make the entirely selected merged cells have the same background color as a regular selected area, when ' +
    'selecting entire columns or rows (using multiple selection layers)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
      mergeCells: [
        { row: 0, col: 0, rowspan: 3, colspan: 3 }
      ],
      rowHeaders: true,
      colHeaders: true
    });

    // sample the selected background
    selectCells([[5, 1, 5, 2]]);
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

    deselectCell();

    keyDown('ctrl');
    $(rowHeaders[0]).simulate('mousedown');
    $(rowHeaders[1]).simulate('mouseover');
    $(rowHeaders[1]).simulate('mouseup');
    $(rowHeaders[2]).simulate('mousedown');
    $(rowHeaders[2]).simulate('mouseover');
    $(rowHeaders[2]).simulate('mouseup');
    keyUp('ctrl');

    expect(getComputedStyle(mergedCell, ':before').backgroundColor).toEqual(selectedCellBackground);
    expect(getComputedStyle(mergedCell, ':before').opacity).toEqual(selectedCellOpacity);

    deselectCell();

    keyDown('ctrl');
    $(columnHeaders[0]).simulate('mousedown');
    $(columnHeaders[1]).simulate('mouseover');
    $(columnHeaders[1]).simulate('mouseup');
    $(columnHeaders[2]).simulate('mousedown');
    $(columnHeaders[3]).simulate('mouseover');
    $(columnHeaders[3]).simulate('mouseup');
    keyUp('ctrl');

    expect(getComputedStyle(mergedCell, ':before').backgroundColor).toEqual(selectedCellBackground);
    expect(getComputedStyle(mergedCell, ':before').opacity).toEqual(selectedCellOpacity);
  });

  it('should make the entirely selected merged cells have the same background color as a regular selected area, when ' +
    'selecting entire columns or rows (when the merged cells was previously fully selected)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
      mergeCells: [
        { row: 0, col: 0, rowspan: 3, colspan: 3 }
      ],
      rowHeaders: true
    });

    // sample the double-selected background
    selectCells([[5, 1, 5, 2], [5, 1, 5, 2]]);
    const selectedCell = getCell(5, 1);
    const selectedCellBackground = getComputedStyle(selectedCell, ':before').backgroundColor;
    const selectedCellOpacity = getComputedStyle(selectedCell, ':before').opacity;

    selectColumns(0, 2);

    const mergedCell = getCell(0, 0);
    const firstRowHeader = getCell(0, -1, true);
    const thirdRowHeader = getCell(2, -1, true);

    keyDown('ctrl');

    $(firstRowHeader).simulate('mousedown');
    $(thirdRowHeader).simulate('mouseover');
    $(thirdRowHeader).simulate('mouseup');

    expect(getComputedStyle(mergedCell, ':before').backgroundColor).toEqual(selectedCellBackground);
    expect(getComputedStyle(mergedCell, ':before').opacity).toEqual(selectedCellOpacity);
  });

  it('should keep headers\' selection after toggleMergeOnSelection call', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      colHeaders: true,
      rowHeaders: true,
      mergeCells: true,
    });

    selectColumns(0, 2);
    getPlugin('mergeCells').toggleMergeOnSelection();

    expect(getSelected()).toEqual([[-1, 0, 4, 2]]);
    expect(`
    |   ║ * : * : * :   :   |
    |===:===:===:===:===:===|
    | - ║ A :   :   :   :   |
    | - ║   :   :   :   :   |
    | - ║   :   :   :   :   |
    | - ║   :   :   :   :   |
    | - ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should keep the selection on merged cells after inserting row above merged cells', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 }
      ],
    });

    selectCell(1, 1);

    const $borderTop = spec().$container.find('.wtBorder.current').eq(1);
    const topPositionBefore = $borderTop.position().top;

    alter('insert_row', 1);

    expect(getSelected()).toEqual([[2, 1, 3, 2]]);
    expect($borderTop.position().top).toBe(topPositionBefore + 23); // adds default row height
  });

  it('should keep the selection on merged cells after inserting column to left to the merged cells', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 }
      ],
    });

    selectCell(1, 1);

    const $borderLeft = spec().$container.find('.wtBorder.current').eq(1);
    const leftPositionBefore = $borderLeft.position().left;

    alter('insert_col', 1);

    expect(getSelected()).toEqual([[1, 2, 2, 3]]);

    expect($borderLeft.position().left).toBe(leftPositionBefore + 50);
  });
});
