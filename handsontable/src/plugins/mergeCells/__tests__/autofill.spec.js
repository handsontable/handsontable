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

  it('should populate merged cells data down', () => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 1, rowspan: 2, colspan: 2 },
        { row: 5, col: 1, rowspan: 2, colspan: 2 },
      ],
    });

    selectCell(1, 1);
    spec().$container.find('.wtBorder.current.corner')
      .simulate('mousedown');
    spec().$container.find('tbody tr:eq(5) td:eq(1)')
      .simulate('mouseover')
      .simulate('mouseup');

    expect(getDataAtCell(1, 1)).toBe('B2');
    expect(getDataAtCell(3, 1)).toBe('B2');
    expect(getDataAtCell(5, 1)).toBe('B2');
  });

  it('should populate merged cells data up', () => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 1, rowspan: 2, colspan: 2 },
        { row: 5, col: 1, rowspan: 2, colspan: 2 },
      ],
    });

    selectCell(5, 1);
    spec().$container.find('.wtBorder.current.corner')
      .simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(1)')
      .simulate('mouseover')
      .simulate('mouseup');

    expect(getDataAtCell(1, 1)).toBe('B6');
    expect(getDataAtCell(3, 1)).toBe('B6');
    expect(getDataAtCell(5, 1)).toBe('B6');
  });

  it('should populate merged cells data right', () => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 1, col: 3, rowspan: 2, colspan: 2 },
        { row: 1, col: 5, rowspan: 2, colspan: 2 },
      ],
    });

    selectCell(1, 1);
    spec().$container.find('.wtBorder.current.corner')
      .simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(5)')
      .simulate('mouseover')
      .simulate('mouseup');

    expect(getDataAtCell(1, 1)).toBe('B2');
    expect(getDataAtCell(1, 3)).toBe('B2');
    expect(getDataAtCell(1, 5)).toBe('B2');
  });

  it('should populate merged cells data left', () => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 1, col: 3, rowspan: 2, colspan: 2 },
        { row: 1, col: 5, rowspan: 2, colspan: 2 },
      ],
    });

    selectCell(1, 5);
    spec().$container.find('.wtBorder.current.corner')
      .simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(1)')
      .simulate('mouseover')
      .simulate('mouseup');

    expect(getDataAtCell(1, 1)).toBe('F2');
    expect(getDataAtCell(1, 3)).toBe('F2');
    expect(getDataAtCell(1, 5)).toBe('F2');
  });
});
