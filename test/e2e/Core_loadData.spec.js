describe('Core_loadData', () => {
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

  const arrayOfArrays = function() {
    return [
      ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
      ['2008', 10, 11, 12, 13],
      ['2009', 20, 11, 14, 13],
      ['2010', 30, 15, 12, 13]
    ];
  };

  const arrayOfObjects = function() {
    return [
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
  };

  const arrayOfNestedObjects = function() {
    return [
      {
        id: 1,
        name: {
          first: 'Ted',
          last: 'Right'
        },
        'full.street': 'Street I',
      },
      {
        id: 2,
        name: {
          first: 'Frank',
          last: 'Honest'
        },
        'full.street': 'Street II',
      },
      {
        id: 3,
        name: {
          first: 'Joan',
          last: 'Well'
        },
        'full.street': 'Street III',
      }
    ];
  };

  const htmlData = [
    ['<b>H&M</b>']
  ];

  it('should allow array of arrays', () => {
    handsontable();
    loadData(arrayOfArrays());
    expect(getDataAtCell(0, 2)).toEqual('Nissan');
  });

  it('should load data properly when it is defined as an array of objects #4204', () => {
    handsontable({});

    loadData(arrayOfObjects());

    expect(getData()).toEqual([
      [1, 'Ted', 'Right'],
      [2, 'Frank', 'Honest'],
      [3, 'Joan', 'Well'],
      [4, 'Sid', 'Strong'],
      [5, 'Jane', 'Neat'],
      [6, 'Chuck', 'Jackson'],
      [7, 'Meg', 'Jansen'],
      [8, 'Rob', 'Norris'],
      [9, 'Sean', 'O\'Hara'],
      [10, 'Eve', 'Branson']
    ]);
  });

  it('should allow array of objects', () => {
    handsontable({
      columns: [
        { data: 'id' },
        { data: 'lastName' },
        { data: 'name' }
      ]
    });
    loadData(arrayOfObjects());
    expect(getDataAtCell(0, 2)).toEqual('Ted');
  });

  it('should allow array of objects when columns as a function', () => {
    handsontable({
      columns(column) {
        let colMeta = {};

        if (column === 0) {
          colMeta.data = 'id';
        } else if (column === 1) {
          colMeta.data = 'lastName';
        } else if (column === 2) {
          colMeta.data = 'name';
        } else {
          colMeta = null;
        }

        return colMeta;
      }
    });
    loadData(arrayOfObjects());
    expect(getDataAtCell(0, 2)).toEqual('Ted');
  });

  it('should allow array of nested objects', () => {
    handsontable({
      data: arrayOfNestedObjects(),
      colHeaders: true,
      columns: [
        { data: 'id' },
        { data: 'name.last' },
        { data: 'name.first' },
        { data: 'full.street' },
      ]
    });
    expect(getDataAtCell(0, 2)).toEqual('Ted');
    expect(getDataAtCell(1, 3)).toEqual('Street II');
    expect(getDataAtRowProp(2, 'full.street')).toEqual('Street III');
  });

  it('should allow array of nested objects when columns as a function', () => {
    handsontable({
      data: arrayOfNestedObjects(),
      colHeaders: true,
      columns(column) {
        let colMeta = {};

        if (column === 0) {
          colMeta.data = 'id';
        } else if (column === 1) {
          colMeta.data = 'name.last';
        } else if (column === 2) {
          colMeta.data = 'name.first';
        } else if (column === 3) {
          colMeta.data = 'full.street';
        } else {
          colMeta = null;
        }

        return colMeta;
      }
    });
    expect(getDataAtCell(0, 2)).toEqual('Ted');
    expect(getDataAtCell(1, 3)).toEqual('Street II');
    expect(getDataAtRowProp(2, 'full.street')).toEqual('Street III');
  });

  it('should figure out default column names for array of nested objects', () => {
    handsontable({
      data: arrayOfNestedObjects(),
      colHeaders: true
    });
    expect(getDataAtCell(0, 2)).toEqual('Right');
  });

  it('should trigger onChange callback when loaded array of arrays', () => {
    let called = false;

    handsontable({
      afterChange(changes, source) {
        if (source === 'loadData') {
          called = true;
        }
      }
    });
    loadData(arrayOfArrays());

    expect(called).toEqual(true);
  });

  it('should trigger onChange callback when loaded array of objects', () => {
    let called = false;

    handsontable({
      afterChange(changes, source) {
        if (source === 'loadData') {
          called = true;
        }
      }
    });
    loadData(arrayOfObjects());

    expect(called).toEqual(true);
  });

  it('should trigger onChange callback when loaded array of nested objects', () => {
    let called = false;

    handsontable({
      afterChange(changes, source) {
        if (source === 'loadData') {
          called = true;
        }
      }
    });
    loadData(arrayOfNestedObjects());

    expect(called).toEqual(true);
  });

  it('should create new rows for array of arrays (and respect minRows)', () => {
    handsontable({
      minRows: 20, // minRows should be respected
      data: arrayOfArrays()
    });

    expect(countRows()).toEqual(20); // TODO why this must be checked after render?
  });

  it('should create new rows for array of nested objects (and respect minRows)', () => {
    handsontable({
      minRows: 20, // minRows should be respected
      data: arrayOfNestedObjects()
    });

    expect(countRows()).toEqual(20); // TODO why this must be checked after render?
  });

  it('HTML special chars should be escaped by default', () => {
    handsontable();
    loadData(htmlData);

    expect(getCell(0, 0).innerHTML).toEqual('&lt;b&gt;H&amp;M&lt;/b&gt;');
  });

  it('should create as many rows as needed by array of objects', () => {
    handsontable({
      minRows: 6,
      data: arrayOfObjects()
    });

    expect(getCell(9, 1).innerHTML).toEqual('Eve');
  });

  // https://github.com/handsontable/handsontable/pull/233
  it('should not invoke the cells callback multiple times with the same row/col (without overlays)', () => {
    const cellsSpy = jasmine.createSpy('cellsSpy');

    handsontable({
      data: arrayOfNestedObjects(),
      colWidths: [90, 90, 90, 90],
      rowHeights: [23, 23, 23, 23],
      cells: cellsSpy,
    });

    expect(cellsSpy.calls.count()).toBe(12);
  });

  it('should not invoke the cells callback multiple times with the same row/col (with overlays)', () => {
    const cellsSpy = jasmine.createSpy('cellsSpy');

    handsontable({
      data: arrayOfNestedObjects(),
      colHeaders: true,
      rowHeaders: true,
      colWidths: [90, 90, 90, 90],
      rowHeights: [90, 90, 90, 90],
      cells: cellsSpy
    });

    expect(cellsSpy.calls.count()).toBe(12);
  });

  it('should remove grid rows if new data source has less of them', () => {
    const data1 = [
      ['a'],
      ['b'],
      ['c'],
      ['d'],
      ['e'],
      ['f'],
      ['g'],
      ['h']
    ];

    const data2 = [
      ['a'],
      ['b'],
      ['c'],
      ['d'],
      ['e']
    ];

    handsontable({
      data: data1,
      rowHeaders: true,
      colHeaders: true
    });
    selectCell(7, 0);
    loadData(data2);

    expect(countRows()).toBe(data2.length);
    expect(getSelected()).toEqual([[4, 0, 4, 0]]);
  });

  it('should remove grid rows if new data source has less of them (with minSpareRows)', () => {
    const data1 = [
      ['a'],
      ['b'],
      ['c'],
      ['d'],
      ['e'],
      ['f'],
      ['g'],
      ['h']
    ];
    const data2 = [
      ['a'],
      ['b'],
      ['c'],
      ['d'],
      ['e']
    ];

    handsontable({
      data: data1,
      minSpareCols: 1,
      minSpareRows: 1,
      rowHeaders: true,
      colHeaders: true
    });
    selectCell(8, 0);
    loadData(data2);

    expect(countRows()).toBe(6); // +1 because of minSpareRows
    expect(getSelected()).toEqual([[5, 0, 5, 0]]);
  });

  it('loading empty data should remove all rows', () => {
    const data1 = [
      ['a'],
      ['b'],
      ['c'],
      ['d'],
      ['e'],
      ['f'],
      ['g'],
      ['h']
    ];

    const data2 = [];

    handsontable({
      data: data1,
      rowHeaders: true,
      colHeaders: true
    });
    selectCell(7, 0);
    loadData(data2);

    expect(countRows()).toBe(0);
    expect(getSelected()).toBeUndefined();
  });

  it('should only have as many columns as in settings', () => {
    const data1 = arrayOfArrays();

    handsontable({
      data: data1,
      columns: [
        { data: 1 },
        { data: 3 }
      ]
    });

    expect(countCols()).toBe(2);
  });

  it('should only have as many columns as in settings when columns is a function', () => {
    const data1 = arrayOfArrays();

    handsontable({
      data: data1,
      columns(column) {
        let colMeta = {
          data: column
        };

        if ([1, 3].indexOf(column) < 0) {
          colMeta = null;
        }

        return colMeta;
      }
    });

    expect(countCols()).toBe(2);
  });

  it('should throw error when trying to load a string (constructor)', () => {
    let errors = 0;

    try {
      handsontable({
        data: 'string'
      });
    } catch (e) {
      errors += 1;
    }

    expect(errors).toBe(1);
  });

  it('should throw error when trying to load a string (loadData)', () => {
    let errors = 0;

    try {
      handsontable();
      loadData('string');
    } catch (e) {
      errors += 1;
    }

    expect(errors).toBe(1);
  });

  it('should load custom class collection as data source', () => {
    const CarModel = class {
      constructor(item) {
        this.item = item;
      }
      get(key) {
        return this.item[key];
      }
      set(key, value) {
        this.item[key] = value;
      }
    };

    const CarCollection = class {
      constructor() {
        this._data = [];
      }
      push(item) {
        return this._data.push(new CarModel(item));
      }
      splice(...args) {
        return this._data.splice(...args);
      }
      slice(...args) {
        return this._data.slice(...args);
      }
      get length() {
        return this._data.length;
      }
      [Symbol.iterator]() {
        return this._data[Symbol.iterator]();
      }
    };
    const cars = new CarCollection();

    cars.push({ make: 'Dodge', model: 'Ram', year: 2012, weight: 6811 });
    cars.push({ make: 'Toyota', model: 'Camry', year: 2012, weight: 3190 });
    cars.push({ make: 'Smart', model: 'Fortwo', year: 2012, weight: 1808 });

    handsontable({
      data: cars,
      columns: [
        attr('make'),
        attr('model'),
        attr('year')
      ]
    });

    // normally, you'd get these from the server with .fetch()
    function attr(attribute) {
      // this lets us remember `attr` for when when it is get/set
      return {
        data(model, value) {
          if (value === void 0) {
            return model.get(attribute);
          }

          model.set(attribute, value);
        }
      };
    }

    expect(countRows()).toBe(3);
  });

  it('should load custom class collection as data source when columns is a function', () => {
    const CarModel = class {
      constructor(item) {
        this.item = item;
      }
      get(key) {
        return this.item[key];
      }
      set(key, value) {
        this.item[key] = value;
      }
    };

    const CarCollection = class {
      constructor() {
        this._data = [];
      }
      push(item) {
        return this._data.push(new CarModel(item));
      }
      splice(...args) {
        return this._data.splice(...args);
      }
      slice(...args) {
        return this._data.slice(...args);
      }
      get length() {
        return this._data.length;
      }
      [Symbol.iterator]() {
        return this._data[Symbol.iterator]();
      }
    };
    const cars = new CarCollection();

    cars.push({ make: 'Dodge', model: 'Ram', year: 2012, weight: 6811 });
    cars.push({ make: 'Toyota', model: 'Camry', year: 2012, weight: 3190 });
    cars.push({ make: 'Smart', model: 'Fortwo', year: 2012, weight: 1808 });

    handsontable({
      data: cars,
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = attr('make');
        } else if (column === 1) {
          colMeta = attr('model');
        } else if (column === 2) {
          colMeta = attr('year');
        }

        return colMeta;
      }
    });

    // normally, you'd get these from the server with .fetch()
    function attr(attribute) {
      // this lets us remember `attr` for when when it is get/set
      return {
        data(car, value) {
          if (value === void 0) {
            return car.get(attribute);
          }

          car.set(attribute, value);
        }
      };
    }

    expect(countRows()).toBe(3);
  });

  it('should clear cell properties after loadData', () => {
    handsontable();
    loadData(arrayOfArrays());

    getCellMeta(0, 0).foo = 'bar';

    expect(getCellMeta(0, 0).foo).toEqual('bar');

    loadData(arrayOfArrays());

    expect(getCellMeta(0, 0).foo).toBeUndefined();
  });

  it('should clear cell properties after loadData, but before rendering new data', () => {
    handsontable();
    loadData(arrayOfArrays());

    getCellMeta(0, 0).valid = false;
    render();

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);

    loadData(arrayOfArrays());

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(false);

  });

  // https://github.com/handsontable/handsontable/issues/1700
  // can't edit anything after starting editing cell with no nested object
  it('should correct behave with cell with no nested object data source corresponding to column mapping', () => {

    const objectData = [
      { id: 1, user: { name: { first: 'Ted', last: 'Right' } } },
      { id: 2, user: { name: {} } },
      { id: 3 }
    ];

    handsontable({
      data: objectData,
      columns: [
        { data: 'id' },
        { data: 'user.name.first' },
        { data: 'user.name.last' }
      ]
    });

    mouseDoubleClick(getCell(1, 1));
    document.activeElement.value = 'Harry';
    deselectCell();
    expect(objectData[1].user.name.first).toEqual('Harry');

    mouseDoubleClick(getCell(2, 1));
    document.activeElement.value = 'Barry';
    deselectCell();
    expect(objectData[2].user.name.first).toEqual('Barry');
  });

  it('should correct behave with cell with no nested object data source corresponding to column mapping when columns is a function', () => {

    const objectData = [
      { id: 1, user: { name: { first: 'Ted', last: 'Right' } } },
      { id: 2, user: { name: {} } },
      { id: 3 }
    ];

    handsontable({
      data: objectData,
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = { data: 'id' };

        } else if (column === 1) {
          colMeta = { data: 'user.name.first' };

        } else if (column === 2) {
          colMeta = { data: 'user.name.last' };
        }

        return colMeta;
      }
    });

    mouseDoubleClick(getCell(1, 1));
    document.activeElement.value = 'Harry';
    deselectCell();
    expect(objectData[1].user.name.first).toEqual('Harry');

    mouseDoubleClick(getCell(2, 1));
    document.activeElement.value = 'Barry';
    deselectCell();
    expect(objectData[2].user.name.first).toEqual('Barry');
  });

  it('should create new data schema after loading data', () => {
    handsontable({
      data: arrayOfObjects()
    });

    loadData(arrayOfArrays());

    expect(getSourceData()).toEqual(arrayOfArrays());
    expect(getData()).toEqual(arrayOfArrays());
  });

  it('should pass the `source` argument to the `beforeLoadData` and `afterLoadData` hooks', () => {
    let correctSourceCount = 0;

    handsontable({
      data: arrayOfObjects(),
      beforeLoadData: (data, firstRun, source) => {
        if (source === 'testSource') {
          correctSourceCount += 1;
        }
      },
      afterLoadData: (data, firstRun, source) => {
        if (source === 'testSource') {
          correctSourceCount += 1;
        }
      }
    });

    loadData(arrayOfArrays(), 'testSource');

    expect(correctSourceCount).toEqual(2);
  });
});
