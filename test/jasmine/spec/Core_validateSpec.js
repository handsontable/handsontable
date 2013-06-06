describe('Core_beforechange', function () {
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

  it('should call beforeValidate', function () {
    var fired = null;

    runs(function () {
      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'id', type: 'numeric'},
          {data: 'name'},
          {data: 'lastName'}
        ],
        beforeValidate : function () {
          fired = true;
        }
      });
      setDataAtCell(2, 0, 'test');
    });

    waitsFor(function () {
      return (fired != null)
    }, "beforeValidate callback called", 100);

  });

  it('should call afterValidate', function () {
    var fired = null;

    runs(function () {
      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'id', type: 'numeric'},
          {data: 'name'},
          {data: 'lastName'}
        ],
        afterValidate : function () {
          fired = true;
        }
      });
      setDataAtCell(2, 0, 'test');
    });

    waitsFor(function () {
      return (fired != null)
    }, "afterValidate callback called", 100);

  });

  it('beforeValidate should can manipulate value', function () {
    var result = null;

    runs(function () {
      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'id', type: 'numeric'},
          {data: 'name'},
          {data: 'lastName'}
        ],
        beforeValidate : function (value) {
          value += 123;
          return value;
        },
        afterValidate : function (valid, value) {
          result = value;
        }
      });
      setDataAtCell(2, 0, 123);
    });

    waitsFor(function () {
      return (result != null)
    }, "beforeValidate callback called", 100);

    runs(function () {
      expect(result).toEqual(246);
    });

  });

  it('this in validator are pointing to cellProperties', function () {
    var result = null
      , fired = false;

    runs(function () {
      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'id', validator: function (value, cb) {
            result = this;
            cb(true);
          }},
          {data: 'name'},
          {data: 'lastName'}
        ],
        afterValidate : function () {
          fired = true;
        }
      });
      setDataAtCell(2, 0, 123);
    });

    waitsFor(function () {
      return fired
    }, "afterValidate callback called", 100);

    runs(function () {
      expect(result.instance).toEqual(getInstance());
    });

  });
});