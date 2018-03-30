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

    $(getCell(5, 4)).simulate('mousedown');
    $(getCell(1, 1)).simulate('mouseover');
    $(getCell(1, 1)).simulate('mouseup');

    expect(getSelected()).toEqual([snapshot[0]]);

    keyDown('ctrl');

    $(getCell(2, 2)).simulate('mousedown');
    $(getCell(7, 2)).simulate('mouseover');
    $(getCell(7, 2)).simulate('mouseup');

    expect(getSelected()).toEqual([snapshot[0], snapshot[1]]);

    $(getCell(2, 4)).simulate('mousedown');
    $(getCell(2, 4)).simulate('mouseover');
    $(getCell(2, 4)).simulate('mouseup');

    expect(getSelected()).toEqual([snapshot[0], snapshot[1], snapshot[2]]);

    $(getCell(7, 6)).simulate('mousedown');
    $(getCell(8, 7)).simulate('mouseover');
    $(getCell(8, 7)).simulate('mouseup');

    expect(getSelected()).toEqual(snapshot);
  });
});
