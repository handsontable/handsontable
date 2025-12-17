describe('AutoFill', () => {
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

  it('should appear when fillHandle equals true', async() => {
    handsontable({
      fillHandle: true
    });

    await selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should not appear when fillHandle equals false', async() => {
    handsontable({
      fillHandle: false
    });
    await selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(false);
  });

  it('should appear when fillHandle is enabled as `object` value', async() => {
    handsontable({
      fillHandle: {
        allowInsertRow: true
      }
    });

    await selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should appear when fillHandle is enabled as `string` value', async() => {
    handsontable({
      fillHandle: 'horizontal'
    });

    await selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should render selection borders with set proper z-indexes', async() => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true
    });

    await selectCell(1, 1, 2, 2);

    expect(getComputedStyle(hot.rootElement.querySelector('.ht_master .htBorders .current')).zIndex)
      .toBe('10');
    expect(getComputedStyle(hot.rootElement.querySelector('.ht_master .htBorders .area')).zIndex)
      .toBe('8');
    expect(getComputedStyle(hot.rootElement.querySelector('.ht_master .htBorders .fill')).zIndex)
      .toBe('6');
  });

  it('should fill the cells when dragging the handle triggered by row header selection', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: true,
    });

    await selectRows(1);

    simulateFillHandleDrag(getCell(3, 5));

    expect(getData()).toEqual([
      [1, 2, 3, 4, 5, 6],
      [7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3],
    ]);
    expect(getSelected()).toEqual([[1, 0, 3, 5]]);
  });

  it('should fill the cells when dragging the handle triggered by column header selection', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: true,
    });

    await selectColumns(1);

    simulateFillHandleDrag(getCell(3, 5));

    expect(getData()).toEqual([
      [1, 2, 2, 2, 2, 2],
      [7, 8, 8, 8, 8, 8],
      [4, 5, 5, 5, 5, 5],
      [1, 2, 2, 2, 2, 2]
    ]);
    expect(getSelected()).toEqual([[0, 1, 3, 5]]);
  });

  it('should not change cell value (drag when fillHandle is set to `false`)', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: false
    });

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(1, 0));

    expect(getDataAtCell(1, 0)).toEqual(7);

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(0, 1));

    expect(getDataAtCell(0, 1)).toEqual(2);
  });

  it('should disappear when editor is opened', async() => {
    handsontable({
      fillHandle: true
    });

    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(isFillHandleVisible()).toBe(false);
  });

  it('should appear when editor is closed', async() => {
    handsontable({
      fillHandle: true
    });

    await selectCell(2, 2);
    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should not appear when fillHandle equals false and editor is opened', async() => {
    handsontable({
      fillHandle: false
    });

    await selectCell(2, 2);
    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(isFillHandleVisible()).toBe(false);
  });

  it('should appear when editor is discarded using the ESC key', async() => {
    handsontable({
      fillHandle: true
    });

    await selectCell(2, 2);
    await keyDownUp('enter');
    await keyDownUp('escape');

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should use correct cell coordinates also when Handsontable is used inside a TABLE (#355)', async() => {
    const $table = $('<table><tr><td></td></tr></table>').appendTo('body');

    spec().$container.appendTo($table.find('td'));

    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill(selectionData) {
        selectionData[0][0] = 'test';
      }
    });
    await selectCell(1, 1);

    simulateFillHandleDrag(getCell(2, 1));

    expect(getSelected()).toEqual([[1, 1, 2, 1]]);
    expect(getDataAtCell(2, 1)).toEqual('test');

    document.body.removeChild($table[0]);
  });

  it('should fill empty cells below until the end of content in the neighboring column with current cell\'s data', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, null, null, null, null],
        [1, 2, null, null, null, null]
      ]
    });

    await selectCell(1, 3);

    const fillHandle = spec().$container.find('.wtBorder.current.corner')[0];

    await mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 3)).toEqual(null);
    expect(getDataAtCell(3, 3)).toEqual(null);

    await selectCell(1, 2);
    await mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 2)).toEqual(3);
    expect(getDataAtCell(3, 2)).toEqual(3);
  });

  // https://github.com/handsontable/dev-handsontable/issues/1757
  it('should fill empty cells below until the end of content in the neighboring column with current cell\'s data' +
    'and NOT treat cells filled with 0s as empty', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 0, 4, 5, 6],
        [1, 2, 0, null, null, null],
        [1, 2, 0, null, null, null],
        [1, 2, null, null, null, null]
      ]
    });

    await selectCell(0, 2);

    const fillHandle = spec().$container.find('.wtBorder.current.corner')[0];

    await mouseDoubleClick(fillHandle);

    expect(getDataAtCell(1, 2)).toEqual(0);
    expect(getDataAtCell(2, 2)).toEqual(0);
    expect(getDataAtCell(3, 2)).toEqual(0);
    expect(getDataAtCell(4, 2)).toEqual(null);

    await selectCell(1, 3);
    await mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 3)).toEqual(4);
    expect(getDataAtCell(3, 3)).toEqual(4);
    expect(getDataAtCell(4, 3)).toEqual(null);
  });

  it('should fill cells below until the end of content in the neighboring column with the currently selected area\'s data', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, null, null, null, null],
        [1, 2, null, null, null, null]
      ]
    });

    await selectCell(1, 3, 1, 4);

    const fillHandle = spec().$container.find('.wtBorder.area.corner')[0];

    await mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 3)).toEqual(null);
    expect(getDataAtCell(3, 3)).toEqual(null);
    expect(getDataAtCell(2, 4)).toEqual(null);
    expect(getDataAtCell(3, 4)).toEqual(null);

    await selectCell(1, 2, 1, 3);
    await mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 2)).toEqual(3);
    expect(getDataAtCell(3, 2)).toEqual(3);
    expect(getDataAtCell(2, 3)).toEqual(4);
    expect(getDataAtCell(3, 3)).toEqual(4);
  });

  it('shouldn\'t fill cells left #5023', async() => {
    handsontable({
      data: [
        ['1', '2', '', '3', '4'],
        ['1', '', '', '', ''],
        ['1', '', '', '', ''],
        ['', '', '', '', ''],
        ['', '', '', '', '']
      ]
    });

    await selectCell(0, 3);
    const fillHandle = spec().$container.find('.wtBorder.current.corner')[0];

    await mouseDoubleClick(fillHandle);

    expect(getDataAtCell(0, 3)).toEqual('3');
    expect(getDataAtCell(0, 2)).toEqual('');
    expect(getDataAtCell(0, 1)).toEqual('2');
    expect(getDataAtCell(0, 0)).toEqual('1');
  });

  it('should fill cells when dragging the handle to the headers', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 7, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      colHeaders: true,
      rowHeaders: true
    });

    // col headers:

    await selectCell(2, 2);

    simulateFillHandleDrag(getCell(-1, 2));

    expect(getDataAtCell(1, 2)).toEqual(7);
    expect(getDataAtCell(0, 2)).toEqual(7);

    await selectCell(2, 2);

    simulateFillHandleDrag(getCell(2, -1));

    expect(getDataAtCell(2, 1)).toEqual(7);
    expect(getDataAtCell(2, 0)).toEqual(7);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle upwards (selection from left to right)', async() => {
    handsontable({
      data: [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, 2, 3, null],
        [null, 1, 4, null],
        [null, 0, 5, null],
        [null, null, null, null],
      ]
    });

    await selectCell(4, 1, 6, 2);

    simulateFillHandleDrag(getCell(0, 2));

    expect(getData()).toEqual([
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, null, null, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle upwards (selection from right to left)', async() => {
    handsontable({
      data: [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, 2, 3, null],
        [null, 1, 4, null],
        [null, 0, 5, null],
        [null, null, null, null],
      ]
    });

    await selectCell(6, 2, 4, 1);

    simulateFillHandleDrag(getCell(0, 2));

    expect(getData()).toEqual([
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, null, null, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle downward (selection from left to right)', async() => {
    handsontable({
      data: [
        [null, null, null, null],
        [null, 2, 3, null],
        [null, 1, 4, null],
        [null, 0, 5, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]
    });

    await selectCell(1, 1, 3, 2);

    simulateFillHandleDrag(getCell(7, 2));

    expect(getData()).toEqual([
      [null, null, null, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle downward (selection from right to left)', async() => {
    handsontable({
      data: [
        [null, null, null, null],
        [null, 2, 3, null],
        [null, 1, 4, null],
        [null, 0, 5, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]
    });

    await selectCell(3, 2, 1, 1);

    simulateFillHandleDrag(getCell(7, 2));

    expect(getData()).toEqual([
      [null, null, null, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle towards left (selection from left to right)', async() => {
    handsontable({
      data: [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, 0, 1, 2, null],
        [null, null, null, null, 3, 4, 5, null],
        [null, null, null, null, null, null, null, null],
      ]
    });

    await selectCell(1, 4, 2, 6);

    simulateFillHandleDrag(getCell(2, 0));

    expect(getData()).toEqual([
      [null, null, null, null, null, null, null, null],
      [2, 0, 1, 2, 0, 1, 2, null],
      [5, 3, 4, 5, 3, 4, 5, null],
      [null, null, null, null, null, null, null, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle towards left (selection from right to left)', async() => {
    handsontable({
      data: [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, 0, 1, 2, null],
        [null, null, null, null, 3, 4, 5, null],
        [null, null, null, null, null, null, null, null],
      ]
    });

    await selectCell(2, 6, 1, 4);

    simulateFillHandleDrag(getCell(2, 0));

    expect(getData()).toEqual([
      [null, null, null, null, null, null, null, null],
      [2, 0, 1, 2, 0, 1, 2, null],
      [5, 3, 4, 5, 3, 4, 5, null],
      [null, null, null, null, null, null, null, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle towards right (selection from left to right)', async() => {
    handsontable({
      data: [
        [null, null, null, null, null, null, null, null],
        [null, 0, 1, 2, null, null, null, null],
        [null, 3, 4, 5, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ]
    });

    await selectCell(1, 1, 2, 3);

    simulateFillHandleDrag(getCell(2, 7));

    expect(getData()).toEqual([
      [null, null, null, null, null, null, null, null],
      [null, 0, 1, 2, 0, 1, 2, 0],
      [null, 3, 4, 5, 3, 4, 5, 3],
      [null, null, null, null, null, null, null, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle towards right (selection from right to left)', async() => {
    handsontable({
      data: [
        [null, null, null, null, null, null, null, null],
        [null, 0, 1, 2, null, null, null, null],
        [null, 3, 4, 5, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ]
    });

    await selectCell(2, 3, 1, 1);

    simulateFillHandleDrag(getCell(2, 7));

    expect(getData()).toEqual([
      [null, null, null, null, null, null, null, null],
      [null, 0, 1, 2, 0, 1, 2, 0],
      [null, 3, 4, 5, 3, 4, 5, 3],
      [null, null, null, null, null, null, null, null],
    ]);
  });

  it('should omit data propagation for hidden cells - fill vertically (option `copyPasteEnabled` set to `false` for the both plugins)', async() => {
    handsontable({
      data: [
        [0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [2, 2, null, null, null, null],
        [3, 3, null, null, null, null]
      ],
      hiddenColumns: {
        copyPasteEnabled: false,
        indicators: true,
        columns: [1]
      },
      hiddenRows: {
        copyPasteEnabled: false,
        rows: [1],
        indicators: true
      },
    });

    await selectCell(0, 0, 0, 2);

    simulateFillHandleDrag(getCell(2, 2, true));

    expect(getDataAtCell(0, 0)).toEqual(0);
    expect(getDataAtCell(0, 1)).toEqual(0);
    expect(getDataAtCell(0, 2)).toEqual(0);

    expect(getDataAtCell(1, 0)).toEqual(1); // Hidden row, no real change.
    expect(getDataAtCell(1, 1)).toEqual(1); // Hidden column and row, no real change.
    expect(getDataAtCell(1, 2)).toEqual(1); // Hidden row, no real change.

    expect(getDataAtCell(2, 0)).toEqual(0);
    expect(getDataAtCell(2, 1)).toEqual(2); // Hidden column, no real change.
    expect(getDataAtCell(2, 2)).toEqual(0);

    expect(getData()).toEqual([
      [0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1],
      [0, 2, 0, null, null, null],
      [3, 3, null, null, null, null]
    ]); // Extra test for checking wrong data propagation.
  });

  it('should propagate data for hidden cells - fill vertically (option `copyPasteEnabled` set to `true` for the both plugins)', async() => {
    handsontable({
      data: [
        [0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [2, 2, null, null, null, null],
        [3, 3, null, null, null, null]
      ],
      hiddenColumns: {
        copyPasteEnabled: true,
        indicators: true,
        columns: [1]
      },
      hiddenRows: {
        copyPasteEnabled: true,
        rows: [1],
        indicators: true
      },
    });

    await selectCell(0, 0, 0, 2);

    simulateFillHandleDrag(getCell(2, 2, true));

    expect(getDataAtCell(0, 0)).toEqual(0);
    expect(getDataAtCell(0, 1)).toEqual(0);
    expect(getDataAtCell(0, 2)).toEqual(0);

    expect(getDataAtCell(1, 0)).toEqual(0); // Hidden row, there was change.
    expect(getDataAtCell(1, 1)).toEqual(0); // Hidden column and row, there was change.
    expect(getDataAtCell(1, 2)).toEqual(0); // Hidden row, there was change.

    expect(getDataAtCell(2, 0)).toEqual(0);
    expect(getDataAtCell(2, 1)).toEqual(0); // Hidden column, there was change.
    expect(getDataAtCell(2, 2)).toEqual(0);

    expect(getData()).toEqual([
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1],
      [0, 0, 0, null, null, null],
      [3, 3, null, null, null, null]
    ]); // Extra test for checking wrong data propagation.
  });

  it('should omit data propagation for hidden cells - fill horizontally (option `copyPasteEnabled` set to `false` for the both plugins)', async() => {
    handsontable({
      data: [
        [0, 1, 2, 3, 4, 5],
        [0, 1, 2, 3, 4, 5],
        [0, 1, null, null, null, null],
        [0, 1, null, null, null, null]
      ],
      hiddenColumns: {
        copyPasteEnabled: false,
        indicators: true,
        columns: [1]
      },
      hiddenRows: {
        copyPasteEnabled: false,
        rows: [1],
        indicators: true
      },
    });

    await selectCell(0, 0, 2, 0);

    simulateFillHandleDrag(getCell(2, 2, true));

    expect(getDataAtCell(0, 0)).toEqual(0);
    expect(getDataAtCell(1, 0)).toEqual(0);
    expect(getDataAtCell(2, 0)).toEqual(0);

    expect(getDataAtCell(0, 1)).toEqual(1); // Hidden column, no real change.
    expect(getDataAtCell(1, 1)).toEqual(1); // Hidden column and row, no real change.
    expect(getDataAtCell(2, 1)).toEqual(1); // Hidden column, no real change.

    expect(getDataAtCell(0, 2)).toEqual(0);
    expect(getDataAtCell(1, 2)).toEqual(2); // Hidden row, no real change.
    expect(getDataAtCell(2, 2)).toEqual(0);

    expect(getData()).toEqual([
      [0, 1, 0, 3, 4, 5],
      [0, 1, 2, 3, 4, 5],
      [0, 1, 0, null, null, null],
      [0, 1, null, null, null, null]
    ]); // Extra test for checking wrong data propagation.
  });

  it('should propagate data for hidden cells - fill horizontally (option `copyPasteEnabled` set to `true` for the both plugins)', async() => {
    handsontable({
      data: [
        [0, 1, 2, 3, 4, 5],
        [0, 1, 2, 3, 4, 5],
        [0, 1, null, null, null, null],
        [0, 1, null, null, null, null]
      ],
      hiddenColumns: {
        copyPasteEnabled: true,
        indicators: true,
        columns: [1]
      },
      hiddenRows: {
        copyPasteEnabled: true,
        rows: [1],
        indicators: true
      },
    });

    await selectCell(0, 0, 2, 0);

    simulateFillHandleDrag(getCell(2, 2, true));

    expect(getDataAtCell(0, 0)).toEqual(0);
    expect(getDataAtCell(1, 0)).toEqual(0);
    expect(getDataAtCell(2, 0)).toEqual(0);

    expect(getDataAtCell(0, 1)).toEqual(0); // Hidden column, there was change.
    expect(getDataAtCell(1, 1)).toEqual(0); // Hidden column and row, there was change.
    expect(getDataAtCell(2, 1)).toEqual(0); // Hidden column, there was change.

    expect(getDataAtCell(0, 2)).toEqual(0);
    expect(getDataAtCell(1, 2)).toEqual(0); // Hidden row, there was change.
    expect(getDataAtCell(2, 2)).toEqual(0);

    expect(getData()).toEqual([
      [0, 0, 0, 3, 4, 5],
      [0, 0, 0, 3, 4, 5],
      [0, 0, 0, null, null, null],
      [0, 1, null, null, null, null]
    ]); // Extra test for checking wrong data propagation.
  });

  it('should work properly when two instances are initialized with different fillHandle settings (#3257)', async() => {
    const $container2 = $(`<div id="${id}2"></div>`).appendTo('body');

    handsontable({
      data: createSpreadsheetData(3, 3),
      fillHandle: {
        autoInsertRow: false,
      },
    });

    const hot2 = $container2.handsontable({
      data: createSpreadsheetData(3, 3),
      fillHandle: {
        direction: 'horizontal',
      },
    }).handsontable('getInstance');

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(2, 0));

    expect(getData()).toEqual([
      ['A1', 'B1', 'C1'],
      ['A1', 'B2', 'C2'],
      ['A1', 'B3', 'C3'],
    ]);

    hot2.selectCell(0, 0);

    simulateFillHandleDrag(hot2.getCell(0, 2), { container: $container2 });

    expect(hot2.getData()).toEqual([
      ['A1', 'A1', 'A1'],
      ['A2', 'B2', 'C2'],
      ['A3', 'B3', 'C3'],
    ]);

    $container2.handsontable('destroy');
    $container2.remove();
  });

  it('should autofill the appropriate cells, when performing the action over date-typed cells', async() => {
    const errorSpy = jasmine.createSpyObj('error', ['test']);
    const prevError = window.onerror;

    handsontable({
      data: [
        ['', '03/05/2020'],
        ['', '27/03/2020'],
        ['', '29/08/2020']
      ],
      columns: [
        {},
        { type: 'date' }
      ]
    });

    window.onerror = errorSpy.test;

    await selectCell(0, 1);

    simulateFillHandleDrag(getCell(2, 1));

    await sleep(50);

    expect(errorSpy.test).not.toHaveBeenCalled();

    expect(getDataAtCell(1, 1)).toEqual('03/05/2020');
    expect(getDataAtCell(2, 1)).toEqual('03/05/2020');

    window.onerror = prevError;
  });

  describe('Using object-based cell content', () => {
    using('configuration object', [
      { coords: [[0, 1], [4, 1]] }, // Autofill downward
      { coords: [[4, 1], [0, 1]] }, // Autofill upward
    ], ({ coords }) => {

      it('should utilize the source data when filling object-based cells with object-based content (if the schema matches)', async() => {
        handsontable({
          data: [
            ['A1', { id: 1, value: 'A1' }, 'test'],
            ['A2', { id: 2, value: 'A2' }, 'test2'],
            ['A3', { id: 3, value: 'A3' }, 'test3'],
            ['A4', { id: 4, value: 'A4' }, 'test4'],
            ['A5', { id: 5, value: 'A5' }, 'test5'],
          ],
          columns: [
            {},
            {
              valueGetter: value => value?.value,
            },
            {},
          ],
        });

        const baseCellSource = getSourceDataAtCell(...coords[0]);
        const baseCellData = getDataAtCell(...coords[0]);

        await selectCell(...coords[0]);

        simulateFillHandleDrag(getCell(...coords[1], true));

        expect(getSourceDataAtCell(1, 1)).toEqual(baseCellSource);
        expect(getSourceDataAtCell(2, 1)).toEqual(baseCellSource);
        expect(getSourceDataAtCell(3, 1)).toEqual(baseCellSource);
        expect(getSourceDataAtCell(4, 1)).toEqual(baseCellSource);

        expect(getDataAtCell(1, 1)).toEqual(baseCellData);
        expect(getDataAtCell(2, 1)).toEqual(baseCellData);
        expect(getDataAtCell(3, 1)).toEqual(baseCellData);
        expect(getDataAtCell(4, 1)).toEqual(baseCellData);
      });

      it('should utilize the non-source data when filling text-based cells with object-based content', async() => {
        handsontable({
          data: [
            ['A1', 'xyz', 'test'],
            ['A2', 'xyz', 'test2'],
            ['A3', 'xyz', 'test3'],
            ['A4', 'xyz', 'test4'],
            ['A5', 'xyz', 'test5'],
          ],
        });

        await setSourceDataAtCell(coords[0][0], coords[0][1], { id: 1, value: 'A1' });
        await setCellMeta(coords[0][0], coords[0][1], 'valueGetter', value => value?.value);

        await render();

        await selectCell(...coords[0]);

        simulateFillHandleDrag(getCell(...coords[1], true));

        expect(getSourceDataAtCell(...coords[0])).toEqual({ id: 1, value: 'A1' });
        expect(getSourceDataAtCell(1, 1)).toEqual('A1');
        expect(getSourceDataAtCell(2, 1)).toEqual('A1');
        expect(getSourceDataAtCell(3, 1)).toEqual('A1');
        expect(getSourceDataAtCell(...coords[1])).toEqual('A1');

        expect(getDataAtCell(...coords[0])).toEqual('A1');
        expect(getDataAtCell(1, 1)).toEqual('A1');
        expect(getDataAtCell(2, 1)).toEqual('A1');
        expect(getDataAtCell(3, 1)).toEqual('A1');
        expect(getDataAtCell(...coords[1])).toEqual('A1');
      });

      it('should not perform autofill when filling object-based cells with object-based content (if the schema does not match)', async() => {
        handsontable({
          data: [
            ['A1', { a: 1, b: 2 }, 'test'],
            ['A2', { a: 2, b: 3 }, 'test2'],
            ['A3', { a: 3, b: 4 }, 'test3'],
            ['A4', { a: 4, b: 5 }, 'test4'],
            ['A5', { a: 5, b: 6 }, 'test5'],
          ],
          valueGetter: value => value?.a,
        });

        const sourceDataAtTarget = getSourceDataAtCell(...coords[1]);
        const dataAtTarget = getDataAtCell(...coords[1]);

        await setSourceDataAtCell(coords[0][0], coords[0][1], { id: 1, value: 'A1' });
        await setCellMeta(coords[0][0], coords[0][1], 'valueGetter', value => value?.value);

        await render();

        await selectCell(...coords[0]);

        simulateFillHandleDrag(getCell(...coords[1], true));

        expect(getSourceDataAtCell(...coords[0])).toEqual({ id: 1, value: 'A1' });
        expect(getSourceDataAtCell(1, 1)).toEqual({ a: 2, b: 3 });
        expect(getSourceDataAtCell(2, 1)).toEqual({ a: 3, b: 4 });
        expect(getSourceDataAtCell(3, 1)).toEqual({ a: 4, b: 5 });
        expect(getSourceDataAtCell(...coords[1])).toEqual(sourceDataAtTarget);

        expect(getDataAtCell(...coords[0])).toEqual('A1');
        expect(getDataAtCell(1, 1)).toEqual(2);
        expect(getDataAtCell(2, 1)).toEqual(3);
        expect(getDataAtCell(3, 1)).toEqual(4);
        expect(getDataAtCell(...coords[1])).toEqual(dataAtTarget);
      });

      it('should utilize the source data when filling mixed-typed cells with mixed-typed content (schema of the object-based content matches the schema of the target cell)', async() => {
        handsontable({
          data: [
            ['A1', { id: 1, value: 'A1' }, 'test'],
            ['A2', { id: 2, value: 'A2' }, 'test2'],
            ['A3', { id: 3, value: 'A3' }, 'test3'],
            ['A4', { id: 4, value: 'A4' }, 'test4'],
            ['A5', { id: 5, value: 'A5' }, 'test5'],
          ],
          columns: [
            {},
            {
              valueGetter: value => value?.value,
            },
            {},
          ],
        });

        const sourceDataAtBaseRow = getSourceDataAtRow(coords[0][0]);
        const dataAtBaseRow = getDataAtRow(coords[0][0]);

        await selectCells([[coords[0][0], 0, coords[0][0], 2]]);

        simulateFillHandleDrag(getCell(coords[1][0], 2, true));

        expect(getSourceDataAtRow(0)).toEqual(sourceDataAtBaseRow);
        expect(getSourceDataAtRow(1)).toEqual(sourceDataAtBaseRow);
        expect(getSourceDataAtRow(2)).toEqual(sourceDataAtBaseRow);
        expect(getSourceDataAtRow(3)).toEqual(sourceDataAtBaseRow);
        expect(getSourceDataAtRow(4)).toEqual(sourceDataAtBaseRow);

        expect(getDataAtRow(0)).toEqual(dataAtBaseRow);
        expect(getDataAtRow(1)).toEqual(dataAtBaseRow);
        expect(getDataAtRow(2)).toEqual(dataAtBaseRow);
        expect(getDataAtRow(3)).toEqual(dataAtBaseRow);
        expect(getDataAtRow(4)).toEqual(dataAtBaseRow);
      });
    });

    using('configuration object', [
      { coords: [[1, 0], [1, 2]] }, // Autofill right
      { coords: [[1, 2], [1, 0]] }, // Autofill left
    ], ({ coords }) => {
      it('should utilize the source data when filling object-based cells with object-based content (if the schema matches)', async() => {
        handsontable({
          data: [
            ['A1', 'B1', 'test'],
            [{ id: 1, value: 'A2' }, { id: 2, value: 'B2' }, { id: 3, value: 'C3' }],
            ['A3', 'B3', 'test3'],
          ],
          valueGetter: value => value?.value ?? value,
        });

        const baseCellSource = getSourceDataAtCell(...coords[0]);
        const baseCellData = getDataAtCell(...coords[0]);

        await selectCell(...coords[0]);

        simulateFillHandleDrag(getCell(...coords[1], true));

        expect(getSourceDataAtCell(1, 0)).toEqual(baseCellSource);
        expect(getSourceDataAtCell(1, 1)).toEqual(baseCellSource);
        expect(getSourceDataAtCell(1, 2)).toEqual(baseCellSource);

        expect(getDataAtCell(1, 0)).toEqual(baseCellData);
        expect(getDataAtCell(1, 1)).toEqual(baseCellData);
        expect(getDataAtCell(1, 2)).toEqual(baseCellData);
      });

      it('should utilize the non-source data when filling text-based cells with object-based content', async() => {
        handsontable({
          data: [
            ['A1', 'xyz', 'test'],
            ['A2', 'xyz', 'test2'],
            ['A3', 'xyz', 'test3'],
          ],
        });

        await setSourceDataAtCell(coords[0][0], coords[0][1], { id: 1, value: 'A1' });
        await setCellMeta(coords[0][0], coords[0][1], 'valueGetter', value => value?.value);

        await render();

        await selectCell(...coords[0]);

        simulateFillHandleDrag(getCell(...coords[1], true));

        expect(getSourceDataAtCell(...coords[0])).toEqual({ id: 1, value: 'A1' });
        expect(getSourceDataAtCell(1, 1)).toEqual('A1');
        expect(getSourceDataAtCell(...coords[1])).toEqual('A1');

        expect(getDataAtCell(...coords[0])).toEqual('A1');
        expect(getDataAtCell(1, 1)).toEqual('A1');
        expect(getDataAtCell(...coords[1])).toEqual('A1');
      });

      it('should not perform autofill when filling object-based cells with object-based content (if the schema does not match)', async() => {
        handsontable({
          data: [
            ['A1', 'B1', 'test'],
            [{ a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 4 }],
            ['A3', 'B3', 'test3'],
          ],
          valueGetter: value => value?.a ?? value,
        });

        const sourceDataAtTarget = getSourceDataAtCell(...coords[1]);
        const dataAtTarget = getDataAtCell(...coords[1]);

        await setSourceDataAtCell(coords[0][0], coords[0][1], { id: 1, value: 'A1' });
        await setCellMeta(coords[0][0], coords[0][1], 'valueGetter', value => value?.value);

        await render();

        await selectCell(...coords[0]);

        simulateFillHandleDrag(getCell(...coords[1], true));

        expect(getSourceDataAtCell(...coords[0])).toEqual({ id: 1, value: 'A1' });
        expect(getSourceDataAtCell(1, 1)).toEqual({ a: 2, b: 3 });
        expect(getSourceDataAtCell(...coords[1])).toEqual(sourceDataAtTarget);

        expect(getDataAtCell(...coords[0])).toEqual('A1');
        expect(getDataAtCell(1, 1)).toEqual(2);
        expect(getDataAtCell(...coords[1])).toEqual(dataAtTarget);
      });

      it('should utilize the source data when filling mixed-typed cells with mixed-typed content (schema of the object-based content matches the schema of the target cell)', async() => {
        handsontable({
          data: [
            ['A1', 'B1', 'test'],
            [{ id: 1, value: 'A2' }, { id: 2, value: 'B2' }, { id: 3, value: 'C3' }],
            ['A3', 'B3', 'test3'],
          ],
          valueGetter: value => value?.value ?? value,
        });

        const sourceDataAtBaseCol = getSourceDataAtCol(coords[0][1]);
        const dataAtBaseCol = getDataAtCol(coords[0][1]);

        await selectCells([[0, coords[0][1], 2, coords[0][1]]]);

        simulateFillHandleDrag(getCell(2, coords[1][1], true));

        expect(getSourceDataAtCol(0)).toEqual(sourceDataAtBaseCol);
        expect(getSourceDataAtCol(1)).toEqual(sourceDataAtBaseCol);
        expect(getSourceDataAtCol(2)).toEqual(sourceDataAtBaseCol);

        expect(getDataAtCol(0)).toEqual(dataAtBaseCol);
        expect(getDataAtCol(1)).toEqual(dataAtBaseCol);
        expect(getDataAtCol(2)).toEqual(dataAtBaseCol);
      });
    });
  });

  describe('fill border position', () => {
    it('display the fill border in the correct position', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        fillHandle: true
      });

      await selectCell(3, 3, 5, 5);

      simulateFillHandleDrag(getCell(2, 3), { finish: false });

      expect(Handsontable.dom.hasClass(getCell(2, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 5), 'fill')).toBe(true);

      simulateFillHandleDragMove(getCell(2, 4));

      expect(Handsontable.dom.hasClass(getCell(2, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 5), 'fill')).toBe(true);

      simulateFillHandleDragMove(getCell(2, 5));

      expect(Handsontable.dom.hasClass(getCell(2, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 5), 'fill')).toBe(true);

      simulateFillHandleDragMove(getCell(3, 2));

      expect(Handsontable.dom.hasClass(getCell(3, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 2), 'fill')).toBe(true);

      simulateFillHandleDragMove(getCell(4, 2));

      expect(Handsontable.dom.hasClass(getCell(3, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 2), 'fill')).toBe(true);

      simulateFillHandleDragMove(getCell(5, 2));

      expect(Handsontable.dom.hasClass(getCell(3, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 2), 'fill')).toBe(true);

      simulateFillHandleDragMove(getCell(6, 3));

      expect(Handsontable.dom.hasClass(getCell(6, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(6, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(6, 5), 'fill')).toBe(true);

      simulateFillHandleDragMove(getCell(6, 4));

      expect(Handsontable.dom.hasClass(getCell(5, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(6, 5), 'fill')).toBe(true);

      simulateFillHandleDragMove(getCell(6, 5));

      expect(Handsontable.dom.hasClass(getCell(5, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(6, 5), 'fill')).toBe(true);

      simulateFillHandleDragMove(getCell(3, 6));

      expect(Handsontable.dom.hasClass(getCell(3, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 6), 'fill')).toBe(true);

      simulateFillHandleDragMove(getCell(4, 6));

      expect(Handsontable.dom.hasClass(getCell(3, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 6), 'fill')).toBe(true);

      simulateFillHandleDragMove(getCell(5, 6));

      expect(Handsontable.dom.hasClass(getCell(3, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 6), 'fill')).toBe(true);

      // Inside of the selection
      simulateFillHandleDragMove(getCell(5, 4));

      expect(Handsontable.dom.hasClass(getCell(3, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(3, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 4), 'fill')).toBe(true);
    });
  });

  using('autofill handler size', [
    2, 4, 6, 8, 10, 12, 14, 16,
  ], (autofillHandlerSize) => {
    beforeEach(() => {
      const style = document.createElement('style');
      const styleText = `
        .handsontable {
          --ht-cell-autofill-size: ${autofillHandlerSize}px;
        }`;

      style.id = 'autofill-handler-size-style';
      style.textContent = styleText;
      document.head.appendChild(style);
    });

    afterEach(() => {
      document.getElementById('autofill-handler-size-style').remove();
    });

    it('should render corner hit area with a proper size', async() => {
      if (spec().loadedTheme === 'classic') {
        return;
      }

      const hot = handsontable({
        width: 200,
        height: 200,
        startRows: 10,
        startCols: 10,
      });

      await selectCell(1, 1);

      const corner = hot.rootElement.querySelector('.ht_master .htBorders .corner');
      const hitAreaStyle = getComputedStyle(corner, '::after');
      const expectedHitAreaSize = Math.max(autofillHandlerSize, 14);

      expect(hitAreaStyle.width).toBe(`${expectedHitAreaSize}px`);
      expect(hitAreaStyle.height).toBe(`${expectedHitAreaSize}px`);
    });

    it('should cut the hit area at the bottom of the table when the last row is selected', async() => {
      if (spec().loadedTheme === 'classic') {
        return;
      }

      const hot = handsontable({
        width: 200,
        height: 200,
        startRows: 10,
        startCols: 10,
      });

      await selectCell(9, 1);

      const corner = hot.rootElement.querySelector('.ht_master .htBorders .corner');
      const hitAreaStyle = getComputedStyle(corner, '::after');

      expect(hitAreaStyle.insetBlockEnd).toBe('0px');
    });

    it('should cut the hit area at the right side of the table when the last column is selected', async() => {
      if (spec().loadedTheme === 'classic') {
        return;
      }

      const hot = handsontable({
        width: 200,
        height: 200,
        startRows: 10,
        startCols: 10,
      });

      await selectCell(1, 9);

      const corner = hot.rootElement.querySelector('.ht_master .htBorders .corner');
      const hitAreaStyle = getComputedStyle(corner, '::after');

      expect(hitAreaStyle.insetInlineEnd).toBe('0px');
    });
  });

  it('should be possible to change the hit area size', async() => {
    if (spec().loadedTheme === 'classic') {
      return;
    }

    const style = document.createElement('style');
    const styleText = `
      .handsontable {
        --ht-cell-autofill-hit-area-size: 10px;
      }`;

    style.id = 'autofill-handler-size-style';
    style.textContent = styleText;
    document.head.appendChild(style);

    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 10,
      startCols: 10,
    });

    await selectCell(1, 1);

    const corner = hot.rootElement.querySelector('.ht_master .htBorders .corner');
    const hitAreaStyle = getComputedStyle(corner, '::after');

    expect(hitAreaStyle.width).toBe('10px');
    expect(hitAreaStyle.height).toBe('10px');

    style.remove();
  });
});
