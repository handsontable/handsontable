describe('Mobile selection', () => {
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

  it('should allow selecting columns by tapping on the column headers', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      colHeaders: true,
      rowHeaders: true,
      nestedHeaders: [
        ['A', { label: 'B', colspan: 8 }, 'C'],
        ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
        [
          'H', { label: 'I', colspan: 2 },
          { label: 'J', colspan: 2 },
          { label: 'K', colspan: 2 },
          { label: 'L', colspan: 2 },
          'M'
        ],
        ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'],
      ],
      width: 400,
      height: 200,
    });

    let $colHeader = spec().$container.find('.ht_clone_top thead tr:nth-child(4) th').get(2);

    simulateTouch($colHeader);

    expect(getSelected()).toEqual([[-1, 1, 9, 1]]);

    $colHeader = spec().$container.find('.ht_clone_top thead tr:nth-child(3) th').get(2);

    simulateTouch($colHeader);

    expect(getSelected()).toEqual([[-2, 1, 9, 2]]);

    $colHeader = spec().$container.find('.ht_clone_top thead tr:nth-child(2) th').get(2);

    simulateTouch($colHeader);

    expect(getSelected()).toEqual([[-3, 1, 9, 4]]);
  });
});
