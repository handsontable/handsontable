describe('MergeCells Navigation', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should correctly navigate forward horizontally through the merged cells (auto-wrapping is disabled)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      colHeaders: true,
      rowHeaders: true,
      autoWrapRow: false,
      autoWrapCol: false,
      mergeCells: [
        { row: 1, col: 1, rowspan: 3, colspan: 3 }
      ]
    });

    selectCell(2, 0);
    keyDownUp('tab');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

    keyDownUp('tab');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);

    keyDownUp('tab');

    expect(getSelectedRange()).toBeUndefined();
  });

  it('should correctly navigate backward horizontally through the merged cells (auto-wrapping is disabled)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      colHeaders: true,
      rowHeaders: true,
      autoWrapRow: false,
      autoWrapCol: false,
      mergeCells: [
        { row: 1, col: 1, rowspan: 3, colspan: 3 }
      ]
    });

    selectCell(2, 4);
    keyDownUp(['shift', 'tab']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

    keyDownUp(['shift', 'tab']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);

    keyDownUp(['shift', 'tab']);

    expect(getSelectedRange()).toBeUndefined();
  });

  it('should correctly navigate forward vertically through the merged cells (auto-wrapping is disabled)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      colHeaders: true,
      rowHeaders: true,
      autoWrapRow: false,
      autoWrapCol: false,
      enterBeginsEditing: false,
      mergeCells: [
        { row: 1, col: 1, rowspan: 3, colspan: 3 }
      ]
    });

    selectCell(0, 2);
    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 4,2']);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 4,2']);
  });

  it('should correctly navigate backward vertically through the merged cells (auto-wrapping is disabled)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      colHeaders: true,
      rowHeaders: true,
      autoWrapRow: false,
      autoWrapCol: false,
      enterBeginsEditing: false,
      mergeCells: [
        { row: 1, col: 1, rowspan: 3, colspan: 3 }
      ]
    });

    selectCell(4, 2);
    keyDownUp(['shift', 'enter']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

    keyDownUp(['shift', 'enter']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);

    keyDownUp(['shift', 'enter']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
  });

  it('should correctly navigate forward horizontally through the merged cells (auto-wrapping is enabled)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      colHeaders: true,
      rowHeaders: true,
      autoWrapRow: true,
      autoWrapCol: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 3, colspan: 3 }
      ]
    });

    selectCell(2, 0);
    keyDownUp('tab');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

    keyDownUp('tab');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);

    keyDownUp('tab');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);

    keyDownUp('tab');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

    keyDownUp('tab');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,4 from: 3,4 to: 3,4']);

    keyDownUp('tab');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: 4,0 to: 4,0']);
  });

  it('should correctly navigate backward horizontally through the merged cells (auto-wrapping is enabled)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      colHeaders: true,
      rowHeaders: true,
      autoWrapRow: true,
      autoWrapCol: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 3, colspan: 3 }
      ]
    });

    selectCell(2, 4);
    keyDownUp(['shift', 'tab']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

    keyDownUp(['shift', 'tab']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);

    keyDownUp(['shift', 'tab']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 1,4']);

    keyDownUp(['shift', 'tab']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

    keyDownUp(['shift', 'tab']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);

    keyDownUp(['shift', 'tab']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);
  });

  it('should correctly navigate forward vertically through the merged cells (auto-wrapping is enabled)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      colHeaders: true,
      rowHeaders: true,
      autoWrapRow: true,
      autoWrapCol: true,
      enterBeginsEditing: false,
      mergeCells: [
        { row: 1, col: 1, rowspan: 3, colspan: 3 }
      ]
    });

    selectCell(0, 2);
    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 4,2']);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,3 to: 0,3']);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 4,3 from: 4,3 to: 4,3']);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);
  });

  it('should correctly navigate backward vertically through the merged cells (auto-wrapping is enabled)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      colHeaders: true,
      rowHeaders: true,
      autoWrapRow: true,
      autoWrapCol: true,
      enterBeginsEditing: false,
      mergeCells: [
        { row: 1, col: 1, rowspan: 3, colspan: 3 }
      ]
    });

    selectCell(4, 2);
    keyDownUp(['shift', 'enter']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

    keyDownUp(['shift', 'enter']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);

    keyDownUp(['shift', 'enter']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 4,1 from: 4,1 to: 4,1']);

    keyDownUp(['shift', 'enter']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

    keyDownUp(['shift', 'enter']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);

    keyDownUp(['shift', 'enter']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: 4,0 to: 4,0']);
  });

  it('should correctly navigate forward horizontally through the merged cells within the range', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(7, 7),
      colHeaders: true,
      rowHeaders: true,
      mergeCells: [
        { row: 2, col: 2, rowspan: 3, colspan: 3 }
      ]
    });

    selectCell(1, 1, 5, 5);
    hot.selection.setRangeFocus(cellCoords(3, 1));
    keyDownUp('tab');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,1 to: 5,5']);

    keyDownUp('tab');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,5 from: 1,1 to: 5,5']);

    keyDownUp('tab');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 4,1 from: 1,1 to: 5,5']);

    keyDownUp('tab');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,1 to: 5,5']);

    keyDownUp('tab');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 4,5 from: 1,1 to: 5,5']);

    keyDownUp('tab');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 5,1 from: 1,1 to: 5,5']);
  });

  it('should correctly navigate backward horizontally through the merged cells within the range', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(7, 7),
      colHeaders: true,
      rowHeaders: true,
      mergeCells: [
        { row: 2, col: 2, rowspan: 3, colspan: 3 }
      ]
    });

    selectCell(1, 1, 5, 5);
    hot.selection.setRangeFocus(cellCoords(3, 5));
    keyDownUp(['shift', 'tab']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,1 to: 5,5']);

    keyDownUp(['shift', 'tab']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,1 from: 1,1 to: 5,5']);

    keyDownUp(['shift', 'tab']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,5 from: 1,1 to: 5,5']);

    keyDownUp(['shift', 'tab']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,1 to: 5,5']);

    keyDownUp(['shift', 'tab']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 1,1 to: 5,5']);

    keyDownUp(['shift', 'tab']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,5 from: 1,1 to: 5,5']);
  });

  it('should correctly navigate forward vertically through the merged cells within the range', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(7, 7),
      colHeaders: true,
      rowHeaders: true,
      mergeCells: [
        { row: 2, col: 2, rowspan: 3, colspan: 3 }
      ]
    });

    selectCell(1, 1, 5, 5);
    hot.selection.setRangeFocus(cellCoords(1, 3));

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,1 to: 5,5']);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 5,3 from: 1,1 to: 5,5']);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,1 to: 5,5']);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,1 to: 5,5']);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 5,4 from: 1,1 to: 5,5']);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,5 from: 1,1 to: 5,5']);
  });

  it('should correctly navigate backward vertically through the merged cells within the range', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(7, 7),
      colHeaders: true,
      rowHeaders: true,
      enterBeginsEditing: false,
      mergeCells: [
        { row: 2, col: 2, rowspan: 3, colspan: 3 }
      ]
    });

    selectCell(1, 1, 5, 5);
    hot.selection.setRangeFocus(cellCoords(5, 3));
    keyDownUp(['shift', 'enter']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,1 to: 5,5']);

    keyDownUp(['shift', 'enter']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,1 to: 5,5']);

    keyDownUp(['shift', 'enter']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 5,2 from: 1,1 to: 5,5']);

    keyDownUp(['shift', 'enter']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,1 to: 5,5']);

    keyDownUp(['shift', 'enter']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,1 to: 5,5']);

    keyDownUp(['shift', 'enter']);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 5,1 from: 1,1 to: 5,5']);
  });
});
