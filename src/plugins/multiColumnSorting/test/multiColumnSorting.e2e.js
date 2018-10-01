describe('MultiColumnSorting', () => {
  const id = 'testContainer';

  beforeEach(function() {
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

  it('should sort table by first visible column', () => {
    handsontable({
      data: [
        [1, 9, 3, 4, 5, 6, 7, 8, 9],
        [9, 8, 7, 6, 5, 4, 3, 2, 1],
        [8, 7, 6, 5, 4, 3, 3, 1, 9],
        [0, 3, 0, 5, 6, 7, 8, 9, 1]
      ],
      colHeaders: true,
      multiColumnSorting: true
    });

    const htCore = getHtCore();

    spec().sortByClickOnColumnHeader(0);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(htCore.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('3');
    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('0');
    expect(htCore.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('5');
  });

  it('should not change row indexes in the sorted table after using `disablePlugin` until next render is called', () => {
    handsontable({
      data: [
        [1, 9, 3, 4, 5, 6, 7, 8, 9],
        [9, 8, 7, 6, 5, 4, 3, 2, 1],
        [8, 7, 6, 5, 4, 3, 3, 1, 9],
        [0, 3, 0, 5, 6, 7, 8, 9, 1]
      ],
      colHeaders: true,
      multiColumnSorting: true
    });

    const htCore = getHtCore();

    spec().sortByClickOnColumnHeader(0);

    getPlugin('multiColumnSorting').disablePlugin();

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(htCore.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('3');
    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('0');
    expect(htCore.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('5');

    render();

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('9');
    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('3');
    expect(htCore.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('4');
  });

  it('should clear the sort performed on the table by the `clearSort` method', () => {
    handsontable({
      data: arrayOfArrays(),
      multiColumnSorting: {
        initialConfig: {
          column: 0,
          sortOrder: 'asc'
        }
      }
    });

    getPlugin('multiColumnSorting').clearSort();

    expect(getData()).toEqual(arrayOfArrays());
  });

  it('should return sorting state with visual column index under `column` key by the `getSortConfig` method', () => {
    const predefinedSortQueue = [{
      column: 0,
      sortOrder: 'asc'
    }];

    const modification = (column) => {
      if (column === 0) {
        return 1;

      } else if (column === 1) {
        return 0;
      }

      return column;
    };

    handsontable({
      data: arrayOfArrays(),
      columns: [
        {},
        {},
        { type: 'date', dateFormat: 'MM/DD/YYYY' },
        { type: 'numeric' },
        {}
      ],
      multiColumnSorting: {
        initialConfig: predefinedSortQueue
      }
    });

    expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual(predefinedSortQueue);
    expect(getPlugin('multiColumnSorting').getSortConfig(0)).toEqual({ column: 0, sortOrder: 'asc' });

    // changing column sequence: 0 <-> 1
    updateSettings({ modifyCol: modification, unmodifyCol: modification });

    expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
      column: 1,
      sortOrder: 'asc'
    }]);

    expect(getPlugin('multiColumnSorting').getSortConfig(1)).toEqual({ column: 1, sortOrder: 'asc' });
  });

  it('should set properly sort config by the `setSortConfig` method', () => {
    const sortQueue = [{
      column: 0,
      sortOrder: 'asc'
    }];

    const modification = (column) => {
      if (column === 0) {
        return 1;

      } else if (column === 1) {
        return 0;
      }

      return column;
    };

    handsontable({
      data: arrayOfArrays(),
      columns: [
        {},
        {},
        { type: 'date', dateFormat: 'MM/DD/YYYY' },
        { type: 'numeric' },
        {}
      ],
      multiColumnSorting: true
    });

    getPlugin('multiColumnSorting').setSortConfig(sortQueue);

    expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual(sortQueue);
    expect(getPlugin('multiColumnSorting').getSortConfig(0)).toEqual({ column: 0, sortOrder: 'asc' });

    // changing column sequence: 0 <-> 1
    updateSettings({ modifyCol: modification, unmodifyCol: modification });

    expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
      column: 1,
      sortOrder: 'asc'
    }]);

    expect(getPlugin('multiColumnSorting').getSortConfig(1)).toEqual({ column: 1, sortOrder: 'asc' });
  });

  it('should display indicator properly after changing sorted column sequence', () => {
    const modification = (column) => {
      if (column === 0) {
        return 1;

      } else if (column === 1) {
        return 0;
      }

      return column;
    };

    handsontable({
      data: [
        [1, 9, 3, 4, 5, 6, 7, 8, 9],
        [9, 8, 7, 6, 5, 4, 3, 2, 1],
        [8, 7, 6, 5, 4, 3, 3, 1, 9],
        [0, 3, 0, 5, 6, 7, 8, 9, 1]
      ],
      colHeaders: true,
      multiColumnSorting: {
        indicator: true
      }
    });

    getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'asc' });

    // changing column sequence: 0 <-> 1
    updateSettings({ modifyCol: modification, unmodifyCol: modification });

    const sortedColumn = spec().$container.find('th span.columnSorting')[1];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).toMatch(/url/);
  });

  it('should clear indicator after disabling plugin', () => {
    handsontable({
      data: arrayOfObjects(),
      colHeaders: true,
      multiColumnSorting: {
        initialConfig: {
          column: 0,
          sortOrder: 'asc'
        },
        indicator: true
      }
    });

    updateSettings({ multiColumnSorting: false });

    const sortedColumn = spec().$container.find('th span')[0];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).not.toMatch(/url/);
  });

  it('should render a correct number of TD elements after sorting', async() => {
    handsontable({
      data: [
        ['1\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n'],
        ['2']
      ],
      height: 100,
      colHeaders: true,
      multiColumnSorting: true
    });

    const htCore = getHtCore();

    getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'desc' });

    await sleep(300);

    expect(htCore.find('td').length).toEqual(2);
  });

  it('should apply stable sort function #3606', () => {
    handsontable({
      data: [
        ['mercedes1', 'Mercedes', 'A 160', '01/14/2007'],
        ['citroen1', 'Citroen', 'C4 Coupe', '12/01/2007'],
        ['opel1', 'Opel', 'Astra', '02/02/2006'],
        ['bmw1', 'BMW', '320i Coupe', '07/24/2009'],
        ['citroen2', 'Citroen', 'C4 Coupe', '12/01/2012'],
        ['opel2', 'Opel', 'Astra', '02/02/2004'],
        ['mercedes2', 'Mercedes', 'A 160', '01/14/2008'],
        ['citroen3', 'Citroen', 'C4 Coupe', '12/01/2007'],
        ['mercedes3', 'Mercedes', 'A 160', '01/14/2009'],
        ['opel3', 'Opel', 'Astra', '02/02/2006'],
        ['bmw2', 'BMW', '320i Coupe', '07/24/2013'],
        ['bmw3', 'BMW', '320i Coupe', '07/24/2012'],
      ],
      columns: [
        {},
        {},
        {
          type: 'date',
          dateFormat: 'mm/dd/yy'
        },
        {
          type: 'numeric'
        }
      ],
      multiColumnSorting: true
    });

    getPlugin('multiColumnSorting').sort({ column: 1, sortOrder: 'asc' }); // ASC

    expect(getDataAtCol(0)).toEqual([
      'bmw1', 'bmw2', 'bmw3',
      'citroen1', 'citroen2', 'citroen3',
      'mercedes1', 'mercedes2', 'mercedes3',
      'opel1', 'opel2', 'opel3'
    ]);

    getPlugin('multiColumnSorting').sort({ column: 1, sortOrder: 'desc' }); // DESC

    expect(getDataAtCol(0)).toEqual([
      'opel1', 'opel2', 'opel3',
      'mercedes1', 'mercedes2', 'mercedes3',
      'citroen1', 'citroen2', 'citroen3',
      'bmw1', 'bmw2', 'bmw3'
    ]);
  });

  it('should not throw an exception when clicked on the top-left corner', async() => {
    const onErrorSpy = spyOn(window, 'onerror');

    handsontable({
      colHeaders: true,
      rowHeaders: true,
      data: arrayOfObjects(),
      multiColumnSorting: true
    });

    $('.ht_clone_top_left_corner .htCore span').simulate('mousedown');
    $('.ht_clone_top_left_corner .htCore span').simulate('click');
    $('.ht_clone_top_left_corner .htCore span').simulate('mouseup');

    expect(onErrorSpy).not.toHaveBeenCalled();
  });

  it('should not throw error when trying run handsontable with columnSorting and autoRowSize in the same time.', () => {
    let errors = 0;

    try {
      handsontable({
        data: arrayOfObjects(),
        autoRowSize: true,
        multiColumnSorting: true
      });
    } catch (e) {
      errors += 1;
    }

    expect(errors).toBe(0);
  });

  it('should sort numbers descending after 2 clicks on table header', () => {
    handsontable({
      data: arrayOfObjects(),
      colHeaders: true,
      columnSorting: true
    });

    spec().sortByClickOnColumnHeader(0);
    spec().sortByClickOnColumnHeader(0);

    expect(spec().$container.find('tr td').first().html()).toEqual('10');
  });

  it('should place empty strings, null and undefined values at proper position (stability of default comparing function)', () => {
    handsontable({
      data: [
        [null, 'Ted Right'],
        [undefined, 'Jane Neat'],
        [null, 'Meg Jansen'],
        ['', 'Sean Hara'],
        ['', 'Eve Branson'],
        [6, 'Frank Honest'],
        [7, 'Joan Well'],
        [8, 'Sid Strong'],
        [9, 'Chuck Jackson'],
        [10, 'Rob Norris'],
        [11, 'Eve Well']
      ],
      multiColumnSorting: true
    });

    getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'asc' }); // ASC

    expect(getDataAtCol(1)).toEqual([
      'Frank Honest',
      'Joan Well',
      'Sid Strong',
      'Chuck Jackson',
      'Rob Norris',
      'Eve Well',
      // empty cells below
      'Ted Right',
      'Jane Neat',
      'Meg Jansen',
      'Sean Hara',
      'Eve Branson',
    ]);

    getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'desc' }); // DESC

    expect(getDataAtCol(1)).toEqual([
      'Eve Well',
      'Rob Norris',
      'Chuck Jackson',
      'Sid Strong',
      'Joan Well',
      'Frank Honest',
      // empty cells below
      'Ted Right',
      'Jane Neat',
      'Meg Jansen',
      'Sean Hara',
      'Eve Branson',
    ]);
  });

  it('should place empty strings, null and undefined values at proper position when `sortEmptyCells` option is enabled ' +
    '(API call, data type: default)', () => {
    handsontable({
      data: [
        [6, 'Frank Honest'],
        [null, 'Ted Right'],
        [7, 'Joan Well'],
        [8, 'Sid Strong'],
        [undefined, 'Jane Neat'],
        [9, 'Chuck Jackson'],
        [null, 'Meg Jansen'],
        [10, 'Rob Norris'],
        ['', 'Sean Hara'],
        ['', 'Eve Branson']
      ],
      multiColumnSorting: {
        sortEmptyCells: true
      }
    });

    getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'asc' }); // ASC

    expect(getDataAtCol(1)).toEqual([
      'Ted Right',
      'Jane Neat',
      'Meg Jansen',
      'Sean Hara',
      'Eve Branson',
      // empty cells above
      'Frank Honest',
      'Joan Well',
      'Sid Strong',
      'Chuck Jackson',
      'Rob Norris'
    ]);

    getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'desc' }); // DESC

    expect(getDataAtCol(1)).toEqual([
      'Rob Norris',
      'Chuck Jackson',
      'Sid Strong',
      'Joan Well',
      'Frank Honest',
      // empty cells below
      'Ted Right',
      'Jane Neat',
      'Meg Jansen',
      'Sean Hara',
      'Eve Branson',
    ]);
  });

  it('should place empty strings, null and undefined values at proper position when `sortEmptyCells` ' +
    'option is enabled and `column` property of `multiColumnSorting` option is set (data type: default)', () => {
    handsontable({
      data: [
        [6, 'Frank Honest'],
        [null, 'Ted Right'],
        [7, 'Joan Well'],
        [8, 'Sid Strong'],
        [undefined, 'Jane Neat'],
        [9, 'Chuck Jackson'],
        [null, 'Meg Jansen'],
        [10, 'Rob Norris'],
        ['', 'Sean Hara'],
        ['', 'Eve Branson']
      ],
      multiColumnSorting: {
        sortEmptyCells: true,
        initialConfig: {
          column: 0,
          sortOrder: 'asc'
        }
      }
    });

    // ASC

    expect(getDataAtCol(1)).toEqual([
      'Ted Right',
      'Jane Neat',
      'Meg Jansen',
      'Sean Hara',
      'Eve Branson',
      // empty cells above
      'Frank Honest',
      'Joan Well',
      'Sid Strong',
      'Chuck Jackson',
      'Rob Norris'
    ]);

    if (spec().$container) {
      destroy();
      spec().$container.remove();
    }

    handsontable({
      data: [
        [6, 'Frank Honest'],
        [null, 'Ted Right'],
        [7, 'Joan Well'],
        [8, 'Sid Strong'],
        [undefined, 'Jane Neat'],
        [9, 'Chuck Jackson'],
        [null, 'Meg Jansen'],
        [10, 'Rob Norris'],
        ['', 'Sean Hara'],
        ['', 'Eve Branson']
      ],
      multiColumnSorting: {
        sortEmptyCells: true,
        initialConfig: {
          column: 0,
          sortOrder: 'desc'
        }
      }
    });

    // DESC

    expect(getDataAtCol(1)).toEqual([
      'Rob Norris',
      'Chuck Jackson',
      'Sid Strong',
      'Joan Well',
      'Frank Honest',
      // empty cells below
      'Ted Right',
      'Jane Neat',
      'Meg Jansen',
      'Sean Hara',
      'Eve Branson',
    ]);
  });

  it('should place empty strings, null and undefined values at proper position when `sortEmptyCells` ' +
    'option is enabled and `column` property of `multiColumnSorting` option is set (data type: numeric)', () => {
    handsontable({
      data: [
        [6, 'Frank Honest'],
        [null, 'Ted Right'],
        [7, 'Joan Well'],
        [8, 'Sid Strong'],
        [undefined, 'Jane Neat'],
        [9, 'Chuck Jackson'],
        [null, 'Meg Jansen'],
        [10, 'Rob Norris'],
        ['', 'Sean Hara'],
        ['', 'Eve Branson']
      ],
      columns: [
        {
          type: 'numeric'
        },
        {}
      ],
      multiColumnSorting: {
        sortEmptyCells: true,
        initialConfig: {
          column: 0,
          sortOrder: 'asc'
        }
      }
    });

    // ASC

    expect(getDataAtCol(1)).toEqual([
      'Ted Right',
      'Jane Neat',
      'Meg Jansen',
      'Sean Hara',
      'Eve Branson',
      // empty cells above
      'Frank Honest',
      'Joan Well',
      'Sid Strong',
      'Chuck Jackson',
      'Rob Norris'
    ]);

    if (spec().$container) {
      destroy();
      spec().$container.remove();
    }

    handsontable({
      data: [
        [6, 'Frank Honest'],
        [null, 'Ted Right'],
        [7, 'Joan Well'],
        [8, 'Sid Strong'],
        [undefined, 'Jane Neat'],
        [9, 'Chuck Jackson'],
        [null, 'Meg Jansen'],
        [10, 'Rob Norris'],
        ['', 'Sean Hara'],
        ['', 'Eve Branson']
      ],
      multiColumnSorting: {
        sortEmptyCells: true,
        initialConfig: {
          column: 0,
          sortOrder: 'desc'
        }
      }
    });

    // DESC

    expect(getDataAtCol(1)).toEqual([
      'Rob Norris',
      'Chuck Jackson',
      'Sid Strong',
      'Joan Well',
      'Frank Honest',
      // empty cells below
      'Ted Right',
      'Jane Neat',
      'Meg Jansen',
      'Sean Hara',
      'Eve Branson',
    ]);
  });

  describe('isSorted', () => {
    it('should return `false` when plugin is disabled', () => {
      handsontable();

      expect(getPlugin('multiColumnSorting').isSorted()).toBeFalsy();
    });

    it('should return `false` when plugin has been disabled by the `disablePlugin` method', () => {
      handsontable({
        multiColumnSorting: {
          initialConfig: {
            column: 1,
            sortOrder: 'asc'
          }
        }
      });

      getPlugin('multiColumnSorting').disablePlugin();

      expect(getPlugin('multiColumnSorting').isSorted()).toBeFalsy();
    });

    it('should return `false` when plugin is enabled and the table was not sorted #1', () => {
      handsontable({
        multiColumnSorting: true
      });

      expect(getPlugin('multiColumnSorting').isSorted()).toBeFalsy();
    });

    it('should return `false` when plugin is enabled and the table was not sorted #2', () => {
      handsontable({
        data: [
          ['Citroen1', 'C4 Coupe', null],
          ['Mercedes1', 'A 160', '12/01/2008'],
          ['Mercedes2', 'A 160', '01/14/2006'],
        ],
        multiColumnSorting: {
          indicator: true
        }
      });

      expect(getPlugin('multiColumnSorting').isSorted()).toBeFalsy();
    });

    it('should return `true` when plugin is enabled and the table was sorted', () => {
      handsontable({
        data: [
          ['Citroen1', 'C4 Coupe', null],
          ['Mercedes1', 'A 160', '12/01/2008'],
          ['Mercedes2', 'A 160', '01/14/2006'],
        ],
        multiColumnSorting: {
          initialConfig: {
            column: 1,
            sortOrder: 'asc'
          }
        }
      });

      expect(getPlugin('multiColumnSorting').isSorted()).toBeTruthy();
    });

    it('should be handled properly when using the `updateSettings`', () => {
      handsontable({
        data: [
          ['Citroen1', 'C4 Coupe', null],
          ['Mercedes1', 'A 160', '12/01/2008'],
          ['Mercedes2', 'A 160', '01/14/2006'],
        ],
        multiColumnSorting: {
          initialConfig: {
            column: 1,
            sortOrder: 'asc'
          }
        }
      });

      updateSettings({
        multiColumnSorting: true
      });

      expect(getPlugin('multiColumnSorting').isSorted()).toBeTruthy();

      updateSettings({
        multiColumnSorting: {
          initialConfig: {
            column: 1,
            sortOrder: 'desc'
          }
        }
      });

      expect(getPlugin('multiColumnSorting').isSorted()).toBeTruthy();

      updateSettings({
        multiColumnSorting: false
      });

      expect(getPlugin('multiColumnSorting').isSorted()).toBeFalsy();
    });
  });

  describe('data type: date', () => {
    it('should place empty strings, null and undefined values at proper position when `sortEmptyCells` ' +
      'option is enabled and `column` property of `multiColumnSorting` option is set', () => {
      handsontable({
        data: [
          ['Citroen1', 'C4 Coupe', null],
          ['Mercedes1', 'A 160', '12/01/2008'],
          ['Mercedes2', 'A 160', '01/14/2006'],
          ['Citroen2', 'C4 Coupe', undefined],
          ['Audi1', 'A4 Avant', '11/19/2011'],
          ['Opel1', 'Astra', '02/02/2004'],
          ['Citroen3', 'C4 Coupe', null],
          ['BMW1', '320i Coupe', '07/24/2011'],
          ['Citroen4', 'C4 Coupe', ''],
          ['Citroen5', 'C4 Coupe', ''],
        ],
        columns: [
          {},
          {},
          {
            type: 'date',
            dateFormat: 'MM/DD/YYYY'
          }
        ],
        multiColumnSorting: {
          sortEmptyCells: true,
          initialConfig: {
            column: 2,
            sortOrder: 'asc'
          }
        }
      });

      // ASC

      expect(getDataAtCol(0)).toEqual([
        'Citroen1',
        'Citroen2',
        'Citroen3',
        'Citroen4',
        'Citroen5',
        // empty cells above
        'Opel1',
        'Mercedes2',
        'Mercedes1',
        'BMW1',
        'Audi1'
      ]);

      if (spec().$container) {
        destroy();
        spec().$container.remove();
      }

      handsontable({
        data: [
          ['Citroen1', 'C4 Coupe', null],
          ['Mercedes1', 'A 160', '12/01/2008'],
          ['Mercedes2', 'A 160', '01/14/2006'],
          ['Citroen2', 'C4 Coupe', undefined],
          ['Audi1', 'A4 Avant', '11/19/2011'],
          ['Opel1', 'Astra', '02/02/2004'],
          ['Citroen3', 'C4 Coupe', null],
          ['BMW1', '320i Coupe', '07/24/2011'],
          ['Citroen4', 'C4 Coupe', ''],
          ['Citroen5', 'C4 Coupe', ''],
        ],
        columns: [
          {},
          {},
          {
            type: 'date',
            dateFormat: 'MM/DD/YYYY'
          }
        ],
        multiColumnSorting: {
          sortEmptyCells: true,
          initialConfig: {
            column: 2,
            sortOrder: 'desc'
          }
        }
      });

      // DESC

      expect(getDataAtCol(0)).toEqual([
        'Audi1',
        'BMW1',
        'Mercedes1',
        'Mercedes2',
        'Opel1',
        // empty cells below
        'Citroen1',
        'Citroen2',
        'Citroen3',
        'Citroen4',
        'Citroen5'
      ]);
    });

    it('should sort date columns (MM/DD/YYYY)', () => {
      handsontable({
        data: [
          ['Mercedes', 'A 160', '01/14/2006', 6999.9999],
          ['Citroen', 'C4 Coupe', '12/01/2008', 8330],
          ['Audi', 'A4 Avant', '11/19/2011', 33900],
          ['Opel', 'Astra', '02/02/2004', 7000],
          ['BMW', '320i Coupe', '07/24/2011', 30500]
        ],
        columns: [
          {},
          {},
          {
            type: 'date',
            dateFormat: 'MM/DD/YYYY'
          },
          {
            type: 'numeric'
          }
        ],
        colHeaders: true,
        multiColumnSorting: true
      });

      getPlugin('multiColumnSorting').sort({ column: 2, sortOrder: 'asc' }); // ASC

      expect(getDataAtRow(0)).toEqual(['Opel', 'Astra', '02/02/2004', 7000]);
      expect(getDataAtRow(1)).toEqual(['Mercedes', 'A 160', '01/14/2006', 6999.9999]);
      expect(getDataAtRow(2)).toEqual(['Citroen', 'C4 Coupe', '12/01/2008', 8330]);
      expect(getDataAtRow(3)).toEqual(['BMW', '320i Coupe', '07/24/2011', 30500]);
      expect(getDataAtRow(4)).toEqual(['Audi', 'A4 Avant', '11/19/2011', 33900]);

      getPlugin('multiColumnSorting').sort({ column: 2, sortOrder: 'desc' }); // DESC

      expect(getDataAtRow(0)).toEqual(['Audi', 'A4 Avant', '11/19/2011', 33900]);
      expect(getDataAtRow(1)).toEqual(['BMW', '320i Coupe', '07/24/2011', 30500]);
      expect(getDataAtRow(2)).toEqual(['Citroen', 'C4 Coupe', '12/01/2008', 8330]);
      expect(getDataAtRow(3)).toEqual(['Mercedes', 'A 160', '01/14/2006', 6999.9999]);
      expect(getDataAtRow(4)).toEqual(['Opel', 'Astra', '02/02/2004', 7000]);
    });

    it('should sort date columns (DD/MM/YYYY)', () => {
      handsontable({
        data: [
          ['Mercedes', 'A 160', '01/12/2012', 6999.9999],
          ['Citroen', 'C4 Coupe', '12/01/2013', 8330],
          ['Audi', 'A4 Avant', '11/10/2014', 33900],
          ['Opel', 'Astra', '02/02/2015', 7000],
          ['BMW', '320i Coupe', '07/02/2013', 30500]
        ],
        columns: [
          {},
          {},
          {
            type: 'date',
            dateFormat: 'DD/MM/YYYY'
          },
          {
            type: 'numeric'
          }
        ],
        colHeaders: true,
        multiColumnSorting: true
      });

      getPlugin('multiColumnSorting').sort({ column: 2, sortOrder: 'asc' }); // ASC

      expect(getDataAtRow(0)).toEqual(['Mercedes', 'A 160', '01/12/2012', 6999.9999]);
      expect(getDataAtRow(1)).toEqual(['Citroen', 'C4 Coupe', '12/01/2013', 8330]);
      expect(getDataAtRow(2)).toEqual(['BMW', '320i Coupe', '07/02/2013', 30500]);
      expect(getDataAtRow(3)).toEqual(['Audi', 'A4 Avant', '11/10/2014', 33900]);
      expect(getDataAtRow(4)).toEqual(['Opel', 'Astra', '02/02/2015', 7000]);

      getPlugin('multiColumnSorting').sort({ column: 2, sortOrder: 'desc' }); // DESC

      expect(getDataAtRow(0)).toEqual(['Opel', 'Astra', '02/02/2015', 7000]);
      expect(getDataAtRow(1)).toEqual(['Audi', 'A4 Avant', '11/10/2014', 33900]);
      expect(getDataAtRow(2)).toEqual(['BMW', '320i Coupe', '07/02/2013', 30500]);
      expect(getDataAtRow(3)).toEqual(['Citroen', 'C4 Coupe', '12/01/2013', 8330]);
      expect(getDataAtRow(4)).toEqual(['Mercedes', 'A 160', '01/12/2012', 6999.9999]);
    });

    it('should sort date columns (MMMM Do YYYY)', () => {
      handsontable({
        data: [
          ['Mercedes', 'A 160', 'October 28th 2016', 6999.9999],
          ['Citroen', 'C4 Coupe', 'October 27th 2001', 8330],
          ['Audi', 'A4 Avant', 'July 8th 1999', 33900],
          ['Opel', 'Astra', 'June 1st 2001', 7000],
          ['BMW', '320i Coupe', 'August 3rd 2001', 30500]
        ],
        columns: [
          {},
          {},
          {
            type: 'date',
            dateFormat: 'MMMM Do YYYY'
          },
          {
            type: 'numeric'
          }
        ],
        colHeaders: true,
        multiColumnSorting: true
      });

      getPlugin('multiColumnSorting').sort({ column: 2, sortOrder: 'asc' }); // ASC

      expect(getDataAtRow(0)).toEqual(['Audi', 'A4 Avant', 'July 8th 1999', 33900]);
      expect(getDataAtRow(1)).toEqual(['Opel', 'Astra', 'June 1st 2001', 7000]);
      expect(getDataAtRow(2)).toEqual(['BMW', '320i Coupe', 'August 3rd 2001', 30500]);
      expect(getDataAtRow(3)).toEqual(['Citroen', 'C4 Coupe', 'October 27th 2001', 8330]);
      expect(getDataAtRow(4)).toEqual(['Mercedes', 'A 160', 'October 28th 2016', 6999.9999]);

      getPlugin('multiColumnSorting').sort({ column: 2, sortOrder: 'desc' }); // DESC

      expect(getDataAtRow(0)).toEqual(['Mercedes', 'A 160', 'October 28th 2016', 6999.9999]);
      expect(getDataAtRow(1)).toEqual(['Citroen', 'C4 Coupe', 'October 27th 2001', 8330]);
      expect(getDataAtRow(2)).toEqual(['BMW', '320i Coupe', 'August 3rd 2001', 30500]);
      expect(getDataAtRow(3)).toEqual(['Opel', 'Astra', 'June 1st 2001', 7000]);
      expect(getDataAtRow(4)).toEqual(['Audi', 'A4 Avant', 'July 8th 1999', 33900]);
    });

    it('should sort date columns along with empty and null values', () => {
      handsontable({
        data: [
          ['Mercedes', 'A 160', '01/14/2006', 6999.9999],
          ['Citroen', 'C4 Coupe', '12/01/2008', 8330],
          ['Citroen', 'C4 Coupe null', null, 8330],
          ['Citroen', 'C4 Coupe empty', '', 8330],
          ['Audi', 'A4 Avant', '11/19/2011', 33900],
          ['Opel', 'Astra', '02/02/2004', 7000],
          ['BMW', '320i Coupe', '07/24/2011', 30500]
        ],
        columns: [
          {},
          {},
          {
            type: 'date',
            dateFormat: 'mm/dd/yy'
          },
          {
            type: 'numeric'
          }
        ],
        colHeaders: true,
        multiColumnSorting: true
      });

      getPlugin('multiColumnSorting').sort({ column: 2, sortOrder: 'asc' }); // ASC

      expect(getDataAtRow(0)).toEqual(['Mercedes', 'A 160', '01/14/2006', 6999.9999]);
      expect(getDataAtRow(1)).toEqual(['Opel', 'Astra', '02/02/2004', 7000]);
      expect(getDataAtRow(2)).toEqual(['BMW', '320i Coupe', '07/24/2011', 30500]);
      expect(getDataAtRow(3)).toEqual(['Audi', 'A4 Avant', '11/19/2011', 33900]);
      expect(getDataAtRow(4)).toEqual(['Citroen', 'C4 Coupe', '12/01/2008', 8330]);

      getPlugin('multiColumnSorting').sort({ column: 2, sortOrder: 'desc' }); // DESC

      expect(getDataAtRow(0)).toEqual(['Citroen', 'C4 Coupe', '12/01/2008', 8330]);
      expect(getDataAtRow(1)).toEqual(['Audi', 'A4 Avant', '11/19/2011', 33900]);
      expect(getDataAtRow(2)).toEqual(['BMW', '320i Coupe', '07/24/2011', 30500]);
      expect(getDataAtRow(3)).toEqual(['Opel', 'Astra', '02/02/2004', 7000]);
      expect(getDataAtRow(4)).toEqual(['Mercedes', 'A 160', '01/14/2006', 6999.9999]);
    });
  });

  describe('data type: time', () => {
    it('should properly rewrite time into correct format after sort', (done) => {
      handsontable({
        data: [
          ['0:00:01 am'],
          ['5:30:14 pm'],
          ['8:00:00 pm'],
          ['11:15:05 am'],
          ['4:07:48 am']
        ],
        columns: [
          {
            type: 'time',
            dateFormat: 'h:mm:ss a',
            correctFormat: true
          }
        ],
        colHeaders: true,
        multiColumnSorting: {
          initialConfig: {
            column: 0,
            sortOrder: 'desc'
          }
        }
      });

      setDataAtCell(0, 0, '19:55', 'edit');

      setTimeout(() => {
        expect(getDataAtCell(0, 0)).toEqual('7:55:00 pm');
        done();
      }, 250);
    });
  });

  it('should properly sort numeric data', () => {
    handsontable({
      data: [
        ['Mercedes', 'A 160', '01/14/2006', '6999.9999'],
        ['Citroen', 'C4 Coupe', '12/01/2008', 8330],
        ['Citroen', 'C4 Coupe null', null, '8330'],
        ['Citroen', 'C4 Coupe empty', '', 8333],
        ['Audi', 'A4 Avant', '11/19/2011', '33900'],
        ['Opel', 'Astra', '02/02/2004', '7000'],
        ['BMW', '320i Coupe', '07/24/2011', 30500]
      ],
      columns: [
        {},
        {},
        {},
        {
          type: 'numeric'
        }
      ],
      colHeaders: true,
      multiColumnSorting: true
    });

    spec().sortByClickOnColumnHeader(3);

    expect(getDataAtCol(3)).toEqual(['6999.9999', '7000', 8330, '8330', 8333, 30500, '33900']);

    spec().sortByClickOnColumnHeader(3);

    expect(getDataAtCol(3)).toEqual(['33900', 30500, 8333, 8330, '8330', '7000', '6999.9999']);

    spec().sortByClickOnColumnHeader(3);

    expect(getDataAtCol(3)).toEqual(['6999.9999', 8330, '8330', 8333, '33900', '7000', 30500]);
  });

  it('should sort table with multiple row headers', () => {
    handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      columns: [
        {},
        {},
        {
          type: 'date',
          dateFormat: 'mm/dd/yy'
        },
        {
          type: 'numeric'
        }
      ],
      colHeaders: true,
      multiColumnSorting: true
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');

    spec().sortByClickOnColumnHeader(0); // sort by first column

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');

    expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('D');

    spec().sortByClickOnColumnHeader(1); // sort by second column

    expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A');
  });

  it('should allow to define sorting column and order during initialization', () => {
    handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      colHeaders: true,
      multiColumnSorting: {
        initialConfig: {
          column: 0,
          sortOrder: 'asc'
        }
      }
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('D');
  });

  it('should allow to change sorting column with updateSettings', () => {
    handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      colHeaders: true,
      multiColumnSorting: {
        initialConfig: {
          column: 0,
          sortOrder: 'asc'
        }
      }
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('D');

    updateSettings({
      multiColumnSorting: {
        initialConfig: {
          column: 1,
          sortOrder: 'asc'
        }
      }
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
    expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A');
  });

  it('should allow to change sort order with updateSettings', () => {
    handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      colHeaders: true,
      multiColumnSorting: {
        initialConfig: {
          column: 0,
          sortOrder: 'asc'
        }
      }
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');

    updateSettings({
      multiColumnSorting: {
        initialConfig: {
          column: 0,
          sortOrder: 'desc'
        }
      }
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
  });

  it('should allow to change if sorting empty cells with updateSettings', () => {
    handsontable({
      data: [
        [1, 'B'],
        [2, ''],
        [3, 'A'],
        [4, ''],
        [6, 'E'],
        [7, ''],
        [8, 'F'],
      ],
      colHeaders: true,
      multiColumnSorting: {
        sortEmptyCells: false,
        initialConfig: {
          column: 1,
          sortOrder: 'desc'
        }
      }
    });

    updateSettings({
      multiColumnSorting: {
        sortEmptyCells: true,
        initialConfig: {
          column: 1,
          sortOrder: 'asc'
        }
      }
    });

    // ASC with empty cells sorting
    expect(getDataAtCol(0)).toEqual([2, 4, 7, 3, 1, 6, 8]);

    updateSettings({
      multiColumnSorting: {
        sortEmptyCells: false,
        initialConfig: {
          column: 1,
          sortOrder: 'asc'
        }
      }
    });

    // ASC without empty cells sorting
    expect(getDataAtCol(0)).toEqual([3, 1, 6, 8, 2, 4, 7]);
  });

  it('should NOT sort spare rows', () => {
    const myData = [
      { a: 'aaa', b: 2, c: 3 },
      { a: 'z', b: 11, c: -4 },
      { a: 'dddd', b: 13, c: 13 },
      { a: 'bbbb', b: 10, c: 11 }
    ];

    function customIsEmptyRow(row) {
      const data = this.getSourceData();
      return data[row].isNew;
    }

    handsontable({
      data: myData,
      rowHeaders: true,
      colHeaders: ['A', 'B', 'C'],
      columns: [
        { data: 'a', type: 'text' },
        { data: 'b', type: 'text' },
        { data: 'c', type: 'text' }
      ],
      dataSchema: { isNew: true, a: false }, // default for a to avoid #bad value#
      multiColumnSorting: true,
      minSpareRows: 3,
      isEmptyRow: customIsEmptyRow
    });

    // ASC

    updateSettings({
      multiColumnSorting: {
        initialConfig: {
          column: 0,
          sortOrder: 'asc'
        }
      }
    });

    expect(getData()).toEqual([
      ['aaa', 2, 3],
      ['bbbb', 10, 11],
      ['dddd', 13, 13],
      ['z', 11, -4],
      [false, null, null],
      [false, null, null],
      [false, null, null]
    ]);

    updateSettings({
      multiColumnSorting: {
        initialConfig: {
          column: 0,
          sortOrder: 'desc'
        }
      }
    });

    expect(getData()).toEqual([
      ['z', 11, -4],
      ['dddd', 13, 13],
      ['bbbb', 10, 11],
      ['aaa', 2, 3],
      [false, null, null],
      [false, null, null],
      [false, null, null]
    ]);
  });

  it('should reset column sorting with updateSettings', () => {
    handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      colHeaders: true,
      multiColumnSorting: {
        initialConfig: {
          column: 0,
          sortOrder: 'asc'
        }
      }
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');

    updateSettings({
      multiColumnSorting: void 0
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
  });

  it('should sort table using plugin API method', () => {
    handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      multiColumnSorting: true
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('0');
    expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
    expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('2');

    getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'asc' });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
    expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
    expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');
  });

  it('should fire beforeColumnSort event before sorting data', () => {
    handsontable({
      data: [
        [2],
        [4],
        [1],
        [3]
      ],
      multiColumnSorting: true
    });

    const beforeColumnSortHandler = jasmine.createSpy('beforeColumnSortHandler');

    addHook('beforeColumnSort', beforeColumnSortHandler);

    getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'asc' });

    expect(beforeColumnSortHandler.calls.count()).toEqual(1);
    expect(beforeColumnSortHandler).toHaveBeenCalledWith([], [{
      column: 0,
      sortOrder: 'asc'
    }], true, void 0, void 0, void 0);
  });

  it('should not sorting column when beforeColumnSort returns false', (done) => {
    handsontable({
      data: [
        [2],
        [4],
        [1],
        [3]
      ],
      multiColumnSorting: true,
      beforeColumnSort() {
        return false;
      }
    });

    getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'asc' });

    setTimeout(() => {
      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('4');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');
      done();
    }, 200);
  });

  it('should add beforeColumnSort event listener in constructor', () => {
    const beforeColumnSortCallback = jasmine.createSpy('beforeColumnSortHandler');

    handsontable({
      data: [[2], [4], [1], [3]],
      multiColumnSorting: true,
      beforeColumnSort: beforeColumnSortCallback
    });

    getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'asc' });

    expect(beforeColumnSortCallback.calls.count()).toEqual(1);
    expect(beforeColumnSortCallback).toHaveBeenCalledWith([], [{
      column: 0,
      sortOrder: 'asc'
    }], true, void 0, void 0, void 0);
  });

  it('should fire afterColumnSort event after data has been sorted', () => {
    handsontable({
      data: [
        [2],
        [4],
        [1],
        [3]
      ],
      multiColumnSorting: true
    });

    const afterColumnSortHandler = jasmine.createSpy('afterColumnSortHandler');

    addHook('afterColumnSort', afterColumnSortHandler);

    getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'asc' });

    expect(afterColumnSortHandler.calls.count()).toBe(1);
    expect(afterColumnSortHandler).toHaveBeenCalledWith([], [{
      column: 0,
      sortOrder: 'asc'
    }], true, void 0, void 0, void 0);
  });

  it('should add afterColumnSort event listener in constructor', () => {
    const afterColumnSortCallback = jasmine.createSpy('afterColumnSortHandler');

    handsontable({
      data: [[2], [4], [1], [3]],
      multiColumnSorting: true,
      afterColumnSort: afterColumnSortCallback
    });

    getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'asc' });

    expect(afterColumnSortCallback.calls.count()).toEqual(1);
    expect(afterColumnSortCallback).toHaveBeenCalledWith([], [{
      column: 0,
      sortOrder: 'asc'
    }], true, void 0, void 0, void 0);
  });

  it('should fire hooks with proper hook argument when sorting is not possible', () => {
    const beforeColumnSortCallback = jasmine.createSpy('beforeColumnSort');
    const afterColumnSortCallback = jasmine.createSpy('afterColumnSort');
    const warnSpy = spyOn(console, 'warn');

    handsontable({
      data: [[2], [4], [1], [3]],
      multiColumnSorting: true,
      beforeColumnSort: beforeColumnSortCallback,
      afterColumnSort: afterColumnSortCallback
    });

    getPlugin('multiColumnSorting').sort({ column: 1000, sortOrder: 'asc' });
    expect(beforeColumnSortCallback).toHaveBeenCalledWith([], [{
      column: 1000,
      sortOrder: 'asc'
    }], false, void 0, void 0, void 0);

    // "After" hook always run! Team decision.

    expect(afterColumnSortCallback).toHaveBeenCalledWith([], [], false, void 0, void 0, void 0);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should insert row when plugin is enabled, but table hasn\'t been sorted', () => {
    handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      multiColumnSorting: true
    });

    expect(countRows()).toEqual(4);

    alter('insert_row');

    expect(countRows()).toEqual(5);
  });

  it('should apply sorting when there are two tables and only one has sorting enabled and has been already sorted (#1020)', () => {
    handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      multiColumnSorting: {
        initialConfig: {
          column: 1,
          sortOrder: 'asc'
        }
      }
    });

    spec().$container2 = $(`<div id='${id}-2'></div>`).appendTo('body');
    spec().$container2.handsontable();

    selectCell(0, 1);
    keyDown('enter');
    expect($('.handsontableInput').val()).toEqual('A');

    spec().$container2.handsontable('destroy');
    spec().$container2.remove();
  });

  it('should return updated data at specyfied row after sorted', () => {
    handsontable({
      data: [
        [1, 'Ted', 'Right'],
        [2, 'Frank', 'Honest'],
        [3, 'Joan', 'Well'],
        [4, 'Sid', 'Strong'],
        [5, 'Jane', 'Neat']
      ],
      colHeaders: true,
      rowHeaders: true,
      multiColumnSorting: true
    });

    spec().sortByClickOnColumnHeader(0);

    expect(getDataAtRow(0)).toEqual([1, 'Ted', 'Right']);
    expect(getDataAtRow(4)).toEqual([5, 'Jane', 'Neat']);

    spec().sortByClickOnColumnHeader(0);

    expect(getDataAtRow(0)).toEqual([5, 'Jane', 'Neat']);
    expect(getDataAtRow(4)).toEqual([1, 'Ted', 'Right']);

    spec().sortByClickOnColumnHeader(0);

    expect(getDataAtRow(0)).toEqual([1, 'Ted', 'Right']);
    expect(getDataAtRow(4)).toEqual([5, 'Jane', 'Neat']);
  });

  it('should return updated data at specyfied col after sorted', () => {
    handsontable({
      data: [
        [1, 'Ted', 'Right'],
        [2, 'Frank', 'Honest'],
        [3, 'Joan', 'Well'],
        [4, 'Sid', 'Strong'],
        [5, 'Jane', 'Neat']
      ],
      colHeaders: true,
      rowHeaders: true,
      multiColumnSorting: true
    });

    spec().sortByClickOnColumnHeader(0);

    expect(getDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
    expect(getDataAtCol(1)).toEqual(['Ted', 'Frank', 'Joan', 'Sid', 'Jane']);

    spec().sortByClickOnColumnHeader(0);

    expect(getDataAtCol(0)).toEqual([5, 4, 3, 2, 1]);
    expect(getDataAtCol(1)).toEqual(['Jane', 'Sid', 'Joan', 'Frank', 'Ted']);

    spec().sortByClickOnColumnHeader(0);

    expect(getDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
    expect(getDataAtCol(1)).toEqual(['Ted', 'Frank', 'Joan', 'Sid', 'Jane']);
  });

  it('should return original data source at specified row after sorted', () => {
    handsontable({
      data: [
        [1, 'Ted', 'Right'],
        [2, 'Frank', 'Honest'],
        [3, 'Joan', 'Well'],
        [4, 'Sid', 'Strong'],
        [5, 'Jane', 'Neat']
      ],
      colHeaders: true,
      rowHeaders: true,
      multiColumnSorting: true
    });

    spec().sortByClickOnColumnHeader(0);

    expect(getDataAtRow(0)).toEqual([1, 'Ted', 'Right']);
    expect(getDataAtRow(4)).toEqual([5, 'Jane', 'Neat']);

    expect(getSourceDataAtRow(0)).toEqual([1, 'Ted', 'Right']);
    expect(getSourceDataAtRow(4)).toEqual([5, 'Jane', 'Neat']);

    spec().sortByClickOnColumnHeader(0);

    expect(getDataAtRow(0)).toEqual([5, 'Jane', 'Neat']);
    expect(getDataAtRow(4)).toEqual([1, 'Ted', 'Right']);

    expect(getSourceDataAtRow(0)).toEqual([1, 'Ted', 'Right']);
    expect(getSourceDataAtRow(4)).toEqual([5, 'Jane', 'Neat']);

  });

  it('should return original data source at specified col after sorted', () => {
    handsontable({
      data: [
        [1, 'Ted', 'Right'],
        [2, 'Frank', 'Honest'],
        [3, 'Joan', 'Well'],
        [4, 'Sid', 'Strong'],
        [5, 'Jane', 'Neat']
      ],
      colHeaders: true,
      rowHeaders: true,
      multiColumnSorting: true
    });

    spec().sortByClickOnColumnHeader(0);

    expect(getDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
    expect(getDataAtCol(1)).toEqual(['Ted', 'Frank', 'Joan', 'Sid', 'Jane']);

    expect(getSourceDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
    expect(getSourceDataAtCol(1)).toEqual(['Ted', 'Frank', 'Joan', 'Sid', 'Jane']);

    spec().sortByClickOnColumnHeader(0);

    expect(getDataAtCol(0)).toEqual([5, 4, 3, 2, 1]);
    expect(getDataAtCol(1)).toEqual(['Jane', 'Sid', 'Joan', 'Frank', 'Ted']);

    expect(getSourceDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
    expect(getSourceDataAtCol(1)).toEqual(['Ted', 'Frank', 'Joan', 'Sid', 'Jane']);

    spec().sortByClickOnColumnHeader(0);

    expect(getDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
    expect(getDataAtCol(1)).toEqual(['Ted', 'Frank', 'Joan', 'Sid', 'Jane']);

    expect(getSourceDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
    expect(getSourceDataAtCol(1)).toEqual(['Ted', 'Frank', 'Joan', 'Sid', 'Jane']);
  });

  it('should ignore case when sorting', () => {
    handsontable({
      data: [
        [1, 'albuquerque'],
        [2, 'Alabama'],
        [3, 'Missouri']
      ],
      colHeaders: true,
      multiColumnSorting: true
    });

    spec().sortByClickOnColumnHeader(1);
    expect(getDataAtCol(0)).toEqual([2, 1, 3]);
    expect(getDataAtCol(1)).toEqual(['Alabama', 'albuquerque', 'Missouri']);

    spec().sortByClickOnColumnHeader(1);
    expect(getDataAtCol(0)).toEqual([3, 1, 2]);
    expect(getDataAtCol(1)).toEqual(['Missouri', 'albuquerque', 'Alabama']);

  });

  it('should push empty cells to the end of sorted column', () => {
    handsontable({
      data: [
        [1, 'Ted', 'Right'],
        [2, '', 'Honest'],
        [3, '', 'Well'],
        [4, 'Sid', 'Strong'],
        [5, 'Jane', 'Neat'],
      ],
      colHeaders: true,
      rowHeaders: true,
      multiColumnSorting: true,
      minSpareRows: 1
    });

    spec().sortByClickOnColumnHeader(1);
    expect(getDataAtCol(0)).toEqual([5, 4, 1, 2, 3, null]);
    expect(getDataAtCol(1)).toEqual(['Jane', 'Sid', 'Ted', '', '', null]);

    spec().sortByClickOnColumnHeader(1);
    expect(getDataAtCol(0)).toEqual([1, 4, 5, 2, 3, null]);
    expect(getDataAtCol(1)).toEqual(['Ted', 'Sid', 'Jane', '', '', null]);

  });

  it('should push numeric values before non-numeric values, when sorting ascending using the default sorting function', () => {
    handsontable({
      data: [
        [1, 'Ted', 123],
        [2, '', 'Some'],
        [3, '', 321],
        [4, 'Sid', 'String'],
        [5, 'Jane', 46]
      ],
      colHeaders: true,
      multiColumnSorting: true
    });

    spec().sortByClickOnColumnHeader(2);
    expect(getDataAtCol(2)).toEqual([46, 123, 321, 'Some', 'String']);

    spec().sortByClickOnColumnHeader(2);
    expect(getDataAtCol(2)).toEqual(['String', 'Some', 321, 123, 46]);

  });

  it('should add a sorting indicator to the column header after it\'s been sorted, if indicator property is set to true (by default)', () => {
    handsontable({
      data: [
        [1, 'Ted', 'Right'],
        [2, '', 'Honest'],
        [3, '', 'Well'],
        [4, 'Sid', 'Strong'],
        [5, 'Jane', 'Neat'],
      ],
      colHeaders: true,
      multiColumnSorting: true
    });

    spec().sortByClickOnColumnHeader(1);

    let sortedColumn = spec().$container.find('th span.columnSorting')[1];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).toMatch(/url/);

    // ---------------------------------
    // INDICATOR SET FOR THE WHOLE TABLE
    // ---------------------------------

    updateSettings({
      columns() {
        return {
          multiColumnSorting: {
            indicator: true
          }
        };
      },
    });

    spec().sortByClickOnColumnHeader(1);

    // descending (updateSettings doesn't reset sorting stack)
    sortedColumn = spec().$container.find('th span.columnSorting')[1];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).toMatch(/url/);

    spec().sortByClickOnColumnHeader(1);

    sortedColumn = spec().$container.find('th span.columnSorting')[1];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).not.toMatch(/url/);

    spec().sortByClickOnColumnHeader(1);

    // ascending
    sortedColumn = spec().$container.find('th span.columnSorting')[1];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).toMatch(/url/);

    // ---------------------------------
    // INDICATOR SET FOR A SINGLE COLUMN
    // ---------------------------------

    updateSettings({
      columns(column) {
        if (column === 2) {
          return {
            multiColumnSorting: {
              indicator: false
            }
          };
        }

        return {};
      }
    });

    spec().sortByClickOnColumnHeader(0);

    sortedColumn = spec().$container.find('th span.columnSorting')[0];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).toMatch(/url/);

    spec().sortByClickOnColumnHeader(1);

    // descending
    sortedColumn = spec().$container.find('th span.columnSorting')[1];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).toMatch(/url/);

    spec().sortByClickOnColumnHeader(2);

    sortedColumn = spec().$container.find('th span.columnSorting')[2];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).not.toMatch(/url/);
  });

  it('should change sorting indicator state on every plugin API method (calling for different columns)', () => {
    handsontable({
      data: [
        [1, 'Ted', 'Right'],
        [2, '', 'Honest'],
        [3, '', 'Well'],
        [4, 'Sid', 'Strong'],
        [5, 'Jane', 'Neat'],
      ],
      colHeaders: true,
      multiColumnSorting: {
        indicator: true
      },
    });

    getPlugin('multiColumnSorting').sort({ column: 1, sortOrder: 'asc' });

    // ascending
    let sortedColumn = spec().$container.find('th span.columnSorting')[1];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).toMatch(/url/);

    getPlugin('multiColumnSorting').sort({ column: 2, sortOrder: 'asc' });

    // ascending
    sortedColumn = spec().$container.find('th span.columnSorting')[2];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).toMatch(/url/);

    getPlugin('multiColumnSorting').sort({ column: 1, sortOrder: 'asc' });

    // ascending
    sortedColumn = spec().$container.find('th span.columnSorting')[1];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).toMatch(/url/);

    getPlugin('multiColumnSorting').sort({ column: 2, sortOrder: 'desc' });

    // descending
    sortedColumn = spec().$container.find('th span.columnSorting')[2];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).toMatch(/url/);

    getPlugin('multiColumnSorting').sort({ column: 2, sortOrder: 'desc' });

    // descending
    sortedColumn = spec().$container.find('th span.columnSorting')[2];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).toMatch(/url/);

    getPlugin('multiColumnSorting').sort({ column: 2, sortOrder: 'asc' });

    // ascending
    sortedColumn = spec().$container.find('th span.columnSorting')[2];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).toMatch(/url/);
  });

  it('should change sorting indicator state when initial column sorting was provided', () => {
    handsontable({
      data: [
        [1, 'Ted', 'Right'],
        [2, '', 'Honest'],
        [3, '', 'Well'],
        [4, 'Sid', 'Strong'],
        [5, 'Jane', 'Neat'],
      ],
      colHeaders: true,
      multiColumnSorting: {
        indicator: true,
        initialConfig: {
          column: 1,
          sortOrder: 'desc'
        }
      },
    });

    // descending
    let sortedColumn = spec().$container.find('th span.columnSorting')[1];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).toMatch(/url/);

    getPlugin('multiColumnSorting').sort();

    // default
    sortedColumn = spec().$container.find('th span.columnSorting')[1];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).not.toMatch(/url/);

    getPlugin('multiColumnSorting').sort({ column: 1, sortOrder: 'asc' });

    // ascending
    sortedColumn = spec().$container.find('th span.columnSorting')[1];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).toMatch(/url/);

    getPlugin('multiColumnSorting').sort({ column: 1, sortOrder: 'desc' });

    // descending
    sortedColumn = spec().$container.find('th span.columnSorting')[1];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).toMatch(/url/);

    getPlugin('multiColumnSorting').sort();

    // default
    sortedColumn = spec().$container.find('th span.columnSorting')[1];
    expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).not.toMatch(/url/);
  });

  it('should properly sort the table, when it\'s scrolled to the far right', () => {
    const data = [
      ['Jasmine Ferguson', 'Britney Carey', 'Kelly Decker', 'Lacey Mcleod', 'Leona Shaffer', 'Kelli Ochoa',
        'Adele Roberson', 'Viola Snow', 'Barron Cherry', 'Calhoun Lane', 'Elvia Andrews', 'Katheryn Dale', 'Dorthy Hale',
        'Munoz Randall', 'Fields Morse', 'Hubbard Nichols', 'Chang Yang', 'Osborn Anthony', 'Owens Warner', 'Gloria Hampton'],
      ['Lane Hill', 'Belinda Mathews', 'York Gray', 'Celina Stone', 'Victoria Mays', 'Angelina Lott', 'Joyce Mason', 'Shawn Rodriguez',
        'Susanna Mayo', 'Wolf Fuller', 'Long Hester', 'Dudley Doyle', 'Wilder Sutton', 'Oneal Avery', 'James Mclaughlin',
        'Lenora Guzman', 'Mcmahon Sullivan', 'Abby Weeks', 'Beverly Joseph', 'Rosalind Church'],
      ['Myrtle Landry', 'Hays Huff', 'Hernandez Benjamin', 'Mclaughlin Garza', 'Franklin Barton', 'Lara Buchanan', 'Ratliff Beck',
        'Rosario Munoz', 'Isabelle Dalton', 'Smith Woodard', 'Marjorie Marshall', 'Spears Stein', 'Brianna Bowman',
        'Marci Clay', 'Palmer Harrell', 'Ball Levy', 'Shelley Mendoza', 'Morrow Glass', 'Baker Knox', 'Adrian Holman'],
      ['Trisha Howell', 'Brooke Harrison', 'Anthony Watkins', 'Ellis Cobb', 'Sheppard Dillon', 'Mathis Bray',
        'Foreman Burns', 'Lina Glenn', 'Giles Pollard', 'Weiss Ballard', 'Lynnette Smith', 'Flores Kline', 'Graciela Singleton',
        'Santiago Mcclure', 'Claudette Battle', 'Nita Holloway', 'Eula Wolfe', 'Pruitt Stokes', 'Felicia Briggs', 'Melba Bradshaw']
    ];

    const hot = handsontable({
      data,
      colHeaders: true,
      multiColumnSorting: true
    });

    hot.view.wt.wtOverlays.leftOverlay.scrollTo(15);
    render();
    getPlugin('multiColumnSorting').sort({ column: 15, sortOrder: 'asc' });

    expect(getDataAtCell(0, 15)).toEqual('Ball Levy');
    expect(getDataAtCell(1, 15)).toEqual('Hubbard Nichols');
    expect(getDataAtCell(2, 15)).toEqual('Lenora Guzman');
    expect(getDataAtCell(3, 15)).toEqual('Nita Holloway');

    getPlugin('multiColumnSorting').sort({ column: 15, sortOrder: 'desc' });

    expect(getDataAtCell(3, 15)).toEqual('Ball Levy');
    expect(getDataAtCell(2, 15)).toEqual('Hubbard Nichols');
    expect(getDataAtCell(1, 15)).toEqual('Lenora Guzman');
    expect(getDataAtCell(0, 15)).toEqual('Nita Holloway');

    getPlugin('multiColumnSorting').sort();

    expect(getDataAtCell(0, 15)).toEqual('Hubbard Nichols');
    expect(getDataAtCell(1, 15)).toEqual('Lenora Guzman');
    expect(getDataAtCell(2, 15)).toEqual('Ball Levy');
    expect(getDataAtCell(3, 15)).toEqual('Nita Holloway');
  });

  it('should allow specifiyng a custom sorting function', () => {
    const data = [['1 inch'], ['1 yard'], ['2 feet'], ['0.2 miles']];
    const compareFunctionFactory = function(sortOrder) {
      return function(value, nextValue) {
        const unitsRatios = {
          inch: 1,
          yard: 36,
          feet: 12,
          miles: 63360
        };

        Handsontable.helper.objectEach(unitsRatios, (val, prop) => {
          if (value.indexOf(prop) > -1) {
            value = parseFloat(value.replace(prop, '')) * val;

            return false;
          }
        });

        Handsontable.helper.objectEach(unitsRatios, (val, prop) => {
          if (nextValue.indexOf(prop) > -1) {
            nextValue = parseFloat(nextValue.replace(prop, '')) * val;

            return false;
          }
        });

        if (value < nextValue) {
          return sortOrder === 'asc' ? -1 : 1;

        } else if (value > nextValue) {
          return sortOrder === 'asc' ? 1 : -1;
        }

        return 0;
      };
    };

    handsontable({
      data,
      columns: [{
        multiColumnSorting: {
          compareFunctionFactory
        }
      }],
      colHeaders: true,
      multiColumnSorting: true
    });

    expect(getDataAtCell(0, 0)).toEqual('1 inch');
    expect(getDataAtCell(1, 0)).toEqual('1 yard');
    expect(getDataAtCell(2, 0)).toEqual('2 feet');
    expect(getDataAtCell(3, 0)).toEqual('0.2 miles');

    getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'asc' });

    expect(getDataAtCell(0, 0)).toEqual('1 inch');
    expect(getDataAtCell(1, 0)).toEqual('2 feet');
    expect(getDataAtCell(2, 0)).toEqual('1 yard');
    expect(getDataAtCell(3, 0)).toEqual('0.2 miles');

    getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'desc' });

    expect(getDataAtCell(0, 0)).toEqual('0.2 miles');
    expect(getDataAtCell(1, 0)).toEqual('1 yard');
    expect(getDataAtCell(2, 0)).toEqual('2 feet');
    expect(getDataAtCell(3, 0)).toEqual('1 inch');

    getPlugin('multiColumnSorting').sort();

    expect(getDataAtCell(0, 0)).toEqual('1 inch');
    expect(getDataAtCell(1, 0)).toEqual('1 yard');
    expect(getDataAtCell(2, 0)).toEqual('2 feet');
    expect(getDataAtCell(3, 0)).toEqual('0.2 miles');
  });

  it('should properly sort integers with nulls', () => {
    handsontable({
      data: [
        ['12'],
        [null],
        ['10'],
        ['-5'],
        [null],
        ['1000']
      ],
      colHeaders: true,
      multiColumnSorting: true
    });

    spec().sortByClickOnColumnHeader(0);
    expect(getDataAtCol(0)).toEqual(['-5', '10', '12', '1000', null, null]);

    spec().sortByClickOnColumnHeader(0);
    expect(getDataAtCol(0)).toEqual(['1000', '12', '10', '-5', null, null]);
  });

  it('should properly sort floating points', () => {
    handsontable({
      data: [
        ['0.0561'],
        ['-10.67'],
        ['-4.1'],
        ['-0.01'],
        ['-127'],
        ['1000']
      ],
      colHeaders: true,
      multiColumnSorting: true
    });

    spec().sortByClickOnColumnHeader(0);
    expect(getDataAtCol(0)).toEqual(['-127', '-10.67', '-4.1', '-0.01', '0.0561', '1000']);

    spec().sortByClickOnColumnHeader(0);
    expect(getDataAtCol(0)).toEqual(['1000', '0.0561', '-0.01', '-4.1', '-10.67', '-127']);
  });

  it('should properly sort floating points with nulls', () => {
    handsontable({
      data: [
        ['0.0561'],
        ['-10.67'],
        [null],
        ['-4.1'],
        ['-0.01'],
        [null],
        ['-127'],
        ['1000'],
        [null]
      ],
      colHeaders: true,
      multiColumnSorting: true
    });

    spec().sortByClickOnColumnHeader(0);
    expect(getDataAtCol(0)).toEqual(['-127', '-10.67', '-4.1', '-0.01', '0.0561', '1000', null, null, null]);

    spec().sortByClickOnColumnHeader(0);
    expect(getDataAtCol(0)).toEqual(['1000', '0.0561', '-0.01', '-4.1', '-10.67', '-127', null, null, null]);
  });

  it('should properly sort floating points with non-numerical values', () => {
    handsontable({
      data: [
        ['0.0561'],
        ['-10.67'],
        ['a'],
        ['-4.1'],
        ['-0.01'],
        ['b'],
        ['-127'],
        ['1000'],
        ['hello']
      ],
      colHeaders: true,
      multiColumnSorting: true
    });

    spec().sortByClickOnColumnHeader(0);
    expect(getDataAtCol(0)).toEqual(['-127', '-10.67', '-4.1', '-0.01', '0.0561', '1000', 'a', 'b', 'hello']);

    spec().sortByClickOnColumnHeader(0);
    expect(getDataAtCol(0)).toEqual(['hello', 'b', 'a', '1000', '0.0561', '-0.01', '-4.1', '-10.67', '-127']);
  });

  it('should modify row translating process when soring is applied (visual to physical and vice versa)', () => {
    const hot = handsontable({
      data: [
        [2],
        [4],
        [1],
        [3]
      ],
      colHeaders: true,
      multiColumnSorting: true
    });

    spec().sortByClickOnColumnHeader(0);

    expect(hot.toPhysicalRow(0)).toBe(2);
    expect(hot.toPhysicalRow(1)).toBe(0);
    expect(hot.toPhysicalRow(2)).toBe(3);
    expect(hot.toPhysicalRow(3)).toBe(1);
    expect(hot.toVisualRow(0)).toBe(1);
    expect(hot.toVisualRow(1)).toBe(3);
    expect(hot.toVisualRow(2)).toBe(0);
    expect(hot.toVisualRow(3)).toBe(2);
  });

  describe('should return sorted properly data when maxRows or / and minSpareRow options are set', () => {
    it('maxRows < data.length', () => {
      handsontable({
        data: createSpreadsheetData(9, 9),
        maxRows: 6,
        multiColumnSorting: {
          initialConfig: {
            column: 0,
            sortOrder: 'desc'
          }
        }
      });

      expect(getDataAtCol(0)).toEqual(['A6', 'A5', 'A4', 'A3', 'A2', 'A1']);
    });

    it('maxRows > data.length', () => {
      handsontable({
        data: createSpreadsheetData(9, 9),
        maxRows: 20,
        multiColumnSorting: {
          initialConfig: {
            column: 0,
            sortOrder: 'desc'
          }
        }
      });

      expect(getDataAtCol(0)).toEqual(['A9', 'A8', 'A7', 'A6', 'A5', 'A4', 'A3', 'A2', 'A1']);
    });

    it('minSpareRows is set; maxRows < data.length', () => {
      handsontable({
        data: createSpreadsheetData(9, 9),
        maxRows: 5,
        minSpareRows: 3,
        multiColumnSorting: {
          initialConfig: {
            column: 0,
            sortOrder: 'desc'
          }
        }
      });

      expect(getDataAtCol(0)).toEqual(['A5', 'A4', 'A3', 'A2', 'A1']);
    });

    it('minSpareRows is set; maxRows === data.length', () => {
      handsontable({
        data: createSpreadsheetData(6, 6),
        maxRows: 9,
        minSpareRows: 3,
        multiColumnSorting: {
          initialConfig: {
            column: 0,
            sortOrder: 'desc'
          }
        }
      });

      expect(getDataAtCol(0)).toEqual(['A6', 'A5', 'A4', 'A3', 'A2', 'A1', null, null, null]);
    });

    it('minSpareRows is set; maxRows > data.length', () => {
      handsontable({
        data: createSpreadsheetData(9, 9),
        maxRows: 15,
        minSpareRows: 2,
        multiColumnSorting: {
          initialConfig: {
            column: 0,
            sortOrder: 'desc'
          }
        }
      });

      expect(getDataAtCol(0)).toEqual(['A9', 'A8', 'A7', 'A6', 'A5', 'A4', 'A3', 'A2', 'A1', null, null]);
    });
  });

  describe('Sorting by multiple columns should reorganize sequence of rows properly', () => {
    describe('by the `sort` method', () => {
      it('when sorting two columns with default type of data', () => {
        handsontable({
          data: arrayOfArrays(),
          columns: [
            {},
            {},
            { type: 'date', dateFormat: 'MM/DD/YYYY' },
            { type: 'numeric' },
            { multiColumnSorting: { sortEmptyCells: true } }
          ],
          multiColumnSorting: true
        });

        getPlugin('multiColumnSorting').sort([{
          column: 1,
          sortOrder: 'asc'
        }, {
          column: 0,
          sortOrder: 'desc'
        }]);

        expect(getDataAtCol(0)).toEqual(['Mary', 'Mary', 'John', 'Robert', 'Robert', 'Ann', 'Henry', 'David', 'Ann']);
      });

      it('when sorting first column with default type of data, the second one with numeric data', () => {
        handsontable({
          data: arrayOfArrays(),
          columns: [
            {},
            {},
            { type: 'date', dateFormat: 'MM/DD/YYYY' },
            { type: 'numeric' },
            { multiColumnSorting: { sortEmptyCells: true } }
          ],
          multiColumnSorting: true
        });

        getPlugin('multiColumnSorting').sort([{
          column: 1,
          sortOrder: 'desc'
        }, {
          column: 3,
          sortOrder: 'asc'
        }]);

        expect(getDataAtCol(0)).toEqual(['Ann', 'David', 'Henry', 'Robert', 'Ann', 'Robert', 'John', 'Mary', 'Mary']);
      });

      it('when sorting first column with date type of data, the second one with numeric data', () => {
        handsontable({
          data: arrayOfArrays(),
          columns: [
            {},
            {},
            { type: 'date', dateFormat: 'MM/DD/YYYY' },
            { type: 'numeric' },
            { multiColumnSorting: { sortEmptyCells: true } }
          ],
          multiColumnSorting: true
        });

        getPlugin('multiColumnSorting').sort([{
          column: 2,
          sortOrder: 'asc'
        }, {
          column: 3,
          sortOrder: 'asc'
        }]);

        expect(getDataAtCol(0)).toEqual(['Ann', 'Mary', 'Mary', 'Henry', 'Robert', 'David', 'John', 'Robert', 'Ann']);
      });

      it('when sorting four columns with three different kind of data', () => {
        handsontable({
          data: arrayOfArrays(),
          columns: [
            {},
            {},
            { type: 'date', dateFormat: 'MM/DD/YYYY' },
            { type: 'numeric' },
            { multiColumnSorting: { sortEmptyCells: true } }
          ],
          multiColumnSorting: true
        });

        getPlugin('multiColumnSorting').sort([{
          column: 0,
          sortOrder: 'asc'
        }, {
          column: 1,
          sortOrder: 'desc'
        }, {
          column: 2,
          sortOrder: 'desc'
        }, {
          column: 3,
          sortOrder: 'asc'
        }]);

        expect(getDataAtCol(3)).toEqual([33.9, 30500, 7000, 8330, 2984, 4000, 6999.95, 30500, 12464]);
      });
    });

    describe('by provided initial configuration', () => {
      it('when simple configuration was set', () => {
        handsontable({
          data: arrayOfArrays(),
          columns: [
            {},
            {},
            { type: 'date', dateFormat: 'MM/DD/YYYY' },
            { type: 'numeric' },
            {}
          ],
          multiColumnSorting: {
            initialConfig: [{
              column: 0,
              sortOrder: 'asc'
            }, {
              column: 1,
              sortOrder: 'asc'
            }, {
              column: 2,
              sortOrder: 'asc'
            }, {
              column: 3,
              sortOrder: 'asc'
            }]
          }
        });

        expect(getDataAtCol(3)).toEqual([30500, 33.9, 7000, 8330, 2984, 4000, 6999.95, 12464, 30500]);
      });

      it('when `sortEmptyCells` option was set for one column', () => {
        handsontable({
          data: arrayOfArrays(),
          columns: [
            {},
            {},
            { type: 'date', dateFormat: 'MM/DD/YYYY' },
            { type: 'numeric' },
            { multiColumnSorting: { sortEmptyCells: true } }
          ],
          multiColumnSorting: {
            initialConfig: [{
              column: 1,
              sortOrder: 'asc'
            }, {
              column: 4,
              sortOrder: 'asc'
            }]
          }
        });

        expect(getDataAtCol(4)).toEqual([null, '', 'aa', null, undefined, 'abaa', 'aaa', 'bbbb', 'aab']);
      });
    });
  });

  describe('Numbers presenting sorting sequence', () => {
    it('should be properly presented on the UI when more than 7 columns are sorted', () => {
      spec().$container[0].style.width = 'auto';
      spec().$container[0].style.height = 'auto';

      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        multiColumnSorting: {
          indicator: true,
          initialConfig: [{
            column: 1,
            sortOrder: 'asc'
          }, {
            column: 0,
            sortOrder: 'asc'
          }, {
            column: 2,
            sortOrder: 'asc'
          }, {
            column: 3,
            sortOrder: 'asc'
          }, {
            column: 4,
            sortOrder: 'asc'
          }, {
            column: 5,
            sortOrder: 'asc'
          }, {
            column: 6,
            sortOrder: 'asc'
          }, {
            column: 7,
            sortOrder: 'asc'
          }, {
            column: 8,
            sortOrder: 'asc'
          }, {
            column: 9,
            sortOrder: 'asc'
          }]
        }
      });

      expect(window.getComputedStyle(spec().$container.find('th span.columnSorting')[0], ':after').getPropertyValue('content')).toEqual('"2"');
      expect(window.getComputedStyle(spec().$container.find('th span.columnSorting')[1], ':after').getPropertyValue('content')).toEqual('"1"');
      expect(window.getComputedStyle(spec().$container.find('th span.columnSorting')[2], ':after').getPropertyValue('content')).toEqual('"3"');
      expect(window.getComputedStyle(spec().$container.find('th span.columnSorting')[3], ':after').getPropertyValue('content')).toEqual('"4"');
      expect(window.getComputedStyle(spec().$container.find('th span.columnSorting')[4], ':after').getPropertyValue('content')).toEqual('"5"');
      expect(window.getComputedStyle(spec().$container.find('th span.columnSorting')[5], ':after').getPropertyValue('content')).toEqual('"6"');
      expect(window.getComputedStyle(spec().$container.find('th span.columnSorting')[6], ':after').getPropertyValue('content')).toEqual('"7"');
      expect(window.getComputedStyle(spec().$container.find('th span.columnSorting')[7], ':after').getPropertyValue('content')).toEqual('"+"');
      expect(window.getComputedStyle(spec().$container.find('th span.columnSorting')[8], ':after').getPropertyValue('content')).toEqual('"+"');
    });

    it('should be properly hided when just one column is sorted', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        multiColumnSorting: {
          indicator: true,
          initialConfig: [{
            column: 1,
            sortOrder: 'asc'
          }, {
            column: 0,
            sortOrder: 'asc'
          }]
        }
      });

      expect(window.getComputedStyle(spec().$container.find('th span.columnSorting')[0], ':after').getPropertyValue('content')).toEqual('"2"');
      expect(window.getComputedStyle(spec().$container.find('th span.columnSorting')[1], ':after').getPropertyValue('content')).toEqual('"1"');

      getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'asc' });

      expect(window.getComputedStyle(spec().$container.find('th span.columnSorting')[0], ':after').getPropertyValue('content')).toEqual('none');
      expect(window.getComputedStyle(spec().$container.find('th span.columnSorting')[1], ':after').getPropertyValue('content')).toEqual('none');
    });
  });

  describe('Sorting configuration validation', () => {
    describe('should not change internal state of sorting when wrong configuration was provided', () => {
      it('when too low column index was passed to the initial config', () => {
        const warnSpy = spyOn(console, 'warn');

        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          multiColumnSorting: {
            indicator: true,
            initialConfig: [{
              column: 0,
              sortOrder: 'asc'
            }, {
              column: -1,
              sortOrder: 'asc'
            }]
          }
        });

        expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);
        expect(warnSpy).toHaveBeenCalled();
      });

      it('when too high column index was passed to the initial config', () => {
        const warnSpy = spyOn(console, 'warn');

        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          multiColumnSorting: {
            indicator: true,
            initialConfig: [{
              column: 0,
              sortOrder: 'asc'
            }, {
              column: 100,
              sortOrder: 'asc'
            }]
          }
        });

        expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);
        expect(warnSpy).toHaveBeenCalled();
      });

      it('when not proper sort order was passed to the initial config', () => {
        const warnSpy = spyOn(console, 'warn');

        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          multiColumnSorting: {
            indicator: true,
            initialConfig: [{
              column: 0,
              sortOrder: 'asc'
            }, {
              column: 1,
              sortOrder: 'unknown'
            }]
          }
        });

        expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);
        expect(warnSpy).toHaveBeenCalled();
      });

      it('when missed sort order was passed to the initial config', () => {
        const warnSpy = spyOn(console, 'warn');

        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          multiColumnSorting: {
            indicator: true,
            initialConfig: [{
              column: 0,
              sortOrder: 'asc'
            }, {
              column: 1
            }]
          }
        });

        expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);
        expect(warnSpy).toHaveBeenCalled();
      });

      it('when missed column index was passed to the initial config', () => {
        const warnSpy = spyOn(console, 'warn');

        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          multiColumnSorting: {
            indicator: true,
            initialConfig: [{
              column: 0,
              sortOrder: 'asc'
            }, {
              sortOrder: 'desc'
            }]
          }
        });

        expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);
        expect(warnSpy).toHaveBeenCalled();
      });

      it('when the same column index was passed twice to the initial config', () => {
        const warnSpy = spyOn(console, 'warn');

        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          multiColumnSorting: {
            indicator: true,
            initialConfig: [{
              column: 0,
              sortOrder: 'asc'
            }, {
              column: 0,
              sortOrder: 'desc'
            }]
          }
        });

        expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);
        expect(warnSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Sorting more than one column by clicks', () => {
    it('should sort two columns when ctrl was held while clicking', () => {
      handsontable({
        data: arrayOfArrays(),
        columns: [
          {},
          {},
          { type: 'date', dateFormat: 'MM/DD/YYYY' },
          { type: 'numeric' },
          {}
        ],
        colHeaders: true,
        multiColumnSorting: true
      });

      spec().sortByClickOnColumnHeader(2);

      keyDown('ctrl');

      spec().sortByClickOnColumnHeader(3);

      expect(getDataAtCol(0)).toEqual(['Ann', 'Mary', 'Mary', 'Henry', 'Robert', 'David', 'John', 'Robert', 'Ann']);
    });

    it('should push last clicked column to the end of sort queue', () => {
      handsontable({
        data: arrayOfArrays(),
        columns: [
          {},
          {},
          { type: 'date', dateFormat: 'MM/DD/YYYY' },
          { type: 'numeric' },
          {}
        ],
        colHeaders: true,
        multiColumnSorting: true
      });

      // ASC
      spec().sortByClickOnColumnHeader(0);

      keyDown('ctrl');

      // ASC as 2nd
      spec().sortByClickOnColumnHeader(1);

      // DESC as 2nd
      spec().sortByClickOnColumnHeader(0);

      expect(getDataAtCol(0)).toEqual(['Mary', 'Mary', 'John', 'Robert', 'Robert', 'Ann', 'Henry', 'David', 'Ann']);
    });
  });

  describe('Click on the header sort data', () => {
    const HEADER_ACTION_CLASS = 'sortAction';

    it('should block action for specific configuration', () => {
      handsontable({
        data: arrayOfArrays(),
        columns: [
          { multiColumnSorting: { headerAction: false } },
          {},
          { type: 'date', dateFormat: 'MM/DD/YYYY' },
          { type: 'numeric' },
          {}
        ],
        colHeaders: true,
        multiColumnSorting: {
          headerAction: true
        }
      });

      const $clickedHeader = spec().$container.find('th span.columnSorting:eq(0)');

      expect($clickedHeader.hasClass(HEADER_ACTION_CLASS)).toBeFalsy();

      spec().sortByClickOnColumnHeader(0);

      expect(getDataAtCol(0)).toEqual(['Mary', 'Henry', 'Ann', 'Robert', 'Ann', 'David', 'John', 'Mary', 'Robert']);
    });

    it('should not block action for specific configuration updated by `updateSettings`', () => {
      handsontable({
        data: arrayOfArrays(),
        columns: [
          { multiColumnSorting: { headerAction: false } },
          {},
          { type: 'date', dateFormat: 'MM/DD/YYYY' },
          { type: 'numeric' },
          {}
        ],
        colHeaders: true,
        multiColumnSorting: {
          headerAction: true
        }
      });

      let $clickedHeader = spec().$container.find('th span.columnSorting:eq(0)');

      expect($clickedHeader.hasClass(HEADER_ACTION_CLASS)).toBeFalsy();

      updateSettings({ columns: () => ({ type: 'text' }) });

      $clickedHeader = spec().$container.find('th span.columnSorting:eq(0)');

      expect($clickedHeader.hasClass(HEADER_ACTION_CLASS)).toBeTruthy();

      spec().sortByClickOnColumnHeader(0);

      expect(getDataAtCol(0)).toEqual(['Ann', 'Ann', 'David', 'Henry', 'John', 'Mary', 'Mary', 'Robert', 'Robert']);
    });

    it('should block action for specific configuration updated by `updateSettings`', () => {
      handsontable({
        data: arrayOfArrays(),
        columns: [
          {},
          {},
          { type: 'date', dateFormat: 'MM/DD/YYYY' },
          { type: 'numeric' },
          {}
        ],
        colHeaders: true,
        multiColumnSorting: true
      });

      let $clickedHeader = spec().$container.find('th span.columnSorting:eq(0)');

      expect($clickedHeader.hasClass(HEADER_ACTION_CLASS)).toBeTruthy();

      updateSettings({ multiColumnSorting: { headerAction: false } });

      $clickedHeader = spec().$container.find('th span.columnSorting:eq(0)');

      expect($clickedHeader.hasClass(HEADER_ACTION_CLASS)).toBeFalsy();

      spec().sortByClickOnColumnHeader(0);

      expect(getDataAtCol(0)).toEqual(['Mary', 'Henry', 'Ann', 'Robert', 'Ann', 'David', 'John', 'Mary', 'Robert']);
    });
  });

  describe('rendering headers', () => {
    it('should change width of multi-line headers when plugin is enabled / disabled by `updateSettings` and sort indicator is enabled', () => {
      handsontable({
        colHeaders: ['AAA<br>BB']
      });

      const headerWidthAtStart = spec().$container.find('th').eq(0).width();

      updateSettings({ multiColumnSorting: true });

      let newHeaderWidth = spec().$container.find('th').eq(0).width();

      expect(headerWidthAtStart).toBeLessThan(newHeaderWidth);

      updateSettings({ multiColumnSorting: false });

      newHeaderWidth = spec().$container.find('th').eq(0).width();

      expect(headerWidthAtStart).toBe(newHeaderWidth);

      updateSettings({ multiColumnSorting: { initialConfig: { column: 0, sortOrder: 'asc' } } });

      newHeaderWidth = spec().$container.find('th').eq(0).width();

      expect(headerWidthAtStart).toBeLessThan(newHeaderWidth);
    });

    it('should change width of multi-line headers when plugin is enabled / disabled by `enablePlugin` and `disablePlugin` methods ' +
      'and sort indicator is enabled', () => {
      const hot = handsontable({
        colHeaders: ['AAA<br>BB']
      });

      const headerWidthAtStart = spec().$container.find('th').eq(0).width();

      getPlugin('multiColumnSorting').enablePlugin();

      let newHeaderWidth = spec().$container.find('th').eq(0).width();

      expect(headerWidthAtStart).toBeLessThan(newHeaderWidth);

      getPlugin('multiColumnSorting').disablePlugin();

      newHeaderWidth = spec().$container.find('th').eq(0).width();

      expect(headerWidthAtStart).toBeLessThan(newHeaderWidth);

      hot.render();

      newHeaderWidth = spec().$container.find('th').eq(0).width();

      expect(headerWidthAtStart).toBe(newHeaderWidth);

      getPlugin('multiColumnSorting').enablePlugin();

      newHeaderWidth = spec().$container.find('th').eq(0).width();

      expect(headerWidthAtStart).toBeLessThan(newHeaderWidth);
    });

    it('should work properly also when `rowHeaders` option is set to `true`', () => {
      handsontable({
        colHeaders: ['AAA<br>BB'],
        rowHeaders: true
      });

      spec().$container[0].style.width = 'auto';
      spec().$container[0].style.height = 'auto';

      const wtHiderWidthAtStart = spec().$container.find('.wtHider').eq(0).width();
      const htCoreWidthAtStart = spec().$container.find('.htCore').eq(0).width();

      updateSettings({ multiColumnSorting: true });

      let newWtHiderWidth = spec().$container.find('.wtHider').eq(0).width();
      let newHtCoreWidth = spec().$container.find('.htCore').eq(0).width();

      expect(wtHiderWidthAtStart).toBeLessThan(newWtHiderWidth);
      expect(htCoreWidthAtStart).toBeLessThan(newHtCoreWidth);
      expect(newWtHiderWidth).toBe(newHtCoreWidth);

      updateSettings({ multiColumnSorting: false });

      newWtHiderWidth = spec().$container.find('.wtHider').eq(0).width();
      newHtCoreWidth = spec().$container.find('.htCore').eq(0).width();

      expect(wtHiderWidthAtStart).toBe(newWtHiderWidth);
      expect(htCoreWidthAtStart).toBe(newHtCoreWidth);
      expect(newWtHiderWidth).toBe(newHtCoreWidth);

      updateSettings({ multiColumnSorting: { initialConfig: { column: 0, sortOrder: 'asc' } } });

      newWtHiderWidth = spec().$container.find('.wtHider').eq(0).width();
      newHtCoreWidth = spec().$container.find('.htCore').eq(0).width();

      expect(wtHiderWidthAtStart).toBeLessThan(newWtHiderWidth);
      expect(htCoreWidthAtStart).toBeLessThan(newHtCoreWidth);
      expect(newWtHiderWidth).toBe(newHtCoreWidth);
    });

    it('should not change width of multi-line headers when plugin is enabled / disabled and sort indicator is disabled', async() => {
      handsontable({
        colHeaders: ['AAA<br>BB']
      });

      const headerWidthAtStart = spec().$container.find('th').eq(0).width();
      const wtHiderWidthAtStart = spec().$container.find('.wtHider').eq(0).width();
      const htCoreWidthAtStart = spec().$container.find('.htCore').eq(0).width();

      updateSettings({ multiColumnSorting: { indicator: false } });

      await sleep(100);

      let newHeaderWidth = spec().$container.find('th').eq(0).width();
      let newWtHiderWidth = spec().$container.find('.wtHider').eq(0).width();
      let newHtCoreWidth = spec().$container.find('.htCore').eq(0).width();

      expect(headerWidthAtStart).toBe(newHeaderWidth);
      expect(wtHiderWidthAtStart).toBe(newWtHiderWidth);
      expect(htCoreWidthAtStart).toBe(newHtCoreWidth);

      updateSettings({ multiColumnSorting: false });

      await sleep(100);

      newHeaderWidth = spec().$container.find('th').eq(0).width();
      newWtHiderWidth = spec().$container.find('.wtHider').eq(0).width();
      newHtCoreWidth = spec().$container.find('.htCore').eq(0).width();

      expect(headerWidthAtStart).toBe(newHeaderWidth);
      expect(wtHiderWidthAtStart).toBe(newWtHiderWidth);
      expect(htCoreWidthAtStart).toBe(newHtCoreWidth);
    });
  });

  // TODO: Remove tests when workaround will be removed.
  describe('workaround regression check', () => {
    it('should not break the dataset when inserted new row', () => {
      handsontable({
        colHeaders: true,
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        multiColumnSorting: true
      });

      alter('insert_row', 2);

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        [null, null, null],
        ['A3', 'B3', 'C3']
      ]);
    });

    it('should add new columns properly when the `columnSorting` plugin is enabled (inheriting of non-primitive cell meta values)', () => {
      spec().$container[0].style.width = 'auto';
      spec().$container[0].style.height = 'auto';

      handsontable({
        colHeaders: true,
        data: Handsontable.helper.createSpreadsheetData(2, 2),
        multiColumnSorting: true
      });

      alter('insert_col', 2, 5);

      expect(getHtCore().find('tbody tr:eq(0) td').length).toEqual(7);
    });
  });
});
