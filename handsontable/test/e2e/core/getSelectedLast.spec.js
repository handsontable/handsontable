describe('Core.getSelectedLast', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return valid coordinates', async() => {
    handsontable({
      data: createSpreadsheetObjectData(10, 10),
      selectionMode: 'multiple',
    });

    const snapshot = [
      [5, 4, 1, 1],
      [2, 2, 7, 2],
      [2, 4, 2, 4],
      [7, 6, 8, 7],
    ];

    await mouseDown(getCell(5, 4));
    await mouseOver(getCell(1, 1));
    await mouseUp(getCell(1, 1));

    expect(getSelectedLast()).toEqual(snapshot[0]);

    await keyDown('control/meta');

    await mouseDown(getCell(2, 2));
    await mouseOver(getCell(7, 2));
    await mouseUp(getCell(7, 2));

    expect(getSelectedLast()).toEqual(snapshot[1]);

    await mouseDown(getCell(2, 4));
    await mouseOver(getCell(2, 4));
    await mouseUp(getCell(2, 4));

    expect(getSelectedLast()).toEqual(snapshot[2]);

    await mouseDown(getCell(7, 6));
    await mouseOver(getCell(8, 7));
    await mouseUp(getCell(8, 7));

    await keyUp('control/meta');

    expect(getSelectedLast()).toEqual(snapshot[3]);
  });

  it('should return valid coordinates when `.getSelectedRange` and `.getSelectedRangeLast` is called', async() => {
    handsontable({
      data: createSpreadsheetObjectData(10, 10),
      selectionMode: 'multiple',
    });

    const snapshot = [
      { from: { row: 5, col: 4 }, to: { row: 1, col: 1 } },
      { from: { row: 2, col: 2 }, to: { row: 7, col: 2 } },
      { from: { row: 2, col: 4 }, to: { row: 2, col: 4 } },
      { from: { row: 7, col: 6 }, to: { row: 8, col: 7 } },
    ];

    await mouseDown(getCell(5, 4));
    await mouseOver(getCell(1, 1));
    await mouseUp(getCell(1, 1));

    expect(getSelectedRangeLast().toObject()).toEqual(snapshot[0]);
    expect(getSelectedRange().map(cellRange => cellRange.toObject())).toEqual([snapshot[0]]);

    await keyDown('control/meta');

    await mouseDown(getCell(2, 2));
    await mouseOver(getCell(7, 2));
    await mouseUp(getCell(7, 2));

    expect(getSelectedRangeLast().toObject()).toEqual(snapshot[1]);
    expect(getSelectedRange().map(cellRange => cellRange.toObject())).toEqual([snapshot[0], snapshot[1]]);

    await mouseDown(getCell(2, 4));
    await mouseOver(getCell(2, 4));
    await mouseUp(getCell(2, 4));

    expect(getSelectedRangeLast().toObject()).toEqual(snapshot[2]);
    expect(getSelectedRange().map(cellRange => cellRange.toObject())).toEqual([snapshot[0], snapshot[1], snapshot[2]]);

    await mouseDown(getCell(7, 6));
    await mouseOver(getCell(8, 7));
    await mouseUp(getCell(8, 7));

    await keyUp('control/meta');

    const selectedRange = getSelectedRange().map(cellRange => cellRange.toObject());

    expect(getSelectedRangeLast().toObject()).toEqual(snapshot[3]);
    expect(selectedRange).toEqual(snapshot);
  });
});
