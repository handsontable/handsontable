describe('Core_setDataAtCell', function () {
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

  var htmlText = "Ben & Jerry's";

  it('HTML special chars should be preserved in data map but escaped in DOM', function () {
    //https://github.com/warpech/jquery-handsontable/issues/147
    handsontable();
    var td = setDataAtCell(0, 0, htmlText);
    selectCell(0, 0);
    $(td).trigger("dblclick");
    deselectCell();
    expect(getDataAtCell(0, 0)).toEqual(htmlText);
  });

  it('should correctly paste string that contains "quotes"', function () {
    //https://github.com/warpech/jquery-handsontable/issues/205
    var called;
    runs(function () {
      handsontable({
        onChange: function (changes, source) {
          if (source === 'paste') {
            called = true;
          }
        }
      });
      selectCell(0, 0);
      triggerPaste('1\nThis is a "test" and a test\n2');
    });

    waitsFor(function () {
      return (called === true)
    }, "onChange callback called", 1000);

    runs(function () {
      expect(getDataAtCell(0, 0)).toEqual('1');
      expect(getDataAtCell(1, 0)).toEqual('This is a "test" and a test');
      expect(getDataAtCell(2, 0)).toEqual('2');
    });
  });

  it('should correctly paste string when dataSchema is used', function () {
    //https://github.com/warpech/jquery-handsontable/issues/237
    var called;
    runs(function () {
      handsontable({
        colHeaders: true,
        dataSchema: {
          col1: null,
          col2: null,
          col3: null
        },
        onChange: function (changes, source) {
          if (source === 'paste') {
            called = true;
          }
        }
      });
      selectCell(0, 0);
      triggerPaste('1\tTest\t2');
    });

    waitsFor(function () {
      return (called === true)
    }, "onChange callback called", 1000);

    runs(function () {
      expect(getDataAtCell(0, 0)).toEqual('1');
      expect(getDataAtCell(0, 1)).toEqual('Test');
      expect(getDataAtCell(0, 2)).toEqual('2');
    });
  });

  it('should paste not more rows than maxRows', function () {
    var called;
    runs(function () {
      handsontable({
        minSpareRows: 1,
        minRows: 5,
        maxRows: 10,
        onChange: function (changes, source) {
          if (source === 'paste') {
            called = true;
          }
        }
      });
      selectCell(4, 0);
      triggerPaste('1\n2\n3\n4\n5\n6\n7\n8\n9\n10');
    });

    waitsFor(function () {
      return (called === true)
    }, "onChange callback called", 1000);

    runs(function () {
      expect(countRows()).toEqual(10);
      expect(getDataAtCell(9, 0)).toEqual('6');
    });
  });

  it('should paste not more cols than maxCols', function () {
    var called;

    runs(function () {
      handsontable({
        minSpareCols: 1,
        minCols: 5,
        maxCols: 10,
        onChange: function (changes, source) {
          if (source === 'paste') {
            called = true;
          }
        }
      });
      selectCell(0, 4);
      triggerPaste('1\t2\t3\t4\t5\t6\t7\t8\t9\t10');
    });

    waitsFor(function () {
      return (called === true)
    }, "onChange callback called", 1000);

    runs(function () {
      expect(countCols()).toEqual(10);
      expect(getDataAtCell(0, 9)).toEqual('6');
    });
  });

  it('should paste not more rows & cols than maxRows & maxCols', function () {
    var called;
    runs(function () {
      handsontable({
        minSpareRows: 1,
        minSpareCols: 1,
        minRows: 5,
        minCols: 5,
        maxRows: 6,
        maxCols: 6,
        onChange: function (changes, source) {
          if (source === 'paste') {
            called = true;
          }
        }
      });
      selectCell(4, 4);
      triggerPaste('1\t2\t3\n4\t5\t6\n7\t8\t9');
    });

    waitsFor(function () {
      return (called === true)
    }, "onChange callback called", 1000);

    runs(function () {
      expect(countRows()).toEqual(6);
      expect(countCols()).toEqual(6);
      expect(getDataAtCell(5, 5)).toEqual('5');
    });
  });

  //https://github.com/warpech/jquery-handsontable/issues/250
  it('should create new rows when pasting into grid with object data source', function () {
    var called;
    runs(function () {
      handsontable({
        data: arrayOfNestedObjects(),
        colHeaders: true,
        columns: [
          {data: "id"},
          {data: "name.last"},
          {data: "name.first"}
        ],
        minSpareRows: 1,
        onChange: function (changes, source) {
          if (source === 'paste') {
            called = true;
          }
        }
      });
      selectCell(3, 0);
      triggerPaste('a\tb\tc\nd\te\tf\ng\th\ti');
    });

    waitsFor(function () {
      return (called === true)
    }, "onChange callback called", 1000);

    runs(function () {
      expect(countRows()).toEqual(7);
      expect(getDataAtCell(5, 2)).toEqual('i');
    });
  });

  //https://handsontable.com/demo/datasources.html
  it('should work with functional data source', function () {
    handsontable({
      data: [
        model({id: 1, name: "Ted Right", address: ""}),
        model({id: 2, name: "Frank Honest", address: ""}),
        model({id: 3, name: "Joan Well", address: ""})
      ],
      dataSchema: model,
      startRows: 5,
      startCols: 3,
      colHeaders: ['ID', 'Name', 'Address'],
      columns: [
        {data: property("id")},
        {data: property("name")},
        {data: property("address")}
      ],
      minSpareRows: 1
    });

    function model(opts) {
      var _pub = {},
        _priv = $.extend({
          id: undefined,
          name: undefined,
          address: undefined
        }, opts);

      _pub.attr = function (attr, val) {
        if (typeof val === 'undefined') {
          return _priv[attr];
        }
        _priv[attr] = val;

        return _pub;
      };

      return _pub;
    }

    function property(attr) {
      return function (row, value) {
        return row.attr(attr, value);
      }
    }

    expect(getDataAtCell(1, 1)).toEqual('Frank Honest');
    setDataAtCell(1, 1, 'Something Else');
    expect(getDataAtCell(1, 1)).toEqual('Something Else');
  });

  it('should accept changes array as 1st param and source as 2nd param', function () {
    var callCount = 0
      , lastSource = '';
    handsontable({
      afterChange: function (changes, source) {
        callCount++;
        lastSource = source;
      }
    });

    setDataAtCell([[0, 0, 'new value']], 'customSource');
    expect(getDataAtCell(0, 0)).toEqual('new value');
    expect(lastSource).toEqual('customSource');
  });
});