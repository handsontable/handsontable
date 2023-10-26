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

  it('should return valid coordinates', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
      selectionMode: 'multiple',
    });

    const snapshot = [
      [5, 4, 1, 1],
      [2, 2, 7, 2],
      [2, 4, 2, 4],
      [7, 6, 8, 7],
    ];

    mouseDown(getCell(5, 4));
    mouseOver(getCell(1, 1));
    mouseUp(getCell(1, 1));

    expect(getSelected()).toEqual([snapshot[0]]);

    keyDown('control/meta');

    mouseDown(getCell(2, 2));
    mouseOver(getCell(7, 2));
    mouseUp(getCell(7, 2));

    expect(getSelected()).toEqual([snapshot[0], snapshot[1]]);

    mouseDown(getCell(2, 4));
    mouseOver(getCell(2, 4));
    mouseUp(getCell(2, 4));

    expect(getSelected()).toEqual([snapshot[0], snapshot[1], snapshot[2]]);

    mouseDown(getCell(7, 6));
    mouseOver(getCell(8, 7));
    mouseUp(getCell(8, 7));

    keyUp('control/meta');

    expect(getSelected()).toEqual(snapshot);
  });

  it('should return valid coordinates with fixedRowsBottom', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(100, 100),
      fixedRowsBottom: 2,
      height: 200,
      width: 300
    });

    scrollViewportTo({
      row: 99,
      col: 99,
      verticalSnap: 'bottom',
      horizontalSnap: 'end',
    });

    await sleep(100);

    const bottomClone = getBottomClone();

    bottomClone.find('tbody tr:eq(1) td:last-child').simulate('mousedown');
    bottomClone.find('tbody tr:eq(1) td:last-child').simulate('mouseup');
    render(true);

    expect(getSelected()).toEqual([[99, 99, 99, 99]]);
  });
});
