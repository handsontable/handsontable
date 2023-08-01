describe('MergeCells copy and paste', () => {
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

  it('should properly paste single cell data to a merged cell', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
    });

    const clipboardEvent = getClipboardEvent();
    const copyPastePlugin = getPlugin('CopyPaste');

    clipboardEvent.clipboardData.setData('text/html', [
      '<table><tbody><tr><td>A1</td></tr></tbody></table>'
    ].join('\r\n'));

    selectCell(1, 1);
    copyPastePlugin.onPaste(clipboardEvent);

    expect(getDataAtCell(1, 1)).toEqual('A1');
    expect(`
      |   ║   : - : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   |
      | - ║   : # :   :   :   :   :   :   |
      | - ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    const mergeCellsPlugin = getPlugin('mergeCells');

    expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(2);
  });

  it('should properly paste single cell data to selection containing merged cell', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
    });

    const clipboardEvent = getClipboardEvent();
    const copyPastePlugin = getPlugin('CopyPaste');

    clipboardEvent.clipboardData.setData('text/html', [
      '<table><tbody><tr><td>A1</td></tr></tbody></table>'
    ].join('\r\n'));

    selectCell(0, 1, 3, 2);
    copyPastePlugin.onPaste(clipboardEvent);

    expect(getDataAtCell(1, 1)).toEqual('A1');
    expect(getDataAtCell(1, 2)).toEqual('A1');
    expect(getDataAtCell(2, 1)).toEqual('A1');
    expect(getDataAtCell(2, 2)).toEqual('A1');
    expect(getDataAtCell(3, 1)).toEqual('A1');
    expect(getDataAtCell(3, 2)).toEqual('A1');
    expect(`
        |   ║   : - : - :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===|
        | - ║   : A : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    const mergeCellsPlugin = getPlugin('mergeCells');

    expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(1);
  });

  describe('pasting multiple cells data to selection containing', () => {
    it('only merged area', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(8, 8),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
          { row: 3, col: 3, rowspan: 3, colspan: 3 }
        ],
      });

      const clipboardEvent = getClipboardEvent();
      const copyPastePlugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/html', [
        '<table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>'
      ].join('\r\n'));

      selectCell(1, 1);
      copyPastePlugin.onPaste(clipboardEvent);

      expect(getDataAtCell(1, 1)).toEqual('A1');
      expect(getDataAtCell(1, 2)).toEqual('B1');
      expect(getDataAtCell(2, 1)).toEqual('A1');
      expect(getDataAtCell(2, 2)).toEqual('B1');
      expect(`
        |   ║   : - : - :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   |
        | - ║   : A : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

      const mergeCellsPlugin = getPlugin('mergeCells');

      expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(1);
    });

    it('merged area and some cells above it', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(8, 8),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
          { row: 3, col: 3, rowspan: 3, colspan: 3 }
        ],
      });

      const clipboardEvent = getClipboardEvent();
      const copyPastePlugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/html', [
        '<table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>'
      ].join('\r\n'));

      selectCell(0, 1, 2, 2);
      copyPastePlugin.onPaste(clipboardEvent);

      expect(getDataAtCell(0, 1)).toEqual('A1');
      expect(getDataAtCell(0, 2)).toEqual('B1');
      expect(getDataAtCell(1, 1)).toEqual('A1');
      expect(getDataAtCell(1, 2)).toEqual('B1');
      expect(getDataAtCell(2, 1)).toEqual('A1');
      expect(getDataAtCell(2, 2)).toEqual('B1');
      expect(`
        |   ║   : - : - :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===|
        | - ║   : A : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

      const mergeCellsPlugin = getPlugin('mergeCells');

      expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(1);
    });

    it('merged area and some cells below it', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(8, 8),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
          { row: 3, col: 3, rowspan: 3, colspan: 3 }
        ],
      });

      const clipboardEvent = getClipboardEvent();
      const copyPastePlugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/html', [
        '<table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>'
      ].join('\r\n'));

      selectCell(1, 1, 3, 2);
      copyPastePlugin.onPaste(clipboardEvent);

      expect(getDataAtCell(1, 1)).toEqual('A1');
      expect(getDataAtCell(1, 2)).toEqual('B1');
      expect(getDataAtCell(2, 1)).toEqual('A1');
      expect(getDataAtCell(2, 2)).toEqual('B1');
      expect(getDataAtCell(3, 1)).toEqual('A1');
      expect(getDataAtCell(3, 2)).toEqual('B1');
      expect(`
        |   ║   : - : - :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   |
        | - ║   : A : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

      const mergeCellsPlugin = getPlugin('mergeCells');

      expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(1);
    });

    it('merged area and some cells below and after it', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(8, 8),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
          { row: 3, col: 3, rowspan: 3, colspan: 3 }
        ],
      });

      const clipboardEvent = getClipboardEvent();
      const copyPastePlugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/html', [
        '<table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>'
      ].join('\r\n'));

      selectCell(0, 1, 3, 2);
      copyPastePlugin.onPaste(clipboardEvent);

      expect(getDataAtCell(1, 1)).toEqual('A1');
      expect(getDataAtCell(1, 2)).toEqual('B1');
      expect(getDataAtCell(2, 1)).toEqual('A1');
      expect(getDataAtCell(2, 2)).toEqual('B1');
      expect(getDataAtCell(3, 1)).toEqual('A1');
      expect(getDataAtCell(3, 2)).toEqual('B1');
      expect(`
        |   ║   : - : - :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===|
        | - ║   : A : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

      const mergeCellsPlugin = getPlugin('mergeCells');

      expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(1);
    });
  });

  it('should properly paste data right after merged cells', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
    });

    const clipboardEvent = getClipboardEvent();
    const copyPastePlugin = getPlugin('CopyPaste');

    clipboardEvent.clipboardData.setData('text/html', [
      '<table><tbody>' +
      '<tr><td>G3</td><td>H3</td></tr>' +
      '<tr><td>G4</td><td>H4</td></tr>' +
      '<tr><td>G5</td><td>H5</td></tr>' +
      '<tr><td>G6</td><td>H6</td></tr>' +
      '</tbody></table>'
    ].join('\r\n'));

    selectCell(0, 2);
    copyPastePlugin.onPaste(clipboardEvent);

    expect(getData()).toEqual([
      ['A1', 'B1', 'G3', 'H3', 'E1', 'F1', 'G1', 'H1'],
      ['A2', 'B2', 'G4', 'H4', 'E2', 'F2', 'G2', 'H2'],
      ['A3', null, 'G5', 'H5', 'E3', 'F3', 'G3', 'H3'],
      ['A4', 'B4', 'G6', 'H6', null, null, 'G4', 'H4'],
      ['A5', 'B5', 'C5', null, null, null, 'G5', 'H5'],
      ['A6', 'B6', 'C6', null, null, null, 'G6', 'H6'],
      ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'],
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8'],
    ]);
    expect(`
      |   ║   : - : - : - : - : - :   :   |
      |===:===:===:===:===:===:===:===:===|
      | - ║   : A : 0 : 0 : 0 : 0 :   :   |
      | - ║   : 0 : 0 : 0 : 0 : 0 :   :   |
      | - ║   : 0 : 0 : 0 : 0 : 0 :   :   |
      | - ║   : 0 : 0 : 0 : 0 : 0 :   :   |
      | - ║   : 0 : 0 : 0 : 0 : 0 :   :   |
      | - ║   : 0 : 0 : 0 : 0 : 0 :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    const mergeCellsPlugin = getPlugin('mergeCells');

    expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(0);
  });

  it('should unmerge only one cell when selection contains two merged areas, but pasted data fills out one area', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
    });

    const clipboardEvent = getClipboardEvent();
    const copyPastePlugin = getPlugin('CopyPaste');

    clipboardEvent.clipboardData.setData('text/html', [
      '<table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>'
    ].join('\r\n'));

    selectCell(1, 1, 5, 5);
    copyPastePlugin.onPaste(clipboardEvent);

    expect(getData()).toEqual([
      ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'],
      ['A2', 'A1', 'B1', 'D2', 'E2', 'F2', 'G2', 'H2'],
      ['A3', null, null, 'D3', 'E3', 'F3', 'G3', 'H3'],
      ['A4', 'B4', 'C4', 'D4', null, null, 'G4', 'H4'],
      ['A5', 'B5', 'C5', null, null, null, 'G5', 'H5'],
      ['A6', 'B6', 'C6', null, null, null, 'G6', 'H6'],
      ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'],
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8']
    ]);
    expect(`
      |   ║   : - : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   |
      | - ║   : A : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    const mergeCellsPlugin = getPlugin('mergeCells');

    expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(1);
  });

  it('should not unmerge cell when selection contains two merged areas, but pasted data fills out unmerged area', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
    });

    const clipboardEvent = getClipboardEvent();
    const copyPastePlugin = getPlugin('CopyPaste');

    clipboardEvent.clipboardData.setData('text/html', [
      '<table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>'
    ].join('\r\n'));

    selectCell(0, 1, 5, 5);
    copyPastePlugin.onPaste(clipboardEvent);

    expect(getData()).toEqual([
      ['A1', 'A1', 'B1', 'D1', 'E1', 'F1', 'G1', 'H1'],
      ['A2', 'B2', null, 'D2', 'E2', 'F2', 'G2', 'H2'],
      ['A3', null, null, 'D3', 'E3', 'F3', 'G3', 'H3'],
      ['A4', 'B4', 'C4', 'D4', null, null, 'G4', 'H4'],
      ['A5', 'B5', 'C5', null, null, null, 'G5', 'H5'],
      ['A6', 'B6', 'C6', null, null, null, 'G6', 'H6'],
      ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'],
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8']
    ]);
    expect(`
      |   ║   : - : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===|
      | - ║   : A : 0 :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    const mergeCellsPlugin = getPlugin('mergeCells');

    expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(2);
  });

  it('should restore a merge area after performing undo for paste action which already unmerged the area', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
    });

    const clipboardEvent = getClipboardEvent();
    const copyPastePlugin = getPlugin('CopyPaste');

    clipboardEvent.clipboardData.setData('text/html', [
      '<table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>'
    ].join('\r\n'));

    selectCell(1, 1);

    copyPastePlugin.onPaste(clipboardEvent);

    hot.undo();

    // TODO: It should be fixed (actions of changing values and toggling a merge state should be batched)
    // expect(getCell(1, 1).rowSpan).toBe(2);
    // expect(getCell(1, 1).colSpan).toBe(2);

    expect(getData()).toEqual([
      ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'],
      ['A2', 'B2', null, 'D2', 'E2', 'F2', 'G2', 'H2'],
      ['A3', null, null, 'D3', 'E3', 'F3', 'G3', 'H3'],
      ['A4', 'B4', 'C4', 'D4', null, null, 'G4', 'H4'],
      ['A5', 'B5', 'C5', null, null, null, 'G5', 'H5'],
      ['A6', 'B6', 'C6', null, null, null, 'G6', 'H6'],
      ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'],
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8']
    ]);

    hot.redo();

    expect(getCell(1, 1).rowSpan).toBe(1);
    expect(getCell(1, 1).colSpan).toBe(1);

    expect(getData()).toEqual([
      ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'],
      ['A2', 'A1', 'B1', 'D2', 'E2', 'F2', 'G2', 'H2'],
      ['A3', 'A1', 'B1', 'D3', 'E3', 'F3', 'G3', 'H3'],
      ['A4', 'B4', 'C4', 'D4', null, null, 'G4', 'H4'],
      ['A5', 'B5', 'C5', null, null, null, 'G5', 'H5'],
      ['A6', 'B6', 'C6', null, null, null, 'G6', 'H6'],
      ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'],
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8']
    ]);
  });
});
