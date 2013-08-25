describe('Core_loadData', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  var arrayOfArrays = function () {
    return [
      ["", "Kia", "Nissan", "Toyota", "Honda"],
      ["2008", 10, 11, 12, 13],
      ["2009", 20, 11, 14, 13],
      ["2010", 30, 15, 12, 13]
    ];
  };

  var arrayOfObjects = function () {
    return [
      {id: 1, name: "Ted", lastName: "Right"},
      {id: 2, name: "Frank", lastName: "Honest"},
      {id: 3, name: "Joan", lastName: "Well"},
      {id: 4, name: "Sid", lastName: "Strong"},
      {id: 5, name: "Jane", lastName: "Neat"},
      {id: 6, name: "Chuck", lastName: "Jackson"},
      {id: 7, name: "Meg", lastName: "Jansen"},
      {id: 8, name: "Rob", lastName: "Norris"},
      {id: 9, name: "Sean", lastName: "O'Hara"},
      {id: 10, name: "Eve", lastName: "Branson"}
    ];
  };

  var arrayOfNestedObjects = function () {
    return [
      {id: 1, name: {
        first: "Ted",
        last: "Right"
      }},
      {id: 2, name: {
        first: "Frank",
        last: "Honest"
      }},
      {id: 3, name: {
        first: "Joan",
        last: "Well"
      }}
    ]
  };

  var htmlData = [
    ['<b>H&M</b>']
  ];

  it('should allow array of arrays', function () {
    handsontable();
    loadData(arrayOfArrays());
    expect(getDataAtCell(0, 2)).toEqual("Nissan");
  });

  it('should allow array of objects', function () {
    handsontable({
      columns: [
        {data: "id"},
        {data: "lastName"},
        {data: "name"}
      ]
    });
    loadData(arrayOfObjects());
    expect(getDataAtCell(0, 2)).toEqual("Ted");
  });

  it('should allow array of nested objects', function () {
    handsontable({
      data: arrayOfNestedObjects(),
      colHeaders: true,
      columns: [
        {data: "id"},
        {data: "name.last"},
        {data: "name.first"}
      ]
    });
    expect(getDataAtCell(0, 2)).toEqual("Ted");
  });

  it('should figure out default column names for array of nested objects', function () {
    handsontable({
      data: arrayOfNestedObjects(),
      colHeaders: true
    });
    expect(getDataAtCell(0, 2)).toEqual("Right");
  });

  it('should trigger onChange callback when loaded array of arrays', function () {
    var called = false;

    handsontable({
      onChange: function (changes, source) {
        if (source === 'loadData') {
          called = true;
        }
      }
    });
    loadData(arrayOfArrays());

    expect(called).toEqual(true);
  });

  it('should trigger onChange callback when loaded array of objects', function () {
    var called = false;

    handsontable({
      onChange: function (changes, source) {
        if (source === 'loadData') {
          called = true;
        }
      }
    });
    loadData(arrayOfObjects());

    expect(called).toEqual(true);
  });

  it('should trigger onChange callback when loaded array of nested objects', function () {
    var called = false;

    handsontable({
      onChange: function (changes, source) {
        if (source === 'loadData') {
          called = true;
        }
      }
    });
    loadData(arrayOfNestedObjects());

    expect(called).toEqual(true);
  });

  it('should create new rows for array of arrays (and respect minRows)', function () {
    handsontable({
      minRows: 20, //minRows should be respected
      data: arrayOfArrays()
    });

    expect(countRows()).toEqual(20); //TODO why this must be checked after render?
  });

  it('should create new rows for array of nested objects (and respect minRows)', function () {
    handsontable({
      minRows: 20, //minRows should be respected
      data: arrayOfNestedObjects()
    });

    expect(countRows()).toEqual(20); //TODO why this must be checked after render?
  });

  it('HTML special chars should be escaped by default', function () {
    handsontable();
    loadData(htmlData);

    expect(getCell(0, 0).innerHTML).toEqual('&lt;b&gt;H&amp;M&lt;/b&gt;');
  });

  it('should create as many rows as needed by array of objects', function () {
    handsontable({
      minRows: 6,
      data: arrayOfObjects()
    });

    expect(getCell(9, 1).innerHTML).toEqual('Eve');
  });

  //https://github.com/warpech/jquery-handsontable/pull/233
  it('Should not invoke the cells callback multiple times with the same row/col', function () {
    var count = 0;
    handsontable({
      data: arrayOfNestedObjects(),
      colWidths: [90, 90, 90], //need to define colWidths, otherwise HandsontableAutoColumnSize will call cells() too
      cells: function (row, col, prop) {
        count++;
      }
    });
    expect(count).toEqual(countRows() * countCols() + countCols()); //+ countCols() is to get column width information
  });

  //https://github.com/warpech/jquery-handsontable/issues/239
  it('should remove empty row if source data has more empty rows than allowed by minSpareRows', function () {
    var blanks = [
      [],
      []
    ];

    handsontable({
      minSpareCols: 1,
      minSpareRows: 1,
      rowHeaders: true,
      colHeaders: true,
      contextMenu: false
    });

    loadData(blanks);

    expect(countRows()).toBe(1);
  });

  it('should remove grid rows if new data source has less of them', function () {
    var data1 = [
      ["a"],
      ["b"],
      ["c"],
      ["d"],
      ["e"],
      ["f"],
      ["g"],
      ["h"]
    ];

    var data2 = [
      ["a"],
      ["b"],
      ["c"],
      ["d"],
      ["e"]
    ];

    handsontable({
      data: data1,
      rowHeaders: true,
      colHeaders: true
    });
    selectCell(7, 0);
    loadData(data2);

    expect(countRows()).toBe(data2.length);
    expect(getSelected()).toEqual([4, 0, 4, 0]);
  });

  it('should remove grid rows if new data source has less of them (with minSpareRows)', function () {
    var data1 = [
      ["a"],
      ["b"],
      ["c"],
      ["d"],
      ["e"],
      ["f"],
      ["g"],
      ["h"]
    ];
    var data2 = [
      ["a"],
      ["b"],
      ["c"],
      ["d"],
      ["e"]
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

    expect(countRows()).toBe(6); //+1 because of minSpareRows
    expect(getSelected()).toEqual([5, 0, 5, 0]);
  });

  it('loading empty data should remove all rows', function () {
    var data1 = [
      ["a"],
      ["b"],
      ["c"],
      ["d"],
      ["e"],
      ["f"],
      ["g"],
      ["h"]
    ];

    var data2 = [];

    handsontable({
      data: data1,
      rowHeaders: true,
      colHeaders: true
    });
    selectCell(7, 0);
    loadData(data2);

    expect(countRows()).toBe(0);
    expect(getSelected()).toEqual(null);
  });

  it('should only have as many columns as in settings', function () {
    var data1 = arrayOfArrays();

    handsontable({
      data: data1,
      columns: [
        { data: 1 },
        { data: 3 }
      ]
    });

    expect(countCols()).toBe(2);
  });

  it('should throw error when trying to load a string (constructor)', function () {
    var errors = 0;

    try {
      handsontable({
        data: "string"
      });
    }
    catch (e) {
      errors++;
    }

    expect(errors).toBe(1);
  });

  it('should throw error when trying to load a string (loadData)', function () {
    var errors = 0;

    try {
      handsontable();
      loadData("string");
    }
    catch (e) {
      errors++;
    }

    expect(errors).toBe(1);
  });

  it('should load Backbone Collection as data source', function () {
    // code borrowed from demo/backbone.js

    var CarModel = Backbone.Model.extend({});

    var CarCollection = Backbone.Collection.extend({
      model: CarModel,
      // Backbone.Collection doesn't support `splice`, yet! Easy to add.
      splice: hacked_splice
    });

    var cars = new CarCollection();

    cars.add([
      {make: "Dodge", model: "Ram", year: 2012, weight: 6811},
      {make: "Toyota", model: "Camry", year: 2012, weight: 3190},
      {make: "Smart", model: "Fortwo", year: 2012, weight: 1808}
    ]);

    handsontable({
      data: cars,
      columns: [
        attr("make"),
        attr("model"),
        attr("year")
      ]
    });

    // use the "good" Collection methods to emulate Array.splice
    function hacked_splice(index, howMany /* model1, ... modelN */) {
      var args = _.toArray(arguments).slice(2).concat({at: index}),
        removed = this.models.slice(index, index + howMany);
      this.remove(removed).add.apply(this, args);
      return removed;
    }

    // normally, you'd get these from the server with .fetch()
    function attr(attr) {
      // this lets us remember `attr` for when when it is get/set
      return {data: function (car, value) {
        if (_.isUndefined(value)) {
          return car.get(attr);
        }
        car.set(attr, value);
      }};
    }

    expect(countRows()).toBe(3);
  });
});
