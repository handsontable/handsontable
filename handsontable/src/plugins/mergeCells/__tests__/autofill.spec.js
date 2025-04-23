describe('MergeCells cooperation with autofill', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find(`#${id}`).remove();
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
    spec().$container.find('.wtBorder.current.corner')
      .simulate('mousedown');
    spec().$container.find('tbody tr:eq(5) td:eq(1)')
      .simulate('mouseover')
      .simulate('mouseup');

    expect(getDataAtCell(1, 1)).toBe('B2');
    expect(getDataAtCell(3, 1)).toBe('B2');
    expect(getDataAtCell(5, 1)).toBe('B2');
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
    spec().$container.find('.wtBorder.current.corner')
      .simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(1)')
      .simulate('mouseover')
      .simulate('mouseup');

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
    spec().$container.find('.wtBorder.current.corner')
      .simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(5)')
      .simulate('mouseover')
      .simulate('mouseup');

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
    spec().$container.find('.wtBorder.current.corner')
      .simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(1)')
      .simulate('mouseover')
      .simulate('mouseup');

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
    spec().$container.find('.wtBorder.current.corner')
      .simulate('mousedown');
    spec().$container.find('tbody tr:eq(3) td:eq(1)')
      .simulate('mouseover')
      .simulate('mouseup');

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
    spec().$container.find('.wtBorder.current.corner')
      .simulate('mousedown');
    spec().$container.find('tbody tr:eq(9) td:eq(1)')
      .simulate('mouseover')
      .simulate('mouseup');

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
    spec().$container.find('.wtBorder.current.corner')
      .simulate('mousedown');
    spec().$container.find('tbody tr:eq(6) td:eq(1)')
      .simulate('mouseover')
      .simulate('mouseup');

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
    spec().$container.find('.wtBorder.current.corner')
      .simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(1)')
      .simulate('mouseover')
      .simulate('mouseup');

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
    spec().$container.find('.wtBorder.current.corner')
      .simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(3)')
      .simulate('mouseover')
      .simulate('mouseup');

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
    spec().$container.find('.wtBorder.current.corner')
      .simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(9)')
      .simulate('mouseover')
      .simulate('mouseup');

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
    spec().$container.find('.wtBorder.current.corner')
      .simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(6)')
      .simulate('mouseover')
      .simulate('mouseup');

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
    spec().$container.find('.wtBorder.current.corner')
      .simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(1)')
      .simulate('mouseover')
      .simulate('mouseup');

    expect(getDataAtCell(1, 1)).toBe('B2');
    expect(getDataAtCell(1, 3)).toBe('D2');
    expect(getDataAtCell(1, 6)).toBe('G2');
    expect(getDataAtCell(1, 9)).toBe('J2');
  });
});
