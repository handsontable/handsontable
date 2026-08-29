describe('MergeCells cooperation with autofill', () => {
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

  it('should populate merged cells data down', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 1, rowspan: 2, colspan: 2 },
        { row: 5, col: 1, rowspan: 2, colspan: 2 },
      ],
    });

    await selectCell(1, 1);

    simulateFillHandleDrag(getCell(5, 1));

    expect(getDataAtCell(1, 1)).toBe('B2');
    expect(getDataAtCell(3, 1)).toBe('B2');
    expect(getDataAtCell(5, 1)).toBe('B2');
  });

  it('should fill a row that sits within a vertical merge belonging to a different column (DEV-2115)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      mergeCells: [
        { row: 2, col: 0, rowspan: 3, colspan: 1 }, // A3:A5 - vertical merge in column 0 only
      ],
    });

    await selectCell(2, 1); // B3 - normal cell next to the merged column

    // Drag the fill handle down by a single row, to B4 - a row that lies inside column 0's
    // merged band (rows 2-4). Regression: the mouse-to-row lookup measured against the merged
    // column, so every Y inside the band collapsed onto the merge anchor (B3) and the fill
    // jumped past the whole band instead of stopping at B4.
    simulateFillHandleDrag(getCell(3, 1));

    expect(getDataAtCell(3, 1)).toBe('B3'); // filled from the source
    expect(getDataAtCell(4, 1)).toBe('B5'); // untouched - drag stopped at B4
  });

  it('should fill several rows within a vertical merge belonging to a different column (DEV-2115)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      mergeCells: [
        { row: 2, col: 0, rowspan: 3, colspan: 1 }, // A3:A5 - vertical merge in column 0 only
      ],
    });

    await selectCell(2, 1); // B3

    // Drag down to B5 - the last row inside column 0's merged band.
    simulateFillHandleDrag(getCell(4, 1));

    expect(getDataAtCell(3, 1)).toBe('B3');
    expect(getDataAtCell(4, 1)).toBe('B3');
    expect(getDataAtCell(5, 1)).toBe('B6'); // untouched - below the drag range
  });

  it('should fill into a merged band when a hidden column sits between it and the dragged column (DEV-2115)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 5),
      hiddenColumns: { columns: [1] }, // hide column 1, between the merged column 0 and column 2
      mergeCells: [
        { row: 2, col: 0, rowspan: 3, colspan: 1 }, // A3:A5 vertical merge in column 0
      ],
    });

    await selectCell(2, 2); // the first cell of column 2 within the merged band (column 1 hidden)

    // Drag down one row. The reference-column search must skip the hidden column 1 (no rendered
    // cell) instead of picking it, which would collapse the row lookup onto the merge anchor.
    simulateFillHandleDrag(getCell(3, 2));

    expect(getDataAtCell(3, 2)).toBe('C3'); // filled from the source
    expect(getDataAtCell(4, 2)).toBe('C5'); // untouched - drag stopped one row down
  });

  it('should fill a column that sits within a horizontal merge belonging to a different row (DEV-2124)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      mergeCells: [
        { row: 0, col: 0, rowspan: 1, colspan: 3 }, // A1:C1 - horizontal merge in row 0 only
      ],
    });

    await selectCell(2, 0); // A3 - normal cell below the merged row

    // Drag the fill handle right by a single column, to B3 - a column that lies inside row 0's
    // merged band (columns 0-2). Regression: the mouse-to-column lookup measured against the
    // merged row, so every X inside the band collapsed onto the merge anchor (A3) and the drag
    // resolved back to the source cell, filling nothing.
    simulateFillHandleDrag(getCell(2, 1));

    expect(getDataAtCell(2, 1)).toBe('A3'); // filled from the source
    expect(getDataAtCell(2, 2)).toBe('C3'); // untouched - drag stopped at B3
  });

  it('should fill several columns within a horizontal merge belonging to a different row (DEV-2124)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      mergeCells: [
        { row: 0, col: 0, rowspan: 1, colspan: 3 }, // A1:C1 - horizontal merge in row 0 only
      ],
    });

    await selectCell(2, 0); // A3

    // Drag right to C3 - the last column inside row 0's merged band.
    simulateFillHandleDrag(getCell(2, 2));

    expect(getDataAtCell(2, 1)).toBe('A3');
    expect(getDataAtCell(2, 2)).toBe('A3');
    expect(getDataAtCell(2, 3)).toBe('D3'); // untouched - right of the drag range
  });

  it('should fill into a merged band when a hidden row sits between it and the dragged row (DEV-2124)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 10),
      hiddenRows: { rows: [1] }, // hide row 1, between the merged row 0 and row 2
      mergeCells: [
        { row: 0, col: 0, rowspan: 1, colspan: 3 }, // A1:C1 horizontal merge in row 0
      ],
    });

    await selectCell(2, 0); // the first cell of row 2 within the merged band (row 1 hidden)

    // Drag right one column. The reference-row search must skip the hidden row 1 (no rendered
    // cell) instead of picking it, which would collapse the column lookup onto the merge anchor.
    simulateFillHandleDrag(getCell(2, 1));

    expect(getDataAtCell(2, 1)).toBe('A3'); // filled from the source
    expect(getDataAtCell(2, 2)).toBe('C3'); // untouched - drag stopped one column right
  });

  it('should populate merged cells data up', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 1, rowspan: 2, colspan: 2 },
        { row: 5, col: 1, rowspan: 2, colspan: 2 },
      ],
    });

    await selectCell(5, 1);

    simulateFillHandleDrag(getCell(1, 1));

    expect(getDataAtCell(1, 1)).toBe('B6');
    expect(getDataAtCell(3, 1)).toBe('B6');
    expect(getDataAtCell(5, 1)).toBe('B6');
  });

  it('should populate merged cells data right', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 1, col: 3, rowspan: 2, colspan: 2 },
        { row: 1, col: 5, rowspan: 2, colspan: 2 },
      ],
    });

    await selectCell(1, 1);

    simulateFillHandleDrag(getCell(1, 5));

    expect(getDataAtCell(1, 1)).toBe('B2');
    expect(getDataAtCell(1, 3)).toBe('B2');
    expect(getDataAtCell(1, 5)).toBe('B2');
  });

  it('should populate merged cells data left', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 1, col: 3, rowspan: 2, colspan: 2 },
        { row: 1, col: 5, rowspan: 2, colspan: 2 },
      ],
    });

    await selectCell(1, 5);

    simulateFillHandleDrag(getCell(1, 1));

    expect(getDataAtCell(1, 1)).toBe('F2');
    expect(getDataAtCell(1, 3)).toBe('F2');
    expect(getDataAtCell(1, 5)).toBe('F2');
  });

  it('should not populate data down when the merged cells bellow are wider than the fill selection', async() => {
    handsontable({
      data: createSpreadsheetData(15, 5),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 1, rowspan: 3, colspan: 3 },
        { row: 6, col: 1, rowspan: 3, colspan: 3 },
        { row: 9, col: 1, rowspan: 2, colspan: 2 },
      ],
    });

    await selectCell(1, 1);

    simulateFillHandleDrag(getCell(3, 1));

    expect(getDataAtCell(1, 1)).toBe('B2');
    expect(getDataAtCell(3, 1)).toBe('B4');
    expect(getDataAtCell(6, 1)).toBe('B7');
    expect(getDataAtCell(9, 1)).toBe('B10');
  });

  it('should not populate data down when the merged cells in-between are wider than the fill selection and the last merged cell matches the size', async() => {
    handsontable({
      data: createSpreadsheetData(15, 5),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 1, rowspan: 3, colspan: 3 },
        { row: 6, col: 1, rowspan: 3, colspan: 3 },
        { row: 9, col: 1, rowspan: 2, colspan: 2 },
      ],
    });

    await selectCell(1, 1);

    simulateFillHandleDrag(getCell(9, 1));

    expect(getDataAtCell(1, 1)).toBe('B2');
    expect(getDataAtCell(3, 1)).toBe('B4');
    expect(getDataAtCell(6, 1)).toBe('B7');
    expect(getDataAtCell(9, 1)).toBe('B10');
  });

  it('should not populate data up when the merged cells above are wider than the fill selection', async() => {
    handsontable({
      data: createSpreadsheetData(15, 5),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 1, rowspan: 3, colspan: 3 },
        { row: 6, col: 1, rowspan: 3, colspan: 3 },
        { row: 9, col: 1, rowspan: 2, colspan: 2 },
      ],
    });

    await selectCell(9, 1);

    simulateFillHandleDrag(getCell(6, 1));

    expect(getDataAtCell(1, 1)).toBe('B2');
    expect(getDataAtCell(3, 1)).toBe('B4');
    expect(getDataAtCell(6, 1)).toBe('B7');
    expect(getDataAtCell(9, 1)).toBe('B10');
  });

  it('should not populate data up when the merged cells in-between are wider than the fill selection and the last merged cell matches the size', async() => {
    handsontable({
      data: createSpreadsheetData(15, 5),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 1, rowspan: 3, colspan: 3 },
        { row: 6, col: 1, rowspan: 3, colspan: 3 },
        { row: 9, col: 1, rowspan: 2, colspan: 2 },
      ],
    });

    await selectCell(9, 1);

    simulateFillHandleDrag(getCell(1, 1));

    expect(getDataAtCell(1, 1)).toBe('B2');
    expect(getDataAtCell(3, 1)).toBe('B4');
    expect(getDataAtCell(6, 1)).toBe('B7');
    expect(getDataAtCell(9, 1)).toBe('B10');
  });

  it('should not populate data right when the merged cells on the right are higher than the fill selection', async() => {
    handsontable({
      data: createSpreadsheetData(5, 15),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 1, col: 3, rowspan: 3, colspan: 3 },
        { row: 1, col: 6, rowspan: 3, colspan: 3 },
        { row: 1, col: 9, rowspan: 2, colspan: 2 },
      ],
    });

    await selectCell(1, 1);

    simulateFillHandleDrag(getCell(1, 3));

    expect(getDataAtCell(1, 1)).toBe('B2');
    expect(getDataAtCell(1, 3)).toBe('D2');
    expect(getDataAtCell(1, 6)).toBe('G2');
    expect(getDataAtCell(1, 9)).toBe('J2');
  });

  it('should not populate data right when the merged cells in-between are higher than the fill selection and the last merged cell matches the size', async() => {
    handsontable({
      data: createSpreadsheetData(5, 15),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 1, col: 3, rowspan: 3, colspan: 3 },
        { row: 1, col: 6, rowspan: 3, colspan: 3 },
        { row: 1, col: 9, rowspan: 2, colspan: 2 },
      ],
    });

    await selectCell(1, 1);

    simulateFillHandleDrag(getCell(1, 9));

    expect(getDataAtCell(1, 1)).toBe('B2');
    expect(getDataAtCell(1, 3)).toBe('D2');
    expect(getDataAtCell(1, 6)).toBe('G2');
    expect(getDataAtCell(1, 9)).toBe('J2');
  });

  it('should not populate data left when the merged cells on the left are higher than the fill selection', async() => {
    handsontable({
      data: createSpreadsheetData(5, 15),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 1, col: 3, rowspan: 3, colspan: 3 },
        { row: 1, col: 6, rowspan: 3, colspan: 3 },
        { row: 1, col: 9, rowspan: 2, colspan: 2 },
      ],
    });

    await selectCell(1, 9);

    simulateFillHandleDrag(getCell(1, 6));

    expect(getDataAtCell(1, 1)).toBe('B2');
    expect(getDataAtCell(1, 3)).toBe('D2');
    expect(getDataAtCell(1, 6)).toBe('G2');
    expect(getDataAtCell(1, 9)).toBe('J2');
  });

  it('should not populate data left when the merged cells in-between are higher than the fill selection and the last merged cell matches the size', async() => {
    handsontable({
      data: createSpreadsheetData(5, 15),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 1, col: 3, rowspan: 3, colspan: 3 },
        { row: 1, col: 6, rowspan: 3, colspan: 3 },
        { row: 1, col: 9, rowspan: 2, colspan: 2 },
      ],
    });

    await selectCell(1, 9);

    simulateFillHandleDrag(getCell(1, 1));

    expect(getDataAtCell(1, 1)).toBe('B2');
    expect(getDataAtCell(1, 3)).toBe('D2');
    expect(getDataAtCell(1, 6)).toBe('G2');
    expect(getDataAtCell(1, 9)).toBe('J2');
  });
});
