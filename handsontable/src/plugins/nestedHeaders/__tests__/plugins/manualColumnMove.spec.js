describe('NestedHeaders cooperation with ManualColumnMove', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  // hotfix for #dev-2038
  it('should set up the selection correctly for moving column', () => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      colHeaders: true,
      nestedHeaders: [
        ['a', 'b', 'c', 'd'],
        ['a', 'b', 'c', 'd']
      ],
      manualColumnMove: true,
    });

    selectColumns(1);

    $(getCell(-1, 1)).simulate('mousedown');
    $(getCell(-1, 2)).simulate('mouseover');
    $(getCell(-1, 3)).simulate('mouseover');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 9,1']);
  });
});
