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

  it('should remove from the second column three rows starting from the beginning', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });

    const removedData = hot.spliceCol(1, 0, 3);

    expect(removedData).toEqual(['B1', 'B2', 'B3']);
    expect(hot.getDataAtRow(0)).toEqual(['A1', 'B4', 'C1', 'D1', 'E1']);
    expect(hot.getDataAtRow(1)).toEqual(['A2', 'B5', 'C2', 'D2', 'E2']);
    expect(hot.getDataAtRow(2)).toEqual(['A3', null, 'C3', 'D3', 'E3']);
    expect(hot.getDataAtRow(3)).toEqual(['A4', null, 'C4', 'D4', 'E4']);
    expect(hot.getDataAtRow(4)).toEqual(['A5', null, 'C5', 'D5', 'E5']);
  });

  it('should remove from the third column three rows starting from the second row', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });

    const removedData = hot.spliceCol(2, 1, 3);

    expect(removedData).toEqual(['C2', 'C3', 'C4']);
    expect(hot.getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    expect(hot.getDataAtRow(1)).toEqual(['A2', 'B2', 'C5', 'D2', 'E2']);
    expect(hot.getDataAtRow(2)).toEqual(['A3', 'B3', null, 'D3', 'E3']);
    expect(hot.getDataAtRow(3)).toEqual(['A4', 'B4', null, 'D4', 'E4']);
    expect(hot.getDataAtRow(4)).toEqual(['A5', 'B5', null, 'D5', 'E5']);
  });

  it('should replace and append new rows in the second column starting from the second row', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });

    const removedData = hot.spliceCol(1, 1, 3, 'X1', 'X2', 'X3', 'X4', 'X5');

    expect(removedData).toEqual(['B2', 'B3', 'B4']);
    expect(hot.getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    expect(hot.getDataAtRow(1)).toEqual(['A2', 'X1', 'C2', 'D2', 'E2']);
    expect(hot.getDataAtRow(2)).toEqual(['A3', 'X2', 'C3', 'D3', 'E3']);
    expect(hot.getDataAtRow(3)).toEqual(['A4', 'X3', 'C4', 'D4', 'E4']);
    expect(hot.getDataAtRow(4)).toEqual(['A5', 'X4', 'C5', 'D5', 'E5']);
    expect(hot.getDataAtRow(5)).toEqual([null, 'X5', null, null, null]);
    expect(hot.getDataAtRow(6)).toEqual([null, 'B5', null, null, null]);
  });

  it('should trigger beforeChange and afterChange hook with proper arguments', () => {
    const spyAfter = jasmine.createSpy('after');
    const spyBefore = jasmine.createSpy('before');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      beforeChange: spyBefore,
      afterChange: spyAfter,
    });

    hot.spliceCol(2, 1, 3, 'X1');

    expect(spyBefore.calls.argsFor(0)[0]).toEqual([[1, 2, 'C2', 'X1'], [2, 2, 'C3', 'C5'], [3, 2, 'C4', null], [4, 2, 'C5', null], [5, 2, null, null]]);
    expect(spyBefore.calls.argsFor(0)[1]).toBe('spliceCol');
    expect(spyAfter.calls.argsFor(1)[0]).toEqual([[1, 2, 'C2', 'X1'], [2, 2, 'C3', 'C5'], [3, 2, 'C4', null], [4, 2, 'C5', null], [5, 2, null, null]]);
    expect(spyAfter.calls.argsFor(1)[1]).toBe('spliceCol');
  });

  it('should trigger beforeCreateRow and afterCreateRow hook with proper arguments', () => {
    const spyAfter = jasmine.createSpy('after');
    const spyBefore = jasmine.createSpy('before');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      beforeCreateRow: spyBefore,
      afterCreateRow: spyAfter,
    });

    hot.spliceCol(2, 1, 3, 'X1', 'X2', 'X3', 'X4');

    expect(spyBefore).toHaveBeenCalledWith(5, 1, 'spliceCol', undefined, undefined, undefined);
    expect(spyAfter).toHaveBeenCalledWith(5, 1, 'spliceCol', undefined, undefined, undefined);
  });
});
