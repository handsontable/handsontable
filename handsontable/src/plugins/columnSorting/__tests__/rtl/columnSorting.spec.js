describe('ColumnSorting (RTL)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');

    this.$container = $(`<div id="${id}" style="overflow: auto; width: 300px; height: 200px;"></div>`).appendTo('body');

    this.sortByClickOnColumnHeader = (columnIndex) => {
      const hot = this.$container.data('handsontable');
      const $columnHeader = $(hot.view.wt.wtTable.getColumnHeader(columnIndex));
      const $spanInsideHeader = $columnHeader.find('.columnSorting');

      if ($spanInsideHeader.length === 0) {
        throw Error('Please check the test scenario. The header doesn\'t exist.');
      }

      $spanInsideHeader.simulate('mousedown');
      $spanInsideHeader.simulate('mouseup');
      $spanInsideHeader.simulate('click');
    };
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  const arrayOfObjects = () => [
    { id: 1, name: 'Ted', lastName: 'Right' },
    { id: 2, name: 'Frank', lastName: 'Honest' },
    { id: 3, name: 'Joan', lastName: 'Well' },
    { id: 4, name: 'Sid', lastName: 'Strong' },
    { id: 5, name: 'Jane', lastName: 'Neat' },
    { id: 6, name: 'Chuck', lastName: 'Jackson' },
    { id: 7, name: 'Meg', lastName: 'Jansen' },
    { id: 8, name: 'Rob', lastName: 'Norris' },
    { id: 9, name: 'Sean', lastName: 'O\'Hara' },
    { id: 10, name: 'Eve', lastName: 'Branson' }
  ];

  const arrayOfArrays = () => [
    ['Mary', 'Brown', '01/14/2017', 6999.95, 'aa'],
    ['Henry', 'Jones', '12/01/2018', 8330, 'aaa'],
    ['Ann', 'Evans', '07/24/2021', 30500, null],
    ['Robert', 'Evans', '07/24/2019', 12464, 'abaa'],
    ['Ann', 'Williams', '01/14/2017', 33.9, 'aab'],
    ['David', 'Taylor', '02/02/2020', 7000, 'bbbb'],
    ['John', 'Brown', '07/24/2020', 2984, null],
    ['Mary', 'Brown', '01/14/2017', 4000, ''],
    ['Robert', 'Evans', '07/24/2020', 30500, undefined]
  ];

  it('should display indicator properly after changing sorted column sequence', () => {
    const hot = handsontable({
      data: [
        [1, 9, 3, 4, 5, 6, 7, 8, 9],
        [9, 8, 7, 6, 5, 4, 3, 2, 1],
        [8, 7, 6, 5, 4, 3, 3, 1, 9],
        [0, 3, 0, 5, 6, 7, 8, 9, 1]
      ],
      colHeaders: true,
      columnSorting: {
        indicator: true
      }
    });

    getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

    // changing column sequence: 0 <-> 1
    hot.columnIndexMapper.moveIndexes([1], 0);
    hot.render();

    const sortedColumn = spec().$container.find('th span.columnSorting')[1];

    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).toMatch(/url/);
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('left')).toEqual('-9px');
  });

});
