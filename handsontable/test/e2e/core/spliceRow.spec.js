describe('Core.spliceRow', () => {
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

  it('should remove from the second row three columns starting from the beginning', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });

    const removedData = hot.spliceRow(1, 0, 3);

    expect(removedData).toEqual(['A2', 'B2', 'C2']);
    expect(hot.getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    expect(hot.getDataAtRow(1)).toEqual(['D2', 'E2', null, null, null]);
    expect(hot.getDataAtRow(2)).toEqual(['A3', 'B3', 'C3', 'D3', 'E3']);
    expect(hot.getDataAtRow(3)).toEqual(['A4', 'B4', 'C4', 'D4', 'E4']);
    expect(hot.getDataAtRow(4)).toEqual(['A5', 'B5', 'C5', 'D5', 'E5']);
  });

  it('should remove from the third row three columns starting from the second column', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });

    const removedData = hot.spliceRow(2, 1, 3);

    expect(removedData).toEqual(['B3', 'C3', 'D3']);
    expect(hot.getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    expect(hot.getDataAtRow(1)).toEqual(['A2', 'B2', 'C2', 'D2', 'E2']);
    expect(hot.getDataAtRow(2)).toEqual(['A3', 'E3', null, null, null]);
    expect(hot.getDataAtRow(3)).toEqual(['A4', 'B4', 'C4', 'D4', 'E4']);
    expect(hot.getDataAtRow(4)).toEqual(['A5', 'B5', 'C5', 'D5', 'E5']);
  });

  it('should replace and append new columns in the second row starting from the second column', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });

    const removedData = hot.spliceRow(1, 1, 3, 'X1', 'X2', 'X3', 'X4', 'X5');

    expect(removedData).toEqual(['B2', 'C2', 'D2']);
    expect(hot.getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', null, null]);
    expect(hot.getDataAtRow(1)).toEqual(['A2', 'X1', 'X2', 'X3', 'X4', 'X5', 'E2']);
    expect(hot.getDataAtRow(2)).toEqual(['A3', 'B3', 'C3', 'D3', 'E3', null, null]);
    expect(hot.getDataAtRow(3)).toEqual(['A4', 'B4', 'C4', 'D4', 'E4', null, null]);
    expect(hot.getDataAtRow(4)).toEqual(['A5', 'B5', 'C5', 'D5', 'E5', null, null]);
  });

  it('should trigger beforeChange and afterChange hook with proper arguments', () => {
    const spyAfter = jasmine.createSpy('after');
    const spyBefore = jasmine.createSpy('before');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      beforeChange: spyBefore,
      afterChange: spyAfter,
    });

    hot.spliceRow(2, 1, 3, 'X1');

    expect(spyBefore.calls.argsFor(0)[0]).toEqual([
      [2, 1, 'B3', 'X1'],
      [2, 2, 'C3', 'E3'],
      [2, 3, 'D3', null],
      [2, 4, 'E3', null],
      [2, 5, undefined, null]
    ]);
    expect(spyBefore.calls.argsFor(0)[1]).toBe('spliceRow');
    expect(spyAfter.calls.argsFor(1)[0]).toEqual([
      [2, 1, 'B3', 'X1'],
      [2, 2, 'C3', 'E3'],
      [2, 3, 'D3', null],
      [2, 4, 'E3', null],
      [2, 5, undefined, null]
    ]);
    expect(spyAfter.calls.argsFor(1)[1]).toBe('spliceRow');
  });

  it('should trigger beforeCreateCol and afterCreateCol hook with proper arguments', () => {
    const spyAfter = jasmine.createSpy('after');
    const spyBefore = jasmine.createSpy('before');

    handsontable({
      data: createSpreadsheetData(5, 5),
      beforeCreateCol: spyBefore,
      afterCreateCol: spyAfter,
    });

    spliceRow(2, 1, 3, 'X1', 'X2', 'X3', 'X4');

    expect(spyBefore).toHaveBeenCalledWith(5, 1, 'auto');
    expect(spyAfter).toHaveBeenCalledWith(5, 1, 'auto');
  });
});
