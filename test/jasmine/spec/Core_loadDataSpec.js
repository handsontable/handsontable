describe('Core_loadData', function () {
  var $container,
    id = 'testContainer';

  beforeEach(function () {
    $container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if($container) {
      $container.remove();
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
      {id: 3, name: "Joan", lastName: "Well"}
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
    $container.handsontable();
    $container.handsontable('loadData', arrayOfArrays());
    var output = $container.handsontable('getDataAtCell', 0, 2);
    expect(output).toEqual("Nissan");
  });

  it('should allow array of objects', function () {
    $container.handsontable({
      columns: [
        {data: "id"},
        {data: "lastName"},
        {data: "name"}
      ]
    });
    $container.handsontable('loadData', arrayOfObjects());
    var output = $container.handsontable('getDataAtCell', 0, 2);
    expect(output).toEqual("Ted");
  });

  it('should allow array of nested objects', function () {
    $container.handsontable({
      data: arrayOfNestedObjects(),
      colHeaders: true,
      columns: [
        {data: "id"},
        {data: "name.last"},
        {data: "name.first"}
      ]
    });
    var output = $container.handsontable('getDataAtCell', 0, 2);
    expect(output).toEqual("Ted");
  });

  it('should figure out default column names for array of nested objects', function () {
    $container.handsontable({
      data: arrayOfNestedObjects(),
      colHeaders: true
    });
    var output = $container.handsontable('getDataAtCell', 0, 2);
    expect(output).toEqual("Right");
  });

  it('should trigger onChange callback when loaded array of arrays', function () {
    var called = false;

    runs(function () {
      $container.handsontable({
        onChange: function (changes, source) {
          if (source === 'loadData') {
            called = true;
          }
        }
      });
      $container.handsontable('loadData', arrayOfArrays());
    });

    waitsFor(function () {
      return (called === true)
    }, "onChange callback called", 100);

    runs(function () {
      expect(called).toEqual(true);
    });
  });

  it('should trigger onChange callback when loaded array of objects', function () {
    var called = false;

    runs(function () {
      $container.handsontable({
        onChange: function (changes, source) {
          if (source === 'loadData') {
            called = true;
          }
        }
      });
      $container.handsontable('loadData', arrayOfObjects());
    });

    waitsFor(function () {
      return (called === true)
    }, "onChange callback called", 100);

    runs(function () {
      expect(called).toEqual(true);
    });
  });

  it('should trigger onChange callback when loaded array of nested objects', function () {
    var called = false;

    runs(function () {
      $container.handsontable({
        onChange: function (changes, source) {
          if (source === 'loadData') {
            called = true;
          }
        }
      });
      $container.handsontable('loadData', arrayOfNestedObjects());
    });

    waitsFor(function () {
      return (called === true)
    }, "onChange callback called", 100);

    runs(function () {
      expect(called).toEqual(true);
    });
  });

  it('should create new rows for startRows (array of arrays)', function () {
    var called = false;
    var myData = arrayOfArrays();
    var expectedRows = myData.length * 2;

    $container.handsontable({
      startRows: expectedRows,
      data: myData,
      onChange: function (changes, source) {
        if (source === 'loadData') {
          called = true;
        }
      }
    });

    expect(myData.length).toEqual(expectedRows);
  });

  it('should create new rows for startRows (array of nested objects)', function () {
    var called = false;
    var myData = arrayOfNestedObjects();
    var expectedRows = myData.length * 2;

    $container.handsontable({
      startRows: expectedRows,
      data: myData,
      onChange: function (changes, source) {
        if (source === 'loadData') {
          called = true;
        }
      }
    });

    expect(myData.length).toEqual(expectedRows);
  });

  it('HTML special chars should be escaped by default', function () {
    $container.handsontable();
    $container.handsontable('loadData', htmlData);
    var output = $container.handsontable('getCell', 0, 0).innerHTML;
    expect(output).toEqual('&lt;b&gt;H&amp;M&lt;/b&gt;');
  });
});