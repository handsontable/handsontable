describe('Core.getSelected', () => {
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

    expect(getSelected()).toEqual([snapshot[0]]);

    await keyDown('control/meta');

    await mouseDown(getCell(2, 2));
    await mouseOver(getCell(7, 2));
    await mouseUp(getCell(7, 2));

    expect(getSelected()).toEqual([snapshot[0], snapshot[1]]);

    await mouseDown(getCell(2, 4));
    await mouseOver(getCell(2, 4));
    await mouseUp(getCell(2, 4));

    expect(getSelected()).toEqual([snapshot[0], snapshot[1], snapshot[2]]);

    await mouseDown(getCell(7, 6));
    await mouseOver(getCell(8, 7));
    await mouseUp(getCell(8, 7));

    await keyUp('control/meta');

    expect(getSelected()).toEqual(snapshot);
  });

  it('should return valid coordinates with fixedRowsBottom', async() => {
    handsontable({
      data: createSpreadsheetObjectData(100, 100),
      fixedRowsBottom: 2,
      height: 200,
      width: 300
    });

    await scrollViewportTo({
      row: 99,
      col: 99,
      verticalSnap: 'bottom',
      horizontalSnap: 'end',
    });

    const bottomClone = getBottomClone();

    bottomClone.find('tbody tr:eq(1) td:last-child').simulate('mousedown');
    bottomClone.find('tbody tr:eq(1) td:last-child').simulate('mouseup');
    await render(true);

    expect(getSelected()).toEqual([[99, 99, 99, 99]]);
  });
});
