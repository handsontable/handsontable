describe('Core.spliceCol', () => {
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

  it('should remove from the second column three rows starting from the beginning', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    const removedData = await spliceCol(1, 0, 3);

    expect(removedData).toEqual(['B1', 'B2', 'B3']);
    expect(getDataAtRow(0)).toEqual(['A1', 'B4', 'C1', 'D1', 'E1']);
    expect(getDataAtRow(1)).toEqual(['A2', 'B5', 'C2', 'D2', 'E2']);
    expect(getDataAtRow(2)).toEqual(['A3', null, 'C3', 'D3', 'E3']);
    expect(getDataAtRow(3)).toEqual(['A4', null, 'C4', 'D4', 'E4']);
    expect(getDataAtRow(4)).toEqual(['A5', null, 'C5', 'D5', 'E5']);
  });

  it('should remove from the third column three rows starting from the second row', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    const removedData = await spliceCol(2, 1, 3);

    expect(removedData).toEqual(['C2', 'C3', 'C4']);
    expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    expect(getDataAtRow(1)).toEqual(['A2', 'B2', 'C5', 'D2', 'E2']);
    expect(getDataAtRow(2)).toEqual(['A3', 'B3', null, 'D3', 'E3']);
    expect(getDataAtRow(3)).toEqual(['A4', 'B4', null, 'D4', 'E4']);
    expect(getDataAtRow(4)).toEqual(['A5', 'B5', null, 'D5', 'E5']);
  });

  it('should replace and append new rows in the second column starting from the second row', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    const removedData = await spliceCol(1, 1, 3, 'X1', 'X2', 'X3', 'X4', 'X5');

    expect(removedData).toEqual(['B2', 'B3', 'B4']);
    expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    expect(getDataAtRow(1)).toEqual(['A2', 'X1', 'C2', 'D2', 'E2']);
    expect(getDataAtRow(2)).toEqual(['A3', 'X2', 'C3', 'D3', 'E3']);
    expect(getDataAtRow(3)).toEqual(['A4', 'X3', 'C4', 'D4', 'E4']);
    expect(getDataAtRow(4)).toEqual(['A5', 'X4', 'C5', 'D5', 'E5']);
    expect(getDataAtRow(5)).toEqual([null, 'X5', null, null, null]);
    expect(getDataAtRow(6)).toEqual([null, 'B5', null, null, null]);
  });

  it('should trigger beforeChange and afterChange hook with proper arguments', async() => {
    const spyAfter = jasmine.createSpy('after');
    const spyBefore = jasmine.createSpy('before');

    handsontable({
      data: createSpreadsheetData(5, 5),
      beforeChange: spyBefore,
      afterChange: spyAfter,
    });

    await spliceCol(2, 1, 3, 'X1');

    expect(spyBefore.calls.argsFor(0)[0]).toEqual([
      [1, 2, 'C2', 'X1'],
      [2, 2, 'C3', 'C5'],
      [3, 2, 'C4', null],
      [4, 2, 'C5', null],
      [5, 2, null, null]
    ]);
    expect(spyBefore.calls.argsFor(0)[1]).toBe('spliceCol');
    expect(spyAfter.calls.argsFor(1)[0]).toEqual([
      [1, 2, 'C2', 'X1'],
      [2, 2, 'C3', 'C5'],
      [3, 2, 'C4', null],
      [4, 2, 'C5', null],
      [5, 2, null, null]
    ]);
    expect(spyAfter.calls.argsFor(1)[1]).toBe('spliceCol');
  });

  it('should trigger beforeCreateRow and afterCreateRow hook with proper arguments', async() => {
    const spyAfter = jasmine.createSpy('after');
    const spyBefore = jasmine.createSpy('before');

    handsontable({
      data: createSpreadsheetData(5, 5),
      beforeCreateRow: spyBefore,
      afterCreateRow: spyAfter,
    });

    await spliceCol(2, 1, 3, 'X1', 'X2', 'X3', 'X4');

    expect(spyBefore).toHaveBeenCalledWith(5, 1, 'auto');
    expect(spyAfter).toHaveBeenCalledWith(5, 1, 'auto');
  });
});
