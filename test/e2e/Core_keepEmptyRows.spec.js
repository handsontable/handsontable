describe('Core_keepEmptyRows', () => {
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

  const arrayOfNestedObjects = function() {
    return [
      { id: 1,
        name: {
          first: 'Ted',
          last: 'Right'
        },
        address: 'Street Name',
        zip: '80410',
        city: 'City Name' },
      { id: 2,
        name: {
          first: 'Frank',
          last: 'Honest'
        },
        address: 'Street Name',
        zip: '80410',
        city: 'City Name' },
      { id: 3,
        name: {
          first: 'Joan',
          last: 'Well'
        },
        address: 'Street Name',
        zip: '80410',
        city: 'City Name' }
    ];
  };

  it('should remove columns if needed', () => {
    handsontable({
      data: arrayOfNestedObjects(),
      columns: [
        { data: 'id' },
        { data: 'name.first' }
      ]
    });

    expect(spec().$container.find('tbody tr:first td').length).toEqual(2);
  });

  it('should remove columns if needed when columns is a function', () => {
    handsontable({
      data: arrayOfNestedObjects(),
      columns(column) {
        let colMeta = {};

        if (column === 0) {
          colMeta.data = 'id';

        } else if (column === 1) {
          colMeta.data = 'name.first';

        } else {
          colMeta = null;
        }

        return colMeta;
      }
    });

    expect(spec().$container.find('tbody tr:first td').length).toEqual(2);
  });

  it('should create columns if needed', () => {
    handsontable({
      data: arrayOfNestedObjects(),
      columns: [
        { data: 'id' },
        { data: 'name.first' },
        { data: 'name.last' },
        { data: 'address' },
        { data: 'zip' },
        { data: 'city' }
      ]
    });

    expect(spec().$container.find('tbody tr:first td').length).toEqual(6);
  });

  it('should create columns if needed when columns is a function', () => {
    handsontable({
      data: arrayOfNestedObjects(),
      columns(column) {
        let colMeta = {};

        if (column === 0) {
          colMeta.data = 'id';

        } else if (column === 1) {
          colMeta.data = 'name.first';

        } else if (column === 2) {
          colMeta.data = 'name.last';

        } else if (column === 3) {
          colMeta.data = 'address';

        } else if (column === 4) {
          colMeta.data = 'zip';

        } else if (column === 5) {
          colMeta.data = 'city';
        } else {
          colMeta = null;
        }

        return colMeta;
      }
    });

    expect(spec().$container.find('tbody tr:first td').length).toEqual(6);
  });

  it('should create spare cols and rows on init (array data source)', () => {
    handsontable({
      data: [
        ['one', 'two'],
        ['three', 'four']
      ],
      minCols: 4,
      minRows: 4,
      minSpareRows: 4,
      minSpareCols: 4
    });

    expect(countCells()).toEqual(36);
  });

  it('should create spare cols and rows on init (object data source)', () => {
    handsontable({
      data: arrayOfNestedObjects(),
      minRows: 4,
      minSpareRows: 1
    });

    expect(countRows()).toEqual(4);
    expect(countCols()).toEqual(6); // because arrayOfNestedObjects has 6 nested properites and they should be figured out if dataSchema/columns is not given
    expect(spec().$container.find('tbody tr:first td:last').text()).toEqual('City Name');
  });

  it('should create new row when last cell in last row is edited', () => {
    const data = [
      ['one', 'two'],
      ['three', 'four']
    ];

    handsontable({
      data,
      minRows: 4,
      minCols: 4,
      minSpareRows: 1
    });
    setDataAtCell(3, 3, 'test');

    expect(data.length).toEqual(5);
  });

  it('should create new col when last cell in last row is edited', () => {
    const data = [
      ['one', 'two'],
      ['three', 'four']
    ];

    handsontable({
      data,
      minRows: 4,
      minCols: 4,
      minSpareCols: 1
    });
    setDataAtCell(3, 3, 'test');

    expect(countCols()).toEqual(5);
  });

  it('should create new row when last cell in last row is edited by autocomplete', (done) => {
    const data = [
      { id: 1, color: 'orange' }
    ];

    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process(['red', 'dark-yellow', 'yellow', 'light-yellow', 'black']);
    });

    handsontable({
      data,
      startRows: 5,
      colHeaders: true,
      minSpareRows: 1,
      columns: [
        { data: 'id', type: 'text' },
        {
          data: 'color',
          editor: 'autocomplete',
          source: syncSources
        }
      ]
    });

    selectCell(1, 1);
    keyDownUp('enter');

    setTimeout(() => {
      keyDown('arrow_down');
      keyDownUp('enter');

      expect(data.length).toEqual(3);
      done();
    }, 200);
  });

  it('should create new row when last cell in last row is edited by autocomplete when columns is a function', (done) => {
    const data = [
      { id: 1, color: 'orange' }
    ];

    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process(['red', 'dark-yellow', 'yellow', 'light-yellow', 'black']);
    });

    handsontable({
      data,
      startRows: 5,
      colHeaders: true,
      minSpareRows: 1,
      columns(column) {
        let colMeta = {};

        if (column === 0) {
          colMeta.data = 'id';
          colMeta.type = 'text';

        } else if (column === 1) {
          colMeta.data = 'color';
          colMeta.editor = 'autocomplete';
          colMeta.source = syncSources;

        } else {
          colMeta = null;
        }

        return colMeta;
      }
    });

    selectCell(1, 1);
    keyDownUp('enter');

    setTimeout(() => {
      keyDown('arrow_down');
      keyDownUp('enter');

      expect(data.length).toEqual(3);
      done();
    }, 200);
  });

  it('should not create more rows that maxRows', () => {
    handsontable({
      startRows: 4,
      maxRows: 6,
      minSpareRows: 1
    });
    setDataAtCell(3, 0, 'test');
    setDataAtCell(4, 0, 'test');
    setDataAtCell(5, 0, 'test');

    expect(countRows()).toEqual(6);
  });

  it('should not create more cols that maxCols', () => {
    handsontable({
      startCols: 4,
      maxCols: 6,
      minSpareCols: 1
    });
    setDataAtCell(0, 3, 'test');
    setDataAtCell(0, 4, 'test');
    setDataAtCell(0, 5, 'test');

    expect(countCols()).toEqual(6);
  });

  it('should ignore minCols if columns is set', () => {
    handsontable({
      startCols: 1,
      minCols: 6,
      columns: [
        {},
        {}
      ]
    });

    expect(countCols()).toEqual(2);
  });

  it('should ignore minCols if columns is set when columns is a function', () => {
    handsontable({
      startCols: 1,
      minCols: 6,
      columns(column) {
        let colMeta = {};

        if ([0, 1].indexOf(column) < 0) {
          colMeta = null;
        }

        return colMeta;
      }
    });

    expect(countCols()).toEqual(1);
  });

  it('columns should have priority over startCols', () => {
    handsontable({
      startCols: 3,
      minCols: 6,
      columns: [
        {},
        {}
      ]
    });

    expect(countCols()).toEqual(2);
  });

  it('columns should have priority over startCols when columns is a function', () => {
    handsontable({
      startCols: 3,
      minCols: 6,
      columns(column) {
        let colMeta = {};

        if ([0, 1].indexOf(column) < 0) {
          colMeta = null;
        }

        return colMeta;
      }
    });

    expect(countCols()).toEqual(2);
  });
});
